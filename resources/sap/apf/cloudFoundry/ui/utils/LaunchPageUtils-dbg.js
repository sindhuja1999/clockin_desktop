sap.ui.define([
	'sap/base/security/encodeURLParameters',
	'sap/ushell/services/Container'
], function(encodeURLParameters) {
	'use strict';

	// COMPATIBILITY
	// sap.ushell.Container is initialized by the ushell bootstrap
	// it should not be stored in a global variable, because it may be initialized after LaunchPageUtils (for example in unit tests)

	var BOOKMARK_LINK_PARAMETERS = {
		BOOKMARK: "bookmark",
		HEADER: "tile-header",
		SUBHEADER: "tile-subheader",
		ICON: "tile-icon",
		GROUP: "tile-group"
	};

	/**
	 * Generates a hash that opens the runtime with the specified configuration
	 * @param {string} configurationId The id of the configuration to launch
	 * @returns {string} A hash to the runtime
	 */
	function generateRuntimeHash(configurationId) {
		return sap.ushell.Container.getService("CrossApplicationNavigation").hrefForExternal({
			target: {
				semanticObject: "FioriApplication",
				action: "executeAPFConfiguration"
			},
			params: {
				"sap-apf-configuration-id": configurationId
			}
		});
	}

	/**
	 * Generates a link that opens the runtime with the specified configuration
	 * @param {string} configurationId The id of the configuration to launch
	 * @returns {string} A link to the runtime
	 */
	function generateRuntimeLink(configurationId) {
		var baseUrl = jQuery(location).attr('href').split('#')[0].split('?')[0];
		return baseUrl + generateRuntimeHash(configurationId);
	}

	/**
	 * Builds a bookmark link (that creates a tile when the runtime is launched from it)
	 * @param {string} link The runtime link
	 * @param {string} header The header of the tile
	 * @param {string} subheader The subheader of the tile
	 * @param {string} icon The icon of the tile (optional)
	 * @param {string} group The group of the tile (optional)
	 * @returns {string} The bookmark link
	 */
	function buildBookmarkLink(link, header, subheader, icon, group) {
		if (!link.includes("#")) {
			return null;
		}

		var parameters = {};
		parameters[BOOKMARK_LINK_PARAMETERS.BOOKMARK] = true;
		if (header) {
			parameters[BOOKMARK_LINK_PARAMETERS.HEADER] = header;
		}
		if (subheader) {
			parameters[BOOKMARK_LINK_PARAMETERS.SUBHEADER] = subheader;
		}
		if (icon) {
			parameters[BOOKMARK_LINK_PARAMETERS.ICON] = icon;
		}
		if (group) {
			parameters[BOOKMARK_LINK_PARAMETERS.GROUP] = group;
		}

		var split = link.split("#");
		var hash = split[split.length - 1];
		var parameterString = encodeURLParameters(parameters);

		var bookmarkLink = link;
		bookmarkLink += hash.includes("?") ? "&" : "?";
		bookmarkLink += parameterString;

		return bookmarkLink;
	}

	/**
	 * Adds a new bookmark tile to the launchpad or changes an exisiting tile, if it has the same link (= opens the same configuration)
	 * @param {string} link The link to use for the tile (that is opened when the tile is pressed)
	 * @param {string} title The title of the tile
	 * @param {string} subtitle The subtitle of the tile
	 * @param {string} icon The icon of the tile
	 * @param {string} group The group to place the tile in (if the tile does not exist yet)
	 */
	function setBookmarkTile(link, title, subtitle, icon, group) {
		sap.ushell.Container.getService("LaunchPage").getGroups().then(function(pageGroups) {
			var pageGroup;
			if (group) {
				pageGroups.forEach(function(g) {
					if (g.identification.id === group) {
						pageGroup = g;
					}
				});
				if (pageGroup === undefined) {
					throw "group not found";
				}
			}
			var bookmark = {
				title: title,
				subtitle: subtitle,
				url: link,
				icon: icon
			};
			var bookmarkService = sap.ushell.Container.getService("Bookmark");
			bookmarkService.deleteBookmarks(link);
			bookmarkService.addBookmark(bookmark, pageGroup);
		});
	}

	return {
		BOOKMARK_LINK_PARAMETERS: BOOKMARK_LINK_PARAMETERS,
		generateRuntimeHash: generateRuntimeHash,
		generateRuntimeLink: generateRuntimeLink,
		buildBookmarkLink: buildBookmarkLink,
		setBookmarkTile: setBookmarkTile
	};

}, true);
