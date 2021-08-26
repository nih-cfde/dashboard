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
        if (data.length == 0) {
            var dt = $('#saved_query_table');
            dt.addClass('saved_query_message');
            dt.append($("<tr><td class='saved_query_message'>To save a search, browse the data portal and click the 'saved searches' button in the upper-right corner of the screen.</td></tr>"));
        }
        else {
            data.forEach(query => {
                dataset.push([query['name'],query['creation_ts'],query['last_execution_ts'],query['description'],query['query']]);
            });
            var dt = $('#saved_query_table').DataTable( {
                "language": {
                    "emptyTable": "No saved searches"
                },
                data: dataset,
                columnDefs: [
                    {
                        targets: [ 0 ],
                        width: "50%",
                        render: function ( data, type, row ) {
                            value = data;
                            if (data.length > 52)
                                value = data.substr( 0, 52 ) + '…';
                            return '<span class="row_hover" title="' + row[0] + ' - ' + row[3] + '"><a href="' + row[4] + '" target="chaise">'+ value +'</a></span>';
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
                    { title: "Search Name" },
                    { title: "Creation Date" },
                    { title: "Last Searched" },
                    { title: "Description" }, // col 3 which is invisible
                    { title: "Search"} // col 4 which is invisible
                ]
            });
            dt.columns.adjust().draw();
        }
    });
}

var fav_dccs = [];

function update_favorites() {
    var favorites_url = DASHBOARD_API_URL + '/user/favorites';
    
    get_json_retry(favorites_url, function(data) {
    
        // favorite is a json object with keys "dcc", "anatomy", and "assay"
        // and values are a arrays of objects with keys "name", "description"
        // e.g. {"anatomy": [{"name": "blood", "description": "A fluid that is composed of blood plasma and erythrocytes."}, 
        //                   {"name": "lung", "description": "Respiration organ that develops as an oupocketing of the esophagus."}]}
        Object.keys(data).forEach(favorite_type => {
            let ul;
            if (favorite_type == "anatomy") 
                ul = $('#favorite-anatomies');
            else if (favorite_type == "dcc") 
                ul = $('#favorite-dccs');
            else if (favorite_type == "assay")
                ul = $('#favorite-assays');
            else
                return; //continue

            if (data[favorite_type].length == 0) {
                ul.append($("<li class='favorite'>To add a favorite, browse the data portal and click on the star associated with a facet.</li>"));  
            }
            
            Object.keys(data[favorite_type]).forEach(key => {
                list_index = key;
                favorite_list = data[favorite_type][list_index];
                ul.append($("<li class='favorite'><a href='" + favorite_list["url"] + "' target='chaise'>" + favorite_list["name"] + "</a></li>"));
                if (favorite_type == "dcc") {
                    fav_dccs.push(favorite_list["id"]);
                }
            });
        });

        // now that favorites are loaded, load chart
        var catalog_id = get_catalog_id();
        update_dcc_list(catalog_id, 'sbc1');
    });
}

function update_dcc_list(catalog_id, chart_id) {
    var dcc_list_url = DASHBOARD_API_URL + '/dcc';
    if (catalog_id != null) dcc_list_url += '?catalogId=' + catalog_id;
    var checkboxes = $('#' + chart_id + '-controls');
    var cbid = 1;
    
    get_json_retry(dcc_list_url, function(data) {
	data.forEach(dcc => {
        let checkbox_selected = (fav_dccs.length && fav_dccs.includes(dcc['id']));
	    $('<input />', { type: 'checkbox', id: 'dcc_cb'+cbid, value: dcc['abbreviation'], class: 'form-check-input', checked: checkbox_selected }).appendTo(checkboxes);
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
    update_chart(catalog_id, 'sbc1');
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

function redirect_unauth_user(){
    if (window.location.hostname == "localhost") 
        return;
    
    var success_fn = function(data) {
        try {     
            var auth = false;
            data["attributes"].forEach(index => {
                if (index["id"].indexOf('96a2546e-fa0f-11eb-be15-b7f12332d0e5') >= 0)
                    auth = true;
                    return;
            });
            if (auth)
                return;
            
            window.location.replace("udashboard.html");
        } catch (error) {
            console.log(error);
            window.location.replace("udashboard.html");
        }
    };

    var error_fn = function(jqXHR, status, error) {
        window.location.replace("udashboard.html");
    };

    var url = window.location.origin + "/authn/session";
    $.getJSON(url, success_fn).fail(error_fn);
}


$(document).ready(function() {

    var catalog_id = get_catalog_id();
    redirect_unauth_user();
    // chart 1 - stacked bar graph
    register_dropdowns(catalog_id, 'sbc1');
    update_favorites();
    update_saved_queries();
    window.onload = function() {
        window.addEventListener('resize', function() { window_resized(catalog_id, 'sbc1'); });
    };
});
