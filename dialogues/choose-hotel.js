var Hotel = require('../hotel-service');
var City = require('../city-service');
var Utils = require('../utils/utils');
var MapService = require('../map-service');

exports.chooseHotel = [
    function (session, args, next) {
        if (args != null && args['prompt']) {
            session.send(args['prompt'])
        }
        session.beginDialog('askLocation', {});
    },
    function (session, results, next) {
        var multiRequest = {};
        multiRequest = Utils.buildMultiRoomRequest(session.privateConversationData.hotelRequest);
        session.send("searching_hotel","适合", multiRequest.rooms, multiRequest.arrival, multiRequest.departure,
            multiRequest.roomGuests[0].adults, multiRequest.roomGuests[0].children);
        
        session.beginDialog('showOptionalHotel', {'multiRequest': multiRequest, 'startIndex': 0});
       
    }
],
exports.showOptionalHotels = [
    function (session, args) {
        global._logger.log('info', 'showOptionalHotels', {'args': JSON.stringify(args)});

        session.dialogData.multiRequest = session.dialogData.multiRequest == null ? args.multiRequest : session.dialogData.multiRequest;
        session.dialogData.startIndex = session.dialogData.startIndex == null ? args.startIndex : session.dialogData.startIndex;

        let multiRequest = session.dialogData.multiRequest;
        let startIndex = session.dialogData.startIndex;
        session.sendTyping();
        Hotel.searchHotel(multiRequest,startIndex).catch(e => {
            global._logger.log('info','chooseHotel.searchHotel', e);
        }).then(function(object, reject){
            var quotes = object.quotes;
            var extraInfo = object.extraInfo;
            var totalCount = object.totalCount
            var filterResult = ""
            if (extraInfo != null) {
                if (extraInfo['FILTER_BY_PRICE'] != null && extraInfo['FILTER_BY_STAR'] != null) {
                    filterResult = "根据价格和星级, 我们已为您分别过滤掉了"+ extraInfo['FILTER_BY_PRICE'] + "家和" + extraInfo['FILTER_BY_STAR'] + "家酒店, "
                } else if (extraInfo['FILTER_BY_PRICE'] != null) {
                    filterResult = "根据价格要求, 我们已为您过滤掉了" + extraInfo['FILTER_BY_PRICE'] + "家酒店, "
                } else if (extraInfo['FILTER_BY_STAR'] != null) {
                    filterResult += "根据星级要求, 我们已为您过滤掉了" + extraInfo['FILTER_BY_STAR'] + "家酒店, "
                }
            }
            var nights = Utils.getNights(multiRequest.arrival, multiRequest.departure);
            if (quotes != null && quotes.length > 0) {
                session.dialogData.quote = {};
                session.dialogData.quote.quotes = quotes;
                session.dialogData.quote.nights = nights;
                session.dialogData.startIndex = startIndex + global._hotelsPerPage;
                var msg = Utils.buildHeroCardByQuote(session);
                session.send(msg);
                session.send(MapService.getMapMessage(session, quotes));
                if (quotes.length + startIndex >= totalCount) {
                    global._builder.Prompts.text(session, filterResult + "这些已经是符合条件的所有酒店了。您可以尝试更改星级或预算或日期以获取更多酒店");
                } else {
                    var message = new global._builder.Message(session);
                    message.text("如果没有您想要的，请说 翻页");
                    message.suggestedActions(global._builder.SuggestedActions.create(session,
                       [
                           global._builder.CardAction.imBack(session, "翻页", "翻页")
                       ]
                   ));

                    global._builder.Prompts.text(session, "如果没有您想要的，请说 翻页");

                }
            } else {
                session.privateConversationData.pendingAction = 'updateHotel'
                global._builder.Prompts.text(session, "对不起，没有更多适合酒店了, " +filterResult+ "请尝试更改搜索条件，换个日期或城市试试");
            }
        });
    },
    function (session, results) {
        if (/(翻页|下一页|next|更多)/ig.test(results.response)) {
            session.replaceDialog('showOptionalHotel', {'startIndex':session.dialogData.startIndex,'multiRequest': session.dialogData.multiRequest});
        } else {
            //call LUIS to recognize
            global._builder.LuisRecognizer.recognize(results.response, process.env.LUIS_MODEL_URL,function(err, intents, entities){
                if (err) {
                    global._logger.log('info','choose-hotel','call LUIS error: ' + err);
                }
                if (entities != null && entities.length > 0) {
                    //update request
                    session.replaceDialog('RequestHotel', {entities: entities});
                } else {
                    var message = new global._builder.Message(session);
                    message.text("对不起，我不知道您的意思，如需帮助，请说 帮助");
                    message.suggestedActions(global._builder.SuggestedActions.create(session,
                       [
                           global._builder.CardAction.imBack(session, "帮助", "帮助")
                       ]
                   ));
                   //global._builder.Prompts.text(session, message);
                   session.send(message);
                }
            });
        }
    }
]
exports.confirmHotel = [
    function(session, args) {
        global._logger.log('info','confirmHotel', {'args': args});
        session.privateConversationData.pendingAction = 'bookingHotel';
        if (args.data) {
            var chosedHotel = JSON.parse(args.data);
            session.privateConversationData.hotelRequest.hotelName = chosedHotel.name;
            session.privateConversationData.hotelRequest.hotelUuid = chosedHotel.hotelUuid;
            session.beginDialog('chooseRoom');
        }
    }
]
