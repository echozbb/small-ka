var City = require('../city-service');
var Hotel = require('../hotel-service');
var Utils = require('../utils/utils');

exports.askLocation = [    
    function(session, args, next) {
        if (session.privateConversationData.hotelRequest.preferredLocation == null) {
            global._builder.Prompts.text(session, "您如果对酒店位置有特别要求，请告诉我，如飞机场，CBD，歌剧院，如果没有请说 没有");
            session.privateConversationData.hotelRequest.hotelName = '没'
        } else {
            next ({response: true});
        }
    },
    function (session, results) {
        if (results.response == true) {
            //alreay hava location
        } else if (results.response.match(global._partten.noIntentPattern)) {
            session.privateConversationData.hotelRequest.preferredLocation = null
        } else {
            session.privateConversationData.hotelRequest.preferredLocation = results.response.replace(/附近/g,'').replace(/靠近/g,'').replace(/周围/g,'').replace(/\n/g,'').trim();
        }
        if (session.privateConversationData.hotelRequest.preferredLocation != null && session.privateConversationData.hotelRequest.latitude == null) {
            global._logger.log('info','ask-location',{'preferredLocation':session.privateConversationData.hotelRequest.preferredLocation})
            City.fillPreferredLocation(session.privateConversationData.hotelRequest.cityCode, session.privateConversationData.hotelRequest.preferredLocation, session).then(function(){
                if (session.privateConversationData.hotelRequest.latitude == null) {
                    session.privateConversationData.hotelRequest.preferredLocation = null;
                    session.send("对不起，小卡无法识别您输入的地址，请换种表述方式");
                    session.replaceDialog('askLocation');
                } else {
                    session.endDialog();
                }
            });
        } else {
            session.endDialog();
        }
}

]

exports.showDistance = [
    function (session, args, next) {
        if (session.privateConversationData.hotelRequest.hotelUuid == null) {
            //ask hotel
            session.beginDialog('askForHotel');
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (session.privateConversationData.hotelRequest.hotelUuid == null) {
            replaceDialog('showDistance');
        } else {
            Hotel.sendHotelDetails(session, hotelUuid);
        }
    }
]