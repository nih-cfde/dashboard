/* global register_dropdowns update_chart */

// TODO - copied from dcc_review.js
function get_formatted_date(d) {
    // Returns a date as a string in the following format: "2020-10-09 17:32:32 - 0400"
    var month = d.getMonth() + 1;

    if (month < 10) {
        month = '0' + month;
    }

    var day = d.getDate();

    if (day < 10) {
        day = '0' + day;
    }

    var formatted = d.getFullYear() + '-' + month + '-' + day
            + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds()
            + ' ' + get_time_zone_diff(d);

    return formatted;
}

// END copied from dcc_review.js

function get_time_zone_diff(d) {
    var timezone_offset_minutes = d.getTimezoneOffset();
    var offset_hrs = parseInt(Math.abs(timezone_offset_minutes / 60));
    var offset_min = Math.abs(timezone_offset_minutes % 60);

    if (offset_hrs < 10) {
        offset_hrs = '0' + offset_hrs;
    }

    if (offset_min < 10) {
        offset_min = '0' + offset_min;
    }

    // Add an opposite sign to the offset
    // If offset is 0, it means timezone is UTC
    var timezone_standard;

    if (timezone_offset_minutes < 0)
        timezone_standard = '+ ' + offset_hrs  + offset_min;
    else if (timezone_offset_minutes > 0)
        timezone_standard = '- ' + offset_hrs  + offset_min;
    else if (timezone_offset_minutes == 0)
        timezone_standard = 'Z ';
    return timezone_standard;
}

$(document).ready(function() {
    var catalog_id = get_catalog_id();

    // chart 1 - stacked bar graph
    register_dropdowns(catalog_id, 'sbc1');
    update_chart(catalog_id, 'sbc1');
    window.addEventListener('resize', function() { update_chart(catalog_id, 'sbc1'); });
    
    // update last_updated
    var summary_url = DASHBOARD_API_URL + '/dcc_info';
    if (catalog_id != null) summary_url += '?catalogId=' + catalog_id;

    $.getJSON(summary_url, function(data) {
        var d = new Date(data['last_updated']);
        var formatted_date = get_formatted_date(d);
        $('#sbc1-last_updated').append('Last updated: ' + formatted_date);
    });

});
