exports.help = [
    function (session) {
        console.log('calling help dialog');
        session.send("input anything");
    },
    function (session, results) {
        session.send('Your input is:' + results.response);
        session.endDialog();
    }
];