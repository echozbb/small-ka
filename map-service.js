
var url_join = require('url-join');
const googleUrl = "https://maps.googleapis.com/maps/api/staticmap";
const google_static_api_key = "AIzaSyAmeSgD0yn_Bn9ilNg_oADcZccbbNFhlC4";
const color = ['red','orange','green','purple','yellow','blue','gray','black','brown','white']

module.exports = {
    getMapMessage: function (session, quotes) {
        if (quotes == null || quotes.length == 0) {
            return null;
        }
        var markers=""
        var center = null;
        for (var i=0; i< quotes.length; i++) {
            if (quotes[i].mapDetails != null && quotes[i].mapDetails.latitude != null && quotes[i].mapDetails.longitude != null) {
                markers += "&markers=color:" + color[i] + "%7Clabel:"+(i+1)+"%7C" + quotes[i].mapDetails.latitude + "," +  quotes[i].mapDetails.longitude
                if (center == null) {
                    center = quotes[i].mapDetails.latitude + "," + quotes[i].mapDetails.longitude
                }
            }
        }
        var lanague = "&language=zh_CN"
        var url = url_join(googleUrl, '?center=' + center, '&zoom=13&size=800x400&maptype=roadmap', markers,lanague,"&key="+google_static_api_key);
        global._logger.log('info','map-service',{'google_URL': url});
        var msg = new global._builder.Message(session);
        msg.attachments([
            {
                "contentType": "image/jpg",
                "contentUrl": url
              }
        ])
        return msg;
    }
}

// exports.testLocation = [
//     function (session) {


//         var header = '<style> #map {height: 400px; width: 100%;} </style>'
//         var body = '<h3>My Google Maps Demo</h3><div id="map"></div><script>function initMap() {var uluru = {lat: -33.867681, lng: 151.207788};var bondi = {lat: -33.890542, lng:151.274856};var map = new google.maps.Map(document.getElementById(\'map\'), {zoom: 13,center: uluru});var marker = new google.maps.Marker({position: uluru,map: map});marker = new google.maps.Marker({position: bondi,map: map}); }</script><script async defersrc="https://maps.googleapis.com/maps/api/js?key=AIzaSyDSzG99S8H-UT-nmViTlyxrP98IYnE3XXY&callback=initMap"></script>';
//         var htmlTest = '<!DOCTYPE html>'
//         + '<html><header>' + header + '</header><body>' + body + '</body></html>';
//         var msg = new global._builder.Message(session);
//         // msg.attachments([
//         //     {
//         //         "contentType": "image/jpg",
//         //         "contentUrl": "https://maps.googleapis.com/maps/api/staticmap?center=Brooklyn+Bridge,New+York,NY&zoom=13&
//         //         size=600x300&maptype=roadmap%20&
//         //         markers=color:blue%7Clabel:S%7C40.702147,-74.015794&markers=color:green%7Clabel:G%7C40.711614,-74.012318%20&markers=color:red%7Clabel:C%7C40.718217,-73.998284%20&key=AIzaSyAmeSgD0yn_Bn9ilNg_oADcZccbbNFhlC4",
                
                
//         //         "name": "google"
//         //       }
//         // ])

//         session.send(msg);

//         var options = {
//             prompt: "Where should I ship your order?",
//             useNativeControl: true,
//             reverseGeocode: true,
// 			skipFavorites: false,
// 			skipConfirmationAsk: true,
//             requiredFields:

//                 global._locationDialog.LocationRequiredFields.streetAddress |
//                 global._locationDialog.LocationRequiredFields.locality |
//                 global._locationDialog.LocationRequiredFields.region |
//                 global._locationDialog.LocationRequiredFields.postalCode |
//                 global._locationDialog.LocationRequiredFields.country
//         };

//         global._locationDialog.getLocation(session, options);
//     },
//     function (session, results) {
//         if (results.response) {
//             var place = results.response;
// 			var formattedAddress = 
//             session.send("Thanks, I will ship to " + getFormattedAddressFromPlace(place, ", "));

//         }
//     }
// ]

// function getFormattedAddressFromPlace(place, separator) {
//     var addressParts = [place.streetAddress, place.locality, place.region, place.postalCode, place.country];
//     return addressParts.filter(i => i).join(separator);
// }
