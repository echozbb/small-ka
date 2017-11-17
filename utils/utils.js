var dateFormat = require('dateformat');
var _this = this;
const BED_TYPE_EXP = {
    "TWIN_Exp": "twin|\u53CC\u5E8A|\u4E24\u5F20\u5E8A|\u4E24\u4E2A\u5E8A|2\u4E2A\u5355\u4EBA\u5E8A|\u4E24\u5F20\u5355\u4EBA\u5E8A|\u4E24\u5F20\u5355\u4EBA\u5E8A|2 single|family|Apartment|\u516C\u5BD3|\u53CC\u5367|2\u5F20\u5355\u4EBA\u5E8A",
    "DOUBLE_Exp": "double|double|\u53CC\u4EBA\u5E8A|\u5927\u5E8A|king|queen|\u4E00\u5F20\u5927\u5E8A|family|Apartment|\u516C\u5BD3|\u53CC\u5367",
    //sample of exclude: 'twin'.match(/^((?!hede|room|twin).)*$/i)
    "NONTWIN_Exp": "^((?!twin|\u53CC\u5E8A|\u4E24\u5F20\u5E8A|\u4E24\u4E2A\u5E8A|2\u4E2A\u5355\u4EBA\u5E8A|\u4E24\u5F20\u5355\u4EBA\u5E8A|\u4E24\u5F20\u5355\u4EBA\u5E8A|2 single).)*$"
}


module.exports = {

    convertDateFromStr: function (dateStr) {
        if(dateStr == null) {
            return null;
        }
        for (var i = 0; i < dateStr.length; i++) { // Lazy dumb way to overcome a lack of replaceAll function in JS
            dateStr = dateStr.replace('/', '-');
            dateStr = dateStr.replace('.', '-');
            dateStr = dateStr.replace('。', '-');
            dateStr = dateStr.replace(' ', '');
        }
        var splitDates = dateStr.split('-');
        if (splitDates.length == 2) {
            splitDates.unshift(new Date().getFullYear().toString());
        } else if (splitDates.length < 2 || splitDates.length > 3) {
            return null;
        }
        var year = splitDates[0].length == 4 ? splitDates[0] : '20' + splitDates[0];
        var month = splitDates[1].length == 2? splitDates[1] : '0' + splitDates[1];
        var day = splitDates[2].length == 2? splitDates[2] : '0' + splitDates[2];
        try {
            var date = new Date(year + "-" + month + "-" + day);
            if (this.isBefore(date,new Date())) {
                //shift to next year
                date.setFullYear(parseInt(year) + 1)
            }
    
            if(isNaN(date.getTime())) {
                return null;
            }
            return date;
        } catch(e) {
            return null;
        }
    },


    getNights: function(checkin, checkout) {
        if (checkin == null || checkout == null) return null;
        var from = new Date(checkin);
        var to = new Date(checkout);
        var timeDiff = Math.abs(to.getTime() - from.getTime());
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
        return diffDays;
    },

    // extractCheckinCheckoutDate: function (builder, entities) {
    //     var checkinout = {};
    //     var fromDate = builder.EntityRecognizer.findEntity(entities, 'date::fromDate');
    //     var toDate = builder.EntityRecognizer.findEntity(entities, 'date::toDate');
    //     var dateRange = builder.EntityRecognizer.findEntity(entities, 'builtin.datetimeV2.daterange');

    //     var checkin = fromDate == null ? null : this.convertDateFromStr(fromDate.entity);
    //     var checkout = toDate == null? null : this.convertDateFromStr(toDate.entity);
    //     if (fromDate == null && toDate == null) {
    //         return null;
    //     }

    //     var fromStartIndex = -1;
    //     var toEndIndex = -1;
    //     if (fromDate != null && checkin == null) {
    //         //not extract to correct format
    //         fromStartIndex = fromDate.startIndex
    //     } else if (checkin != null) {
    //         checkinout.checkin = checkin;
    //         checkinout.startIndex = fromDate.startIndex
    //         fromStartIndex = fromDate.startIndex
    //     }
    //     if (toDate != null && checkout == null) {
    //         toEndIndex = toDate.endIndex
    //     } else if (checkout != null){
    //         checkinout.checkout = checkout;
    //         checkinout.endIndex = toDate.endIndex
    //         toEndIndex = toDate.endIndex;
    //     } 

    //     if(checkinout.startIndex != null && checkinout.endIndex == null) {
    //         checkinout.endIndex = fromDate.endIndex
    //     }
    //     if (checkinout.startIndex  == null && checkinout.endIndex!= null) {
    //         checkinout.startIndex = toDate.startIndex
    //     }

    //     if (fromStartIndex!=-1 || toEndIndex!=-1) {
    //         if (dateRange != null && (dateRange.startIndex == fromStartIndex || dateRange.endIndex == toEndIndex)) {
    //             for (var i=0; i< dateRange.resolution.values.length; i++ ){
    //                 var start = this.convertDateFromStr(dateRange.resolution.values[i].start);
    //                 if (this.isAfterToday(start)){
    //                     checkinout.checkin = start;
    //                     checkinout.checkout = this.convertDateFromStr(dateRange.resolution.values[i].end)
    //                     checkinout.startIndex = dateRange.startIndex
    //                     checkinout.endIndex = dateRange.endIndex
    //                     break;
    //                 }
    //             }
    //         } else {
    //             //only input check-in
    //             var dateFromEntities = builder.EntityRecognizer.findAllEntities(entities, 'builtin.datetimeV2.date');
    //             var dateImEntities = builder.EntityRecognizer.findAllEntities(entities, 'builtin.datetimeV2.datetimerange');
    //             if (dateFromEntities == null) dateFromEntities = []
    //             Array.prototype.push.apply(dateFromEntities,dateImEntities)

    //             if (dateFromEntities != null && dateFromEntities.length > 0) {
    //                 for (var j=0; j<dateFromEntities.length; j++) {
    //                     var dateFromEntity = dateFromEntities[j];
    //                     //checkin
    //                     if (dateFromEntity.startIndex == fromStartIndex) {
    //                         for (var i=0; i < dateFromEntity.resolution.values.length; i++) {
    //                             var value = dateFromEntity.resolution.values[i].value == null ? dateFromEntity.resolution.values[i].start : dateFromEntity.resolution.values[i].value;
    //                             var start = this.formatDate(value)
    //                             if (this.isAfterToday(start)) {
    //                                 checkinout.checkin = start;
    //                                 checkinout.startIndex = dateFromEntity.startIndex
    //                                 checkinout.endIndex = dateFromEntity.endIndex
    //                                 break;
    //                             }
    //                         }
    //                     }
    //                     //checkout
    //                     if (dateFromEntity.endIndex == toEndIndex) {
    //                         for (var i=0; i < dateFromEntity.resolution.values.length; i++) {
    //                             var value = dateFromEntity.resolution.values[i].value == null ? dateFromEntity.resolution.values[i].start : dateFromEntity.resolution.values[i].value;
    //                             var start = this.formatDate(value)
    //                             if (this.isAfterToday(start)) {
    //                                 checkinout.checkout = start;
    //                                 if (checkinout.startIndex == null) checkinout.startIndex = dateFromEntity.startIndex
    //                                 checkinout.endIndex = dateFromEntity.endIndex
    //                                 break;
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
                
    //         }
    //     } 
    //     // checkinout.startIndex = fromStartIndex;
    //     // checkinout.endIndex = toEndIndex;
    //     return checkinout;
    // },

    formatDate: function (inputDT) {
        return dateFormat(inputDT, 'isoDate');
    },

    // validateCheckinCheckout: function (checkin, checkout) {
    //     var isValid = false;
    //     var msg = "";
    //     if (checkin != null && checkout != null) {
    //         if (this.isAfterToday(checkin) && this.isAfterToday(checkout)) {
    //             if (this.isBefore(checkin, checkout)) {
    //                 isValid = true;
    //             } else {
    //                 msg = "checkin_after_checkout";
    //                 //session.send("checkin_after_checkout");
    //             }
    //         } else {
    //             msg = "checkin_before_today"
    //             //session.send("checkin_before_today", session.dialogData.checkinDate);
    //         }
    //     }
    //     return {'isValid': isValid, 'msg': msg};
    // },
    isBefore: function(checkin, checkout) {
        var checkinDate = new Date(checkin);
        checkinDate.setHours(0,0,0,0);
    
        var checkoutDate = new Date(checkout);
        checkoutDate.setHours(0,0,0,0);
        if (checkinDate < checkoutDate) {
            return true;
        } else {
            return false;
        }
    },

    isAfterToday: function(inputDT) {
        var today = new Date(); 
        var checkinDate = new Date(inputDT);
        checkinDate.setHours(0,0,0,0);
        today.setHours(0,0,0,0); // No need to compare hours/min/sec
        if (checkinDate < today) {
            return false;
        } else {
            return true;
        }
    },

    getDateFrom: function (fromDate, nights) {
        if (isNaN(nights) || fromDate == null) {
            return null;
        }
        var checkinDate = new Date(fromDate);
        return new Date(checkinDate.getTime() + parseInt(nights)*24*60*60*1000);
    },

    removeMatchedEntity: function (text, start, end) {
        if (text == null || text.length < end || start == -1 || end == -1) {
            return text;
        }
        var replacement = "";
        while (replacement.length < (end - start + 1)) {
            replacement+="#";
        }

        return text.substr(0,start) + replacement + text.substr(end + 1, text.length);
    },

    findValueOfNumberEntity: function (numberEntities, targetEntity) {
        if (numberEntities == null || numberEntities.length == 0) return null;

        for (var i=0; i< numberEntities.length; i++) {
            if (numberEntities[i].startIndex == targetEntity.startIndex && numberEntities[i].endIndex == targetEntity.endIndex) {
                return numberEntities[i].resolution.value;
            }
        }
        return null;
    },

    findValueOfNumberByStartIndex: function (numberEntities, startIndex) {
        if (numberEntities == null || numberEntities.length == 0) return null;
        for (var i=0; i< numberEntities.length; i++) {
            if (numberEntities[i].startIndex == startIndex) {
                return numberEntities[i].resolution.value;
            }
        }
        return null;
    },

    // updateEntities: function (builder, entities, session) {
    //     global._logger.log('info', 'updateEntities', entities);
    //     var cityEntity = builder.EntityRecognizer.findEntity(entities, 'city');
    //     var checkinout = this.extractCheckinCheckoutDate(builder, entities);
    //     var changeItem = builder.EntityRecognizer.findAllEntities(entities, 'ChangingItem');
    //     var fromStarEntity = builder.EntityRecognizer.findEntity(entities,'star::fromStar');
    //     var toStarEntity = builder.EntityRecognizer.findEntity(entities,'star::toStar');
    //     var buildInNumbers = builder.EntityRecognizer.findAllEntities(entities,'builtin.number');
    //     var inputText = session.message.text;

    //     //var roomNum = builder.EntityRecognizer.findEntity(entities, 'roomNum');
    //     var roomNumEntity = builder.EntityRecognizer.findAllEntities(entities, 'roomNum');
    //     var hotelEntity = builder.EntityRecognizer.findEntity(entities, 'hotelName');
    //     var indBreakfast = builder.EntityRecognizer.findEntity(entities, 'breakfastInd');
    //     var adultNumEntity = builder.EntityRecognizer.findEntity(entities, 'adultNum');
    //     var childNumEntity = builder.EntityRecognizer.findEntity(entities, 'childNum');
    //     var nights = builder.EntityRecognizer.findEntity(entities,'nightNum');
    //     var childAge = builder.EntityRecognizer.findAllEntities(entities,'builtin.age');
    //     var placeEntity = builder.EntityRecognizer.findEntity(entities,'place');
    //     var sortTypeEntity = builder.EntityRecognizer.findEntity(entities,'sortType');
    //     //var doubleBedEntity = builder.EntityRecognizer.findEntity(entities,'doubleBed');
    //     //var twinBedEntity = builder.EntityRecognizer.findEntity(entities,'twinBed');
    //     var bedTypeEntity = builder.EntityRecognizer.findEntity(entities,'bedType');
    //     var budgetEntity = builder.EntityRecognizer.findEntity(entities,'budget');

    //     if (session.privateConversationData.hotelRequest == null ) session.privateConversationData.hotelRequest = {};

    //     var missingItem = []
    //     var confilictItems = []
    //     if (changeItem != null && changeItem.length > 0) {
    //         for (var i=0; i < changeItem.length; i ++) {
    //             var item = changeItem[i].resolution.values[0];
    //             inputText = this.removeMatchedEntity(inputText, changeItem[i].startIndex, changeItem[i].endIndex);
    //             if (missingItem.indexOf(item) < 0) {
    //                 if (item == 'DATE' && checkinout == null) {
    //                     missingItem.push({field:item, text:'入住及退房时间'});
    //                 } 
    //                 if (item == 'CITY' && cityEntity == null) {
    //                     missingItem.push({field:item, text: '城市'});
    //                 }
    //                 if (item == 'HOTEL' && hotelEntity == null && placeEntity == null) {
    //                     missingItem.push({field:item, text: '酒店'});
    //                 }

    //             }
    //         }
    //     }

    //     var updatedItems = []
    //     if (cityEntity != null) {
    //         inputText = this.removeMatchedEntity(inputText, cityEntity.startIndex, cityEntity.endIndex);
    //         var orignalCityCode = session.privateConversationData.hotelRequest.cityEntity == null ? session.privateConversationData.hotelRequest.cityCode : session.privateConversationData.hotelRequest.cityEntity.resolution.values[0];
    //         session.privateConversationData.hotelRequest.cityEntity = cityEntity;
    //         if(orignalCityCode != cityEntity.resolution.values[0]) {
    //             //remove hotel and city infomation
    //             session.privateConversationData.hotelRequest.cityCode = cityEntity.resolution.values[0];
    //             session.privateConversationData.hotelRequest.hotelUuid = null;
    //             session.privateConversationData.hotelRequest.hotelName = null;
    //             session.privateConversationData.hotelRequest.latitude = null;
    //             session.privateConversationData.hotelRequest.longitude = null;
    //             session.privateConversationData.hotelRequest.preferredLocation = null;
    //             updatedItems.push({field:'为您定位到',text: cityEntity.entity});
    //         }
    //     }

    //     if (placeEntity != null) {
    //         inputText = this.removeMatchedEntity(inputText, placeEntity.startIndex, placeEntity.endIndex).replace(/附近/g,'').replace(/靠近/g,'');
    //         session.privateConversationData.hotelRequest.preferredLocation = placeEntity.entity;
    //     }

    //     if (budgetEntity != null) {
    //         inputText = this.removeMatchedEntity(inputText, budgetEntity.startIndex, budgetEntity.endIndex).replace(/刀/g,'').replace(/澳币/g,'').replace(/价格/g,'').replace(/大概/g,'');
    //         if (isNaN(this.translateChineseNumber(budgetEntity.entity))) {
    //             session.privateConversationData.hotelRequest.budget = this.findValueOfNumberEntity(buildInNumbers,budgetEntity);
    //         } else {
    //             session.privateConversationData.hotelRequest.budget = this.translateChineseNumber(budgetEntity.entity);
    //         }
    //     }

    //     // if (doubleBedEntity != null) {
    //     //     inputText = this.removeMatchedEntity(inputText, doubleBedEntity.startIndex, doubleBedEntity.endIndex);
    //     //     session.privateConversationData.hotelRequest.bedType = 'DOUBLE'
    //     // }
    //     // if (twinBedEntity != null) {
    //     //     inputText = this.removeMatchedEntity(inputText, twinBedEntity.startIndex, twinBedEntity.endIndex);
    //     //     session.privateConversationData.hotelRequest.bedType = 'TWIN'
    //     // }
    //     if (bedTypeEntity != null && bedTypeEntity.resolution != null && bedTypeEntity.resolution.values != null && bedTypeEntity.resolution.values.length > 0) {
    //         inputText = this.removeMatchedEntity(inputText, bedTypeEntity.startIndex, bedTypeEntity.endIndex)
    //         if (session.privateConversationData.hotelRequest.bedType != null && session.privateConversationData.hotelRequest.bedType != bedTypeEntity.resolution.values[0]) {
    //             var str = bedTypeEntity.resolution.values[0] == 'TWIN' ? "双床房" : "大床房"
    //             updatedItems.push({field:'床型调整为', text: str})
    //         }
    //         session.privateConversationData.hotelRequest.bedType = bedTypeEntity.resolution.values[0];
    //     }

    //     if (fromStarEntity != null) {
    //         inputText = this.removeMatchedEntity(inputText, fromStarEntity.startIndex, fromStarEntity.endIndex);
    //         var minStar;
    //         if (isNaN(this.translateChineseNumber(fromStarEntity.entity))) {
    //             minStar = this.findValueOfNumberEntity(buildInNumbers,fromStarEntity);
    //         } else {
    //             minStar = this.translateChineseNumber(fromStarEntity.entity);
    //         }
    //         if (session.privateConversationData.hotelRequest.minStar != null && session.privateConversationData.hotelRequest.minStar != minStar) {
    //             updatedItems.push({field:'星级调整为', text: minStar + '星级'});
    //             session.privateConversationData.hotelRequest.hotelUuid = null;
    //             session.privateConversationData.hotelRequest.hotelName = null;
    //         }
    //        session.privateConversationData.hotelRequest.minStar = minStar
    //        if (session.privateConversationData.hotelRequest.maxStar <= minStar) {
    //         session.privateConversationData.hotelRequest.maxStar = null;
    //        }
    //     }
    //     if (toStarEntity != null) {
    //         inputText = this.removeMatchedEntity(inputText, toStarEntity.startIndex, toStarEntity.endIndex);
    //         var maxStar;
    //         if (isNaN(this.translateChineseNumber(toStarEntity.entity))) {
    //             maxStar = this.findValueOfNumberEntity(buildInNumbers,toStarEntity);
    //         } else {
    //             maxStar = this.translateChineseNumber(toStarEntity.entity);
    //         }
    //         session.privateConversationData.hotelRequest.maxStar = maxStar
    //         if (session.privateConversationData.hotelRequest.minStar == null) {
    //             session.privateConversationData.hotelRequest.minStar = maxStar;
    //         }
    //     }

    //     var nightNum = null;
    //     if (nights != null) {
    //         inputText = this.removeMatchedEntity(inputText, nights.startIndex, nights.endIndex).replace(/晚/g,'');
    //         nightNum = this.translateChineseNumber(nights.entity);
    //         if (isNaN(nights.entity)){
    //             //get nigths by index
    //             nightNum = this.findValueOfNumberEntity(buildInNumbers,nights);
    //         } 
    //     }

    //     if (checkinout != null && (checkinout.checkin != null || checkinout.checkout != null)) {
    //         inputText = this.removeMatchedEntity(inputText, checkinout.startIndex, checkinout.endIndex).replace(/入住/g,'').replace(/退房/g,'');
    //         //get original nights
    //         var originalCheckin = session.privateConversationData.hotelRequest.fromDate;
    //         var orignalCheckout = session.privateConversationData.hotelRequest.toDate;
    //         var originalNights = nightNum == null ? this.getNights(originalCheckin, orignalCheckout) : nightNum;

    //         if (originalCheckin != null && checkinout.checkin != null && originalCheckin != checkinout.checkin) {
    //             updatedItems.push({field:"新的入住时间为", text: this.formatDate(checkinout.checkin)})
    //         }
    //         if (orignalCheckout != null && checkinout.checkout && orignalCheckout != checkinout.checkout) {
    //             updatedItems.push({field:"新的退房时间为", text: this.formatDate(checkinout.checkout)})
    //         }

    //         //checkout missing, fill checkout date
    //         if (originalCheckin != null && orignalCheckout == null && checkinout.checkin != null && checkinout.checkout == null) {
    //             session.privateConversationData.hotelRequest.toDate = checkinout.checkin;
    //         } else {
    //             if (checkinout.checkout != null) session.privateConversationData.hotelRequest.toDate = checkinout.checkout;
    //             if (checkinout.checkin != null)  session.privateConversationData.hotelRequest.fromDate = checkinout.checkin;
    //             if (session.privateConversationData.hotelRequest.toDate == null && originalNights != null) {
    //                 //calculate checkout
    //                 var nns = nightNum == null ? originalNights : nightNum;
    //                 if(nns != null) session.privateConversationData.hotelRequest.toDate = this.getDateFrom(checkinout.checkin, nns);
    //             }
    //         }
    //     }

    //     if (session.privateConversationData.hotelRequest.toDate == null && nightNum != null && session.privateConversationData.hotelRequest.fromDate != null) {
    //         session.privateConversationData.hotelRequest.toDate = this.getDateFrom(session.privateConversationData.hotelRequest.fromDate, nightNum);
    //     }

    //     if (roomNumEntity != null && roomNumEntity.length > 0) {
    //         var options = [];
    //         for (var i=0; i < roomNumEntity.length; i ++) {
    //             roomNum = roomNumEntity[i];
    //             if (roomNum != null && roomNum.resolution != null) {
    //                 inputText = this.removeMatchedEntity(inputText, roomNum.startIndex, roomNum.endIndex);
    //                 roomNum = roomNum.resolution.value;
    //             } else if (roomNum) {
    //                 inputText = this.removeMatchedEntity(inputText, roomNum.startIndex, roomNum.endIndex);
    //                 if (isNaN(this.translateChineseNumber(roomNum.entity))) {
    //                     roomNum = this.findValueOfNumberEntity(buildInNumbers,roomNum);
    //                 } else {
    //                     roomNum = this.translateChineseNumber(roomNum.entity)
    //                 }
    //             }
    //             if (session.privateConversationData.hotelRequest.rooms != null && session.privateConversationData.hotelRequest.rooms != roomNum) {
    //                 updatedItems.push({field: "更新房间数量为", text: roomNum});
    //             }
                
    //             if (options.indexOf(roomNum) < 0) {
    //                 options.push(roomNum);

    //             } 
    //         }
    //         if (options.length > 1) {
    //             confilictItems.push({msg: '请选择房间数量', options: options, field: 'rooms'})
    //         } else {
    //             session.privateConversationData.hotelRequest.rooms = options[0]
    //         }


    //         // if (roomNumEntity.length > 1) {
    //         //     confilictItems.push({msg: '请选择房间数量', options: [oldRequest.rooms,newRequest.rooms], field: 'roomNum'})
    //         // } else {
    //         //     if (roomNum != null && roomNum.resolution != null) {
    //         //         inputText = this.removeMatchedEntity(inputText, roomNum.startIndex, roomNum.endIndex);
    //         //         roomNum = roomNum.resolution.value;
    //         //     } else if (roomNum) {
    //         //         inputText = this.removeMatchedEntity(inputText, roomNum.startIndex, roomNum.endIndex);
    //         //         if (isNaN(this.translateChineseNumber(roomNum.entity))) {
    //         //             roomNum = this.findValueOfNumberEntity(buildInNumbers,roomNum);
    //         //         } else {
    //         //             roomNum = this.translateChineseNumber(roomNum.entity)
    //         //         }
    //         //     }
    //         //     if (session.privateConversationData.hotelRequest.rooms != null && session.privateConversationData.hotelRequest.rooms != roomNum) {
    //         //         updatedItems.push({field: "更新房间数量为", text: roomNum});
    //         //     }
    //         //     session.privateConversationData.hotelRequest.rooms = roomNum;
    //         // }
            
    //     }

    //     if (adultNumEntity != null) {
    //         var adultNum = null;
    //         inputText = this.removeMatchedEntity(inputText, adultNumEntity.startIndex, adultNumEntity.endIndex).replace(/成人/g,'').replace(/人/g,'').replace(/位/g,'');
    //         if (isNaN(this.translateChineseNumber(adultNumEntity.entity))) {
    //             adultNum = this.findValueOfNumberEntity(buildInNumbers,adultNumEntity);
    //         } else {
    //             adultNum = this.translateChineseNumber(adultNumEntity.entity);
    //         }
    //         if (session.privateConversationData.hotelRequest.adultNum != null && session.privateConversationData.hotelRequest.adultNum != adultNum) {
    //             updatedItems.push({field: "更新每间房入住人数为", text: adultNum});
    //         }
    //         if (adultNum != null && !isNaN(adultNum)){
    //             session.privateConversationData.hotelRequest.adultNum = adultNum
    //         }
           
    //         //session.privateConversationData.hotelRequest.adultPerRoom = adultNum;
            
    //         // if (session.privateConversationData.hotelRequest.rooms != null) {
    //         //     adultNum = session.privateConversationData.hotelRequest.adultPerRoom * session.privateConversationData.hotelRequest.rooms;
    //         //     if (adultNum != null && adultNum > 0) {
    //         //         session.privateConversationData.hotelRequest.adultNum = adultNum;
    //         //     }
    //         // }
    //         //if (session.privateConversationData.hotelRequest.adultNum == null) session.privateConversationData.hotelRequest.adultNum = session.privateConversationData.hotelRequest.adultPerRoom;
    //     }
    //     if (childNumEntity != null) {
    //         var childNum = null;
    //         inputText = this.removeMatchedEntity(inputText, childNumEntity.startIndex, childNumEntity.endIndex);
    //         if (isNaN(this.translateChineseNumber(childNumEntity.entity))) {
    //             childNum = this.findValueOfNumberEntity(buildInNumbers,childNumEntity);
    //         } else {
    //             childNum = this.translateChineseNumber(childNumEntity.entity)
    //         }
    //         if (session.privateConversationData.hotelRequest.childNum != null && session.privateConversationData.hotelRequest.childNum != childNum) {
    //             updatedItems.push({field: "更新入住儿童人数位", text: childNum});
    //         }
    //         if (childNum != null && !isNaN(childNum)){
    //             session.privateConversationData.hotelRequest.childNum = childNum;
    //         }
           
    //     }

    //     if (childAge != null && childAge.length > 0 && session.privateConversationData.hotelRequest.childNum > 0) {
    //         inputText = this.removeMatchedEntity(inputText, childAge.startIndex, childAge.endIndex).replace(/岁/g,'');
    //         var ages = "";
    //         for (var i=0; i < childAge.length; i++) {
    //             if (i > 0) ages =+ ',';
    //             ages += childAge[i].resolution['value'];
    //         }
            
    //         if (this.validAge(ages,session.privateConversationData.hotelRequest.childNum) == true) {
    //             session.privateConversationData.hotelRequest.childAge = ages;
    //          } 
    //     }

    //     if (hotelEntity != null) {
    //         session.privateConversationData.hotelRequest.hotelUuid = hotelEntity.resolution.values[0];
    //         session.privateConversationData.hotelRequest.hotelName = hotelEntity.entity;
    //         inputText = this.removeMatchedEntity(inputText, hotelEntity.startIndex, hotelEntity.endIndex);
    //     }
    //     if (indBreakfast != null) {
    //         var freeBreakfast = false;
    //         if (indBreakfast.resolution.values[0] == 'exBreakfast') {
    //             freeBreakfast = false;
    //         } else if (indBreakfast.resolution.values[0] == 'inBreakfast') {
    //             freeBreakfast = true;
    //         }
    //         session.privateConversationData.hotelRequest.freeBreakfast = freeBreakfast;
    //         inputText = this.removeMatchedEntity(inputText, indBreakfast.startIndex, indBreakfast.endIndex);
    //     }
        
    //     if (sortTypeEntity != null) {
    //         inputText = this.removeMatchedEntity(inputText, sortTypeEntity.startIndex, sortTypeEntity.endIndex).replace(/最/g,'');;
    //         session.privateConversationData.hotelRequest.sortType = sortTypeEntity.resolution.values[0];
    //         switch(session.privateConversationData.hotelRequest.sortType) {
    //             case 'PRICE_LOW':
    //                 if (session.privateConversationData.hotelRequest.minStar == null) {
    //                     session.privateConversationData.hotelRequest.minStar = 3;
    //                 }
    //                 break;
    //             case 'PRICE_HIGH':
    //                 if (session.privateConversationData.hotelRequest.minStar == null) {
    //                     session.privateConversationData.hotelRequest.minStar = 4;
    //                 }
    //                 break;
    //         }
            
    //     }

    //     //var finalText = inputText.replace(/#/g,'').replace(/,/g,'').replace(/，/g,'').replace(/晚/g,'').trim();
    //     var finalText = this.escapeInput(inputText);
    //     return {'missingItems':missingItem, 'updatedItems': updatedItems, 'unMatched': finalText,'confilictItems': confilictItems};

    // },


    escapeInput: function (text) {
        var finalText = text.replace(/#/g,'').replace(/,/g,'').replace(/，/g,'')
            .replace(/[小|大|日|星级|位|间|入住|退房|房|0-9]/ig,'').replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
        return finalText;
    },

    translateChineseNumber: function (input) {
        if (input == null) return input;
        return input.replace(/一/g,'1').replace(/二/g,'2').replace(/两/g,'2').replace(/三/g,'3').replace(/四/g,'4').replace(/五/g,'5').replace(/六/g,'6').replace(/七/g,'7').replace(/八/g,'8')
        .replace(/九/g,'9').replace(/十/g,'10').replace(/单/g,'1');
    },

    getAdultNumByRoomType: function (roomType) {
        if (roomType == 'STD') {
            return 2;
        } else if (roomType == 'SGL') {
            return 1;
        } else {
            return 0;
        }
    },
    removeDuplicates: function (arr, key) {
        if (!(arr instanceof Array) || key && typeof key !== 'string') {
            return false;
        }

        if (key && typeof key === 'string') {
            return arr.filter((obj, index, arr) => {
                return arr.map(mapObj => mapObj[key]).indexOf(obj[key]) === index;
            });

        } else {
            return arr.filter(function(item, index, arr) {
                return arr.indexOf(item) == index;
            });
        }
    },

    validAge: function (str, childNum) {
        if (childNum > 0 && (str == null || str.length == 0)) {
            return false;
        }
        var arr = str.split(",");
        for (var i=0; i < arr.length; i++) {
            if (isNaN(arr[i])){
                return false;
            }
            if (arr[i] >= 18) {
                return false;
            }
        }
        if (arr.length == childNum) {
            return true;
        }
        return false;
    },
    buildMultiRoomRequest: function (args) {
        var adultPerRoom = args.adultNum;
        if (args.adultPerRoom != null) {
            adultPerRoom = args.adultPerRoom;
        }
        //search hotels
        var roomGuest = [];
        for (var i=0; i< args.rooms; i++) {
            roomGuest.push({"adults":adultPerRoom,"children": (args.childNum == null ? 0 : args.childNum),
            "childrenAges":args.childAge});
        }
        var multiRequest = {
            'arrival': this.formatDate(args.fromDate),
            'departure': this.formatDate(args.toDate),
            'currency': 'AUD',
            'rooms': args.rooms,
            "locale": "zh_CN",
            "roomGuests":roomGuest,
            "freeBreakfast": args.freeBreakfast,
            "latitude": args.latitude,
            "longitude": args.longitude,
            "agents":['HOTELBEDS','GTA','ETA','APARTMENT','BOOKING','AMADEUS'], 
            "showOptionalMeal":"true"
        };
        if (args.minstar) {
            multiRequest['minStar'] = args.minstar;
        }
        if (args.maxstar) {
            multiRequest['maxStar'] = args.maxstar;
        }
        // var minPrice = args.budget['min'];
        // var maxPrice = args.budget['max'];
        if (args.budget != null) {
            var minPrice = args.budget['min'];
            var maxPrice = args.budget['max'];
            if (maxPrice == minPrice) {
                minPrice = minPrice * 0.7;
                maxPrice = maxPrice * 1.1;
            }
            multiRequest['minPrice'] = minPrice
            multiRequest['maxPrice'] = maxPrice
        } else {
            multiRequest['minPrice']  = 0;
            multiRequest['maxPrice'] = 9000;
        }
        if (args.cityCode != null) {
            multiRequest['cityCode'] = args.cityCode
        }
        if (multiRequest['latitude'] != null && multiRequest['longitude'] != null) {
            multiRequest['sortType'] = "DISTANCE";
        }
        if (args.sortType == 'PRICE_LOW'){
            multiRequest['sortType'] = 'PRICE';
        }
        return multiRequest;
    },
    //deprecated
    findConfilictRequest: function (oldRequest,  newRequest) {
        if (oldRequest == null || newRequest == null) {
            return null;
        }
        var confilictItems = []
        if ( oldRequest.cityEntity!= null && newRequest.cityEntity != null ) {
            if (!this.isSame(oldRequest.cityEntity.resolution.values[0], newRequest.cityEntity.resolution.values[0])){
                confilictItems.push({msg: '请选择城市', options: [oldRequest.cityEntity.entity,newRequest.cityEntity.entity], field: 'cityEntity'})
            }
        }
        
        if (!this.isSame(oldRequest.rooms, newRequest.rooms)){
            confilictItems.push({msg: '请选择房间数量', options: [oldRequest.rooms,newRequest.rooms], field: 'rooms'})
        }
        if (!this.isSame(oldRequest.adultNum, newRequest.adultNum)){
            confilictItems.push({msg: '请选择成人数量', options: [oldRequest.adultNum, newRequest.adultNum], field: 'adultNum'})
        }
        if (!this.isSame(oldRequest.childNum, newRequest.childNum)){
            confilictItems.push({msg: '请选择儿童数量', options: [oldRequest.childNum,newRequest.childNum], field: 'childNum'})
        }
        if (!this.isSame(oldRequest.fromDate, newRequest.fromDate)){
            confilictItems.push({msg: '请选择入住时间', options: [this.formatDate(oldRequest.fromDate), this.formatDate(newRequest.fromDate)], field: 'fromDate'})
        }
        if (!this.isSame(oldRequest.toDate, newRequest.toDate)){
            confilictItems.push({msg: '请选择退房时间', options: [this.formatDate(oldRequest.toDate), this.formatDate(newRequest.toDate)], field: 'toDate'})
        }
        return confilictItems;
    },
    isSame: function (o1, o2) {
        if (o1 == null || o2 == null) {
            return true;
        }
        if (o1 == o2) return true;
        return false;
    },
    buildHeroCardByQuote: function (session) {
        //var recordsPerPage = 5
        var msg = new global._builder.Message(session);
        var quotes = session.dialogData.quote.quotes
        msg.attachmentLayout(global._builder.AttachmentLayout.carousel); 
        for (var i=0; i< quotes.length; i++) {
            var aHotel = {};
            var hotelName = quotes[i].hotelName == "" ? quotes[i].originalName : quotes[i].hotelName;
            aHotel['name'] = hotelName;
            aHotel['hotelUuid']  = quotes[i].hotelUuid;
            var recommend = "";
            if (quotes[i].recommendReason != null && quotes[i].recommendReason.length > 0) {
                recommend = "\n*推荐理由:\n"
                for (var j=0;j<quotes[i].recommendReason.length; j++) {
                    if (j>0) recommend += ", "
                    recommend += quotes[i].recommendReason[j];
                }
            }

            var aCard = new global._builder.HeroCard(session)
                .title(hotelName)
                .subtitle(quotes[i].rating + "星级")
                .text("每晚价格从 " + quotes[i].currency + " " + Math.round(quotes[i].price/session.dialogData.quote.nights) + "起" + recommend)
                .images([global._builder.CardImage.create(session, quotes[i].thumbNailUrls[0])])
                .buttons([
                    //global._builder.CardAction.postBack(session, JSON.stringify(aHotel),'选择')
                    global._builder.CardAction.dialogAction(session, 'confirmHotelAction', JSON.stringify(aHotel),'选择 ' + (i+1))
                ])
            msg.addAttachment(aCard);
        }
        return msg;
    },

    optimizeRoomsResult: function (session, rooms, request) {
        if (rooms == null || rooms.length == 0 || request == null){
            return rooms;
        }
        if (session.privateConversationData.hotelRequest.bedType == null || session.privateConversationData.hotelRequest.bedType.length > 1) {
            //show all bedtype
            return rooms;
        }
        
        //filtering by room type
        var pattern = null
        var preferredBedType = session.privateConversationData.hotelRequest.bedType[0];
        if (preferredBedType != null) {
            pattern = new RegExp(BED_TYPE_EXP[session.privateConversationData.hotelRequest.bedType + '_Exp'],"i");
        }
        var nonTwinPatten = new RegExp(BED_TYPE_EXP['NONTWIN_Exp'],'i');
        if (pattern == null) {
            global._logger.log("info",'optimizeRoomsResult','cannot find the pattern for bedtype:' + preferredBedType);
            return rooms;
        }
        //match pattern by bed type and room name
        return rooms.filter(room => {
            var desc = (room.bedTypeDesc == null ? '' : room.bedTypeDesc) + (room.roomName == null ? '' : room.roomName);
            global._logger.log('info','bedType-filtering',{'bedDescription': desc})
            if (desc == null || desc == ''){
                global._logger.log('info','bedType-filtering', 'no description, return room' + room);
                return true;
            } 
            if (session.privateConversationData.hotelRequest.bedType == 'DOUBLE') {
                global._logger.log('info','bedType-filtering',{'Match-DOUBLE':desc.match(pattern), 'Match-NonTwin':desc.match(nonTwinPatten)})
                return desc.match(pattern) != null || desc.match(nonTwinPatten) != null
            } else {
                global._logger.log('info','bedType-filtering',{'Match-Twin': desc.match(pattern)});
                return desc.match(pattern) != null
            }
        });
    }

};

