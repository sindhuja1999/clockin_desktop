/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"edu/weill/Timeevents/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("edu.weill.Timeevents.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("overview");
			}

		});

	}
);