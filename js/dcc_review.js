/* globals draw_chart register_export_buttons show_error */

const UPDATE_DELAY_SECS = 0.05;
var update_pending = false;
var last_update_time = null;

// FAIR vars
var metrics_chart_width = 0;
var metrics_chart_height = 0;
var fair_metrics_left_svg;
var fair_metrics_right_svg;


function window_resized(catalog_id, chart_id) {
    last_update_time = new Date().getTime();
    const utime = last_update_time;
    setTimeout(function() {
      if (utime < last_update_time) return;
      update_chart(catalog_id, chart_id);
    }, UPDATE_DELAY_SECS * 1000);
}

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
        draw_chart(chart_id, null, data, group1, count);
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

function pad_zeroes(number) {
    if (number < 10) {
        return '0' + number;
    }
    return number;
}

function get_formatted_date(d) {
    // Returns a date as a string in the following format: "2020-10-09 17:32:32 - 0400"
    var month = d.getMonth() + 1;
    var day = d.getDate();
    var minutes = d.getMinutes();
    var seconds = d.getSeconds();

    month = pad_zeroes(month);
    day = pad_zeroes(day);
    minutes = pad_zeroes(minutes)
    seconds = pad_zeroes(seconds);

    var formatted = d.getFullYear() + '-' + month + '-' + day
            + ' ' + d.getHours() + ':' + minutes + ':' + seconds
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
function get_chaise_uri(catalog_id, entity, DCC_NID="") {
    var base_uri = DERIVA_URL + '/chaise/recordset/#' + catalog_id;

    // Chaise/DERIVA facet string to show only top-level subprojects
    var top_project_facet_str = LZString.compressToEncodedURIComponent('{"and":[{"source":[{"inbound":["CFDE","project_in_project_child_fkey"]},{"outbound":["CFDE","project_in_project_parent_fkey"]},"nid"],"choices":["' + DCC_NID + '"]}]}');
    // Chaise/DERIVA facet string to show all subprojects
    var all_project_facet_str = LZString.compressToEncodedURIComponent('{"and":[{"source":[{"inbound":["CFDE","project_in_project_child_fkey"]},{"outbound":["CFDE","project_in_project_parent_fkey"]},{"inbound":["CFDE","project_in_project_transitive_member_fkey"]},{"outbound":["CFDE","project_in_project_transitive_leader_fkey"]},"nid"],"choices":["' + DCC_NID + '"]}]}');

    var i = entity.indexOf('_with_');

    // single entity, no explicit join (except for project)
    if (i == -1) {
        // trim trailing 's'
        if (entity.slice(-1) == 's') {
	    entity = entity.slice(0, entity.length - 1);
        }
        var chaise_uri = base_uri + '/CFDE:' + entity;
        if (entity == 'project') {
	    chaise_uri += '/*::facets::' + all_project_facet_str;
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
        var chaise_facet = '{"and":[{"source":[{"inbound":["CFDE","' + from_fkey + '"]},{"outbound":["CFDE","' + to_fkey + '"]},"nid"],"not_null":true}]}';
        var facet_str = LZString.compressToEncodedURIComponent(chaise_facet);
        return base_uri + '/CFDE:' + from + '/*::facets::' + facet_str;
    }
}

function add_summary_data(catalog_id, DCC, num_dccs) {
  var dcc_summary_url = DASHBOARD_API_URL + '/dcc/' + DCC['id'];
  if (catalog_id != null) dcc_summary_url += '?catalogId=' + catalog_id;

  // counts for top-level entities, except project
  get_json_retry(dcc_summary_url, function (data) {
    Object.keys(data).forEach(function (key) {
      if (key.endsWith('_count') && (!key.startsWith('toplevel_project'))) {
        var entity = key.slice(0, key.length - '_count'.length);
        var name = 'Total ' + key.charAt(0).toUpperCase() + key.slice(1, key.length - '_count'.length) + 's';
        // database was changed to prefer using/sending "nid" instead of "RID" since RID will change from catalog to catalog
        var chaise_uri = get_chaise_uri(catalog_id, entity, data['nid']);
        $('#' + key).html('<a href="' + chaise_uri + '">' + data[key].toLocaleString() + '</a>');
      }
    });

    $('#dcc_name').append(data['complete_name']);
    var data_url = DERIVA_URL + '/chaise/recordset/#registry/CFDE:datapackage';
    if (data['datapackage_RID'] != null) {
      data_url += '/RID=' + data['datapackage_RID'];
    }
    
    $('#datapackage_link1').prop('href', data_url);
    $('#datapackage_link1').prepend(data_url);
    $('#datapackage_link2').prop('href', data_url);
    $('#data_review_title')[0].innerHTML = data['abbreviation'] + ' Data Review';

    if (num_dccs == 1) {
      $('#data_snapshot_title')[0].innerHTML = data['abbreviation'] + ' Data Snapshot';
    } else {
      $('#data_snapshot_title')[0].innerHTML = 'Data Snapshot';
    }
    var d = new Date(data['last_updated']);
    var formatted_date = get_formatted_date(d);
    $('#last_updated').append('Last updated: ' + formatted_date);
  });

  // counts for top-level entities with links to other entities of a specified type (e.g., Subjects with File)
  var dcc_linkcount_url = DASHBOARD_API_URL + '/dcc/' + DCC['id'] + '/linkcount';
  if (catalog_id != null) dcc_linkcount_url += '?catalogId=' + catalog_id;

  get_json_retry(dcc_linkcount_url, function (data) {
    // iterate over keys like "subject_count" and "subject_with_biosample_count"
    // remove "_count", append an 's' at the end of the first word, make
    // first and last words title case, and replace "_" with " "
    Object.keys(data).forEach(function (key) {
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

        var chaise_uri = get_chaise_uri(catalog_id, name.toLowerCase(), data['RID']);
        name = name.replace(/_/g, ' ');
        $('#data_breakdown_table >> #' + key).html('<a href="' + chaise_uri + '">' + data[key].toLocaleString() + '</a>');
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

function metrics_width(w) {
  return w - 300;
}

function init_metrics_chart() {
  // set the dimensions and margins of the graph
  var margin = { top: 20, right: 30, bottom: 40, left: 0 };
  metrics_chart_height = 400 - margin.top - margin.bottom;
  metrics_chart_width = 570;

  // append the svg object to the body of the page
  fair_metrics_left_svg = d3.select("#fair_graph_left")
    .append("svg")
    .attr("width", "100%")
    .attr("height", metrics_chart_height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  fair_metrics_right_svg = d3.select("#fair_graph_right")
    .append("svg")
    .attr("width", "100%")
    .attr("height", metrics_chart_height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");
}

function update_metrics_chart(catalog_id, chart_id) {

  var data_url = DASHBOARD_API_URL + '/fair/' + catalog_id;

  if (!(chart_id in REQUESTNUMS)) {
    REQUESTNUMS[chart_id] = 0;
  }
  const requestnum = ++REQUESTNUMS[chart_id];

  // define the success and failure callbacks
  var data_fn = function (data) {
    // ignore out-of-sequence responses
    if (requestnum == REQUESTNUMS[chart_id]) {
      chart_data[chart_id] = data;
      chart_data_urls[chart_id] = data_url;
      draw_metrics_chart(chart_id, data);
    }
  };
  var fail_fn = function (jqXHR, status, error) {
    // ignore out-of-sequence responses
    if (requestnum == REQUESTNUMS[chart_id]) {
      console.error('Error loading data for chart.');
      show_error(chart_id);
    }
  };

  // get the data and invoke the appropriate callback
  get_json_retry(data_url, data_fn, fail_fn);
}


function draw_metrics_chart(chart_id, data) {

  // if no metrics returned
  if (data.length == 0) {
    // set contents of "fair_metrics_wrapper" to be something like: "No metrics for data submission."
    $('#' + chart_id).html("<p>No FAIR metrics loaded for this submission.</p>");
    return;
  }

  if (data.length % 2 == 0) {
    data1 = data.slice(0, data.length / 2);
    data2 = data.slice(data.length / 2);
  } else {
    data1 = data.slice(0, (data.length + 1) / 2);
    data2 = data.slice((data.length + 1) / 2);
  }

  // Add X axis
  var x = d3.scaleLinear()
    .domain([0, 100])
    .range([0, metrics_width(metrics_chart_width) ]);

  fair_metrics_left_svg.append("g")
    .attr("transform", "translate(0," + metrics_chart_height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  fair_metrics_right_svg.append("g")
    .attr("transform", "translate(0," + metrics_chart_height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Y axis
  var y1 = d3.scaleBand()
    .range([0, metrics_chart_height])
    .domain(data1.map(function (d) { return d.name;  }))
    .padding(.1);
  var y2 = d3.scaleBand()
    .range([0, metrics_chart_height])
    .domain(data2.map(function (d) { return d.name; }))
    .padding(.1);
  fair_metrics_left_svg.append("g")
    .call(d3.axisLeft(y1))
    .style("font-size", "1rem");
  fair_metrics_right_svg.append("g")
    .call(d3.axisLeft(y2))
    .style("font-size", "1rem");

  // truncate y axis labels and add ellipses 
  fair_metrics_left_svg.selectAll('text').each(ellipsize(310,5));
  fair_metrics_right_svg.selectAll('text').each(ellipsize(310,5));

  var tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("background", "#FFF")
    .style("border", "2px solid black")
    .style("padding-left", "5px")
    .style("padding-right", "5px")
    .text("a simple tooltip");


  fair_metrics_left_svg.selectAll()
    .data(data1)
    .enter()
    .append("rect")
    .attr("x", function (d) { return 0; })
    .attr("y", function (d) { return y1(d.name); })
    .attr("width", function (d) { 
        let bar_size = (metrics_width(metrics_chart_width)) * d.fair_count / d.total_count;
        if (bar_size == 0)
          return 1;
        return bar_size;
    })
    .attr("height", y1.bandwidth())
    .attr("fill", "#edb21e")
    .on("mouseover", function (d) { tooltip.text(d.fair_count + " / " + d.total_count); return tooltip.style("visibility", "visible"); })
    .on("mousemove", function () { return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 15) + "px"); })
    .on("mouseout", function () { return tooltip.style("visibility", "hidden"); });

  var maxw = 0;

  fair_metrics_left_svg.selectAll("text").each(function () {
    if (this.getBBox().width > maxw) {
      maxw = this.getBBox().width;
    }
  });
  maxw += 10;
  fair_metrics_left_svg.attr("transform", "translate(" + maxw + ",0)");
  fair_metrics_left_svg.attr("preserveAspectRatio", "xMinYMin meet")
  fair_metrics_left_svg.attr("viewBox", "0 0 960 500")

  var maxw = 0;
  fair_metrics_right_svg.selectAll("text").each(function () {
    if (this.getBBox().width > maxw) {
      maxw = this.getBBox().width;
    }
  });
  maxw += 10;
  fair_metrics_right_svg.attr("transform", "translate(" + maxw + ",0)");


  fair_metrics_right_svg.selectAll()
    .data(data2)
    .enter()
    .append("rect")
    .attr("x", function (d) { return x(0) })
    .attr("y", function (d) { return y2(d.name); })
    .attr("width", function (d) { 
        let bar_size = (metrics_width(metrics_chart_width)) * d.fair_count / d.total_count;
        if (bar_size == 0)
          return 1;
        return bar_size;
    })
    .attr("height", y2.bandwidth())
    .attr("fill", "#edb21e")
    .on("mouseover", function (d) { tooltip.text(d.fair_count + " / " + d.total_count); return tooltip.style("visibility", "visible"); })
    .on("mousemove", function () { return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"); })
    .on("mouseout", function () { return tooltip.style("visibility", "hidden"); })
};


$(document).ready(function() {
    init_metrics_chart();
    var catalog_id = get_catalog_id();
    var dcc = null;
    // the DCC review page assumes that the specified catalog contains data for a single DCC only
    var dcc_list_url = DASHBOARD_API_URL + '/dcc';
    if (catalog_id != null && typeof chaiseConfig != 'undefined' ) { 
        chaiseConfig.defaultCatalog = catalog_id;
        dcc_list_url += '?catalogId=' + catalog_id;
    }

    loadScript("/chaise/lib/navbar/navbar.app.js");

    register_dropdowns(catalog_id, 'review_bc1');
    update_chart(catalog_id, 'review_bc1');

    get_json_retry(dcc_list_url, function(data) {
        if (data.length != 1) {
	        console.log('WARNING: DERIVA CATALOG_ID  ' + catalog_id + ' contains ' + ((data.length > 1) ? 'data from multiple DCsC' : 'no data'));
        }
  console.log("Data length is: " + data.length);
	if (data.length > 0) {
	    dcc = data[0];
	    add_summary_data(catalog_id, dcc, data.length);
        }
    });

    update_metrics_chart(catalog_id, 'fair_metrics_wrapper');

    window.addEventListener('resize', function() { window_resized(catalog_id, 'review_bc1'); });
});
