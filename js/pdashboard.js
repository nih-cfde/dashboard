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

function update_dcc_list(catalog_id, chart_id) {
    var dcc_list_url = DASHBOARD_API_URL + '/dcc';
    if (catalog_id != null) dcc_list_url += '?catalogId=' + catalog_id;
    var checkboxes = $('#sbc1-controls');
    var cbid = 1;
    
    get_json_retry(dcc_list_url, function(data) {
	data.forEach(dcc => {
	    $('<input />', { type: 'checkbox', id: 'dcc_cb'+cbid, value: dcc, checked: true }).appendTo(checkboxes);
	    checkboxes.append("&nbsp;");
	    $('<label />', { 'for': 'dcc_cb'+cbid, text: dcc }).appendTo(checkboxes);
	    checkboxes.append("<br clear='both'/>");
	    cbid = cbid + 1;
	});
    });
}

function select_all_dccs() {
    var checkboxes = $('#sbc1-controls');
    checkboxes.children('input').each(function(i, cb) {
	if (cb.type = 'checkbox') cb.checked = true;
    });
}

$(document).ready(function() {
    var catalog_id = get_catalog_id();

    // chart 1 - stacked bar graph
    register_dropdowns(catalog_id, 'sbc1');
    window.onload = function() {
	update_chart(catalog_id, 'sbc1');
	update_dcc_list(catalog_id, 'sbc1');
	window.addEventListener('resize', function() { window_resized(catalog_id, 'sbc1'); });
    };
});
