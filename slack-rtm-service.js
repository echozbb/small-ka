var WebSocketClient = require('websocket').client;
var WebSocketConnection = require('websocket').connection;


var client = new WebSocketClient();

module.exports = {
    
    clientConnect: function (url, session) {
        client.connect(url);

        client.on('connect', function(connection) {
            WebSocketConnection = connection;

            connection.on('message', function(message) {
                //session.userData.savedAddress.user['inSlack'] = true;
                session.privateConversationData['inSlack'] = true;
                if (message.type === 'utf8') {
                    console.log("Received: '" + message.utf8Data + "'");
                }
                var msg = JSON.parse(message.utf8Data);
                switch(msg.type) {
                    case 'hello': 
                        console.log("Connected sucessful!");
                        //send init message
                        var msg = {
                            "id": session.privateConversationData.messageId++,
                            "type": "message",
                            "channel": session.privateConversationData.slackId,
                            "text": session.dialogData.message
                        };
                        connection.sendUTF(JSON.stringify(msg));
                        break;
                    case 'message':
                        if (msg.reply_to == 1) {
                            //to slack
                        } else {
                            //to TA via chatbot
                            if (msg.text.startsWith('say:')) {
                                var text = msg.text.substring(5,msg.text.length);
                                session.send(text);
                            }
                            // if (session.privateConversationData['onlySlack']== true && msg.text != 'handoff') {
                            //     session.send(msg.text);
                            // }
                            // if (msg.text == 'handoff') {
                            //     session.privateConversationData['onlySlack']=true
                            // }
                            
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
