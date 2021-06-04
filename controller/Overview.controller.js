/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.m.MessageToast");
jQuery.sap.require("edu.weill.Timeevents.utils.formatter");

sap.ui.define([
	"edu/weill/Timeevents/controller/BaseController",
	'sap/m/MessagePopover',
	'sap/m/MessagePopoverItem',
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
], function (BaseController, MessagePopover, MessagePopoverItem, Device, JSONModel, History) {
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
	let syncclocktimer = 7200;
	let isProcessStarted = false;
	return BaseController.extend("edu.weill.Timeevents.controller.Overview", {
		/* =========================================================== */
		/* controller hooks                                            */
		/* =========================================================== */
		extHookCreatePostObject: null,
		extHookOnCreate: null,
		extHookOnDelete: null,
		extHookOnChangeOfDate: null,
		extHookOriginColumn: null,



		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		/**
		 * Called when the Overview controller is instantiated.
		 * @public
		 */
		onInit: function () {
			//


			// var oServiceURI = this.getOwnerComponent().getMetadata().getManifestEntry("sap.app").dataSources["timeEventService"].uri;
			// const checkOnlineStatus = async () => {
			// 	try {
			// 		const online = await fetch(oServiceURI + "/odata/SAP/HCMFAB_MYTIMEEVENTS_SRV/ConfigurationSet");
			// 		return online.status >= 200 && online.status < 300; // either true or false
			// 	} catch (err) {
			// 		return false; // definitely offline
			// 	}
			// };
			// Code to check the network status
			// setInterval(async () => {
			// 	const result = await checkOnlineStatus();
			// 	var oViewModel = new JSONModel({
			// 		networkStatus: (result ? 'Online' : 'Offline')
			// 	});
			// 	window.networkStatus = result;
			// 	that.getView().setModel(oViewModel, "networkStatusModel");

			// }, 10000); // probably too often, try 10000 for every 10 seconds

			// window.addEventListener("load", async (event) => {
			// 	let statusDisplay = (await checkOnlineStatus()) ? "Online" : "Offline";
			// 	var oViewModel = new JSONModel({
			// 		networkStatus: statusDisplay
			// 	});
			// 	window.networkStatus = statusDisplay;
			// 	// that.getView().setModel(oViewModel, "networkStatusModel");
			// 	// document.title = 'Timeevents' + statusDisplay
			// });

			//
			var that = this;
			let query = { module: 'EmployeeDetailSet' }
			//Querying the local database for fetching the employee details
			db.findOne(query, function (err, data) {
				if (err) {
					console.log("Error in identifying the time event set individual records", err)
				} else if (data) {
					let oUserName = data.EmployeeDetailSet[0].EmployeeName;
					//oUserName.customStatus = window.onlineStatus;					
					var oModel = new JSONModel(oUserName);
					that.getView().setModel(oModel, "userDetails");

				}
			})

			var intervalTimer;
			// var syncIntervalTimer;
			//Code to show the sync timer on the screen default time is 5 minutes.
			// function formatToHrs(time) {   
			// 	// Hours, minutes and seconds
			// 	var hrs = ~~(time / 3600);
			// 	var mins = ~~((time % 3600) / 60);
			// 	var secs = ~~time % 60;

			// 	var ret = "";
			// 	if (hrs > 0) {
			// 		ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
			// 	}
			// 	ret += "" + mins + ":" + (secs < 10 ? "0" : "");
			// 	ret += "" + secs;
			// 	return ret;
			// }

			// setInterval(() => {
			// 	syncclocktimer--;
			// 	let timertodisplay = formatToHrs(syncclocktimer)

			// 	// var oViewModel = new JSONModel({
			// 	// 	syncTimer: syncclocktimer--
			// 	// });
			// 	var oViewModel = new JSONModel({
			// 		syncTimer: timertodisplay
			// 	});
			// 	that.getView().setModel(oViewModel, "syncModel");
			// }, 1000)



			/**
			 * @description Sync job that calls for every five minutes to sync offline data to backend and replace the complete data set
			 * for the last 14 days
			 */
			const alertOnlineStatusFinal = () => {
				intervalTimer = setInterval(function () {
					syncclocktimer = 7200;
					date = new Date();
					date.setDate(date.getDate() - 14)
					var dateFrom1 = date;
					date = new Date()
					var dateTo1 = date;
					var now1 = dateFrom1
					var then1 = dateTo1
					// that.synchronizeOfflineRecordsToBackend(now1, then1, date)
					/* 	if (that.selectedDate) {
							that.synchronizeOfflineRecordsToBackend(now1, then1, that.selectedDate)
						}
						else {
							that.synchronizeOfflineRecordsToBackend(now1, then1, date)
						} */

					if (that.selectedTab == "quickEntry" && !isProcessStarted) {
						// if (that.selectedTab == "quickEntry") {
						// that.synchronizeOfflineRecordsToBackend(now1, then1, date)
						that.synchronizeOfflineRecordsToBackend(new Date(), new Date(), new Date())
					}
					else if (that.selectedTab == "eventList" && !isProcessStarted) {
						// else if (that.selectedTab == "eventList") {
						that.synchronizeOfflineRecordsToBackend(now1, then1, that.selectedDate)
					}

				}, syncclocktimer * 1000)

			}


			//Calling the sync job to get invoked for every specified interval
			alertOnlineStatusFinal();

			//Code for enabling and disabling the sync flag.
			let syncVisibilityModel = new JSONModel({
				syncVisibleFlag: true
			});
			that.getView().setModel(syncVisibilityModel, "syncVisibility");

			//this.onLoadTable();

			//Check and decide Origin Column Display
			this.checkOriginColumnDisplay();
			// Variables used to access all the controls and models in UI			
			this.busyDialog = new sap.m.BusyDialog();
			this.oRouter = this.getOwnerComponent().getRouter();
			this._nCounter = 0;
			this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
				pattern: "yyyy-MM-dd",
				calendarType: sap.ui.core.CalendarType.Gregorian
			});
			this.timeFormatter = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: this.byId('timePicker').getDisplayFormat()
			});
			this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			this.oErrorHandler = this.getOwnerComponent()._oErrorHandler;
			this.oMessageManager = this.getOwnerComponent().oMessageManager;
			this.oMessageProcessor = this.getOwnerComponent().oMessageProcessor;
			this.legend = this.byId('legend');
			this.mlegend = this.byId('mlegend');
			this.calendar = this.byId('calendar');
			this.mCalendar = this.byId('mDatePicker');
			this.oDataModel = this.getOwnerComponent().getModel();
			this.dateValid = true;
			this.oRouter.getRoute("overview").attachMatched(this._onOverviewRouteMatched, this);
			sap.ui.getCore().getMessageManager().registerObject(this.getView(), true);
			var curDate = new Date();
			var today = new Date();
			this.setSelectedDate(today);
			curDate.setMonth(curDate.getMonth(), 1);
			this.dateFrom = curDate;
			curDate = new Date();
			curDate.setMonth(curDate.getMonth() + 2, 0);
			this.dateTo = curDate;
			// this.selectedDate = curDate;
			this.selectedDate = new Date();

			// Fetch current date events from local DB
			new Promise(
				function (fnResolve, fnReject) {
					that.getConfiguration();
					fnResolve(that.getEvents(new Date()));
					fnReject();
				}
				// ).then(that.initCalendar(that.empID)).then(that.synchronizeOfflineRecordsToBackend(new Date(), new Date(), new Date())) // Once the events get loaded and the calendar gets initialized, offline records synchronization will gets started.
				// ).then(that.initCalendar(that.empID)).then(that.synchronizeOfflineRecordsToBackendTwo(new Date(), new Date(), new Date())) // Once the events get loaded and the calendar gets initialized, offline records synchronization will gets started.
				// ).then(that.initCalendar(that.empID)).then(that.synchronizeOfflineRecordsForCurrentDay(new Date(), new Date())) // Once the events get loaded and the calendar gets initialized, offline records synchronization will gets started.
			).then(that.initCalendar(that.empID)).then(that.syncOfflineRecordsToBackendForCurrentDay(new Date(), new Date(), new Date())) // Once the events get loaded and the calendar gets initialized, offline records synchronization will gets started.

			var date = new Date();
			var selectedTab;
			this.selectedTab = "quickEntry";

			// this.getFavorites();

			this.getEventTypes(this.empID);
			this.getGeoCoordinates();

			//End of Addition

			//Intervals used to show the clock in quick entry and detailed entry tab

			setInterval(function () {
				try {
					var oViewModel = new JSONModel({
						dateValue: new Date()
					});
					that.getView().setModel(oViewModel, "timeEventModel");

					//Check the status of the isProcessStarted flag to enable or disable the sync button based on the flag status.
					syncVisibilityModel = new JSONModel({
						syncVisibleFlag: !isProcessStarted
					});
					that.getView().setModel(syncVisibilityModel, "syncVisibility");

				} catch (e) {
					jQuery.sap.log.warning("Could not set Time", ["getConfiguration"], ["hcm.myTimeEvents"]);
				}
			}, 100);
			this.setTimeIntervalDetails = setInterval(function () {
				try {
					that.byId("timePicker").setValue(that.timeFormatter.format(new Date()));
				} catch (e) {
					jQuery.sap.log.warning("Could not set Time", ["getConfiguration"], ["hcm.myTimeEvents"]);
				}
			}, 60000);
			// Controls the modes of controls in Desktop and Mobile
			if (sap.ui.Device.system.phone === true) {
				this.byId('calendar').setVisible(false);
				this.byId('legend').setVisible(false);
				this.byId("mDatePicker").setDateValue(new Date());
				this.byId("idEventsTable").setMode("None");
			}

			// var dataLoaded = this.oDataModel.metadataLoaded();
			// dataLoaded.then(function (oData) { }).catch(function (oErr) { });
			// this.initCalendarLegend();
			// Handle validation
			// sap.ui.getCore().attachParseError(controlErrorHandler);
			// sap.ui.getCore().attachValidationSuccess(controlNoErrorHandler);

		},
		/**
		 * Called when the Overview controller on exit.
		 * @public
		 */
		onExit: function () {
			sap.ui.getCore().getMessageManager().removeAllMessages();
		},

		onAfterRendering: function () {
			this.busyDialog.close();
		},


		/* =========================================================== */
		/* event Handlers                                           */
		/* =========================================================== */

		/**
		 * Handled when Message Popover is clicked.
		 * @public
		 */

		handleMessagePopover: function (oEvent) {
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
		 * Handled when Detailed entry tab is selected.
		 * @public
		 */
		handleCreateEvent: function () {
			// this.byId("favorite").setVisible(false);
			// this.byId("download").setVisible(false);
			// this.byId("save").setVisible(true);
			// this.byId("cancel").setVisible(true);
		},

		/**
		 * Handled when user selects calendar.
		 * @public
		 */

		handleCalendarSelect: function (oEvent) {
			/**
			 * @ControllerHook Change the implementation on date change
			 * This hook method can be used to change the implementation on changing the date from the Calendar
			 * It is called on change of the selected date on the calendar
			 * @callback edu.weill.Timeevents.controller.Overview~extHookOnChangeOfDate
			 */
			if (this.extHookOnChangeOfDate) {
				this.extHookOnChangeOfDate();
			} else {
				var date, date1;
				if (sap.ui.Device.system.phone === true) {
					date = new Date(oEvent.getSource().getDateValue());
					date1 = new Date(oEvent.getSource().getDateValue());
					date.setYear(date.getFullYear());
					// date.setMonth(date.getMonth(), 1);
					date.setDate(date.getDate() - 7);
					this.dateFrom = date;
					date = new Date(oEvent.getSource().getDateValue());
					date.setYear(date.getFullYear());
					// date.setMonth(date.getMonth() + 1, 0);
					date.setDate(date.getDate() + 7)
					this.dateTo = date;
				} else {
					date = new Date(oEvent.getSource().getSelectedDates()[0].getStartDate());
					date1 = new Date(oEvent.getSource().getSelectedDates()[0].getStartDate());
					date.setYear(date.getFullYear());
					// date.setMonth(date.getMonth(), 1);
					date.setDate(date.getDate() - 7);
					this.dateFrom = date;
					date = new Date(oEvent.getSource().getSelectedDates()[0].getStartDate());
					date.setYear(date.getFullYear());
					// date.setMonth(date.getMonth() + 1, 0);
					date.setDate(date.getDate() + 7)
					this.dateTo = date;
				}
				this.selectedDate = date1;
				this.setSelectedDate(this.selectedDate);
				this.getEvents(this.selectedDate);
				if (!isProcessStarted) {
					this.synchronizeOfflineRecordsToBackend(this.dateFrom, this.dateTo, date1) //Mallesh on 18-12-2020 for incresing performance.
				}
			}
		},

		/**
		 * Handled when Download Time Statement button is clicked.
		 * @public
		 */

		showTimeStatementDialog: function () {
			var that = this;
			var date = new Date(),
				y = date.getFullYear(),
				m = date.getMonth(),
				d = date.getDate(),
				oPernr = this.empID;
			this.oStartDate = new Date(y, m, 1);
			this.oEndDate = new Date(y, m, d);
			this.fromDatePicker = new sap.m.DatePicker({
				dateValue: this.oStartDate,
				valueFormat: "yyyy-MM-dd",
				visible: false,
				change: function (oEvent) {
					var oDP = oEvent.getSource();
					var bValid = oEvent.getParameter("valid");
					if (bValid) {
						if (new Date(this.getValue()).getTime() > new Date(that.oEndDate).getTime()) {
							oDP.setValueState(sap.ui.core.ValueState.Error);
							that.oErrorHandler.pushError(that.oBundle.getText("invalidDates"), that.oMessageManager, that.oMessageProcessor);
						} else {
							that.oStartDate = this.getValue();
							oDP.setValueState(sap.ui.core.ValueState.None);
						}
					} else {
						var toastMsg = that.oBundle.getText("dateError");
						sap.m.MessageToast.show(toastMsg);
						oDP.setValueState(sap.ui.core.ValueState.Error);
					}
				}
			});
			this.toDatePicker = new sap.m.DatePicker({
				dateValue: this.oEndDate,
				valueFormat: "yyyy-MM-dd",
				visible: false,
				change: function (oEvent) {
					var oDP = oEvent.getSource();
					var bValid = oEvent.getParameter("valid");
					if (bValid) {
						if (new Date(this.getValue()).getTime() < new Date(that.oStartDate).getTime()) {
							oDP.setValueState(sap.ui.core.ValueState.Error);
							that.oErrorHandler.pushError(that.oBundle.getText("invalidDates"), that.oMessageManager, that.oMessageProcessor);
						} else {
							oDP.setValueState(sap.ui.core.ValueState.None);
							that.oEndDate = this.getValue();
						}
					} else {
						oDP.setValueState(sap.ui.core.ValueState.Error);
					}
				}
			});
			this.oDateRange = new sap.m.DateRangeSelection({
				dateValue: this.oStartDate,
				secondDateValue: this.oEndDate,
				change: function (oEvent) {
					var oDP = oEvent.getSource();
					var oStartDate = oEvent.getParameter("from");
					var oEndDate = oEvent.getParameter("to");
					var bValid = oEvent.getParameter("valid");
					that.dateValid = bValid;
					if (bValid) {
						if (oStartDate.getTime() < new Date(that.oStartDate).getTime()) {
							oDP.setValueState(sap.ui.core.ValueState.None);
							that.oStartDate = dateParse.format(oStartDate);
							that.oEndDate = dateParse.format(oEndDate);
						} else {
							oDP.setValueState(sap.ui.core.ValueState.None);
							that.oStartDate = dateParse.format(oStartDate);
							that.oEndDate = dateParse.format(oEndDate);
						}
					} else {
						that.oErrorHandler.pushError(that.oBundle.getText("invalidDates"), that.oMessageManager, that.oMessageProcessor);
						oDP.setValueState(sap.ui.core.ValueState.Error);
					}
				}
			});

			var dateParse = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-dd"
			});
			this.oStartDate = dateParse.format(this.fromDatePicker.getDateValue());
			this.oEndDate = dateParse.format(this.toDatePicker.getDateValue());
			this.setAndParse = function (begda, endda) {
				that.fromDatePicker.setDateValue(begda);
				that.toDatePicker.setDateValue(endda);
				that.oStartDate = dateParse.format(that.fromDatePicker.getDateValue());
				that.oEndDate = dateParse.format(that.toDatePicker.getDateValue());
			};
			var oFormElementDates = new sap.ui.layout.form.FormContainer({
				visible: false,
				formElements: [
					new sap.ui.layout.form.FormElement({
						label: new sap.m.Label({
							text: that.oBundle.getText("dateRange"),
							required: true,
							visible: false
						}),
						fields: that.oDateRange
					})
				]
			});
			var oFormElementRadioButtons = new sap.ui.layout.form.FormContainer({
				formElements: [
					new sap.ui.layout.form.FormElement({
						fields: [
							new sap.m.RadioButtonGroup({
								selectedIndex: 1,
								select: function (evt) {
									var index = evt.getSource().getSelectedIndex();
									switch (index) {
										case 0:
											that.oStartDate = new Date(y, m, d - 7);
											that.oEndDate = new Date(y, m, d);
											that.setAndParse(that.oStartDate, that.oEndDate);
											oFormElementDates.setVisible(false);
											break;
										case 1:
											that.oStartDate = new Date(y, m, 1);
											that.oEndDate = new Date(y, m + 1, 0);
											that.setAndParse(that.oStartDate, that.oEndDate);
											oFormElementDates.setVisible(false);
											break;
										case 2:
											that.oStartDate = new Date(y, m, 1);
											that.oEndDate = new Date(y, m, d);
											that.setAndParse(that.oStartDate, that.oEndDate);
											oFormElementDates.setVisible(true);
											break;
									}
								},
								buttons: [
									new sap.m.RadioButton({
										text: that.oBundle.getText("currentWeek"),
										customData: new sap.ui.core.CustomData({
											"key": "Period",
											"value": "CURRENT_WEEK"
										})
									}),
									new sap.m.RadioButton({
										text: that.oBundle.getText("currentMonth"),
										customData: new sap.ui.core.CustomData({
											"key": "Period",
											"value": "CURRENT_MONTH"
										})
									}),
									new sap.m.RadioButton({
										text: that.oBundle.getText("otherPeriod"),
										customData: new sap.ui.core.CustomData({
											"key": "Period",
											"value": "OTHER_PERIOD"
										})
									})
								]
							})
						]
					})
				]
			});

			var oDatesForm = new sap.ui.layout.form.Form({
				maxContainerCols: 2,
				//	class: "sapUiLargeMarginTopBottom",
				layout: new sap.ui.layout.form.ResponsiveGridLayout({
					labelSpanL: 3,
					emptySpanL: 2,
					labelSpanM: 3,
					emptySpanM: 2,
					labelSpanS: 3,
					emptySpanS: 2,
					columnsL: 2,
					columnsM: 2,
					columnsS: 2
				}),
				formContainers: [oFormElementRadioButtons, oFormElementDates]
			});

			var downloadDialog = new sap.m.Dialog({
				title: that.oBundle.getText("selectTimeStatement"),
				//	class: "sapUiContentPadding sapUiLargeMarginTopBottom",
				content: oDatesForm,
				buttons: [
					new sap.m.Button({
						text: that.oBundle.getText("download"),
						press: function () {
							if (that.dateValid) {
								this.getParent().close();
								var oTimeStatementUrl = "/TimeStatementSet(EmployeeID='" + oPernr + "',Begda=datetime'" + that.oStartDate +
									"T00:00:00',Endda=datetime'" + that.oEndDate + "T00:00:00')/$value";
								oTimeStatementUrl = that.getOwnerComponent().getModel().sServiceUrl + oTimeStatementUrl;
								window.open(oTimeStatementUrl, "_blank");
							}
						}
					}),
					new sap.m.Button({
						text: that.oBundle.getText("cancel"),
						press: function () {
							this.getParent().close();
						}
					})

				]
			});
			downloadDialog.open();

		},
		/**
		 * Handled when user clicks Approver search help.
		 * @public
		 */

		onApproverHelpRequest: function () {
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
				success: function (oData) {
					var oModel = new sap.ui.model.json.JSONModel(oData.results);
					oModel.setProperty("/DialogTitle", that.oBundle.getText("searchApprover"));
					oView.setModel(oModel, "approver");
				},
				error: function (oError) {
					that.processError(oError);
				}
			};

			// this.oDataModel
			// 	.read('/ApproverSet', mParameters);

			// create dialog lazily
			if (!oDialog) {
				var oDialogController = {
					handleConfirm: function (evnt) {
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
		 * Handled when user searches for approver.
		 * @public
		 */

		searchAction: function (evt) {
			var self = this;
			this.searchString = evt.getParameter("value");
			if (evt.getParameter("value").length > 0 || !isNaN(evt.getParameter("value"))) {
				//show busy dialog
				if (this.searchString.length === 0) {
					this.searchString = "*";
				}
				if (this.searchString.length >= 80) {
					this.searchString = this.searchString.substring(0, 79);
				}
				self.searchApprover(self.searchString);

			}

		},

		/**
		 * Called when user clicks on time event to change.
		 * @public
		 */

		onItemPress: function (oEvent) {
			//HEGDEPR: 2545524 Refined the method implementation
			var selectedReqId = oEvent.getSource('selectedItem').data().id;
			var selectedEvent;
			var events = this.timeEvents;
			//finding the selected event
			for (var i = 0; i < events.results.length; i++) {
				if (events.results[i].ReqId === selectedReqId) {
					selectedEvent = events.results[i];
					break;
				}
			}
			if (selectedEvent.Status == "APPROVED") {
				var toastMsg = this.oBundle.getText("CannotEditApproved");
				sap.m.MessageToast.show(toastMsg, {
					duration: 1000
				});
			} else {
				this.oMessageManager.removeAllMessages();
				var oModel = new sap.ui.model.json.JSONModel();
				this.setGlobalModel(oModel, "exchangeModel");
				var etModel = this.byId("idTimeEventType").getModel();
				this.setGlobalModel(etModel, "eventTypesModel");
				oModel.setData(selectedEvent);
				this.getRouter().navTo("change", {}, false);
			}
		},

		/**
		 * Called when user clicks on time event to change using swipe in mobile.
		 * @public
		 */

		onItemSwipeNavigation: function (oEvent) {
			var oModel = new sap.ui.model.json.JSONModel();
			this.setGlobalModel(oModel, "exchangeModel");
			var etModel = this.byId("idTimeEventType").getModel();
			this.setGlobalModel(etModel, "eventTypesModel");
			if (sap.ui.Device.system.phone === true) {
				var selectedReqId = oEvent.getSource().getParent().getParent().getSwipedItem().data().id;
			}
			var selectedEvent;
			var events = this.timeEvents;
			//finding the selected event
			for (var i = 0; i < events.results.length; i++) {
				if (events.results[i].ReqId === selectedReqId) {
					selectedEvent = events.results[i];
					break;
				}
			}
			oModel.setData(selectedEvent);
			this.getRouter().navTo("change", {}, false);
		},

		/**
		 * Called when application to load employee data.
		 * @public
		 */

		onAssignmentsLoaded: function (oEvent) {

			var that = this;
			this.empID = oEvent.getParameter('defaultAssignment');
			this.setPernr(this.empID);
			this.getTimeEvalMessages(this.empID);
			new Promise(
				function (fnResolve, fnReject) {
					that.getConfiguration();
					fnResolve(that.getEvents(new Date()));
					fnReject();
				}
			).then(that.initCalendar(that.empID));
			this.getFavorites();
			this.getEventTypes(this.empID);
		},

		/**
		 * Called when user switches between personnel assignments.
		 * @public
		 */

		onAssignmentSwitch: function (oEvent) {
			var that = this;
			this.empID = oEvent.getParameter('selectedAssignment');
			this.setPernr(this.empID);
			this.getTimeEvalMessages(this.empID);
			var curDate = new Date();
			curDate.setMonth(curDate.getMonth(), 1);
			this.dateFrom = curDate;
			curDate = new Date();
			curDate.setMonth(curDate.getMonth() + 2, 0);
			this.dateTo = curDate;
			new Promise(
				function (fnResolve, fnReject) {
					that.getConfiguration();
					fnResolve(that.getEvents(new Date()));
					fnReject();
				}
			).then(that.initCalendar(that.empID));
			this.getFavorites();
			this.getEventTypes(this.empID);
		},

		/**
		 * Handled when user click on Event types button.
		 * @public
		 */

		showFavoriteDialog: function () {
			var that = this;
			var b = new sap.ui.model.Filter({
				path: "EmployeeID",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.empID
			});
			var f = [];
			f.push(b);
			var oModel = new sap.ui.model.json.JSONModel();
			var mParameters = {
				filters: f, // your Filter Array
				success: function (oData, oResponse) {
					var a = oData;
					oModel.setData(a.results);
					that.hideBusy();
				},
				error: function (oError) {
					that.processError(oError);
				}
			};
			// this.showBusy();
			// this.oDataModel
			// 	.read(
			// 		"/FavoritesSet",
			// 		mParameters);
		},

		/**
		 * Handled when user clicks on icon tab bar.
		 * @public
		 */

		onSelect: function (oEvent) {

			if (oEvent.getParameter('selectedKey') == "createEvent") {

				this.oMessageManager.removeAllMessages();
				// this.byId('download').setVisible(false);
				// this.byId('favorite').setVisible(false);
				// this.byId('save').setVisible(true);
				// this.byId('cancel').setVisible(true);
				this.resetFields();

				this.selectedTab = "createEvent"
			} else if (oEvent.getParameter('selectedKey') == "eventList") {
				this.oMessageManager.removeAllMessages();
				// this.byId('save').setVisible(false);
				// this.byId('cancel').setVisible(false);
				// this.byId('download').setVisible(true);
				// this.byId('favorite').setVisible(false);
				this.selectedTab = "eventList";
				this.resetFields();
				if (this.selectedDate) {
					this.getEvents(this.selectedDate);
				}
				else {
					this.getEvents(new Date());
				}
			} else if (oEvent.getParameter('selectedKey') == "quickEntry") {
				this.oMessageManager.removeAllMessages();
				// this.byId('save').setVisible(false);
				// this.byId('cancel').setVisible(false);
				// this.byId('download').setVisible(true);
				// this.byId('favorite').setVisible(true);
				this.selectedTab = "quickEntry";
				this.resetFields();
				this.getEvents(new Date());
			}
		},

		/**
		 * Called when application loads confirmation popup.
		 * @public
		 */
		openConfirmationPopup: function (oSettings, isType, selectedItem) {
			var latitude, longitude;
			var self = this;
			var oElements = [];
			var that = this;
			let query = { module: 'GeoCoordinates' }
			//Querying the local database for getting the saved geocoordinates
			db.findOne(query, function (err, data) {

				if (err) {
					console.log("Error in identifying the time event set individual records", err)
				} else if (data) {
					latitude = data.latitude;
					longitude = data.longitude;
					//Code for Geo Location added by Sumanth

					//var onGeoSuccess = function (position) {
					oElements.push(new sap.m.Label({
						text: 'Location',
						design: "Bold"
					}));
					oElements.push(new sap.m.Text({
						text: latitude + '\n' + longitude

						// let query = { module: 'GeoCoordinates' }
						// db.findOne(query, function (err, data) {

						// 	if (err) {
						// 		console.log("Error in identifying the time event set individual records", err)
						// 	} else if (data) {
						// 		let oUserName = data.EmployeeDetailSet[0].EmployeeName;
						// 		//oUserName.customStatus = window.onlineStatus;					
						// 		console.log('user name', oUserName);

						// 		var oModel = new JSONModel(oUserName);
						// 		that.getView().setModel(oModel, "userDetails");

						// 	}
						// }) 


					}));

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
						content: [oForm],
						beginButton: new sap.m.Button({
							text: oSettings.confirmButtonLabel,
							press: function () {
								that.busyDialog.open();
								if (isType === 'C') {
									self.createTimeEvent();
								} else if (isType === 'F') {
									self.createTimeEventMob(true, selectedItem);
								} else {
									self._deleteEntry(selectedItem);
								}
								oConfirmDialog.close();
							}
						}),
						endButton: new sap.m.Button({
							text: self.oBundle.getText("cancel"),
							press: function () {
								oConfirmDialog.close();
							}
						})
					}).addStyleClass("sapUiContentPadding sapUiMediumMarginTopBottom");
					oConfirmDialog.open();
				}
			})



			/* 			var options = {
							enableHighAccuracy: true,
							timeout: 5000,
							maximumAge: 0
						  };
						  
						  function success(pos) {
							var crd = pos.coords;
						  
							console.log('Your current position is:');
							console.log(`Latitude : ${crd.latitude}`);
							console.log(`Longitude: ${crd.longitude}`);
							console.log(`More or less ${crd.accuracy} meters.`);
						  }
						  
						  function error(err) {
							console.warn(`ERROR(${err.code}): ${err.message}`);
						  }
						  
						  navigator.geolocation.getCurrentPosition(success, error, options); */
			//              }
			//              onGeoError = function (error) {};

			//          sap.ui.Device.geolocation.getCurrentPosition(onGeoSuccess, onGeoError, {
			//              enableHighAccuracy: true
			//          });
			//Code Complete
		},
		/**
		 * Called when application delete time event.
		 * @public
		 */
		_deleteEntry: function (selectedItem) {
			var that = this;
			// this.showBusy();
			var postObj = this.createPostObject("D", selectedItem.data());
			var path = "/TimeEventSet(ReqId='" + postObj.ReqId + "',EmployeeID='" + postObj.EmployeeID + "')";
			var mParameters = {
				success: function () {
					that.hideBusy();
					var toastMsg = that.oBundle.getText("timeEventDeleted");
					sap.m.MessageToast.show(toastMsg, {
						duration: 1000
					});
					that.getEvents(that.selectedDate);
				},
				error: function (oError) {
					that.hideBusy();
					that.processError(oError);
				}
			};

			this.oDataModel
				.remove(path, mParameters);
		},

		/**
		 * Called when user search for any approver.
		 * @public
		 */

		searchApprover: function (searchString) {
			var that = this;
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
				success: function (oData) {
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
					oModel.setProperty("/DialogTitle", that.oBundle.getText("searchApprover"));
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
				error: function (oError) {
					that.processError(oError);
				}
			};
			// this.oDataModel
			// 	.read(sPath, mParameters);
		},

		/**
		 * Called when application to save favorites.
		 * @public
		 */
		onSaveFavorite: function (oEvent) {
			var oView = this.getView();
			var oDialog = oView.byId("favoriteDialog");
			// create dialog lazily
			if (!oDialog) {
				var oDialogController = {
					handleConfirm: this.handleConfirm.bind(this),
					handleSearch: this.handleSearchEventTypes.bind(this),
					handleClose: function (oEvt) {
						var binding = oEvt.getSource().getBinding("items");
						//remove older search Filters
						var removeFilter = [];
						binding.filter(removeFilter, "Application");
					}
				};
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "edu.weill.Timeevents.view.fragments.FavoritesDialog", oDialogController);
				// connect dialog to view (models, lifecycle)
				oView.addDependent(oDialog);
			}
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);

			oDialog.open();

		},

		/**
		 * Called when application to save favorites.
		 * @public
		 */
		onMessagesBtnClick: function (oEvent) {
			var that = this;
			var oView = this.getView();
			var oDialog = oView.byId("messagesDialog");
			// create dialog lazily
			if (!oDialog) {
				var oDialogController = {
					onConfirm: function (event) {
						var selectedItem = event.getParameter('selectedItems');
						var date = selectedItem[0].data().MessageDate;
						that.selectedDate = date;
						if (sap.ui.Device.system.phone === true) {
							that.mCalendar.setDateValue(that.selectedDate);
						} else {

							that.calendar.removeAllSelectedDates();
							that.calendar.addSelectedDate(new sap.ui.unified.DateRange({
								startDate: that.selectedDate,
								endDate: that.selectedDate
							}));
							that.calendar.focusDate(that.selectedDate);
							that.calendar.fireStartDateChange();
						}
						that.getEvents(that.selectedDate);
						that.byId("idIconTabBarNoIcons").setSelectedKey("eventList");
					},
					handleCancel: function (event) {
						oDialog.destroy();
					}
				};
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "edu.weill.Timeevents.view.fragments.MessagesDialog", oDialogController);
				// connect dialog to view (models, lifecycle)
				oView.addDependent(oDialog);
			}
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);

			oDialog.open();

		},

		/**
		 * Called when user change time event type and will load all additional fields of time event type.
		 * @public
		 */
		onSelectionChange: function (evt, event) {
			var that = this;
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
			var oFormContainer = that.byId("ADD_FIELDS");
			oFormContainer.destroyFormElements();
			var mParameters = {
				filters: f, // your Filter Array
				success: function (oData, oResponse) {
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
									break;
								case 'N':
									AdditionalFields.results[i].TypeKind = "Number";
									AdditionalFields.results[i].InputIntegerVisible = true;
									AdditionalFields.results[i].InputTextVisible = false;
									AdditionalFields.results[i].InputDecimalVisible = false;
									AdditionalFields.results[i].DateVisible = false;
									AdditionalFields.results[i].TimeVisible = false;
									break;
								case 'P':
									AdditionalFields.results[i].TypeKind = "Number";
									AdditionalFields.results[i].InputIntegerVisible = false;
									AdditionalFields.results[i].InputTextVisible = false;
									AdditionalFields.results[i].InputDecimalVisible = true;
									AdditionalFields.results[i].DateVisible = false;
									AdditionalFields.results[i].TimeVisible = false;
									break;
								case 'C':
									AdditionalFields.results[i].TypeKind = "Text";
									AdditionalFields.results[i].InputTextVisible = true;
									AdditionalFields.results[i].InputIntegerVisible = false;
									AdditionalFields.results[i].InputDecimalVisible = false;
									AdditionalFields.results[i].DateVisible = false;
									AdditionalFields.results[i].TimeVisible = false;
									break;
								case 'T':
									AdditionalFields.results[i].TypeKind = "Time";
									AdditionalFields.results[i].TimeVisible = true;
									AdditionalFields.results[i].DateVisible = false;
									AdditionalFields.results[i].InputDecimalVisible = false;
									AdditionalFields.results[i].InputTextVisible = false;
									AdditionalFields.results[i].InputIntegerVisible = false;
									break;
								default:
									AdditionalFields.results[i].TypeKind = "Text";
									AdditionalFields.results[i].InputTextVisible = true;
									AdditionalFields.results[i].InputIntegerVisible = false;
									AdditionalFields.results[i].InputDecimalVisible = false;
									AdditionalFields.results[i].DateVisible = false;
									AdditionalFields.results[i].TimeVisible = false;
							}
							if (AdditionalFields.results[i].HasF4 === "X") {
								AdditionalFields.results[i].HasF4 = true;
							} else {
								AdditionalFields.results[i].HasF4 = false;
							}

							if (AdditionalFields.results[i].Name === 'ValuationBasis') {
								AdditionalFields.results[i].value = parseFloat("0.00");
							} else if (AdditionalFields.results[i].Name === 'TimeRecIDNo') {
								AdditionalFields.results[i].value = "00000000";
							} else if (AdditionalFields.results[i].Name === 'PremiumID') {
								AdditionalFields.results[i].value = "0000";
							} else if (AdditionalFields.results[i].Name === 'Position') {
								AdditionalFields.results[i].value = "00000000";
							} else if (AdditionalFields.results[i].Name === 'SalesOrderItem') {
								AdditionalFields.results[i].value = "000000";
							}

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
										value: "{ path: 'timevalue', type: 'sap.ui.model.odata.type.Time' }",
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
				error: function (oError) {
					that.processError(oError);
				}
			};
			// this.oDataModel.read("/AdditionalFieldSet", mParameters);
		},
		/**
		 * Handled when user clicks on event in Quick Entry tab.
		 * @public
		 */
		onFavPress: async function (oEvent) {
			var selectedItem = oEvent.getSource().data();
			selectedItem.date = new Date();
			var dateString = sap.ui.core.format.DateFormat.getDateInstance({
				style: "medium"
			}).format(new Date());
			var timeString = sap.ui.core.format.DateFormat.getTimeInstance({
				style: "medium"
			}).format(new Date());;
			var addInfo = [{
				label: this.oBundle.getText("eventType"),
				// text: selectedItem.SubtypeText
				text: selectedItem.TimeTypeText
			}, {
				label: this.oBundle.getText("date"),
				text: dateString
			}, {
				label: this.oBundle.getText("time"),
				text: timeString
			}

			];

			//set up the settings tab
			var oSettings = {
				showNote: false,
				title: this.oBundle.getText("submissionConfirmation"),
				confirmButtonLabel: this.oBundle.getText("OK"),
				additionalInformation: addInfo
			};
			// setInterval(() => {	
			// 	let runningTimer = sap.ui.core.format.DateFormat.getTimeInstance({	
			// 		style: "medium"	
			// 	}).format(new Date());;	
			// 	sap.ui.getCore().byId("mytimer2").setText(runningTimer)	
			// }, 1000)
			//open confirmation popup
			this.openConfirmationPopup(oSettings, 'F', selectedItem);

		},

		/**
		 * Function used to get the user timezone present in the local database.
		 */
		getUserTimeZone: function () {
			return new Promise((resolve, reject) => {
				db.find({ module: 'ConfigurationSet' }, function (err, docs) {
					if (err) {
						console.log('Error in finding ConfigurationSet in GetUserTimeZone Function', err);
						reject(err)
					}
					else if (docs) {
						resolve(docs[0].ConfigurationSet[0].TimezoneOffset);
					}
				})

			})

		},

		/**
		 * Called for confirmation popup of favorites.
		 * @public
		 */
		handleConfirm: function (oEvent) {
			var that = this;
			var eventsList = oEvent.getSource().getBinding("items").oList;
			var selectedItems = [];
			var l = 0;
			for (var n = 0; n < eventsList.length; n++) {
				if (eventsList[n].selected) {
					selectedItems[l] = eventsList[n];
					l++;
				}
			}
			var oModel = this.oDataModel;
			oModel.setChangeBatchGroups({
				"*": {
					groupId: "Favorites",
					changeSetId: "Favorites",
					single: false
				}
			});
			oModel.setDeferredGroups(["Favorites"]);
			oModel
				.refreshSecurityToken(
					function (oData) {
						if (selectedItems.length > 0) {
							for (var i = 0; i < selectedItems.length; i++) {
								var obj = {
									properties: {
										EmployeeID: that.empID,
										Subtype: selectedItems[i].TimeType,
										SubtypeText: selectedItems[i].TimeTypeText
									},
									success: function (oData) {
										var toastMsg = that.oBundle.getText("favoriteCreated");
										sap.m.MessageToast.show(toastMsg, {
											duration: 1000
										});
										that.getFavorites();
										that.getEventTypes();
										that.calendar.removeAllSelectedDates();
										that.calendar.addSelectedDate(new sap.ui.unified.DateRange({
											startDate: new Date(),
											endDate: new Date()
										}));
										that.selectedDate = new Date();
										that.getEvents(that.selectedDate);
									},
									error: function (oError) {
										that.processError(oError);
									},
									changeSetId: "Favorites",
									groupId: "Favorites"
								};
								oModel
									.createEntry(
										"/FavoritesSet",
										obj);
							}
						} else {
							var obj = {
								properties: {
									EmployeeID: that.empID,
									Subtype: " ",
									SubtypeText: " "
								},
								success: function (oData) {
									var toastMsg = that.oBundle.getText("favoriteDeleted");
									sap.m.MessageToast.show(toastMsg, {
										duration: 1000
									});
									that.getFavorites();
									that.getEventTypes();
									that.calendar.removeAllSelectedDates();
									that.calendar.addSelectedDate(new sap.ui.unified.DateRange({
										startDate: new Date(),
										endDate: new Date()
									}));
									that.selectedDate = new Date();
									that.getEvents(that.selectedDate);
								},
								error: function (oError) {
									that.processError(oError);
								}

							};
							oModel
								.createEntry(
									"/FavoritesSet",
									obj);
						}
						oModel.submitChanges({
							groupId: "Favorites",
							changeSetId: "Favorites"
						});

					}, true);
		},
		/**
		 * Handled to trigger search help.
		 * @public
		 */
		onValueHelp: function (oEvent) {
			var that = this;
			var oView = this.getView();
			var oDialog = oView.byId('valueHelpDialog');
			that.valueHelpControlId = oEvent.getSource().getId();
			var fieldName = oEvent.getSource().getCustomData()[0].getValue();
			var valueHelpSet = "/" + oEvent.getSource().getCustomData()[1].getValue();
			var addfieldsModeldata = this.getModel("AdditionalFields").getData();
			var mParameters = {
				success: function (oData) {
					var data = oData.results;
					var results = [];
					var items = {};
					var F4Title = addfieldsModeldata[that.valueHelpControlId.split("ADD_FIELDS-")[1]].F4Title;
					var F4Description = addfieldsModeldata[that.valueHelpControlId.split("ADD_FIELDS-")[1]].F4Description;
					var oModel = new sap.ui.model.json.JSONModel();
					var results = data.map(function (oItem) {
						var oItemClone = jQuery.extend({}, oItem, true);
						oItemClone.title = oItem[F4Title];
						oItemClone.description = oItem[F4Description];
						return oItemClone;
					});
					oModel.setData(results);
					oModel.setProperty("/DialogTitle", addfieldsModeldata[that.valueHelpControlId.split("ADD_FIELDS-")[1]].FieldLabel);
					var oStandardListItem = new sap.m.StandardListItem({
						type: sap.m.ListType.Active,
						title: "{" + addfieldsModeldata[that.valueHelpControlId.split("ADD_FIELDS-")[1]].F4Title + "}",
						description: "{" + addfieldsModeldata[that.valueHelpControlId.split("ADD_FIELDS-")[1]].F4Description + "}",
						press: function (event) {
							var index = that.valueHelpControlId.split("ADD_FIELDS-")[1];
							var lv_itemvalue = event.getSource().getTitle();
							this.byId('ADD_FIELDS').getFormElements()[index].getFields()[0].setValue(lv_itemvalue);
							this.dialogInstance.close();
							this.dialogInstance = null;
						}.bind(that)
					});
					oView.setModel(oModel, "valueHelpSet");
					if (!oDialog) {
						var oDialogController = {
							handleConfirm: function (event) {
								var index = that.valueHelpControlId.split("ADD_FIELDS-")[1];
								var lv_itemvalue = event.getParameter('selectedItem').getTitle();
								if (this.byId('ADD_FIELDS').getFormElements()[index].getFields()[0].getVisible()) {
									this.byId('ADD_FIELDS').getFormElements()[index].getFields()[0].setValue(lv_itemvalue);
								} else if (this.byId('ADD_FIELDS').getFormElements()[index].getFields()[1].getVisible()) {
									this.byId('ADD_FIELDS').getFormElements()[index].getFields()[1].setValue(lv_itemvalue);
								} else if (this.byId('ADD_FIELDS').getFormElements()[index].getFields()[2].getVisible()) {
									this.byId('ADD_FIELDS').getFormElements()[index].getFields()[2].setValue(lv_itemvalue);
								}
								oDialog.destroy();
							}.bind(that),
							handleCancel: function (event) {
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
				error: function (oError) {
					that.processError(oError);
				}

			};

			// this.oDataModel.read(valueHelpSet, mParameters);
		},
		/**
		 * Called to navigate back to old screen.
		 * @public
		 */
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

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
		 * handled to search event types.
		 * @public
		 */
		handleSearchEventTypes: function (oEvt) {
			var that = this;
			var aFilters = [];
			var aFilter = [];
			var sQuery = oEvt.getParameter('value');
			var binding = oEvt.getSource().getBinding("items");
			// add filter for search

			var filter1 = new sap.ui.model.Filter("TimeTypeText", sap.ui.model.FilterOperator.Contains, sQuery);
			aFilter.push(filter1);
			var filter2 = new sap.ui.model.Filter("TimeType", sap.ui.model.FilterOperator.Contains, sQuery);
			aFilter.push(filter2);
			if (sQuery && sQuery.length > 0) {
				var filter = new sap.ui.model.Filter({
					filters: aFilter,
					and: false
				});
				aFilters.push(filter);
			}
			binding.filter(aFilters, "Application");
			//HEGDEPR 2545524
			if (binding.iLength === 0) {
				this.byId("favoriteDialog")._oOkButton.setEnabled(false);
			} else {
				this.byId("favoriteDialog")._oOkButton.setEnabled(true);
			}
		},
		onRefreshButton: function () {
			if (typeof sap.hybrid !== 'undefined') {
				sap.hybrid.refreshStore();
			}
		},

		onFlushButton: function () {
			// syncclocktimer = 300;
			let date = new Date();
			date.setDate(date.getDate() - 14)
			var dateFrom1 = date;
			date = new Date()
			var dateTo1 = date;
			var now1 = dateFrom1
			var then1 = dateTo1
			if (this.selectedTab == "quickEntry" && !isProcessStarted) {
				this.synchronizeOfflineRecordsToBackend(now1, then1, date)
			}
			else if (this.selectedTab == "eventList" && !isProcessStarted) {
				this.synchronizeOfflineRecordsToBackend(now1, then1, this.selectedDate)
			}

		},
		/**
		 * Handled for time picker control to stop clock the moment when user change time
		 * @public
		 */
		handleChange: function () {
			if (this.setTimeIntervalDetails) {
				clearInterval(this.setTimeIntervalDetails);
				this.setTimeIntervalDetails = null;
			}
		},
		/**
		 * Handled for calendar control to load time events within that period
		 * @public
		 */
		onStartDateChange: function (oEvent) {
			var date = new Date();
			if (sap.ui.Device.system.phone === true) {
				this.dateFrom = new Date(oEvent.getParameters().dateRange.getStartDate());
				date = oEvent.getParameters().dateRange.getEndDate();
			} else {
				this.dateFrom = new Date(this.calendar.getStartDate());
				date.setYear(this.calendar.getStartDate().getFullYear());
				date.setMonth(this.byId('calendar').getStartDate().getMonth() + 2, 0);
			}
			this.dateTo = date;
			if (!(this.selectedDate >= this.dateFrom && this.selectedDate <= this.dateTo)) {
				this.selectedDate = this.dateFrom;
			}
			this.getEvents(this.dateFrom);

		},
		/* =========================================================== */
		/* functions used by application                               */
		/* =========================================================== */
		/**
		 * Called when application loads time evaluation messages.
		 * @public
		 */
		getTimeEvalMessages: function (empID) {
			var that = this;
			var oModel = new sap.ui.model.json.JSONModel();
			var filt = new sap.ui.model.Filter({
				path: "Pernr",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: empID
			});
			var f = [];
			f.push(filt);
			var mParameters = {
				filters: f,
				success: function (oData) {
					var a = oData.results;
					for (var i = 0; i < a.length; i++) {
						var dateString = sap.ui.core.format.DateFormat.getDateInstance({
							style: "medium"
						}).format(a[i].MessageDate);
						a[i].DispDate = dateString;
					}
					if (a.length > 0) {
						that.byId("messages").setEnabled(true);
						that.byId("messages").setText(that.oBundle.getText("messages", [a.length]));
					} else {
						that.byId("messages").setEnabled(false);
						that.byId("messages").setText(that.oBundle.getText("messagesText"));
					}
					oModel.setData(a);
					that.setModel(oModel, "Messages");
				},
				error: function (oError) {
					that.processError(oError);
				}
			};
			// this.oDataModel
			// 	.read(
			// 		"/MessageSet",
			// 		mParameters);
		},
		/**
		 * Called when application loads time events.
		 * @public
		 */
		getEvents: function (date) {
			// Below code is in the custom online version of time event app
			// var that = this;
			// this.byId("idEventsTable").setBusy(true);
			// var a = new sap.ui.model.Filter({
			// 	path: "EventDate",
			// 	operator: sap.ui.model.FilterOperator.EQ,
			// 	value1: this.oFormatYyyymmdd.format(date)
			// });
			// var b = new sap.ui.model.Filter({
			// 	path: "EmployeeID",
			// 	operator: sap.ui.model.FilterOperator.EQ,
			// 	value1: this.empID
			// });
			// var f = [];
			// f.push(a);
			// f.push(b);
			// // var o = "EventTime";
			// var oModel = new sap.ui.model.json.JSONModel();
			// var mParameters = {
			// 	filters: f, // your Filter Array
			// 	// orderby: o,
			// 	success: function (oData, oResponse) {
			// 		that.byId("idEventsTable").setBusy(false);
			// 		var a = oData;
			// 		that.timeEvents = a;
			// 		var removeIndices = [];
			// 		for (var i = 0; i < a.results.length; i++) {
			// 			try {
			// 				var date1 = new Date(a.results[i].EventDate);
			// 				var date2 = new Date(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate());
			// 				date = date2;
			// 			} catch (o) {
			// 				date = new Date(a.results[i].EventDate);
			// 			}
			// 			a.results[i].EventDate = date;
			// 			switch (a.results[i].Status) {
			// 				case "APPROVED":
			// 					a.results[i].State = "Success";
			// 					break;
			// 				case "POSTED":
			// 					a.results[i].State = "Success";
			// 					break;
			// 				case "REJECTED":
			// 					a.results[i].State = "Error";
			// 					break;
			// 				case "SENT":
			// 					a.results[i].State = "Warning";
			// 					break;
			// 				case "HOLIDAY":
			// 					removeIndices.push(i);
			// 					break;
			// 				case "NONWORKING":
			// 					removeIndices.push(i);
			// 					break;
			// 			}
			// 			if (that.configuration.ModifyAllowed === "X") {
			// 				a.results[i].ActionModify = "X";
			// 			}
			// 			if (that.configuration.DeleteAllowed === "X") {
			// 				a.results[i].ActionDelete = "X";
			// 			}
			// 			switch (a.results[i].Origin) {
			// 				case "E":
			// 					a.results[i].type = "Inactive";
			// 					a.results[i].change = true;
			// 					break;
			// 				case "":
			// 				case "S":
			// 					if (that.configuration.ModifySubsystem !== undefined &&
			// 						that.configuration.ModifySubsystem == 'X') {
			// 						a.results[i].type = "Inactive";
			// 						a.results[i].change = true;
			// 					} else {
			// 						a.results[i].type = "Inactive";
			// 						a.results[i].change = false;
			// 						// a.results[i].type = "Inactive";
			// 					}
			// 					break;
			// 				default:
			// 					a.results[i].type = "Inactive";
			// 					a.results[i].change = false;
			// 					// a.results[i].type = "Inactive";
			// 					break;
			// 			}
			// 		}
			// 		if (removeIndices) {
			// 			for (var r = removeIndices.length - 1; r >= 0; r--) {
			// 				a.results.splice(removeIndices[r], 1);
			// 			}
			// 		}
			// 		oModel.setData(a.results);
			// 		var oSorter1 = new sap.ui.model.Sorter("EventTime/ms", true, false);
			// 		that.byId('idEventsTable').setModel(oModel, "timeEventList");
			// 		that.byId('idEventsTable').getBinding("items").sort(oSorter1);
			// 		var tabEntryList = that.byId("idEventsTable").getItems();
			// 		for (var k = 0; k < tabEntryList.length; k++) {
			// 			if (a.results[k].Origin !== "E" || a.results[k].ActionDelete !== "X") {
			// 				if (tabEntryList[k].getDeleteControl()) {
			// 					tabEntryList[k].getDeleteControl().setVisible(false);
			// 				} else {
			// 					tabEntryList[k].getDeleteControl(event).setVisible(false);
			// 				}
			// 			} else {
			// 				if (tabEntryList[k].getDeleteControl()) {
			// 					tabEntryList[k].getDeleteControl().setVisible(true);
			// 				} else {
			// 					tabEntryList[k].getDeleteControl(event).setVisible(true);
			// 				}
			// 			}
			// 		}
			// 		if (that.NoCalendarInit === "true") {
			// 			that.NoCalendarInit = "false";
			// 		} else {
			// 			that.initCalendar(that.empID);
			// 		}
			// 	},
			// 	error: function (oError) {
			// 		that.byId("idEventsTable").setBusy(false);
			// 		that.processError(oError);
			// 	}
			// };
			// this.oDataModel
			// 	.read(
			// 		"/TimeEventSet",
			// 		mParameters);



			var that = this;
			var dt = date;
			var newDate = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
			var date1 = '/Date(' + newDate.getTime() + ')/';
			let currDate = new Date();
			let firstDay = new Date(currDate.getFullYear(), currDate.getMonth() - 1, 1).toISOString();
			let lastDay = new Date(currDate.getFullYear(), currDate.getMonth() + 1, 0).toISOString();

			var a = new sap.ui.model.Filter({
				path: "EventDate",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: date
				// value1: this.oFormatYyyymmdd.format(date)
			});

			var f = [];
			f.push(a);
			var oType = new sap.ui.model.odata.type.DateTime({ pattern: { style: 'long', UTC: 'false' } });
			oType.formatValue(new Date(), 'string');
			db.find({ module: "TimeEventSetIndividual", EventDate: date1 }, function (err, data) {
				var oModel = new sap.ui.model.json.JSONModel();
				a.results = data;

				for (var i = 0; i < a.results.length; i++) {
					switch (a.results[i].Status) {
						case "APPROVED":
							a.results[i].State = "Success";
							break;
						case "POSTED":
							a.results[i].State = "Success";
							break;
						case "REJECTED":
							a.results[i].State = "Error";
							break;
						case "SENT":
							a.results[i].State = "Warning";
							break;
					}

					if (a.results[i].EventDate !== "" && a.results[i].EventDate !== null && a.results[i].EventDate !== undefined) {
						if (a.results[i].EventDate !== 0) {
							var nowdate = new Date(parseInt(a.results[i].EventDate.substr(6)));
							a.results[i].EventDate = nowdate;
							var t = a.results[i].EventTime;
							let mins = t.substring(t.indexOf("H") + 1, t.indexOf("M"));
							mins = mins <= 9 ? (0 + mins) : (mins)
							let seconds = t.substring(t.indexOf("M") + 1, t.indexOf("S"));
							seconds = seconds <= 9 ? (0 + seconds) : (seconds)
							var t1 = t.substring(t.indexOf("T") + 1, t.indexOf("H")) + ':' + mins + ':' + seconds;
							var hours = t1.substring(0, t1.indexOf(':'));
							if (hours >= 12) {
								if (hours == 12) {
									t1 = hours + ':' + mins + ':' + seconds + " PM";
								}
								else {
									t1 = hours - 12 + ':' + mins + ':' + seconds + " PM";
								}
							}
							else {
								t1 = (t1.substring(0, t1.indexOf(":")) == '0' ? '12' : t1.substring(0, t1.indexOf(":"))) + t1.substring(t1.indexOf(":"), t1.length)
								t1 = t1 + " AM";
							}
							a.results[i].EventTime = t1;
							a.results[i].timerforsort = parseInt((hours * 60 * 60) + (mins * 60) + seconds)
						} else {
							// a.results[i].EventTime = "";
						}
					}
					a.results[i].type = "Inactive";
				}//closing for loop
				a.results.sort((one, two) => {
					return two.timerforsort - one.timerforsort
				})
				that.getView().byId("idEventsTable").setModel(new sap.ui.model.json.JSONModel(a.results));
				that.getView().byId("idEventsTable1").setModel(new sap.ui.model.json.JSONModel(a.results));
				that.byId('idEventsTable').setModel(oModel, "timeEventList");
				that.initCalendar("");
			});
		},
		/**
		 * Called when application load time event types.
		 * @public
		 */
		getEventTypes: function (oPernr) {
			var that = this;
			//Replaced the code with local DB Read
			// var a = new sap.ui.model.Filter({
			// 	path: "EmployeeID",
			// 	operator: sap.ui.model.FilterOperator.EQ,
			// 	value1: this.empID
			// });
			// var f = [];
			// f.push(a);
			// var oModel = new sap.ui.model.json.JSONModel();
			// var mParameters = {
			// 	filters: f, // Filter Array
			// 	success: function (oData, oResponse) {
			// 		var a = oData;
			// 		var oFavorites = that.getModel('FavoritesSet').getData();
			// 		for (var i = 0; i < oFavorites.length; i++) {
			// 			for (var j = 0; j < a.results.length; j++) {
			// 				if (oFavorites[i].Subtype == a.results[j].TimeType) {
			// 					a.results[j].selected = true;
			// 				}
			// 			}
			// 		}
			// 		oModel.setData(a.results);
			// 		that.setGlobalModel(oModel, "eventTypeModel");
			// 		that.setModel(oModel, "timeEventType");
			// 	},
			// 	error: function (oError) {
			// 		that.processError(oError);
			// 	}
			// };

			// this.oDataModel
			// 	.read(
			// 		"/TimeEventTypeSet",
			// 		mParameters);

			db.findOne({ module: "TimeEventTypeSet" }, function (err, data) {

				function sortFunc(a, b) {
					// var sortingArr = [ 'b', 'c', 'b', 'b', 'c', 'd' ];
					// var order = ["Clock-in", "Start of break", "End of break", "Clock-out"];
					var order = ["P10", "P15", "P25", "P20"];
					return order.indexOf(a.TimeType) - order.indexOf(b.TimeType);
				}
				data.TimeEventTypeSet.sort(sortFunc);
				that.getView().byId("favList").setModel(new sap.ui.model.json.JSONModel(data.TimeEventTypeSet));

			});
		},
		/**
		 * Called when calendar loads legends.
		 * @public
		 */

		initCalendarLegend: function () {
			if (this.legend) {
				this.legend.addItem(new sap.ui.unified.CalendarLegendItem({
					text: this.oBundle.getText("approved"),
					type: sap.ui.unified.CalendarDayType.Type08
				}));
				this.legend.addItem(new sap.ui.unified.CalendarLegendItem({
					text: this.oBundle.getText("rejected"),
					type: sap.ui.unified.CalendarDayType.Type03
				}));
				this.legend.addItem(new sap.ui.unified.CalendarLegendItem({
					text: this.oBundle.getText("sent"),
					type: sap.ui.unified.CalendarDayType.Type00
				}));
			}
			if (this.mlegend) {
				this.mlegend.addItem(new sap.ui.unified.CalendarLegendItem({
					text: this.oBundle.getText("approved"),
					type: sap.ui.unified.CalendarDayType.Type08
				}));
				this.mlegend.addItem(new sap.ui.unified.CalendarLegendItem({
					text: this.oBundle.getText("rejected"),
					type: sap.ui.unified.CalendarDayType.Type03
				}));
				this.mlegend.addItem(new sap.ui.unified.CalendarLegendItem({
					text: this.oBundle.getText("sent"),
					type: sap.ui.unified.CalendarDayType.Type00
				}));
			}

		},

		/**
		 * Called when calendar is initialized.
		 * @public
		 */

		initCalendar: function (Pernr) {
			var that = this;
			var f = [];
			var a = new sap.ui.model.Filter({
				path: "EmployeeID",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: Pernr
			});
			var b = new sap.ui.model.Filter({
				path: "DateFrom",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.dateFrom
			});
			var c = new sap.ui.model.Filter({
				path: "DateTo",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.dateTo
			});
			f.push(a);
			if (this.dateFrom && this.dateTo) {
				f.push(b);
				f.push(c);
			}

			//Below code is standard and to be adjusted for non working day display	
			// var that = this;
			// var f = [];
			// var a = new sap.ui.model.Filter({
			// 	path: "EmployeeID",
			// 	operator: sap.ui.model.FilterOperator.EQ,
			// 	value1: Pernr
			// });
			// var b = new sap.ui.model.Filter({
			// 	path: "DateFrom",
			// 	operator: sap.ui.model.FilterOperator.EQ,
			// 	value1: this.dateFrom
			// });
			// this.dateTo.setUTCDate(this.dateTo.getUTCDate() + 1);
			// var c = new sap.ui.model.Filter({
			// 	path: "DateTo",
			// 	operator: sap.ui.model.FilterOperator.EQ,
			// 	value1: this.dateTo
			// });
			// f.push(a);
			// if (this.dateFrom && this.dateTo) {
			// 	f.push(b);
			// 	f.push(c);
			// }

			// var mParameters = {
			// 	filters: f, // Filter Array
			// 	success: function (oData, oResponse) {
			// 		that.calendar.removeAllSpecialDates();
			// 		that.mCalendar.removeAllSpecialDates();
			// 		var a = oData;
			// 		var date;
			// 		for (var i = 0; i < a.results.length; i++) {
			// 			try {
			// 				var date1 = new Date(a.results[i].EventDate);
			// 				var date2 = new Date(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate());
			// 				date = date2;
			// 			} catch (o) {
			// 				date = new Date(a.results[i].EventDate);
			// 			}
			// 			a.results[i].EventDate = date;
			// 			switch (a.results[i].Status) {
			// 				case "APPROVED":
			// 					a.results[i].Type = sap.ui.unified.CalendarDayType.Type08;
			// 					a.results[i].Tooltip = that.oBundle.getText("approved");
			// 					break;
			// 				case "POSTED":
			// 					a.results[i].Type = sap.ui.unified.CalendarDayType.Type08;
			// 					a.results[i].Tooltip = that.oBundle.getText("approved");
			// 					break;
			// 				case "REJECTED":
			// 					a.results[i].Type = sap.ui.unified.CalendarDayType.Type03;
			// 					a.results[i].Tooltip = that.oBundle.getText("rejected");
			// 					break;
			// 				case "SENT":
			// 					a.results[i].Type = sap.ui.unified.CalendarDayType.Type00;
			// 					a.results[i].Tooltip = that.oBundle.getText("sent");
			// 					break;
			// 				case "HOLIDAY":
			// 					a.results[i].Type = sap.ui.unified.CalendarDayType.Type09;
			// 					if (a.results[i].StatusText != "") {
			// 						a.results[i].Tooltip = a.results[i].StatusText;
			// 					} else {
			// 						a.results[i].Tooltip = that.oBundle.getText("holiday");
			// 					}
			// 					break;
			// 				case "NONWORKING":
			// 					a.results[i].Type = sap.ui.unified.CalendarDayType.NonWorking;
			// 					a.results[i].Tooltip = that.oBundle.getText("nonworking");
			// 					break;
			// 			}
			// 			that.calendar.addSpecialDate(new sap.ui.unified.DateTypeRange({
			// 				startDate: new Date(a.results[i].EventDate),
			// 				type: a.results[i].Type,
			// 				tooltip: a.results[i].Tooltip
			// 			}));
			// 			that.mCalendar.addSpecialDate(new sap.ui.unified.DateTypeRange({
			// 				startDate: new Date(a.results[i].EventDate),
			// 				type: a.results[i].Type,
			// 				tooltip: a.results[i].Tooltip
			// 			}));

			// 		}
			// 		that.calendar.setBusy(false);
			// 	},
			// 	error: function (oError) {
			// 		that.calendar.setBusy(false);
			// 		that.processError(oError);
			// 	}
			// };
			// this.byId('calendar').setBusy(true);
			// this.oDataModel
			// 	.read(
			// 		"/TimeEventSet",
			// 		mParameters);
		},
		/**
		 * Called when application is busy in loading data.
		 * @public
		 */

		showBusy: function () {
			this._nCounter++;
			if (this._nCounter === 1) {
				this.busyDialog.open();
			}
		},

		/**
		 * Called when application loads the data.
		 * @public
		 */

		hideBusy: function (forceHide) {
			if (this._nCounter === 0) {
				return;
			}
			this._nCounter = forceHide ? 0 : Math.max(0,
				this._nCounter - 1);
			if (this._nCounter > 0) {
				return;
			}
			this.busyDialog.close();
		},
		/**
		 * Called when application loads configuration details.
		 * @public
		 */
		getConfiguration: function () {
			var that = this;
			//Replaced code below with local DB Find
			// var oModel = new sap.ui.model.json.JSONModel();
			// this.setGlobalModel(oModel, "configurationModel");
			// var that = this;
			// this.showBusy();
			// var b = new sap.ui.model.Filter({
			// 	path: "EmployeeID",
			// 	operator: sap.ui.model.FilterOperator.EQ,
			// 	value1: this.empID
			// });
			// var f = [];
			// f.push(b);
			// var mParameters = {
			// 	filters: f, // your Filter Array
			// 	success: function (data) {
			// 		//attempt to release Busy Dialog
			// 		that.hideBusy();
			// 		oModel.setData(data.results[0]);
			// 		that.configuration = data.results[0];
			// 		that.getView().setModel(oModel, "configurationModel");
			// 		that.byId("idTimeEventType").setSelectedKey(that.configuration.DefaultEvent);
			// 		that.onSelectionChange(null, that.configuration.DefaultEvent);
			// 		that.byId("approver").setValue(that.configuration.ApproverName);
			// 		that.approverIdSelected = that.configuration.ApproverId;
			// 		var curDate = new Date();
			// 		if (that.configuration.CreateAllowed) {
			// 			if (!that.configuration.PresentDayFlag) {
			// 				that.byId("save").setEnabled(false);
			// 			} else {
			// 				that.byId("save").setEnabled(true);
			// 			}
			// 		} else {
			// 			that.byId("save").setEnabled(false);
			// 		}
			// 		if (that.configuration.PresentDayFlag) {
			// 			if (that.configuration.CreateAllowed) {
			// 				that.byId("save").setEnabled(true);
			// 			} else {
			// 				that.byId("save").setEnabled(false);
			// 			}
			// 		} else {
			// 			if (that.configuration.CreateAllowed) {
			// 				that.byId("save").setEnabled(true);
			// 			} else {
			// 				that.byId("save").setEnabled(false);
			// 			}
			// 		}
			// 		that.byId("datePicker").setDateValue(new Date());
			// 		// }
			// 		if (that.configuration.TimeReadOnly) {
			// 			that.byId("timePicker").setEnabled(false);
			// 			that.byId("timePicker").setDateValue(new Date());
			// 		} else {
			// 			that.byId("timePicker").setEnabled(true);
			// 			that.byId("timePicker").setDateValue(new Date());
			// 		}
			// 		//replace once the model changes
			// 		if (that.configuration.ApproverReadOnly === 'X') {
			// 			that.byId("approver").setEnabled(false);
			// 		} else {
			// 			that.byId("approver").setEnabled(true);
			// 		}
			// 		if (that.configuration.NoticeVisible === 'X') {
			// 			that.byId("comments").setVisible(true);
			// 			that.byId("commentsLableId").setVisible(true);
			// 		} else {
			// 			that.byId("comments").setVisible(false);
			// 			that.byId("commentsLableId").setVisible(false);
			// 		}
			// 		if (that.configuration.ApproverVisible === 'X') {
			// 			that.byId("approver").setVisible(true);
			// 			that.byId("approverLableId").setVisible(true);
			// 		} else {
			// 			that.byId("approver").setVisible(false);
			// 			that.byId("approverLableId").setVisible(false);
			// 		}

			// 		//Allow deletions or not
			// 		if (!that.configuration.DeleteAllowed) {
			// 			that.byId("idEventsTable").setMode("None");
			// 		}
			// 	},
			// 	error: function (oError) {
			// 		that.hideBusy();
			// 		that.processError(oError);
			// 	}
			// };
			// this.oDataModel.read(
			// 	"/ConfigurationSet",
			// 	mParameters);

			db.find({ module: "ConfigurationSet" }, function (err, data) {
				var oModel = new sap.ui.model.json.JSONModel();
				var oData = data[0].ConfigurationSet[0];

				oModel.setData(oData);
				that.setModel(oModel, "ConfigurationSet");
				that.setGlobalModel(oModel, "configurationModel");
				that.setModel(oModel, "configurationModel");
				that.byId("idEventsTable").setMode("None");
				that.configuration = oData;
				that.empID = that.configuration.EmployeeID;
				that.onSelectionChange(null, that.configuration.DefaultEvent);
				that.byId("approver").setValue(that.configuration.ApproverName);
				that.approverIdSelected = that.configuration.ApproverId;
				var curDate = new Date();
				that.byId("datePicker").setDateValue(new Date());
				if (that.configuration.TimeReadOnly) {
					that.byId("timePicker").setEnabled(false);
					that.byId("timePicker").setDateValue(new Date());
				} else {
					that.byId("timePicker").setEnabled(true);
					that.byId("timePicker").setDateValue(new Date());
				}
				//replace once the model changes
				if (that.configuration.ApproverReadOnly === 'X') {
					that.byId("approver").setEnabled(false);
				} else {
					that.byId("approver").setEnabled(true);
				}
				if (that.configuration.NoticeVisible === 'X') {
					that.byId("comments").setVisible(true);
					that.byId("commentsLableId").setVisible(true);
				} else {
					that.byId("comments").setVisible(false);
					that.byId("commentsLableId").setVisible(false);
				}
				if (that.configuration.ApproverVisible === 'X') {
					that.byId("approver").setVisible(true);
					that.byId("approverLableId").setVisible(true);
				} else {
					that.byId("approver").setVisible(false);
					that.byId("approverLableId").setVisible(false);
				}
				//Allow deletions or not
				if (!that.configuration.DeleteAllowed) {
					that.byId("idEventsTable").setMode("None");
				}

			})
		},


		getRandomString: function (length) {
			var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
			var result = '';
			for (var i = 0; i < length; i++) {
				result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
			}
			return result;
		},

		/**
		 * Called when user create time event.
		 * @public
		 */

		createTimeEventMob: function (isFav, customData) {
			var oServiceURI = this.getOwnerComponent().getMetadata().getManifestEntry("sap.app").dataSources["timeEventService"].uri;
			var latitude, longitude;
			var that = this;
			var date = new Date();
			let query = { module: 'GeoCoordinates' }
			//Querying local database for geocoordinates stored
			db.findOne(query, function (err, data) {
				if (err) {
					console.log("Error in identifying the time event set individual records", err)
				} else if (data) {
					latitude = data.latitude;
					longitude = data.longitude;
					if (isFav) {
						// var obj = this.createPostObject('F', customData);
						var time = that.formatTimeString(new Date());
						/* 				var time = sap.ui.core.format.DateFormat.getTimeInstance({
											style: "medium"
										}).format(new Date()); */
						// var eventDate = this.formatDateTimeString(customData.date);

						//code for local database date format started
						var eventDate = customData.date;
						var dt = eventDate;
						var newDate = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
						var eventDate = '/Date(' + newDate.getTime() + ')/';
						//code for local database date format ended

						var timezoneOffset = customData.date.getTimezoneOffset() / (-60);
						// var timeType = customData.Subtype;
						var timeType = customData.TimeType;
						var timeTypeText = customData.TimeTypeText;
						var employeeId = customData.EmployeeID;
						let currentDate = new Date();
						var dateParse = sap.ui.core.format.DateFormat.getDateInstance({
							pattern: "yyyyMMddhhmmss"
						});
						let timeStampToAppend = dateParse.format(currentDate);
						var appStatus;
						if (navigator.onLine || window.networkStatus === 'Online') {
							appStatus = "D".concat(navigator.platform.substr(0, 1), "ONL") + timeStampToAppend;
						}
						else {
							appStatus = "D".concat(navigator.platform.substr(0, 1), "OFL") + timeStampToAppend;
						}
						var punchType = timeType + timeStampToAppend;
						// var employeeId = this.byId("empID").getText();
						timezoneOffset = timezoneOffset.toFixed(2);
						let oshostname = localStorage.getItem('osHostName');
						var lat = latitude.toString();
						var longit = longitude.toString();
						let randomString = that.getRandomString(4)
						var obj = {
							EmployeeID: employeeId,
							EventDate: eventDate,
							EventTime: time,
							TimeType: timeType,
							TimeTypeText: timeTypeText,
							TimezoneOffset: timezoneOffset.toString(),
							CUSTOMER01: lat.length > 20 ? lat.substring(0.20) : lat,
							CUSTOMER02: longit.length > 20 ? longit.substring(0.20) : longit,
							CUSTOMER05: appStatus.length > 20 ? appStatus.substring(0, 20) : appStatus,
							CUSTOMER06: punchType.length > 20 ? punchType.substring(0, 20) : punchType,
							CUSTOMER07: oshostname.length > 20 ? oshostname.substring(0, 20) : oshostname,
							AddTerminalID: randomString,
							TerminalId: randomString,
							Note: punchType.length > 20 ? punchType.substring(0, 20) : punchType
						};
						that.selectedDate = new Date();
						date.setMonth(date.getMonth() - 1, 1);
						that.dateFrom = date;
						date = new Date();
						if (sap.ui.Device.system.desktop === true) {
							date.setMonth(that.byId('calendar').getStartDate().getMonth() + 2, 0);
						} else {
							date.setMonth(that.byId('calendar').getStartDate().getMonth() + 1, 0);
						}
						that.dateTo = date;
					} else {
						var obj = that.createPostObject('C');
						date.setMonth(that.getSelectedDate().getMonth() - 1, 1);
						date.setYear(that.getSelectedDate().getFullYear());
						that.dateFrom = date;
						date = new Date();
						date.setYear(that.getSelectedDate().getFullYear());
						if (sap.ui.Device.system.desktop === true) {
							date.setMonth(that.getSelectedDate().getMonth() + 2, 0);
						} else {
							date.setMonth(that.getSelectedDate().getMonth() + 1, 0);
						}
						that.dateTo = date;
					}

					// var newDate = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours(), dt.getMinutes(), dt.getSeconds(), dt.getMilliseconds()));
					// var date1 = '/Date(' + newDate.getTime() + ')/';

					//Inserting the timeevents set records as offline initially and update the status when the record is posted to backend.
					db.insert({ module: 'TimeEventSetIndividual', isSynced: false, isPosted: false, ...obj }, function (err, entities) {
						if (err) {
							console.log("Error in inserting TimeEventSetIndividual", err)
						} else if (entities) {
							that.busyDialog.close();
							//Online record creation attempt
							// if (navigator.onLine || 1) {
							var oDataModel = new sap.ui.model.odata.v2.ODataModel({
								serviceUrl: oServiceURI + '/odata/SAP/HCMFAB_MYTIMEEVENTS_SRV',
								useBatch: false,
								headers: {
									Authorization: "Bearer " + localStorage.getItem('token'),
									Accept: "*/*"
								}
							});
							let payload = entities;
							let id = payload._id;
							delete payload.module;
							delete payload.isSynced;
							delete payload._id;
							delete payload.isPosted;
							delete payload.isProcessing;

							//>>>> Check if the Sync In Process Flag is in Progress and then call to Server
							//- If Online, Call to Server 
							if (!isProcessStarted && navigator.onLine) {

								//Adding isProcessing Flag to indicate that the record is being in the process of syncing to backend.
								db.update({ _id: id }, { $set: { isProcessing: true } }, function (err, numReplaced) {
									if (err) {
										console.log('Error in updating the isProcessing Flag for TimeEventSet', err)
									}
									else if (numReplaced) {
										console.log('Replacing of records with is isProcessing Flag is success===> true', numReplaced)
										isProcessStarted = true;
										oDataModel.create("/TimeEventSet", payload, {
											success: function (oData, oResponse) {
												// await new Promise((resolve, reject) => {
												//Updating the isProcessing Flag to indicate that the record is processed.
												isProcessStarted = false;
												db.update({ _id: id, isSynced: false }, { $set: { isSynced: true, isPosted: false, isProcessing: false } }, function (err, numReplaced) {
													console.log('Replacing of records with is isProcessing Flag is success inside success callback===> false', numReplaced)
													if (err) {
														console.log("Error in Finding offline Records", err);
													}
												});
												// })
											},
											error: function (err) {
												console.log(err);
												//Updating the isProcessing Flag to indicate that the record is processed.
												db.update({ _id: id, isSynced: false }, { $set: { isProcessing: false } },
													function (err, numReplaced) {
														if (err) {
															console.log("Error in Finding offline Records", err);
															// reject();
														}
													});
											}

										});
									}
								})
							}

							// }
							//Online record creation attempt end
							that.hideBusy();
							var toastMsg = that.oBundle.getText("timeEventCreated");
							sap.m.MessageToast.show(toastMsg, {
								duration: 3000
							});
							if (sap.ui.Device.system.phone === true) {
								that.mCalendar.setDateValue(that.selectedDate);
							} else {

								that.calendar.removeAllSelectedDates();
								that.calendar.addSelectedDate(new sap.ui.unified.DateRange({
									startDate: that.selectedDate,
									endDate: that.selectedDate
								}));
								that.calendar.focusDate(that.selectedDate);
								that.calendar.fireStartDateChange();
							}
							that.getEvents(that.selectedDate);
						}

					});


				}
			})
			// this.showBusy();
		},
		/**
		 * Called when user create time event.
		 * @public
		 */

		createTimeEvent: function (isFav, customData) {
			var that = this;
			var date = new Date();
			// this.showBusy();
			if (isFav) {
				var obj = this.createPostObject('F', customData);
				this.selectedDate = new Date();
				date.setMonth(date.getMonth(), 1);
				this.dateFrom = date;
				date = new Date();
				if (sap.ui.Device.system.desktop === true) {
					date.setMonth(this.byId('calendar').getStartDate().getMonth() + 2, 0);
				} else {
					date.setMonth(this.byId('calendar').getStartDate().getMonth() + 1, 0);
				}
				this.dateTo = date;
			} else {
				var obj = this.createPostObject('C');
				date.setMonth(this.getSelectedDate().getMonth(), 1);
				date.setYear(this.getSelectedDate().getFullYear());
				this.dateFrom = date;
				date = new Date();
				date.setYear(this.getSelectedDate().getFullYear());
				if (sap.ui.Device.system.desktop === true) {
					date.setMonth(this.getSelectedDate().getMonth() + 2, 0);
				} else {
					date.setMonth(this.getSelectedDate().getMonth() + 1, 0);
				}
				this.dateTo = date;
			}
			this.oDataModel
				.create("/TimeEventSet", obj, {
					success: function (oData, oResponse) {
						that.hideBusy();
						var toastMsg = that.oBundle.getText("timeEventCreated");
						sap.m.MessageToast.show(toastMsg, {
							duration: 1000
						});

						if (sap.ui.Device.system.phone === true) {
							that.mCalendar.setDateValue(that.selectedDate);
						} else {

							that.calendar.removeAllSelectedDates();
							that.calendar.addSelectedDate(new sap.ui.unified.DateRange({
								startDate: that.selectedDate,
								endDate: that.selectedDate
							}));
							that.calendar.focusDate(that.selectedDate);
							that.calendar.fireStartDateChange();
						}
						that.getEvents(that.selectedDate);
					},
					error: function (oError) {
						that.hideBusy();
						that.processError(oError);
					}
				});
		},
		/**
		 * Handled when user clicks on Save button 
		 * @public
		 */

		onSave: function (oEvent) {
			/**
			 * @ControllerHook Change the implementation on click of the Create button
			 * This hook method can be used to change the implementation on click of the Create button
			 * It is called on click of the Create button
			 * @callback hcm.cico.view.S1~extHookOnCreate
			 */
			if (this.extHookOnCreate) {
				this.extHookOnCreate();
			} else {
				var that = this;
				this.byId("idTimeEventType").setValueState("None");
				this.byId("datePicker").setValueState("None");
				this.byId("timePicker").setValueState("None");
				this.oMessageManager.removeAllMessages();
				if (this.setTimeIntervalDetails) {
					clearInterval(this.setTimeIntervalDetails);
				}
				if (this.byId("idTimeEventType").getSelectedKey() === "" || this.byId("datePicker").getValue() === "" || this.byId("timePicker").getValue() ===
					"") {
					if (this.byId("idTimeEventType").getSelectedKey() === "") {
						this.byId("idTimeEventType").setValueState("Error");
						var oFieldname = this.byId('idTimeEventType').getParent().getLabel();
						this.oErrorHandler.pushError(that.oBundle.getText("invalidEntry"), this.oMessageManager, this.oMessageProcessor, oFieldname);
						this.byId('messageInd').firePress();
					}
					if (this.byId("datePicker").getValue() === "") {
						this.byId("datePicker").setValueState("Error");
						var oFieldname = this.byId('datePicker').getParent().getLabel();
						this.oErrorHandler.pushError(that.oBundle.getText("invalidEntry"), this.oMessageManager, this.oMessageProcessor, oFieldname);
					}
					if (this.byId("timePicker").getValue() === "") {
						this.byId("timePicker").setValueState("Error");
						var oFieldname = this.byId('timePicker').getParent().getLabel();
						this.oErrorHandler.pushError(that.oBundle.getText("invalidEntry"), this.oMessageManager, this.oMessageProcessor, oFieldname);
					}

				} else {
					// displays details about the time event
					for (var i = 0; i < this.byId("ADD_FIELDS").getFormElements().length; i++) {
						this.byId("ADD_FIELDS").getFormElements()[i].getFields()[0].setValueState("None");
						if (this.byId("ADD_FIELDS").getFormElements()[i].getFields()[0].getVisible()) {
							if (this.byId("ADD_FIELDS").getFormElements()[i].getFields()[0].getRequired() && this.byId("ADD_FIELDS").getFormElements()[i].getFields()[
								0].getValue() === "") {
								this.byId("ADD_FIELDS").getFormElements()[i].getFields()[0].setValueState("Error");
								oFieldname = this.byId("ADD_FIELDS").getFormElements()[i].getFields()[0].getCustomData()[2].getValue();
								this.oErrorHandler.pushError(this.oBundle.getText("invalidEntry"), this.oMessageManager, this.oMessageProcessor, oFieldname);
								this.byId("messageInd").firePress();
								return;
							}
						} else if (this.byId("ADD_FIELDS").getFormElements()[i].getFields()[1].getVisible()) {
							if (this.byId("ADD_FIELDS").getFormElements()[i].getFields()[1].getRequired() && this.byId("ADD_FIELDS").getFormElements()[i].getFields()[
								1].getValue() === "") {
								this.byId("ADD_FIELDS").getFormElements()[i].getFields()[1].setValueState("Error");
								oFieldname = this.byId("ADD_FIELDS").getFormElements()[1].getFields()[1].getCustomData()[2].getValue();
								this.oErrorHandler.pushError(this.oBundle.getText("invalidEntry"), this.oMessageManager, this.oMessageProcessor, oFieldname);
								this.byId("messageInd").firePress();
								return;
							}

						} else if (this.byId("ADD_FIELDS").getFormElements()[
							i].getFields()[2].getVisible()) {
							if (this.byId("ADD_FIELDS").getFormElements()[i].getFields()[2].getRequired() && this.byId("ADD_FIELDS").getFormElements()[i].getFields()[
								2].getValue() === "") {
								this.byId("ADD_FIELDS").getFormElements()[i].getFields()[2].setValueState("Error");
								oFieldname = this.byId("ADD_FIELDS").getFormElements()[i].getFields()[2].getCustomData()[2].getValue();
								this.oErrorHandler.pushError(this.oBundle.getText("invalidEntry"), this.oMessageManager, this.oMessageProcessor, oFieldname);
								this.byId("messageInd").firePress();
								return;
							}

						} else if (this.byId("ADD_FIELDS").getFormElements()[i].getFields()[3].getVisible()) {
							if (this.byId("ADD_FIELDS").getFormElements()[i].getFields()[3].getRequired() && this.byId("ADD_FIELDS").getFormElements()[i].getFields()[
								3].getDateValue() === "") {
								this.byId("ADD_FIELDS").getFormElements()[i].getFields()[3].setValueState("Error");
								oFieldname = this.byId('ADD_FIELDS').getFormElements()[i].getFields()[3].getCustomData()[1].getValue();
								this.oErrorHandler.pushError(this.oBundle.getText("invalidEntry"), this.oMessageManager, this.oMessageProcessor, oFieldname);
								this.byId('messageInd').firePress();
								return;
							}
						} else if (this.byId('ADD_FIELDS').getFormElements()[i].getFields()[4].getVisible()) {
							if (this.byId('ADD_FIELDS').getFormElements()[i].getFields()[4].getRequired() && this.byId('ADD_FIELDS').getFormElements()[i].getFields()[
								4].getDateValue() === "") {
								this.byId('ADD_FIELDS').getFormElements()[i].getFields()[4].setValueState("Error");
								oFieldname = this.byId('ADD_FIELDS').getFormElements()[i].getFields()[4].getCustomData()[1].getValue();
								this.oErrorHandler.pushError(this.oBundle.getText("invalidEntry"), this.oMessageManager, this.oMessageProcessor, oFieldname);
								this.byId('messageInd').firePress();
								continue;
							}
						}
					}
					var timeformatter = sap.ui.core.format.DateFormat.getTimeInstance({
						pattern: this.byId("timePicker").getDisplayFormat()
					});
					var dateformatter = sap.ui.core.format.DateFormat.getDateInstance({
						pattern: this.byId("datePicker").getDisplayFormat()
					});
					var timeString = timeformatter.format(this.byId("timePicker").getDateValue());
					var dateString = dateformatter.format(this.byId("datePicker").getDateValue());
					var addInfo = [{
						label: this.oBundle.getText("eventType"),
						text: this.byId("idTimeEventType").getSelectedItem().getText()
					}, {
						label: this.oBundle.getText("date"),
						text: dateString
					}, {
						label: this.oBundle.getText("time"),
						text: timeString

					},

					];
					//set up the settings tab
					var oSettings = {
						showNote: false,
						title: this.oBundle.getText("submissionConfirmation"),
						confirmButtonLabel: this.oBundle.getText("OK"),
						additionalInformation: addInfo
					};
					//open confirmation popup
					this.openConfirmationPopup(oSettings, 'C', null);
				}
			}

		},
		/**
		 * Called when application to load data from UI.
		 * @public
		 */
		createPostObject: function (type, customData) {
			var timeformatter = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: this.byId("timePicker").getDisplayFormat()
			});
			var dateformatter = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: this.byId("datePicker").getDisplayFormat()
			});
			if (type === 'C') {
				var time = this.formatTimeString(this.byId("timePicker").getDateValue());
				var eventDate = this.formatDateTimeString(this.byId("datePicker").getDateValue());
				var timezoneOffset = this.byId("datePicker").getDateValue().getTimezoneOffset() / (-60);
				var timeType = this.byId("idTimeEventType").getSelectedKey();
				timezoneOffset = timezoneOffset.toFixed(2);
				this.selectedDate = this.byId("datePicker").getDateValue();
				this.setSelectedDate(this.selectedDate);
				var postObj = {
					EmployeeID: this.empID,
					EventDate: eventDate,
					EventTime: time,
					TimeType: timeType,
					TimezoneOffset: timezoneOffset.toString()
				};
				//Additional Fields
				for (var i = 0; i < this.byId('ADD_FIELDS').getFormElements().length; i++) {
					if (this.byId('ADD_FIELDS').getFormElements()[i].getFields()[0].getVisible()) {
						postObj[this.byId('ADD_FIELDS').getFormElements()[i].getFields()[0].getCustomData()[0].getValue()] = this.byId('ADD_FIELDS').getFormElements()[
							i].getFields()[0].getValue();
					} else if (this.byId('ADD_FIELDS').getFormElements()[i].getFields()[1].getVisible()) {
						postObj[this.byId('ADD_FIELDS').getFormElements()[i].getFields()[1].getCustomData()[0].getValue()] = this.byId('ADD_FIELDS').getFormElements()[
							i].getFields()[1].getValue();
					} else if (this.byId('ADD_FIELDS').getFormElements()[i].getFields()[2].getVisible()) {
						postObj[this.byId('ADD_FIELDS').getFormElements()[i].getFields()[2].getCustomData()[0].getValue()] = this.byId('ADD_FIELDS').getFormElements()[
							i].getFields()[2].getValue();
					} else if (this.byId('ADD_FIELDS').getFormElements()[i].getFields()[3].getVisible()) {
						if (this.byId('ADD_FIELDS').getFormElements()[i].getFields()[3].getDateValue()) {
							postObj[this.byId('ADD_FIELDS').getFormElements()[i].getFields()[3].getCustomData()[0].getValue()] = this.formatDateTimeString(
								this.byId('ADD_FIELDS').getFormElements()[
									i].getFields()[3].getDateValue());
						}
					} else if (this.byId('ADD_FIELDS').getFormElements()[i].getFields()[4].getVisible()) {
						if (this.byId('ADD_FIELDS').getFormElements()[i].getFields()[4].getDateValue()) {
							postObj[this.byId('ADD_FIELDS').getFormElements()[i].getFields()[4].getCustomData()[0].getValue()] = this.formatTimeString(this
								.byId('ADD_FIELDS').getFormElements()[
								i].getFields()[4].getDateValue());
						}
					}

				}

			} else if (type === 'F') {
				var time = this.formatTimeString(customData.date);
				var eventDate = this.formatDateTimeString(customData.date);
				var timezoneOffset = customData.date.getTimezoneOffset() / (-60);
				var timeType = customData.Subtype;
				timezoneOffset = timezoneOffset.toFixed(2);
				var postObj = {
					EmployeeID: this.empID,
					EventDate: eventDate,
					EventTime: time,
					TimeType: timeType,
					TimezoneOffset: timezoneOffset.toString()
				};
			} else {
				var time = this.formatTime(customData.time);
				var eventDate = this.formatDateTimeString(customData.date);
				var timezoneOffset = customData.date.getTimezoneOffset() / (-60);
				timezoneOffset = timezoneOffset.toFixed(2);
				var postObj = {
					EmployeeID: this.empID,
					EventDate: eventDate,
					EventTime: time,
					TimeType: timeType,
					TimezoneOffset: timezoneOffset.toString()
				};
			}

			if (this.approverIdSelected && this.configuration.ApproverVisible) {
				postObj.ApproverPernr = this.approverIdSelected;
			} else {
				postObj.ApproverPernr = this.configuration.ApproverId;
			}

			if (this.byId("comments").getValue() !== "") {
				postObj.Note = this.byId("comments").getValue();
			}
			if (type === "D") {
				postObj.ReqId = customData.id;
				postObj.EventTime = customData.time;
			}
			/**
			 * @ControllerHook Modify the post Object
			 * This hook method can be used to modify the object sent for creation or deletion
			 * It is called when the decision options for the detail item are fetched successfully
			 * @callback hcm.cico.view.S1~extHookCreatePostObject
			 * @param {object} Post Object
			 * @return {object} Post Object
			 */
			if (this.extHookCreatePostObject) {
				postObj = this.extHookCreatePostObject(postObj);
			}
			return postObj;
		},
		/**
		 * Called when user clicks on delete button.
		 * @public
		 */
		onDelete: function (oEvent) {
			/**
			 * @ControllerHook Change the implementation on click of the Delete('Cross') icon
			 * This hook method can be used to change the implementation on click of the Delete('Cross') icon
			 * It is called on click of the Delete('Cross') icon
			 * @callback hcm.cico.view.S1~extHookOnDelete
			 */
			if (this.extHookOnDelete) {
				this.extHookOnDelete();
			} else {
				if (sap.ui.Device.system.phone === true) {
					var selectedItem = oEvent.getSource().getParent().getParent().getSwipedItem();
				} else {
					var selectedItem = oEvent.getParameter("listItem");
				}

				var dateString = sap.ui.core.format.DateFormat.getDateInstance({
					style: "medium"
				}).format(selectedItem.data().date);
				var addInfo = [{
					label: this.oBundle.getText("eventType"),
					text: selectedItem.getCells()[0].getText()

				}, {
					label: this.oBundle.getText("date"),
					text: dateString
				},

				{
					label: this.oBundle.getText("time"),
					text: selectedItem.getCells()[1].getText()
				}
				];
				var date = new Date();
				//set up the settings tab
				var oSettings = {
					showNote: false,
					title: this.oBundle.getText("deleteConfirmation"),
					confirmButtonLabel: this.oBundle.getText("OK"),
					additionalInformation: addInfo
				};
				//open confirmation popup
				this.openConfirmationPopup(oSettings, 'D', selectedItem);
			}
		},
		/**
		 * Called for error handling.
		 * @public
		 */
		processError: function (oError) {
			this.oErrorHandler.setShowErrors("immediately");
		},
		//ensure time events are reloaded after successful update from change screen		
		_onOverviewRouteMatched: function () {
			var exchgModel = this.getOwnerComponent().getModel("changeExchgModel");
			if (exchgModel && exchgModel.getData().reloadList) {
				var date = exchgModel.getData().loadDate;
				this.getEvents(date);
			}

		},
		/**
		 * Called when application want to parse data.
		 * @public
		 */
		parseEventsData: function (data) {
			var date, time;
			for (var i = 0; i < data.length; i++) {
				//needs more thought. Issues with the browser appending the timezone to a timestamp
				try {
					var date1 = new Date(data[i].EventDate);
					var date2 = new Date(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate());
					date = date2;
				} catch (o) {
					date = new Date(data[i].EventDate);
				}
				data[i].EventDate = date;

				switch (data[i].Status) {
					case "APPROVED":
						data[i].statusState = "Success";
						break;
					case "POSTED":
						data[i].statusState = "Success";
						break;
					case "REJECTED":
						data[i].statusState = "Error";
						break;
					default:
						data[i].statusState = "None";
						break;
				}
				time = data[i].EventTime.ms;
				data[i].EventTime = this.formatTime(time);
				if (!this.configuration.ModifyAllowed) {
					data[i].type = "Inactive";
				}
				// else {
				// 	switch (data[i].Origin) {
				// 		case "E":
				// 			data[i].type = "Navigation";
				// 			break;
				// 		default:
				// 			data[i].type = "Inactive";
				// 			break;
				// 	}
				// }
			}
			return data;
		},
		/**
		 * Called when application want to reset fields in UI.
		 * @public
		 */
		resetFields: function () {
			var that = this;
			this.byId("datePicker").setDateValue(new Date());
			this.byId("timePicker").setDateValue(new Date());
			this.byId("comments").setValue("");
			this.byId("approver").setValue(this.configuration.ApproverName);
			this.approverIdSelected = this.configuration.ApproverId;
			this.byId("idTimeEventType").setSelectedKey(this.configuration.DefaultEvent);
			//this.selectedDate = new Date(); // Added to reset the date to current date after tab change
			this.onSelectionChange(null, this.configuration.DefaultEvent);
			if (!this.setTimeIntervalDetails) {
				this.setTimeIntervalDetails = setInterval(function () {
					try {
						that.byId("timePicker").setValue(that.timeFormatter.format(new Date()));
					} catch (e) {
						jQuery.sap.log.warning("Could not set Time", ["getConfiguration"], ["hcm.myTimeEvents"]);
					}
				}, 60000);
			}

		},
		/**
		 * Called when application to load favorites.
		 * @public
		 */
		getFavorites: function () {
			var that = this;
			// this.byId("favList").setBusy(true);
			var b = new sap.ui.model.Filter({
				path: "EmployeeID",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.empID
			});
			var f = [];
			f.push(b);
			var oModel = new sap.ui.model.json.JSONModel();
			// this.oDataModel.read(
			// 	"/FavoritesSet", {
			// 	filters: f,
			// 	success: function (oData, oResponse) {
			// 		that.byId("favList").setBusy(false);
			// 		var data = oData.results;
			// 		oModel.setData(data);
			// 		that.setModel(oModel, "FavoritesSet");
			// 	},
			// 	error: function (oError) {
			// 		that.byId("favList").setBusy(false);
			// 		that.processError(oError);
			// 	}
			// });
		},
		/**
		 * Called to decide Sub-system column display
		 * @public
		 */
		checkOriginColumnDisplay: function () {
			/**
			 * @ControllerHook Check display of Sub-system Column
			 * This hook method can be used to decide display of Sub-system Column
			 * It is called during initialization
			 * @callback edu.weill.Timeevents.controller.Overview~extHookOriginColumn
			 */
			if (this.extHookOriginColumn) {
				this.extHookOriginColumn();
				this.byId("subSystemColumnId").setVisible(true);
			}

		},

		/**
		 * @public
		 * @description Function to sync the offline generated records to backend system and update the status of the same in the local database once the sync completes.
		 */
		synchronizeOfflineRecordsToBackend: async function (firstDay, lastDay, thirdDay) {
			isProcessStarted = true;
			let offlineRecords = await this.getOfflineRecords();
			var that = this;
			if (window.networkStatus === 'Online' || navigator.onLine) {
				this.byId("calendar").setBusy(true);
				if (offlineRecords.length) {
					let geodata = await this.getGeoCoordinates();
					let postOfflineRecordsArray = []
					for (let i = 0; i < offlineRecords.length; i++) {
						postOfflineRecordsArray.push(this.postOfflineRecordsToBackend(offlineRecords[i], geodata))
					}
					Promise.all(postOfflineRecordsArray).then((successResp) => {
						that.replaceSyncedRecordsInLocalDbUsingAjaxCall(firstDay, lastDay, thirdDay)
					}).catch((error) => {
						console.log('Error in posting offline records', error)
						that.replaceSyncedRecordsInLocalDbUsingAjaxCall(firstDay, lastDay, thirdDay)
					})
					// }
				}
				else if (offlineRecords.length === 0) {
					that.replaceSyncedRecordsInLocalDbUsingAjaxCall(firstDay, lastDay, thirdDay)
				}
			}
			else if (window.networkStatus === 'Offline' || !navigator.onLine) {
				console.log('System is in offline mode')
			}

		},

		/**
		 * 
		 * @param {Date} firstDay - From Date Parameter
		 * @param {Date} lastDay - To Date Parameter
		 * @param {Date} thirdDay - Current Day Value to get the current day events
		 * @description Function used to sync offline records for the current day.
		 */
		syncOfflineRecordsToBackendForCurrentDay: async function (firstDay, lastDay, thirdDay) {
			// let offlinerecords = await this.getOfflineRecords();// Need to check whether it is for current day or old days
			var that = this;
			let offlinerecords = await this.fetchRecordsFromLocalDb(firstDay, '', false);// fetch the offline non synced records from the local database.
			console.log('Offline records present', offlinerecords)
			if (navigator.onLine) {
				that.byId("calendar").setBusy(true);
				if (offlinerecords.length) {
					let geodata = await this.getGeoCoordinates();
					// 	>>>> Set Sync Flag as in Process and see if the Window Close can disable
					isProcessStarted = true;
					let offlinerecordstoupdate = [], offlinerecordstopush = [];
					// >>>> Get the Earliest offline Record and Send a Red query to the Server
					// let offlinerecords = await this.fetchRecordsFromLocalDb(firstDay, '', false);// fetch the offline non synced records from the local database.
					let onlinerecords = await this.fetchOnlineRecordsUsingAjaxCall(firstDay, lastDay); //fetching the online records for the current day, both parameters are same

					// >>>> If Data is before 5/11 then
					// 	>>>> Compare the Data for Customer06 Field and if Data already in server, Mark the record as complete in Local DB
					// >>>> If previous
					// 	>>>> Compare with Punch Type and If exists, replace the record in Local
					// >>>> 
					// offlinerecordstoupdate = offlinerecords.filter(o1 => onlinerecords.some(o2 => (o1.isProcessing && o1.TerminalId == o2.TerminalId)))
					// offlinerecordstoupdate = offlinerecords.filter(o1 => onlinerecords.some(o2 => (o1.TerminalId == o2.TerminalId)))
					offlinerecordstoupdate = onlinerecords.filter(o1 => offlinerecords.some(o2 => (o1.TerminalId == o2.TerminalId)))


					let updateLocalDbRecordsArray = [];
					if (offlinerecordstoupdate.length) {
						for (let record of offlinerecordstoupdate) {
							updateLocalDbRecordsArray.push(this.updateRecordStatusInLocalDb(record, record.TerminalId, 'TerminalId'))
						}
						//Can be separated out
						// if (updateLocalDbRecordsArray.length) {
						// 	Promise.all(updateLocalDbRecordsArray).then((data) => {
						// 		console.log('In Success Call back after updating the local db records status in synchronizeOfflineRecordsForCurrentDay function', data)
						// 	}).catch((error) => {
						// 		console.log('Error in updating the record status in local db in synchronizeOfflineRecordsForCurrentDay function', error)
						// 	})
						// }
					}

					offlinerecordstopush = offlinerecords.filter(o1 => !onlinerecords.some(o2 => (o2.TerminalId && o1.TerminalId == o2.TerminalId)))

					let postOfflineRecordsArray = [];
					if (offlinerecordstopush) {
						for (let record of offlinerecordstopush) {
							postOfflineRecordsArray.push(this.postOfflineRecordsToBackend(record, geodata))
						}
						//Can be separated out
						// Promise.all(postOfflineRecordsArray).then((successResp) => {
						// 	that.replaceSyncedRecordsInLocalDbUsingAjaxCall(firstDay, lastDay, thirdDay)
						// }).catch((error) => {
						// 	console.log('Error in posting offline records', error)
						// 	that.replaceSyncedRecordsInLocalDbUsingAjaxCall(firstDay, lastDay, thirdDay)
						// })
					}

					try {
						let onlinerecordsToDelete = await this.fetchRecordsFromLocalDb(firstDay, '', true);
						let updatedResponse = await Promise.all(updateLocalDbRecordsArray);
						let insertedResponse = await Promise.all(postOfflineRecordsArray);
						console.log('Successful processing of updatedResponse', updatedResponse);
						console.log('Successful processing of insertedResponse', insertedResponse);
						//Make use of the response received in the previous calls rather than making a call again.
						// that.replaceSyncedRecordsInLocalDbUsingAjaxCall(firstDay, lastDay, thirdDay, that.synchronizeAllOfflineRecords())
						that.replaceSyncedRecordsInLocalDbUsingAjaxCallForCurrentDay(firstDay, lastDay, thirdDay, onlinerecords, onlinerecordsToDelete)
						// that.synchronizeAllOfflineRecords()
					} catch (error) {
						console.log("Error in resolving the promises inside syncOfflineRecordsToBackendForCurrentDay function", error)
					}


					// }
				}
				else if (offlinerecords.length === 0) {
					console.log('No Offline records');
					let onlineRecords = await this.fetchOnlineRecordsUsingAjaxCall(firstDay, lastDay);
					// that.replaceSyncedRecordsInLocalDbUsingAjaxCall(firstDay, lastDay, thirdDay, that.synchronizeAllOfflineRecords())
					that.replaceSyncedRecordsInLocalDbUsingAjaxCallForCurrentDay(firstDay, lastDay, thirdDay, onlineRecords, [])
				}
			}
			else if (!navigator.onLine) {
				console.log('System is in offline mode')
			}

		},

		/**
		 * 
		 * @param {Date} firstDay 
		 * @param {Date} lastDay 
		 * @param {Date} thirdDay 
		 * @description Function to sync the offline records for current day by fetching the current day records and comparing them and update them locally, if any 
		 * records found true offline they need to be pushed to the backend.
		 */
		synchronizeOfflineRecordsForCurrentDay: async function (firstDay, lastDay) {
			isProcessStarted = true;
			let onlinerecords = await this.fetchOnlineRecordsUsingAjaxCall(firstDay, lastDay); //fetching the online records for the current day, both parameters are same
			let offlinerecords = await this.fetchRecordsFromLocalDb(firstDay, '', false);// fetch the offline non synced records from the local database.
			let localsyncedrecords = await this.fetchRecordsFromLocalDb(firstDay, '', true);// fetch the synced records from the local database.
			console.log('onlinerecords obtained ==>', onlinerecords);
			console.log('offlinerecords obtained ==>', offlinerecords);
			console.log('localsyncedrecords obtained ==>', localsyncedrecords);
			let offlinerecordstopush = [], offlinerecordstoupdate = [], localsyncedrecordstoupdate = [], onlinerecordstoinsert = [], recordstobedeletedfromlocaldb = [];

			//>>>>>>> Offline Scenarios are working fine.
			// if (offlinerecords.length) {
			//Checking offline records with C6 field to compare the offline records that need to be pushed to the server.
			// offlinerecordstopush = onlinerecords.filter(o1 => offlinerecords.some(o2 => (o1.CUSTOMER06 !== o2.CUSTOMER06 && o2.CUSTOMER06)))
			// offlinerecordstopush = offlinerecords.filter(o1 => !onlinerecords.some(o2 => (o2.CUSTOMER06 && o1.CUSTOMER06 == o2.CUSTOMER06)))
			offlinerecordstopush = offlinerecords.filter(o1 => !onlinerecords.some(o2 => (o2.TerminalId && o1.AddTerminalID == o2.TerminalId)))
			//If there are any online records present in the local db which are marked as offline, by checking the status we will update the status locally.
			// offlinerecordstoupdate = onlinerecords.filter(o1 => offlinerecords.some(o2 => (o1.CUSTOMER06 == o2.CUSTOMER06 && o2.CUSTOMER06)))
			// offlinerecordstoupdate = offlinerecords.filter(o1 => onlinerecords.some(o2 => (o2.CUSTOMER06 && o1.CUSTOMER06 == o2.CUSTOMER06)))

			//Comparing with Terminal Id 
			// offlinerecordstoupdate = offlinerecords.filter(o1 => onlinerecords.some(o2 => (o2.TerminalId && o1.AddTerminalID == o2.TerminalId)))
			offlinerecordstoupdate = offlinerecords.filter(o1 => onlinerecords.some(o2 => (o2.isProcessing && o1.AddTerminalID == o2.TerminalId)))
			//match with the online records and if there are any matching update the status.



			//////----??? No issues working fine for Offline records posting.
			// Push All the offline records with a promise call.
			if (offlinerecordstopush.length) {
				let postOfflineRecordsArray = [];
				let geodata = await this.getGeoCoordinates();

				for (let value of offlinerecordstopush) {
					postOfflineRecordsArray.push(this.postOfflineRecordsToBackend(value, geodata))
				}
				Promise.all(postOfflineRecordsArray).then((data) => {
					console.log('In Success Callback', data)
				}).catch((error) => {
					console.log('Error in posting the offline records to ecc endpoint', error)
				})
			}

			//Call synchronizeAllOfflineRecords function once done with the current day to process the offline records dating to one week back from previous day

			//if there are any matches that indicates some of them were not updated locally but present in the server. We need to update the status of such records
			//locally indicating that they are synced.
			if (offlinerecordstoupdate.length) {
				let updateLocalDbRecordsArray = [];
				for (let record of offlinerecordstoupdate) {
					updateLocalDbRecordsArray.push(this.updateRecordStatusInLocalDb(record, record.TerminalID, 'TerminalID'))
				}
				if (updateLocalDbRecordsArray.length) {
					Promise.all(updateLocalDbRecordsArray).then((data) => {
						console.log('In Success Call back after updating the local db records status in synchronizeOfflineRecordsForCurrentDay function', data)
					}).catch((error) => {
						console.log('Error in updating the record status in local db in synchronizeOfflineRecordsForCurrentDay function', error)
					})
				}
			}


			// }


			//////----??? Has issues with insertRecordsInLocalDb function.
			//Stopeed online checking functionality as it is not working fine as expected.
			// if (onlinerecords.length) {
			// localsyncedrecordstoupdate = localsyncedrecords.filter(o1 => onlinerecords.some(o2 => (o1.EventTime == o2.EventTime && o2.EventTime)))
			// localsyncedrecordstoupdate = localsyncedrecords.filter(o1 => onlinerecords.some(o2 => (o2.CUSTOMER06 && o1.CUSTOMER06 == o2.CUSTOMER06)))
			// localsyncedrecordstoupdate = localsyncedrecords.filter(o1 => onlinerecords.some(o2 => (o2.TerminalId && o1.TerminalId == o2.TerminalId)))
			localsyncedrecordstoupdate = localsyncedrecords.filter(o1 => onlinerecords.some(o2 => (o2.Orign == 'M' && o1.TerminalId == o2.TerminalId)))
			//==>Update Case 
			//if any local synced records are updated at the backend, by making a comparision check and update the same in the local database.
			let updateLocalDbRecordsArray = [];
			for (let record of localsyncedrecordstoupdate) {
				updateLocalDbRecordsArray.push(this.updateRecordStatusInLocalDb(record, record.TerminalId, 'TerminalId'))
			}
			if (updateLocalDbRecordsArray.length) {
				Promise.all(updateLocalDbRecordsArray).then((data) => {
					console.log('In Success Call back after updating the local db records status in synchronizeOfflineRecordsForCurrentDay function', data)
				}).catch((error) => {
					console.log('Error in updating the record status in local db in synchronizeOfflineRecordsForCurrentDay function', error)
				})
			}
			// onlinerecordstoinsert = localsyncedrecords.filter(o1 => onlinerecords.some(o2 => (o1.EventTime != o2.EventTime && o2.EventTime)))
			// onlinerecordstoinsert = localsyncedrecords.filter(o1 => onlinerecords.some(o2 => (o1.CUSTOMER06 != o2.CUSTOMER06 && o2.CUSTOMER06)));
			// onlinerecordstoinsert = localsyncedrecords.filter(o1 => !onlinerecords.some(o2 => (o1.CUSTOMER06 == o2.CUSTOMER06 && o2.CUSTOMER06)));
			onlinerecordstoinsert = localsyncedrecords.filter(o1 => !onlinerecords.some(o2 => (o1.TerminalId == o2.TerminalId && o2.TerminalId)));
			//====> Insert Case.
			//if any records which are not present in the local database and present at the backend, we will insert them into the local database.
			// for (let record of onlinerecordstoinsert) {
			// 	insertLocalDbRecordsArray.push(this.insertRecordsInLocalDb(record))
			// }
			let insertLocalDbRecordsArray = [];
			if (insertLocalDbRecordsArray.length && 0) {
				//Use insertRecordsInLocalDb function to insert the online only records into the local database.
				Promise.all(insertLocalDbRecordsArray).then((data) => {
					console.log('In Success Call back after inserting the local db records status in synchronizeOfflineRecordsForCurrentDay function', data)
				}).catch((error) => {
					console.log('Error in inserting the record status in local db in synchronizeOfflineRecordsForCurrentDay function', error)
				})
			}

			//=====>Delete Case need to be worked upon.
			//Logic is yet to be worked upon.

			// recordstobedeletedfromlocaldb = localsyncedrecords.filter(o1 => onlinerecords.some(o2 => (o1.CUSTOMER06 != o2.CUSTOMER06 && o2.CUSTOMER06)));
			recordstobedeletedfromlocaldb = localsyncedrecords.filter(o1 => onlinerecords.some(o2 => (o1.TerminalId != o2.TerminalId && o2.TerminalId)));
			let recordsDeleteArray = [];
			for (let record of recordstobedeletedfromlocaldb) {
				//Call with this function (removeRecordsFromLocalDb)
				recordsDeleteArray.push(this.removeRecordsFromLocalDb(record));
			}
			if (recordsDeleteArray.length && 0) {
				Promise.all(recordsDeleteArray).then((data) => {
					console.log('In Success Call back after removing the local db records status in synchronizeOfflineRecordsForCurrentDay function', data)
				}).catch((error) => {
					console.log('Error in removing the record status in local db in synchronizeOfflineRecordsForCurrentDay function', error)
				})
			}
			// }
			isProcessStarted = false;

			// this.synchronizeAllOfflineRecords();

		},
		/**
		 * @description Function to synchronize all the offline records, once the current day records processing(offline/online check/update/push) is completed.
		 * 
		 */
		synchronizeAllOfflineRecords: async function (fromDate = '', toDate = '') {
			//Then find the local db for old offline records, fetch data for that particular days and only push them
			//Get Offline Records and identifyy the oldest records from the local db.
			// let allofflineRecords = await this.getOfflineRecords();

			let onlinerecords = [], oldestRecordFromOffline = [];

			//If From Date and to Date fields are there use them as filters else if the function will behave in default way.
			if (fromDate && toDate) {
				oldestRecordFromOffline = await this.fetchRecordsFromLocalDb(fromDate, toDate, false);
				onlinerecords = await this.fetchOnlineRecordsUsingAjaxCall(fromDate, toDate);
			} else {
				oldestRecordFromOffline = await this.getOldestOfflineRecords();
				onlinerecords = await this.fetchOnlineRecordsUsingAjaxCall(oldestRecordFromOffline.oldestrecord.EventDate, yesterday);

			}

			const today = new Date();
			const yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate() - 1);
			let offlinerecords = oldestRecordFromOffline.docs;

			//Get the online records from the identified last day to Current Day minus one day.

			let localsyncedrecords = await this.fetchRecordsFromLocalDb(oldestRecordFromOffline.oldestrecord.EventDate, yesterday, true);



			//Compare the offline with online records and check whether they need to be posted or not, and if they are already updated update the same in the local db
			if (oldestRecordFromOffline.docs.length) {
				// let offlinerecordstopush = onlinerecords.filter(o1 => offlinerecords.some(o2 => (o1.CUSTOMER06 !== o2.CUSTOMER06 && o2.CUSTOMER06)))
				let offlinerecordstopush = onlinerecords.filter(o1 => !offlinerecords.some(o2 => (o1.TerminalID == o2.TerminalID && o2.TerminalID)))
				console.log('offlinerecordstopush in synchronizeAllOfflineRecords', offlinerecordstopush)
				// let offlinerecordstoupdate = onlinerecords.filter(o1 => offlinerecords.some(o2 => (o1.CUSTOMER06 == o2.CUSTOMER06 && o2.CUSTOMER06)))
				let offlinerecordstoupdate = onlinerecords.filter(o1 => offlinerecords.some(o2 => (o1.TerminalID == o2.TerminalID && o2.TerminalID)))
				console.log('offlinerecordstoupdate in synchronizeAllOfflineRecords', offlinerecordstoupdate)


				//Offline Records are pushed to the backend.
				if (offlinerecordstopush.length) {
					let postOfflineRecordsArray = [];
					//Eliminate this call by taking the value from the previous function
					let geodata = await this.getGeoCoordinates();//

					for (let value of offlinerecordstopush) {
						postOfflineRecordsArray.push(this.postOfflineRecordsToBackend(value, geodata))
					}
					Promise.all(postOfflineRecordsArray).then((data) => {
						console.log('In Success Callback', data)
					}).catch((error) => {
						console.log('Error in posting the offline records to ecc endpoint', error)
					})
				}

			}

			//if only push is concerned and not the updates, no need of updating them locally.ignore this.
			if (onlinerecords.length) {
				let localsyncedrecordstoupdate = localsyncedrecords.filter(o1 => onlinerecords.some(o2 => (o1.EventTime == o2.EventTime && o2.EventTime)))
				console.log('localsyncedrecordstoupdate in synchronizeAllOfflineRecords', localsyncedrecordstoupdate)
				let onlinerecordstoinsert = localsyncedrecords.filter(o1 => onlinerecords.some(o2 => (o1.EventTime != o2.EventTime && o2.EventTime)))
				console.log('onlinerecordstoinsert in synchronizeAllOfflineRecords', onlinerecordstoinsert)
			}


			///isProcessing Flag to identify the records which are currently in processing state, 
			//before the start of the process we will mark it as active, if it comes as an error or success we will update the status to previous state,
			//this need to be added for every record..

			//if if fails due to network unreachability, when the sync process again starts we need to check whether they are posted or not and update the local database flag.


			// Push All the offline records with a promise call.


			//Fetch data for the last date of the identified record and for the current date -1 from the backend.




		},

		/**
		 * 
		 * @param {Date} filtercondition - Date Passed to the Function to fetch the records for that particular day from the local database.
		 * @param {Boolean} syncFlag - Sync Flag to identify the synced and non-synced records.
		 * @description Function to get the records from the local database based on the sync flag, if sync flag is true we are getting the synced recods,
		 * if sync flag is false we will fetch the offline non-synced records.
		 */
		fetchRecordsFromLocalDb: async function (filtercondition1, filtercondition2, syncFlag) {
			let query = { module: 'TimeEventSetIndividual', isSynced: syncFlag }
			if (filtercondition1 && filtercondition2) {
				let newDate1 = new Date(Date.UTC(filtercondition1.getFullYear(), filtercondition1.getMonth(), filtercondition1.getDate()));
				let newDate2 = new Date(Date.UTC(filtercondition2.getFullYear(), filtercondition2.getMonth(), filtercondition2.getDate()));
				let filteredDate1 = '/Date(' + newDate1.getTime() + ')/';
				let filteredDate2 = '/Date(' + newDate2.getTime() + ')/';
				query = { module: 'TimeEventSetIndividual', isSynced: syncFlag, EventDate: { $gte: filteredDate1, $lte: filteredDate2 } }
			}
			if (filtercondition1) {
				let newDate = new Date(Date.UTC(filtercondition1.getFullYear(), filtercondition1.getMonth(), filtercondition1.getDate()));
				let filteredDate = '/Date(' + newDate.getTime() + ')/';
				query = { module: 'TimeEventSetIndividual', isSynced: syncFlag, EventDate: filteredDate }
			}
			return new Promise((resolve, reject) => {
				db.find(query, function (err, docs) {
					if (err) {
						console.log('Error in finding TimeEventSetIndividual', err);
						reject(err)
					}
					else if (docs) {
						resolve(docs);
					}
				})

			})
		},


		/**
		 * @public
		 * @description Function to sync the offline generated records to backend system and update the status of the same in the local database once the sync completes.
		 */
		synchronizeOfflineRecordsToBackendTwo: async function (firstDay, lastDay, thirdDay) {
			//custom code starts
			console.log('All the records are not same', firstDay, lastDay)
			let offlinerecords = await this.getOfflineRecords(firstDay)
			console.log('offlinerecords obtained ==>', offlinerecords)
			let onlinerecords = await this.fetchOnlineRecordsUsingAjaxCall(firstDay, lastDay)
			console.log('onlinerecords obtained', onlinerecords)
			//Identifying the records that need to be pushed which doesn't have the C6 fields matching

			//If, Offline Records exists then compare each offline record with the data on the server by using C6 or C5 fields and add it to the server list or add it to the local db depending on the 
			//status
			//Else, If Offline Records doesn't exists, then get all the data from the local db for that day and compare the records with the data from the server
			//if all the record matches replace the complete set.
			//
			let c6unmatchedrecords = offlinerecords.filter(o1 => onlinerecords.some(o2 => (o1.CUSTOMER06 !== o2.CUSTOMER06 && o2.CUSTOMER06)))
			console.log('Records to push c6unmatchedrecords', c6unmatchedrecords)
			//Identifying the records that need to be pushed which have the C6 fields matching
			let c6matchedrecords = offlinerecords.filter(o1 => onlinerecords.some(o2 => (o1.CUSTOMER06 === o2.CUSTOMER06 && o2.CUSTOMER06)))
			console.log('Records to push c6matchedrecords', c6matchedrecords)
			//Identifying the records that need to be pushed which doesn't have the C5 fields matching

			// let c5unmatchedrecords = offlinerecords.filter(o1 => onlinerecords.some(o2 => (o1.CUSTOMER05 !== o2.CUSTOMER05 && o2.CUSTOMER05)))
			// console.log('Records to Push c5unmatchedrecords', c5unmatchedrecords)



			if (c6matchedrecords.length) {
				//Update the records status in the local db based on the backend updated information of the record
				let updateLocalDbRecordsArray = [];
				for (let i = 0; i < c6matchedrecords.length; i++) {
					updateLocalDbRecordsArray.push(this.updateRecordStatusInLocalDb(c6matchedrecords[i], c6matchedrecords[i].CUSTOMER06, 'CUSTOMER06'))
				}
				Promise.all(updateLocalDbRecordsArray).then((data) => {
					console.log('In Success Call back after updating the local db records status', data)
				}).catch((error) => {
					console.log('Error in updating the record status in local db', error)
				})
			}
			if (c6unmatchedrecords.length) {
				//Try to push the records to the ecc endpoint and based on the success callback update the status of the record in the local db
				let postOfflineRecordsArray = [];
				let geodata = await this.getGeoCoordinates();
				for (let i = 0; i < c6unmatchedrecords.length; i++) {
					postOfflineRecordsArray.push(this.postOfflineRecordsToBackend(c6unmatchedrecords[i], geodata))
				}
				Promise.all(postOfflineRecordsArray).then((data) => {
					console.log('In Success Callback', data)
				}).catch((error) => {
					console.log('Error in posting the offline records to ecc endpoint', error)
				})
			}
			if (c6matchedrecords.length === 0) {
				let c5unmatchedrecords = onlinerecords.filter(o1 => offlinerecords.some(o2 => (o1.CUSTOMER05 !== o2.CUSTOMER05 && o2.CUSTOMER05)))
				console.log('Records to Push c5unmatchedrecords', c5unmatchedrecords)

				//Identifying the records that need to be pushed which have the C5 fields matching
				let c5matchedrecords = offlinerecords.filter(o1 => onlinerecords.some(o2 => (o1.CUSTOMER05 === o2.CUSTOMER05 && o2.CUSTOMER05)))
				console.log('Records to push c5matchedrecords', c5matchedrecords)
				//if there are no c6 matched records, compare with c5 field and if there is a matching record update in the local database, else post the record to ecc.
				if (c5matchedrecords.length) {
					//Update the local db data by observing the changes in the online data
					let updateLocalDbRecordsArray = [];
					// for (let i = 0; i < c5matchedrecords.length; i++) {
					// 	updateLocalDbRecordsArray.push(this.updateRecordStatusInLocalDb(c5matchedrecords[i], c5matchedrecords[i].CUSTOMER05, 'CUSTOMER05'))
					// }

					for (let i of c5matchedrecords) {
						updateLocalDbRecordsArray.push(this.updateRecordStatusInLocalDb(c5matchedrecords[i], c5matchedrecords[i].CUSTOMER05, 'CUSTOMER05'))
					}
					Promise.all(updateLocalDbRecordsArray).then((data) => {
						console.log('In Success Call back after updating the local db records status', data)
					}).catch((error) => {
						console.log('Error in updating the record status in local db', error)
					})
				}
			}
			this.getEvents(thirdDay);
			// }
			//custom code ends

			// let offlineRecords = await this.getOfflineRecords();
			// var that = this;
			// if (navigator.onLine) {
			// 	this.byId("calendar").setBusy(true);
			// 	if (offlineRecords.length) {
			// 		let geodata = await this.getGeoCoordinates();
			// 		let postOfflineRecordsArray = []
			// 		for (let i = 0; i < offlineRecords.length; i++) {
			// 			postOfflineRecordsArray.push(this.postOfflineRecordsToBackend(offlineRecords[i], geodata))
			// 		}
			// 		Promise.all(postOfflineRecordsArray).then((successResp) => {
			// 			that.replaceSyncedRecordsInLocalDbUsingAjaxCall(firstDay, lastDay, thirdDay)
			// 		}).catch((error) => {
			// 			console.log('Error in posting offline records', error)
			// 			that.replaceSyncedRecordsInLocalDbUsingAjaxCall(firstDay, lastDay, thirdDay)
			// 		})
			// 		// }
			// 	}
			// 	else if (offlineRecords.length === 0) {
			// 		that.replaceSyncedRecordsInLocalDbUsingAjaxCall(firstDay, lastDay, thirdDay)
			// 	}
			// }
			// else if (window.networkStatus === 'Offline' || !navigator.onLine) {
			// 	console.log('System is in offline mode')
			// }

		},

		/**
		 * @public 
		 * @description Function to get the records punched in the offline mode from the local database. If date parameter is passed it will fetch the result matching to that date, else it will fetch all
		 * the available offline records from the database.
		 */
		getOfflineRecords: function (filtercondition = '') {
			// console.log('Inside getOffline Records function call')
			let query = { module: 'TimeEventSetIndividual', isSynced: false }
			if (filtercondition) {
				let newDate = new Date(Date.UTC(filtercondition.getFullYear(), filtercondition.getMonth(), filtercondition.getDate()));
				let filteredDate = '/Date(' + newDate.getTime() + ')/';
				// console.log('Inside filter condition', filtercondition, filteredDate)
				query = { module: 'TimeEventSetIndividual', isSynced: false, EventDate: filteredDate }
				// query = { module: 'TimeEventSetIndividual', EventDate: filteredDate }
			}
			return new Promise((resolve, reject) => {
				db.find(query, function (err, docs) {
					if (err) {
						console.log('Error in finding TimeEventSetIndividual', err);
						reject(err)
					}
					else if (docs) {
						resolve(docs);
					}
				})

			})
		},

		/**
		 * @description Function to get the oldest offline records available, along with the oldest date of the records.
		 */
		getOldestOfflineRecords: function () {
			let query = { module: 'TimeEventSetIndividual', isSynced: false }
			return new Promise((resolve, reject) => {
				db.find(query).sort({ "EventDate": 1 }).exec(function (err, docs) {
					if (err) {
						console.log('Error in finding oldest offline records', err);
						reject(err)
					}
					else if (docs) {
						// resolve(docs);
						resolve({
							docs,
							oldestrecord: docs[0]
						})
					}
				})

			})
		},


		/**
		 * 
		 * @param {Date} fromDate - From Date field to pass as a filter to the query
		 * @param {Date} toDate - To Date field to pass as a filter to the query
		 * @description - Function to fetch the backend available records using ajax call, it accepts two parameters and returns a result set. 
		 */
		fetchOnlineRecordsUsingAjaxCall: function (fromDate, toDate) {
			console.log('From Date', fromDate, 'TO Date', toDate)
			let now = new Date(fromDate.getTime() - fromDate.getTimezoneOffset() * 60000).toISOString().replace('Z', '')
			let then = new Date(toDate.getTime() - toDate.getTimezoneOffset() * 60000).toISOString().replace('Z', '')
			let oServiceURI = this.getOwnerComponent().getMetadata().getManifestEntry("sap.app").dataSources["timeEventService"].uri;
			const options = {
				headers: { 'Authorization': 'Bearer ' + localStorage.token }
			};
			return new Promise((resolve, reject) => {
				axios.get(oServiceURI + "/odata/sap/HCMFAB_MYTIMEEVENTS_SRV/TimeEventSet?$filter=DateFrom eq datetime'" + now + "' and DateTo eq datetime'" + then + "'", options).then(async (filteredData) => {
					let filteredRecords = filteredData.data.d.results;
					// console.log(filteredRecords, ' fetchOnlineRecordsUsingAjaxCall func call')
					resolve(filteredRecords)
				}).catch((error) => {
					reject(error)
					console.log('Error in making ajax call', error)
				})
			})
		},


		/**
		 * 
		 * @param {*} fromDate 
		 * @param {*} toDate 
		 * @param {*} thirdDay 
		 * @param {*} onlineRecords 
		 */
		replaceSyncedRecordsInLocalDbUsingAjaxCallForCurrentDay: async function (fromDate, toDate = '', thirdDay, onlineRecords, onlineRecordsToDelete) {
			console.log('Inside replaceSyncedRecordsInLocalDbUsingAjaxCallForCurrentDay function')
			var that = this;
			if (onlineRecords.length) {
				// Avoiding API Call Starts
				isProcessStarted = false;// After api execution marking it as false
				// let removeLocalElementsPromise = new Promise((resolve, reject) => {
				// 	// var dt = new Date();
				// 	var newDate = new Date(Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())).getTime();
				// 	// var newDate1 = new Date(Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())).getTime();
				// 	// var newDate2 = new Date(Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())).getTime();
				// 	let query = {};
				// 	// if (fromDate === toDate) {
				// 	query = { module: 'TimeEventSetIndividual', isSynced: true, EventDate: '/Date(' + newDate + ')/' };
				// 	// } 
				// 	// else if (fromDate !== toDate) {
				// 	// 	query = { module: 'TimeEventSetIndividual', isSynced: true, EventDate: { $gte: '/Date(' + newDate1 + ')/', $lte: '/Date(' + newDate2 + ')/' } };
				// 	// }
				// 	//Add Additional conditions to check the uniqueness of the records that we are replacing like TerminalID
				// 	//Function to identify and remove the records from the local database.
				// 	db.remove(query, { multi: true }, function (err, numRemoved) {
				// 		if (err) {
				// 			reject(err);
				// 		}
				// 		else if (numRemoved) {
				// 			resolve(numRemoved)
				// 		}
				// 		else {
				// 			resolve('Nothing to remove')
				// 		}
				// 	});
				// })

				//Promise to insert into the local database.
				let removeLocalDBElementsPromise = (id = '') => new Promise((resolve, reject) => {
					let query = {};
					if (id) {
						query = { module: 'TimeEventSetIndividual', isSynced: true, _id: id };
					} else {
						let newDate = new Date(Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())).getTime();
						query = { module: 'TimeEventSetIndividual', isSynced: true, EventDate: '/Date(' + newDate + ')/' };
					}
					//Function to identify and remove the records from the local database.
					db.remove(query, { multi: true }, function (err, numRemoved) {
						if (err) {
							reject(err);
						}
						else if (numRemoved) {
							resolve(numRemoved)
						}
						else {
							resolve('Nothing to remove')
						}
					});
				})
				let insertElementsInLocalDb = (element) => new Promise((resolve, reject) => {
					db.insert(element, function (err, docsInserted) {
						if (err) {
							reject(err);
						} else if (docsInserted) {
							resolve(docsInserted);
						}
					})
				})

				let removeElementsArray = []
				//Check the length of the records that need to be deleted.
				if (onlineRecordsToDelete.length) {
					for (let record of onlineRecordsToDelete) {
						removeElementsArray.push(removeLocalDBElementsPromise(record._id))
					}

				} else if (onlineRecordsToDelete.length === 0) {
					removeElementsArray.push(removeLocalDBElementsPromise())
				}


				let insertElementsArray = [];
				for (let record of onlineRecords) {
					insertElementsArray.push({ module: 'TimeEventSetIndividual', isSynced: true, ...record });
				}
				// for (var i = 0; i < onlineRecords.length; i++) {
				// 	insertElementsArray.push({ module: 'TimeEventSetIndividual', isSynced: true, ...onlineRecords[i] });

				// }
				try {
					// let removedElements = await removeLocalElementsPromise;
					let removedElements = await Promise.all(removeElementsArray);
					let insertElements = await insertElementsInLocalDb(insertElementsArray);
					console.log('Removed Elements', removedElements);
					console.log('Inserted Elements', insertElements);
					isProcessStarted = false;
					that.getEvents(thirdDay);
					//Call Synchronize all offline records after done with the current day.
					// that.synchronizeAllOfflineRecords()
					that.byId('calendar').setBusy(false);
				} catch (error) {
					console.log('Error in replacing the records')
				}

				// Avoiding API Call ends
			} else if (onlineRecords.length === 0) {
				//We will not replace the records
				console.log('No online records found to match and replace.');
			}
		},

		/**
		* 
		* @param {Date} fromDate  From Date Parameter passed to the function.
		* @param {Date} toDate To Date Parameter passed to the function.
		 * @description Function used to replace synced records in local db.
		 */
		replaceSyncedRecordsInLocalDbUsingAjaxCall: function (fromDate, toDate, thirdDay, callbackFunction) {
			var now = new Date(fromDate.getTime() - fromDate.getTimezoneOffset() * 60000).toISOString().replace('Z', '')
			var then = new Date(toDate.getTime() - toDate.getTimezoneOffset() * 60000).toISOString().replace('Z', '')
			var that = this;
			var oServiceURI = this.getOwnerComponent().getMetadata().getManifestEntry("sap.app").dataSources["timeEventService"].uri;

			const options = {
				headers: { 'Authorization': 'Bearer ' + localStorage.token }
			};
			axios.get(oServiceURI + "/odata/sap/HCMFAB_MYTIMEEVENTS_SRV/TimeEventSet?$filter=DateFrom eq datetime'" + now + "' and DateTo eq datetime'" + then + "'", options).then(async (filteredData) => {
				isProcessStarted = false;// After api execution marking it as false
				let filteredRecords = filteredData.data.d.results
				let removeLocalElementsPromise = new Promise((resolve, reject) => {
					// var dt = new Date();
					var newDate = new Date(Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())).getTime();
					var newDate1 = new Date(Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())).getTime();
					var newDate2 = new Date(Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())).getTime();
					let query = {};
					if (fromDate === toDate) {
						query = { module: 'TimeEventSetIndividual', isSynced: true, EventDate: '/Date(' + newDate + ')/' };
					} else if (fromDate !== toDate) {
						query = { module: 'TimeEventSetIndividual', isSynced: true, EventDate: { $gte: '/Date(' + newDate1 + ')/', $lte: '/Date(' + newDate2 + ')/' } };
					}
					//Add Additional conditions to check the uniqueness of the records that we are replacing like TerminalID
					db.remove(query, { multi: true }, function (err, numRemoved) {
						if (err) {
							reject(err);
						}
						else if (numRemoved) {
							resolve(numRemoved)
						}
						else {
							resolve('Nothing to remove')
						}

					});
				})
				let removedElements = await removeLocalElementsPromise;

				let insertElementsInLocalDb = (element) => new Promise((resolve, reject) => {
					db.insert(element, function (err, docsInserted) {
						if (err) {
							reject(err);
						} else if (docsInserted) {
							resolve(docsInserted);
						}
					})
				})

				let insertElementsArray = [];
				//Custom Database code ends.
				for (var i = 0; i < filteredRecords.length; i++) {
					insertElementsArray.push({ module: 'TimeEventSetIndividual', isSynced: true, ...filteredRecords[i] });

				}
				insertElementsInLocalDb(insertElementsArray).then((successResponse) => {
					that.getEvents(thirdDay)
					that.byId('calendar').setBusy(false);
				}).catch((error) => console.log('Error in resolving the insertElementsArray promise', error))
				callbackFunction()

			}).catch((error) => {
				this.byId("calendar").setBusy(false);
				var oViewModel = new JSONModel({
					networkStatus: "Offline"
				});
				this.getView().setModel(oViewModel, "networkStatusModel");
				console.log('Error in making ajax call', error)
			})


		},

		/**
		 * 
		 * @param {*} toDate 
		 * @param {*} thirdDay 
		 */
		replaceSyncedRecordsInLocalDbUsingAjaxCallTwo: function (toDate) {
			var then = new Date(toDate.getTime() - toDate.getTimezoneOffset() * 60000).toISOString().replace('Z', '')
			var that = this;
			var oServiceURI = this.getOwnerComponent().getMetadata().getManifestEntry("sap.app").dataSources["timeEventService"].uri;

			const options = {
				headers: { 'Authorization': 'Bearer ' + localStorage.token }
			};
			axios.get(oServiceURI + "/odata/sap/HCMFAB_MYTIMEEVENTS_SRV/TimeEventSet?$filter=DateFrom eq datetime'" + then + "' and DateTo eq datetime'" + then + "'", options).then(async (filteredData) => {
				isProcessStarted = false;// After api execution marking it as false
				let filteredRecords = filteredData.data.d.results;
				let removeLocalElementsPromise = new Promise((resolve, reject) => {
					// var dt = new Date();
					let newDate = new Date(Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())).getTime();
					let query = { module: 'TimeEventSetIndividual', isSynced: true, EventDate: '/Date(' + newDate + ')/' };
					//Add Additional conditions to check the uniqueness of the records that we are replacing like TerminalID, Origin Modified field
					//Will check the timer and do not remove the events for that particular time.
					db.remove(query, { multi: true }, function (err, numRemoved) {
						if (err) {
							reject(err);
						}
						else if (numRemoved) {
							resolve(numRemoved)
						}
						else {
							resolve('Nothing to remove')
						}

					});
				})
				let removedElements = await removeLocalElementsPromise;

				let insertElementsInLocalDb = (element) => new Promise((resolve, reject) => {
					db.insert(element, function (err, docsInserted) {
						if (err) {
							reject(err);
						} else if (docsInserted) {
							resolve(docsInserted);
						}
					})
				})

				let insertElementsArray = [];
				for (let record of filteredRecords) {
					insertElementsArray.push({ module: 'TimeEventSetIndividual', isSynced: true, ...record });
				}
				insertElementsInLocalDb(insertElementsArray).then((successResponse) => {
					// that.byId('calendar').setBusy(false);
				}).catch((error) => console.log('Error in resolving the insertElementsArray promise', error))

			}).catch((error) => {
				this.byId("calendar").setBusy(false);
				console.log('Error in making ajax call', error);
			})

		},


		/**
		 * @description Function to post the offline records to backend.
		 * @param {Object} record Offline record that need to be posted to backend oData system
		 * @param {Object} geodata Geo-Coordinates passed to the offline function to compare if there are any differences in the lat, long coordinates.
		 */
		postOfflineRecordsToBackend: function (record, geodata) {
			//This fucntion resembles for the most part with the createTimeEventMob, check for the possibilities and try to use one single function.
			var that = this;
			return new Promise((resolve, reject) => {

				//Posting to backend starts
				let oServiceURI = this.getOwnerComponent().getMetadata().getManifestEntry("sap.app").dataSources["timeEventService"].uri;
				//Posting to backend record by record.
				let latitudeNew = geodata.latitude.toString();
				let longitudeNew = geodata.longitude.toString();

				var oDataModel = new sap.ui.model.odata.v2.ODataModel({
					serviceUrl: oServiceURI + '/odata/SAP/HCMFAB_MYTIMEEVENTS_SRV',
					useBatch: false,
					headers: {
						Authorization: "Bearer " + localStorage.getItem('token'),
						Accept: "*/*"
					}
				});
				let payload = record;
				let id = payload._id;
				delete payload.module;
				delete payload.isSynced;
				delete payload._id;
				delete payload.isPosted;
				delete payload.isProcessing;
				if (payload.latitude != latitudeNew) {
					payload.CUSTOMER03 = latitudeNew.length > 20 ? latitudeNew.substring(0.20) : latitudeNew;
					payload.CUSTOMER04 = longitudeNew.length > 20 ? longitudeNew.substring(0.20) : longitudeNew;
				}
				//Before this Odata call, try to update the flag of isProcessing: true before posting to the backend. Also update once you got a success or error response.
				oDataModel.create("/TimeEventSet", payload, {
					success: function (oData, oResponse) {
						db.update({ _id: id, isSynced: false }, { $set: { isSynced: true, isPosted: false, isProcessing: false } },
							function (err, numReplaced) {
								if (err) {
									console.log("Error in Finding offline Records", err);
									reject(err);
								}
								else {
									that.hideBusy();
									resolve({ oData, oResponse });
								}
							});
					},
					error: function (err) {
						that.byId("calendar").setBusy(false);
						db.update({ _id: id, isSynced: false }, { $set: { isSynced: false, isPosted: false, isProcessing: false } },
							function (err, numReplaced) {
								if (err) {
									console.log("Error in Finding offline Records", err);
									reject(err);
								}
								else {
									that.hideBusy();
									resolve({ oData, oResponse });
								}
							});
						var oViewModel = new JSONModel({
							networkStatus: "Offline"
						});
						that.getView().setModel(oViewModel, "networkStatusModel");
						console.log(err);
					}

				});
				//Posting to backend ends
				// }
				// })

			})

		},

		/**
		 * 
		 * @param {Object} record - Record that need to be posted to the backend
		 * @param {Object} geodata - Updated GeoCoordinates Data for checking if there is any difference of coordinates while posting.
		 * @description Function to post the offline records to backend 
		 * 
		 */
		postOfflineRecordsToBackendNew: function (record, geodata) {
			var that = this;
			return new Promise((resolve, reject) => {

				//isProcessing flag addition, commenting out this code, will remain the old flow as it is.
				//.>>>>>>>>>
				db.update({ _id: record._id }, { $set: { isProcessing: true } }, function (err, numReplaced) {
					if (err) {
						console.log("Error in Finding offline Records", err);
						reject(err);
					}
					else if (numReplaced) {

						//Posting to backend starts
						let oServiceURI = this.getOwnerComponent().getMetadata().getManifestEntry("sap.app").dataSources["timeEventService"].uri;
						//Posting to backend record by record.
						let latitudeNew = geodata.latitude.toString();
						let longitudeNew = geodata.longitude.toString();

						var oDataModel = new sap.ui.model.odata.v2.ODataModel({
							serviceUrl: oServiceURI + '/odata/SAP/HCMFAB_MYTIMEEVENTS_SRV',
							useBatch: false,
							headers: {
								Authorization: "Bearer " + localStorage.getItem('token'),
								Accept: "*/*"
							}
						});
						let payload = record;
						let id = payload._id;
						delete payload.module;
						delete payload.isSynced;
						delete payload._id;
						delete payload.isPosted;
						if (payload.latitude != latitudeNew) {
							payload.CUSTOMER03 = latitudeNew.length > 20 ? latitudeNew.substring(0.20) : latitudeNew;
							payload.CUSTOMER04 = longitudeNew.length > 20 ? longitudeNew.substring(0.20) : longitudeNew;
						}
						oDataModel.create("/TimeEventSet", payload, {
							success: function (oData, oResponse) {
								// db.update({ _id: id, isSynced: false }, { $set: { isSynced: true, isPosted: false } },
								db.update({ _id: id, isSynced: false }, { $set: { isSynced: true, isPosted: false, isProcessing: true } },
									function (err, numReplaced) {
										if (err) {
											console.log("Error in Finding offline Records", err);
											reject(err);
										}
										else {
											that.hideBusy();
											resolve({ oData, oResponse });
										}
									});
							},
							error: function (err) {
								that.byId("calendar").setBusy(false);
								var oViewModel = new JSONModel({
									networkStatus: "Offline"
								});
								that.getView().setModel(oViewModel, "networkStatusModel");
								console.log(err);
							}

						});
						// Posting to backend ends
					}
				})

			})

		},


		/**
		 * 
		 * @param {Object} recordToUpdate - Updated Object received from the backend
		 * @param {String} queryValue - Value of the Field which we are comparing in localdatabase to update
		 * @param {String} queryField - Key of the Field with which we are comparing in the localdatabase to query, possible values are:- CUSTOMER05, CUSTOMER06
		 */
		updateRecordStatusInLocalDb: function (recordToUpdate, queryValue, queryField) {
			recordToUpdate.isSynced = true;
			return new Promise((resolve, reject) => {
				db.update({ module: 'TimeEventSetIndividual', [queryField]: queryValue }, { $set: recordToUpdate }, { upsert: true }, function (err, updatedRecord) {
					if (err) {
						console.log('Error in updating the record status in local db', err)
						reject(err);
					} else if (updatedRecord) {
						console.log('Record Updated', updatedRecord)
						resolve(updatedRecord)
					}

				})

			})
		},

		/**
		 * 
		 * @description Function to insert timeevent data into local database.
		 * @param {Object} recordToInsert - TimeEvent Object to insert into the local database.
		 */
		insertRecordsInLocalDb: function (recordToInsert) {
			return new Promise((resolve, reject) => {
				db.insert(recordToInsert, function (err, docs) {
					if (err) {
						console.log('Error in inserting records into local db inside insertRecordsInLocalDb function', err, recordToInsert)
						reject(err)
					}
					else if (docs) {
						resolve(docs);
					}
				})
			})

		},

		/**
		 * 
		 * @description Function used to remove the record/records from the local database
		 * @param {Object} record - Record to be deleted from the local database.
		 */
		removeRecordsFromLocalDb: async function (record) {
			return new Promise((resolve, reject) => {
				db.remove({ _id: record._id }, function (err, removedDoc) {
					if (err) {
						console.log('Error in removing the documents from the local database', err)
						reject(err);
					}
					else if (removedDoc) {
						resolve(removedDoc);
					}
				})
			})
		},

		/**
		 * @description Function to get the geocoordinates based on the isp/network/geolocation property of the browser
		 */
		getGeoCoordinates: async function () {
			return new Promise((resolve, reject) => {
				let url = 'https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyBCEUbV-AXTBy54TsXN0Gx9TUW0yHs6LUA'
				$.ajax({
					type: "POST",
					url: url
				}).done(function (response) {
					if (response) {
						db.find({ module: 'GeoCoordinates' }, function (error, docs) {
							if (error) {
								console.log('Error in finding the geocoordinates', error);
								reject(error);
							}
							else if (docs.length) {
								db.update({ module: 'GeoCoordinates' }, { $set: { latitude: response.location.lat, longitude: response.location.lng } }, function (err, coordinates) {
									if (err) {
										console.log('Error in Updating the GeoCoordinates with the latest coordinates', err)
										reject(err);
									} else if (coordinates) {
										resolve({ latitude: response.location.lat, longitude: response.location.lng })
									}

								})
							} else if (docs.length === 0) {
								db.insert({ module: 'GeoCoordinates', latitude: response.location.lat, longitude: response.location.lng }, function (err, entities) {
									if (err) {
										console.log('Error in Creating the GeoCoordinates', err)
										reject(err);
									}
									else if (entities) {
										resolve({ latitude: response.location.lat, longitude: response.location.lng })
									}
								});
							}
						})
					}
				}).fail((error) => {
					console.log('Error', error)
				})
			})

		},

		/* =========================================================== */
		/* formatters used in this controller                          */
		/* =========================================================== */
		formatTime: function (oTime) {
			if (oTime) {
				var sec = oTime / 1000;
				var mins = oTime / 60000;
				var h = Math.floor(mins / 60).toString();
				if (h.length === 1) {
					h = "0" + h;
				}
				var m = Math.floor(mins % 60).toFixed(0); //HEGDEPR 2545524
				if (m.length === 1) {
					m = "0" + m;
				}

				var s = Math.floor(sec % 60).toFixed(0); //HEGDEPR 2545524
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
		formatTimeString: function (oDate) {
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
		formatTimeDisplay: function (oDate) {
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
			return h + ":" + m + ":" + s;
		},
		formatDateTimeString: function (oDate) {
			if (typeof oDate === "string") {
				oDate = new Date(oDate);
			}
			var dateParse = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-dd"
			});
			var date = dateParse.format(oDate) + "T00:00:00";
			return date;
		},
		formatDate: function (oDate) {
			var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				style: sap.ui.Device.system.phone ? "short" : "long"
			});
			var dateString = oDateFormat.format(oDate);

			return dateString;
		},
		formatTimeFromDate: function (oDate) {
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
			return h + ":" + m + ":" + s;
		},
		formatOrigin: function (oOrigin) {
			if (oOrigin) {
				this.oBundle = this.getModel("i18n").getResourceBundle();
				var originText;
				switch (oOrigin) {
					case "":
					case "S":
						originText = this.oBundle.getText("yes");
						break;
					default:
						originText = this.oBundle.getText("no");
						break;
				}
				return originText;
			}
		}
	});

});