/**
 *@description Loads data from SPATH
 * through extended odata Model from both backend and Indexed DB
 *@param {string} sPath - Path to Data to be loaded
 */
load: function(sPath)
{
   var oData = this.oComponent.getModel(),
      that = this;
   return new Promise(function(resolve, reject)
   {
      oData.read(sPath, {
         success: function(response)
         {
            that.setProperty("/results", response.results);
            resolve(response.results);
         },
         error: function(err)
         {
            reject(err);
         }
      });
   });
},
/**
 *@description Creates new table entry
 *@param {Object} data - data to be saved
 *@param {String} sPath - Path to be saved to
 *@returns {promise}
 */
save: function(data, sPath)
{
   var oData = this.oComponent.getModel();
   return new Promise(function(resolve, reject)
   {
      oData.create(sPath,
         data,
         {
            success: function(resp)
            {
               resolve(resp)
            },
            error: function(err)
            {
               reject(err);
            }
         })
   })
},