sap.ui.define([
    "sap/ui/model/json/JSONModel"
 ], function(Model)
 {
    "use strict";
 
    var _instance = void 0;
    var version = 0;
 
    var IndexedDb = Model.extend("ui5.offlineFunct.model.IndexedDb", {
 
       /**
        *@description Constructor
        *@memberOf IndexedDb
        *@param {object} oComponent - Owner Component
        */
       constructor: function(oComponent)
       {
          if (window.indexedDB === null)
          {
             console.error("Offline store not supported!");
             return null;
          }
 
          this._oComponent = oComponent;
          Model.prototype.constructor.call(this, {
             "_meta": []
          });
          var request = indexedDB.open("localStorage"); 
          request.onsuccess = function(oEvent)
          {
             IndexedDb._db = oEvent.target.result;
             version = IndexedDb._db.version;
             IndexedDb._db.close();
          };
          IndexedDb._instance = this;
       },
       /**
 *@description loads data from indexeddb.
 * Adds attribute "_origin": "indexeddb" to indexeddb
 *@memberOf IndexedDb
 *@param {String} sTable - Name of table that is read
 *@param {boolean} bIncludeRemove - in cludes entries with property _http === "remove"
 *@returns {array} - read table with extra attribute "_origin": "indexeddb"
 */
getTable: function(sTable, bIncludeRemove)
{
   var that = this;
   return new Promise(function(resolve, reject)
   {
      var request = indexedDB.open("localStorage", version);

      request.onsuccess = function(oEvent)
      {
         IndexedDb._db = oEvent.target.result;
         if (!that._tableAvailable(sTable))
         {
            IndexedDb._db.close();
            return resolve([]);
         }
         var objectStore = IndexedDb._db.transaction([sTable], "readwrite").objectStore(sTable);
         var request = objectStore.openCursor();
         var aTable = [];

         request.onsuccess = function(event)
         {
            var cursor = event.target.result;
            if (cursor)
            {
               cursor.value._origin = "indexeddb";
               if (bIncludeRemove || cursor.value._http === 'create') aTable.push($.extend(cursor.value, cursor.value));
               cursor.continue();
            }
            else
            {
               IndexedDb._db.close();
               resolve(aTable);
            }
         };
      };
   });
},
/**
 *@description stores data in indexeddb and creates Table if necessary
 * adds property _http to save the intended http action (CRUD)
 *@memberOf IndexedDb
 *@param {object} data - data to be stored in indexed db
 *@param {String} sTable - Name of table that data is added to
 */
create: function(data, sTable)
{
   var that = this;
   sTable = that._trim(sTable)[1];
   return Promise.resolve()
      .then(that._createTable.bind(that, sTable))
      .then(that._createData.bind(that, data, sTable))
      .catch(function(err)
      {
         console.error("Data could not be written to INDEXEDDB");
      })
},


/**
 *@description creates a new table
 *@memberOf IndexedDb
 *@param {String} sTable - Name of table that data is added to
 */
_createTable: function(sTable)
{
   if (!this._tableAvailable(sTable)) version++;

   var request = indexedDB.open("localStorage", version);
   var indexedDbKey = 'Id';
   return new Promise(function(resolve, reject)
   {
      request.onupgradeneeded = function(oEvent)
      {
         IndexedDb._db = oEvent.target.result;
         var objectStore = IndexedDb._db.createObjectStore(sTable, {
            autoIncrement: false,
            keyPath: indexedDbKey
         });
         objectStore.createIndex('_http', '_http', {unique: false});
         request.onsuccess = function(evt)
         {
            resolve();
         };
         request.onerror = function(oError)
         {
            IndexedDb._db.close();
            reject();
         };
      };
      request.onsuccess = function(oEvent)
      {
         IndexedDb._db = oEvent.target.result;
         resolve();
      };
   })
},

/**
 *@description create indexdb entry
 *@memberOf IndexedDb
 *@param {object} data - data to be stored in indexed db
 *@param {String} sTable - Name of table that data is added to
 */
_createData: function(data, sTable)
{
   return new Promise(function(resolve, reject)
   {
      var oTransaction = IndexedDb._db.transaction(sTable, "readwrite");
      var oDataStore = oTransaction.objectStore(sTable);
      oDataStore.add(data);
      IndexedDb._db.close();
      resolve();
   })
}, 

/**
 *@description After the system is back online, this will synchronize local storage with Backend data
 *@memberOf IndexedDb
 *@param {String} sTable - Name of table that data is add
 *@return {promise}
 */
processLocalData: function(sTable)
{
   var that = this;
   return new Promise(function(resolve, reject)
   {
      that.getTable(sTable, true)
         .then(function(data)
         {
            data.forEach(function(line)
            {
               var sKey = line.Id;
               if (line._http === 'create')
               {
                  that._oComponent.getModel()[line._http](sTable, line, {
                     success: function()
                     {
                        that._removeData(sTable, sKey, false)
                           .then(function()
                           {
                              resolve()
                           });
                     },
                     error: reject
                  })
               }
               else if (line._http === 'remove')
               {
                  that._oComponent.getModel()[line._http](line.Id, {
                     success: function()
                     {
                        that._removeData(sTable, sKey)
                           .then(function()
                           {
                              resolve()
                           });
                     },
                     error: reject
                  })
               }
            });
         });
   })
}
});

});