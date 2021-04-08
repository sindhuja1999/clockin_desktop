const envVariables = require('../env-variables');
const { oAuthBaseUrl } = envVariables.wcm;
module.exports = class WcmProvider {
  constructor(axios, qs, clientId, clientSecret) {
    this._qs = qs;
    this._axios = axios;
    this._clientId = clientId;
    this._clientSecret = clientSecret;
  }

  getAuthUrl(redirectUri) {
    return oAuthBaseUrl + '/oauth2/api/v1/authorize?' +
      // return 'https://oauthasservices-b7mbepvdgi.us3.hana.ondemand.com/oauth2/api/v1/authorize?' +
      'client_id=' + this._clientId + '&' +
      'response_type=code&' +
      'scope=&' +
      // 'client_secret=' + this._clientSecret + '&' +
      'redirect_uri=' + redirectUri;
  }

  getLogOutUrl() {
    return oAuthBaseUrl + "/oauth2/logout";
    // return "https://oauthasservices-b7mbepvdgi.us3.hana.ondemand.com/oauth2/logout";
  }

  refreshTokens(refreshToken, responseCallback, errorCallback) {
    // const refreshTokenUrl = `https://oauthasservices-b7mbepvdgi.us3.hana.ondemand.com/oauth2/api/v1/token`;
    const refreshTokenUrl = oAuthBaseUrl + `/oauth2/api/v1/token`;
    const headers = { 'content-type': 'application/x-www-form-urlencoded' };
    const data = {
      grant_type: 'refresh_token',
      client_id: this._clientId,
      refresh_token: refreshToken,
    }

    this._axios.post(refreshTokenUrl, this._qs.stringify(data), headers)
      .then((response) => {
        responseCallback(response.data.access_token, response.data.expires_in);
      })
      .catch((error) => {
        errorCallback(error);
      });
  }

  loadTokens(code, redirectUri, responseCallback, errorCallback) {
    console.log("getting loadTokens");

    const exchangeOptions = {
      grant_type: 'authorization_code',
      client_id: this._clientId,
      code: code,
      redirect_uri: redirectUri,
    };

    // const tokenUrl = `https://oauthasservices-b7mbepvdgi.us3.hana.ondemand.com/oauth2/api/v1/token`;
    const tokenUrl = oAuthBaseUrl + `/oauth2/api/v1/token`;
    const headers = {
      'content-type': 'application/x-www-form-urlencoded'
    };

    this._axios.post(tokenUrl, this._qs.stringify(exchangeOptions), headers)
      .then((response) => {
        const responseBody = response.data;
        console.log("responseBody: " + responseBody);
        console.log(responseBody);
        //Custom COde
        // this._axios.get('https://gwaas-b7mbepvdgi.us3.hana.ondemand.com:443/sap/opu/odata/sap/HCM_CICO_MANAGE_SRV').then(response => {
        //   console.log('Testing response', response)
        // })
        //
        responseCallback(responseBody.access_token,
          responseBody.refresh_token, responseBody.expires_in);
      })
      .catch((error) => {
        errorCallback(error);
      });
  }
}

