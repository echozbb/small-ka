var Cozi = require('./cozi-service');

module.exports = {
    getCity : function (cityName) {
      return new Promise (function (resolve) {
          console.log('call API to match input cityName=' + cityName);
          var getResponse = Cozi.Get('/city/search/en?input=' + cityName, function(data) {
            global._logger.log('info','city-service.getCity',JSON.parse(data));
              var cities = JSON.parse(data).payload;
              var city = null;
              if (cities) {
                  city = cities[0];
              }
              resolve(city);
          });
      });  
    },

    completePlace: function (cityCode, place){
        var _this = this;
        return new Promise (function (resolve, reject){
            if (place == null) {
                resolve(null);
            } else {
                _this.getCity(cityCode).then(function (city){
                    if (city == null) {
                        resolve(null);
                    } else {
                        var cityName = city.stateCode == null ? (city.chineseName == null ? city.name : city.chineseName) : city.stateCode;
                        var input = encodeURIComponent(place + ' ' + cityName)
                        //specimal handling on CBD
                        if (place.toUpperCase().indexOf('CBD') > -1) {
                            input = encodeURIComponent(city.name + ' CBD');
                        }
                        if (/(机场|airport)/g.test(place)) {
                            input = encodeURIComponent(city.name + ' airport');
                        }
                        try{
                            Cozi.Get('/locationService/autocomplete/' + input + '/zh_CN',function(data){
                                global._logger.log('info','city-service',{'autocomplete': data});
                                var predictions = JSON.parse(data).payload.locations;
                                if (predictions != null && predictions.length > 0) {
                                    resolve(predictions[0]);
                                } else {
                                    //search by city name
                                    input = encodeURIComponent((city.chineseName == null ? city.name : city.chineseName) + ' ' + place)
                                    Cozi.Get('/locationService/autocomplete/' + input + '/zh_CN',function(data){
                                        global._logger.log('info','city-service',{'autocomplete': data});
                                        var predictions = JSON.parse(data).payload.locations;
                                        if (predictions != null && predictions.length > 0) {
                                            resolve(predictions[0]);
                                        } else {
                                            resolve(null);
                                        }
                                    })
                                }
                            })
                        }catch (err) {
                            global._logger.log('info','city-service', err);
                            reject(err);
                        }
                    }
                    
                })
            }
        })
    },
    getPlaceDetail: function(placeId) {
        return new Promise (function (resolve, reject){
        if (placeId == null) {
            resolve(null);
        } else {
            global._logger.log('info','city-service',{'placeId': placeId});
            try{
                var getResponse = Cozi.Get('/locationService/placeDetail/' + placeId + '/en_AU',function(data){
                    global._logger.log('info','city-service',{'placeDetail': JSON.stringify(data)});
                    var payload = JSON.parse(data).payload;
                    resolve(payload);
                })
            }catch (err) {
                global._logger.log('info','city-service.getPlaceDetail', err);
                reject(err);
            }
        }
    })
    },

    searchCity: function(cityName) {
        var _this = this;
        return new Promise(function (resolve, reject){
            var input = encodeURIComponent(cityName);
            Cozi.Get('/locationService/autocomplete/' + input + '/en_AU',function(data){
                try {
                    var predictions = JSON.parse(data).payload.locations;
                    if (predictions != null && predictions.length > 0) {
                        var location = predictions[0];
                        _this.getPlaceDetail(location.placeId)
                        .catch(err => reject(err))
                        .then(result => {
                                resolve(result);
                        });
                    } else {
                        resolve(null);
                    }
                }catch (err) {
                    global._logger.log('info','city-service.searchCity', err);
                    reject(err);
                }
            });
        })
       
    },

    fillPreferredLocation: function (cityCode, preferredLocation, session) {
        var _this = this;
        return new Promise (function (resolve, reject){
        if (preferredLocation == null) {
            resolve(null);
        } else {
            _this.completePlace(cityCode,preferredLocation).catch(e => {
                global._logger.log('info','city-service',e);
            }).then(function (prediction){
                if (prediction != null && prediction['placeId'] != null) {
                    return _this.getPlaceDetail(prediction['placeId'])
                } else {
                    return resolve(null);
                }
            }).then(function (payload){
                if (payload != null) {
                    session.send("小卡将为您查找" + payload.name + "附近酒店");
                    session.privateConversationData.hotelRequest.latitude = payload.location['lat'];
                    session.privateConversationData.hotelRequest.longitude = payload.location['lng'];
                    resolve(null);
                } else {
                    resolve(null);
                }
            });
        }  
    })
    }

}