var CityService = require('../city-service');

exports.askCity = [
    function (session, args, next) {
        global._logger.log('info','askCity','current city code:' + session.privateConversationData.hotelRequest.cityCode);
        if (session.privateConversationData.hotelRequest.cityCode == null && session.privateConversationData.hotelRequest.cityName == null) {
            if (args == null) {
                global._builder.Prompts.text(session, "prompt_city");
            } else {
                next({ response: args });
            }
        } else {
            next({ response: true });
        }
    },
    function (session, results) {
        console.log('response start.' + results.response);
        if (results.response == true) {
            session.endDialog();
        } else {
            CityService.searchCity(results.response)
            .catch(err => {
                global._logger.log('info','askCity',err);
                session.send('invalid_city');
                session.replaceDialog('askForCity');
            })
            .then(result => {
                if (result == null) {
                    session.send('invalid_city');
                    session.replaceDialog('askForCity');
                } else {
                    session.send('好的，您计划前往' + result.name);
                    //session.privateConversationData.hotelRequest.cityCode = result.name;
                    session.privateConversationData.hotelRequest.countryCode = result.countryCode;
                    if (result.location != null) {
                        session.privateConversationData.hotelRequest.cityName = result.name;
                        session.privateConversationData.hotelRequest.latitude = result.location.lat;
                        session.privateConversationData.hotelRequest.longitude = result.location.lng;
                        if (session.privateConversationData.hotelRequest.cityCode == null) {
                            //set preferred location = cityName
                            session.privateConversationData.hotelRequest.preferredLocation = result.name;
                        }
                    }
                    session.endDialog();
                }
            });
        }

    }
];