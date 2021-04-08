# Utils

## ComponentCorrector

Sometimes in the APF, Views are not created at recommended times in the lifecycle, resulting in the connection to the `UIComponent` through a controller's `getOwnerComponent()`, the Views `getParent()` relationship (important when invalidating the UI), and all Models set at Component level (i.e. those set at `manifest.json`) to be lost. To circumvent issues arising from missing Component (i.e. SmartControls), missing parents (i.e. rerendering on Model changes), and Models (i.e. i18n), we introduced the ComponentCorrector, which can create Views restoring everything through the static method `createView`:

```js
sap.ui.define([
    "sap/apf/cf/modeler/static/utils/ComponentCorrector",
    "sap/ui/core/library"
], function(ComponentCorrector, CoreLibrary) {
    'use strict';

    var PACKAGE = "sap.apf.cf.modeler.static.valuehelp";
    var ViewType = CoreLibrary.mvc.ViewType;

    function showValueHelp(oEventData, oCoreApi) {
        ComponentCorrector.createView(oCoreApi.getComponent(), {
            viewName : PACKAGE + ".view.CatalogBrowser",
            type : ViewType.XML,
            viewData : oEventData
        });
    }
    
    return showValueHelp;
});
```

### Advanced Usage

The ComponentCorrector is a simple UI5 object with an API as follows:

```js
// Construct an instance for any given Component
var oComponentCorrector = new ComponentCorrector(oComponent);

// Run any function with the stored Component as its owner
oComponentCorrector.runAsComponent(fnFunction);

// Create a View, setting the stored Component and restoring its Models
// oViewConfig is the same object you'd pass to sap.ui.view() and sap.ui.core.mvc.View.create()
oComponentCorrector.createView(oViewConfig);
```

## LaunchPageUtils

The LaunchPageUtils contain functions to manage the Fiori LaunchPage. This includes generating hashes and links to start the APF Runtime, creating links that open the APF Runtime to add the current configuration as a bookmark ('bookmark link'), as well as creating bookmarks directly.

Note that bookmarks can only be created on the LaunchPage of the currently logged-in user. This is why bookmark links are generated and sent to other users.

## ODataServiceUtils

The ODataServiceUtils contain functions to discover services on different types of destinations.

`pingDestinations(..)` sends a request to all given destinations to check if the destination has a catalog service (`CATALOG`), is referencing a service directly (`SERVICE`) or something else (`OTHER`), for example a cloud destination without a service catalog.

`isAnalyticalService(..)` checks if a service is an analytical OData service (`ANALYTICAL_SERVICE`) or not (`NOT_ANALYTICAL_SERVICE`). Common errors, such as a wrong OData version (`WRONG_ODATA_VERSION`), are recognized as well. If the service is not available or an unknown errors occurs, the promise is resolved with a general error (`NOT_ACCESSIBLE`).

`discoverServices(..)` tries to discover services based on a generated HTML page that can be exposed on a destination. This is not a documented feature, but can be used to help users find OData services, if available. If successful the returned promise resolves with an array of objects:

```js
[{
    Url: "<relative service url>"
},
...]
```
