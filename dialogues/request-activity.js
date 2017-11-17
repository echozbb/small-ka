exports.requestActivity = [
    function (session, args, next) {
        console.log('args---> ' + JSON.stringify(args));
        //session.send('你喜欢什么类型的活动？');
        global._builder.Prompts.choice(session, "您喜欢什么类型的活动?", "购物|观光|户外|海滩", global._builder.ListStyle.list);
        //session.endDialog('add code late');
    },
    function (session, results) {
        session.endDialog('此部分演示了瞬间场景切换，即将实现，敬请期待');
    } 
]