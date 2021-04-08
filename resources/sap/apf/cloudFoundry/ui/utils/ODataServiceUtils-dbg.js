sap.ui.define([
	"sap/ui/model/odata/v2/ODataModel"
], function(ODataModel) {
	'use strict';

	var DESTINATIONS_PREFIX = "/destination/";
	var CATALOG = "/sap/opu/odata/iwfnd/catalogservice;v=2/";
	var METADATA = "/$metadata";
	var ODATA_ENDPOINTS = "/odata/v2/";

	var DESTINATION_TYPE = {
		CATALOG: "CATALOG",
		SERVICE: "SERVICE",
		OTHER: "OTHER"
	};
	var SERVICE_STATUS = {
		PENDING: "PENDING",
		ANALYTICAL_SERVICE: "ANALYTICAL_SERVICE",
		NOT_ANALYTICAL_SERVICE: "NOT_ANALYTICAL_SERVICE",
		WRONG_ODATA_VERSION: "WRONG_ODATA_VERSION",
		NOT_ACCESSIBLE: "NOT_ACCESSIBLE"
	};

	/**
	 * Build the destination catalog URL relative to the approuter
	 * @param {string} sDestination The destination name
	 * @returns {string} The destination catalog URL relative to the approuter
	 */
	function getCatalogURL(sDestination) {
		return DESTINATIONS_PREFIX + sDestination + CATALOG;
	}

	/**
	 * Services can only be addressed through their URL
	 * This URL however will be prefixed with some hostname, that is not valid in the cloud - so we remove it
	 * @param {string} sServiceURL The URL as provided by the Catalog Service
	 * @returns {string} The URL without protocol and hostname
	 */
	function getRelativeServiceURL(sServiceURL) {
		var aMatches = (sServiceURL || "").match(new RegExp("https?:\\/\\/[^\\/]+\\/(.+)"));
		return aMatches ? ("/" + aMatches[1]) : "";
	}

	/**
	 * Make the URL relative to the base URL
	 * The base URL must be absolute; if the URL itself is relative, it is returned without changes
	 * The resulting URL always has a leading slash ("/") and might have a trailing slash depending on the input URL
	 * If the URL does not match the base URL, undefined is returned
	 * @param {String} sUrl URL, absolute or relative
	 * @param {String} sBaseUrl base URL to which the result is relative, must be absolute
	 * @returns {String} The relative URL (always starting with "/")
	 */
	function getRelativeURL(sUrl, sBaseUrl) {
		if (!sUrl || typeof (sUrl) !== "string" || !sBaseUrl || typeof (sBaseUrl) !== "string") {
			return undefined;
		} else if (!sBaseUrl.includes("://")) {
			return undefined;
		}

		var sResult;
		if (sUrl.startsWith(sBaseUrl)) {
			sResult = sUrl.slice(sBaseUrl.length); //URL was absolute
		} else if (sUrl.includes("://")) {
			return undefined; //URL was absolute, but didn't match the base URL
		} else {
			sResult = sUrl; //URL was already relative
		}

		if (sResult.startsWith("/")) {
			return sResult;
		}
		return "/" + sResult;
	}

	/**
	 * Build the service URL relative to the approuter
	 * @param {string} sDestination The destination name
	 * @param {string} sService The relative service url, must start with "/" (as provided by getRelativeServiceURL)
	 * @returns {string} The service URL relative to the approuter
	 */
	function getFullServiceURL(sDestination, sService) {
		return DESTINATIONS_PREFIX + sDestination + sService;
	}

	/**
	 * Send a request to all destinations to find out whether they reference a service directly or have an ODataCatalog exposed
	 * @param {object[]} aDestinations An Array of Destinations (as provided by the Destination Catalog Endpoint) to be pinged
	 * @returns {object} An object of {destinationName: destinationStatusPromise} where the Promise will resolve with a string from DESTINATION_TYPE
	 */
	function pingDestinations(aDestinations) {
		var promiseWorker = function(oDestination, resolve) {
			jQuery.ajax(DESTINATIONS_PREFIX + oDestination.name + METADATA).then(function() {
				resolve(DESTINATION_TYPE.SERVICE);
			}).fail(function() {
				if (oDestination.proxyType == "OnPremise") {
					jQuery.ajax(DESTINATIONS_PREFIX + oDestination.name + CATALOG).then(function() {
						resolve(DESTINATION_TYPE.CATALOG);
					}).fail(function() {
						resolve(DESTINATION_TYPE.OTHER);
					});
				} else {
					resolve(DESTINATION_TYPE.OTHER);
				}
			});
		};

		return aDestinations.map(function(oDestination){
			return new Promise(function(resolve) {
				promiseWorker(oDestination, resolve);
			});
		}).reduce(function(oAcc, oPromise, i) {
			oAcc[aDestinations[i].name] = oPromise;
			return oAcc;
		}, {});
	}

	/**
	 * Checks if a service is an analytical service
	 * @param {String} destination The destination name
	 * @param {String} service The relative service URL
	 * @returns {Promise} A promise resolving with a string from SERVICE_STATUS
	 */
	function isAnalyticalService(destination, service) {
		return new Promise(function(resolve, reject) {
			var sServiceUrl = getFullServiceURL(destination, service);

			var odata = new ODataModel(sServiceUrl);
			odata.attachMetadataFailed(function(oEvent) {
				var response = oEvent.getParameter("response");
				if (response && response.headers["odata-version"] && !response.headers["odata-version"].startsWith("2")) {
					reject(SERVICE_STATUS.WRONG_ODATA_VERSION);
				} else {
					reject(SERVICE_STATUS.NOT_ACCESSIBLE);
				}
			});

			var meta = odata.getMetaModel();
			meta.loaded().then(function() {
				var bIsAnalyticalService = meta.getODataEntityContainer().entitySet.some(function(entitySet) {
					return meta.getODataEntityType(entitySet.entityType).property.some(function(property) {
						return property["sap:aggregation-role"] === "measure";
					});
				});
				resolve(bIsAnalyticalService ? SERVICE_STATUS.ANALYTICAL_SERVICE : SERVICE_STATUS.NOT_ANALYTICAL_SERVICE);
			});
		});
	}

	/**
	 * Returns a promise for the OData Services of a destination
	 * The OData Service List is not read from the catalog, but from an HTML page (if provided)
	 * @param {string} sDestination The destination name
	 * @returns {Promise} A Promise for the OData Services
	 */
	function discoverServices(sDestination) {
		return new Promise(function(resolve, reject) {
			jQuery.ajax(DESTINATIONS_PREFIX + sDestination + ODATA_ENDPOINTS).done(function(response, statusText, data) {
				if (data.status === 200 && jQuery(response).filter("h1").text().trim() === "OData endpoints:") {
					var aEndpoints = jQuery(response).filter('a').map(function(i, d) {
						return {
							Url: getRelativeServiceURL(d.href)
						};
					}).toArray();
					resolve(aEndpoints);
				} else {
					reject();
				}
			}).fail(function() {
				reject();
			});
		});
	}

	return {
		DESTINATION_TYPE: DESTINATION_TYPE,
		SERVICE_STATUS: SERVICE_STATUS,
		getCatalogURL: getCatalogURL,
		getRelativeServiceURL: getRelativeServiceURL,
		getFullServiceURL: getFullServiceURL,
		getRelativeURL: getRelativeURL,
		pingDestinations: pingDestinations,
		isAnalyticalService: isAnalyticalService,
		discoverServices: discoverServices
	};

}, true);
