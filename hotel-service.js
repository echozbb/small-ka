var Cozi = require('./cozi-service');
var Utils = require('./utils/utils');
var City = require('./city-service');

var response = Cozi.Get('/b2bWeb/checkConnection', function(data) {
    //console.log("XXXXXXX Got GET response: " + data);
    global._logger.log('info', "hotel-service.TestConnection", {'Response': data});
});


module.exports = {
    checkConnection: function (){
        console.log('check connection method add here.');
    },
    
    getHotelInfo : function (hotelUuid) {
      return new Promise (function (resolve) {
          var getResponse = Cozi.Get('/api/getHotelInfo/' + hotelUuid, function(data) {
              var hotelInfo = JSON.parse(data).payload;
              hotelInfo.hotelUuid = hotelUuid;
              resolve(hotelInfo);
          });
      });  
    },
    
    getRoomTypes : function (hotelUuid, multiRoomRequest) {
        return new Promise (function (resolve, reject){
                    var postResponse = Cozi.Post('/api/getRoomTypes/'+hotelUuid, multiRoomRequest, function(data) {
            global._logger.log('info', "hotel-service.getRoomTypes", {'Response': data});
            try {
                var roomTypes = JSON.parse(data).payload;
                global._logger.log('info', "hotel-service.getRoomTypes", 'Got ' + roomTypes.length + 'Rooms!');
                var rooms = [];
                for (var i = 0; i < roomTypes.length; i++) {
                    roomTypes[i].rateInfos.sort(function(a,b){
                        return parseFloat(a.chargeableRate.total) - parseFloat(b.chargeableRate.total)
                    });
                    if (roomTypes[i] && roomTypes[i].rateInfos[0]) {
                        rooms.push({
                                roomName: roomTypes[i].roomDescription,
                                price: Math.round(roomTypes[i].rateInfos[0].chargeableRate.total),
                                checkin: multiRoomRequest.checkin,
                                checkout: multiRoomRequest.checkout,
                                breakfast: roomTypes[i].rateInfos[0].mealsPlan.breakfast,
                                freeCancellation: roomTypes[i].rateInfos[0].freeCancellation,
                                rateInfo: roomTypes[i].rateInfos,
                                deadLine: roomTypes[i].rateInfos[0].deadLine,
                                //allRates: roomTypes[i].rateInfos,
                                images: roomTypes[i].roomImages,
                                roomDescription: roomTypes[i].roomDescriptionLong,
                                roomSize: roomTypes[i].roomSize,
                                facility: roomTypes[i].facitilyDesc,
                                occupancyDesc: roomTypes[i].occupancyDesc,
                                bedTypeDesc: roomTypes[i].bedTypeDesc
                                //image: 'http://cozi-uat-images.oss-cn-hongkong.aliyuncs.com/b2b/hotels/AU/SYD/MH2MS-6865.jpg'
                            });
                    }

                }
                rooms.sort(function (a, b) { return a.price - b.price; });
                resolve(rooms);
        }catch (err){
            global._logger.log('info','hotel-service', err);
            reject(err);
        }});
        });
    },
    
    searchPreferredHotel: function (preferredHotelResquest){
        return new Promise (function (resolve) {
            var postResponse = Cozi.Post('/b2bWeb/preferredHotel', preferredHotelResquest, function (data){
                var hotels = JSON.parse(data).payload.hotels;
                global._logger.log('info', "hotel-service.searchPreferredHotel", {'Response': data});
                global._logger.log('info', "hotel-service.searchPreferredHotel", 'hotel.length = ' + hotels.length);
                if (hotels.length > 0 ) {
                    console.log('Found %s hotels matched name %s.', hotels.length, preferredHotelResquest.hotelName);
                    for (var i = 0; i < hotels.length; i ++) {
                        //console.log(i + ': ' + hotels[i].name + ', ' + hotels[i].uuid);
                        global._logger.log('info', "hotel-service.searchPreferredHotel", i + ': ' + hotels[i].name + ', ' + hotels[i].uuid);
                    }
                } else {
                    global._logger.log('info', "hotel-service.searchPreferredHotel", 'No room matched!');
                }
                resolve(hotels);
            })
        });
    },

    searchHotel: function (multiRoomRequest, start) {
        return new Promise (function (resolve, reject) {
            Cozi.Post('/api/searchWithRecommend/'+start+'/' + global._hotelsPerPage , multiRoomRequest, function (data){
                try {
                    var payload = JSON.parse(data).payload;
                    var quotes = payload.results;
                    var extraInfo = payload.extraInfo;
                    
                    global._logger.log('info', "hotel-service.searchHotel", {'quote': JSON.stringify(quotes)});
                    if (quotes != null && quotes.length > 0 ) {
                        global._logger.log('info',"hotel-service.searchHotel",'Found '+quotes.length+' quotes matched multiRoomRequest ' + JSON.stringify(multiRoomRequest));   
                    } else {
                        global._logger.log('info', "hotel-service.searchHotel", 'No hotel matched!');
                    }
                    resolve({'quotes':quotes, 'extraInfo': extraInfo, 'totalCount': payload.totalCount});
                    
            } catch (err) {
                global._logger.log('info','hotel-service', err);
                reject(err);
            }
        })
        });
    },

    bookHotel: function (hotelUuid, bookingInfoContainer) {
        return new Promise (function (resolve) {
            var postReponse = Cozi.Post('/api/book/'+hotelUuid, bookingInfoContainer, function (data){
                global._logger.log('info', "hotel-service.bookHotel", {'Response': data});
                var bookingVo = JSON.parse(data).payload;
                global._logger.log('info', "hotel-service.bookHotel", {'Result': JSON.stringify(bookingVo)});
                resolve(bookingVo);
            })
        });
    },


    sendHotelDetails: function (session, hotelUuid) {
        if (hotelUuid == null) {
            return null;
        }
        this.getHotelInfo(hotelUuid).then(function(hotelInfo) {
            //console.log('Hotel Infomation -> ' + JSON.stringify(hotelInfo));
            global._logger.log('info', "hotel-service.sendHotelDetails", {'hotelInfo': JSON.stringify(hotelInfo)});
            var msg = new global._builder.Message(session);
            msg.attachmentLayout(global._builder.AttachmentLayout.carousel); //carousel
            //show 1 images
            var images = [];
            for (var i=0; i< hotelInfo.hotelImagesDetailed.length && i<1; i++) {
                images.push(global._builder.CardImage.create(session, hotelInfo.hotelImagesDetailed[i].imageUrl));
            }
            var description = '';
            if (hotelInfo.hotelRating != null && hotelInfo.hotelRating.starRating != null) description = description + '**' + hotelInfo.hotelRating.starRating + "星级**" + "\n\n"
            if (hotelInfo.checkInTime) description = description + "入住时间：" + hotelInfo.checkInTime + "\n\n"
            if (hotelInfo.checkOutTime) description = description + "退房时间： " + hotelInfo.checkOutTime + "\n\n"
            if (hotelInfo.facitilyDesc != null) {
                for (var j = 0; j < hotelInfo.facitilyDesc.length; j++) {
                    if (/(网络|wifi|停车)/i.test(hotelInfo.facitilyDesc[j])){
                        //format  '<font color=\"#11b92f\">XXX</font>' 
                        description = description + hotelInfo.facitilyDesc[j].replace(/\n/ig,". ") + "\n\n"
                    }
                }
            }
            if (hotelInfo.childAndExtraBed != null) {
                description = description + hotelInfo.childAndExtraBed + "\n\n"
            }
            if (description.length == 0) description = hotelInfo.propertyDescription;

            msg.attachments([
                new global._builder.HeroCard(session)
                .title(hotelInfo.hotelName)
                .subtitle(hotelInfo.address)
                .text(description)
                .images(images)
                .buttons([global._builder.CardAction.openUrl(session,hotelInfo.externalDescLink,'更多信息')])
            ])
            //console.log('sending hotel details card:' + JSON.stringify(msg));
            session.send(msg);
        });
    },

    // sendHotelLocation: function (session, hotelUuid) {
    //     if (hotelUuid == null) return null;
    //     this.getHotelInfo(hotelUuid).then(function (hotelInfo) {
    //         global._logger.log('info', "hotel-service.sendHotelDetails", {'hotelInfo': JSON.stringify(hotelInfo)});
    //         var msg = new global._builder.Message(session);
    //     });
    // }
}


    