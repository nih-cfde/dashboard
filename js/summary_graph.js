/* global register_dropdowns update_chart */

// TODO - copied from dcc_review.js; put into a cental location
function pad_zeroes(number) {
    if (number < 10) {
        return '0' + number;
    }
    return number;
}

function get_formatted_date(d) {
    // Returns a date as a string in the following format: "2020-10-09 17:32:32 - 0400"
    var month = d.getMonth() + 1;
    var day = d.getDate();
    var minutes = d.getMinutes();
    var seconds = d.getSeconds();

    month = pad_zeroes(month);
    day = pad_zeroes(day);
    minutes = pad_zeroes(minutes)
    seconds = pad_zeroes(seconds);

    var formatted = d.getFullYear() + '-' + month + '-' + day
            + ' ' + d.getHours() + ':' + minutes + ':' + seconds
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

const UPDATE_DELAY_SECS = 0.05;
var update_pending = false;
var last_update_time = null;

function window_resized(catalog_id, chart_id) {
    last_update_time = new Date().getTime();
    const utime = last_update_time;
    setTimeout(function() {
      if (utime < last_update_time) return;
	update_chart(catalog_id, chart_id); 
    }, UPDATE_DELAY_SECS * 1000);
}

$(document).ready(function() {
    var catalog_id = get_catalog_id();
  
    // chart 1 - stacked bar graph
    register_dropdowns(catalog_id, 'sbc1');

	update_chart(catalog_id, 'sbc1');
	window.addEventListener('resize', function() { window_resized(catalog_id, 'sbc1'); });
});
