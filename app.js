/*-----------------------------------------------------------------------------
To learn more about this template please visit
https://aka.ms/abs-node-proactive
-----------------------------------------------------------------------------*/
"use strict";
// require('launch-json');
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var azure = require('azure-storage');
var path = require('path');
var winston = require('winston');
//ar slack_rtm = require('./slack-rtm-service');

//var Domain = require('./domain');
//var Luis = require('./luis-service');
var cognitiveservices = require('botbuilder-cognitiveservices');

var preprocessor = require('./utils/preprocessor');

const default_locale = 'zh-Hans';
var useEmulator = (process.env.BotEnv == 'development');

// if(process.env.BotEnv == 'prod') {
//     require("winston-azure-blob-transport");    
//     function toDateStr(number) {
//         return number < 10?  "0" + number.toString() : number.toString();        
//     }   
//     var d = new Date();
//     var datePath = d.getUTCFullYear() + "-" +toDateStr(d.getUTCMonth()+1) + "-" + toDateStr(d.getUTCDate()) + "/" + toDateStr(d.getUTCHours()) + "-" + toDateStr(d.getUTCMinutes());
//     global._logger = new (winston.Logger)({
//         transports: [
//             new (winston.transports.AzureBlob)({    
//             account: {
//                 name: "cozitripchatbot",
//                 key: "/XtqnGbTT49mrDkRJC5JQ3ds1Urwmd5ukdBIgAK8/bWbcAK9sGBiwJz7dWzmGgTvVtf38YN7DXB9MyPSyHYa+g=="
//             },
//             containerName: "chatbotlogs",
//             blobName: "logs/" + datePath + "----" + require('uuid/v4')().substring(0,10) + ".log",
//             level: "info"
//             })
//         ]
//     });
//     //global._logger = winston;
//     global._logger.info("Logging in production");    
// } else {
//     global._logger = winston;
//     global._logger.info('logging not in production');
// }

var utils = require('./utils/utils');

global._logger = utils;

global._hotelsPerPage = 5;
global._logger.log('info','init', {'global._useRichcard': global._useRichcard});
global._logger.log('info','init',{'env': process.env.BotEnv})
global._logger.log('info','init',{'LUIS': process.env.LUIS_MODEL_URL})

var GreetingWaterfall = require('./dialogues/greeting').greeting;
var AskCityWaterfall = require('./dialogues/ask-city').askCity;
var AskHotelWaterfall = require('./dialogues/ask-hotel').askHotel;
var RequestHotelWaterfall = require('./dialogues/request-hotel').requestHotel;
var ChooseHotelWaterfall = require('./dialogues/choose-hotel');
var HelpWaterfall = require('./dialogues/help').help;
var AskGuest = require('./dialogues/ask-guest');
var RequestActivityWaterfal = require('./dialogues/request-activity').requestActivity;
var ChooseRooms = require('./dialogues/choose-room');
var BookHotel = require('./dialogues/book-hotel');
var UpdateInfo = require('./dialogues/update-info');
var DoubleConfirm = require('./dialogues/double-confirm');
var QNAMarker = require('./dialogues/qna-marker');
var StartOver = require('./dialogues/start-over');
var AskLocation = require('./dialogues/ask-location');
var MapService =  require('./map-service');
var Handoff = require('./dialogues/handoff');

var restify = require('restify');
// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());


var bot = new builder.UniversalBot(connector, {
    localizerSettings: {
        defaultLocale: default_locale
    }
});


// var bot = new builder.UniversalBot(connector, function (session) {
//     session.send("%s, I heard: %s", session.userData.name, session.message.text);
//     session.send("Say 'help' or something else...");
// });

//send proactive message if no reply from user
global._timeoutobject = {}
bot.on('receive', function(args) {
    global._logger.log('info', "incoming text: ", {'text': args.text, 'user':  args.address,'time': args.timestamp});
    var userAddress = args.address;
    var user = args.user
    clearTimeout(global._timeoutobject[user]);
    global._timeoutobject[user] = setTimeout(sendProactiveMessage, 120000, userAddress);
    args.text = preprocessor.preprocess(args.text);
    global._logger.log('info', "parsed text:", {'text': args.text});    
    console.log("parsed text:" + args.text);
});
bot.on('send', function (args){
    global._logger.log('info', "output text: ", {'text': args.text, 'user':  args.address});
});

function sendProactiveMessage(address) {
    global._logger.log('info','sending ProactiveMessage to address' + address.toString);
    var msg = new global._builder.Message().address(address);
    msg.text('您如果需要帮助，请说 帮助，小卡随时候命');
    bot.send(msg);
  }
//send proactive message done

bot.localePath(path.join(__dirname, './locale'));

global._builder = builder;


var qnaRecognizer = new cognitiveservices.QnAMakerRecognizer({
	knowledgeBaseId: process.env.QNA_KBID, 
	subscriptionKey: process.env.QNA_KEY
});
process.env.LUIS_MODEL_URL="https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/e6dc5a93-0c84-4973-bac0-d56c44ec3693?subscription-key=7148b349a20a4fb6b1e13fb49708429a&timezoneOffset=0&verbose=true&q="
var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
const intents = new builder.IntentDialog({
    recognizers: [
        recognizer//,qnaRecognizer
    ],
    intentThreshold: 0.75
}).onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

global._qnaRecognizer = qnaRecognizer

//define commom pattern
const noIntentPattern = new RegExp("不知道|没|随便|no|not|don't know",'i');
global._partten = {};
global._partten.noIntentPattern = noIntentPattern;

bot.recognizer(qnaRecognizer);
bot.recognizer(recognizer);
bot.dialog('/', intents);

// bot.use({
//     botbuilder: function (session, next) {
//         console.log("bot use middleware.");
//         //session
//         if (session.privateConversationData['inSlack'] == true) {
//             //send message to slack
//             slack_rtm.sendMessage(session.privateConversationData['slackId'],session.message['text']);
//             //slack_rtm.clientReceive(session);
//             //session.endDialog();
//             session.message['text'] = "";
//             next();
//         } else {
//             next();
//         }
       
//     }
// })

intents.matches('Greeting', 'Greeting');
intents.onDefault('Greeting');
intents.matches('RequestHotel', 'RequestHotel').triggerAction({
    onInterrupted: function (session, dialogId, dialogArgs, next) {
        session.userData.savedAddress = session.message.address;
        console.log('RequestHotel is interrupted by dialogId=' + dialogId + ', dialogArgs=' +  JSON.stringify(dialogArgs));
        next();
    }
});


bot.dialog('RequestHotel', RequestHotelWaterfall).triggerAction({
    matches: 'RequestHotel',  intentThreshold: 0.75,
    onInterrupted: function (session, dialogId, dialogArgs, next) {
        session.userData.savedAddress = session.message.address;
        console.log('RequestHotel is interrupted by dialogId=' + dialogId + ', dialogArgs=' +  JSON.stringify(dialogArgs));
        next();
    }
 })


bot.dialog('RequestActivity',RequestActivityWaterfal).triggerAction({ matches: /^(活动|什么玩)/i});
bot.dialog('qna', QNAMarker.qnaDialog).triggerAction({matches: 'qna', intentThreshold: 0.8})
bot.dialog('startOver',StartOver.startOver).triggerAction({matches: 'StartOver', intentThreshold: 0.8})
bot.dialog('updateByIntents', UpdateInfo.updateByIntents).triggerAction({
    matches: 'ChangeRequest', intentThreshold: 0.9
});
//bot.dialog('handoff', Handoff.toSlack).triggerAction({matches: /human/i});
bot.dialog('continue',[
    function (session, args) {
        if (session.privateConversationData.hotelRequest != null) {
            session.send('好的，让我们继续');
            session.replaceDialog('RequestHotel',{'repeat': session.privateConversationData.hotelRequest, 'steps': session.dialogData.steps, 'address': session.userData.savedAddress})
        } else {
            session.replaceDialog('Greeting');
        }
    }
]).triggerAction({matches: /^(继续)/i})

bot.dialog('endConversation', [function (session, args) {
    session.clearDialogStack();
    session.endConversation('感谢使用小卡，下次见，拜拜');
}]).triggerAction({matches: 'EndConversation', intentThreshold: 0.7})
bot.dialog('Greeting', GreetingWaterfall);
bot.dialog('askForCity', AskCityWaterfall);
bot.dialog('askForHotel', AskHotelWaterfall);
bot.dialog('choose_hotel', ChooseHotelWaterfall.chooseHotel);
// bot.dialog('askCheckinCheckout', AskDate.askCheckinCheckout);
// bot.dialog('askCheckin', AskDate.askCheckin);
// bot.dialog('askCheckout', AskDate.askCheckout);
// bot.dialog('askPrice', AskPrice.askPrice);
// bot.dialog('askMinPrice', AskPrice.askMinPrice);
// bot.dialog('askMaxPrice', AskPrice.askMaxPrice);
// bot.dialog('askRegion', AskRegionWaterfall);
// bot.dialog('askStar', AskStar.askStar);
// bot.dialog('askMinStar', AskStar.askMinStar);
// bot.dialog('askMaxStar', AskStar.askMaxStar);
bot.dialog('askGuest', AskGuest.askGuest)
bot.dialog('askGuestGender', AskGuest.askGuestGender);
// bot.dialog('askAdult', AskGuest.askAdult);
// bot.dialog('askChild', AskGuest.askChild);
// bot.dialog('askChildAge', AskGuest.askChildAge);
// bot.dialog('askRooms', AskRooms.askRooms);
bot.dialog('askGuestName', AskGuest.askGuestName);
bot.dialog('chooseRoom', ChooseRooms.chooseRoom);
bot.dialog('confirmRoom', ChooseRooms.confirmRoom);
bot.dialog('book', BookHotel.book);
bot.dialog('updateInfo', UpdateInfo.updateInfo);
bot.dialog('doubleConfirm', DoubleConfirm.doubleConfirm);
bot.dialog('qnaMarker', QNAMarker.qnaDialog);
bot.dialog('confirmConfilict', DoubleConfirm.confirmConfilict);
bot.dialog('confirmHotel',ChooseHotelWaterfall.confirmHotel);
bot.dialog('showOptionalHotel', ChooseHotelWaterfall.showOptionalHotels);
bot.dialog('askLocation', AskLocation.askLocation);
bot.dialog('showDistance', AskLocation.showDistance).triggerAction({
    matches: 'ChangeRequest', intentThreshold: 0.9
    // onInterrupted: function (session, dialogId, dialogArgs, next) {
    //     session.privateConversationData.disableLuis = false;
    //     next();
    // }
})
bot.endConversationAction('goodbye','感谢使用小卡，期待下次继续为您服务');


//trigger by action
bot.beginDialogAction('confirmHotelAction','confirmHotel');
bot.beginDialogAction('chooseRoomAction', 'confirmRoom');

// var restify = require('restify');
// var server = restify.createServer();
// if (useEmulator) {

//     server.listen(3978, function () {
//         console.log('test bot endpont at http://localhost:3978/api/messages');
//     });
//     server.post('/api/messages', connector.listen());
// } else {
//     //module.exports = { default: connector.listen() };
//     // Setup Restify Server
//     //var restify = require('restify');
//     //var server = restify.createServer();
//     server.listen(process.env.port || process.env.PORT || 3978, function () {
//     console.log('%s listening to %s', server.name, server.url); 
//     });
// }
// // Listen for messages from users 
// server.post('/api/messages', connector.listen());

