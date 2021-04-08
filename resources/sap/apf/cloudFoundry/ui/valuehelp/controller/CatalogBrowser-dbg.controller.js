sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/IconPool",
    "sap/ui/core/library",
    "sap/ui/core/ValueState",
    "sap/ui/core/Item",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageToast",
    "sap/apf/cloudFoundry/ui/utils/ODataServiceUtils"
 ], function (Controller, IconPool, Library, ValueState, Item, JSONModel, ODataModel, Filter, FilterOperator, Sorter, MessageToast, ODataServiceUtils) {
    "use strict";

    // BEGIN_COMPATIBILITY
    ValueState = Library.ValueState;
    // END_COMPATIBILITY

    var PACKAGE = "sap.apf.cloudFoundry.ui.valuehelp";
    var DIALOG_PAGES = {
        BACK: -1,
        DESTINATIONS: 0,
        CATALOG: 1,
        URL: 2,
        OVERVIEW: 3,
        OVERVIEW_REDUCED: 4,
        OVERVIEW_SERVICEONLY: 5
    };

    function resolveUri(oComponent, sUri) {
        return oComponent.getManifestObject().resolveUri(sUri).toString();
    }

    return Controller.extend(PACKAGE + ".controller.CatalogBrowser", {
        /**
         * Called by UI5 on creation of the controller
         * Initiates the top-level JSON-Models for destinations and translation, opens the dialog
         */
        onInit: function() {
            var oComponent = this.getOwnerComponent();
            var DESTINATIONS = resolveUri(oComponent, oComponent.getManifestEntry("/sap.app/dataSources/apf.destinationCatalog.destinations").uri);

            this.sDestination = undefined;
            this.sService = undefined;

            this.oCoreApi = oComponent.oCoreApi;

            var oDialog = this.getDialog();
            var oView = this.getView();

            /* Styling-Issues */
            oDialog.removeStyleClass("sapUiPopupWithPadding");
            oDialog.addStyleClass("sapMSelectDialog");

            /* Set Model for UI State, i.e. dialog title */
            var oUiModel = new JSONModel({
                Title: this.translate("selectDestination"),
                Destination: "",
                Service: "",
                ServiceUrlValueState: ValueState.None,
                SearchEnabled: true,
                ButtonOkEnabled: false,
                ButtonSelectEnabled: false,
                ButtonBackEnabled: false
            });
            oView.setModel(oUiModel, "ui");

            /* Set Model for Destinations */
            var oModel = new JSONModel(DESTINATIONS);
            oView.setModel(oModel, "destinations");

            oModel.attachRequestCompleted(function() {
                this.oDestinationStatusPromises = ODataServiceUtils.pingDestinations(oModel.getData().destinations);
            }.bind(this));

            /* Add custom events */
            this.addCustomEventDelegates();

            oDialog.open();
        },
        /**
         * Add custom events
         */
        addCustomEventDelegates: function() {
            var oView = this.getView();

            oView.byId("urlInput").addEventDelegate({
                onkeypress: function(oEvent) {
                    if (oEvent.key === "Enter") {
                        this.onSelectServiceUrl();
                    }
                }.bind(this)
            });
        },
        /**
         * Event Handler on selection of a destination
         * Creates the OData-Model, sets the texts and navigates to the correct page depending on the destination
         * If the destination has an OData-Catalog the catalog page is opened, otherwise a URL input page is opened
         * @param {sap.ui.base.Event} oEvent Event from UI5
         */
        onSelectDestination: function(oEvent) {
            this.destinationPath = oEvent.getSource().getBindingContext("destinations").getPath();

            var oView = this.getView();
            var oDestinationsModel = oView.getModel("destinations");

            var oDestination = oDestinationsModel.getObject(this.destinationPath);

            this.destinationSearch = oView.byId("searchField").getValue();
            oView.byId("searchField").setValue("");

            this.oDestinationStatusPromises[oDestination.name].then(function(status) {
                switch (status) {
                    case ODataServiceUtils.DESTINATION_TYPE.SERVICE:
                        this.navigate(DIALOG_PAGES.OVERVIEW_SERVICEONLY, {
                            destination: oDestination.name
                        });
                        this.setIsAnalyticalService();

                        oView.byId("serviceOnlyOverview").bindElement({ path: this.destinationPath, model: "destinations" });
                        break;
                    case ODataServiceUtils.DESTINATION_TYPE.CATALOG:
                        this.navigate(DIALOG_PAGES.CATALOG, {
                            destination: oDestination.name
                        });

                        this.attachCatalogModel(oDestination.name);
                        break;
                    default:
                        var oUrlInput = oView.byId("urlInput");
                        oUrlInput.setValue("");
                        oUrlInput.removeAllItems();
                        oUrlInput.setShowButton(false);

                        this.navigate(DIALOG_PAGES.URL, {
                            destination: oDestination.name
                        });

                        ODataServiceUtils.discoverServices(oDestination.name).then(function(aEndpoints) {
                            if (aEndpoints.length > 0) {
                                aEndpoints.forEach(function(oEndpoint) {
                                    oUrlInput.addItem(new Item({
                                        text: oEndpoint.Url
                                    }));
                                });
                                oUrlInput.setShowButton(true);
                            }
                        }).catch(function() {});
                        break;
                }
            }.bind(this));
        },
        /**
         * Attaches the catalog model for a destination and sets up the service filtering
         * @param {string} sDestination The selected destination
         */
        attachCatalogModel: function(sDestination) {
            var oView = this.getView();

            var oListForFiltering = oView.byId("navContainer").getCurrentPage().getContent()[0];
            // Reset custom search parameter binding
            oListForFiltering.bindItems({
                path: "catalog>/ServiceCollection",
                sorter: new Sorter("TechnicalServiceName", /*bDescending*/ false),
                parameters: { custom: { search: "" } },
                template: oListForFiltering.getBindingInfo("items").template // reuse old template
            });

            var oModel = new ODataModel(ODataServiceUtils.getCatalogURL(sDestination));
            oView.setModel(oModel, "catalog");
            var oList = oView.byId("selectService");

            // The ODataModel won't set the List to busy while loading Metadata, so we do it manually.
            oList.setBusy(true);
            oModel.attachMetadataLoaded(function() {
                oList.setBusy(false);
            });
            // If the Metadata can't be retrieved (proxy fails, not an onPremise system, no cloud connector) show a message and go back.
            oModel.attachMetadataFailed(function(oEvent) {
                this.onBack();
                MessageToast.show(this.translate("destinationError", oEvent.getParameter("responseText")));
                oList.setBusy(false);
            }.bind(this));
        },
        /**
         * Event Handler on selection of a service
         * Navigates to Overview Page
         * @param {sap.ui.base.Event} oEvent Event from UI5
         */
        onSelectService: function(oEvent) {
            var oView = this.getView();
            var oBinding = oEvent.getSource().getBindingContext("catalog");
            var sService = ODataServiceUtils.getRelativeServiceURL(oBinding.getProperty("ServiceUrl"));

            this.navigate(DIALOG_PAGES.OVERVIEW, {
                service: sService
            });
            this.setIsAnalyticalService();

            var sPath = oBinding.getPath();
            oView.byId("destinationOverview").bindElement({ path: this.destinationPath, model: "destinations" });
            oView.byId("serviceOverview").bindElement({ path: sPath, model: "catalog" });
        },
        /**
         * Event Handler on selection of a service via URL input
         * Navigates to Overview Page
         */
        onSelectServiceUrl: function() {
            var oView = this.getView();
            var oUiModel = oView.getModel("ui");
            var sService = oView.byId("urlInput").getValue();

            if (!sService.startsWith("/")) {
                oUiModel.setProperty("/ServiceUrlValueState", ValueState.Error);
                return;
            }
            oUiModel.setProperty("/ServiceUrlValueState", ValueState.None);

            this.navigate(DIALOG_PAGES.OVERVIEW_REDUCED, {
                service: sService
            });
            this.setIsAnalyticalService();

            oView.byId("reducedDestinationOverview").bindElement({ path: this.destinationPath, model: "destinations" });
        },
        /**
         * Event Handler on pressing the cancel-button
         * Closes the dialog
         */
        onCancel: function() {
            this.getDialog().close();
            this.getDialog().destroy();
            this.getView().destroy();
            this.destroy();
        },
        /**
         * Event Handler on pressing the back-button
         * Navigates back
         */
        onBack: function() {
            var oView = this.getView();

            var pageIndex = this.navigate(DIALOG_PAGES.BACK);
            //additional cleanup
            switch (pageIndex) {
                case DIALOG_PAGES.DESTINATIONS:
                    oView.byId("searchField").setValue(this.destinationSearch); // restore old search
                    break;
                default:
                    break;
            }
        },
        /**
         * Event Handler on pressing the ok-button
         * selects the dialog
         */
        onOk: function() {
            var oView = this.getView();
            var oUiModel = oView.getModel("ui");

            var sUrl = ODataServiceUtils.getFullServiceURL(oUiModel.getProperty("/Destination"), oUiModel.getProperty("/Service"));
            var oViewData = this.getView().getViewData();

            oViewData.parentControl.fireEvent("selectService", {
                "sSelectedService" : sUrl
            });

            this.getDialog().close();
            this.getDialog().destroy();
            this.getView().destroy();
            this.destroy();
        },
        /**
         * Event Handler for live-change in the SearchField
         * @param {sap.ui.base.Event} oEvent Event from UI5
         */
        onLiveChangeSearch: function(oEvent) {
            var sSearch = oEvent.getParameter("newValue");

            // execute search after user stops typing for 300ms
            // taken from the behavior of sap.m.SelectDialog
            var iDelay = (sSearch ? 300 : 0); // no delay if value is empty
            var that = this;
            clearTimeout(this.iLiveChangeTimer);
            if (iDelay) {
                this.iLiveChangeTimer = setTimeout(function () {
                    that.executeSearch(sSearch);
                }, iDelay);
            } else {
                this.executeSearch(sSearch);
            }
        },
        /**
         * Event Handler for search in the SearchField
         * @param {sap.ui.base.Event} oEvent Event from UI5
         */
        onSearch: function(oEvent) {
            this.executeSearch(oEvent.getSource().getValue());
        },
        /**
         * Filters the currently visible List according to the search term
         * @param {string} sSearch Search Term
         */
        executeSearch: function(sSearch) {
            var oView = this.getView();
            var oListForFiltering = oView.byId("navContainer").getCurrentPage().getContent()[0];
            var bForService = oView.getModel("ui").getProperty("/Destination") !== "";
            if (bForService) {
                // Search Services: Use ?search=<sSearch> for full-text search. This unfortunately requires creating a whole new binding
                oListForFiltering.bindItems({
                    path: "catalog>/ServiceCollection",
                    sorter: new Sorter("TechnicalServiceName", /*bDescending*/ false),
                    parameters: { custom: { search: sSearch } },
                    template: oListForFiltering.getBindingInfo("items").template // reuse old template
                });
            } else {
                // Search Destinations: Use filters on the JSONModel
                oListForFiltering.getBinding("items").filter(new Filter({
                    filters: [
                        new Filter({
                            path: 'name',
                            operator: FilterOperator.Contains,
                            value1: sSearch
                        }),
                        new Filter({
                            path: 'description',
                            operator: FilterOperator.Contains,
                            value1: sSearch
                        })
                    ],
                    and: false
                }));
            }
        },
        /**
         * Set the ServiceStatus property in the UI model
         * This operation sets the property asynchronous (pending first, then the correct value)
         * @returns {Promise} A promise resolving when the service status is set
         */
        setIsAnalyticalService: function() {
            var oUiModel = this.getView().getModel("ui");

            var destination = oUiModel.getProperty("/Destination");
            var service = oUiModel.getProperty("/Service");

            oUiModel.setProperty("/ServiceStatus", ODataServiceUtils.SERVICE_STATUS.PENDING);

            return ODataServiceUtils.isAnalyticalService(destination, service).then(function(analyticalService) {
                oUiModel.setProperty("/ServiceStatus", analyticalService);
            }).catch(function(error) {
                oUiModel.setProperty("/ServiceStatus", error);
            });
        },
        /**
         * Provide the correct icon URL for the 'service status' property
         * @param {string} serviceStatus A value from ODataServiceUtils.SERVICE_STATUS
         * @returns {string} The icon URL
         */
        serviceStatusIcon: function(serviceStatus) {
            switch (serviceStatus) {
                case ODataServiceUtils.SERVICE_STATUS.ANALYTICAL_SERVICE:
                    return IconPool.getIconURI("status-positive");
                case ODataServiceUtils.SERVICE_STATUS.NOT_ANALYTICAL_SERVICE:
                    return IconPool.getIconURI("status-critical");
                case ODataServiceUtils.SERVICE_STATUS.WRONG_ODATA_VERSION:
                    return IconPool.getIconURI("status-error");
                case ODataServiceUtils.SERVICE_STATUS.NOT_ACCESSIBLE:
                    return IconPool.getIconURI("status-error");
                default:
                    return IconPool.getIconURI("status-inactive");
            }
        },
        /**
         * Provide the correct value state for the 'service status' property
         * @param {string} serviceStatus A value from ODataServiceUtils.SERVICE_STATUS
         * @returns {sap.ui.core.ValueState} The value state
         */
        serviceStatusState: function(serviceStatus) {
            switch (serviceStatus) {
                case ODataServiceUtils.SERVICE_STATUS.ANALYTICAL_SERVICE:
                    return ValueState.Success;
                case ODataServiceUtils.SERVICE_STATUS.NOT_ANALYTICAL_SERVICE:
                    return ValueState.Warning;
                case ODataServiceUtils.SERVICE_STATUS.WRONG_ODATA_VERSION:
                    return ValueState.Error;
                case ODataServiceUtils.SERVICE_STATUS.NOT_ACCESSIBLE:
                    return ValueState.Error;
                default:
                    return ValueState.None;
            }
        },
        /**
         * Provide the correct text for the 'service status' property
         * @param {string} serviceStatus A value from ODataServiceUtils.SERVICE_STATUS
         * @returns {string} The translated string describing the 'service status' property
         */
        serviceStatusText: function(serviceStatus) {
            switch (serviceStatus) {
                case ODataServiceUtils.SERVICE_STATUS.ANALYTICAL_SERVICE:
                    return this.translate("analyticalService");
                case ODataServiceUtils.SERVICE_STATUS.NOT_ANALYTICAL_SERVICE:
                    return this.translate("nonAnalyticalService");
                case ODataServiceUtils.SERVICE_STATUS.WRONG_ODATA_VERSION:
                    return this.translate("wrongOdataVersion");
                case ODataServiceUtils.SERVICE_STATUS.NOT_ACCESSIBLE:
                    return this.translate("serviceNotAccessible");
                default:
                    return this.translate("pending");
            }
        },
        /**
         * Provide the correct icon URL for the 'proxy type' property
         * @param {string} proxyType A value indicating if a destination is an on-premise or a cloud destination
         * @returns {string} The icon URL
         */
        proxyTypeIcon: function(proxyType) {
            switch (proxyType) {
                case "OnPremise":
                    return IconPool.getIconURI("it-host");
                default:
                    return IconPool.getIconURI("cloud");
            }
        },
        /**
         * Provide the correct text for the 'proxy type' property
         * @param {string} proxyType A value indicating if a destination is an on-premise or a cloud destination
         * @returns {string} The translated string describing the 'proxy type' property
         */
        proxyTypeText: function(proxyType) {
            switch (proxyType) {
                case "OnPremise":
                    return this.translate("onPremise");
                default:
                    return this.translate("cloud");
            }
        },
        /**
         * Formatter function for translation, arguments can be passed as additional parameters
         * @param {string} key The key for the translation
         * @returns {string} The translated text
         */
        translate: function(key) {
            return this.oCoreApi.getText(key, Array.prototype.slice.call(arguments, 1));
        },
        /**
         * Formatter function for service URLs
         */
        getRelativeServiceURL: ODataServiceUtils.getRelativeServiceURL,
        /**
         * Page navigation using the NavContainer
         * @param {int} pageIndex The index of the page to navigate to or BACK (= -1) for back navigation
         * @param {object} options Special values to set in the UI model, usage depends on the destination page
         * @returns {int} The current page after the navigation (same as pageIndex, except when using back navigation)
         */
        navigate: function(pageIndex, options) {
            var oView = this.getView();
            var oUiModel = oView.getModel("ui");
            var navContainer = oView.byId("navContainer");

            options = options || {};
            options.destination = options.destination || oUiModel.getProperty("/Destination");
            options.service = options.service || oUiModel.getProperty("/Service");

            var _pageIndex;
            if (pageIndex < 0) {
                var prevPage = navContainer.getPreviousPage();
                _pageIndex = navContainer.indexOfPage(prevPage);
            } else {
                _pageIndex = pageIndex;
            }

            switch (_pageIndex) {
                case DIALOG_PAGES.DESTINATIONS:
                    oUiModel.setProperty("/Title", this.translate("selectDestination"));
                    oUiModel.setProperty("/Destination", "");
                    oUiModel.setProperty("/Service", "");
                    oUiModel.setProperty("/ServiceUrlValueState", ValueState.None);
                    oUiModel.setProperty("/SearchEnabled", true);
                    oUiModel.setProperty("/ButtonOkEnabled", false);
                    oUiModel.setProperty("/ButtonSelectEnabled", false);
                    oUiModel.setProperty("/ButtonBackEnabled", false);
                    break;
                case DIALOG_PAGES.CATALOG:
                    oUiModel.setProperty("/Title", this.translate("selectService", options.destination));
                    oUiModel.setProperty("/Destination", options.destination);
                    oUiModel.setProperty("/Service", "");
                    oUiModel.setProperty("/ServiceUrlValueState", ValueState.None);
                    oUiModel.setProperty("/SearchEnabled", true);
                    oUiModel.setProperty("/ButtonOkEnabled", false);
                    oUiModel.setProperty("/ButtonSelectEnabled", false);
                    oUiModel.setProperty("/ButtonBackEnabled", true);
                    break;
                case DIALOG_PAGES.URL:
                    oUiModel.setProperty("/Title", this.translate("enterService", options.destination));
                    oUiModel.setProperty("/Destination", options.destination);
                    oUiModel.setProperty("/Service", "");
                    oUiModel.setProperty("/ServiceUrlValueState", ValueState.None);
                    oUiModel.setProperty("/SearchEnabled", false);
                    oUiModel.setProperty("/ButtonOkEnabled", false);
                    oUiModel.setProperty("/ButtonSelectEnabled", true);
                    oUiModel.setProperty("/ButtonBackEnabled", true);
                    break;
                case DIALOG_PAGES.OVERVIEW:
                    oUiModel.setProperty("/Title", this.translate("overview"));
                    oUiModel.setProperty("/Destination", options.destination);
                    oUiModel.setProperty("/Service", options.service);
                    oUiModel.setProperty("/ServiceUrlValueState", ValueState.None);
                    oUiModel.setProperty("/SearchEnabled", false);
                    oUiModel.setProperty("/ButtonOkEnabled", true);
                    oUiModel.setProperty("/ButtonSelectEnabled", false);
                    oUiModel.setProperty("/ButtonBackEnabled", true);
                    break;
                case DIALOG_PAGES.OVERVIEW_REDUCED:
                    oUiModel.setProperty("/Title", this.translate("overview"));
                    oUiModel.setProperty("/Destination", options.destination);
                    oUiModel.setProperty("/Service", options.service);
                    oUiModel.setProperty("/ServiceUrlValueState", ValueState.None);
                    oUiModel.setProperty("/SearchEnabled", false);
                    oUiModel.setProperty("/ButtonOkEnabled", true);
                    oUiModel.setProperty("/ButtonSelectEnabled", false);
                    oUiModel.setProperty("/ButtonBackEnabled", true);
                    break;
                case DIALOG_PAGES.OVERVIEW_SERVICEONLY:
                    oUiModel.setProperty("/Title", this.translate("overview"));
                    oUiModel.setProperty("/Destination", options.destination);
                    oUiModel.setProperty("/Service", "");
                    oUiModel.setProperty("/ServiceUrlValueState", ValueState.None);
                    oUiModel.setProperty("/SearchEnabled", false);
                    oUiModel.setProperty("/ButtonOkEnabled", true);
                    oUiModel.setProperty("/ButtonSelectEnabled", false);
                    oUiModel.setProperty("/ButtonBackEnabled", true);
                    break;
                default:
                    oUiModel.setProperty("/Title", this.translate("selectDestination"));
                    oUiModel.setProperty("/Destination", "");
                    oUiModel.setProperty("/Service", "");
                    oUiModel.setProperty("/ServiceUrlValueState", ValueState.None);
                    oUiModel.setProperty("/SearchEnabled", true);
                    oUiModel.setProperty("/ButtonOkEnabled", false);
                    oUiModel.setProperty("/ButtonSelectEnabled", false);
                    oUiModel.setProperty("/ButtonBackEnabled", false);

                    _pageIndex = DIALOG_PAGES.DESTINATIONS;
                    break;
            }

            if (pageIndex < 0) {
                navContainer.back();
            } else {
                var page = navContainer.getPages()[_pageIndex];
                navContainer.to(page);
            }

            return _pageIndex;
        },
        getDialog: function() {
            var oDialog = this.getView().byId("catalogBrowser");
            var oView = this.getView();
            if (!oDialog) {
                // create dialog as dependent via fragment factory
                oDialog = sap.ui.xmlfragment(oView.getId(), PACKAGE + ".fragment.CatalogBrowser", this);
                oView.addDependent(oDialog);
             }
             return oDialog;
        }
    });
});
