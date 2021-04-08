/*!
 * SAP APF Analysis Path Framework
 *
 * (c) Copyright 2012-2018 SAP SE. All rights reserved
 */

sap.ui.define([
	'sap/apf/cloudFoundry/ui/sharedialog/showShareDialog',
	'sap/apf/cloudFoundry/ui/valuehelp/showValueHelp',
	'sap/apf/cloudFoundry/ui/bookmarkconfirmation/showBookmarkConfirmation',
	'sap/apf/cloudFoundry/ui/utils/LaunchPageUtils'
],function(showShareDialog, showValueHelp, showBookmarkConfirmation, LaunchPageUtils) {
	'use strict';

	function initRuntime(oComponent) {
		var api = oComponent.getApi();

		var startParameters = api.getStartParameterFacade();
		var configurationId = startParameters.getAnalyticalConfigurationId().configurationId;
		var sBookmark = startParameters.getParameter(LaunchPageUtils.BOOKMARK_LINK_PARAMETERS.BOOKMARK);

		if (configurationId && sBookmark == "true") {
			showBookmarkConfirmation.show(api, startParameters);
		}
	}

	return {
		showShareDialog : showShareDialog.show,
		showValueHelp : showValueHelp.show,
		initRuntime : initRuntime
	};

}, true);
