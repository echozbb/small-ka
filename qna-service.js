var http = require('http');
var url_join = require('url-join');

var headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json',
    'Ocp-Apim-Subscription-Key': process.env.QNA_KEY
};

function option(path, method){
    this.host = process.env.QNA_HOST;
    //this.port = '443';
    this.path = path;
    this.method = method;
    this.headers = headers;
}

module.exports = {
    getQnAResult: function (question, cb) {
        var options = new option(process.env.QNA_URL, 'POST');
        var resquestBody = {'question': question};
        jsonObject = JSON.stringify(resquestBody);
        //http.reqPost
        var reqPost = http.request(options, function(res){
            console.log('Calling QnA Marker service ...' + options.path);
            console.log('STATUS: ' + res.statusCode);
            res.setEncoding('utf8');
            var data='';
            res.on('data', function (chunk) {
                data += chunk;
            });
            
            res.on('end',function(){
                cb(data);
            });

        });
        console.log('RequestBody: ' + jsonObject);
        reqPost.write(jsonObject);
        reqPost.end();
        reqPost.on('error', function(e){
            console.log(e);
        });                
    }
}

