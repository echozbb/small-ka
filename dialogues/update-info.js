var Utils = require('../utils/utils');
var Hotel = require('../hotel-service');

exports.updateByIntents = [
    function (session, args, next) {
        global._logger.log('info', 'Update Info', {'args':args});
        global._logger.log('info', 'Update Info', {'text':session.message.text});
        session.dialogData.inputText = session.message.text
        session.dialogData.args = args;
        session.privateConversationData.pendingAction = 'updateHotel'
        if (args.intent.score >= 0.95) {
            //no need to confirm
            next({response: true});
        } else {
            global._builder.Prompts.confirm(session, '小卡猜您想要更新需求，是吗？');
        }
        
    },
    function (session, results) {
        if (results.response == false) {
            session.send('ok, 让我们继续');
            session.replaceDialog('RequestHotel',{'repeat': session.privateConversationData.hotelRequest, 'steps': session.dialogData.steps});
        } else {
            if (session.dialogData.args.intent.entities.length > 0) {
                var object = Utils.updateEntities(global._builder, session.dialogData.args.intent.entities, session);
                var updatedItems = object.updatedItems;
                if (updatedItems.length > 0) {
                    //var message = new global._builder.Message(session);
                    var text = "";
                    for (var i=0; i < updatedItems.length; i++) {
                        if (i > 0) text += ", ";
                        text += updatedItems[i].field + " " + updatedItems[i].text
                    }
                    session.send('没问题，' + text);
                }
                var missingItems = object.missingItems;
                session.dialogData.missingItems = missingItems;
                if (missingItems.length > 0) {
                    var message = new global._builder.Message(session);
                    var text = "";
                    for (var i=0; i< missingItems.length; i++) {
                        if (i > 0) text += ", ";
                        if (missingItems[i].field = 'CITY') {
                            session.privateConversationData.hotelRequest.cityCode = null;
                            session.privateConversationData.hotelRequest.cityEntity = null;
                            session.privateConversationData.hotelRequest.preferredLocation = null;
                        } else if (missingItems[i].field == 'HOTEL') {
                            session.privateConversationData.hotelRequest.preferredLocation = null;
                            session.privateConversationData.hotelRequest.hotelEntity = null;
                            session.privateConversationData.hotelRequest.hotelUuid = null;
                            session.privateConversationData.hotelRequest.hotelName = null;
                        } else {
                            text += missingItems[i].text;
                        }
                    }
                    if (text.length > 0) {
                        message.text("prompt_update", text);
                        global._builder.Prompts.text(session, message);
                    } else {
                        session.replaceDialog('RequestHotel',{'repeat': session.privateConversationData.hotelRequest, 'steps': session.dialogData.steps});
                    }
                   
                    //}         
                } else {
                    session.replaceDialog('RequestHotel',{'repeat': session.privateConversationData.hotelRequest, 'steps': session.dialogData.steps,'unMatched': object.unMatched});
                }
            } else {
                if (session.dialogData.inputText != null && session.dialogData.inputText.length > 2) {
                    session.beginDialog('askForHotel',{'possibleHotelName' : session.dialogData.inputText});
                } else {
                    session.privateConversationData.disableLuis = true
                    global._builder.Prompts.text(session, "您想更新什么信息呢？");
                }
                
            }
        }
    },
    function (session, results, next) {
        if (results.response.match(global._partten.noIntentPattern)){
            session.replaceDialog('RequestHotel',{'repeat': session.privateConversationData.hotelRequest, 'steps': session.dialogData.steps});
        } else {
            global._builder.LuisRecognizer.recognize(results.response, process.env.LUIS_MODEL_URL,function(err, intents, entities){
                if (err) {
                    console.log(err);
                }
                global._logger.log('info','update info', {'intents': JSON.stringify(intents)});
                global._logger.log('info','update info', {'entities': JSON.stringify(entities)});
                //if (entities != null && entities.length > 0) {
                    var object = Utils.updateEntities(global._builder,entities,session);
                //}
                session.replaceDialog('RequestHotel',{'repeat': session.privateConversationData.hotelRequest, 'steps': session.dialogData.steps, 'unMatched': object.unMatched});
            });
        }


        // if (session.dialogData.missingItems.length == 0) {
        //     //call luis update the information
           
        // } else {
        //     for (var i=0; i < session.dialogData.missingItems.length; i++) {
        //         switch (session.dialogData.missingItems[i].field) {
        //             case 'DATE':
        //                 //session.beginDialog('askCheckinCheckout');
        //                 session.privateConversationData.hotelRequest.fromDate = results.response.checkinDate;
        //                 session.privateConversationData.hotelRequest.toDate = results.response.checkoutDate;
        //                 break;
        //             case 'GUEST':
        //                 //session.beginDialog('askGuest');
        //                 session.privateConversationData.hotelRequest.adultNum = results.response.adultNum;
        //                 session.privateConversationData.hotelRequest.childNum = results.response.childNum;
        //                 session.privateConversationData.hotelRequest.childAge = results.response.childAge;
        //                 break;
        //             case 'ROOM':
        //                 //session.beginDialog('askRooms');
        //                 session.privateConversationData.hotelRequest.rooms = results.response.rooms;
        //                 break;
        //             case 'HOTEL':
        //                 //session.beginDialog('choose_hotel');
        //                 session.privateConversationData.hotelRequest.hotelUuid = results.response.hotelUuid;
        //                 session.privateConversationData.hotelRequest.hotelName = results.response.name;
        //                 break;
        //             case 'CITY':
        //                 //session.beginDialog('askForCity');
        //                 session.privateConversationData.hotelRequest.cityName = results.response.name;
        //                 session.privateConversationData.hotelRequest.cityCode = results.response.cityCode;
        //                 session.privateConversationData.hotelRequest.countryCode = results.response.countryCode;
        //                 session.privateConversationData.hotelRequest.cityEntity = null;
        //                 session.privateConversationData.hotelRequest.hotelUuid = null;
        //                 session.privateConversationData.hotelRequest.hotelName = null;
        //                 session.privateConversationData.hotelRequest.hotelEntity = null;
        //                 break;
        //         }
        //         session.replaceDialog('RequestHotel',{'repeat': session.privateConversationData.hotelRequest, 'steps': session.dialogData.steps});
        //     }
       // }
    }
]

