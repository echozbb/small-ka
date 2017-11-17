var qnaService = require('../qna-service');

exports.greeting = [
    function(session, args, next) {
        //session.send("welcome");
       // global._builder.Prompts.text(session, "welcome");
    //    var content = {};
    //    content.message = {};
    //    content.message.text = '早餐多少钱';
    //    global._qnaRecognizer.recognize(content, function(error, response) {
    //     var answerEntity = global._builder.EntityRecognizer.findEntity(response.entities, 'answer');
    //     session.endDialog(answerEntity.entity)
    //    });
       
        session.endDialog("welcome");
    }, 
    // function (session, args) {
    //     global._builder.Prompts.text(session,"input");
    //     session.send('finished greeting');
    //     var x = 5;
    // }
    //function (session, args) {
    //     session.begindDialog('QnAService', )
    //     qnaService.getQnAResult(args.response, function (data) {
    //         console.log("Got response from QNA: " + JSON.stringify(date));
    //         if (data != null) {
    //             session.endDialog(data.answers[0].answer);
    //         } else {
    //             session.endDialog('I am trying to understand your question.');
    //         }
    //     });
        
    //}
]