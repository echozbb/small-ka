var Utils = require('../utils/utils');
var Luis = require('../luis-service');
var Hotel = require('../hotel-service');
var Formatter = require('../utils/formatter');
var FillRequest = require('../utils/fill-request');
var Validator = require('../utils/validator');

exports.requestHotel = [
    function (session, args, next) {
        global._logger.log('info', 'Requesting hotel', JSON.stringify(args));
        session.preferredLocale('zh-Hans');
        var disableInput = false;
        if (args.entities != null || (args.intent != null && args.intent.entities.length > 0)) {
            var entities = args.entities == null ? args.intent.entities : args.entities;
            FillRequest.fillRequest(session, entities);
            disableInput = true;
        } else if (args.address != null) {
            session.message.address = args.address;
            disableInput = true;
        }
        var result = Validator.validateRequest(session.privateConversationData.hotelRequest);
        if (result != null) {
            session.privateConversationData.hotelRequest = result.hotelRequest;
            if (disableInput == false) {
                //process the input text directly
                result.inputText = session.message.text;
            }
        }
        session.beginDialog('doubleConfirm', result);
       
        
    },
    function (session, result) {
        session.userData.previoursRequest = null;
        session.endConversation();
    }
];

