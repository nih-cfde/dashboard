/* global draw_donut_chart register_dropdowns register_donut_dropdown register_export_buttons update_chart update_donut_chart */

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

function redirect_auth_user() {
    var success_fn = function(data) {
        try {     
            var auth = false;
            data["attributes"].forEach(index => {
                if (index["id"].indexOf('96a2546e-fa0f-11eb-be15-b7f12332d0e5') >= 0)
                    auth = true;
                    return;
            });
            if (auth)
                window.location.replace("pdashboard.html");
            
        } catch (error) {
            console.log(error);
        }
    };

    var error_fn = function(jqXHR, status, error) {
        return;
    };

    var url = window.location.origin + "/authn/session";
    $.getJSON(url, success_fn).fail(error_fn);
}

$(document).ready(function() {
    redirect_auth_user();
    var catalog_id = get_catalog_id();

    register_export_buttons();
  
    // chart 1 - stacked bar graph
    register_dropdowns(catalog_id, 'sbc1');
    update_chart(catalog_id, 'sbc1');

    // chart 2 - stacked bar graph
    register_dropdowns(catalog_id, 'sbc2');
    update_chart(catalog_id, 'sbc2');

    var dc1_data = null;
    var dc2_data = null;

    // chart 3 - donut graph
    var count = 'subjects';
    var group1 = 'assay_type';
    var group2 = 'anatomy';
    var dc1_url = DASHBOARD_API_URL + '/stats/' + [count, group1, MAX_DONUT_GROUP1, group2, MAX_DONUT_GROUP2].join('/');
    if (catalog_id != null) dc1_url += '?catalogId=' + catalog_id;
    
    var dc1_data_fn =  function(data) {
        dc1_data = data;
        register_donut_dropdown('dc1', data, 'data_type', count);
        register_export_buttons('dc1', data);
        draw_donut_chart('dc1', data, 'data_type', count);
    };
    var dc1_fail_fn = function() {
        // TODO: Show something where the SVG would be.
    };

    get_json_retry(dc1_url,dc1_data_fn,dc1_fail_fn);

    // chart 4 - donut graph
    count = 'samples';
    group1 = 'dcc';
    group2 = 'anatomy';
    var dc2_url = DASHBOARD_API_URL + '/stats/' + [count, group1, MAX_DONUT_GROUP1, group2, MAX_DONUT_GROUP2].join('/');
    if (catalog_id != null) dc2_url += '?catalogId=' + catalog_id;

    var dc2_data_fn = function(data) {
        dc2_data = data;
        register_donut_dropdown('dc2', data, 'dcc', 'samples');
        register_export_buttons('dc2', data);
        draw_donut_chart('dc2', data, 'dcc', 'samples');
    };
    var dc2_fail_fn = function() {
        // TODO: Show something where the SVG would be.
    };
    
    get_json_retry(dc2_url, dc2_data_fn, dc2_fail_fn);

    // display a single chart, hide the others
    function showChart(cnum) {
        for (var i = 1; i <= 4; ++i) {
	        $('#chart' + i).hide();
	        $('#thumb' + i).removeClass('selected');
        }
        $('#chart' + cnum).show();
        if (cnum == 1) update_chart(catalog_id, 'sbc1');
        if (cnum == 2) update_chart(catalog_id, 'sbc2');
        if (cnum == 3) update_donut_chart('dc1', dc1_data, 'data_type', 'subjects');
        if (cnum == 4) update_donut_chart('dc2', dc2_data, 'dcc', 'samples');
        $('#thumb' + cnum).addClass('selected');
    }

    // display all charts
    function showAllCharts() {
        for (var i = 1; i <= 4; ++i) {
     	    $('#chart' + i).show();
    	    $('#thumb' + i).addClass('selected');
        }
        update_chart(catalog_id, 'sbc1');
        update_chart(catalog_id, 'sbc2');
        update_donut_chart('dc1', dc1_data, 'data_type', 'subjects');
        update_donut_chart('dc2', dc2_data, 'dcc', 'samples');
    }

    // enable interactive chart selection by clicking thumbnails
    for (var i = 1; i <= 4; ++i) {
        const cnum = i;
        $('#thumb' + cnum).off('click');
        $('#thumb' + cnum).click(function() {
            showChart(cnum);
        });
    }

    $('#expand_all').click(function() {
        showAllCharts();
    });

    window.addEventListener('resize', function() { window_resized(catalog_id, 'sbc1'); });

});
