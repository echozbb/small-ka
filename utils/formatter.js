var dateFormat = require('dateformat');
var Utils = require('./utils');
const numDescRegExp = "位|个|对";
const searchItemRegExp = [
    {field: "adultNum", regExp: "大|人|成人", name: "成人数"},
    {field: "childNum", regExp: "小", name: "儿童数"},
    {field: "couple",   regExp: "夫妻|couple|情侣", name: "成人数"},
    {field: "adOrch",   regExp: numDescRegExp, name: ""},
    {field: "star",     regExp: "星", name: "星级"},
    {field: "rooms",  regExp: "间", name: "房间数"},
    {field: "nights",   regExp: "晚|night", name: "晚数"}

];

module.exports = {
    getDates: function (entities, message) {
        var allDates = []
        //format coziDates
        var coziDates = global._builder.EntityRecognizer.findAllEntities(entities,'coziDate');
        for (var i=0; i< coziDates.length; i++) {
            try {
                var coziDate = coziDates[i].entity.replace(/[^\w\d]/gi, '-').replace(/(-|_)+/g, '-');
                if (coziDate.match(/\d+-\d+-\d+/)) {
                     allDates.push({date:dateFormat(coziDate, "isoDate"),startIndex: coziDates[i].startIndex, endIndex: coziDates[i].endIndex});
                } else {
                     //add year
                     var today = new Date(); 
                     var thisYear = parseInt(dateFormat(today, "yyyy"));
                     var d1 = dateFormat(coziDate + "-" + thisYear, "isoDate");
                     while (!Utils.isAfterToday(d1)) {
                         thisYear ++;
                         d1 = dateFormat(coziDate + "-" + thisYear, "isoDate");
                     }
                     allDates.push({date:d1,startIndex: coziDates[i].startIndex, endIndex: coziDates[i].endIndex});
                }
            }catch (err) {
                global._logger.log('info','formatter.getDates', 'cannot format coziDate ' + coziDates[i].entity);
            }
        }

        var dates = global._builder.EntityRecognizer.findAllEntities(entities, 'builtin.datetimeV2.date');
        for (var i=0; i< dates.length; i++) {
            try {
                if (dates[i].resolution != null && dates[i].resolution.values.length > 0) {
                    for (var j=0; j< dates[i].resolution.values.length; j++) {
                        if (Utils.isAfterToday(dates[i].resolution.values[j].value)) {
                            allDates.push({date: dateFormat(dates[i].resolution.values[j].value, "isoDate"), startIndex: dates[i].startIndex, endIndex: dates[i].endIndex});
                            break;
                        }
                    }
                }
            }catch (err) {
                global._logger.log('info','formatter.getDates', 'cannot format datetimeV2.date ' + dates[i].entity);
            }
        }

        var dateRanges = global._builder.EntityRecognizer.findAllEntities(entities, 'builtin.datetimeV2.daterange');
        for (var i = 0; i < dateRanges.length; i++) {
            try {
                if (dateRanges[i].resolution != null && dateRanges[i].resolution.values.length > 0) {
                    for (var j = 0; j < dateRanges[i].resolution.values.length; j++) {
                        if (/p\d*d/i.test(dateRanges[i].resolution.values[j]['timex'])) {
                            if (Utils.isAfterToday(dateRanges[i].resolution.values[j].start)) {
                                allDates.push({date: dateFormat(dateRanges[i].resolution.values[j].start, "isoDate"), startIndex: dateRanges[i].startIndex, endIndex: dateRanges[i].endIndex});
                                allDates.push({date: dateFormat(dateRanges[i].resolution.values[j].end, "isoDate"), startIndex: dateRanges[i].startIndex, endIndex: dateRanges[i].endIndex});
                                break;
                            }
                        }
                        
                    }
                }
            } catch (err) {
                global._logger.log('info','formatter.getDates', 'cannot format datetimeV2.daterange ' + dateRanges[i].entity);
            }
        }

        var dateTimeRanges = global._builder.EntityRecognizer.findAllEntities(entities, 'builtin.datetimeV2.datetimerange');
        for (var i=0; i < dateTimeRanges.length; i++) {
            try{
                if (dateTimeRanges[i].resolution != null && dateTimeRanges[i].resolution.values.length > 0) {
                    for (var j=0 ; j< dateTimeRanges[i].resolution.values.length.length; j++) {
                        if (Utils.isAfterToday(dateTimeRanges[i].resolution.values[j].start)){
                            allDates.push({date: dateFormat(dateTimeRanges[i].resolution.values[j].start, "isoDate"), startIndex: dateTimeRanges[i].startIndex, endIndex: dateTimeRanges[i].endIndex});
                            break;
                        }
                    }
                }
            }catch (err) {
                global._logger.log('info','formatter.getDates', 'cannot format datetimeV2.datetimerange ' + dateTimeRanges[i].entity);
            }
        }
        //remove duplicate and sort by date
        var uniDate = allDates.filter((obj, pos, arr) => {
            return arr.map(mapObj =>
            mapObj['date']).indexOf(obj['date']) === pos;
            }).sort(function (a, b) {
                var da = new Date(a['date']);
                var db = new Date(b['date']);
                return da.getTime() - db.getTime();
            });
        return uniDate;
    },

    getSearchItem: function (entities, message) {
        var searchItem = global._builder.EntityRecognizer.findAllEntities(entities,'searchParam');
        var numbersEntities = global._builder.EntityRecognizer.findAllEntities(entities,'builtin.number');
        var results = []
        for (var i = 0; i < searchItem.length; i++) {
            for (var j = 0; j < searchItemRegExp.length; j++) {
                var pattern = new RegExp(searchItemRegExp[j].regExp,'i');
                var field = searchItemRegExp[j].field;
                if (pattern.test(searchItem[i].entity)) {
                    var num = searchItem[i].entity.replace(pattern, '').replace(new RegExp(numDescRegExp,'i'),'').replace(/\s/gi,'')
                    if (isNaN(num)) {
                        //find correct number
                        var index = searchItem[i].entity.indexOf(num) + searchItem[i].startIndex;
                        num = Utils.findValueOfNumberByStartIndex(numbersEntities, index);
                    }
                    if (field == 'couple') {
                        num = num * 2;
                        field = 'adultNum';
                    }
                    if (num != null) {
                        results.push({field: field, value: parseInt(num), startIndex: searchItem[i].startIndex, endIndex: searchItem[i].endIndex, name: searchItemRegExp[j].name});
                        global._logger.log('info','formatter.getSearchItem', 'addedItem:' + searchItem[i].entity);
                    }
                }
            }
        }
        return results;
    },

    getBudgetItems: function (entities, message) {
        var budgetEntities = global._builder.EntityRecognizer.findAllEntities(entities,'budget');
        var numbersEntities = global._builder.EntityRecognizer.findAllEntities(entities,'builtin.number');
        var budget = [];
        for (var i = 0; i < budgetEntities.length; i++) {
            var currency = 'AUD';
            if (/元|块/.test(budgetEntities[i].entity)){
                currency = 'CNY';
            }
            var num = budgetEntities[i].entity.replace(/\s*(澳币|元|刀|dollar|澳刀|左右|块)/ig,'');
            if (isNaN(num)) {
                var index = budgetEntities[i].entity.indexOf(num) + budgetEntities[i].startIndex;
                num = Utils.findValueOfNumberByStartIndex(numbersEntities, index);
            }
            if (num != null)  budget.push({'value': parseInt(num),'currency': currency,'startIndex': budgetEntities[i].startIndex, 'endIndex':budgetEntities[i].endIndex});
        }
      
        var currencyEntities = global._builder.EntityRecognizer.findAllEntities(entities,'builtin.currency');
        for (var i = 0; i < currencyEntities.length; i++) {
            var currency = 'AUD';
            if ('Chinese yuan' == currencyEntities[i].resolution.unit) currency = 'CNY';
            budget.push({'value': parseInt(currencyEntities[i].resolution.value),'currency': currency,'startIndex': currencyEntities[i].startIndex, 'endIndex':currencyEntities[i].endIndex});
        }
  
        return budget.filter((obj, pos, arr) => {
            return arr.map(mapObj =>
            mapObj['value']).indexOf(obj['value']) === pos;
            }).sort(function (a, b) {
                return a.value - b.value
            });;
    }
    

}