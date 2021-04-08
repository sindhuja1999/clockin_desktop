/*!
 * SAP APF Analysis Path Framework
 *
 * (c) Copyright 2012-2014 SAP AG. All rights reserved
 */
(function() {
	"use strict";
	sap.ui.controller("sap.apf.ui.reuse.controller.layout", {
		onInit : function() {
			//Application Title
			this.oCoreApi = this.getView().getViewData().oCoreApi;
			this.oUiApi = this.getView().getViewData().uiApi;
			this.oNavigationHandler = this.getView().getViewData().oNavigationHandler;
			var applicationTitleKey;
			this.oCoreApi.getApplicationConfigProperties().done(function(applicationConfigProperties) {
				// Check if app config properties are available
				if (applicationConfigProperties) {
					applicationTitleKey = applicationConfigProperties.appName;
				}
				this.applicationTitle = this.oCoreApi.getTextNotHtmlEncoded(applicationTitleKey);
				this.getView().byId("applicationPage").setTitle(this.applicationTitle);
				this.loadLayout();
			}.bind(this));
			var self = this;
			this.oActionListPopover = new sap.m.Popover({
				id : this.createId("idAnalysisPathMenuPopOver"),
				showHeader : false,
				placement : sap.m.PlacementType.Bottom,
				contentWidth : "165px"
			});
			this.oActionListItem = self.oUiApi.getToolbar().addStyleClass("toolbarView");
			this.oActionListPopover.addContent(this.oActionListItem);
			this.oSavedPathName = this.getView().byId("analysisPathTitle");
			if(this.byId("analysisPath")){
				this.setPathTitle();
			}
		},
		showMenu : function(oEvent) {
			this.oActionListPopover.openBy(oEvent.getSource());
		},
		getAnalysisPathTitleText : function(){
			this.getView.byId("analysisPathTitle");
		},
		setPathTitle : function() {
			var pathTitleCandidate = this.oCoreApi.getPathName();
			if (pathTitleCandidate.length == 0) {
				pathTitleCandidate = this.oCoreApi.getTextNotHtmlEncoded("unsaved");
			}
			if (this.oCoreApi.isDirty()) {
				pathTitleCandidate = '*' + pathTitleCandidate;
			}
			this.getView().byId("analysisPathTitle").setText(pathTitleCandidate);//fixme try a smaller font
			this.getView().byId("analysisPathTitle").setTooltip(pathTitleCandidate);
		},
		/**
		 *@description Layout specific content settings
		 */
		loadLayout : function() {
			this.oCoreApi.getSmartFilterBarConfigurationAsPromise().done(function(smartFilterBarConfiguration) {
				if (sap.ui.Device.system.desktop) {
					this.getView().addStyleClass("sapUiSizeCompact");
					this.getView().byId("deviceFooter").destroy();
				}
				if (smartFilterBarConfiguration === undefined){
					this.getView().byId("idSplitterLayoutData").setSize("0px");
				}
				var chartView = this.oUiApi.getStepContainer();
				var analysisPath = this.oUiApi.getAnalysisPath();
				this.getView().byId("applicationPage").setTitle(this.applicationTitle);
				this.getView().byId("stepContainer").addContent(chartView);
				this.getView().byId("analysisDynamicPage").setContent(analysisPath);
				if(this.getView().byId("menuButton")){
					this.getView().byId("menuButton").setTooltip(this.oCoreApi.getTextNotHtmlEncoded("options"));
				}
				this.addOpenInButton();//adds the "Open In..." button to the footer for navigation targets
			}.bind(this));
		},

		onAfterRendering : function() {
			var self = this;
			if (!sap.ui.Device.system.desktop) {
				var oShowMasterButton = new sap.m.Button({
					text : this.oCoreApi.getTextNotHtmlEncoded("showAnalyticalPath"),
					press : function() {
						self.getView().byId("applicationView").showMaster();
					},
					type : "Transparent"
				});
				this.getView().byId("applicationView").attachAfterMasterClose(function() {
					if (self.getView().byId("masterFooter") && self.getView().byId("masterFooter").getContentLeft().length === 0) {
						self.getView().byId("masterFooter").addContentLeft(oShowMasterButton);
					}
				});
				this.getView().byId("applicationView").attachAfterMasterOpen(function() {
					if (self.getView().byId("masterFooter")) {
						self.getView().byId("masterFooter").removeContentLeft(oShowMasterButton);
					}
				});
				if (this.getView().byId("applicationView").isMasterShown() === false && this.getView().byId("masterFooter").getContentLeft().length === 0){
					this.addMasterFooterContentLeft(oShowMasterButton);
				}
			}
		},
		
		hideMaster : function() {
			if (sap.ui.Device.system.phone || sap.ui.Device.system.tablet) {
				this.getView().byId("applicationView").hideMaster();
				if (sap.ui.Device.system.phone) {
					this.getView().byId("applicationView").toDetail(this.getView().byId("stepContainer").getId());
				}
			}
		},
				
		showMasterFooter : function(oAddAnalysisPath, oMoveStepUp, oMoveStepDown) {
			if (!sap.ui.Device.system.desktop) {
				var self = this;
				self.getView().byId("analysisPath").showFooter = true;
				self.getView().byId("analysisPath").enableScrolling = true;
				self.getView().byId("deviceFooter").addContentLeft(oAddAnalysisPath);
				self.getView().byId("deviceFooter").addContentLeft(oMoveStepUp);
				self.getView().byId("deviceFooter").addContentLeft(oMoveStepDown);
			}
		},
		showMaster : function() {
			this.getView().byId("applicationView").showMaster();
		},
		/**
		 *@description Adds content to Master Footer alignment: Left
		 *@param oControl
		 */
		addMasterFooterContentLeft : function(oControl) {
			this.getView().byId("masterFooter").addContentLeft(oControl);
		},
		/**
		 *@description Adds content to Master Footer alignment: Right
		 *@param oControl
		 */
		addMasterFooterContentRight : function(oControl) {
			if (this.getView().byId("masterFooter").getContentRight().length === 0) {
				this.getView().byId("masterFooter").insertContentRight(oControl);
			} else {
				this.addMasterFooterContent(oControl);
			}
		},
		/**
		 *@description Adds content to Master Footer alignment: Right
		 *@param oControl
		 */
		addMasterFooterContent : function(oControl) {
			var self = this;
			if (this.oActionListPopover === undefined) {
				this.oActionListPopover = new sap.m.Popover({
					showHeader : false,
					placement : sap.m.PlacementType.Top
				});
			}
			if (typeof oControl.getWidth === "function") {
				oControl.setWidth("100%");
			}
			if (this.footerContentButton === undefined) {
				this.getView().byId("masterFooter").getContentRight()[0].setWidth("71%"); //Max character length 14 for first content in this case
				this.footerContentButton = new sap.m.Button({
					icon : "sap-icon://overflow",
					press : function(oEvent) {
						self.oActionListPopover.openBy(oEvent.getSource());
					},
					type : "Transparent",
					tooltip : this.oCoreApi.getTextNotHtmlEncoded("moreIcon")
				});
			}
			this.oActionListPopover.addContent(oControl);
			this.getView().byId("masterFooter").insertContentRight(this.footerContentButton, 1);
		},
		/**
		 *@description Adds content to Detail Footer alignment: Left
		 *@param oContol
		 */
		addDetailFooterContentLeft : function(oControl) {
			this.getView().byId("masterFooter").addContentLeft(oControl);
		},
		/**
		 *@description Adds facetfilter to the layout view
		 *@param facetFilter {object} - UI5 control
		 */
		addFacetFilter : function(facetFilter) {
			this.getView().byId("subHeader").addContent(facetFilter);
		},
		/**
		 *@description Enables or disables OpenIn button depending on whether global and step specific navigation targets are available
		 *If there are no global navigation targets disable OpenIn and if available enable OpenIn
		 *If there are step specific navigation targets in a current active step enable OpenIn
		 *On removal of a step or creation of new path or opening a new path disable/enable OpenIn
		 */
		enableDisableOpenIn : function() {
			var self = this;
			if (!self.openInBtn) {
				return;
			}
			var rerenderingRequired = false;
			var oNavTargetsPromise = this.oNavigationHandler.getNavigationTargets();
			oNavTargetsPromise.then(function(navTargets) {
				if (navTargets.global.length === 0 && navTargets.stepSpecific.length === 0) {
					if (self.openInBtn.getEnabled()) {
						rerenderingRequired = true;
						self.openInBtn.setEnabled(false);
					}
				} else {
					if (!self.openInBtn.getEnabled()) {
						rerenderingRequired = true;
						self.openInBtn.setEnabled(true);
					}
				}
				if (rerenderingRequired) {
					self.openInBtn.rerender();//Re rendering the button after enabling or disabling because the control does not reflect these changes
				}
			});
		},
		/**
		 *@description Adds the "Open In..." button to the footer and makes call for the popover
		 */
		addOpenInButton : function() {
			var self = this;
			if (this.oNavListPopover === undefined) {
				this.oNavListPopover = new sap.m.Popover({
					showHeader : false,
					placement : sap.m.PlacementType.Top
				});
			}
			//creates the button and appends it to the footer content
			this.openInBtn = new sap.m.Button({
				id : this.createId("idOpenInButton"),
				text : this.oCoreApi.getTextNotHtmlEncoded("openIn"),
				tooltip : this.oCoreApi.getTextNotHtmlEncoded("openIn"),
				type : "Transparent",
				enabled : false,
				press : function(oEvent) {
					//call to view for NavigationTarget Action list	only on press of openIn button
					self.oNavTargetsView = sap.ui.view({
						viewName : "sap.apf.ui.reuse.view.navigationTarget",
						type : sap.ui.core.mvc.ViewType.JS,
						viewData : {
							oNavigationHandler : self.oNavigationHandler,
							oNavListPopover : self.oNavListPopover,//Required by navigationTarget.view in order to add the action list content to the pop over
							oOpenInButtonEventSource : oEvent.getSource(),//Required by navigationTarget.view in order to open the pop over after content is added
							oUiApi : self.oUiApi,
							oCoreApi : self.oCoreApi
						//Required by navigationTarget.view in order to set busy indicator
						}
					});
				}
			});
			this.getView().byId("masterFooter").insertContentRight(this.openInBtn, 1);
			this.enableDisableOpenIn();
		},
		doOkOnNavAnalysisPath : function() {
			var self = this;
			var toolBarController = this.oUiApi.getAnalysisPath().getToolbar();
			this.oCoreApi.readPaths(function(respObj, metaData, msgObj) {
				var bSaveAs = true;
				var paths = respObj.paths;
				if (metaData !== undefined) {
					toolBarController.maxNumberOfSteps = metaData.getEntityTypeMetadata().maximumNumberOfSteps;
					toolBarController.maxNumberOfPaths = metaData.getEntityTypeMetadata().maxOccurs;
				}
				if (msgObj === undefined && (typeof respObj === "object")) {
					toolBarController.getController().getSaveDialog(bSaveAs, function() {
						window.history.go(-1);
					}, paths);
				} else {
					var oMessageObject = self.oCoreApi.createMessageObject({
						code : "6005",
						aParameters : []
					});
					oMessageObject.setPrevious(msgObj);
					self.oCoreApi.putMessage(oMessageObject);
				}
			});
		},
		handleNavBack : function() {
			var self = this;
			if (self.oUiApi.getLayoutView().getController().oSavedPathName.getText().slice(0, 1) === "*" && self.oCoreApi.getSteps().length !== 0) {
				var newDialog = new sap.ui.jsfragment("sap.apf.ui.reuse.fragment.newMessageDialog", this);
				self.getView().byId("idYesButton").attachPress(function() {
					newDialog.close();
					self.doOkOnNavAnalysisPath();
				});
				self.getView().byId("idNoButton").attachPress(function() {
					newDialog.close();
					window.history.go(-1);
				});
				var cancelButton = new sap.m.Button(self.createId("idCancelButton"), {
					text : self.oCoreApi.getTextNotHtmlEncoded("cancel"),
					press : function() {
						newDialog.close();
					}
				});
				newDialog.addButton(cancelButton);
				if (sap.ui.Device.system.desktop) {
					newDialog.addStyleClass("sapUiSizeCompact");
				}
				newDialog.setInitialFocus(newDialog);
				newDialog.open();
			} else {
				window.history.go(-1);
			}
		}
	});
}());
