var Utils = require('../utils/utils');

exports.askGuest = [
    function (session, args, next) {
        if (session.privateConversationData.hotelRequest.adultNum == null) {
            global._builder.Prompts.text(session,'input_guest_info');
        } else {
            next({response: true});
        }
    },
    function(session, args, next) {
        if (session.privateConversationData.hotelRequest.adultNum == null) {
            var text = args.response.replace(/，/g,',').replace(/。/g,'.').trim();
            if (isNaN(text)) {
                global._builder.LuisRecognizer.recognize(args.response, process.env.LUIS_MODEL_URL,function(err, intents, entities){
                    console.log('in luis call back ---> ' + JSON.stringify(entities));
                    if (err) {
                        console.log(err);
                        session.replaceDialog('askGuest', {adultNum: null, childNum: null});
                    } 
                    if (entities) {
                        Utils.updateEntities(global._builder,entities,session);
                    }
                    if (session.privateConversationData.hotelRequest.childNum == null && session.privateConversationData.hotelRequest.adultNum == null) {
                        session.send('prompt_invalid_input');
                        session.replaceDialog('askGuest');
                    } else {
                        next ({response: true});
                    }
                })
            }  else {
                //adult number
                session.privateConversationData.hotelRequest.adultNum = global._builder.EntityRecognizer.parseNumber(text);
                session.privateConversationData.hotelRequest.childNum = 0;
                next ({response: true});
            }
        } else {
            next ({response: true});
        }
    } ,
    function (session, results, next) {
        if (session.privateConversationData.hotelRequest.childNum > 0 && session.privateConversationData.hotelRequest.childAge == null) {
            session.beginDialog('askChildAge');
        } else {
            next ({response:0});
        }
    },
    function (session, results) {
        var message = new global._builder.Message(session);
        if (session.privateConversationData.hotelRequest.childNum == null || session.privateConversationData.hotelRequest.childNum == 0) {
            message.text("confirm_guest_wo_child",
            session.privateConversationData.hotelRequest.adultNum);
        } else {
            message.text("confirm_guest",
            session.privateConversationData.hotelRequest.adultNum, session.privateConversationData.hotelRequest.childNum,session.privateConversationData.hotelRequest.childAge);
        }
        global._builder.Prompts.confirm(session, message);
        
    },
    function (session, results) {
        //console.log(results.response);
        if (results.response == false) {
            session.privateConversationData.hotelRequest.adultNum = null;
            session.privateConversationData.hotelRequest.childNum = null;
            session.privateConversationData.hotelRequest.childAge = null;
            session.send("select_again");
            session.replaceDialog('askGuest');
        } else {
           session.endDialog();
        }
    }
];

exports.askChildAge = [
    function (session, args, next) {
        session.dialogData.childNum = session.privateConversationData.hotelRequest.childNum;
         if (session.dialogData.childNum == 1) {
            global._builder.Prompts.number(session, 'input_child_age');
        } else if (session.dialogData.childNum > 1 ) {
            var message = new global._builder.Message(session);
            message.text('input_child_age_multi', session.dialogData.childNum);
            global._builder.Prompts.text(session, message);
        } else {
            next ({'response': 0});
        }
    },
    function (session, results) {
        var input = results.response+"";
        input = input.replace(/，/g,',');
        var isValid = Utils.validAge(input, session.dialogData.childNum);
        if (isValid) {
            session.privateConversationData.hotelRequest.childAge = input
            session.endDialogWithResult({'response': input});
        } else {
            session.send("invalid_age", session.dialogData.childNum);
            session.replaceDialog('askChildAge', {'childNum':session.dialogData.childNum});
        }
       
    }
];

exports.askChild = [
    function (session, args) {
        global._builder.Prompts.number(session, 'input_child_num');
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
];

exports.askAdult = [
    function (session) {
         global._builder.Prompts.number(session, 'input_adult_num');
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
];

exports.askGuestName = [
    function (session, args) {
        session.dialogData.rooms = args.rooms;
        var message = new global._builder.Message(session);
        message.text("input_guest_name", args.rooms);
        if (args.rooms > 1) {
            message.text("input_guest_per_room", args.rooms);
        }
        global._builder.Prompts.text(session, message, args.rooms);
    },
    function (session, results) {
        if (results.response.match(global._partten.noIntentPattern)) {
            session.send('没有客人名字无法完成预订，请输入正确的客人名字');
            session.replaceDialog('askGuestName', {'rooms': session.dialogData.rooms});
        } else {
            var guestName = results.response.replace(/，/g,',').trim();
            if (/^[a-zA-Z]+$/.test(guestName.replace(/,/g,'').replace(/ /g,'')) != true) {
                //session.send("input_guest_name");
                session.replaceDialog('askGuestName', {'rooms': session.dialogData.rooms});
            } else {
                session.dialogData.guestName = guestName;
                var names = guestName.split(",");
                if (names.length != session.dialogData.rooms) {
                    session.send('请输入每间房的客人名字');
                    session.replaceDialog('askGuestName', {'rooms': session.dialogData.rooms});
                } else {
                    var message = new global._builder.Message(session);
                    message.text("confirm_guest_name",guestName);
                    global._builder.Prompts.confirm(session, message);
                }
            }
        }
       
    },
    function (session, results) {
        if (results.response == true) {
            var guests = session.dialogData.guestName.split(',');
            var questions = [];
            for (var i = 0; i < guests.length; i++) {
                questions.push({field: guests[i], prompt: "请选择" + guests[i] + "是"});
            }
            session.dialogData.questions = questions;
            session.beginDialog('askGuestGender',session.dialogData);
        } else {
            session.replaceDialog('askGuestName', {'rooms': session.dialogData.rooms});
        }
    },
    function (session, results) {
        //session.send("going to book for the guest: " + JSON.stringify(results.response));
        var name = "";
        for (var i=0; i < results.response.length; i++) {
            if (i>0) {
                name += ","
            }
            name += results.response[i].lastName  + " " + results.response[i].firstName + " " + results.response[i].title_zh;
        }
        session.send("book_for_guest", name);
        session.endDialogWithResult(results);
    }
];

exports.askGuestGender = [
    function (session, args) {
        session.dialogData.index = args.index ? args.index : 0;
        session.dialogData.form = args.form ? args.form : [];
        session.dialogData.questions = args.questions;
        global._builder.Prompts.choice(session, session.dialogData.questions[session.dialogData.index].prompt, "女士|先生",global._builder.ListStyle.list);
    },
    function (session, results) {
        var guest = session.dialogData.questions[session.dialogData.index++].field;
        var name = guest.trim().split(" ");
        var title = 'Mr';
        var title_zh = "先生";
        if (results.response.index == 0) {
            title = 'Ms';
            title_zh = "女士";
        } 
        session.dialogData.form.push({'title': title, 'firstName': name[1],'lastName': name[0], 'title_zh': title_zh});

        // Check for end of form
        if (session.dialogData.index >= session.dialogData.questions.length) {
            // Return completed form
            session.endDialogWithResult({'response': session.dialogData.form});
        } else {
            // Next field
            session.replaceDialog('askGuestGender', session.dialogData);
        }
    }

]