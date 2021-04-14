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
    var base_uri = DERIVA_URL + '/chaise/recordset/#' + catalog_id;

    // TODO - this depends on hard-coded foreign key names
    // Chaise/DERIVA facet string to show only top-level subprojects
    var project_facet_str = LZString.compressToEncodedURIComponent('{"and":[{"source":[{"inbound":["CFDE","project_in_project_child_fkey"]},{"outbound":["CFDE","project_in_project_parent_fkey"]},{"inbound":["CFDE","project_in_project_transitive_member_fkey"]},{"outbound":["CFDE","project_in_project_transitive_leader_fkey"]},"RID"],"not_null":true},{"source":[{"inbound":["CFDE","project_in_project_child_fkey"]},{"outbound":["CFDE","project_in_project_parent_fkey"]},{"inbound":["CFDE","project_in_project_child_fkey"]},{"outbound":["CFDE","project_in_project_parent_fkey"]},"RID"],"choices":[null]}]}');
    
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
        var from = entity.slice(0, i - 1);
        var to = entity.slice(i + 6);
        var fkey_str = ENTITY_FKEYS[from + ':' + to];
        var from_fkey = fkey_str + '_' + from + '_fkey';
        var to_fkey = fkey_str + '_' + to + '_fkey';
        var chaise_facet = '{"and":[{"source":[{"inbound":["CFDE","' + from_fkey + '"]},{"outbound":["CFDE","' + to_fkey + '"]},"RID"],"not_null":true}]}';
        var facet_str = LZString.compressToEncodedURIComponent(chaise_facet);
        return base_uri + '/CFDE:' + from + '/*::facets::' + facet_str + '@sort(RID)';
    }
}

function add_summary_data(catalog_id) {
    var data_preview_table = $('#data_preview_table');
    var summary_url = DASHBOARD_API_URL + '/dcc_info';
    if (catalog_id != null) summary_url += '?catalogId=' + catalog_id;

    // counts for top-level entities
    get_json_retry(summary_url, function(data) {
        if (catalog_id == null) {
	    catalog_id = data['catalog_id'];
	    update_chaise_urls(catalog_id);
        }

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
    });
}

// set/update Chaise URLs with the correct Chaise URL and de the catalog id
function update_chaise_urls(catalog_id) {
    // "Search all Files" button
    $('#search-all').click(function() {
        location.href = '/chaise/recordset/#' + catalog_id + '/CFDE:file';
    });

    // all anchor links (i.e., <a href=...>)
    var chaise_re = /\/chaise\/recordset\/#/;

    d3.selectAll('a').each(function() {
        if (this.href.match(chaise_re)) {
	    this.href = this.href.replace(/^.*\/chaise\/recordset\/#\d+\//, DERIVA_URL + '/chaise/recordset/#' + catalog_id + '/');
        }
    });
}

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

$(document).ready(function() {
    var catalog_id = get_catalog_id();
    if (catalog_id != null) update_chaise_urls(catalog_id);

    // chart 1 - stacked bar graph
    register_dropdowns(catalog_id, 'sbc1');
    window.onload = function() {
      update_chart(catalog_id, 'sbc1');
      add_summary_data(catalog_id);
      window.addEventListener('resize', function() { window_resized(catalog_id, 'sbc1'); });
    };
});
