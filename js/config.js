/* global */

// dev
const DASHBOARD_API_URL='/dashboard-api';
const DERIVA_URL='';

const MAX_GRAPH_GROUP1 = 12;
const MAX_GRAPH_GROUP2 = 12;

const MAX_DONUT_GROUP1 = 15;
const MAX_DONUT_GROUP2 = 12;

const MAX_AJAX_ATTEMPTS = 5;

// read DERIVA catalog id from URL
function get_catalog_id() {
    var url = new URL(window.location.href);
    var catalog_id = url.searchParams.get("catalogId");
    return catalog_id;
}

// data_fn - only called if request is successful
// fail_fn - called on *each* failure 
function get_json_retry(url, data_fn, fail_fn, attempt=1) {

    var success_fn = function(data) {
	data_fn(data);
    };
    
    var error_fn = function(jqXHR, status, error) {
//	console.log("url=" + url + " FAIL status=" + status + " error=" + error);
	if (fail_fn != null) fail_fn(jqXHR, status, error);
	
	if (attempt < MAX_AJAX_ATTEMPTS) {
	    var sleep_secs = Math.pow(2,attempt);
	    setTimeout(() => get_json_retry(url, data_fn, fail_fn, attempt+1), sleep_secs * 1000);
	}
    };
    
    $.getJSON(url, success_fn).fail(error_fn);
}
