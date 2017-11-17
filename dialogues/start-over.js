exports.startOver = [
    function(session, args) {
        if (session.privateConversationData.hotelRequest == null) {
            session.endConversation('start_over');
        } else {
            global._builder.Prompts.confirm(session, 'confirm_startover');
        }
    },
    function (session, results) {
        if (results.response == true){
            session.endConversation('welcome');
        } else {
            session.replaceDialog('RequestHotel',{'repeat': session.privateConversationData.hotelRequest, 'steps': session.dialogData.steps, 'address': session.userData.savedAddress});
        }
    }
]