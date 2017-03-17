'use strict';
var APIkey = "khGmpnq38hCbcGKE6PQ9qOFVYgdiJAsv";
var airlines, airports;
var dep = "";

$(document).ready(function () {
    initDatepicker();
    loadData();
    $("#datepicker").change(function () {
        console.log($(this).val());
        var currentDate = $("#datepicker").datepicker("getDate");
        var date = $.datepicker.formatDate("yy-mm-dd", currentDate);
        console.log(date);
    });
    $("#btn-search").click(function (e) {
        e.preventDefault();
        $("#results").empty();
        search();
    });
});
// DATEPICKER - SETUP & OPTIONS
function initDatepicker() {
    $("#datepicker").datepicker();
    $("#datepicker").datepicker("option", "monthNames", ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Decembre"]);
    $("#datepicker").datepicker("option", "dayNamesMin", ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"]);
    $("#datepicker").datepicker("option", "minDate", new Date(Date.now()));
    $("#datepicker").datepicker("option", "dateFormat", "dd/mm/yy");
    $("#datepicker").datepicker({
        onSelect: function (date) {
            alert(date);
        }
    });
}

function flexDate(nDays) {
    var res = $("#datepicker").datepicker("getDate");
    res.setDate(res.getDate() + nDays);
    return res;
}

function parseDate(date) {
    var res = new Date(date);
    res = $.datepicker.formatDate("dd/mm/yy", res);
    return res;
}
// AUTOCOMPLETE SYSTEM - Retrieve IATA Code of Departure Airport
$(function () {
    $("#airport").autocomplete({
        source: function (request, response) {
            $.ajax({
                url: "https://api.sandbox.amadeus.com/v1.2/airports/autocomplete"
                , dataType: "json"
                , data: {
                    apikey: APIkey
                    , term: request.term
                }
                , success: function (data) {
                    response(data);
                    console.log(data);
                }
            });
        }
        , minLength: 3
        , select: function (event, ui) {
            dep = ui;
            console.log(dep);
            var res = ui.item.label;
            $("#selected").text(res);
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
    var s = "https://api.sandbox.amadeus.com/v1.2/flights/inspiration-search";
    var or = $("#airport").val();
    var dur = getDuration();
    var budget = $("#maxPrice").val();
    var dep = getDepRange();
    $(".loader").show();
    $.ajax({
        url: s
        , dataType: "json"
        , data: {
            apikey: APIkey
            , origin: or
            , departure_date: dep
            , duration: dur
            , max_price: budget
        }
        , success: handleRes
        , error: handleError
    });
}

function getDepRange() {
    var currentDep = $("#datepicker").datepicker("getDate");
    var dep1 = $.datepicker.formatDate("yy-mm-dd", currentDep);
    var days = Number($("#flexibility").val());
    var dep2 = $.datepicker.formatDate("yy-mm-dd", flexDate(days));
    return dep1 + "--" + dep2;
}

function getDuration() {
    var dur = Number($("#duration").val());
    return dur + "--" + dur;
}

function handleRes(res) {
    console.log(res);
    var currency = res.currency;
    var data = res.results;
    var nRes = data.length;
    var moy = 0;
    $.each(data, function (index, val) {
        moy += Number(val.price);
        val.currency = currency;
        var airlineLong = getAirlineName(val.airline);
        var airportInfos = getAirportInfos(val.destination);
        if (airportInfos !== -1) {
            val.city = airportInfos.city;
            val.name = airportInfos.name;
            val.country = airportInfos.country.toUpperCase();
        }
        val.departure_date = parseDate(val.departure_date);
        val.return_date = parseDate(val.return_date);
        val.airlineLong = airlineLong;
        var html = Mustache.render(cardTemplate, val);
        $("#results").append(html);
    });
    $("#results").toggle('slow');
    $(".loader").hide();
    moy /= nRes;
    moy = Math.round(moy);
    console.log(moy);
}

function handleError(jqXHR, textStatus, errorThrown) {
    $(".loader").hide();
    console.error(jqXHR.statusText + " " + jqXHR.status + " : " + jqXHR.responseJSON.message);
    alert(jqXHR.responseJSON.message);
}
// LOAD AIRPORTS/AIRLINES JSON TO MATCH RESULTS SENT BY THE API
function loadData() {
    $.getJSON('airlines.json', function (data) {
        airlines = data;
        console.log("Airlines successfully loaded.");
    });
    $.getJSON('airports.json', function (data) {
        airports = data;
        console.log("Airports successfully loaded.");
    });
}

function getAirlineName(code) {
    var res = $.grep(airlines, function (e) {
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
    var res = $.grep(airports, function (e) {
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
            , '<div class="panel-footer"> <small>AIRPORT : {{name}} ({{destination}}). By : {{airlineLong}} ({{airline}})</small> </div>'
        , '</div>'].join("\n");
