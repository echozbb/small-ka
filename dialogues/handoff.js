var Slack = require('../slack-service');
var Slack_rtm = require('../slack-rtm-service');

exports.toSlack = [
    function(session, args, next) {
        if (args != null && args.text != null) {
            if (args.text != '') {
                var message = new global._builder.Message(session);
                message.text(args.text);
                session.send(message);
            }
            session.dialogData.confirmedRoom = args.choosedRoom;
            session.dialogData.silent = args.silent == null ? false : args.silent;
            next({response: true});
        } else {
            var message = new global._builder.Message(session);
            message.text("您确定要转到人工吗？这将会需要一些等待时间");
            message.suggestedActions(global._builder.SuggestedActions.create(session,
               [
                   global._builder.CardAction.imBack(session, "是的", "是的"),
                   global._builder.CardAction.imBack(session, "不是", "不是")
               ]
           ));
           global._builder.Prompts.confirm(session, message);
        }
       
    },
    function (session, result, next) {
        if (session.privateConversationData.slackId != null) {
            console.log('already connected to slack');
            next({response: true});
        } else if (result.response) {
            console.log("connecting to slack....");
            var gpName = session.userData.savedAddress.id
            gpName = 'sk_' + gpName.substring(0, 9);
            //TODO:
            //session.privateConversationData.slackId="G8963FMBK"
            var slackId = session.privateConversationData.slackId;
            if (slackId != null) {
                Slack.getConversationInfo(slackId).catch(e => console.log(e)).then(function (data){
                    if (data.ok == true) {
                        console.log("channel " + slackId + " already exists");
                        next({response: true});
                    } else {
                        console.log("channel " + slackId + " not exists, create a new one");
                        //TODO
                        next({response: true});
                    }
                });
            } else {
                //list conversaction
                Slack.listConversation(gpName).catch(e => console.log(e)).then(function (data) {
                    var found = false;
                    if (data.ok == true) {
                        if (data.channels != null && data.channels.length > 0) {
                            for (var i=0 ; i < data.channels.length; i++) {
                                if (gpName == data.channels[i].name) {
                                    session.privateConversationData.slackId=data.channels[i].id;
                                    found = true;
                                }
                            }
                        }
                    }
                    if (found == false) {
                        //create new conversation
                        Slack.createConversation(gpName).catch(e => console.log(e)).then(function (data) {
                            if (data.ok == false) {
                                console.log("connect to agent failed.")
                                next({response: false});
                            } else {
                                console.log("connect to agent success.")
                                channelId = data.channel['id'];
                                session.privateConversationData.slackId = channelId
                                Slack.inviteUser(channelId).catch(e => console.log(e)).then(function (data) {
                                    if (data.ok == false) {
                                        console.log("Invite user failed.");
                                        next({response: false});
                                    } else {
                                        console.log("Invite user sucess.");
                                        next({response: true});
                                    }
                                })
                            }
                        });
                    } else {
                        next({response: true});
                    }

                })
                
            }
        } else {
            session.endDialog("小卡将继续为您服务，如需联系客服请随时说 转人工");
        }
    },
    function (session, result) {
        if (result.response == true) {
            if (!session.dialogData.silent) {
                session.send("您已连接到Cozitrip金牌客服");
                session.privateConversationData['onlySlack'] = true;
            }
            //send init request to slack group
            var requestInfo = session.privateConversationData.hotelRequest;

            var message = "";
            if (!session.dialogData.silent) {
                message = "Hi Rebecca, you have a customer from Small-Ka, please help."
                if (requestInfo != null) {
                    message = message + "\n" + JSON.stringify(requestInfo);
                }
                if (session.dialogData.confirmedRoom != null) {
                    message = message + "\n" + "the customer has an onRequest room for your confirm."
                    message = message + "\n" + JSON.stringify(session.dialogData.confirmedRoom);
                }
            } else {
                message = "Hi team, we have a connection from small-ka, you are currently in slient monitor mode";
                message = message + "\n" + "if want to speack to the agent directly, please say handoff"
            }
            var success = Slack_rtm.sendMessage(session.privateConversationData.messageId++,session.privateConversationData['slackId'],message);
            if (!success) {
                //connect again if failed
                Slack.rtmConnect().catch(e => console.log(e)).then(function(data) {
                    if (data.ok == true) {
                        console.log('url-> ' + data.url);
                        console.log('team.Id-> ' + data.team['id']);
                        console.log('botId-> ' + data.self['id']);
                        session.dialogData.message = message
                        Slack_rtm.clientConnect(data.url, session);
                    } else {
                        if (!session.dialogData.silent) session.send("对不起，客服繁忙，请稍后再试。");
                    }
                });
            }
        } else {
            if (!session.dialogData.silent) session.send("对不起，客服繁忙，请稍后再试。");
        }
    }

]

