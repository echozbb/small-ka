var Domain = require('../domain'); 
var Luis = require('../luis-service');
var Hotel = require('../hotel-service');

exports.askHotel =  [function (session, args, next) {
        global._logger.log('info','ask-hotel',"Starting in askForHotel with cityCode=" + session.privateConversationData.hotelRequest.cityCode)
        //console.log("Starting in askForHotel with cityCode=" + session.privateConversationData.hotelRequest.cityCode);
        if (args && args.possibleHotelName != null && args.possibleHotelName.length >  1) {
            session.privateConversationData.hotelRequest.possibleHotelName = null;
            next ({response: args.possibleHotelName});
        } else if (session.privateConversationData.hotelRequest.preferredLocation != null 
            || session.privateConversationData.hotelRequest.minstar != null) {
            //choose hotel
            session.beginDialog('choose_hotel')
        }  else {
            var message = new global._builder.Message(session);
            message.text("prompt_hotel");
            message.suggestedActions(global._builder.SuggestedActions.create(session,
                [
                    global._builder.CardAction.imBack(session, "没有", "没有"),
                    global._builder.CardAction.imBack(session, "希尔顿", "希尔顿"),
                    global._builder.CardAction.imBack(session, "香格里拉", "香格里拉")
                ]
            ));
            global._builder.Prompts.text(session, message);
        }
    },
    function (session, results, next) {
        global._logger.log('info','ask-hotel',{'b4AskHotel':results})
        //var response = results.response.trim();
        if (results.response == false || results.response == true) {
            session.privateConversationData.hotelRequest.hotelUuid = null;
            session.privateConversationData.hotelRequest.hotelName = null;
            session.privateConversationData.hotelRequest.possibleHotelName = null;
            session.privateConversationData.hotelRequest.preferredLocation = null;
            session.replaceDialog('askForHotel');
        }else if (results.response.match(global._partten.noIntentPattern)) {
            session.privateConversationData.hotelRequest.hotelUuid = null;
            session.privateConversationData.hotelRequest.hotelName = '没';
            session.beginDialog('choose_hotel')
        } else {
            var response = results.response.trim();
            var preferredHotelResquest = new Domain.preferredHotelResquest(null,session.privateConversationData.hotelRequest.cityCode,response);
            Hotel.searchPreferredHotel(preferredHotelResquest).then(function (hotels) {
                global._logger.log('info','ask-hotel','Got returned hotels: ' + hotels.length);
                if (hotels.length == 0) {
                    session.send("no_hotels_found")
                    session.replaceDialog('askForHotel');
                } else {
                    var choice = {};
                    for (var i=0; i < hotels.length && i < 4 ; i++) {
                        choice[hotels[i].name] = hotels[i]
                        console.log('you have these choice: ' + JSON.stringify(choice));
                    }
                    choice["以上都不是"] = {}
                    session.dialogData.optionalHotel = choice;
                    global._builder.Prompts.choice(session, "chose_hotel", choice, global._builder.ListStyle.list);
                }
            });
        }
    },

    function (session, result) {
        if (result.response.entity) {
            var  aHotel = session.dialogData.optionalHotel[result.response.entity];
            if (!aHotel.name) {
                //choosed none of above, TODO: more hotels
                session.replaceDialog('askForHotel');
            } else {
                session.privateConversationData.hotelRequest.hotelName = aHotel['name']
                session.privateConversationData.hotelRequest.hotelUuid = aHotel['uuid']
                if (session.privateConversationData.hotelRequest.cityCode == null) {
                    session.privateConversationData.hotelRequest.cityCode = aHotel['cityCode'];
                }
                session.beginDialog('chooseRoom');
            }
        } else {
            session.replaceDialog('askForHotel');
            //session.endDialog();
        }
    }
];