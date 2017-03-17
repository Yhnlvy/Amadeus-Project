'use strict';
var AmadeusAPIkey = "khGmpnq38hCbcGKE6PQ9qOFVYgdiJAsv";
var airlinesDict, airportsDict;
var departureLocation = "";
$(document).ready(function () {
    initDatepicker();
    loadDictionaries();
    $("#btn-search").click(function (e) {
        e.preventDefault();
        $("#results").empty();
        search();
    });
});
// DATEPICKER - SETUP & OPTIONS
function initDatepicker() {
    $("#datepicker").datepicker();
    // French translations for month names & short day names
    $("#datepicker").datepicker("option", "monthNames", ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Decembre"]);
    $("#datepicker").datepicker("option", "dayNamesMin", ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"]);
    // OPTIONS
    $("#datepicker").datepicker("option", "minDate", new Date(Date.now())); // We do not allow past dates
    $("#datepicker").datepicker("option", "dateFormat", "dd/mm/yy");
}

function addDaysToDate(nDays) {
    var newDate = $("#datepicker").datepicker("getDate");
    newDate.setDate(newDate.getDate() + nDays);
    return newDate;
}

function parseDate(date) {
    var parsedDate = new Date(date);
    parsedDate = $.datepicker.formatDate("dd/mm/yy", parsedDate);
    return parsedDate;
}
// AUTOCOMPLETE SYSTEM - Retrieve IATA Code of Departure Airport
$(function () {
    $("#airport").autocomplete({
        source: function (request, response) {
            var endpointURL = "https://api.sandbox.amadeus.com/v1.2/airports/autocomplete";
            $.ajax({
                url: endpointURL
                , dataType: "json"
                , data: {
                    apikey: AmadeusAPIkey
                    , term: request.term
                }
                , success: function (data) {
                    response(data);
                }
            });
        }
        , minLength: 3
        , select: function (event, ui) {
            departureLocation = ui;
            var departureAirport = ui.item.label;
            $("#selected").text(departureAirport);
        }
        , open: function () {
            $(this).removeClass("ui-corner-all").addClass("ui-corner-top");
        }
        , close: function () {
            $(this).removeClass("ui-corner-top").addClass("ui-corner-all");
        }
    });
});
// API CALL - Inspiration Search
function search() {
    var endpointURL = "https://api.sandbox.amadeus.com/v1.2/flights/inspiration-search";
    var origin = $("#airport").val();
    var duration = getDuration();
    var budget = $("#maxPrice").val();
    var departureRange = getDepartureRange();
    $(".loader").show();
    $.ajax({
        url: endpointURL
        , dataType: "json"
        , data: {
            apikey: AmadeusAPIkey
            , origin: origin
            , departure_date: departureRange
            , duration: duration
            , max_price: budget
        }
        , success: displayResults
        , error: handleError
    });
}

function getDepartureRange() {
    var departureDate = $("#datepicker").datepicker("getDate");
    departureDate = $.datepicker.formatDate("yy-mm-dd", departureDate);
    var nDays = Number($("#flexibility").val());
    var lastDepartureDate = $.datepicker.formatDate("yy-mm-dd", addDaysToDate(nDays));
    return departureDate + "--" + lastDepartureDate;
}

function getDuration() {
    var duration = Number($("#duration").val());
    return duration + "--" + duration;
}

function displayResults(res) {
    var currency = res.currency;
    var results = res.results;
    var numberOfResults = results.length;
    var mean = 0;
    $.each(results, function (index, value) {
        mean += Number(value.price);
        value.currency = currency;
        var airlineName = getAirlineName(value.airline);
        var airportInfos = getAirportInfos(value.destination);
        if (airportInfos !== -1) {
            value.city = airportInfos.city;
            value.name = airportInfos.name;
            value.country = airportInfos.country.toUpperCase();
        }
        value.departure_date = parseDate(value.departure_date);
        value.return_date = parseDate(value.return_date);
        value.airlineName = airlineName;
        var htmlCardTemplate = Mustache.render(cardTemplate, value);
        $("#results").append(htmlCardTemplate);
    });
    $("#results").toggle('slow');
    $(".loader").hide();
    mean /= numberOfResults;
    mean = Math.round(mean);
}

function handleError(jqXHR, textStatus, errorThrown) {
    $(".loader").hide();
    console.error(jqXHR.statusText + " " + jqXHR.status + " : " + jqXHR.responseJSON.message);
    alert(jqXHR.responseJSON.message);
}
// LOAD AIRPORTS/AIRLINES JSON TO MATCH RESULTS SENT BY THE API
function loadDictionaries() {
    $.getJSON('airlines.json', function (dict) {
        airlinesDict = dict;
        console.log("Airlines successfully loaded.");
    });
    $.getJSON('airports.json', function (dict) {
        airportsDict = dict;
        console.log("Airports successfully loaded.");
    });
}

function getAirlineName(code) {
    var res = $.grep(airlinesDict, function (e) {
        return e.iata == code;
    });
    if ($.isEmptyObject(res) || typeof res == 'undefined') {
        return code;
    }
    else {
        return res[0].name;
    }
}

function getAirportInfos(code) {
    var res = $.grep(airportsDict, function (e) {
        return e.iata == code;
    });
    if ($.isEmptyObject(res) || typeof res == 'undefined') {
        return -1;
    }
    else {
        return res[0];
    }
}
// CARDS TEMPLATING SYSTEM TO DISPLAY RESULTS
var cardTemplate = [
    '<div class="panel panel-default">'
            , '<div class="panel-heading clearfix">'
                , '<h3 class="panel-title pull-left">{{city}} - {{country}}</h3>'
                , '<a class="btn btn-default pull-right" href="#"> <i class="fa fa-check"></i> {{price}} {{currency}}</a>'
            , '</div>'
            , '<div class="panel-body" style="text-align: center;">'
                , '<p> <i class="glyphicon glyphicon-calendar"></i> {{departure_date}} - {{return_date}}</p>'
            , '</div>'
            , '<div class="panel-footer"> <small>AIRPORT : {{name}} ({{destination}}). By : {{airlineName}} ({{airline}})</small> </div>'
        , '</div>'].join("\n");