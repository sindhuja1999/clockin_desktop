# Configuration Share Dialog

This folder provides all necessary modules to display a dialog to share configurations created in the modeler.

It is enabled when the injection `isUsingCloudFoundryProxy` returns true.

## showShareDialog

`showShareDialog.js` uses `utils.ComponentCorrector` to create the CatalogBrowser-View, passing on the `oEventData` provided through the exit.

## ShareDialog

The ShareDialog provides features to share the configuration currently selected in the modeler. The main idea is to define a tile that is then sent to other users (or saved on the users LaunchPage directly). The tile definition is therefor included in a `bookmark link`.

Note that it is currently not possible to save a bookmark tile on another user's LaunchPage.

### Tile Definition

The tile definition consists of four parts, which are updated in the tile preview (except from the group):

- the `title`
- the `subtitle`
- the `icon` (from the SAP icon pool)
- the `group` in which the tile is displayed on a LaunchPage

### Share Actions

The tile definition can be shared on various ways. Three supported actions are:

- `Copy URL` to copy the bookmark link to the clipboard, if supported
- `Send E-Mail` to open the default email client with a generated email containing the bookmark link
- `Save as Tile` to save the tile on the users own LaunchPage
