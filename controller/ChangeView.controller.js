/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"edu/weill/Timeevents/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	'sap/m/MessagePopover',
	'sap/m/MessagePopoverItem',
	"sap/ui/core/routing/History"
], function(BaseController, JSONModel, MessagePopover, MessagePopoverItem, History) {
	"use strict";
	/**
	 * Sets the error state of controls that use a data type.
	 *
	 * @param {object} oEvent
	 *   the event raised by UI5 when validation occurs.
	 */
	function controlErrorHandler(oEvent) {
		var oControl = oEvent.getParameter("element");
		var sErrorMessage = oEvent.getParameter("message");

		if (oControl && oControl.setValueStateText && sErrorMessage) {
			oControl.setValueStateText(sErrorMessage);
		}
		if (oControl && oControl.setValueState) {
			oControl.setValueState("Error");
		}
	}
	/**
	 * Sets the normal state of controls that passed a validation.
	 *
	 * @param {object} oEvent
	 *   the event raised by UI5 when validation occurs.
	 */
	function controlNoErrorHandler(oEvent) {
		var oControl = oEvent.getParameter("element");
		if (oControl && oControl.setValueState) {
			oControl.setValueState("None");
		}
	}
	return BaseController.extend("edu.weill.Timeevents.controller.ChangeView", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf edu.weill.Timeevents.view.ChangeView
		 */
		/* =========================================================== */
		/* controller hooks                                            */
		/* =========================================================== */
		extHookCreatePostObject: null,
		extHookOnUpdate: null,
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		/**
		 * Called when the ChangeView controller is instantiated.
		 * @public
		 */
		onInit: function() {
			debugger;
			this.oErrorHandler = this.getOwnerComponent()._oErrorHandler;
			this.oMessageManager = this.getOwnerComponent().oMessageManager;
			this.oMessageProcessor = this.getOwnerComponent().oMessageProcessor;
			this.oBundle = this.getResourceBundle();
			this.oDataModel = this.getOwnerComponent().getModel();
			this.busyDialog = new sap.m.BusyDialog();
			sap.ui.getCore().getMessageManager().registerObject(this.getView(), true);
			this.timeFormatter = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: this.byId('CICO_TIME').getDisplayFormat()
			});
			this._nCounterS2 = 0;
			var self = this;
			this.getRouter().attachRouteMatched(function(oEvent) {
				if (oEvent.getParameter("name") === "change") {
					self.initializeView();
				}
			});
		},
		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf edu.weill.Timeevents.view.ChangeView
		 */
		onExit: function() {
			sap.ui.getCore().getMessageManager().removeAllMessages();
		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/**
		 * Handled to display approver search help.
		 */
		onApproverHelpRequest: function() {
			var that = this;
			var oView = this.getView();
			var oDialog = oView.byId('approverDialog');
			var a = new sap.ui.model.Filter({
				path: "Name",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: "*"
			});
			var f = [];
			f.push(a);
			var mParameters = {
				filters: f,
				success: function(oData) {
					var oModel = new sap.ui.model.json.JSONModel(oData.results);
					oModel.setProperty("/DialogTitle", that.oBundle.getText("searchApprover"));
					oView.setModel(oModel, "approver");
					that.hideBusy();
				},
				error: function(oError) {
					that.processError(oError);
				}
			};
			this.showBusy();
			this.oDataModel
				.read('/ApproverSet', mParameters);

			// create dialog lazily
			if (!oDialog) {
				var oDialogController = {
					handleConfirm: function(evnt) {
						var selectedItem = evnt.getParameter("selectedItem");
						that.byId("approver").setValue(selectedItem.getTitle());
						that.approverIdSelected = selectedItem.getDescription();
					},
					handleSearch: this.searchAction.bind(this)
				};
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "edu.weill.Timeevents.view.fragments.ApproverDialog", oDialogController);
				// connect dialog to view (models, lifecycle)
				oView.addDependent(oDialog);
			}
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);

			oDialog.open();
		},
		/**
		 * Called to search an approver.
		 */
	
		searchAction: function(evt) {
			var self = this;
			this.searchString = evt.getParameter("value");

			if (evt.getParameter("value").length > 0 || !isNaN(evt.getParameter("value"))) {
				//show busy dialog
				// self.showBusy();
				if (this.searchString.length === 0) {
					this.searchString = "*";
				}
				if (this.searchString.length >= 80) {
					this.searchString = this.searchString.substring(0, 79);
				}
				// var successCall = 
				self.searchApprover(self.searchString);

			}

		},
		/**
		 * Called to search an approver.
		 */
		searchApprover: function(searchString) {
			var sPath = "/ApproverSet";
			var self = this,
				f = [];

			var searchPernr = "";
			if (!isNaN(searchString)) {
				searchPernr = searchString;
			}
			searchPernr = encodeURIComponent(searchPernr);
			searchString = encodeURIComponent(searchString);
			var a = new sap.ui.model.Filter({
				path: "Name",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: searchString
			});
			var b = new sap.ui.model.Filter({
				path: "EmployeeID",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: searchPernr
			});
			f.push(a);
			f.push(b);

			var mParameters = {
				filters: f,
				success: function(oData) {
					//attempt to release Busy Dialog
					self.hideBusy();
					//delete the unwanted results
					for (var i = 0; i < oData.results.length; i++) {
						if (oData.results[i].ApproverEmployeeID === "00000000") {
							delete oData.results[i];
						}
					}
					if (oData.results.length === 0 && self.searchString === "") {
						oData.results[0] = {
							Name: self.byId("approver").getValue(),
							EmployeeID: self.approverIdSelected
						};
					}
					var oModel = new sap.ui.model.json.JSONModel(oData.results);
					var itemTemplate = new sap.m.StandardListItem({
						title: "{Name}",
						description: "{EmployeeID}",
						active: "true",
						customData: [{
							key: "Pernr",
							value: "{EmployeeID}"
						}]
					});
					self.getView().setModel(oModel, "approver");
				},
				error: function(objResponse) {
					self.hideBusy();
					self.processError(objResponse);
				}
			};
			this.oDataModel
				.read(sPath, mParameters);
		},
		/**
		 * Handled when user clicks on cancel button.
		 */
		onCancel: function() {
			var exchgModel = this.getGlobalModel("exchangeModel");
			var data = {
				loadDate: exchgModel.getData().EventDate,
				reloadList: false
			};
			var s2exchgModel = new sap.ui.model.json.JSONModel(data);
			this.setGlobalModel(s2exchgModel, "changeExchgModel");
			this.getRouter().navTo("overview", {}, false);
		},
		/* =========================================================== */
		/* Member of Controller                                        */
		/* =========================================================== */
		/**
		 * Called when the Controller to load view with data.
		 */
		initializeView: function() {
			this._nCounterS2 = 0;
			var exchgModel = this.getGlobalModel("exchangeModel");
			if (exchgModel) {
				var data = exchgModel.getData();
				this.data = data;
				this.setDateInCalendar(data.EventDate);
				var date = this.formatDate(data.EventTime.ms);
				this.byId("CICO_TIME").setDateValue(date);
				if(data.Origin != "E"){
					this.byId("CICO_TIME").setEnabled(false);
				}else{
					this.byId("CICO_TIME").setEnabled(true);
				}
				this.byId("comments").setValue(data.Note);
				this.getConfiguration();
				this.getEvents();
				this.getTimeEventTypeSet();
				this.byId("idTimeEventType").setSelectedKey(data.TimeType);
				this.onSelectionChange(null, data.TimeType);
				if (data.ApproverPernr === "00000000") {
					this.byId("approver").setValue(this.configuration.ApproverName);
					this.approverIdSelected = this.configuration.ApproverPernr;
				} else {
					this.byId("approver").setValue(data.ApproverName);
					this.approverIdSelected = data.ApproverPernr;
				}
			} else {
				this.getRouter().navTo("overview", {}, true);
			}
		},
		/**
		 * Called to get date from Model.
		 */
		getDateFromCalendar: function() {
			var exchgModel = this.getGlobalModel("exchangeModel");
			var data = exchgModel.getData();
			return data.EventDate;
		},
		/**
		 * Called to set date in Model.
		 */
		setDateInCalendar: function(date) {
			var dateString = sap.ui.core.format.DateFormat.getDateInstance({
				style: "medium"
			}).format(date);
			this.byId("CICO_DATE_PICKER").setValue(dateString);
		},
		/**
		 * Called to get configuration details.
		 */
		getConfiguration: function() {
			var oModel = this.getGlobalModel("configurationModel");

			if (JSON.stringify(oModel.getData()).length === 2) {
				this.configuration = this.oApplication.configuration;
			} else {
				this.configuration = oModel.getData();
			}
			this.getView().setModel(oModel, "configurationModel");
			if (this.configuration.ApproverReadOnly) {
				this.byId("approver").setEnabled(false);
				this.byId("approver").setVisible(false);
				this.byId("approverLableId").setVisible(false);
			} else {
				this.byId("approver").setEnabled(true);
				this.byId("approver").setVisible(true);
				this.byId("approverLableId").setVisible(true);
			}
			if (this.configuration.NoticeVisible === 'X') {
				this.byId("comments").setEnabled(true);
				this.byId("comments").setVisible(true);
				this.byId("commentsLableId").setVisible(true);
			} else {
				this.byId("comments").setEnabled(false);
				this.byId("comments").setVisible(false);
				this.byId("commentsLableId").setVisible(false);
			}
		},
		/**
		 * Called to get time event type set.
		 */
		getTimeEventTypeSet: function() {
			var oModel = this.getGlobalModel("eventTypeModel");
			this.byId("idTimeEventType").setModel(oModel, "timeEventType");
			self.timeEventTypes = oModel.getData();
		},
		/**
		 * Called to get time events.
		 */
		getEvents: function() {
			var oModel = this.getGlobalModel("eventTypesModel");
			self.timeEvents = oModel.getData();
		},
		/**
		 * Called to get event types.
		 */
		getEventTypes: function() {
			var etModel = this.getGlobalModel("eventTypesModel");
			this.byId("idTimeEventType").setModel(etModel, "eventTypesModel");
		},

		/**
		 * Called to save or update time event data.
		 */
		onSave: function() {
			/**
			 * @ControllerHook Change the implementation on click of the Update button
			 * This hook method can be used to change the implementation on click of the Update button
			 * It is called on click of the Update button
			 * @callback edu.weill.Timeevents.controller.Overview~extHookOnUpdate
			 */
			if (this.extHookOnUpdate) {
				this.extHookOnUpdate();
			} else {
				var that = this;
				var oFieldname;
				this.byId("idTimeEventType").setValueState("None");
				this.byId("CICO_DATE_PICKER").setValueState("None");
				this.byId("CICO_TIME").setValueState("None");

				for (var i = 0; i < this.byId("ADDFIELDS").getFormElements().length; i++) {
					this.byId("ADDFIELDS").getFormElements()[i].getFields()[0].setValueState("None");
					if (this.byId("ADDFIELDS").getFormElements()[i].getFields()[0].getVisible()) {
						if (this.byId("ADDFIELDS").getFormElements()[i].getFields()[0].getRequired() && this.byId("ADDFIELDS").getFormElements()[i].getFields()[
								0].getValue() === "") {
							this.byId("ADDFIELDS").getFormElements()[i].getFields()[0].setValueState("Error");
							oFieldname = this.byId("ADDFIELDS").getFormElements()[i].getFields()[0].getCustomData()[2].getValue();
							this.oErrorHandler.pushError(this.oBundle.getText("invalidEntry"), this.oMessageManager, this.oMessageProcessor, oFieldname);
							this.byId("messageInd").firePress();
							return;
						}
					} else if (this.byId("ADDFIELDS").getFormElements()[i].getFields()[1].getVisible()) {
						if (this.byId("ADDFIELDS").getFormElements()[i].getFields()[1].getRequired() && this.byId()[2].getFormElements()[i].getFields()[
								1].getValue() === "") {
							this.byId("ADDFIELDS").getFormElements()[i].getFields()[1].setValueState("Error");
							oFieldname = this.byId("ADDFIELDS").getFormElements()[1].getFields()[1].getCustomData("FieldLabel").getValue();
							this.oErrorHandler.pushError(this.oBundle.getText("invalidEntry"), this.oMessageManager, this.oMessageProcessor, oFieldname);
							this.byId("messageInd").firePress();
							return;
						}

					} else if (this.byId("ADDFIELDS").getFormElements()[
							i].getFields()[2].getVisible()) {
						if (this.byId("ADDFIELDS").getFormElements()[i].getFields()[2].getRequired() && this.byId("ADDFIELDS").getFormElements()[i].getFields()[
								2].getValue() === "") {
							this.byId("ADDFIELDS").getFormElements()[i].getFields()[2].setValueState("Error");
							oFieldname = this.byId("ADDFIELDS").getFormElements()[i].getFields()[2].getCustomData()[2].getValue();
							this.oErrorHandler.pushError(this.oBundle.getText("invalidEntry"), this.oMessageManager, this.oMessageProcessor, oFieldname);
							this.byId("messageInd").firePress();
							return;
						}

					} else if (this.byId("ADDFIELDS").getFormElements()[i].getFields()[3].getVisible()) {
						if (this.byId("ADDFIELDS").getFormElements()[i].getFields()[3].getRequired() && this.byId("ADDFIELDS").getFormElements()[i].getFields()[
								3].getDateValue() === "") {
							this.byId("ADDFIELDS").getFormElements()[i].getFields()[3].setValueState("Error");
							oFieldname = this.byId('ADDFIELDS').getFormElements()[i].getFields()[3].getCustomData()[1].getValue();
							this.oErrorHandler.pushError(this.oBundle.getText("invalidEntry"), this.oMessageManager, this.oMessageProcessor, oFieldname);
							this.byId('messageInd').firePress();
							return;
						}
					} else if (this.byId('ADDFIELDS').getFormElements()[i].getFields()[4].getVisible()) {
						if (this.byId('ADDFIELDS').getFormElements()[i].getFields()[4].getRequired() && this.byId('ADDFIELDS').getFormElements()[i].getFields()[
								4].getDateValue() === "") {
							this.byId('ADDFIELDS').getFormElements()[i].getFields()[4].setValueState("Error");
							oFieldname = this.byId('ADDFIELDS').getFormElements()[i].getFields()[4].getCustomData()[1].getValue();
							this.oErrorHandler.pushError(this.oBundle.getText("invalidEntry"), this.oMessageManager, this.oMessageProcessor, oFieldname);
							this.byId('messageInd').firePress();
							return;
						}
					}
				}
				if (this.byId("idTimeEventType").getSelectedKey() === "" || this.byId("CICO_DATE_PICKER").getValue() === "" || this.byId(
						"CICO_TIME").getValue() ===
					"") {
					this.oMessageManager.removeAllMessages();

					if (this.byId("idTimeEventType").getSelectedKey() === "") {
						this.byId("idTimeEventType").setValueState("Error");
						var oFieldname = this.byId('idTimeEventType').getParent().getLabel();
						this.oErrorHandler.pushError(that.oBundle.getText("invalidEntry"), this.oMessageManager, this.oMessageProcessor, oFieldname);
						this.byId('messageInd').firePress();
					}
					if (this.byId("CICO_DATE_PICKER").getValue() === "") {
						this.byId("CICO_DATE_PICKER").setValueState("Error");
						var oFieldname = this.byId('CICO_DATE_PICKER').getParent().getLabel();
						this.oErrorHandler.pushError(that.oBundle.getText("invalidEntry"), this.oMessageManager, this.oMessageProcessor, oFieldname);
						this.byId('messageInd').firePress();
					}
					if (this.byId("CICO_TIME").getValue() === "") {
						this.byId("CICO_TIME").setValueState("Error");
						var oFieldname = this.byId('CICO_TIME').getParent().getLabel();
						this.oErrorHandler.pushError(that.oBundle.getText("invalidEntry"), this.oMessageManager, this.oMessageProcessor, oFieldname);
					}
				} else {
					this.byId("idTimeEventType").setValueState("None");
					this.byId("CICO_DATE_PICKER").setValueState("None");
					this.byId("CICO_TIME").setValueState("None");
					this.oMessageManager.removeAllMessages();
					var dateformatter = sap.ui.core.format.DateFormat.getDateInstance({
						pattern: "medium"
					});
					var timeformatter = sap.ui.core.format.DateFormat.getTimeInstance({
						pattern: this.byId("CICO_TIME").getDisplayFormat()
					});
					var addInfo = [{
						label: this.oBundle.getText("eventType"),
						text: this.byId("idTimeEventType").getSelectedItem().getText()

					}, {
						label: this.oBundle.getText("date"),
						text: this.byId("CICO_DATE_PICKER").getValue()
					}, {
						label: this.oBundle.getText("time"),
						text: timeformatter.format(this.byId("CICO_TIME").getDateValue())
					}];
					var date = new Date();
					if (this.checkDate(date, this.getDateFromCalendar())) {
						addInfo.splice(0, 1);
					}
					//set up the settings tab
					var oSettings = {
						// 		question: this.oBundle.getText("UPDATE_CONFIRMATION_QUESTION"),
						showNote: false,
						title: this.oBundle.getText("updateConfirmation"),
						confirmButtonLabel: this.oBundle.getText("OK"),
						additionalInformation: addInfo
					};
					//open confirmation popup
					this.openConfirmationPopup(oSettings, "U");

				}
			}
		},
		/**
		 * Called to get confirmation popup in all scenarios.
		 */
		openConfirmationPopup: function(oSettings, isType) {
			var self = this;
			//preparing the dialog
			var oElements = [];
			for (var i = 0; i < oSettings.additionalInformation.length; i++) {
				oElements.push(new sap.m.Label({
					text: oSettings.additionalInformation[i].label,
					design: "Bold"
				}));
				oElements.push(new sap.m.Text({
					text: oSettings.additionalInformation[i].text
				}));
			}
			var oForm = new sap.ui.layout.form.SimpleForm({
				minWidth: 1024,
				editable: false,
				maxContainerCols: 2,
				layout: "ResponsiveGridLayout",
				labelSpanL: 5,
				labelSpanM: 5,
				labelSpanS: 5,
				emptySpanL: 2,
				emptySpanM: 2,
				emptySpanS: 2,
				columnsL: 1,
				columnsM: 1,
				columnsS: 1,
				content: oElements
			});
			var oConfirmDialog = new sap.m.Dialog({
				title: oSettings.title,
				class: "sapUiContentPadding sapUiMediumMarginTopBottom",
				content: [oForm],
				beginButton: new sap.m.Button({
					text: oSettings.confirmButtonLabel,
					press: function() {
						if (isType === "U") {
							self._updateEntry();
							oConfirmDialog.close();
						} else if (isType === "D") {
							self._deleteEntry();
							oConfirmDialog.close();
						}
					}
				}),
				endButton: new sap.m.Button({
					text: this.oBundle.getText("cancel"),
					press: function() {
						oConfirmDialog.close();
					}
				})
			});
			oConfirmDialog.addStyleClass("sapUiContentPadding sapUiMediumMarginTopBottom");
			oConfirmDialog.open();
		},
		/**
		 * Called to check date consistency.
		 */
		checkDate: function(date, curDate) {
			if (curDate.getFullYear() === date.getFullYear() && curDate.getMonth() === date.getMonth() && curDate.getDate() === date.getDate()) {
				return true;
			}
			return false;
		},
		/**
		 * Called to update time event data.
		 */
		_updateEntry: function() {
			var self = this;
			this.showBusy();
			var exchgModel = this.getGlobalModel("exchangeModel");
			var postObj = this.createPostObject("U", exchgModel.getData());
			var path = "/TimeEventSet(ReqId='" + postObj.ReqId + "',EmployeeID='" + postObj.EmployeeID + "')";
			this.oDataModel
				.update(path, postObj, {
					success: function(oData, oResponse) {
						self.hideBusy();
						var toastMsg = self.oBundle.getText("timeEventUpdated");
						sap.m.MessageToast.show(toastMsg, {
							duration: 1000
						});
						var data = {
							loadDate: exchgModel.getData().EventDate,
							reloadList: true
						};
						var changeExchgModel = new sap.ui.model.json.JSONModel(data);
						self.setGlobalModel(changeExchgModel, "changeExchgModel");
						self.getRouter().navTo("overview", {}, true);
					},
					error: function(oError) {
						self.hideBusy();
						self.processError(oError);
					}
				});
		},
		/**
		 * Called to get data from UI.
		 */
		createPostObject: function(type, eventData) {
			var time = this.formatTimeString(this.byId("CICO_TIME").getDateValue());
			var timezoneOffset = this.getDateFromCalendar().getTimezoneOffset() / (-60);
			timezoneOffset = timezoneOffset.toFixed(2);
			if (type === "D") {
				var postObj = {
					EmployeeID: this.data.EmployeeID,
					ReqId: this.data.ReqId,
					EventTime: this.data.EventTime
				};
				return postObj;
			}
			var postObj = {
				ReqId: eventData.ReqId,
				EmployeeID: this.getPernr(),
				EventDate: this.formatDateTimeString(this.getSelectedDate()),
				EventTime: time,
				TimeType: this.byId("idTimeEventType").getSelectedKey(),
				TimezoneOffset: timezoneOffset.toString()
			};
			//Additional Fields
			for (var i = 0; i < this.byId('ADDFIELDS').getFormElements().length; i++) {
				if (this.byId('ADDFIELDS').getFormElements()[i].getFields()[0].getVisible()) {
					postObj[this.byId('ADDFIELDS').getFormElements()[i].getFields()[0].getCustomData()[0].getValue()] = this.byId('ADDFIELDS').getFormElements()[
						i].getFields()[0].getValue();

				} else if (this.byId('ADDFIELDS').getFormElements()[i].getFields()[1].getVisible()) {
					postObj[this.byId('ADDFIELDS').getFormElements()[i].getFields()[1].getCustomData()[0].getValue()] = this.byId('ADDFIELDS').getFormElements()[
						i].getFields()[1].getValue();
				} else if (this.byId('ADDFIELDS').getFormElements()[i].getFields()[2].getVisible()) {
					postObj[this.byId('ADDFIELDS').getFormElements()[i].getFields()[2].getCustomData()[0].getValue()] = this.byId('ADDFIELDS').getFormElements()[
						i].getFields()[2].getValue();
				} else if (this.byId('ADDFIELDS').getFormElements()[i].getFields()[3].getVisible()) {
					if (this.byId('ADDFIELDS').getFormElements()[i].getFields()[3].getDateValue()) {
						postObj[this.byId('ADDFIELDS').getFormElements()[i].getFields()[3].getCustomData()[0].getValue()] = this.formatDateTimeString(
							this.byId('ADDFIELDS').getFormElements()[
								i].getFields()[3].getDateValue());
					}
				} else if (this.byId('ADDFIELDS').getFormElements()[i].getFields()[4].getVisible()) {
					if (this.byId('ADDFIELDS').getFormElements()[i].getFields()[4].getDateValue()) {
						postObj[this.byId('ADDFIELDS').getFormElements()[i].getFields()[4].getCustomData()[0].getValue()] = this.formatTimeString(this
							.byId('ADDFIELDS').getFormElements()[
								i].getFields()[4].getDateValue());
					}
				}

			}

			if (this.approverIdSelected && this.configuration.ApproverVisible) {
				postObj.ApproverPernr = this.approverIdSelected;
			} else {
				postObj.ApproverPernr = this.configuration.ApproverPernr;
			}
			if (this.byId("comments").getValue() !== "") {
				postObj.Note = this.byId("comments").getValue();
			}
			if (type == "D") {
				postObj.ReqId = this.data.ReqId;
				postObj.EventTime = this.data.EventTime;
			}
			/**
			 * @ControllerHook Modify the post Object
			 * This hook method can be used to modify the object sent for updation
			 * It is called when the decision options for the detail item are fetched successfully
			 * @callback edu.weill.Timeevents.controller.Overview~extHookCreatePostObject
			 * @param {object} Post Object
			 * @return {object} Post Object
			 */
			if (this.extHookCreatePostObject) {
				postObj = this.extHookCreatePostObject(postObj);
			}
			return postObj;
		},
		/**
		 * Called to get server time.
		 */
		getServerTime: function(d) {
			var curDate = new Date(d);
			var clientOffset = Math.abs(curDate.getTimezoneOffset()) * 60 * 1000;
			var serverOffset = this.configuration.TimezoneOffset.ms;
			var offsetAmount = Math.abs(serverOffset - clientOffset);
			offsetAmount = offsetAmount / (1000 * 60);
			var diff = curDate.getMinutes() - offsetAmount;
			curDate.setMinutes(diff);
			return curDate;
		},

		/**
		 * Called to when user clicks on back button.
		 */
		onNavButton: function() {
			var exchgModel = this.oApplication.getModel("exchangeModel");
			var data = {
				loadDate: exchgModel.getData().EventDate,
				reloadList: false
			};
			var s2exchgModel = new sap.ui.model.json.JSONModel(data);
			this.oApplication.setModel(s2exchgModel, "s2ExchgModel");
			this.getRouter().navTo("overview", {}, true);
		},

		/**
		 * Called to show busy indicator when application is loading data
		 */
		showBusy: function() {
			this._nCounterS2++;
			if (this._nCounterS2 === 1) {
				//this._busyDialog.open();
				this.busyDialog.open();

			}
		},
		/**
		 * Called to hide busy indicator
		 */
		hideBusy: function(forceHide) {
			if (this._nCounterS2 === 0) {
				return;
			}
			this._nCounterS2 = forceHide ? 0 : Math.max(0,
				this._nCounterS2 - 1);
			if (this._nCounterS2 > 0) {
				return;
			}
			this.busyDialog.close();
		},
		/**
		 * Handled when user clicks on 'Cancel button'
		 */
		handleCancelPress: function() {
			this.getRouter().navTo("overview");
		},
		/**
		 * Called for error handling
		 */
		processError: function(oError) {
			this.oErrorHandler.setShowErrors("immediately");
		},
		/**
		 * Handled when user change time event type in screen to load additional fields
		 */
		onSelectionChange: function(evt, event) {
			var that = this;
			// var selectdItem = evt.getParameter("selectedItem");
			var timeTypeCode;
			if (event) {
				timeTypeCode = event;
			} else {
				var selectdItem = evt.getParameter("selectedItem");
				if (selectdItem) {
					timeTypeCode = selectdItem.getProperty("key");
				}
			}
			var p = new sap.ui.model.Filter({
				path: "TimeType",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: timeTypeCode
			});
			var f = [];
			f.push(p);
			var oAddFieldsModel = new sap.ui.model.json.JSONModel();
			var oFormContainer = that.byId("ADDFIELDS");
			oFormContainer.destroyFormElements();
			var mParameters = {
				filters: f, // your Filter Array
				success: function(oData, oResponse) {
					var AdditionalFields = oData;
					if (AdditionalFields) {
						for (var i = 0; i < AdditionalFields.results.length; i++) {
							switch (AdditionalFields.results[i].TypeKind) {
								case 'D':
									AdditionalFields.results[i].TypeKind = "Date";
									AdditionalFields.results[i].DateVisible = true;
									AdditionalFields.results[i].InputIntegerVisible = false;
									AdditionalFields.results[i].InputDecimalVisible = false;
									AdditionalFields.results[i].InputTextVisible = false;
									AdditionalFields.results[i].TimeVisible = false;
									var dateString = sap.ui.core.format.DateFormat.getDateInstance({
										style: "medium"
									}).format(that.data[AdditionalFields.results[i].Name]);
									AdditionalFields.results[i].datevalue = dateString;
									break;
								case 'N':
									AdditionalFields.results[i].TypeKind = "Number";
									AdditionalFields.results[i].InputIntegerVisible = true;
									AdditionalFields.results[i].InputTextVisible = false;
									AdditionalFields.results[i].InputDecimalVisible = false;
									AdditionalFields.results[i].DateVisible = false;
									AdditionalFields.results[i].TimeVisible = false;
									AdditionalFields.results[i].value = that.data[AdditionalFields.results[i].Name];
									break;
								case 'P':
									AdditionalFields.results[i].TypeKind = "Number";
									AdditionalFields.results[i].InputIntegerVisible = false;
									AdditionalFields.results[i].InputTextVisible = false;
									AdditionalFields.results[i].InputDecimalVisible = true;
									AdditionalFields.results[i].DateVisible = false;
									AdditionalFields.results[i].TimeVisible = false;
									AdditionalFields.results[i].value = parseFloat(that.data[AdditionalFields.results[i].Name]);
									break;
								case 'C':
									AdditionalFields.results[i].TypeKind = "Text";
									AdditionalFields.results[i].InputTextVisible = true;
									AdditionalFields.results[i].InputIntegerVisible = false;
									AdditionalFields.results[i].InputDecimalVisible = false;
									AdditionalFields.results[i].DateVisible = false;
									AdditionalFields.results[i].TimeVisible = false;
									AdditionalFields.results[i].value = that.data[AdditionalFields.results[i].Name];
									break;
								case 'T':
									AdditionalFields.results[i].TypeKind = "Time";
									AdditionalFields.results[i].TimeVisible = true;
									AdditionalFields.results[i].DateVisible = false;
									AdditionalFields.results[i].InputDecimalVisible = false;
									AdditionalFields.results[i].InputTextVisible = false;
									AdditionalFields.results[i].InputIntegerVisible = false;
									AdditionalFields.results[i].timevalue = that.formatTime(that.data[AdditionalFields.results[i].Name].ms);
									break;
								default:
									AdditionalFields.results[i].TypeKind = "Text";
									AdditionalFields.results[i].InputTextVisible = true;
									AdditionalFields.results[i].InputIntegerVisible = false;
									AdditionalFields.results[i].InputDecimalVisible = false;
									AdditionalFields.results[i].DateVisible = false;
									AdditionalFields.results[i].TimeVisible = false;
									AdditionalFields.results[i].value = that.data[AdditionalFields.results[i].Name];
							}
							if (AdditionalFields.results[i].HasF4 === "X") {
								AdditionalFields.results[i].HasF4 = true;
							} else {
								AdditionalFields.results[i].HasF4 = false;
							}
							//AdditionalFields.results[i].value = that.data[AdditionalFields.results[i].Fieldname];
							oAddFieldsModel.setData(AdditionalFields.results);
							that.setModel(oAddFieldsModel, "AdditionalFields");

							var oFormElement = new sap.ui.layout.form.FormElement({
								label: new sap.m.Label({
									text: "{FieldLabel}"
								}),
								fields: [
									new sap.m.Input({
										value: "{path:'value', type: 'sap.ui.model.type.Integer'}",
										type: "{TypeKind}",
										enabled: "{= ${Readonly} ? false : true}",
										showValueHelp: "{HasF4}",
										valueHelpRequest: that.onValueHelp.bind(that),
										visible: "{InputIntegerVisible}",
										required: "{path:'Required',formatter:'edu.weill.Timeevents.utils.formatter.isRequired'}",
										layoutData: new sap.ui.layout.GridData({
											span: "L5 M5 S12"
										}),
										customData: [new sap.ui.core.CustomData({
												"key": "FieldName",
												"value": "{Name}"
											}), new sap.ui.core.CustomData({
												"key": "ValueHelp",
												"value": "{F4EntityName}"
											}),
											new sap.ui.core.CustomData({
												"key": "FieldLabel",
												"value": "{FieldLabel}"
											})
										]
									}),
									new sap.m.Input({
										value: "{path:'value', type: 'sap.ui.model.type.Decimal'}",
										type: "{TypeKind}",
										enabled: "{= ${Readonly} ? false : true}",
										showValueHelp: "{HasF4}",
										valueHelpRequest: that.onValueHelp.bind(that),
										visible: "{InputDecimalVisible}",
										required: "{path:'Required',formatter:'edu.weill.Timeevents.utils.formatter.isRequired'}",
										layoutData: new sap.ui.layout.GridData({
											span: "L5 M5 S12"
										}),
										customData: [new sap.ui.core.CustomData({
												"key": "FieldName",
												"value": "{Name}"
											}), new sap.ui.core.CustomData({
												"key": "ValueHelp",
												"value": "{F4EntityName}"
											}),
											new sap.ui.core.CustomData({
												"key": "FieldLabel",
												"value": "{FieldLabel}"
											})
										]
									}),
									new sap.m.Input({
										value: "{path:'value'}",
										type: "{TypeKind}",
										enabled: "{= ${Readonly} ? false : true}",
										showValueHelp: "{HasF4}",
										valueHelpRequest: that.onValueHelp.bind(that),
										visible: "{InputTextVisible}",
										required: "{path:'Required',formatter:'edu.weill.Timeevents.utils.formatter.isRequired'}",
										layoutData: new sap.ui.layout.GridData({
											span: "L5 M5 S12"
										}),
										customData: [new sap.ui.core.CustomData({
												"key": "FieldName",
												"value": "{Name}"
											}), new sap.ui.core.CustomData({
												"key": "ValueHelp",
												"value": "{F4EntityName}"
											}),
											new sap.ui.core.CustomData({
												"key": "FieldLabel",
												"value": "{FieldLabel}"
											})
										]
									}),
									new sap.m.DatePicker({
										value: "{ path: 'datevalue', type: 'sap.ui.model.odata.type.Date'}",
										visible: "{DateVisible}",
										enabled: "{= ${Readonly} ? false : true}",
										layoutData: new sap.ui.layout.GridData({
											span: "L5 M5 S12"
										}),
										customData: new sap.ui.core.CustomData({
												"key": "FieldName",
												"value": "{Name}"
											},
											new sap.ui.core.CustomData({
												"key": "FieldLabel",
												"value": "{FieldLabel}"
											}))
									}),
									new sap.m.TimePicker({
										value: "{ path: 'timevalue', type: 'sap.ui.model.odata.type.Date' }",
										enabled: "{= ${Readonly} ? false : true}",
										visible: "{TimeVisible}",
										layoutData: new sap.ui.layout.GridData({
											span: "L5 M5 S12"
										}),
										customData: new sap.ui.core.CustomData({
												"key": "FieldName",
												"value": "{Name}"
											},
											new sap.ui.core.CustomData({
												"key": "FieldLabel",
												"value": "{FieldLabel}"
											}))
									})
								]
							});
						}
					}
					oFormContainer.setModel(oAddFieldsModel);
					if (oFormElement) {
						oFormContainer.bindAggregation("formElements", "/", oFormElement);
					}
				},
				error: function(oError) {
					that.processError(oError);
				}
			};
			this.oDataModel.read("/AdditionalFieldSet", mParameters);
		},

		/**
		 * Handled when user clicks on Message Pop over
		 */
		handleMessagePopover: function(oEvent) {
			var oMessageTemplate = new MessagePopoverItem({
				type: '{message>severity}',
				description: "{message>description}",
				title: '{message>message}',
				subtitle: "{message>additionalText}"
			});
			var oMessagePopover = new MessagePopover({
				items: {
					path: "message>/",
					template: oMessageTemplate
				}
			});
			oMessagePopover.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "message");
			oMessagePopover.toggle(oEvent.getSource());

		},
		/**
		 * Called to delete time event
		 */
		_deleteEntry: function(selectedItem) {
			var that = this;
			this.showBusy();
			var exchgModel = this.getGlobalModel("exchangeModel");
			var postObj = this.createPostObject("D");
			var path = "/TimeEventSet(ReqId='" + postObj.ReqId + "',EmployeeID='" + postObj.EmployeeID + "')";
			var mParameters = {
				success: function() {
					that.hideBusy();
					var toastMsg = that.oBundle.getText("timeEventDeleted");
					sap.m.MessageToast.show(toastMsg, {
						duration: 1000
					});
					var data = {
						loadDate: exchgModel.getData().EventDate,
						reloadList: true
					};
					var changeExchgModel = new sap.ui.model.json.JSONModel(data);
					that.setGlobalModel(changeExchgModel, "changeExchgModel");
					that.getRouter().navTo("overview", {}, true);
				},
				error: function(oError) {
					that.hideBusy();
					that.processError(oError);
				}
			};

			this.oDataModel
				.remove(path, mParameters);
		},
		/**
		 * Handled when user clicks on Delete button
		 */
		onDelete: function() {
			var dateformatter = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "medium"
			});
			var timeformatter = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: this.byId("CICO_TIME").getDisplayFormat()
			});
			var addInfo = [{
				label: this.oBundle.getText("eventType"),
				text: this.byId("idTimeEventType").getSelectedItem().getText()

			}, {
				label: this.oBundle.getText("date"),
				text: this.byId("CICO_DATE_PICKER").getValue()
			}, {
				label: this.oBundle.getText("time"),
				text: timeformatter.format(this.byId("CICO_TIME").getDateValue())
			}];
			var date = new Date();
			if (this.checkDate(date, this.getDateFromCalendar())) {
				addInfo.splice(0, 1);
			}
			//set up the settings tab
			var oSettings = {
				// 		question: this.oBundle.getText("deleteConfirmation"),
				showNote: false,
				title: this.oBundle.getText("deleteConfirmation"),
				confirmButtonLabel: this.oBundle.getText("OK"),
				additionalInformation: addInfo
			};
			//open confirmation popup
			this.openConfirmationPopup(oSettings, "D");
		},
		/**
		 * Handled when user clicks on back button to navigate to previous screen
		 */
		onNavBack: function() {
			var sPreviousHash = History.getInstance().getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			this._deleteUnsavedRecord();

			if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				history.go(-1);
			} else {
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#Shell-home"
					}
				});
			}
		},
		/**
		 * Handled when user clicks search help button
		 */
		onValueHelp: function(oEvent) {
			var that = this;
			var oView = this.getView();
			var oDialog = oView.byId('valueHelpDialog');
			that.valueHelpControlId = oEvent.getSource().getId();
			var fieldName = oEvent.getSource().getCustomData()[0].getValue();
			var valueHelpSet = "/" + oEvent.getSource().getCustomData()[1].getValue();
			var addfieldsModeldata = this.getModel("AdditionalFields").getData();
			var mParameters = {
				success: function(oData) {
					var data = oData.results;
					var results = [];
					var items = {};
					var F4Title = addfieldsModeldata[that.valueHelpControlId.split("ADDFIELDS-")[1]].F4Title;
					var F4Description = addfieldsModeldata[that.valueHelpControlId.split("ADDFIELDS-")[1]].F4Description;
					var oModel = new sap.ui.model.json.JSONModel();
					var results = data.map(function(oItem) {
						var oItemClone = jQuery.extend({}, oItem, true);
						oItemClone.title = oItem[F4Title];
						oItemClone.description = oItem[F4Description];
						return oItemClone;
					});
					oModel.setData(results);
					oModel.setProperty("/DialogTitle", addfieldsModeldata[that.valueHelpControlId.split("ADDFIELDS-")[1]].FieldLabel);
					var oStandardListItem = new sap.m.StandardListItem({
						type: sap.m.ListType.Active,
						title: "{" + addfieldsModeldata[that.valueHelpControlId.split("ADDFIELDS-")[1]].F4Title + "}",
						description: "{" + addfieldsModeldata[that.valueHelpControlId.split("ADDFIELDS-")[1]].F4Description + "}",
						press: function(event) {
							var index = that.valueHelpControlId.split("ADDFIELDS-")[1];
							var lv_itemvalue = event.getSource().getTitle();
							if (this.byId('ADDFIELDS').getFormElements()[index].getFields()[0].getVisible()) {
								this.byId('ADDFIELDS').getFormElements()[index].getFields()[0].setValue(lv_itemvalue);
							} else if (this.byId('ADDFIELDS').getFormElements()[index].getFields()[1].getVisible()) {
								this.byId('ADDFIELDS').getFormElements()[index].getFields()[1].setValue(lv_itemvalue);
							} else if (this.byId('ADDFIELDS').getFormElements()[index].getFields()[2].getVisible()) {
								this.byId('ADDFIELDS').getFormElements()[index].getFields()[2].setValue(lv_itemvalue);
							}
							this.dialogInstance.close();
							this.dialogInstance = null;
						}.bind(that)
					});
					oView.setModel(oModel, "valueHelpSet");
					if (!oDialog) {
						var oDialogController = {
							handleConfirm: function(event) {
								var index = that.valueHelpControlId.split("ADDFIELDS-")[1];
								var lv_itemvalue = event.getParameter('selectedItem').getTitle();
								if (this.byId('ADDFIELDS').getFormElements()[index].getFields()[0].getVisible()) {
									this.byId('ADDFIELDS').getFormElements()[index].getFields()[0].setValue(lv_itemvalue);
								} else if (this.byId('ADDFIELDS').getFormElements()[index].getFields()[1].getVisible()) {
									this.byId('ADDFIELDS').getFormElements()[index].getFields()[1].setValue(lv_itemvalue);
								} else if (this.byId('ADDFIELDS').getFormElements()[index].getFields()[2].getVisible()) {
									this.byId('ADDFIELDS').getFormElements()[index].getFields()[2].setValue(lv_itemvalue);
								}
								oDialog.destroy();
							}.bind(that),
							handleCancel: function(event) {
								oDialog.destroy();
							}
						};
						// create dialog via fragment factory
						oDialog = sap.ui.xmlfragment(oView.getId(), "edu.weill.Timeevents.view.fragments.SearchHelper", oDialogController);
						// connect dialog to view (models, lifecycle)
						oView.addDependent(oDialog);
					}
					jQuery.sap.syncStyleClass("sapUiSizeCompact", oView, oDialog);
					oDialog.open();
				},
				error: function(oError) {
					that.processError(oError);
				}

			};

			this.oDataModel.read(valueHelpSet, mParameters);
		},
		/* =========================================================== */
		/* formatters used in this controller                          */
		/* =========================================================== */
		formatDateTimeString: function(oDate) {
			if (typeof oDate === "string") {
				oDate = new Date(oDate);
			}

			var dateParse = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-dd"
			});
			var date = dateParse.format(oDate) + "T00:00:00";
			return date;
		},

		formatTimeString: function(oDate) {
			var h = oDate.getHours(),
				m = oDate.getMinutes(),
				s = oDate.getSeconds();
			if (h.length === 1) {
				h = "0" + h;
			}
			if (m.length === 1) {
				m = "0" + m;
			}
			if (s.length === 1) {
				s = "0" + s;
			}
			return "PT" + h + "H" + m + "M" + s + "S";
		},

		formatDateMMMDD: function(oDate) {
			var month = oDate.getMonth();
			var day = oDate.getDate();

			var dateString = this.oBundle.getText("MONTH_" + month) + " " + day;

			return dateString;
		},

		formatTime: function(oTime) {
			if (oTime) {
				var sec = oTime / 1000;
				var mins = oTime / 60000;
				var h = Math.floor(mins / 60).toString();
				if (h.length === 1) {
					h = "0" + h;
				}
				var m = Math.floor(mins % 60).toFixed(0);
				if (m.length === 1) {
					m = "0" + m;
				}

				var s = Math.floor(sec % 60).toFixed(0);
				if (s.length === 1) {
					s = "0" + s;
				}
				var timeString = h + ":" + m + ":" + s;

				var dateType = new Date();
				dateType.setHours(h);
				dateType.setMinutes(m);
				dateType.setSeconds(s);
				timeString = this.timeFormatter.format(dateType);
				return timeString;
			}

		},

		formatDate: function(oTime) {
			if (oTime) {
				var sec = oTime / 1000;
				var mins = oTime / 60000;
				var h = Math.floor(mins / 60).toString();
				if (h.length === 1) {
					h = "0" + h;
				}
				var m = Math.floor(mins % 60).toFixed(0);
				if (m.length === 1) {
					m = "0" + m;
				}

				var s = Math.floor(sec % 60).toFixed(0);
				if (s.length === 1) {
					s = "0" + s;
				}
				var timeString = h + ":" + m + ":" + s;

				var dateType = new Date();
				dateType.setHours(h);
				dateType.setMinutes(m);
				dateType.setSeconds(s);
				return dateType;
			}
		},

	});

});