/* global register_dropdowns update_chart */

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
            + ' ' + d.getHours() + ':' + d.getMinutes();
            // + ':' + d.getSeconds()
            //+ ' ' + get_time_zone_diff(d);

    return formatted;
}

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
// END copied from dcc_review.js

function update_saved_queries() {
    var saved_queries_url = DASHBOARD_API_URL + '/user/saved_queries';
    
    var dataset = []
    
    get_json_retry(saved_queries_url, function(data) {
        data.forEach(query => {
            dataset.push([query['name'],query['creation_ts'],query['last_execution_ts'],query['description'],query['query']]);
        });
        var dt = $('#saved_query_table').DataTable( {
            data: dataset,
            columnDefs: [
                {
                    targets: [ 0 ],
                    width: "50%",
                    render: function ( data, type, row ) {
                        value = data;
                        if (data.length > 52)
                            value = data.substr( 0, 52 ) + '…';
                        return '<span class="row_hover" title="' + row[0] + ' - ' + row[3] + '"><a href="' + row[4] + '" target="_blank">'+ value +'</a></span>';
                    }
                },
                {
                    targets: [ 1, 2 ],
                    width: "25%",
                    render: function ( data, type, row ) {
                        var d = new Date(data);
                        value = get_formatted_date(d);
                        return value;
                    }
                },
                {
                    "targets": [ 3, 4 ],
                    "visible": false
                }
            ],
            columns: [
                { title: "Query Name" },
                { title: "Creation Date" },
                { title: "Last Queried" },
                { title: "Description" }, // col 3 which is invisible
                { title: "Query"} // col 4 which is invisible
            ]
        });
        dt.columns.adjust().draw();
    });
}

function update_dcc_list(catalog_id, chart_id) {
    var dcc_list_url = DASHBOARD_API_URL + '/dcc';
    if (catalog_id != null) dcc_list_url += '?catalogId=' + catalog_id;
    var checkboxes = $('#' + chart_id + '-controls');
    var cbid = 1;
    
    get_json_retry(dcc_list_url, function(data) {
	data.forEach(dcc => {
	    $('<input />', { type: 'checkbox', id: 'dcc_cb'+cbid, value: dcc['abbreviation'], class: 'form-check-input', checked: true }).appendTo(checkboxes);
	    $('<label />', { 'for': 'dcc_cb'+cbid, text: dcc['abbreviation'], title: dcc['complete_name'], class: 'form-check-label checkbox-inline' }).appendTo(checkboxes);
	    checkboxes.append("<br clear='both'/>");
	    cbid = cbid + 1;
	});

	checkboxes.on("change", ":checkbox", function() {
	    update_chart(catalog_id, chart_id);
	});
	checkboxes.on("change", ":button", function() {
	    update_chart(catalog_id, chart_id);
	});
    });
}

function select_all_dccs(chart_id) {
    var checkboxes = $('#' + chart_id + '-controls');
    checkboxes.children('input').each(function(i, cb) {
	if (cb.type = 'checkbox') cb.checked = true;
    });
    var catalog_id = get_catalog_id();
    update_chart(catalog_id, chart_id);
}

$(document).ready(function() {
    var catalog_id = get_catalog_id();

    // chart 1 - stacked bar graph
    register_dropdowns(catalog_id, 'sbc1');
    window.onload = function() {
	update_dcc_list(catalog_id, 'sbc1');
	update_chart(catalog_id, 'sbc1');
	window.addEventListener('resize', function() { window_resized(catalog_id, 'sbc1'); });
    };
    update_saved_queries();

    // format the saved query data as a datatable
    //$('#saved_query_table').DataTable();
    //$('.dataTables_length').addClass('bs-select');
    //$('#saved_query_table').DataTable().draw();


});
