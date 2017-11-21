var Hotel = require('../hotel-service');
var Utils = require('../utils/utils');

exports.book = [
    function (session, args) {
        session.dialogData.hotelUuid = session.privateConversationData.hotelRequest.hotelUuid;
        session.dialogData.request = Utils.buildMultiRoomRequest(session.privateConversationData.hotelRequest);
        session.dialogData.rooms = session.privateConversationData.hotelRequest.rooms;
        session.dialogData.confirmedRoom = args.confirmedRoom;
        session.dialogData.hotelName = session.privateConversationData.hotelRequest.hotelName;
        session.send('开始预订' + session.dialogData.hotelName + " 房间：" + session.dialogData.confirmedRoom.roomName);
        session.beginDialog('askGuestName', {'rooms': session.dialogData.rooms});
    },
    function (session, results) {
        var bookingInfoContainer = {};
        bookingInfoContainer.multiRoomRequest = session.dialogData.request;
        bookingInfoContainer.hotelBookingRoomDetails = []
        for (var i=0; i < results.response.length; i++) {
            var guestName = [{'title': results.response[i].title, 'firstName': results.response[i].firstName,'lastName': results.response[i].lastName}];
            bookingInfoContainer.hotelBookingRoomDetails.push({
                'guestNames': guestName,
                'numberOfAdults': session.dialogData.request.roomGuests[i].adults,
                'numberOfChildren': (session.dialogData.request.roomGuests[i].children == null ? 0 : session.dialogData.request.roomGuests[i].children),
                'childrenAges': session.dialogData.request.roomGuests[i].childrenAges,
                'rooms': 1,
                'roomBookingInfo': {
                    'roomBookingUuid': session.dialogData.confirmedRoom.roomBookingInfoUuid
                }
            })
        }
        bookingInfoContainer.transactionInformation = {
            'currency': 'AUD',
            'totalAmount': session.dialogData.confirmedRoom.confirmedPrice
        };
        session.dialogData.bookingInfoContainer = bookingInfoContainer;
        global._builder.Prompts.confirm(session, 'confirm_book');
    },
    function (session, results) {
        results.response = false;
        if (results.response == true) {
            Hotel.bookHotel(session.dialogData.hotelUuid,session.dialogData.bookingInfoContainer).then(function(bookingVo){
                console.log(bookingVo);
                var booked = false;
                if (bookingVo) {
                    if (bookingVo.status == 'BOOKED') {
                        booked = true;
                        session.send("book_success",session.dialogData.hotelName,bookingVo.confirmationNumber,session.dialogData.confirmedRoom.roomName);
                    }
                }
                if (booked == false) {
                    session.send("对不起，预定失败");
                } else {
                    session.send("thanks_for_using");
                }
                session.endDialog();
            })
        } else {
            //session.send('小卡暂时不支持预订，谢谢！')
            session.endConversation('预订功能稍后支持，敬请等候，谢谢！');
        }
    }
    
]