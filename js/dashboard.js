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

});
