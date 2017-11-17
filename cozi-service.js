var https = require('https');
var url_join = require('url-join');

var headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json'
};

function option(path, method){
    this.host = process.env.COZI_HOST;
    this.port = '443';
    this.path = path;
    this.method = method;
    this.headers = headers;
}

module.exports = {
    Get: function (path, cb) {
        path = url_join(path, '?cid=' + process.env.COZI_APP_ID + '&token=' + process.env.COZI_APP_TOKEN);
        global._logger.log('info', "cozi-service.Get", {'url': path});
        var options = new option(path, 'GET');
        return https.request(options, function(res) {
          global._logger.log('info', "cozi-service.Get", {'path': options.path});
          global._logger.log('info', "cozi-service.Get", {'Status': res.statusCode});
          
          res.setEncoding('utf8');
          var data = '';
          res.on('data', function (chunk) {
              data += chunk;
          });
        
          res.on('end', function(){
              cb(data);
          });
          if (res.statusCode != 200) {
            cb("{payload: null}");
        }
          res.on('error', function (e){
             global._logger.log('error', "cozi-service.Get", e);
          });
        }).end();
    },
   
    Post: function (path, resquestBody, cb) {
        path = url_join(path, '?cid=' + process.env.COZI_APP_ID + '&token=' + process.env.COZI_APP_TOKEN);
        var options = new option(path, 'POST');
        jsonObject = JSON.stringify(resquestBody);
        var reqPost = https.request(options, function(res){
            global._logger.log('info', "cozi-service.Post", {'Path': options.path});
            global._logger.log('info', "cozi-service.Post", {'Status': res.statusCode});
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
        //console.log('RequestBody: ' + jsonObject);
        global._logger.log('info', "cozi-service.Post", {'RequestBody': jsonObject});
        reqPost.write(jsonObject);
        reqPost.end();
        reqPost.on('error', function(e){
            //console.log(e);
            global._logger.log('error', "cozi-service.Post", e);
        });                
    }
}




//var req = http.request(options, function(res) {
//  var msg = '';
//
//  res.setEncoding('utf8');
//  res.on('data', function(chunk) {
//    msg += chunk;
//  });
//  res.on('end', function() {
//    console.log(JSON.parse(msg));
//  });
//});
//
//req.write(data);
//req.end();