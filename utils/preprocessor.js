
var commasEtcReg= /\s?(\.|,|，|。)\s?/g;
var slashesEtcReg = /\s?(\\|\/|\-)\s?/g;
var doubleSpacesReg = /\s\s/g;
var monthDict = {'jan': '01', 'january' : '01', 'feb': '02', 'february': '02', 'mar': '03', 'march': '03', 'apr': '04', 'april': '04', 'may': '05', 
'jun': '06', 'june': '06',  'jul': '07', 'july': '07', 'aug': '08', 'august': '08', 'sep': '09', 'september': '09', 'oct': '10', 'october': '10', 'nov': '11', 'november': '11', 'dec': '12', 'december': '12' };
var monthsReg = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)/;
var chineseNumbersListReg = [/(零)/, /(一)/, /(二|两|双)/, /(三)/, /(四)/, /(五)/, /(六)/, /(七)/, /(八)/, /(九)/];
var dayNumReg = /([0-3][0-9]|[1-9])/;
var monthNumReg = /(0[1-9]|1[0-2]|[1-9])/;
var searchParamReg = /(间|晚|大|小|星|位|人|night|标间|房|夫妻|澳币|元|刀|dollar|澳刀|左右|块)/;
var dollarReg = /(澳币|元|刀|dollar|澳刀|左右|块)/;
var dollarPrefefixReg = /(预算|\$|￥)/;
var chineseDateReg = new RegExp(monthNumReg.source + '月'  + dayNumReg.source + '(号|日)?');
var monthDayReg = new RegExp(monthNumReg.source + /(\.|\-)/.source + dayNumReg.source);
var yearReg = /(201[7-8]|1[7-8])/;
var yearMonthDayReg = new RegExp(yearReg.source + /(\.|\-)/.source +monthDayReg.source);
var chineseNumbers = /(零|一|二|三|四|五|六|七|八|九)/;
var toRegex ;

// NEED TO MAKE THIS WORK FOR THINGS GLOBALLY
module.exports = {
    replacePunctuation: function(parsed) {
        // Replace all similar commas and slashes characters and double spaces etc.
        parsed = parsed.toLowerCase();

        parsed = parsed.replace(doubleSpacesReg, ' ');        
        parsed = parsed.replace(commasEtcReg, '.');
        parsed = parsed.replace(slashesEtcReg, '-');
        return parsed;
    },
    replaceEnglishMonths: function(parsed) {
        // Dot space slash as an optional group
        var dss =  /(?:\.?\s?\-?)/;
        // Optional year group
        var oyg = /(?:201[7-8]|1[7-8])?/;
        // Keeps track of the date style format
        var forwardsDate = false;
        var backwardsDate = false;
        // Check for the full string with the years first
        var forwardsDateMatch = parsed.match(new RegExp( dayNumReg.source + dss.source + monthsReg.source  + dss.source + /(?:201[7-8])?/.source/*+ dss.source + yearReg.source*/));
        var backwardsDateMatch = parsed.match(new RegExp(/*yearReg.source + dss.source + */ /(?:201[7-8])?/.source + dss.source+ monthsReg.source + dss.source + dayNumReg.source));
        if (forwardsDateMatch != null && backwardsDateMatch == null) {
            forwardsDate = true;
        } else if (backwardsDateMatch != null && forwardsDateMatch == null) {
            backwardsDate = true;
        } else if (forwardsDateMatch != null && backwardsDateMatch != null) {
            var indexForwards = parsed.indexOf(forwardsDateMatch[0]);
            var indexBackwards = parsed.indexOf(backwardsDateMatch[0]);
            if (indexForwards < indexBackwards) {
                forwardsDate = true;
            } else if (indexBackwards < indexForwards) {
                backwardsDate = true;
            } else {
                global._logger.error('Backwards + Forwards match found');
            }
        }
        
        if (forwardsDate || backwardsDate) {
            // Used to help replace multiple occurances of words
            var maxAttempts = 20;
            var attemptCounter = 0;
            
            // Replace the months 
            for (var key in monthDict) {
                var tempReg = forwardsDate? new RegExp(dayNumReg.source + dss.source + new RegExp(key).source + dss.source + /(?:201[7-8])?/.source /*+ dss.source +  oyg.source*/) : new RegExp( /*oyg.source + dss.source + *//(?:201[7-8])?/.source + dss.source + new RegExp(key).source + dss.source + dayNumReg.source);
                while(parsed.match(tempReg) != null && attemptCounter < maxAttempts) {
                    var replaceString = forwardsDate? monthDict[key] + '.$1 ' : monthDict[key] + '.$1 ';
                    parsed = parsed.replace(tempReg, replaceString);
                    attemptCounter += 1;
                }
            }

        }
        return parsed;
    },
    dateWithYears: function(parsed) {

        // Convert YY-MM-DD to YYYY-MM-DD
        var yyMonthDayGlobalReg = new RegExp(/(^|[^20])(1[7-8]\.)/.source + '(' +  monthDayReg.source + ')', 'g');
        parsed = parsed.replace(yyMonthDayGlobalReg, '$120$2$3');
        
        // Get the date, check if the year is this year or next year by seeing
        // if the travel days are before today
        var travelDates = [] ;
        var travelDatesWithYears = [];
        var tempArr;
        var monthDayGlobalReg = new RegExp(monthDayReg.source, 'g');
        var yearMonthDayGlobalReg = new RegExp(yearMonthDayReg.source, 'g');
        while ((tempArr = monthDayGlobalReg.exec(parsed)) !== null) {
            travelDates.push(tempArr[0]);
        }
        while ((tempArr = yearMonthDayGlobalReg.exec(parsed)) !== null) {
            travelDatesWithYears.push(tempArr[0]);
        }
        var travelDatesToConvert = [];

        // If date already in YYYY format, then just return it after converting to having dots
        if (travelDates.length != 0 && travelDatesWithYears.length != 0) {
            for (var i = 0; i < travelDates; i++) {
                for (var j = 0; j < travelDatesWithYears; j++) {
                    if (travelDatesWithYears[j].includes(travelDates[i])) {
                        var travelDateWithYearsDots = travelDatesWithYears[j].replace(/\-/g, '.');
                        parsed = parsed.replace(travelDatesWithYears[j], travelDateWithYearsDots);
                    }  else {
                        travelDatesToConvert.push(travelDates);
                    }
                }
            }
        } else {
            travelDatesToConvert = travelDates;
        }

        for(var i = 0; i < travelDatesToConvert.length; i++) {
            var travelDate = travelDatesToConvert[i];
            if (travelDate != null) {
                // Set the year
                var tDate = travelDate.split('.');
                var tDateMonth = parseInt(tDate[0]);
                var tDateDay = parseInt(tDate[1]);
                var today = new Date();
                var todayDay = today.getDate();
                var todayMonth = today.getMonth()+1; 
                var year = today.getFullYear();
                if (tDateMonth < todayMonth) {
                    year += 1;
                } else if (tDateMonth == tDateMonth) {
                    if (tDateDay < todayDay) {
                        year += 1;
                    }
                }
                parsed = parsed.replace(travelDate, year + "." + tDateMonth + "." + tDateDay + ' ') ;
            }
        }
        return parsed;
    },
    convertCurrency: function(parsed) {
        var amountCurrencyReg = new RegExp(/(\d\d\d?)/.source + dollarReg.source, 'g');
        parsed = parsed.replace(amountCurrencyReg, '$$$1 ');
        parsed = parsed.replace(/预算(\d\d\d?)/g, '$$$1 ');
        return parsed;
    },
    preprocess : function(text) {
        var parsed = text;        
        try {
            // Check if it's an action
            if(parsed.substring(0,7) == 'action?') {
                return parsed;
            }
            // Check if it's JSON
            try {
                var jsonObj = JSON.parse(parsed);
                if (typeof jsonObj === "object" && jsonObj !== null) {
                    return parsed;
                }
            } catch (e){
            }

            // Used to help replace multiple occurances of words
            var maxAttempts = 20;
            var attemptCounter = 0;

            parsed = this.replacePunctuation(parsed)
            
            // Replace Chinese dates with western dates 
            // First replace years, the just normal reg
            parsed = parsed.replace(new RegExp(/(201[7-9]|1[7-9])年/.source + chineseDateReg.source, 'g'), '$1.$2.$3 ');            
            parsed = parsed.replace(new RegExp(chineseDateReg, 'g'), '$1.$2 ');
            // Replace dashes for dates i.e.e 10.11-12
            parsed = parsed.replace(new RegExp(monthNumReg.source + /\./.source + dayNumReg.source + /\s?\-\s?(\d($|[^\.\d月]|(\d[^\.月\d])|\d$))日?/.source,'g'), '$1.$2-$1.$3');
            // Get rid of trailing 日
            parsed = parsed.replace(/(\d\d?\.\d\d?)日/, '$1');
            // Replace Chinese characters with numbers if they appear with search params
            for (var i = 0; i <chineseNumbersListReg.length; i++) {
                parsed = parsed.replace(new RegExp( chineseNumbersListReg[i].source + /(?:个?)/.source + searchParamReg.source), i.toString() + '$2');
            }
            // Replace 个 when not needed
            var numGeSearchParamReg = new RegExp(/(\d)(?:个)/.source + searchParamReg.source, 'g');
            parsed = parsed.replace(numGeSearchParamReg, '$1$2 ');

            //Replace ranges for search params after a number
            var searchParamRangeReg = new RegExp(/(\d\d?\d?)\-(\d\d?\d?)/.source + searchParamReg.source, 'g');
            parsed = parsed.replace(searchParamRangeReg, '$1$3 $2$3');

            //Replace ranges for dollar prefixes 
            var dollarRangeReg = new RegExp(dollarPrefefixReg.source + /(\d\d\d?)\-(\d\d\d?)/.source, 'g');
            parsed = parsed.replace(dollarRangeReg, '$1$2 $1$3');

            parsed = this.convertCurrency(parsed);

            parsed = this.replaceEnglishMonths(parsed);
            parsed = this.dateWithYears(parsed);

            // Final cleanup for leftover " - " etc.
            parsed = this.replacePunctuation(parsed);
            parsed = parsed.trim();         

        } catch(e) {
            global._logger.info(e);
        }
        return parsed;
    }

};