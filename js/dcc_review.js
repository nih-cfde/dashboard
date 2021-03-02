/* globals draw_chart register_export_buttons show_error */

function populate_chart(catalog_id, chart_id) {

    // summary info to display
    var count = 'files';
    var group1 = 'assay';
    var group2 = 'anatomy';

    var data_url = DASHBOARD_API_URL + '/stats/' + [count, group1, MAX_GRAPH_GROUP1, group2, MAX_GRAPH_GROUP2].join('/');
    if (catalog_id != null) data_url += '?catalogId=' + catalog_id;

    var data_fn = function(data) {
        $('#' + chart_id).replaceWith('<svg id="' + chart_id + '"/>');
        register_export_buttons(chart_id, data);
        draw_chart(chart_id, data, group1, count);
    };

    var fail_fn = function(jqXHR, status, error) {
        console.error('Error loading data for DCC review chart combination.');
        show_error(chart_id);
    };
    
    get_json_retry(data_url, data_fn, fail_fn);
}

function titleCase(str) {
    str = str.toLowerCase().split(' ');

    for (var i = 0; i < str.length; i++) {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }

    return str.join(' ');
}

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

// TODO - foreign key names are CFDE schema-dependent
// TODO - move this to a config file
var ENTITY_FKEYS = {
    'subject:biosample': 'biosample_from_subject',
    'subject:file': 'file_describes_subject',
    'biosample:subject': 'biosample_from_subject',
    'biosample:file': 'file_describes_biosample',
    'file:subject': 'file_describes_subject',
    'file:biosample': 'file_describes_biosample'
};

// Construct Chaise URI for the specified entity.
//
// entity - 'subject', 'biosample', 'file', 'project', or 'X_with_Y'
//           where X in ('subjects', 'biosamples', 'files')
//           and Y in ('subject', 'biosample', 'file')
function get_chaise_uri(catalog_id, entity, DCC_RID="") {
    var base_uri = DERIVA_URL + '/chaise/recordset/#' + catalog_id;

    // Chaise/DERIVA facet string to show only top-level subprojects
    var top_project_facet_str = LZString.compressToEncodedURIComponent('{"and":[{"source":[{"inbound":["CFDE","project_in_project_child_fkey"]},{"outbound":["CFDE","project_in_project_parent_fkey"]},"RID"],"choices":["' + DCC_RID + '"]}]}');
    // Chaise/DERIVA facet string to show all subprojects
    var all_project_facet_str = LZString.compressToEncodedURIComponent('{"and":[{"source":[{"inbound":["CFDE","project_in_project_child_fkey"]},{"outbound":["CFDE","project_in_project_parent_fkey"]},{"inbound":["CFDE","project_in_project_transitive_member_fkey"]},{"outbound":["CFDE","project_in_project_transitive_leader_fkey"]},"RID"],"choices":["' + DCC_RID + '"]}]}');
    
    var i = entity.indexOf('_with_');

    // single entity, no explicit join (except for project)
    if (i == -1) {
        // trim trailing 's'
        if (entity.slice(-1) == 's') {
	    entity = entity.slice(0, entity.length - 1);
        }
        var chaise_uri = base_uri + '/CFDE:' + entity;
        if (entity == 'project') {
	    chaise_uri += '/*::facets::' + all_project_facet_str + '@sort(RID)';
        }
        return chaise_uri;
    }
    // multiple entities
    else {
        var from = entity.slice(0, i - 1);
        var to = entity.slice(i + 6);
        var facet_str = '';
        var fkey_str = ENTITY_FKEYS[from + ':' + to];
        var from_fkey = fkey_str + '_' + from + '_fkey';
        var to_fkey = fkey_str + '_' + to + '_fkey';
        var chaise_facet = '{"and":[{"source":[{"inbound":["CFDE","' + from_fkey + '"]},{"outbound":["CFDE","' + to_fkey + '"]},"RID"],"not_null":true}]}';
        var facet_str = LZString.compressToEncodedURIComponent(chaise_facet);
        return base_uri + '/CFDE:' + from + '/*::facets::' + facet_str + '@sort(RID)';
    }
}

function add_summary_data(catalog_id, DCC, num_dccs) {
    var data_totals_table = $('#data_total_table');
    var data_preview_table = $('#data_preview_table');
    var dcc_summary_url = DASHBOARD_API_URL + '/dcc/' + DCC;
    if (catalog_id != null) dcc_summary_url += '?catalogId=' + catalog_id;

    // counts for top-level entities, except project
    get_json_retry(dcc_summary_url, function(data) {
        Object.keys(data).forEach(function(key) {
            if (key.endsWith('_count') && (!key.startsWith('toplevel_project'))) {
                var entity =  key.slice(0, key.length - '_count'.length);
                var name = 'Total ' + key.charAt(0).toUpperCase() + key.slice(1, key.length - '_count'.length) + 's';
                var chaise_uri = get_chaise_uri(catalog_id, entity, data['RID']);
                var markup = '<tr><td>' + name + '</td><td><a href="' + chaise_uri + '">' + data[key].toLocaleString() + '</a></td></tr>';
                data_totals_table.append(markup);
                data_preview_table.append(markup);
	    }
	});

        $('#dcc_name').append(data['complete_name']);
	var data_url = DERIVA_URL + '/chaise/recordset/#registry/CFDE:datapackage';
	if (data['datapackage_RID'] != null) data_url += '/RID=' + data['datapackage_RID'];
	
        $('#datapackage_link').prop('href', data_url);
        $('#datapackage_link').prepend(data_url);
	$('#data_review_title')[0].innerHTML = data['moniker'] +  ' Data Review';
	
	if (num_dccs == 1) {
            $('#data_snapshot_title')[0].innerHTML = data['moniker'] +  ' Data Snapshot';
	} else {
            $('#data_snapshot_title')[0].innerHTML =  'Data Snapshot';
	}
        var d = new Date(data['last_updated']);
        var formatted_date = get_formatted_date(d);
        $('#last_updated').append('Last updated: ' + formatted_date);
    });

    // counts for top-level entities with links to other entities of a specified type (e.g., Subjects with File)
    var dcc_linkcount_url = DASHBOARD_API_URL + '/dcc/' + DCC + '/linkcount';
    if (catalog_id != null) dcc_linkcount_url += '?catalogId=' + catalog_id;
    var data_breakdown_table = $('#data_breakdown_table');

    get_json_retry(dcc_linkcount_url, function(data) {
        // iterate over keys like "subject_count" and "subject_with_biosample_count"
        // remove "_count", append an 's' at the end of the first word, make
        // first and last words title case, and replace "_" with " "
        Object.keys(data).forEach(function(key) {
	    if (key.endsWith('_count') && (!key.startsWith('toplevel_project'))) {
                var name = key.slice(0, key.length - '_count'.length);
                name = name.charAt(0).toUpperCase() + name.slice(1);
                var idx = name.indexOf('_');

                if (idx == -1) {
                    name = name + 's';
                } else {
                    name = name.replace('_', 's_');
                }

                idx = name.lastIndexOf('_');

                if (idx > 0) {
                    name = name.slice(0, idx + 1) + name.charAt(idx + 1).toUpperCase() + name.slice(idx + 2);
                }

                var chaise_uri = get_chaise_uri(catalog_id, name.toLowerCase());
                name = name.replace(/_/g, ' ');
                var markup = '<tr><td>' + name + '</td><td><a href="' + chaise_uri + '">' + data[key].toLocaleString() + '</a></td></tr>';
                data_breakdown_table.append(markup);
            }
        });
    });
}

function loadScript(url) {
    var script = document.querySelector('script[src^="' + url + '"]');
    if (script) {
        // we're assuming that file injection = file loaded
        // NOTE this assumption is not correct if these files are loaded dynamically by other sources
        return;
    }

    script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", url);
    document.getElementsByTagName('head')[0].appendChild(script);
}

$(document).ready(function() {
    var catalog_id = get_catalog_id();
    var dcc = null;
    // the DCC review page assumes that the specified catalog contains data for a single DCC only
    var dcc_list_url = DASHBOARD_API_URL + '/dcc';
    if (catalog_id != null) {
        chaiseConfig.defaultCatalog = catalog_id;
        dcc_list_url += '?catalogId=' + catalog_id;
    }

    loadScript("/chaise/lib/navbar/navbar.app.js");
    
    register_dropdowns(catalog_id, 'review_bc1');
    // workaround for #63
    setTimeout(() => { update_chart(catalog_id, 'review_bc1')}, 2000);
    
    get_json_retry(dcc_list_url, function(data) {
        if (data.length != 1) {
	    console.log('WARNING: DERIVA CATALOG_ID  ' + catalog_id + ' contains ' + ((data.length > 1) ? 'data from multiple DCCs' : 'no data'));
        }
	if (data.length > 0) {
	    dcc = data[0];
	    add_summary_data(catalog_id, dcc, data.length);
        }
    });
});
