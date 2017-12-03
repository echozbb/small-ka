var Formatter = require('./formatter');
var Utils = require('./utils');
var dateFormat = require('dateformat');

module.exports  = {
    fillRequest(session, entities) {
        var message = session.message.text;
        var originalRequest = {}
        var confilictItems = []
        if (session.privateConversationData.hotelRequest != null) {
            var origStr = JSON.stringify(session.privateConversationData.hotelRequest);
            originalRequest = JSON.parse(origStr);
        } else {
            session.privateConversationData.hotelRequest = {}
        }

        //get date
        var allDates = Formatter.getDates(entities, message);
        if (allDates != null && allDates.length > 0) {
            if (allDates.length == 2) {
                session.privateConversationData.hotelRequest.fromDate = allDates[0].date;
                session.privateConversationData.hotelRequest.toDate = allDates[1].date;
            } else if (allDates.length == 1) {

                //check key words first
                if (/(out|离店|退房|离开|departure)/ig.test(message)) {
                    session.privateConversationData.hotelRequest.toDate = allDates[0].date;

                    if (session.privateConversationData.hotelRequest.fromDate != null) {
                        if (!Utils.isBefore(session.privateConversationData.hotelRequest.fromDate,allDates[0].date)) {
                            session.privateConversationData.hotelRequest.fromDate = null;
                        }
                    }

                } else if (/(in|入住|到达|抵达|到店|arrival)/ig.test(message)){
                    session.privateConversationData.hotelRequest.fromDate = allDates[0].date;

                    if (session.privateConversationData.hotelRequest.toDate != null) {
                        if (!Utils.isBefore(allDates[0].date, session.privateConversationData.hotelRequest.toDate)) {
                            session.privateConversationData.hotelRequest.toDate = null;
                        }
                    }
                } else if (originalRequest['fromDate'] == null) {
                    //default fromDate
                    session.privateConversationData.hotelRequest.fromDate = allDates[0].date;
                } else if (originalRequest['toDate'] == null) {
                    session.privateConversationData.hotelRequest.toDate = allDates[0].date;
                }
            } else {
                session.privateConversationData.hotelRequest.fromDate = allDates[0].date;
                session.privateConversationData.hotelRequest.toDate = allDates[allDates.length - 1].date
            }

            for (var i = 0; i < allDates.length; i++) {
                message = Utils.removeMatchedEntity(message, allDates[i].startIndex, allDates[i].endIndex);
            }
        }



        //************ Process search Item start */
        var searchItems = Formatter.getSearchItem(entities, message);
        var singleItems = ['adultNum','childNum','rooms','nights','adOrch'];
        for (var i = 0; i < singleItems.length; i++) {
            var aItem = searchItems.filter((obj, pos, arr) => {
                return obj.field == singleItems[i];
            }).filter((obj, pos, arr) => {
                return arr.map(mapObj => mapObj['value']).indexOf(obj['value']) === pos;
            });
            if (aItem.length == 1) {
                if (singleItems[i] == 'adOrch') {
                    //check key words after
                    var key = message.substring(aItem[0].endIndex, aItem[0].endIndex + 3);
                    if (/人|成/.test(key)) {
                        session.privateConversationData.hotelRequest['adultNum'] = aItem[0].value;
                    } else if (/儿|童/.test(key)) {
                        session.privateConversationData.hotelRequest['childNum'] = aItem[0].value;
                    }
                } else {
                    session.privateConversationData.hotelRequest[singleItems[i]] = aItem[0].value;
                }
            }
        }
        
        
        var multiItems = ['star']
        for (var i = 0; i < multiItems.length; i++) {
            var aItem = searchItems.filter((obj, pos, arr) => {
                return obj.field == multiItems[i];
            }).filter((obj, pos, arr) => {
                return arr.map(mapObj => mapObj['value']).indexOf(obj['value']) === pos;
            }).sort(function (a, b){
                return a.value - b.value;
            });
            if (aItem.length > 0) {
                session.privateConversationData.hotelRequest['min'+multiItems[i]] = aItem[0].value;
                session.privateConversationData.hotelRequest['max'+multiItems[i]] = aItem[aItem.length - 1].value
            }
        }
        for (var i = 0; i < searchItems.length; i++) {
            message = Utils.removeMatchedEntity(message, searchItems[i].startIndex, searchItems[i].endIndex).replace(/星|级/g,'#');;
            message = Utils.removeMatchedEntity(message, searchItems[i].startIndex, searchItems[i].endIndex).replace(/成人|儿童|小孩/g,'##');;
        }
        //************ Process search Item end */

        var childAge = global._builder.EntityRecognizer.findAllEntities(entities,'builtin.age');
        if (childAge != null && childAge.length > 0 && session.privateConversationData.hotelRequest.childNum > 0) {
            var ages = "";
            for (var i=0; i < childAge.length; i++) {
                if (i > 0) ages = ages + ',';
                ages += childAge[i].resolution['value'];
                message = Utils.removeMatchedEntity(message, childAge[i].startIndex, childAge[i].endIndex).replace(/岁/g,'#');
            }
            
            if (Utils.validAge(ages,session.privateConversationData.hotelRequest.childNum) == true) {
                session.privateConversationData.hotelRequest.childAge = ages;
             } 
        }

        //checkin/checkout by nights
        var nights = session.privateConversationData.hotelRequest.nights
        if (nights != null) {
            session.privateConversationData.hotelRequest.toDate = dateFormat(Utils.getDateFrom(session.privateConversationData.hotelRequest.fromDate, nights),"isoDate");
        }
        if (session.privateConversationData.hotelRequest.toDate == null || session.privateConversationData.hotelRequest.fromDate == null) {
            if (nights == null || isNaN(nights)) {
                nights = Utils.getNights(originalRequest.fromDate, originalRequest.toDate);
            }
            if (nights != null) {
                if (session.privateConversationData.hotelRequest.toDate == null && session.privateConversationData.hotelRequest.fromDate != null) {
                    session.privateConversationData.hotelRequest.toDate = dateFormat(Utils.getDateFrom(session.privateConversationData.hotelRequest.fromDate, nights),"isoDate");
                } else if (session.privateConversationData.hotelRequest.fromDate == null && session.privateConversationData.hotelRequest.toDate != null) {
                    session.privateConversationData.hotelRequest.fromDate = dateFormat(Utils.getDateFrom(session.privateConversationData.hotelRequest.toDate, (-1*nights),"isoDate"));
                }
            }
        }
        session.privateConversationData.hotelRequest.nights = null;

        var cityEntities = global._builder.EntityRecognizer.findAllEntities(entities, 'city');
        if (cityEntities.length > 1) {
            var desc = "";
            for (var i = 0; i < cityEntities.length; i++) {
                if (i == cityEntities.length - 1) desc = desc + " 还是 "
                else if (desc != "") desc = desc + ",";
                desc = desc + cityEntities[i].entity.replace(/\s/ig,'');
                message = Utils.removeMatchedEntity(message, cityEntities[i].startIndex, cityEntities[i].endIndex);
            }
            confilictItems.push({field: 'city', prompt: '您要去哪个城市？' + desc})
        } else if (cityEntities.length == 1) {
            session.privateConversationData.hotelRequest.cityCode = cityEntities[0].resolution.values[0];
            session.privateConversationData.hotelRequest.cityName = cityEntities[0].entity.replace(/\s/ig,'');;
            message = Utils.removeMatchedEntity(message, cityEntities[0].startIndex, cityEntities[0].endIndex);

            if (session.privateConversationData.hotelRequest.cityCode != originalRequest.cityCode && originalRequest.cityCode != null) {
                //reset hotel
                session.privateConversationData.hotelRequest.hotelEntity = null;
                session.privateConversationData.hotelRequest.hotelUuid = null;
                session.privateConversationData.hotelRequest.hotelName = null;
                session.privateConversationData.hotelRequest.preferredLocation = null;
                session.privateConversationData.hotelRequest.latitude = null;
                session.privateConversationData.hotelRequest.longitude = null;
            }
        }
       
        var indBreakfast = global._builder.EntityRecognizer.findEntity(entities, 'breakfastInd');
        if (indBreakfast != null) {
            var freeBreakfast = false;
            if (indBreakfast.resolution.values[0] == 'exBreakfast') {
                freeBreakfast = false;
            } else if (indBreakfast.resolution.values[0] == 'inBreakfast') {
                freeBreakfast = true;
            }
            session.privateConversationData.hotelRequest.freeBreakfast = freeBreakfast;
            message = Utils.removeMatchedEntity(message, indBreakfast.startIndex, indBreakfast.endIndex);
        }

        var placeEntity = global._builder.EntityRecognizer.findEntity(entities,'place');
        if (placeEntity != null) {
            session.privateConversationData.hotelRequest.preferredLocation = placeEntity.entity;
            inputText = Utils.removeMatchedEntity(inputText, placeEntity.startIndex, placeEntity.endIndex).replace(/附近/g,'##').replace(/靠近/g,'##');
        }

        var hotelEntity = global._builder.EntityRecognizer.findEntity(entities, 'hotelName');
        if (hotelEntity != null) {
            session.privateConversationData.hotelRequest.hotelUuid = hotelEntity.resolution.values[0];
            session.privateConversationData.hotelRequest.hotelName = hotelEntity.entity.replace(/\s/ig,'');
            message = Utils.removeMatchedEntity(message, hotelEntity.startIndex, hotelEntity.endIndex);
        }

        var bedTypeEntities = global._builder.EntityRecognizer.findAllEntities(entities,'bedType');
        var bedType = [];
        if (bedTypeEntities.length > 0) {
            for (var i = 0; i < bedTypeEntities.length; i++) {
                message = Utils.removeMatchedEntity(message, bedTypeEntities[i].startIndex, bedTypeEntities[i].endIndex).replace(/房/g,'#');;
                if (bedType.indexOf(bedTypeEntities[i].resolution.values[0] == -1)) {
                    bedType.push(bedTypeEntities[i].resolution.values[0]);
                }
            }
            session.privateConversationData.hotelRequest.bedType = bedType;
        }

        var budgets = Formatter.getBudgetItems(entities,message);
        if (budgets.length > 0) {
            session.privateConversationData.hotelRequest.budget = {min: budgets[0].value,max: budgets[budgets.length-1].value,currency: budgets[0].currency};

            for (var i = 0; i < budgets.length; i++) {
                message = Utils.removeMatchedEntity(message, budgets[i].startIndex, budgets[i].endIndex).replace(/预算/,'##');
            }
        }

        //breakfast
        var indBreakfast = global._builder.EntityRecognizer.findEntity(entities, 'breakfastInd');
        if (indBreakfast != null) {
            var freeBreakfast = false;
            if (indBreakfast.resolution.values[0] == 'exBreakfast') {
                freeBreakfast = false;
            } else if (indBreakfast.resolution.values[0] == 'inBreakfast') {
                freeBreakfast = true;
            }
            session.privateConversationData.hotelRequest.freeBreakfast = freeBreakfast;
            message = Utils.removeMatchedEntity(message, indBreakfast.startIndex, indBreakfast.endIndex);
        }

        var sortTypeEntity = global._builder.EntityRecognizer.findEntity(entities,'sortType');
        if (sortTypeEntity != null) {
            session.privateConversationData.hotelRequest.sortType = sortTypeEntity.resolution.values[0];
            // session.privateConversationData.hotelRequest.budget = 0
            // switch(session.privateConversationData.hotelRequest.sortType) {
            //     case 'PRICE_LOW':
            //         if (session.privateConversationData.hotelRequest.minStar == null) {
            //             session.privateConversationData.hotelRequest.minStar = 1;
            //         }
            //         break;
            //     case 'PRICE_HIGH':
            //         if (session.privateConversationData.hotelRequest.minStar == null) {
            //             session.privateConversationData.hotelRequest.minStar = 4;
            //         }
            //         break;
            // }
            message = Utils.removeMatchedEntity(message, sortTypeEntity.startIndex, sortTypeEntity.endIndex).replace(/最/g,'#');;
        }

        var finalText = Utils.escapeInput(message);
        if (session.privateConversationData.hotelRequest.hotelUuid == null && session.privateConversationData.hotelRequest.hotelName == null && finalText.length >= 2) {
            session.privateConversationData.hotelRequest.hotelName = finalText
        }
    },
    
}