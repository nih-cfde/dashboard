/* global d3 saveSvgAsPng d3_save_svg */

var XVALS = ['dcc', 'data_type', 'assay', 'species', 'anatomy'];
var YVALS = ['files', 'volume', 'samples', 'subjects'];
var REQUESTNUMS = {};

var chart_data = {};

function register_export_buttons(chart_id, data) {
    chart_data[chart_id] = data;

    // Prevent accumulations of click handlers by clearing any past
    // registrations of 'click' to the buttons by using jquery's off()
    // function.
    $('#export-png').off('click');
    $('#export-png').click(function() {
        var chart_id = $('#export-modal').attr('name').split('-')[0];
        export2png(chart_id);
    });

    $('#export-svg').off('click');
    $('#export-svg').click(function() {
        var chart_id = $('#export-modal').attr('name').split('-')[0];
        export2svg(chart_id);
    });

    $('#export-csv').off('click');
    $('#export-csv').click(function() {
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
    if (! is_valid) {
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
        x_opts[x_idx].disabled = ! is_ok;
    }

    // enable group_by choices that are valid given current x_axis
    for (gb_idx = 0; gb_idx < gb_opts.length; ++gb_idx) {
	is_ok = (x_axis_val != gb_opts[gb_idx].value);
        gb_opts[gb_idx].disabled = ! is_ok;
    }
}

function register_dropdowns(catalog_id, chart_id) {
    $.each(['x-axis', 'y-axis', 'group-by', 'scale'], function(i, id) {
        $('#' + chart_id + '-' + id).change(function() {
            update_chart(catalog_id, chart_id);
        });
    });
}

function update_chart_title(chart_id) {
    // only op if there is a title to update
    if ( $('#' + chart_id + '-title').length ) {
        const heading = d3.select('#' + chart_id + '-title');
        var y_axis = d3.select('#' + chart_id + '-y-axis option:checked').text();
        var x_axis = d3.select('#' + chart_id + '-x-axis option:checked').text();
        var group_by = d3.select('#' + chart_id + '-group-by option:checked').text();
        var new_title = y_axis + ' by ' + x_axis + ' and ' + group_by;
        heading.text(new_title);
    }
}

function update_chart(catalog_id, chart_id) {
    update_dropdowns(chart_id);

    var x_axis = $('#' + chart_id + '-x-axis option:checked').val();
    var y_axis = $('#' + chart_id + '-y-axis option:checked').val();
    var group_by = $('#' + chart_id + '-group-by option:checked').val();
    var scale = $('#' + chart_id + '-scale option:checked').val();

    // Given the x, y and group by information, we formulate the URL
    // to retrieve data from.
    var data_url = DASHBOARD_API_URL + '/stats/' + [y_axis, x_axis, MAX_GRAPH_GROUP1, group_by, MAX_GRAPH_GROUP2].join('/');
    if (catalog_id != null) data_url += '?catalogId=' + catalog_id;

    if (!(chart_id in REQUESTNUMS)) {
	REQUESTNUMS[chart_id] = 0;
    }
    const requestnum = ++REQUESTNUMS[chart_id];
    
    var data_fn = function(data) {
	// ignore out-of-sequence responses
	if (requestnum == REQUESTNUMS[chart_id]) {
            $('#' + chart_id).replaceWith('<svg id="' + chart_id + '"/>');
            register_export_buttons(chart_id, data);
            draw_chart(chart_id, data, x_axis, y_axis, scale);
	}
    };
    var fail_fn = function(jqXHR, status, error) {
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
    data.forEach(function(category) {
        category.total = 0;
        // Iterate over the "data" array for the category, accumulate the total for
        // that category, and store it.
        keys.forEach(function(key) {
            if (key in category) {
                category.total += category[key];
            }
        });
    });

    return data;
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
        '#c0653d', '#f0593b', '#eb7e23', '#edb21e', '#f2cb2e',
        '#d0c596', '#a28c33', '#96c93e', '#7da34a', '#80cbb3',
        '#1bbcc0', '#138eae', '#76c8ed', '#aa8ec2', '#ef7e34'
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
        .attr('height', 50)
        .attr('class', 'chart_tooltip_rect');

    let text1 = tooltip.append('text')
        .attr('class', 'chart_tooltip_title')
        .attr('id', chart_id + '-brick-category')
        .attr('x', 5)
        .attr('dy', '1.8em');

    tooltip.append('text')
        .attr('x', 5)
        .attr('dy', '3.4em')
        .attr('id', chart_id + '-brick-value')
        .attr('class', 'chart_tooltip_value');
}

function draw_chart(svg_id, stacked_data, x_axis, y_axis, scale) {
    var logScale = (scale == "log");
    update_chart_title(svg_id);

    var x_axis_label_rot = 25;
    var x_axis_label_dx = '-.8em';
    var x_axis_label_dy = '.5em';

    const y_map = {
        'files': 'File Count',
        'volume': 'Data Volume in bytes',
        'samples': 'Sample Count',
        'subjects': 'Subject Count'
    };

    // Get the human readable y-axis name
    var y_title = y_map[y_axis];
    
    var categories_h = {};

    // Can't assume that y-axis keys will be the same in each list element,
    // must take union across them all.
    stacked_data.forEach(d => {
        var keys = d3.keys(d);
        keys.forEach(k => {
            if (k != x_axis) {
                if (! (k in categories_h)) categories_h[k] = 0;
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

    // smallest at the top
    stacked_data.sort(function(a, b) { return b.total - a.total; });
    
    var add_cats = function(data, cats, col) {
	var nc = cats.length;
	for (var c = 0;c < nc;++c) {
	    data[c].map(d => { d.push(col); d.push(cats[c]); });
	}
    };

    var series = null;
    
    var sort_by_counts = function(counts) {
	return function(a,b) {
	    var c1 = a in counts ? counts[a] : 0;
	    var c2 = b in counts ? counts[b] : 0;
	    return logScale ? c1 - c2 : c2 - c1;
	};
    };
    
    for (var i = 0; i < stacked_data.length; ++i) {
	var sorted_cats = [...categories].sort(sort_by_counts(stacked_data[i]));
	var stack = d3.stack().keys(sorted_cats);
	var series2 = stack([stacked_data[i]]);
	add_cats(series2, sorted_cats, i);

	if (i == 0) {
	    series = series2;
	} else {
	    for (var j = 0; j < series.length; ++j ) {
		series[j] = series[j].concat(series2[j]);
	    }
	}
    }

    const top_margin = 35;
    const bottom_margin = 80;
    var left_margin = 60;
    var right_margin = 30;
    
    // svg_width determined by enclosing div
    const svg = d3.select('#' + svg_id);
    var svg_style = window.getComputedStyle(svg.node());
    var svg_height = parseInt(svg_style.height);
    var svg_width = parseInt(svg_style.width);

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
        x_axis_label_rot = 90;
        x_axis_label_dx = '1em';
        x_axis_label_dy = '-0.5em';
        d3.select('#' + svg_id + '-last_updated').style('display', 'none');
        d3.select('#' + svg_id + '-form-row').style('flex-wrap', 'wrap');
    } else {
        d3.select('#' + svg_id + '-last_updated').style('display', null);
        d3.select('#' + svg_id + '-form-row').style('flex-wrap', 'nowrap');
    }
    
    const width = svg_width - left_margin - right_margin - legend_width;
    const height = svg_height - top_margin - bottom_margin;
    svg.attr('height', svg_height);

    const chart = svg.append('g')
        .attr('transform', `translate(${left_margin}, ${top_margin})`);

    // Configure the x-axis scale to use discrete values from the
    // data, which are taken from the x_axis key from each object.
    const xScale = d3.scaleBand()
        .range([0, width])
        .domain(stacked_data.map((s) => s[x_axis]))
        .padding(0.2);

    // guess whether there's enough space to display stacked bar totals
    var xbw = xScale.bandwidth();
    if (xbw < 35) {
        show_bar_totals = false;
    }

    if (logScale) y_title = "log10 (" + y_title + ")";
    
    // Configure the y-axis scale. It goes from 0 to the maximum
    // value (the height of the tallest stacked bar). We have already
    // computed this and stored the total in each objects "total" key.
    var yScale = null;

    if (logScale) {
	yScale = d3.scaleLog()
            .range([height, 0])
            .domain([1, 1.2 * d3.max(stacked_data.map((s) => s.total))]);
    } else {
	yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([0, 1.2 * d3.max(stacked_data.map((s) => s.total))]);
    }

    var num_bars = stacked_data.length;
    function maxlen_fn(text, index) {
        // final bar has less space due to color key
        return ((x_axis_label_rot != 90) && (index + 1 == num_bars)) ? 13 : 28;
    }

    var tlc = 0;
    function trim_labels(text, maxlen_fn) {
        text.each(function() {
	    var node = d3.select(this);
	    var label = node.text();
	    var ml = maxlen_fn(label, tlc++);
	    if (label.length > (ml - 3)) {
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
            d3.axisLeft(yScale).ticks(5)
                .tickFormat(function(d) { return y_formatter(d); })
        );

    chart.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.2)
        .call(d3.axisLeft()
            .scale(yScale)
            .tickSize(-width, 0, 0)
            .tickFormat('')
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
	    if (! show_bar_totals) return '';
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
    
    svg.append('image')
        .attr('x', svg_width - 125)
        .attr('y', 0)
        .attr('id', svg_id + '-export-button')
        .attr('height', 32)
        .attr('width', 125)
        .attr('xlink:href', './images/download_button.png')
        .on('click', function() {
            $('#export-modal').attr('name', svg_id + '-modal');
            $('#export-modal').modal();
        })
        .append('title')
        .text('Export chart');

    // limit categories
    var max_categories = 14;
    add_tooltip(svg_id, svg);
    var tooltip = d3.select('#' + svg_id + '-tooltip');
    var title_fn = function(d) { return d; };
    var text_fn = function(d) { return d; };

    //    add_legend(svg_id, width, chart, categories.slice(0,max_categories), tooltip, title_fn, text_fn, left_margin, 0);
    if (legend_width > 0) {
        add_legend(svg_id, width, legend_width, chart, categories.slice(0, max_categories), null, title_fn, text_fn, left_margin, 0);
    }

    groups.selectAll('rect')
        .data(function(d, i) { return series[i]; })
        .enter()
        .filter(function(s, j) { return ! isNaN(s[0]) && ! isNaN(s[1]); })
        .append('rect')
	.attr('fill', function(s, j) {
	    return colorizer(s[3]);
	})
        .attr('x', function(s, j) { return xScale(stacked_data[s[2]][x_axis]); })
        .attr('y', function(s) {
	    return yScale(s[1]);
	})
        .attr('width', xScale.bandwidth())
        .attr('height', function(s) {
	    if (logScale) {
		var s0 = s[0];
		var s1 = s[1];
		if (s0 < 1) s0 = 1;
		if (s1 < 1) s1 = 1;
		return (yScale(s0) - yScale(s1));
	    } else {
		return (yScale(s[0]) - yScale(s[1]));
	    }
	})
        .on('mouseenter', function(actual, i) {
            d3.select(this)
                .transition()
                .duration(100)
                .attr('stroke', '#000');
        })
        .on('mouseleave', function(actual, i) {
            d3.select(this)
                .transition()
                .duration(100)
                .attr('stroke', 'none');
        })
        .on('mouseover', function() { tooltip.style('display', null); })
        .on('mouseout', function() { tooltip.style('display', 'none'); })
        .on('mousemove', function(d, e) {
            var brick_name = d3.select(this).datum()[3];
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

            $('#' + svg_id + '-brick-value').text(brick_value);
            let text = $('#' + svg_id + '-brick-category');
            text.append('tspan').text(brick_name).each(ellipsize(190, 5));

            // Get the series index that we are hovering over so we can compute the
            // the x value to use (if we wish to lock it down).
            // let series_idx = d3.select(this).datum()[2];
            // let seriesX = xScale(stacked_data[series_idx][x_axis]);
            // let tooltipX = seriesX;

            let tooltipX = xPosition + left_margin - (tooltip_width / 2);
            let tooltipY = yPosition - 50;  // Get the tooltip above the mouse position

            // Prevent the tooltip from starting from out-of-bounds
            if (tooltipX < 1) {
                tooltipX = 1;
            }

            if (tooltipY < 1) {
                tooltipY = 1;
            }

            tooltip.attr('transform', 'translate(' + tooltipX + ',' + tooltipY + ')');
        });
}

function add_legend(svg_id, chart_width, legend_width, chart, categories, tooltip, title_fn, text_fn, x_offset, y_offset, mouseover_fn, mouseout_fn) {
    var top = 10;

    // Create the legend
    var legend = chart.append('g').selectAll('.legend')
        .data(categories)
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) {
            return 'translate(0,' + (top + i * 20) + ')';
        })
        .on('mouseover', function(d, e) {
	    if (tooltip != null) tooltip.style('display', null);
	    if (mouseover_fn != null) mouseover_fn(d, e);
        })
        .on('mouseout', function(d, e) {
	    if (tooltip != null) tooltip.style('display', 'none');
	    if (mouseout_fn != null) mouseout_fn(d, e);
        })
        .on('mousemove', function(d, e) {
	    if (tooltip == null) return;
	    var tooltip_title = title_fn(d);
            var tooltip_text = text_fn(d);

            let coords = d3.mouse(this);
            let xPosition = coords[0];  // distance from y-axis on chart
            let yPosition = coords[1];  // distance from top of chart

            let tooltip_width = $('.chart_tooltip_rect').width();
            $('#' + svg_id + '-brick-value').text(tooltip_text).each(ellipsize(190, 5));
            let text = $('#' + svg_id + '-brick-category');
            text.append('tspan').text(tooltip_title).each(ellipsize(190, 5));

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
        .attr('x', chart_width + 28)
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', function(d, i) { return colorizer(d); });

    legend.append('text')
        .attr('x', chart_width + 50)
        .attr('y', 8)
        .attr('dy', '.35em')
        .attr('font-family', 'sans-serif')
        .style('font-size', '0.7rem')
        .text(title_fn).each(ellipsize(legend_width - 15, 5))
        .append('title').text(title_fn);
}

function save_csv(filename, rows) {
    var processRow = function(row) {
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

function export2png(chart_id) {
    // Hide the export button
    $('#' + chart_id + '-export-button').hide();
    saveSvgAsPng(document.getElementById(chart_id), 'export.png').then(function() {
        // Re-display the export button
        $('#' + chart_id + '-export-button').show();
    });
}

function export2svg(chart_id) {
    $('#' + chart_id + '-export-button').hide();
    var config = {
        filename: 'chart'
    };
    d3_save_svg.save(d3.select('#' + chart_id).node(), config);
    $('#' + chart_id + '-export-button').show();
}

function export2csv(chart_id) {
    var chdata = chart_data[chart_id];
    var filename = 'chart.csv';

    var data = [];
    var all_fields_d = {};
    var all_fields = [];
    var total_field = null;
    
    chdata.forEach(function(obj_row) {
        d3.keys(obj_row).forEach(function(field) {
	    if ((field == 'total') || (field == 'Total')) {
                total_field = field;
	    }
	    else if (! (field in all_fields_d)) {
                all_fields_d[field] = true;
                all_fields.push(field);
	    }
        });
    });

    // place total last
    if (total_field != null) all_fields.push(total_field);
    
    data[0] = all_fields;
    var index = 1;

    chdata.forEach(function(obj_row) {
        data[index] = [];

        all_fields.forEach(function(field) {
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
