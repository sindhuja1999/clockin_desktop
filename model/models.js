/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"sap/ui/model/json/JSONModel",
		"sap/ui/Device",
		"edu/weill/Timeevents/model/odata",
		"sap/ui/model/odata/v2/ODataModel"
	], function (JSONModel, Device,oData,oModel) {
		"use strict";

		return {

			createDeviceModel : function () {
				var oModel = new JSONModel(Device);
				oModel.setDefaultBindingMode("OneWay");
				
				return oModel;
			},

			createFLPModel : function () {
				var fnGetUser = jQuery.sap.getObject("sap.ushell.Container.getUser"),
					bIsShareInJamActive = fnGetUser ? fnGetUser().isJamActive() : false,
					oModel = new JSONModel({
						isShareInJamActive: bIsShareInJamActive
					});
				oModel.setDefaultBindingMode("OneWay");
				return oModel;
			},
		createServiceModel: function (sServiceUrl, mParameters, oComponent) {
			return new Promise(function (resolve, reject) {
				try {

					var oServiceModel = new oData(sServiceUrl, mParameters, oComponent);
					
					oComponent.setModel(oServiceModel);
					oServiceModel.setUseBatch(false);

					oServiceModel.metadataLoaded()
						.then(function () {
							resolve(oServiceModel);
						});
				} catch (err) {
					reject(err);
				}
			});
		},

	};

}
);