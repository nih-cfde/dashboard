/* global d3 saveSvgAsPng d3_save_svg */

var XVALS = ['dcc', 'data_type', 'disease', 'assay_type', 'species', 'anatomy', 'sex', 'race', 'ethnicity'];
var YVALS = ['volume', 'files', 'collections', 'samples', 'subjects'];
var REQUESTNUMS = {};

var chart_data = {};
var chart_data_urls = {};
var dcc_map = {};

function register_export_buttons(chart_id, data, x_axis, y_axis, scale) {
    // Prevent accumulations of click handlers by clearing any past
    // registrations of 'click' to the buttons by using jquery's off()
    // function.
    $('#export-png').off('click');
    $('#export-png').click(function () {
        var chart_id = $('#export-modal').attr('name').split('-')[0];
        export2png(chart_id, data, x_axis, y_axis, scale);
    });

    $('#export-svg').off('click');
    $('#export-svg').click(function () {
        var chart_id = $('#export-modal').attr('name').split('-')[0];
        export2svg(chart_id, data, x_axis, y_axis, scale);
    });

    $('#export-csv').off('click');
    $('#export-csv').click(function () {
        var chart_id = $('#export-modal').attr('name').split('-')[0];
        export2csv(chart_id);
    });
}

function update_dropdowns(chart_id) {
    var x_axis_val = $('#' + chart_id + '-x-axis option:checked').val();
    var y_axis_val = $('#' + chart_id + '-y-axis option:checked').val();
    var group_by_val = $('#' + chart_id + '-group-by option:checked').val();

    // is the current selection valid?
    var is_valid = x_axis_val != group_by_val;
    var x_opts = document.getElementById(chart_id + '-x-axis').options;
    var y_opts = document.getElementById(chart_id + '-y-axis').options;
    var gb_opts = document.getElementById(chart_id + '-group-by').options;

    var y_idx, gb_idx, is_ok;

    // if not, find a valid selection that includes the selected x_axis_val
    if (!is_valid) {
        var new_y = null;
        var new_gb = null;

        yv_loop:
        for (yv of YVALS) {
            for (gb of XVALS) {
                if (x_axis_val != gb) {
                    new_y = yv;
                    new_gb = gb;
                    break yv_loop;
                }
            }
        }

        group_by_val = new_gb;

        for (y_idx = 0; y_idx < y_opts.length; ++y_idx) {
            y_opts[y_idx].disabled = false;
            y_opts[y_idx].selected = (y_opts[y_idx].value == new_y);
        }

        for (gb_idx = 0; gb_idx < gb_opts.length; ++gb_idx) {
            gb_opts[gb_idx].disabled = false;
            gb_opts[gb_idx].selected = (gb_opts[gb_idx].value == new_gb);
        }
    }

    // enable x_axis choices that are valid given current group_by
    for (x_idx = 0; x_idx < x_opts.length; ++x_idx) {
        is_ok = (x_opts[x_idx].value != group_by_val);
        x_opts[x_idx].disabled = !is_ok;
    }

    // enable group_by choices that are valid given current x_axis
    for (gb_idx = 0; gb_idx < gb_opts.length; ++gb_idx) {
        is_ok = (x_axis_val != gb_opts[gb_idx].value);
        gb_opts[gb_idx].disabled = !is_ok;
    }
}

function register_dropdowns(catalog_id, chart_id) {
    $.each(['x-axis', 'y-axis', 'group-by', 'scale'], function (i, id) {
        $('#' + chart_id + '-' + id).change(function () {
            update_chart(catalog_id, chart_id);
        });
    });
}

function update_chart_title(chart_id) {
    // only op if there is a title to update
    if ($('#' + chart_id + '-title').length) {
        const heading = d3.select('#' + chart_id + '-title');
        var y_axis = d3.select('#' + chart_id + '-y-axis option:checked').text();
        var x_axis = d3.select('#' + chart_id + '-x-axis option:checked').text();
        var group_by = d3.select('#' + chart_id + '-group-by option:checked').text();
        var new_title = y_axis + ' by ' + x_axis + ' and ' + group_by;
        heading.text(new_title);
    }
}

function update_chart(catalog_id, chart_id) {
//    update_dropdowns(chart_id);

    var x_axis = $('#' + chart_id + '-x-axis option:checked').val();
    var y_axis = $('#' + chart_id + '-y-axis option:checked').val();
    var group_by = $('#' + chart_id + '-group-by option:checked').val();
    var scale = $('#' + chart_id + '-scale option:checked').val();

    // Given the x, y and group by information, we formulate the URL
    // to retrieve data from.
  //    var data_url = DASHBOARD_API_URL + '/stats/' + [y_axis, x_axis, group_by].join('/') + "?includeDCC=true";
    var data_url = DASHBOARD_API_URL + '/stats/' + [y_axis, x_axis].join('/') + "?includeDCC=true";
    if (catalog_id != null) data_url += '&catalogId=' + catalog_id;

    // check cache
    if (chart_data_urls[chart_id] == data_url) {
        register_export_buttons(chart_id, chart_data[chart_id], x_axis, y_axis, scale);
        draw_chart(chart_id, null, chart_data[chart_id], x_axis, y_axis, scale);
        return;
    }

    if (!(chart_id in REQUESTNUMS)) {
        REQUESTNUMS[chart_id] = 0;
    }
    const requestnum = ++REQUESTNUMS[chart_id];

    var data_fn = function (data) {
        // ignore out-of-sequence responses
        if (requestnum == REQUESTNUMS[chart_id]) {
            chart_data[chart_id] = data;
            chart_data_urls[chart_id] = data_url;
            register_export_buttons(chart_id, data, x_axis, y_axis, scale);
            draw_chart(chart_id, null, data, x_axis, y_axis, scale);
        }
    };
    var fail_fn = function (jqXHR, status, error) {
        // ignore out-of-sequence responses
        if (requestnum == REQUESTNUMS[chart_id]) {
            console.error('Error loading data for chart combination.');
            show_error(chart_id);
        }
    };
    get_json_retry(data_url, data_fn, fail_fn);
}

function compute_totals(data, keys) {
    // Modify the raw data by computing totals for each category
    data.forEach(function (category) {
        category.total = 0;
        // Iterate over the "data" array for the category, accumulate the total for
        // that category, and store it.
        keys.forEach(function (key) {
            if (key in category) {
                category.total += category[key];
            }
        });
    });

    return data;
}


function merge_within_groups_local(groups, max_atts, grouping1) {
    var new_groups = [];
    groups.forEach(group => {
        var new_group = {};
        var atts = [];

        // sort attributes by count
        var keys = d3.keys(group);
        keys.forEach(k => {
            if (k == grouping1) {
                new_group[k] = group[k];
            } else {
                atts.push({ 'att': k, 'count': group[k] });
            }
        });

        var sorted_atts = atts.sort((x, y) => y['count'] - x['count']);
        var i = 0;

        sorted_atts.map(a => a['att']).forEach(att => {
            new_att = att;
            if (i >= max_atts)
                new_att = 'other';
            if (!(new_att in new_group)) {
                new_group[new_att] = 0;
            }
            new_group[new_att] += group[att];
            i += 1;
        });
        new_groups.push(new_group);
    });

    return new_groups;
}

function merge_groups(groups, max_groups, grouping1) {
    // sort groups by total count, retain the max_groups with the highest counts
    var groups_w_count = [];
    groups.forEach(group => {
        var gwc = { 'group': group, 'total': 0 };
        groups_w_count.push(gwc);
        var keys = d3.keys(group);
        keys.forEach(k => {
            if (k != grouping1) {
                gwc['total'] += group[k];
            }
        });
    });

    var sorted_gwc = groups_w_count.sort((x, y) => y['total'] - x['total']);
    var sorted_groups = sorted_gwc.map(x => x['group']);

    var new_groups = [];
    var last_group = {};
    var i = 0;

    sorted_groups.forEach(group => {
        // add group to list
        if (i < max_groups) {
            new_groups.push(group);
        }
        // add group to last group
        else {
            var keys = d3.keys(group);
            keys.forEach(k => {
                if (k == grouping1) {
                    last_group[k] = 'other';
                } else {
                    if (k in last_group) {
                        last_group[k] += group[k];
                    }
                    else {
                        last_group[k] = group[k];
                    }
                }
            });
        }
        i += 1;
    });

    var gkeys = d3.keys(last_group);
    if (gkeys.length > 0) {
        new_groups.push(last_group);
    }
    return new_groups;
}

function getComputedLength() {
    return function () {
        let self = d3.select(this);
        let textLength = self.node().getComputedTextLength();
        return textLength;
    };
}

function ellipsize(width, padding) {
    return function () {
        let self = d3.select(this);
        let textLength = self.node().getComputedTextLength();
        let text = self.text();

        while (textLength > (width - 2 * padding) && text.length > 0) {
            text = text.slice(0, -1);
            self.text(text + '...');
            textLength = self.node().getComputedTextLength();
        }
    };
}

// set the color palette
var colorizer = d3.scaleOrdinal()
    .range([
        '#c0653d', '#138eae', '#f2cb2e', '#96c93e', '#aa8ec2',
        '#eb7e23', '#000000', '#edb21e', '#76c8ed', '#f0593b',
        '#d0c596', '#80cbb3', '#7da34a', '#1bbcc0', '#a28c33'
    ]);

function show_error(chart_id) {
    $('#' + chart_id).replaceWith(`
      <svg id="` + chart_id + `">
        <text text-anchor="middle" x="50%" y="50" fill="red">
          This chart data is not available at this time.
        </text>
      </svg>`);
}

function add_tooltip(chart_id, svg) {
    // Prep the tooltip bits, initial display is hidden
    var tooltip = svg.append('g')
        .attr('id', chart_id + '-tooltip')
        .attr('class', 'chart_tooltip')
        .style('display', 'none');

    let rect = tooltip.append('rect')
        .attr('width', 190)
        .attr('height', 40)
        .attr('class', 'chart_tooltip_rect');

    let text1 = tooltip.append('text')
        .attr('class', 'chart_tooltip_value')
        .attr('id', chart_id + '-x-category')
        .attr('x', 5)
        .attr('dy', '1.8em');
    text1.append('text').text('value here');

    tooltip.append('text')
        .attr('x', 5)
        .attr('dy', '3.2em')
        .attr('id', chart_id + '-y-category')
        .attr('class', 'chart_tooltip_value');
    // .attr('class', 'chart_tooltip_value');

}

function update_dcc_map() {
    var dcc_list_url = DASHBOARD_API_URL + '/dcc';
    get_json_retry(dcc_list_url, function(data) {
        data.forEach(dcc => {
            dcc_map[dcc['abbreviation']] = dcc['complete_name'];
        });
    });
}

function draw_chart(svg_id, svg, stacked_data, x_axis, y_axis, scale) {
  var logScale = (scale == "log");
  let draw_detached = (svg != null)
   if (!draw_detached) {
       svg = d3.select('#' + svg_id)
       $('#' + svg_id).empty();
    }

    update_chart_title(svg_id);
    update_dcc_map();

    var x_axis_label_rot = -35;
    var x_axis_label_dx = '-.8em';
    var x_axis_label_dy = '.5em';

    const y_map = {
        'volume': 'Data Volume (bytes)',
        'files': 'File Count',
        'collections': 'Collection Count',
        'samples': 'Sample Count',
        'subjects': 'Subject Count'
    };

    // Get the human readable y-axis name
    var y_title = y_map[y_axis];
    var categories_h = {};

    var include_dccs = {};
    var n_checkboxes = 0;
    var n_checked = 0;

    // apply optional filter by DCC to stacked_data, aggregate without 'dcc'
    var cd = $('#' + svg_id + '-controls');
    cd.find('input').each(function () {
        ++n_checkboxes;
        if (this.checked) {
            include_dccs[this.value] = true;
            ++n_checked;
        }
    });

    // filter stacked_data
    if ((n_checkboxes > 0) && (n_checked < n_checkboxes)) {
        new_stacked_data = [];
        stacked_data.forEach(d => {
            if (include_dccs[d['dcc']]) {
                new_stacked_data.push(d);
            }
        });
        stacked_data = new_stacked_data;
    }

    // aggregate by DCC
    new_stacked_data = [];
    new_by_x = {};
    stacked_data.forEach(d => {
        var dcc = d['dcc'];
        var xval = d[x_axis];
        if (!(xval in new_by_x)) {
            new_by_x[xval] = {};
            new_by_x[xval][x_axis] = xval;
            new_stacked_data.push(new_by_x[xval]);
        }
        // add counts
        var keys = d3.keys(d);
        keys.forEach(k => {
            if ((k != x_axis) && (k != 'dcc')) {
                if (!(k in new_by_x[xval])) {
                    new_by_x[xval][k] = d[k];
                } else {
                    new_by_x[xval][k] += d[k];
                }
            }
        });
    });
    stacked_data = new_stacked_data;

    // apply group limits
    // if (MAX_GRAPH_GROUP1 != null)
    //     stacked_data = merge_within_groups_local(stacked_data, MAX_GRAPH_GROUP1, x_axis);
    // if (MAX_GRAPH_GROUP2 != null)
    //     stacked_data = merge_groups(stacked_data, MAX_GRAPH_GROUP2, x_axis);

    // Can't assume that y-axis keys will be the same in each list element,
    // must take union across them all.
    stacked_data.forEach(d => {
        var keys = d3.keys(d);
        keys.forEach(k => {
            if ((k != x_axis) && (k != 'total') && (k != 'dcc')) {
                if (!(k in categories_h)) categories_h[k] = 0;
                categories_h[k] += d[k];
            }
        });
    });

    // sort y-axis categories in descending order
    var categories = d3.keys(categories_h).sort((x, y) => categories_h[y] - categories_h[x]);

    // For each element of the data (an object), we compute the
    // total and save it, because we will need to display the total
    // height/value of the stacked bar.
    stacked_data = compute_totals(stacked_data, categories);

    // With the totals now calculated, we can use that to re-sort
    // the array containing data. We want to display the chart
    // in descending 'total' order.
    stacked_data.sort(function (a, b) { return b.total - a.total; });

    var stack = d3.stack().keys(categories);
    var series = stack(stacked_data);

    // add x index to series so it's not lost when empty bars are filtered
    series.forEach(s => {
        var j = 0;
        s.forEach(t => t.push(j++));
    });

    const top_margin = 35;
    const bottom_margin = draw_detached ? 320 : 80;
    var left_margin = 60;
    var right_margin = 10;

    // svg_width determined by enclosing div
    var svg_style = window.getComputedStyle(svg.node());
    var svg_height;
    var svg_width;
    var grandparent_width;

    if (svg_style.height == "") {
        svg_height = 800;
        svg_width = 1200;
        grandparent_width = svg_width;
    } else {
        svg_height = parseInt(svg_style.height);
        svg_width = parseInt(svg_style.width);
        grandparent_width = $('#' + svg_id).parent().parent().width();
    }

    svg_width = stacked_data.length * 40;
    if (svg_width < grandparent_width) {
        svg_width = grandparent_width;
    }
    svg.attr('width', svg_width);

    if (svg_width < 200) svg_width = 200;
    if (svg_height < 200) svg_height = 300;

    var legend_width = svg_width * 0.3;
    var show_bar_totals = true;
  
    if (legend_width > 350) {
        legend_width = 350;
    }

    // switch to more (horizontally) compact layout
    if (svg_width < 400) {
        legend_width = 0;
        right_margin = 10;
        x_axis_label_rot = -90;
        x_axis_label_dx = '-1em';
        x_axis_label_dy = '-0.5em';
        d3.select('#' + svg_id + '-last_updated').style('display', 'none');
        d3.select('#' + svg_id + '-form-row').style('flex-wrap', 'wrap');
    } else {
        d3.select('#' + svg_id + '-last_updated').style('display', null);
        d3.select('#' + svg_id + '-form-row').style('flex-wrap', 'nowrap');
    }

    const width = svg_width - left_margin - right_margin; // - legend_width;
    const height = svg_height - top_margin - bottom_margin - 20; // 20 for scrolling bar
    svg.attr('height', svg_height);

    const chart = svg.append('g')
        .attr('transform', `translate(${left_margin}, ${top_margin})`);

    // Configure the x-axis scale to use discrete values from the
    // data, which are taken from the x_axis key from each object.
    scale_max_range = width; //(width > 1000) ? 1000 : width;
    const xScale = d3.scaleBand()
        .range([0, scale_max_range])
        .domain(stacked_data.map((s) => s[x_axis]))
        .padding(0.2);

    // guess whether there's enough space to display stacked bar totals
    var xbw = xScale.bandwidth();
    if (xbw < 35) {
        show_bar_totals = false;
    }

    if (logScale) {
      y_title = "log10 (" + y_title +")";
    }
  
    // Configure the y-axis scale. It goes from 0 to the maximum
    // value (the height of the tallest stacked bar). We have already
    // computed this and stored the total in each objects "total" key.
    var yScale = null;
    if (logScale) {
      yScale = d3.scaleLog()
        .range([height, 0])
        .domain([1, d3.max(stacked_data.map((s) => s.total))]).nice();
    } else {
      yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(stacked_data.map((s) => s.total))]).nice();
    }
  
    var num_bars = stacked_data.length;
    function maxlen_fn(text, index) {
        // final bar has less space due to color key
        // return ((x_axis_label_rot != 90) && (index + 1 == num_bars)) ? 13 : 28;
        return (x_axis_label_rot != -90) ? 20 : 14;
    }

    var tlc = 0;
    function trim_labels(text, maxlen_fn) {
        text.each(function () {
            var node = d3.select(this);
            var label = node.text();
            var ml = maxlen_fn(label, tlc++);
            if (!draw_detached && (label.length > (ml - 3))) {
                node.text(label.substring(0, ml - 3) + '...');
            }
            node.append('title').text(label);
        });
    }

    // Add the x-axis
    chart.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('.tick text')
        .style("text-anchor", "end")
        .call(trim_labels, maxlen_fn)
        .attr('dx', x_axis_label_dx)
        .attr('dy', x_axis_label_dy)
        .attr('text-anchor', 'start')
        .attr('transform', 'rotate(' + x_axis_label_rot + ')');
    
    var y_formatter = d3.format('.2s');
    var comma_formatter = d3.format(',');
    var large_number_formatter = d3.format('.2s');

    // Add the y-axis
    chart.append('g')
        .call(
          d3.axisLeft(yScale)
            .tickFormat(function (d) { return y_formatter(d); }).ticks(5)
        );

    chart.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.2)
        .call(d3.axisLeft()
            .scale(yScale)
            .tickSize(-width, 0, 0)
            .tickFormat('').ticks(5)
        );

    var groups = chart.selectAll()
        .data(series)
        .enter()
        .append('g');

    // Add the stacked bar height/value floating above the stacked bar
    chart
        .append('g')
        .attr('class', 'totals')
        .selectAll('text')
        .data(stacked_data)
        .enter()
        .append('text')
        .attr('class', 'bar-total')
        .attr('x', (a) => xScale(a[x_axis]) + xScale.bandwidth() / 2)
        .attr('y', function(a) {
	  var t = a.total;
	  if (logScale && (t < 1)) t = 1;
	  return yScale(t) - 5;
	})
        .attr('text-anchor', 'middle')
        .attr('fill', '#000')
        .text((a) => {
            if (!show_bar_totals) return '';
            if (a.total > 999999) {
                return `${large_number_formatter(a.total)}`;
            } else {
                return `${comma_formatter(a.total)}`;
            }
        });

    // Add the y-axis label
    svg.append('text')
        .attr('x', -(height / 2 + top_margin))
        .attr('y', 20)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .text(y_title);

    // limit categories
    // var max_categories = 14;
    add_tooltip(svg_id, svg);
    var tooltip = d3.select('#' + svg_id + '-tooltip');
    var title_fn = function (d) { return d[x_axis]; };
    var text_fn = function (d) { return 'what?'; };

    if (legend_width > 0) {
        legend_height = stacked_data.length * 20;
        $('#' + svg_id + '_container').empty();
        var legendSVG = d3.select('#' + svg_id + '_container')
            .append('svg')
            .attr('height', legend_height)
            .attr('width', '100%')
            .attr('preserveAspectRatio', 'xMinYMin');
      add_legend(svg_id, stacked_data, x_axis, 0, legend_width, legendSVG, categories, null, title_fn, text_fn, left_margin, 0);
    }

    groups.selectAll('rect')
        .data(function (d, i) { return series[i]; })
        .enter()
        .filter(function (s, j) { return !isNaN(s[0]) && !isNaN(s[1]); })
        .append('rect')
        .attr('x', function (s, j) { return xScale(stacked_data[s[2]][x_axis]); })
        .attr('y', (s) => yScale(s[1]))
        .attr('width', xScale.bandwidth())
        .attr('height', (s) => height - yScale(s[1] - s[0]))
        .attr('fill', function (a, b) { return colorizer(b); })
        .on('mouseenter', function (actual, i) {
            d3.select(this)
                .transition()
                .duration(100)
                .attr('stroke', '#000');
        })
        .on('mouseleave', function (actual, i) {
            d3.select(this)
                .transition()
                .duration(100)
                .attr('stroke', 'none');
        })
        .on('mouseover', function () { tooltip.style('display', null); })
        .on('mouseout', function () { tooltip.style('display', 'none'); })
        .on('mousemove', function (d, e) {
            var brick_num = d3.select(this.parentNode).datum();
            let series_idx = d3.select(this).datum()[2];
            var brick_name = brick_num.key;
            var brick_value = 0;
            let coords = d3.mouse(this);
            let xPosition = coords[0];  // distance from y-axis on chart
            let yPosition = coords[1];  // distance from top of chart

            let tooltip_width = $('.chart_tooltip_rect').width();

            if (d[1] - d[0] > 999999) {
                brick_value = large_number_formatter(d[1] - d[0]);
            } else {
                brick_value = comma_formatter(d[1] - d[0]);
            }
            var x_axis_selection = $('#' + svg_id + '-x-axis option:checked').val();
            var x_axis_val = stacked_data[series_idx][x_axis_selection];
            var y_axis_val = brick_value;
            var group_val = brick_name;
            var group_key = $('#' + svg_id + '-group-by option:checked').text();
            var x_axis_key = $('#' + svg_id + '-x-axis option:checked').text();
            var y_axis_key = $('#' + svg_id + '-y-axis option:checked').text();

            if (x_axis_key == "CF Program") {
                if (x_axis_val in dcc_map) {
                    x_axis_val = x_axis_val + ":" + dcc_map[x_axis_val];
                }
            }
            if (group_key == "CF Program") {
                if (group_val in dcc_map) {
                    // group_val = dcc_map[group_val];
                    group_val = group_val + ": " + dcc_map[group_val];
                }
            }
            x_cat_text = $('#' + svg_id + '-x-category').html("<tspan class='chart_tooltip_title'>" + x_axis_key + ":</tspan> " + x_axis_val);
            z_cat_text = $('#' + svg_id + '-z-category').html("<tspan class='chart_tooltip_title'>" + group_key + ":</tspan> " + group_val);
            y_cat_text = $('#' + svg_id + '-y-category').html("<tspan class='chart_tooltip_title'>" + y_axis_key + ":</tspan> " + y_axis_val);

            let x_width = 0;
            let y_width = 0;
            let z_width = 0;
            x_cat_text.each(function () { x_width = d3.select(this).node().getComputedTextLength(); });
            y_cat_text.each(function () { y_width = d3.select(this).node().getComputedTextLength(); });
            z_cat_text.each(function () { z_width = d3.select(this).node().getComputedTextLength(); });
            tip_width = Math.max(x_width, y_width, z_width);
            $('.chart_tooltip_rect').width(tip_width + 10);

            // Get the series index that we are hovering over so we can compute the
            // the x value to use (if we wish to lock it down).
            // let series_idx = d3.select(this).datum()[2];
            // let seriesX = xScale(stacked_data[series_idx][x_axis]);
            // let tooltipX = seriesX;

            let tooltipX = xPosition + left_margin - (tooltip_width / 2);
            let tooltipY = yPosition - 45;  // Get the tooltip above the mouse position

            // Prevent the tooltip from starting from out-of-bounds
            if (tooltipX < 1) {
                tooltipX = 1;
            }

            if (tooltipY < -10) {
                tooltipY = -10;
            }

            tooltip.attr('transform', 'translate(' + tooltipX + ',' + tooltipY + ')');
        });
}

function add_legend(svg_id, stacked_data, x_axis, chart_width, legend_width, chart, categories, tooltip, title_fn, text_fn, x_offset, y_offset, mouseover_fn, mouseout_fn) {
    var top = 0;
    // Create the legend
    var legend = chart.append('g').selectAll('.legend')
        .data(stacked_data)
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function (d, i) {
            return 'translate(0,' + (top + i * 20) + ')';
        })
        .on('mouseover', function (d, e) {
            if (tooltip != null) tooltip.style('display', null);
            if (mouseover_fn != null) mouseover_fn(d, e);
        })
        .on('mouseout', function (d, e) {
            if (tooltip != null) tooltip.style('display', 'none');
            if (mouseout_fn != null) mouseout_fn(d, e);
        })
        .on('mousemove', function (d, e) {
            if (tooltip == null) return;
            var tooltip_title = title_fn(d);
            var tooltip_text = text_fn(d);

          var brick_name = d[x_axis];
            $('#' + svg_id + '-brick-value').text(tooltip_text);
            let text = $('#' + svg_id + '-brick-category');
            text.append('tspan').text(brick_name).each(ellipsize(190, 5));

            let coords = d3.mouse(this);
            let xPosition = coords[0];  // distance from y-axis on chart
            let yPosition = coords[1];  // distance from top of chart

            let tooltip_width = $('.chart_tooltip_rect').width();
            let tooltipX = xPosition + x_offset - tooltip_width;
            let tooltipY = yPosition + y_offset - 50;  // Get the tooltip above the mouse position
            tooltipY += (top + e * 20);

            // Prevent the tooltip from starting from out-of-bounds
            if (tooltipX < 1) {
                tooltipX = 1;
            }

            if (tooltipY < 1) {
                tooltipY = 1;
            }

            tooltip.attr('transform', 'translate(' + tooltipX + ',' + tooltipY + ')');
        });

    legend.append('rect')
        // .attr('x', chart_width + 28)
        .attr('x', chart_width)
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', function (d, i) { return colorizer(i); });

    legend.append('text')
        .attr('x', chart_width + 25)
        .attr('y', 8)
        .attr('dy', '.35em')
        .attr('font-family', 'sans-serif')
        .style('font-size', '0.7rem')
        .text(title_fn) //.each(ellipsize(legend_width - 15, 5))
    .append('title').text(title_fn);
}

function export_chart_data(svg_id) {
    $('#export-modal').attr('name', svg_id + '-modal');
    $('#export-modal').modal();
}

function save_csv(filename, rows) {
    var processRow = function (row) {
        var finalVal = '';
        for (var j = 0; j < row.length; j++) {
            var innerValue = row[j] == null ? '' : row[j].toString();

            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            }

            var result = innerValue.replace(/"/g, '""');

            if (result.search(/("|,|\n)/g) >= 0) {
                result = '"' + result + '"';
            }

            if (j > 0) {
                finalVal += ',';
            }

            finalVal += result;
        }
        return finalVal + '\n';
    };

    var csvFile = '';

    for (var i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }

    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });

    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement('a');

        // Feature detection
        if (link.download !== undefined) {
            // Browsers that support the HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

function draw2svg(chart_id, data, x_axis, y_axis, scale) {
    // redraw chart with unlimited label length
    let svg_obj = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let svg = d3.select(svg_obj);
    let svg_id = chart_id + '-export2svg';
    svg.attr('id', svg_id);
    svg.attr('style', 'height: 800px;');
    draw_chart(chart_id, svg, data, x_axis, y_axis, scale);
    // append new SVG element to document - ensures that CSS styles are propagated
    let newdiv = document.createElement('div');
    let nd = d3.select(newdiv);
    nd.attr('id', 'div_' + svg_id);
    // use 1x1 div to hide the SVG element
    nd.attr('style', 'width: 1px; height: 1px; overflow: hidden;');
    let attached_svg = d3.select('body').append(() => nd.node());
    nd.append(() => svg.node());
    return { 'svg': svg, 'attached': attached_svg, 'div': newdiv };
}

function export2png(chart_id, data, x_axis, y_axis, scale) {
    // Hide the export button
    $('#' + chart_id + '-export-button').hide();
    dsvg = draw2svg(chart_id, data, x_axis, y_axis, scale);
    let options = { backgroundColor: 'white' };
    saveSvgAsPng(dsvg['svg'].node(), 'chart.png', options).then(function () {
        // redisplay the export button
        dsvg['div'].remove();
        $('#' + chart_id + '-export-button').show();
    });
}

function export2svg(chart_id, data, x_axis, y_axis, scale) {
    $('#' + chart_id + '-export-button').hide();
    dsvg = draw2svg(chart_id, data, x_axis, y_axis, scale);
    var config = {
        filename: 'chart'
    };
    d3_save_svg.save(dsvg['svg'].node(), config);
    // redisplay the export button
    dsvg['div'].remove();
    $('#' + chart_id + '-export-button').show();
}

function export2csv(chart_id) {
    var chdata = chart_data[chart_id];
    var filename = 'chart.csv';

    var data = [];
    var all_fields_d = {};
    var all_fields = [];
    var total_field = null;

    chdata.forEach(function (obj_row) {
        d3.keys(obj_row).forEach(function (field) {
            if ((field == 'total') || (field == 'Total')) {
                total_field = field;
            }
            else if (!(field in all_fields_d)) {
                all_fields_d[field] = true;
                all_fields.push(field);
            }
        });
    });

    // place total last
    if (total_field != null) all_fields.push(total_field);

    data[0] = all_fields;
    var index = 1;

    chdata.forEach(function (obj_row) {
        data[index] = [];

        all_fields.forEach(function (field) {
            if ((field in obj_row) && (obj_row[field] != null)) {
                data[index].push(obj_row[field]);
            } else {
                data[index].push(0);
            }
        });

        index++;
    });

    save_csv(filename, data);
}
