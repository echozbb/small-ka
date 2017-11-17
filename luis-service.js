var LUISClient = require("./luis_sdk");

module.exports = {
    getLuisResponse: function (query) {
         return new Promise (function (resolve, reject){
             global._logger.log('info','luis-service',{'appId': process.env.LUIS_APPID});
             //console.log('in luis-service...'+ process.env.LUIS_APPID);
            var LUISclient = LUISClient({
                appId: process.env.LUIS_APPID,
                appKey: process.env.LUIS_APPKEY,
                verbose: true
                });
            
            //console.log("sending message to luis server...");
            global._logger.log('info','luis-service','sending query to luis server:' + query);
            LUISclient.predict(query, {
                 onSuccess: function (response) {
                     console.log('LUIS RESPONSE: ' + JSON.stringify(response));
                     resolve(response);
                 },
                 onFailure: function (err) {
                     console.error(err);
                     reject(err);
                },
            });
        });

    }
}