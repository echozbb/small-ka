var Utils = require('../utils/utils');
var CityService = require('../city-service');

exports.doubleConfirm = [
    function (session, args, next) {
        session.dialogData.input = args
        if (args != null && args.inputText == null) {
            var filled = args.filled;
            var missing = args.missing;
            var incorrect = args.incorrect;
            var msg = ""
            if (filled.length > 0 ) {
                msg += "好的，";
                for (var i=0; i < filled.length; i++) {
                    if (i > 0) {
                        msg += ", ";
                    }
                    msg += filled[i];
                }
            }
            if (missing.length > 0) {
                if (msg.length != 0) {
                    msg += "; "
                }
                msg += "\n\n亲，还请您请补充："
                for (var i=0; i< missing.length; i++) {
                    if (i > 0) {
                        msg += ", ";
                    }
                    msg += missing[i].desc;
                }
            } 
            if (incorrect.length > 0) {
                if (msg.length != 0) {
                    msg += "; "
                }
                msg += "\n\n亲，请更正："
                for (var i=0; i< incorrect.length; i++) {
                    if (i > 0) {
                        msg += ", ";
                    }
                    msg += incorrect[i].desc;
                }
            }
            if (missing.length == 0 && incorrect.length == 0) {
                session.send(msg);
                next({response:true});
            } else if (args.fatal) {
                global._builder.Prompts.text(session, msg);
            } else {
                
                if (session.privateConversationData.hotelRequest.hotelUuid != null || session.privateConversationData.hotelRequest.hotelName != null) {
                    next ({response: true});
                } else {
                    session.send(msg);
                    var message = new global._builder.Message(session);
                    message.text('您也可以说 \'跳过\' 暂时忽略并继续查询')
                    message.suggestedActions(global._builder.SuggestedActions.create(session,
                        [
                            global._builder.CardAction.imBack(session, "跳过", "跳过")
                        ]
                    ));
                    global._builder.Prompts.text(session, message);
                    //session.send('您也可以说 \'跳过\' 暂时忽略并继续查询');
                }
                
            }
        } else {
            next({response: args == null ? true : args.inputText});
        }
    },
    function (session, results, next) {
        if (results.response == true) {
            next({response:true});
        } else {
            var text = results.response.replace(/，/g,'.').replace(/。/g,'.').replace(/-/g,'.');
            if (/跳过/.test(text)) {
                if (session.dialogData.input.fatal) {
                    //cannot skip
                    session.beginDialog('doubleConfirm', session.dialogData.input);
                } else {
                    //if skip hotelName, set hotelName to '没'
                    for (var j = 0; j < session.dialogData.input.missing.length; j++) {
                        if (session.dialogData.input.missing[j].field == 'hotelName') {
                            session.privateConversationData.hotelRequest.hotelName = '没';
                            break;
                        }
                    }
                    next({response:true});
                }
            } else if (!isNaN(text) && (session.dialogData.input.missing.length + session.dialogData.input.incorrect.length) == 1 ) {
                var parseNum = global._builder.EntityRecognizer.parseNumber(text);
                var field = (session.dialogData.input.missing.length > 0) ? session.dialogData.input.missing[0].field : session.dialogData.input.incorrect[0].field;
                switch(field) {
                    case 'adultNum':
                        session.privateConversationData.hotelRequest.adultNum = parseNum;
                        break;
                    case 'childAge':
                        session.privateConversationData.hotelRequest.childAge = text;
                        break;
                    case 'rooms':
                        session.privateConversationData.hotelRequest.rooms = parseNum;
                        break;
                    case 'star':
                        var arr = text.split(".").sort(function(a,b){
                            return a - b;
                        });
                        session.privateConversationData.hotelRequest.minstar = arr[0];
                        session.privateConversationData.hotelRequest.maxstar = arr[arr.length - 1];
                        break;
                    case 'budget':
                        var arr = text.split(".").sort(function(a,b){
                            return a - b;
                        });
                        session.privateConversationData.hotelRequest.budget = {min: arr[0],max: arr[arr.length - 1],currency: 'AUD'};
                        break;
                }
                next({response:[]});
            } else {
                global._builder.LuisRecognizer.recognize(results.response, process.env.LUIS_MODEL_URL,function(err, intents, entities){
                    if (err) {
                        global._logger.log('info','double-confirm','call LUIS error: ' + err);
                    }
                    if (entities == null || entities.length == 0) {
                        //check possible value by missing items
                        if (session.dialogData.input.missing.length > 0 || session.dialogData.input.incorrect.length>0) {
                            var isCity = false;
                            var isHotel = false;
                            if (session.dialogData.input.missing.length > 0) {
                                for (var j = 0; j < session.dialogData.input.missing.length; j++) {
                                    if ('cityName' == session.dialogData.input.missing[j].field) {
                                        isCity = true;
                                        break;
                                    }
                                    if ('hotelName' == session.dialogData.input.missing[j].field) {
                                        isHotel = true;
                                        break;
                                    }
                                }
                            }

                            if (session.dialogData.input.incorrect.length > 0) {
                                for (var j = 0; j < session.dialogData.input.incorrect.length; j++) {
                                    if ('cityName' == session.dialogData.input.incorrect[j].field) {
                                        isCity = true;
                                        break;
                                    }
                                    if ('hotelName' == session.dialogData.input.incorrect[j].field) {
                                        isHotel = true;
                                        break;
                                    }
                                }
                            }
                            if (isCity) {
                                session.beginDialog('askForCity', results.response);
                            } else if (isHotel) {
                                session.privateConversationData.hotelRequest.hotelName = results.response
                                next({response:true});
                            } else if (session.privateConversationData.hotelRequest.preferredLocation == null) {
                                session.privateConversationData.hotelRequest.preferredLocation = results.response
                                next({response:true});
                            } 
                            else {
                                session.send('对不起，我不知道您说的什么意思。');
                                next({response:true});
                            }
                        }
                    } else {
                        next({response:entities});
                    }
                });
            }
        }
    },
    function (session, results) {
        if (results.response == true) {
            console.log('hotelName from session is:' + JSON.stringify(session.privateConversationData.hotelRequest.hotelName));
            if (session.privateConversationData.hotelRequest.hotelUuid != null) {
                session.beginDialog('chooseRoom')
            }  else {
                var possibleHotelName = session.privateConversationData.hotelRequest.hotelName;
                session.privateConversationData.hotelRequest.hotelName = null;
                session.beginDialog('askForHotel',{'possibleHotelName' : possibleHotelName});
            }
        } else {
            session.replaceDialog('RequestHotel', {entities:results.response});
        }
    }
];

exports.confirmConfilict = [
    function (session, args) {
        session.dialogData.index = args.index ? args.index : 0;
        session.dialogData.items = args.items;
        session.dialogData.chosedIndex = args.chosedIndex ? args.chosedIndex : [];
        global._builder.Prompts.choice(session,session.dialogData.items[session.dialogData.index].msg, session.dialogData.items[session.dialogData.index].options, global._builder.ListStyle.list);
    },
    function (session, results) {
        var item = session.dialogData.items[session.dialogData.index++];
        var _field = item.field
        session.privateConversationData.hotelRequest[_field] = results.response.entity
        if (session.dialogData.index >= session.dialogData.items.length) {
            session.beginDialog('doubleConfirm', session.privateConversationData.hotelRequest);
        } else {
            session.replaceDialog('confirmConfilict', session.dialogData);
        }
    }
]