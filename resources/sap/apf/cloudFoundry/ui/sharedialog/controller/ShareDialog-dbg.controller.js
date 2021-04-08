sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/library",
	"sap/m/MessageBox",
	"sap/apf/cloudFoundry/ui/utils/LaunchPageUtils",
	"sap/ui/core/Fragment",
	"sap/ui/core/IconPool",
	"sap/ui/core/ValueState"
], function (Controller, JSONModel, Library, MessageBox, LaunchPageUtils, Fragment, IconPool, ValueState) {
	"use strict";

	var PACKAGE = "sap.apf.cloudFoundry.ui.sharedialog";

	return Controller.extend(PACKAGE + ".controller.ShareDialog", {
		/**
		* Called by UI5 on creation of the controller
		*/
		onInit: function() {
			var oComponent = this.getOwnerComponent();

			this.oCoreApi = oComponent.oCoreApi;

			var oView = this.getView();
			var oViewData = oView.getViewData();

			if (oViewData.oController.configEditor.isSaved()) {
				this.initializeDialog();
			} else {
				MessageBox.warning(this.translate("unsavedStateWarning"), {
					onClose: function() {
						//don't open dialog
						oView.destroy();
						this.destroy();
					}.bind(this)
				});
			}
		},
		/**
		 * Initialize the dialog, load the configuration, create the UI JSON-Model, open the dialog
		 */
		initializeDialog: function() {
			var oDialog = this.getDialog();
			var oView = this.getView();
			var oViewData = oView.getViewData();

			this.config = oViewData.oController._getNodeData({}, "configuration").data;
			this.runtimeLink = LaunchPageUtils.generateRuntimeLink(this.config.AnalyticalConfiguration); //AnalyticalConfiguration == configuration ID

			this.ui = new JSONModel({
				TileHeader: this.config.name,
				TileHeaderDefault: this.config.name,
				TileSubheader: this.translate("bookmarkSubheaderDefault"),
				TileIcon: "",
				TileIconValueState: ValueState.None,
				TileGroup: ""
			});
			oView.setModel(this.ui, "ui");

			this.updateTileTooltip();

			var oTilePreview = oView.byId("tilePreview");
			oTilePreview.addDelegate({
				onAfterRendering: function() {
					var id = oTilePreview.getDomRef().id;
					jQuery("#" + id).attr("tabindex", -1);
				}
			});

			oDialog.open();
		},
		/**
		 * Update the tile's tooltip with the tile's content
		 */
		updateTileTooltip: function() {
			var tooltip = "";

			tooltip += this.translate("bookmarkTooltipHeader", this.ui.getProperty("/TileHeader"));
			tooltip += "\n" + this.translate("bookmarkTooltipSubheader", this.ui.getProperty("/TileSubheader"));

			var icon = this.ui.getProperty("/TileIcon");
			if (icon !== "") {
				tooltip += "\n" + this.translate("bookmarkTooltipIcon", icon);
			}

			var group = this.ui.getProperty("/TileGroup");
			if (group !== "") {
				tooltip += "\n" + this.translate("bookmarkTooltipGroup", group);
			}

			this.ui.setProperty("/TileTooltip", tooltip);
		},
		/**
		 * Select the text in the control from start to end
		 * @param {sap.ui.core.Control} control The control to select in
		 * @param {int} start Start index for the selection
		 * @param {int} end End index for the selection
		 */
		selectText: function(control, start, end) {
			var element = document.getElementById(control.getIdForLabel());
			element.select();
			element.setSelectionRange(start, end);
		},
		/**
		 * Show the 'Show Link' Dialog
		 * @param {string} bookmarkLink The bookmark link
		 */
		showLinkDialog: function(bookmarkLink) {
			var that = this;
			var oView = this.getView();
			Fragment.load({
				id: oView.getId(),
				name: PACKAGE + ".fragment.ShowLinkDialog",
				controller: {
					getView: function() {
						return oView.byId("showLinkDialog");
					},
					translate: that.translate.bind(that),
					onBeforeOpen: function() {
						var textLink = oView.byId("textAreaLink");
						textLink.setValue(bookmarkLink);
					},
					onAfterOpen: function() {
						var textLink = oView.byId("textAreaLink");
						that.selectText(textLink, 0, bookmarkLink.length);
					},
					onAfterClose: function() {
						this.getView().destroy();
						oView.removeDependent(this.getView());
					},
					onButtonClosePress: function() {
						this.getView().close();
					}
				}
			}).then(function(oDialog) {
				oView.addDependent(oDialog);
				oDialog.open();
			});
		},
		/**
		 * Create a bookmark link based on the tile configuration
		 * @returns {string} The bookmark link
		 */
		getBookmarkLink: function() {
			var oView = this.getView();
			//get actual input values (no defaults)
			var header = oView.byId("inputHeader").getValue();
			var subheader = oView.byId("inputSubheader").getValue();
			var icon = oView.byId("inputIcon").getValue();
			var group = oView.byId("inputGroup").getValue();

			// get the icon uri if the icon is valid
			var iconInfo = IconPool.getIconInfo(icon);
			if (iconInfo) {
				icon = iconInfo.uri;
			} else {
				icon = "";
			}

			return LaunchPageUtils.buildBookmarkLink(this.runtimeLink, header, subheader, icon, group);
		},
		/**
		 * Event Handler on pressing the 'Show Link'-action item
		 * Opens the 'Show Link' dialog
		 */
		onShowLink: function() {
			var bookmarkLink = this.getBookmarkLink();
			this.showLinkDialog(bookmarkLink);
		},
		/**
		 * Event Handler on pressing the 'Send in email'-action item
		 * Opens the link in a new email
		 */
		onSendEmail: function() {
			//get input value or default
			var sHeader = this.ui.getProperty("/TileHeader");
			var sBookmarkLink = this.getBookmarkLink();
			var sHelpLink = this.translate("helpLink");

			var subject = this.translate("emailTemplateSubject", sHeader);
			var text = this.translate("emailTemplateText", sHeader, sBookmarkLink, sHelpLink);
			Library.URLHelper.triggerEmail("", subject, text);
		},
		/**
		 * Event Handler on pressing the 'Save as Tile'-button.
		 * Updates the bookmark tile on the launchpad (if already present) or creates a new one.
		 * The values are read from the tile configuration.
		 */
		onMarkFavorite: function() {
			//get input values or default
			var header = this.ui.getProperty("/TileHeader");
			var subheader = this.ui.getProperty("/TileSubheader");
			var icon = this.ui.getProperty("/TileIcon");
			var group = this.ui.getProperty("/TileGroup");

			LaunchPageUtils.setBookmarkTile(this.runtimeLink, header, subheader, icon, group);
		},
		/**
		 * Event Handler on changing the header field of the tile configuration.
		 * @param {sap.ui.base.Event} oControlEvent The event from the input containing the new value
		 */
		onHeaderChange: function(oControlEvent) {
			var header = oControlEvent.getParameters().value;
			if (header == "") {
				header = this.config.name;
			}
			this.ui.setProperty("/TileHeader", header);
			this.updateTileTooltip();
		},
		/**
		 * Event Handler on changing the subheader field of the tile configuration.
		 * @param {sap.ui.base.Event} oControlEvent The event from the input containing the new value
		 */
		onSubheaderChange: function(oControlEvent) {
			var subheader = oControlEvent.getParameters().value;
			if (subheader == "") {
				subheader = this.translate("bookmarkSubheaderDefault");
			}
			this.ui.setProperty("/TileSubheader", subheader);
			this.updateTileTooltip();
		},
		/**
		 * Event Handler on changing the icon field of the tile configuration.
		 * @param {sap.ui.base.Event} oControlEvent The event from the input containing the new value
		 */
		onIconChange: function(oControlEvent) {
			var icon = oControlEvent.getParameters().value;
			var info = IconPool.getIconInfo(icon);
			if (icon === "") {
				this.ui.setProperty("/TileIcon", "");
				this.ui.setProperty("/TileIconValueState", ValueState.None);
			} else if (info) {
				this.ui.setProperty("/TileIcon", info.uri);
				this.ui.setProperty("/TileIconValueState", ValueState.None);
			} else {
				this.ui.setProperty("/TileIcon", "");
				this.ui.setProperty("/TileIconValueState", ValueState.Error);
			}
			this.updateTileTooltip();
		},
		/**
		 * Event Handler on changing the group field of the tile configuration.
		 * @param {sap.ui.base.Event} oControlEvent The event from the input containing the new value
		 */
		onGroupChange: function(oControlEvent) {
			var group = oControlEvent.getParameters().value;
			this.ui.setProperty("/TileGroup", group);
			this.updateTileTooltip();
		},
		/**
		 * Event Handler on pressing the close-button
		 * Closes the dialog
		 */
		onClose: function() {
			this.getDialog().close();
			this.getDialog().destroy();
			this.getView().destroy();
			this.destroy();
		},
		/**
		 * Find the dialog defined in the fragment or create it if it doesn't exist
		 * @returns {sap.ui.core.Control} The root control of the fragment content
		 */
		getDialog: function() {
			var oView = this.getView();
			var oDialog = oView.byId("shareDialog");
			if (!oDialog) {
				// create dialog as dependent via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), PACKAGE + ".fragment.ShareDialog", this);
				oView.addDependent(oDialog);
			}
			return oDialog;
		},
		/**
		 * Formatter function for translation, arguments can be passed as additional parameters
		 * @param {string} key The key for the translation
		 * @returns {string} The translated text
		 */
		translate: function(key) {
			return this.oCoreApi.getText(key, Array.prototype.slice.call(arguments, 1));
		}
	});
});
