var http = require('http');
module.exports = function (app) {
    app.get('/get-key', function (req, res) {
        res.status(200).json({
            key: 'khGmpnq38hCbcGKE6PQ9qOFVYgdiJAsv'
        }).end();
    });
    app.get('/get-results', function (clientReq, res) {
        var url = clientReq.originalUrl.split('?')[1];
        var queryURL = "?apikey=khGmpnq38hCbcGKE6PQ9qOFVYgdiJAsv&";
        var apiURL = 'http://api.sandbox.amadeus.com';
        var endpoint = '/v1.2/flights/inspiration-search';
        var query = queryURL + url;
        var getURL = apiURL + endpoint + query;
        http.get(getURL, function (AmadeusRes) {
            var code = AmadeusRes.statusCode;
            var dataToSend = "";
            AmadeusRes.on('data', function (data) {
                dataToSend += data.toString();
            });
            AmadeusRes.on('end', function () {
                console.log(dataToSend);
                res.status(code).send(dataToSend).end();
            });
        }).end();
    });
}