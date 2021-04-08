/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */


//Moment js Custom Code

/* global _:true */


jQuery.myTimeEventLib = {
	registerExternalLib: function (oShim) {
		if (sap.ui.loader && sap.ui.loader.config) {
			// official API since 1.56
			sap.ui.loader.config({
				shim: oShim
			});
		} else {
			// internal API before 1.56
			jQuery.sap.registerModuleShims(oShim);
		}
	}
};
// jQuery.myTimeEventLib.registerExternalLib({
// 	"edu/weill/Timeevents/libs/moment": {
// 		"amd": true,
// 		"export": "moment"
// 	}
// });

// jQuery.myTimeEventLib.registerExternalLib({
// 	"edu/weill/Timeevents/libs/require": {
// 		"amd": true,
// 		"export": "require"
// 	}
// });

// jQuery.myTimeEventLib.registerExternalLib({
// 	"edu/weill/Timeevents/libs/nedb": {
// 		"amd": true,
// 		"export": "nedb"
// 	}
// });

// jQuery.myTimeEventLib.registerExternalLib({
// 	"edu/weill/Timeevents/libs/nedb/index": {
// 		"amd": true,
// 		"export": "nedb"
// 	}
// });

// jQuery.myTimeEventLib.registerExternalLib({
// 	"edu/weill/Timeevents/libs/keytar/lib/keytar": {
// 		"amd": true,
// 		"export": "keytar"
// 	}
// });

// jQuery.myTimeEventLib.registerExternalLib({
// 	"edu/weill/Timeevents/libs/electron-log": {
// 		"amd": true,
// 		"export": "electron-log"
// 	}
// });

//Moment js  custom code ends

sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"edu/weill/Timeevents/model/models",
	"edu/weill/Timeevents/controller/ErrorHandler",
	"sap/ui/model/json/JSONModel",
	// "edu/weill/Timeevents/libs/moment",
	// "edu/weill/Timeevents/libs/require",
	// "edu/weill/Timeevents/libs/nedb/index",
	// "edu/weill/Timeevents/libs/keytar/lib/keytar",
	// "edu/weill/Timeevents/libs/electron-log/src/index",

], function (UIComponent, Device, models, ErrorHandler, Model) {
	"use strict";

	return UIComponent.extend("edu.weill.Timeevents.Component", {


		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this function, the FLP and device models are set and the router is initialized.
		 * @public
		 * @overriden
		 */
		init: function () {

			/* 		var oModel = new sap.ui.model.odata.v2.ODataModel({
					serviceUrl: "https://gwaas-b7mbepvdgi.us3.hana.ondemand.com/odata/sap/HCMFAB_MYTIMEEVENTS_SRV/",
					useBatch: false,
					disableHeadRequestForToken: true,
					headers: {
						Authorization: "Bearer " + localStorage.getItem('token'),
						Accept: "**"
					}
				});
				console.log("Below is the data from Model");
				console.log(oModel);
				oModel.setDefaultBindingMode("OneWay");
				this.setModel(oModel);  */

			//Custom Code Starts
			/* console.log('OModel Data', oModel, typeof oModel, oModel.oData)
 
			var f = [];
			// f.push(b);
 
			oModel.read(
				"/ConfigurationSet", {
				filters: f,
 
				success: function (oData, oResponse) {
					// console.log("After Success oResponse", oResponse);
					// console.log("After Success oData", oData);
					var data = oData.results[0];
					console.log(data);
					db.insert({ oDataSampleRequest: data }, function (err, docs) {
						console.log('Database Inside Component JS', docs)
					})
				}
			}
			)
  */
			//Custom Code Ends


			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			this.oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			this.oMessageManager = sap.ui.getCore().getMessageManager();

			this.oMessageManager.registerMessageProcessor(this.oMessageProcessor);
			// initialize the error handler with the component
			this._oErrorHandler = new ErrorHandler(this, this.oMessageProcessor, this.oMessageManager);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// set the FLP model
			this.setModel(models.createFLPModel(), "FLP");
			//moment custom code starts
			// var oAppdate = new Model();
			// oAppdate.setProperty("/date", "Today is:" + moment().format("dddd"));
			// this.setModel(oAppdate, "appdate");
			//Moment CUstom Code Ends
			// console.log(moment, 'Mooooment')
			// console.log(nedb, 'Nee Dee Bee')
			// console.log(keytar, 'KeyTar')
			// console.log(require, 'Require')
			// console.log(electronlog, 'electron -loggg')
			
			// console.log(require([keytar]), 'Keey Taar')
			// create the views based on the url/hash

			this.getRouter().initialize();


		},

		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ErrorHandler is destroyed.
		 * @public
		 * @override
		 */
		destroy: function () {
			this._oErrorHandler.destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass: function () {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		}

	});

});