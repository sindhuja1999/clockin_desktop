/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox",
	'sap/m/MessagePopover',
	'sap/m/MessagePopoverItem',
	"sap/ui/model/json/JSONModel"
], function(UI5Object, MessageBox, MessagePopover, MessagePopoverItem, JSONModel) {
	"use strict";

	return UI5Object.extend("edu.weill.Timeevents.controller.ErrorHandler", {
		/**
		 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
		 * @class
		 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
		 * @public
		 * @alias zhcm.controller.ErrorHandler
		 */
		constructor: function(oComponent, oMessageProcessor, oMessageManager) {
			this._aErrors = [];
			this._showErrors = "immediately";

			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
			this._bMessageOpen = false;
			this._sErrorText = this._oResourceBundle.getText("errorText");
			this._sMultipleErrorText = this._oResourceBundle.getText("errorText");

			// this._oModel.attachMetadataFailed(function(oEvent) {
			// 	var oParams = oEvent.getParameters();
			// 	this._showMetadataError(oParams.response);
			// }, this);

			// this._oModel.attachRequestFailed(function(oEvent) {
			// 	var oParams = oEvent.getParameters();

			// 	// An entity that was not found in the service is also throwing a 404 error in oData.
			// 	// We already cover this case with a notFound target so we skip it here.
			// 	// A request that cannot be sent to the server is a technical error that we have to handle though
			// 	// parse Error message
			// 	var response = oParams.response;
			// 	var message, description, additionalText;
			// 	if (response) {
			// 		if (response.message) {
			// 			description = response.message;
			// 		}
			// 		if (response.responseText) {
			// 			var errorJSON;
			// 			try {
			// 				errorJSON = JSON.parse(response.responseText);
			// 			} catch (e) {
			// 				errorJSON = undefined;
			// 				message = response.responseText;
			// 			}
			// 			if (errorJSON && errorJSON.error && errorJSON.error.message && errorJSON.error.message.value) {
			// 				message = errorJSON.error.message.value;
			// 			}
			// 		}
			// 		if (response.statusText) {
			// 			additionalText = response.statusText;
			// 		}
			// 	}
			// 	oMessageManager.addMessages(
			// 		new sap.ui.core.message.Message({
			// 			message: message,
			// 			description: description,
			// 			additionalText: additionalText,
			// 			type: sap.ui.core.MessageType.Error,
			// 			processor: oMessageProcessor
			// 		})
			// 	);
			// 	if (oParams.response.statusCode !== "404" || (oParams.response.statusCode === 404 && oParams.response.responseText.indexOf(
			// 			"Cannot POST") === 0)) {
			// 		this._sErrorText = message;
			// 		this._showServiceError(message, false);
			// 	}

			// }, this);
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when the metadata call has failed.
		 * The user can try to refresh the metadata.
		 * @param {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showMetadataError: function(sDetails) {
			MessageBox.error(
				this._sErrorText, {
					id: "metadataErrorMessageBox",
					details: sDetails,
					styleClass: this._oComponent.getContentDensityClass(),
					actions: [MessageBox.Action.RETRY, MessageBox.Action.CLOSE],
					onClose: function(sAction) {
						if (sAction === MessageBox.Action.RETRY) {
							this._oModel.refreshMetadata();
						}
					}.bind(this)
				}
			);
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when a service call has failed.
		 * Only the first error message will be display.
		 *
		 * @param {string} sError a technical error to be displayed on request
		 *
		 * @param {boolean} bOneError whether one or multiple errors are displayed
		 * @private
		 */
		_showServiceError: function(sError, bOneError) {
			if (this._bMessageOpen) {
				return;
			}
			this._bMessageOpen = true;
			MessageBox.error(
				sError, {
					id: "serviceErrorMessageBox",
					styleClass: this._oComponent.getContentDensityClass(),
					actions: [MessageBox.Action.CLOSE],
					onClose: function() {
						this._bMessageOpen = false;
					}.bind(this)
				}
			);
		},
		/**
		 * Decides in what way to show request errors from now on.
		 *
		 * @param {string} sOption
		 *    one of: "immediately", "manual"
		 *
		 * - "immediately" a popup is shown as soon as one error occurs.
		 * - "manual" errors are collected and popup is only shown when
		 *   the 'displayErrorPopup' is called.
		 */
		setShowErrors: function(sOption) {
			this._showErrors = sOption;
		},
		/**
		 * Pushes an error to the error queue. The error can then be
		 * displayed by calling displayErrorPopup.
		 *
		 * @param {string} sMessage
		 *   The error message.
		 *
		 */
		pushError: function(sMessage, oMessageManager, oMessageProcessor, oFieldname, that) {
			this._aErrors.push(sMessage);
			// oMessageManager.removeAllMessages();
			oMessageManager.addMessages(new sap.ui.core.message.Message({
				message: sMessage,
				description: oFieldname,
				additionalText: oFieldname,
				type: sap.ui.core.MessageType.Error,
				processor: oMessageProcessor
			}));
		},
		/**
		 * Returns whether there are pending error messages.
		 *
		 * @returns {boolean}
		 *  Whether there are errors
		 *
		 */
		hasPendingErrors: function() {
			return this._aErrors.length > 0;
		},
		/**
		 * Displays error popups on demand, and clears the queue of errors.
		 *
		 * @returns {boolean}
		 *   true if errors were displayed, false otherwise.
		 */
		displayErrorPopup: function() {
			if (this._aErrors.length === 0) {
				return false;
			}

			// var bMulti = this._aErrors.length > 0;
			// var sErrors = this._aErrors.join("\n");

			// this._showServiceError(sErrors, bMulti);

			// this._aErrors = [];

			return true;
		}
	});
});