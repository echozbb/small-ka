var WebSocketClient = require('websocket').client;
var WebSocketConnection = require('websocket').connection;


var client = new WebSocketClient();

module.exports = {
    
    clientConnect: function (url, session) {
        if (process.env.ENABLE_SLACK == 'false') {
            console.log('connect to slack disabled.');
        } else {
            client.connect(url);
            
                    client.on('connect', function(connection) {
                        WebSocketConnection = connection;
            
                        connection.on('message', function(message) {
                            //session.userData.savedAddress.user['inSlack'] = true;
                            //session.privateConversationData['inSlack'] = true;
                            if (message.type === 'utf8') {
                                console.log("Received: '" + message.utf8Data + "'");
                            }
                            var msg = JSON.parse(message.utf8Data);
                            switch(msg.type) {
                                case 'hello': 
                                    console.log("Connected sucessful!");
                                    //send init message
                                    if (session.dialogData != null && session.dialogData.message != null) {
                                        var msg = {
                                            "id": session.privateConversationData.messageId++,
                                            "type": "message",
                                            "channel": session.privateConversationData.slackId,
                                            "text": session.dialogData.message
                                        };
                                        connection.sendUTF(JSON.stringify(msg));
                                    }
                                    break;
                                case 'message':
                                    console.log('message type is message');
                                    // if (session.privateConversationData.slackId != msg.channel) {
                                    //     console.log("current channel in privateConversationData is " + session.privateConversationData.slackId);
                                    //     console.log("message from channel " + msg.channel);
                                    //     var ss = global._chanelSessionMap[session.privateConversationData.slackId];
                                    //     ss.sen(text)
                                    //     //console.log('The message is for channel ' + session.privateConversationData.slackId);
                                    // }  
                                    if (msg.reply_to != null) {
                                        console.log("this message is sent to slack.")
                                        //to slack
                                    } else {
                                        //to TA via chatbot
                                        console.log('this message is sent to bot.');
                                        if (msg.text != null && msg.text.startsWith('say:')) {
                                            var text = msg.text.substring(4,msg.text.length);
                                            console.log('message to bot -> ' + text + " | session -> " + session);
                                            if (session.privateConversationData.slackId != msg.channel) {
                                                var ss = global._chanelSessionMap[msg.channel];
                                                console.log('sending message to ss -> ' + ss);
                                                if (ss != null) ss.send(text)
                                            } else {
                                                session.send(text);
                                            }


                                            
                                        }
                                    }
                                    break;
                                case 'user_typing':
                                    session.sendTyping();
                                    break;
                                case 'reconnect_url':
                                    console.log("reconnect url..." + msg.url);
                                    break;
                                case 'error':
                                    console.log('connection expired.');
                                    break;
                                default:
                                    console.log("unknow message type..." + msg.type);
                            }
                            
                        });
                        connection.on('error', function(error) {
                            console.log("Connection Error: " + error.toString());
                            session.privateConversationData['inSlack'] = false;
                            session.privateConversationData['slackId'] = null;
                        });
                        connection.on('close', function() {
                            console.log('echo-protocol Connection Closed');
                            session.privateConversationData['inSlack'] = false;
                            session.privateConversationData['slackId'] = null;
                        });
                        
                    });
                    client.on('connectFailed', function(error) {
                        console.log('connect failed.');
                        session.privateConversationData['inSlack'] = false;
                    });
        }

    },
    sendMessage: function (id,channelId, message) {
        var msg = {
            "id": id,
            "type": "message",
            "channel": channelId,
            "text": message
        };
        if (WebSocketConnection != null && WebSocketConnection.state == 'open') {
            WebSocketConnection.sendUTF(JSON.stringify(msg));
            return true;
        } else {
            console.log('Connection closed.');
            return false;
        }
    }
}
