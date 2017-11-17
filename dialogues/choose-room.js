var Hotel = require('../hotel-service');
var Utils = require('../utils/utils');

exports.chooseRoom = [
    function (session, args) {
        global._logger.log('info', 'ChooseRoom', session.privateConversationData.hotelRequest.hotelUuid);
        var dateOffSet = args == null || args.dateOffSet == null ? 0 : args.dateOffSet;
        var multiRequest = null;
        if (dateOffSet == 0) {
            var message = 'searching_hotel';
            var hotelUuid = session.privateConversationData.hotelRequest.hotelUuid;
            Hotel.sendHotelDetails(session, hotelUuid);
            multiRequest = Utils.buildMultiRoomRequest(session.privateConversationData.hotelRequest);
            session.send(message, session.privateConversationData.hotelRequest.hotelName, multiRequest.rooms, multiRequest.arrival, multiRequest.departure,
                multiRequest.roomGuests[0].adults, multiRequest.roomGuests[0].children);  
        } else if (Math.abs(dateOffSet) > 5) {
            session.send('对不起，前后五天都找不到合适房间，请选择其他酒店。');
            //TODO: choose another date
            session.privateConversationData.hotelRequest.hotelUuid = null;
            session.privateConversationData.hotelRequest.hotelName = null;
            session.privateConversationData.hotelRequest.minStar = null;
            session.privateConversationData.hotelRequest.maxStar = null;
            session.privateConversationData.hotelRequest.possibleHotelName = null;
            
        } else {
            var message = new global._builder.Message(session);
            var dstr;
            if (dateOffSet < 0) {
                dstr = '前' + parseInt(dateOffSet*-1)
            } else {
                dstr = '后' + parseInt(dateOffSet)
            }
            var rqstStr = JSON.stringify(session.privateConversationData.hotelRequest);
            var request = JSON.parse(rqstStr)
            request.fromDate = Utils.formatDate(Utils.getDateFrom(request.fromDate,dateOffSet));
            if (Utils.isAfterToday(request.fromDate)) {  //only search the date after today
                request.toDate = Utils.formatDate(Utils.getDateFrom(request.toDate,dateOffSet));
                multiRequest = Utils.buildMultiRoomRequest(request);
                message.text('为您查找%s天的空房情况. %s入住，%s退房',dstr,request.fromDate,request.toDate)
                session.send(message);
            }
        } 
        //calculate offset date
        if (dateOffSet == 0) session.dialogData.dateOffSet = 1;
        else if (dateOffSet > 0) session.dialogData.dateOffSet = parseInt(dateOffSet * -1)
        else session.dialogData.dateOffSet = parseInt(Math.abs(dateOffSet) + 1)
        
        if (session.privateConversationData.hotelRequest.hotelUuid == null) {
            //do nothing, jummp to askForHotel
            session.replaceDialog('askForHotel');
        } else if (multiRequest == null) {
            session.replaceDialog('chooseRoom',{dateOffSet: session.dialogData.dateOffSet});
        } else {
            session.dialogData.multiRequest = multiRequest;
            var nights = Utils.getNights(multiRequest.arrival, multiRequest.departure);
            session.sendTyping();
            Hotel.getRoomTypes(session.privateConversationData.hotelRequest.hotelUuid, multiRequest).catch(e => {
                global._logger.log('info','chooseRoom.getRoomTypes', e);
                //session.send("no_rooms_found")
            }).then(function (rooms, reject) {
                //optimze result
                global._logger.log('info','bedType-filtering','going to filtering the bedtype by '+ session.privateConversationData.hotelRequest.bedType);
                rooms = Utils.optimizeRoomsResult(session, rooms, multiRequest);
                global._logger.log("info","choose-room","rooms after optimize result -> " + JSON.stringify(rooms));
                var choice = {};
                for (var i=0; i < rooms.length && i<6; i++) {
                    var aRoom = rooms[i];
                    aRoom['rooms'] = multiRequest.rooms;
                    var breakfastStr = "不含早";
                    if (rooms[i].breakfast == true) {
                        breakfastStr = "含早";
                    } 
                    aRoom['breakfastStr'] = breakfastStr;
                    var freeCancelStr = "不可免费取消";
                    if (rooms[i].freeCancellation == true) {
                        freeCancelStr = "可免费取消";
                    }
                    choice[rooms[i].roomName + ' | 每晚每间价格从 **AUD ' +  Math.round(rooms[i].price/nights) + '**起 | ' + breakfastStr + ' | ' + freeCancelStr] = aRoom
                    console.log('you have these choice: ' + JSON.stringify(choice));
                }
                
                if (rooms.length >= 1) {
                    session.beginDialog('confirmRoom', {'choice': choice, 'multiRequest': multiRequest})
                    //global._builder.Prompts.choice(session, message, choice, global._builder.ListStyle.list);
                } else {
                    session.send('no_rooms_found');
                    session.replaceDialog('chooseRoom',{dateOffSet: session.dialogData.dateOffSet});
                }
            });
        }
    }
]

exports.confirmRoom = [
    function (session, args) {
        var choice = args.choice;
        var multiRequest = args.multiRequest;
        session.dialogData.multiRequest = args.multiRequest;
        session.dialogData.nights = Utils.getNights(multiRequest.arrival, multiRequest.departure);
        var message = 'rooms_found';
        session.dialogData.roomChoice = choice;
        global._builder.Prompts.choice(session, message, choice, global._builder.ListStyle.list);
    },
    function (session, results, next) {
        //get room details
        console.log("Choosed room no." + results.response);
        var choosedRoom = session.dialogData.roomChoice[results.response.entity];
        session.dialogData.choosedRoom = choosedRoom;
        var optionRates = {};
        for (var i=0; i < choosedRoom.rateInfo.length; i ++) {
            //var aRate = {};
            //aRate = choosedRoom.allRates[i];
           
            var desString = "";
            if (choosedRoom.rateInfo[i].freeCancellation == true) {
                desString += "在" + choosedRoom.rateInfo[i].deadLine + '之前可免费取消';
            } else {
                desString += "不可退款";
            }
            if (choosedRoom.rateInfo[i].mealsPlan.breakfast == true) {
                desString += ", " + "含早餐"
            } else {
                desString += ", " + "不含早餐"
            }
            if (choosedRoom.rateInfo[i].optionalMealsPlan != null && choosedRoom.rateInfo[i].optionalMealsPlan.length > 0) {
                desString += "(可选附加早餐每人份AUD" + choosedRoom.rateInfo[i].optionalMealsPlan[0].adultBreakfastPrice + "，儿童每份AUD" +  choosedRoom.rateInfo[i].optionalMealsPlan[0].childBreakfastPrice+")"
            }

            if (choosedRoom.rateInfo[i].onRequest == true) {
                desString += "， " + "需要与Cozitrip确认"
            } else {
                desString += "， " + "立即确认"
            }

            
            //freeCan += ", " + choosedRoom.rateInfo[i].mealsPlan.description;
            var choosedRoomRate = {
                'roomName':choosedRoom.roomName,
                'price': Math.round(choosedRoom.rateInfo[i].chargeableRate.total),
                'freeCancel': choosedRoom.rateInfo[i].freeCancellation,
                'breakfast': choosedRoom.rateInfo[i].mealsPlan.breakfast,
                'roomBookingInfoUuid': choosedRoom.rateInfo[i].roomBookingInfo.roomBookingUuid,
                'rooms':choosedRoom.rooms,
                'roomDescription':choosedRoom.roomDescription,
                'deadline': choosedRoom.rateInfo[i].deadLine,
                'facility': choosedRoom.facility,
                'roomSize': choosedRoom.roomSize,
                'occupancyDesc': choosedRoom.occupancyDesc,
                'bedTypeDesc': choosedRoom.bedTypeDesc,
                'onRequest': choosedRoom.rateInfo[i].onRequest,
                'optionalMealsPlan': choosedRoom.rateInfo[i].optionalMealsPlan
            };
            var totalPrice = choosedRoomRate.price * choosedRoom.rooms;
            optionRates['每晚每间价格 ' + Math.round(choosedRoomRate.price/session.dialogData.nights) + 'AUD, 总价 **AUD ' + totalPrice + '**, ' + desString] = choosedRoomRate;
        }
        if (choosedRoom.rateInfo.length > 1) {
            var message = "您选择了房间 " + choosedRoom.roomName
            message += "<br>**" + session.dialogData.multiRequest.arrival + "入住，" + session.dialogData.multiRequest.departure + "退房**"
            if (choosedRoom.roomDescription) {
                message += "<br>" + choosedRoom.roomDescription;
            }
            if(choosedRoom.facility) {
                message +=  "<br>" + choosedRoom.facility
            }
            message += "<br>" + "请选择您想要预订的价格"
            optionRates['选择其他房型看看'] = 'None'
            session.dialogData.optionalRate = optionRates;
            global._builder.Prompts.choice(session,message, optionRates, global._builder.ListStyle.list)
        } else {
            session.dialogData.choosedRoom = choosedRoomRate;
            next ({response: true});
        }
    },
    function (session, results) {
        var choosedRoom = session.dialogData.choosedRoom;
        if (results.response != true) {
            choosedRoom = session.dialogData.optionalRate[results.response.entity];
        }
        if (choosedRoom == 'None') {
            session.replaceDialog('confirmRoom', {'choice': session.dialogData.roomChoice, 'multiRequest': session.dialogData.multiRequest});
        } else {
            //var choosedRoom = session.dialogData.choosedRoom;
            var totalPrice = choosedRoom.price * choosedRoom.rooms;
            var message = "您选择了 " + choosedRoom.roomName;
            message += "<br>**" + session.dialogData.multiRequest.arrival + "入住，" + session.dialogData.multiRequest.departure + "退房**"
            if (choosedRoom.roomDescription) {
                message += "<br>" + choosedRoom.roomDescription;
            }
            
            if (choosedRoom.occupancyDesc) {
                message += "<br>" + '* ' + choosedRoom.occupancyDesc
            }
            if (choosedRoom.roomSize) {
                message += "<br>" + '* ' + choosedRoom.roomSize.replace(/<br>/g, '')
            }
            if (choosedRoom.bedTypeDesc) {
                message += "<br>" + '* ' + choosedRoom.bedTypeDesc
            }
            
            if (session.dialogData.nights > 1) {
                message += "<br>每晚每间价格AUD：" + Math.round(choosedRoom.price/session.dialogData.nights);
            }
            
            message += "<br>"+session.dialogData.nights+"晚每间价格AUD：" + choosedRoom.price + '<br>'+choosedRoom.rooms+'间房总价 **AUD ' + totalPrice+'**';
            if (choosedRoom.freeCancel == true) {
                message += '<br>' + "在" + choosedRoom.deadline + '之前可免费取消';
            } else {
                message += '<br>' + "不可退款";
            }
            if (choosedRoom.breakfast == true) {
                message += ", " + "含早餐"
            } else {
                message += ", " + "不含早餐"
            }
            if (choosedRoom.optionalMealsPlan != null && choosedRoom.optionalMealsPlan.length > 0) {
                message += "（可选附加早餐每人份AUD" + choosedRoom.optionalMealsPlan[0].adultBreakfastPrice + "，儿童每份AUD" +  choosedRoom.optionalMealsPlan[0].childBreakfastPrice+")"
            }
            if (choosedRoom.onRequest == true) {
                message += "<br>" + "需要与Cozitrip确认"
            } else {
                message += "<br>" + "立即确认"
            }
            
            message += '<br>' + "确定吗？";

            session.dialogData.confirmedRoom = choosedRoom;
            session.dialogData.confirmedRoom.confirmedPrice = totalPrice;
            global._builder.Prompts.confirm(session, message);
        }

       
    },
    function (session, results) {
         if (results.response == true) {
             //start booking
             session.privateConversationData.hotelRequest.fromDate = session.dialogData.multiRequest.arrival
             session.privateConversationData.hotelRequest.toDate = session.dialogData.multiRequest.departure
             session.beginDialog('book',{'confirmedRoom': session.dialogData.confirmedRoom});
             //session.endDialogWithResult({'response': session.dialogData.confirmedRoom});
         } else {
             //this.buildRoomOption(session.dialogData.roomChoice, null);   
             var message = "请重新选择:"
             //global._builder.Prompts.choice(session, message, session.dialogData.roomChoice, global._builder.ListStyle.list);
             session.replaceDialog('confirmRoom', {'choice': session.dialogData.roomChoice, 'multiRequest': session.dialogData.multiRequest})
         }
     }
]

