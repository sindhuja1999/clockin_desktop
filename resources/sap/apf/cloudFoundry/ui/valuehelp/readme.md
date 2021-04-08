# Service Selection Dialog

This folder provides all necessary modules to display a custom ValueHelp-Dialog when selecting a Service in the Modeler.

It is enabled when the injections `isUsingCloudFoundryProxy` returns true.

## showValueHelp

`showValueHelp.js` provides the function called in `sap.apf.modeler.ui.controller.requestOptions`. It uses `utils.ComponentCorrector` to create the CatalogBrowser-View, passing on the provided `oEventData`.

## CatalogBrowser

The CatalogBrowser is the hierarchical Dialog, through which a user may select a Destination as configured in SCP's destination service as well as an OData-Service. The OData Service can either be found in the system's OData catalog or, if not present, accessed by entering the service URL directly.

### View

Note that usually, the content would be defined in the view. However, Dialogs must not be in a Views `content`, but rather its `dependents` which can not be defined in an XMLView, but must be filled by the View's Controller with an additional XMLFragment.

### Controller

`onSelectDestination(..)` is called when the user selected a destination. The function then navigates to one of three pages:

- a searchable list of all services that are found in the destination's catalog service
- an input field (which might have a value help) to select a service based on it's URL
- an overview page, if the destination is directly referencing a service

`onSelectService(..)` is called when the user selected a service found in a destination's catalog service. The function then navigates to the overview page.

`onSelectServiceUrl(..)` is called when the user selected a service by entering it's URL or selecting it from the input field's value help.

`getDialog()` works as getter for the Reference for the Dialog and creates the instance from the XMLFragment if necessary.

`navigate(pageIndex, options)` is used to simplify the navigation with the NavContainer. The parameter `pageIndex` specifies the page to navigate to as defined in the enum `DIALOG_PAGES`. The paremter `options` can contain values that should be modified in the UI JSONModel. Only relevant values are changed and values that become invalid when entering the next page are reset. In addition the function returns the index of the page that it navigated to, which makes it possible to use the page index `BACK (-1)`.

The Catalog Service provides us with a Service Name (Alphanumeric+Underscore). However, we can't construct the full URL out of this, as a prefix (`sap`, `iwfnd`, ...) is needed that is not provided by the Service. The only solution is to use the parameter `URL` provided by the Catalog-Service that is, however, prefixed with the hostname of the system, which is not valid in the cloud. `getRelativeServiceURL(sServiceURL)` removes the hostname and returns just the URL of the Service relative to the destination.

### Fragment

The Dialog provides the title and the SearchField. A NavContainer is used to enable the hierarchical navigation. Unfortunately, the NavContainer breaks the Dialogs internal logic for scrolling, so its content needs to provide its own ScrollContainer.

Changing texts on the UI as well as switches, that control the behaviour or appearence of controls, are provided through a JSONModel `ui`. Destinations are provided through a JSONModel `destinations`, Services found in a destination's catalog through an ODataModel `catalog`.

The navigation structure is as follows:

#### Destination List

start page

contains a searchable list of all destinations

back to:
- _none_

forward to:
- Service Selection
- Service URL Selection
- Service-Only Overview

#### Service Selection

contains a searchable list of all services found in a destination's catalog

back to:
- Destination List

forward to:
- Overview

#### Service URL Selection

allows the user to enter the URL of a service directly, the URL is always relative to the selected destination, the input field for the URL might have a value help

back to:
- Destination List

forward to:
- Reduced Overview

#### Overview

shows a full overview of a selected service on a destination

back to:
- Service Selection

forward to:
- _select service_

#### Reduced Overview

shows a reduced overview of a selected service on a destination without a service catalog

back to:
- Service URL Selection

forward to:
- _select service_

#### Service-Only Overview

shows an overview of a destination that directly references a service, therefor the overview is not parted in "destination" and "service"

back to:
- Destination List

forward to:
- _select service_
