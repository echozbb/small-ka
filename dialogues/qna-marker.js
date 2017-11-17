exports.qnaDialog = [
    function (session, args, next) {
        console.log("QnA Marker args: " + JSON.stringify(args));
        if (args.intent) {
            args = args.intent;
        }
        var answerEntity = global._builder.EntityRecognizer.findEntity(args.entities, 'answer');
        session.send(answerEntity.entity);
        next(null);
        //session.endDialog(answerEntity.entity)
    },
    function (session, args, next) {
        session.endDialog();
     }
]