module.exports = {
    
   multiRoomRequest: function (cityCode,arrival,departure,rooms,freeBreakfast) {
        this.uuid = '';
        this.cityCode = cityCode;
        this.arrival = arrival.replace(/ /g,'');
        this.departure = departure.replace(/ /g,'');
        this.currency = 'AUD';
        this.locale = 'zh-CN';
        //TODO: handle room number later
        this.rooms = 1;
        this.freeBreakfast = freeBreakfast;
        this.freeCancellation = null;
    },

    preferredHotelResquest: function (countryCode,cityCode,queryString) {
        this.countryCode = countryCode;
        this.cityCode = cityCode;
        this.queryString = queryString;
        this.locale = 'zh_CN';
    },

    entity: function (entity, type, values) {
        this.entity = entity;
        this.type = type;
        this.resolution = {'values': values};
    }

};

