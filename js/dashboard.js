/* global draw_donut_chart register_dropdowns register_donut_dropdown register_export_buttons update_chart */

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
	$('#thumb' + cnum).addClass('selected');
    }

    // display all charts
    function showAllCharts() {
	for (var i = 1; i <= 4; ++i) {
	    $('#chart' + i).show();
	    $('#thumb' + i).addClass('selected');
	}
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

});
