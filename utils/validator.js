var Utils = require('./utils');

const mandatory_fields = [
    {field: 'fromDate',     missing: '入住时间',    rule: '%s != null',   desc: '%s入住'}, 
    {field: 'toDate',       missing: '退房时间',    rule: '%s != null',   desc: '%s退房'}, 
    {field: 'cityName',     missing: '目的地',      rule: '%s != null ',  desc: '前往%s'}, 
    {field: 'rooms',        missing: '房间数',      rule: '%s >0 ',       desc: '%s间房'},
    {field: 'adultNum',     missing: '每间房人数',   rule: '%s >0 ',       desc: '每房%s位成人'}]

const child_fields = [
    {field: 'childNum', missing: '儿童人数', rule: '%s >= 0', desc: '%s个小孩'},
    {field: 'childAge', missing: '儿童年龄', rule: '',desc: '年龄为%s'}]

const optional_fields = [
    {field: 'star',          missing: "星级",      desc: '%s星级', rule: '0< %s <= 5'},
    {field: 'budget',        missing: "每晚预算",   desc: '预算%s', rule: '%s >= 50'},
    {field: 'freeBreakfast', missing: "是否含早",   desc: '%s早餐', rule: ''},
    {field: 'location',      missing: "首选位置",   desc: '首选区域在%s', rule: ''},
    {field: 'bedType',       missing: "床型",      desc: '需要%s', rule: ''},
    {field: 'hotelName',     missing: "酒店名称",   desc: '入住%s', rule: ''},
    {field: 'sortType',      missing: '',         desc: '', rule: ''},
]

module.exports = {
    validateRequest: function (hotelRequest) {
        if (hotelRequest == null) return null;

        var fatal = false;
        var missing = [];
        var incorrect = []
        var filled = []
        for (var i = 0; i < mandatory_fields.length; i++) {
            var rule = mandatory_fields[i].rule.replace(/%s/i, 'hotelRequest.' + [mandatory_fields[i].field]);
            global._logger.log('info','validator',mandatory_fields[i].field + ' rule: ' + rule);
            if (eval(rule) == false){
                fatal = true;
                missing.push({field: mandatory_fields[i].field, desc: mandatory_fields[i].missing});
                hotelRequest[mandatory_fields[i].field] = null;
            } else {
                filled.push(mandatory_fields[i].desc.replace(/\%s/i,hotelRequest[mandatory_fields[i].field]));
            }
        }
        //validate checkin/checkout
        if ( hotelRequest.fromDate != null && hotelRequest.toDate != null) {
            if (!Utils.isBefore(hotelRequest.fromDate, hotelRequest.toDate)) {
                fatal = true;
                incorrect.push({field: 'fromDate', desc: '退房时间不能早于入住时间'})
                hotelRequest.fromDate = null;
                hotelRequest.toDate = null;
            }
        }

        //validate child
        if (hotelRequest.childNum != null && hotelRequest.childNum > 0) {
            filled.push(child_fields[0].desc.replace(/\%s/i, hotelRequest.childNum))
            if (!Utils.validAge(hotelRequest.childAge, hotelRequest.childNum) ) {
                fatal = true;
                hotelRequest.childAge = null;
                if (hotelRequest.childNum == 1) {
                    missing.push({field: 'childAge', desc: '小孩年龄'});
                } else {
                    missing.push({field: 'childAge', desc:'每个小孩的年龄'})
                }
            } else {
                filled.push(child_fields[1].desc.replace(/\%s/i, hotelRequest.childAge))
            }
        }

        //validate optional fields
        for (var i = 0; i < optional_fields.length; i++) {
            switch(optional_fields[i].field){
                case 'star' :
                    if (hotelRequest.maxstar != null) {
                        var rule = optional_fields[i].rule.replace(/%s/i, 'hotelRequest.maxstar');
                        if (eval(rule) == false) {
                            incorrect.push({field:'star', desc:'星级不能超过5星'});
                            hotelRequest.maxstar = null;
                            hotelRequest.minstar = null;
                        } else {
                            var star = hotelRequest.minstar
                            if (hotelRequest.minstar != hotelRequest.maxstar) {
                                star = star + " - " +  hotelRequest.maxstar
                            }
                            filled.push(optional_fields[i].desc.replace(/\%s/i, star));
                        }
                    } else {
                        missing.push({field: optional_fields[i].field, desc: optional_fields[i].missing})
                    }
                    break;
                case 'budget':
                    if (hotelRequest.budget != null) {
                        if (hotelRequest.budget['currency'] == 'CNY') {
                            //roughly convert
                            hotelRequest.budget['min'].value =  Math.round(hotelRequest.budget['min'].value/5)
                            hotelRequest.budget['max'].value =  Math.round(hotelRequest.budget['max'].value/5)
                            hotelRequest.budget['currency'] = 'AUD'
                        }
                        var rule = optional_fields[i].rule.replace(/%s/i, "hotelRequest.budget['max']");
                        if (eval(rule) == false) {
                            incorrect.push({field: 'budget', desc:'澳新酒店的最低通常在100元以上，请重新输入您的预算'});
                            hotelRequest.budget = null;
                        } else if (parseInt(hotelRequest.budget['max']) == parseInt(hotelRequest.budget['min'])) {
                            filled.push(optional_fields[i].desc.replace(/\%s/i, hotelRequest.budget['max']));
                        } else {
                            filled.push(optional_fields[i].desc.replace(/\%s/i, hotelRequest.budget['min'] + ' - ' + hotelRequest.budget['max']));
                        }
                    } else {
                        missing.push({field: optional_fields[i].field, desc: optional_fields[i].missing})
                    }
                    break;
                case 'freeBreakfast':
                    if (hotelRequest.freeBreakfast != null) {
                        var text = '含';
                        if (!hotelRequest.freeBreakfast) {
                            text = '不' + text
                        }
                        filled.push(optional_fields[i].desc.replace(/\%s/i, text));
                    } else {
                        missing.push({field: optional_fields[i].field, desc: optional_fields[i].missing})
                    }
                    break;
                case 'bedType':
                    if (hotelRequest.bedType != null) {
                        var bedType = '';
                        for (var j = 0; j < hotelRequest.bedType.length; j++) {
                            var str = hotelRequest.bedType[j] == 'TWIN' ? "双床房" : "大床房"
                            if (bedType != '') bedType = bedType + ' 或 '
                            bedType = bedType + str;
                        }
                        filled.push(optional_fields[i].desc.replace(/\%s/i, bedType));
                    } else {
                        missing.push({field: optional_fields[i].field, desc: optional_fields[i].missing})
                    }
                    break;
                case 'hotelName':
                    if (hotelRequest.hotelName != null) {
                        if (hotelRequest.hotelUuid != null) filled.push(optional_fields[i].desc.replace(/\%s/i, hotelRequest.hotelName));
                    } else {
                        missing.push({field: optional_fields[i].field, desc: optional_fields[i].missing})
                    }
                    break;
                case 'sortType':
                    if (hotelRequest.sortType != null) {
                        if (hotelRequest.sortType == 'PRICE_LOW') {
                            filled.push('最便宜的');
                        } else {
                            filled.push('最好的');
                        }
                    }
                    break;
                default:
                    global._logger.log('info','validator','unknown field ' + optional_fields[i].field);
            }
        }

        return {fatal:fatal, hotelRequest: hotelRequest, filled: filled, missing: missing, incorrect: incorrect};
    }
}
