/* global register_dropdowns update_chart */

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

// Construct Chaise URI for the specified entity.
//
// entity - 'subject', 'biosample', 'file', 'project', or 'X_with_Y'
//           where X in ('subjects', 'biosamples', 'files')
//           and Y in ('subject', 'biosample', 'file')
function get_chaise_uri(catalog_id, DCC, entity) {
    // TODO - DERIVA server name and default catalog id should be in config file
    var base_uri = 'http://app.nih-cfde.org/chaise/recordset/#' + catalog_id;

    // TODO - this depends on hard-coded foreign key names
    // Chaise/DERIVA facet string to show only projects with subprojects
    var project_facet_str = LZString.compressToEncodedURIComponent('{"and":[{"source":[{"inbound":["CFDE","project_in_project_parent_fkey"]},{"outbound":["CFDE","project_in_project_child_fkey"]},{"inbound":["CFDE","project_in_project_transitive_leader_fkey"]},{"outbound":["CFDE","project_in_project_transitive_member_fkey"]},"RID"],"not_null":true}]}');    

    var i = entity.indexOf('_with_');

    // single entity, no explicit join (except for project)
    if (i == -1) {
	// trim trailing 's'
	if (entity.slice(-1) == 's') {
	    entity = entity.slice(0, entity.length - 1);
	}
	var chaise_uri = base_uri + '/CFDE:' + entity;
	if (entity == 'project') {
	    chaise_uri += '/*::facets::' + project_facet_str + '@sort(RID)';
	}
	return chaise_uri;
    }
    // multiple entities
    else {
	var from = entity.slice(0,i-1);
	var to = entity.slice(i+6);
	var facet_str = '';
	var fkey_str = ENTITY_FKEYS[from + ":" + to];
	var from_fkey = fkey_str + '_' + from + '_fkey';
	var to_fkey = fkey_str + '_' + to + '_fkey';
	var chaise_facet = '{"and":[{"source":[{"inbound":["CFDE","' + from_fkey + '"]},{"outbound":["CFDE","' + to_fkey + '"]},"RID"],"not_null":true}]}';
	var facet_str = LZString.compressToEncodedURIComponent(chaise_facet);
	return base_uri + '/CFDE:' + from + '/*::facets::' + facet_str + '@sort(RID)';
    }
}

function add_summary_data(catalog_id, DCC) {
    var data_totals_table = $('#data_total_table');
    var data_preview_table = $('#data_preview_table');
    var summary_data_url = './data/' + DCC + '/' + DCC + '-summary.json';

    // counts for top-level entities, except project
    $.getJSON(summary_data_url, function(data) {
        Object.keys(data).forEach(function(key) {
            if (key.endsWith('_count')) {
		var entity =  key.slice(0, key.length - '_count'.length);
                var name = 'Total ' + key.charAt(0).toUpperCase() + key.slice(1, key.length - '_count'.length) + 's';
		var chaise_uri = get_chaise_uri(catalog_id, DCC, entity);
                var markup = '<tr><td>' + name + '</td><td><a href="' + chaise_uri + '">' + data[key].toLocaleString() + '</a></td></tr>';
                data_totals_table.append(markup);
                data_preview_table.append(markup);
            }
        });

        $('#dcc_name').append(data['complete_name']);
        $('#dcc_link').prop('href', data['url']);
        $('#dcc_link').prepend(data['url']);
        $('#data_snapshot_title').prepend(data['moniker'] + ' ');
        var d = new Date(data['last_updated']);
        var formatted_date = get_formatted_date(d);
        $('#last_updated').append('Last updated: ' + formatted_date);
    });

    // counts for top-level projects (i.e., those linked to a sub-project)
    var chaise_uri = get_chaise_uri(catalog_id, DCC, 'project');
    summary_data_url = './data/' + DCC + '/' + DCC +  '-projects.json';

    $.getJSON(summary_data_url, function(data) {
        var name = 'Total Projects';
        var value = data.length;
        var markup = '<tr><td>' + name + '</td><td><a href="' + chaise_uri + '">' + value + '</a></td></tr>';
        data_totals_table.append(markup);
        data_preview_table.append(markup);
    });

    // counts for top-level entities with links to other entities of a specified type (e.g., Subjects with File)
    var linkcount_data_url = './data/' + DCC + '/' + DCC + '-linkcount.json';
    var data_breakdown_table = $('#data_breakdown_table');

    $.getJSON(linkcount_data_url, function(data) {
        // iterate over keys like "subject_count" and "subject_with_biosample_count"
        // remove "_count", append an 's' at the end of the first word, make
        // first and last words title case, and replace "_" with " "
        Object.keys(data).forEach(function(key) {
            if (key.endsWith('_count')) {
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

		var chaise_uri = get_chaise_uri(catalog_id, DCC, name.toLowerCase());
                name = name.replace(/_/g, ' ');
                var markup = '<tr><td>' + name + '</td><td><a href="' + chaise_uri + '">' + data[key].toLocaleString() + '</a></td></tr>';
                data_breakdown_table.append(markup);
            }
        });
    });
}

function add_summary_data(catalog_id) {
    var data_preview_table = $('#data_preview_table');
    var summary_data_url = './data/summary.json';

    // counts for top-level entities, except project
    $.getJSON(summary_data_url, function(data) {
        Object.keys(data).forEach(function(key) {
            if (key.endsWith('_count')) {
		var entity =  key.slice(0, key.length - '_count'.length);
                var name = 'Total ' + key.charAt(0).toUpperCase() + key.slice(1, key.length - '_count'.length) + 's';
		var chaise_uri = get_chaise_uri(catalog_id, null, entity);
                var markup = '<tr><td>' + name + '</td><td><a href="' + chaise_uri + '">' + data[key].toLocaleString() + '</a></td></tr>';
                data_preview_table.append(markup);
            }
        });

        $('#dcc_name').append(data['complete_name']);
        $('#dcc_link').prop('href', data['url']);
        $('#dcc_link').prepend(data['url']);
        $('#data_snapshot_title').prepend(data['moniker'] + ' ');
        var d = new Date(data['last_updated']);
        var formatted_date = get_formatted_date(d);
        $('#last_updated').append('Last updated: ' + formatted_date);
    });

    // counts for top-level projects (i.e., those linked to a sub-project)
    var chaise_uri = get_chaise_uri(catalog_id, null, 'project');
    summary_data_url = './data/projects.json';

    $.getJSON(summary_data_url, function(data) {
        var name = 'Total Projects';
        var value = data.length;
        var markup = '<tr><td>' + name + '</td><td><a href="' + chaise_uri + '">' + value + '</a></td></tr>';
        data_totals_table.append(markup);
        data_preview_table.append(markup);
        var d = new Date(data['last_updated']);
        var formatted_date = get_formatted_date(d);
        $('#last_updated').append('Last updated: ' + formatted_date);
    });
}

$(document).ready(function() {
    $('#search-collections').click(function() {
        location.href = '/chaise/recordset/#1/CFDE:collection';
    });

    var CATALOG_ID = 1;

    // chart 1 - stacked bar graph
    register_dropdowns('sbc1');
    update_chart('sbc1');
    add_summary_data(CATALOG_ID);
});
