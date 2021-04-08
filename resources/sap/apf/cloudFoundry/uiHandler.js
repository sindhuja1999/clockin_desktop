/*!
 * SAP APF Analysis Path Framework
 *
 * (c) Copyright 2012-2018 SAP SE. All rights reserved
 */
sap.ui.define(['sap/apf/cloudFoundry/ui/sharedialog/showShareDialog','sap/apf/cloudFoundry/ui/valuehelp/showValueHelp','sap/apf/cloudFoundry/ui/bookmarkconfirmation/showBookmarkConfirmation','sap/apf/cloudFoundry/ui/utils/LaunchPageUtils'],function(s,a,b,L){'use strict';function i(c){var d=c.getApi();var e=d.getStartParameterFacade();var f=e.getAnalyticalConfigurationId().configurationId;var B=e.getParameter(L.BOOKMARK_LINK_PARAMETERS.BOOKMARK);if(f&&B=="true"){b.show(d,e);}}return{showShareDialog:s.show,showValueHelp:a.show,initRuntime:i};},true);
