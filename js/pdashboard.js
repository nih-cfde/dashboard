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
});
