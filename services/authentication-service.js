const fs = require('fs');
// const db = require('../database/database')
const db = require('../database/secure-database');
const envVariables = require('../env-variables');
module.exports = class AutenticationService {
	constructor(keytar, moment, os, oAuthprovider, redirectUri, axios) {
		this._keytar = keytar;
		this._moment = moment;
		// this._keytarService = 'electron-openid-oauth';
		this._keytarService = 'timeevents';
		this._oAuthprovider = oAuthprovider;
		this._redirectUri = redirectUri;
		this._keytarAccount = os.userInfo().username;
		this._accessTokenAccount = this._keytarAccount + "accessToken";
		this._refreshTokenAccount = this._keytarAccount + "refreshToken";
		this._accessTokenExpiresAccount = this._keytarAccount + "accessTokenExpires";
		this._axios = axios;
	}

	getRedirectUri() {
		return this._redirectUri;
	}

	getAuthenticationURL() {
		return this._oAuthprovider.getAuthUrl(this._redirectUri);
	}

	getLogOutUrl() {
		return this._oAuthprovider.getLogOutUrl();
	}

	storeAccessToken(accessToken) {
		console.log("Storing token value: ");
		this._keytar.setPassword(this._keytarService, this._accessTokenAccount, accessToken);
	}


	storeRefreshToken(refreshToken) {
		console.log("Storing refresh token value: ");
		this._keytar.setPassword(this._keytarService, this._refreshTokenAccount, refreshToken);
	}

	storeAccessTokenExpiry(expiresIn) {
		let expiry = this._moment().add(expiresIn, 'seconds');
		console.log(" storing expiry: " + expiry.toISOString());
		this._keytar.setPassword(this._keytarService, this._accessTokenExpiresAccount, expiry.toISOString());
	}

	getAccessToken(callback) {
		this._keytar.getPassword(this._keytarService, this._accessTokenAccount).then(token => {
			if (token) {
				this._keytar.getPassword(this._keytarService, this._accessTokenExpiresAccount).then((expiry) => {
					if (this._moment().isBefore(expiry, 'second')) {
						callback(token);
						this.increaseAccessTokenValidity(expiry, token)
					} else {
						this.getRefreshToken(callback);
					}
				});
			} else {
				console.log("token is null");
				callback(null);
			}
		})
	}

	getRefreshToken(callback) {
		this._keytar.getPassword(this._keytarService, this._refreshTokenAccount).then(refreshToken => {
			this._oAuthprovider.refreshTokens(refreshToken, (accessToken, expiresIn) => {
				this.storeAccessToken(accessToken);
				this.storeAccessTokenExpiry(expiresIn);
				callback(accessToken);
			},
				(error) => {
					callback(null);
				});
		});
	}

	loadTokens(code) {
		return new Promise((resolve, reject) => {
			this._oAuthprovider.loadTokens(code, this._redirectUri, (accessToken, refreshToken, expiresIn) => {
				this.storeRefreshToken(refreshToken);
				this.storeAccessToken(accessToken);
				this.storeAccessTokenExpiry(expiresIn);
				// this.getConfigurationSetData(accessToken)
				// this.checkEmployeeIdTally(accessToken)
				resolve(accessToken);
			},
				(err) => {
					error = err;
					console.log("error");
					logout();
					reject(err);
				});
		});
	}

	logout() {
		console.log("Logout Called from Web APp");
	}


	//Custom Code for Preventing another user to login to the system

	getConfigurationSetData(accessToken) {
		return new Promise((resolve, reject) => {
			let hoptions = {
				headers: {
					'Authorization': 'Bearer ' + accessToken,
				}
			};
			const { oDataEndPoint } = envVariables.wcm;
			this._axios.get(oDataEndPoint + '/odata/sap/HCMFAB_MYTIMEEVENTS_SRV/ConfigurationSet', hoptions)
			// this._axios.get('https://gwaas-b7mbepvdgi.us3.hana.ondemand.com/odata/sap/HCMFAB_MYTIMEEVENTS_SRV/ConfigurationSet', hoptions)
				.then((configurationData) => {
					let configurationDataArray = configurationData.data.d.results;
					if (configurationDataArray.length) {
						console.log('Configuration Data Employee Id', configurationDataArray[0].EmployeeID)
						resolve(configurationDataArray[0].EmployeeID)
						// this.storeEmployeeId(configurationDataArray[0].EmployeeID)
						// this.storeEmployeeIdToLocalDb(configurationDataArray[0].EmployeeID)
						// this.checkEmployeeIdTally(accessToken)
					}
					else if (configurationDataArray.length === 0) {
						console.log('Configuration Data Array Records in else block', configurationDataArray)
						resolve()
					}
				})
				.catch((error) => {
					console.log('Error', error)
					reject(error)
					// document.write(error.response.data.error.message.value)
				})
		})

	}

	storeEmployeeId(employeeId) {
		console.log("Storing EmployeeId value: " + employeeId);
		this._keytar.setPassword(this._keytarService, this._keytarAccount + 'EmployeeId', employeeId);
	}

	storeEmployeeIdToLocalDb(employeeId) {
		let requestObj = {
			module: 'Tokens',
			name: 'employeeId',
			value: employeeId
		}
		db.findOne(requestObj, function (err, employeeData) {
			if (err) {
				console.log('Error in finding the request Object', err)
			} else if (employeeData) {
				console.log(employeeData, 'Do nothing')
			} else if (!employeeData) {
				db.insert(requestObj, function (err, newDoc) {
					if (err) {
						console.log('Error in inserting a record into local database', err);
					}
					else if (newDoc) {
						console.log(newDoc, 'Created')
					}
				});
			}
		})
	}

	checkEmployeeIdTally(token) {
		return new Promise((resolve, reject) => {
			let _this = this;
			this.getConfigurationSetData(token).then((employeeId) => {
				let requestObj = {
					module: 'Tokens',
					name: 'employeeId',
				}
				db.findOne(requestObj, function (err, employeeData) {
					if (err) {
						console.log('Error in finding the request Object', err)
					} else if (employeeData) {
						console.log(employeeData, 'Inside nothing')
						if (employeeData.value === employeeId) {
							console.log('Same User')
							resolve({
								isReturningUser: 1,
								isDifferentUser: 0,
								isUnauthorizedUser: 0
							})
						}
						else if (employeeData.value !== employeeId) {
							console.log('User Mismatch')
							_this.deleteTokensFromKeyChain();
							resolve({
								isReturningUser: 0,
								isDifferentUser: 1,
								isUnauthorizedUser: 0
							})
						}
					} else if (!employeeData) {
						requestObj.value = employeeId
						db.insert(requestObj, function (err, newDoc) {
							if (err) {
								console.log('Error in inserting a record into local database', err);
							}
							else if (newDoc) {
								console.log(newDoc, 'Created')
								resolve({
									isReturningUser: 1,
									isDifferentUser: 0,
									isUnauthorizedUser: 0
								})
							}
						});
					}
				})

			}).catch((error) => {
				console.log('Error in Checking the Employee Id Response', error.response)
				if (error.response && error.response.data.error.message.value) {
					_this.deleteTokensFromKeyChain();
					resolve({
						isReturningUser: 0,
						isDifferentUser: 1,
						isUnauthorizedUser: 1
						// errorCode : error.response.data.error.code,
						// errorMessage : error.response.data.error.message.value
					})
				}
			})
		})


	}

	deleteAccessToken() {
		this._keytar.deletePassword(this._keytarService, this._accessTokenAccount);
	}

	deleteAccessTokenExpiry() {
		this._keytar.deletePassword(this._keytarService, this._accessTokenExpiresAccount);
	}

	deleteRefreshToken() {
		this._keytar.deletePassword(this._keytarService, this._refreshTokenAccount);
	}

	deleteTokensFromKeyChain() {
		this.deleteAccessToken();
		this.deleteAccessTokenExpiry();
		this.deleteRefreshToken();

	}

	increaseAccessTokenValidity(expiry, token) {
		let a = new Date();
		console.log('Inside Increase Access Token Validity function', expiry, token)
		console.log('Difference calculated', new Date(), '<===>', expiry, new Date(expiry) - a, typeof expiry, typeof a)
		if ((new Date(expiry) - new Date()) < (9 * 1000 * 86400)) {
			console.log('Inside if condition in increase Access TOken Validity')
			this._keytar.getPassword(this._keytarService, this._refreshTokenAccount).then(refreshToken => {
				console.log("calling refreshToken api for refreshToken:" + refreshToken);
				this._oAuthprovider.refreshTokens(refreshToken, (accessToken, expiresIn) => {
					this.storeAccessToken(accessToken);
					this.storeAccessTokenExpiry(expiresIn);
					// callback(accessToken);
				},
					(error) => {
						// callback(null);
					});
			});
		}
		else {
			console.log('Inside else condition in increase Access TOken Validity')
		}

	}

}


