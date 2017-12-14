var https = require('https');
var url_join = require('url-join');



var headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json'
};

const rebeccaId =  'U37FD759Q';
//bot, rinat, ping
const travelAgentBot = 'U888XALDB,U0AHUG221,U0AHPTW91'
//bot, john
const testInviteUser = 'U888XALDB,U0CAW5B7H'


function option(path, method){
    this.host = "slack.com";
    //this.port = '443';
    this.path = path;
    this.method = method;
    this.headers = headers;
}

 function Post(path, resquestBody, cb) {
    if (process.env.ENABLE_SLACK == 'false') {
        cb('{"payload": null}');
    } else {
        if (!/token/i.test(path)) {
            var path = url_join(path, '&token=' + process.env.SLACK_ECHO_TOKEN )
        }
       
        var options = new option(path, 'POST');
        //jsonObject = JSON.stringify(resquestBody);
        var reqPost = https.request(options, function(res){
            global._logger.log('info', "slack-service.Post", {'Path': options.path});
            global._logger.log('info', "slack-service.Post", {'Status': res.statusCode});
            res.setEncoding('utf8');
            var data='';
            res.on('data', function (chunk) {
                data += chunk;
            });
            
            res.on('end',function(){
                cb(data);
            });
    
            if (res.statusCode != 200) {
                cb("{payload: null}");
            }
    
        });
        reqPost.end();
        reqPost.on('error', function(e){
            global._logger.log('error', "slack-service.Post", e);
        });               
    }
}
module.exports = {
    rtmConnect: function (){
        return new Promise (function (resolve) {
            var path = url_join("/api/rtm.connect", '?batch_presence_aware=false' ,"&pretty=1", '&token='+process.env.SLACK_BOT_TOKEN);
            Post(path, null, function (data) {
                console.log(JSON.stringify(data));
                resolve(JSON.parse(data));
            })
        });
    },

    createConversation: function (name) {
        return new Promise (function (resolve) {
            //var path = url_join("/api/channels.create", '?name=' + name , "&validate=true");
            var path = url_join("/api/conversations.create", '?name=' + name , "&is_private=true");
            Post(path, null, function (date) {
                console.log(JSON.stringify(date));
                resolve(JSON.parse(date));
            })
        });
    },

    getConversationInfo: function (channelId) {
        return new Promise (function (resolve) {
            //var path = url_join("/api/channels.info", '?channel=' + channelId, "&pretty=1", "&include_locale=true");
            var path = url_join("/api/conversations.info", '?channel=' + channelId, "&include_locale=true");
             Post(path, null, function (date) {
                console.log(JSON.stringify(date));
                resolve(JSON.parse(date));
            })
        });
    },

    inviteUser: function (channelId, isTest) {
        return new Promise (function (resolve) {
            //var path = url_join("/api/channels.invite", '?channel=' + channelId, "&pretty=1", '&user='+travelAgentBot);
            var path = null
            if (isTest) {
                path = url_join("/api/conversations.invite", '?channel=' + channelId, "&pretty=1", '&users='+testInviteUser);
            } else {
                path = url_join("/api/conversations.invite", '?channel=' + channelId, "&pretty=1", '&users='+travelAgentBot);
            }
            Post(path, null, function (data) {
                console.log(JSON.stringify(data));
                resolve(JSON.parse(data));
            })
        });
    },
    sendMessage: function(channelId, message) {
        return new Promise (function (resolve) {
            var path = url_join("/api/chat.meMessage", '?channel=' + channelId, '&token='+process.env.SLACK_BOT_TOKEN, '&text='+message, "&pretty=1");
             Post(path, null, function (data) {
                console.log(JSON.stringify(data));
                resolve(JSON.parse(data));
            })
        });
    },
    listConversation: function(channelName) {
        return new Promise (function (resolve) {
            
            var path = url_join("/api/conversations.list", '?exclude_archived=true',  '&limit=0', '&types=private_channel');
             Post(path, null, function (date) {
                console.log(JSON.stringify(date));
                resolve(JSON.parse(date));
            })
        });
    },
    archiveConversation: function (channelId) {
        return new Promise (function (resolve) {
            var path = url_join("/api/conversations.archive", '?channel=' + channelId);
             Post(path, null, function (date) {
                console.log(JSON.stringify(date));
                resolve(JSON.parse(date));
            })
        });
    }
    
    // sendUserMessage: function (channelId, message) {
    //     return new Promise (function (resolve) {
    //         var text = encodeURIComponent(message);
    //         var path = url_join("/api/chat.meMessage", '?channel=' + channelId, "&pretty=1", "&text=" + text);
    //          Post(path, null, function (date) {
    //             console.log(JSON.stringify(date));
    //             resolve(JSON.parse(date));
    //         })
    //     });
    // }
}