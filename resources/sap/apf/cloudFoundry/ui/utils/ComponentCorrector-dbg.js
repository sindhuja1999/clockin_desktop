sap.ui.define([
    'sap/ui/base/Object',
    'sap/ui/core/Component',
    'sap/ui/core/mvc/View'
], function(BaseObject, Component, View) {
    'use strict';

    var PACKAGE = 'sap.apf.cloudFoundry.ui.utils';

    /**
     * Inside the APF, the Owner Component of a View and therefor its Models may get lost.
     * This Module provides an API to create Views restoring the relationship and Models.
     */
    var ComponentCorrector = BaseObject.extend(PACKAGE + '.ComponentCorrector', {
        /**
         * Construct the ComponentCorrector
         * @param {sap.ui.core.Component} oComponent The (UI)Component to be used
         */
        constructor: function(oComponent) {
            if (!(this instanceof ComponentCorrector)) {
                throw Error("Cannot instantiate object: \"new\" is missing!");
            }
            if (oComponent instanceof Component) {
                this.oComponent = oComponent;
            } else {
                throw Error("Cannot instantiate object: \"oComponent\" is not a Component!");
            }
        },
        /**
         * Run a function with the Component as its owner
         * @param {function} fn The function to be run
         * @returns {*} The return value of the function
         */
        runAsComponent: function(fn) {
            return this.oComponent.runAsOwner(fn);
        },
        /**
         * Create a view for restoring Owner Component and Models
         * @param {object} mOptions as described in sap.ui.core.mvc.View.create
         * @returns {Promise} A promise resolving with the View
         */
        createView: function(mOptions) {
            var oComponent = this.oComponent;
            return this.runAsComponent(function() {
                return View.create(mOptions).then(function(oView) {
                    if (!oView.bIsDestroyed) {
                        // Copy all Models from the Component to the View (if they are not present there)
                        // This is necessary, as just having the correct owner doesn't make it's Models available
                        Object.keys(oComponent.oModels).forEach(function(sModelId) {
                            if (!oView.getModel(sModelId)) {
                                oView.setModel(oComponent.getModel(sModelId), sModelId);
                            }
                        });
                        // Set the Component as the Views Parent to restore a reference to the UIArea and enable correct rerendering
                        oView.setParent(oComponent);
                        return oView;
                    }
                    return null;
                });
            });
        }
    });

    /**
     * Create a view for restoring Owner Component and Models
     * @param {sap.ui.core.Component} oComponent The (UI)Component to be used
     * @param {object} mOptions as described in sap.ui.core.mvc.View.create
     * @returns {Promise} A promise resolving with the View
     */
    ComponentCorrector.createView = function(oComponent, mOptions) {
        return new ComponentCorrector(oComponent).createView(mOptions);
    };

    return ComponentCorrector;
}, true);
