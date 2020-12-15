/* global draw_donut_chart register_dropdowns register_donut_dropdown register_export_buttons update_chart */

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
    // chart 1 - stacked bar graph
    register_dropdowns('sbc1');
    update_chart('sbc1');

    // chart 2 - stacked bar graph
    register_dropdowns('sbc2');
    update_chart('sbc2');

    // chart 3 - donut graph
    $.getJSON('./data/dc-subjects-assay-anatomy.json', function(data) {
        register_donut_dropdown('dc1', data, 'data_type', 'subjects');
        register_export_buttons('dc1', data);
        draw_donut_chart('dc1', data, 'data_type', 'subjects');
    }).fail(function() {
        // TODO: Show something where the SVG would be.
        console.error('error');
    });

    // chart 4 - donut graph
    $.getJSON('./data/dc-samples-dcc-anatomy.json', function(data) {
        register_donut_dropdown('dc2', data, 'dcc', 'samples');
        register_export_buttons('dc2', data);
        draw_donut_chart('dc2', data, 'dcc', 'samples');
    }).fail(function() {
        // TODO: Show something where the SVG would be.
        console.error('error');
    });

    // display a single chart, hide the others
    function showChart(cnum) {
	for (var i = 1; i <= 4; ++i) {
	    $('#chart' + i).hide();
	    $('#thumb' + i).removeClass('selected');
	}
	$('#chart' + cnum).show();
	if (cnum == 1) update_chart('sbc1');
	if (cnum == 2) update_chart('sbc2');
	$('#thumb' + cnum).addClass('selected');
    }

    // display all charts
    function showAllCharts() {
	for (var i = 1; i <= 4; ++i) {
	    $('#chart' + i).show();
	    $('#thumb' + i).addClass('selected');
	}
	update_chart('sbc1');
	update_chart('sbc2');
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

    // TODO - set these individually based on API response
    // update last updated
    var summary_data_url = './data/summary.json';
    $.getJSON(summary_data_url, function(data) {
	var d = new Date(data['last_updated']);
        var formatted_date = get_formatted_date(d);
        $('#sbc1-last_updated').append('Last updated: ' + formatted_date);
	$('#sbc2-last_updated').append('Last updated: ' + formatted_date);
	$('#dc1-last_updated').append('Last updated: ' + formatted_date);
	$('#dc2-last_updated').append('Last updated: ' + formatted_date);
    });
    
});
