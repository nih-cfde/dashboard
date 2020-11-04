/* global register_dropdowns update_chart */

$(document).ready(function() {
    $('#search-collections').click(function() {
        location.href = '/chaise/recordset/#1/CFDE:collection';
    });

    // chart 1 - stacked bar graph
    register_dropdowns('sbc1');
    update_chart('sbc1');
});
