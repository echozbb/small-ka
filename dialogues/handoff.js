var Slack = require('../slack-service');
var Slack_rtm = require('../slack-rtm-service');

exports.toSlack = [
    function(session) {
        var message = new global._builder.Message(session);
        message.text("您确定要转到人工吗？这将会需要一些等待时间");
        message.suggestedActions(global._builder.SuggestedActions.create(session,
           [
               global._builder.CardAction.imBack(session, "是的", "是的"),
               global._builder.CardAction.imBack(session, "不是", "不是")
           ]
       ));
       global._builder.Prompts.confirm(session, message);
    },
    function (session, result, next) {
        if (result.response) {
            console.log("connecting to slack....");
            var gpName = session.userData.savedAddress.id
            gpName = 'sp_' + gpName.substring(0, 9);
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
                                        console.log("Invite Rebecca failed.");
                                        next({response: false});
                                    } else {
                                        console.log("Invite Rebecca sucess.");
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
            session.end("our bot will serve you");
        }
    },
    function (session, result) {
        if (result.response == true) {
            session.send("Rebecca is talking to you now.");
            //send init request to slack group
            var requestInfo = session.privateConversationData.hotelRequest;
            var message = "Hi Rebecca, you have a customer from Small-Ka, please help."
            if (requestInfo != null) {
                message = message + "\n" + JSON.stringify(requestInfo);
            }
            //rtm connect
            Slack.rtmConnect().catch(e => console.log(e)).then(function(data) {
                if (data.ok == true) {
                    console.log('url-> ' + data.url);
                    console.log('team.Id-> ' + data.team['id']);
                    console.log('botId-> ' + data.self['id']);
                    session.dialogData.message = message
                    Slack_rtm.clientConnect(data.url, session);
                }
            });
        } else {
            session.send("out agent is too busy now, please try to connect later.");
        }
    }

]

