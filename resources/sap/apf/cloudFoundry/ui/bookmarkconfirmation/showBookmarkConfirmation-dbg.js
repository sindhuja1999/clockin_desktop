sap.ui.define([
	'sap/apf/cloudFoundry/ui/utils/LaunchPageUtils',
	'sap/m/MessageBox',
	'sap/ui/core/routing/HashChanger'
], function(LaunchPageUtils, MessageBox, HashChanger) {
	'use strict';

	function showBookmarkConfirmation(api, startParameters) {
		var oHashChanger = new HashChanger();

		var configurationId = startParameters.getAnalyticalConfigurationId().configurationId;
		var sHeader = startParameters.getParameter(LaunchPageUtils.BOOKMARK_LINK_PARAMETERS.HEADER);
		var sSubheader = startParameters.getParameter(LaunchPageUtils.BOOKMARK_LINK_PARAMETERS.SUBHEADER);
		var sIcon = startParameters.getParameter(LaunchPageUtils.BOOKMARK_LINK_PARAMETERS.ICON) || "";
		var sGroup = startParameters.getParameter(LaunchPageUtils.BOOKMARK_LINK_PARAMETERS.GROUP) || "";

		// api.getApplicationConfigProperties waits for the corePromise,
		// which is why we can call api.getTextNotHtmlEncoded in here,
		// which is only valid after the corePromise is fullfilled
		api.getApplicationConfigProperties().then(function(configProperties) {
			sHeader = sHeader || api.getTextNotHtmlEncoded(configProperties.appTitle);
			sSubheader = sSubheader || api.getTextNotHtmlEncoded("bookmarkSubheaderDefault");

			MessageBox.confirm(api.getTextNotHtmlEncoded("bookmarkConfirmation", [sHeader]), {
				title: api.getTextNotHtmlEncoded("bookmarkConfirmationTitle"),
				onClose: function (oAction) {
					if (oAction == MessageBox.Action.OK) {
						var runtimeLink = LaunchPageUtils.generateRuntimeLink(configurationId);
						LaunchPageUtils.setBookmarkTile(runtimeLink, sHeader, sSubheader, sIcon, sGroup);
					}
					oHashChanger.replaceHash(LaunchPageUtils.generateRuntimeHash(configurationId));
				}
			});
		});
	}

	return {
		show: showBookmarkConfirmation
	};

});
