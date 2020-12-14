/* global d3 saveSvgAsPng d3_save_svg */

// ls data | grep json | grep -v example | perl -ne 'chomp; print "    \"$_\": true,\n";'
// remove any JSON files with errors/timeouts:
// grep -l 'time limit' *.json
var json_files = {
    'files-anatomy-assay.json': true,
    'files-anatomy-data_type.json': true,
    'files-anatomy-dcc.json': true,
    'files-anatomy-species.json': true,
    'files-assay-anatomy.json': true,
    'files-assay-data_type.json': true,
    'files-assay-dcc.json': true,
    'files-assay-species.json': true,
    'files-data_type-anatomy.json': true,
    'files-data_type-assay.json': true,
    'files-data_type-dcc.json': true,
    'files-data_type-species.json': true,
    'files-dcc-anatomy.json': true,
    'files-dcc-assay.json': true,
    'files-dcc-data_type.json': true,
    'files-dcc-species.json': true,
    'files-species-anatomy.json': true,
    'files-species-assay.json': true,
    'files-species-data_type.json': true,
    'files-species-dcc.json': true,
    'samples-anatomy-assay.json': true,
    'samples-anatomy-data_type.json': true,
    'samples-anatomy-dcc.json': true,
    'samples-anatomy-species.json': true,
    'samples-assay-anatomy.json': true,
    'samples-assay-data_type.json': true,
    'samples-assay-dcc.json': true,
    'samples-assay-species.json': true,
    'samples-data_type-anatomy.json': true,
    'samples-data_type-assay.json': true,
    'samples-data_type-dcc.json': true,
    'samples-data_type-species.json': true,
    'samples-dcc-anatomy.json': true,
    'samples-dcc-anatomy.json~': true,
    'samples-dcc-assay.json': true,
    'samples-dcc-data_type.json': true,
    'samples-dcc-species.json': true,
    'samples-species-anatomy.json': true,
    'samples-species-assay.json': true,
    'samples-species-data_type.json': true,
    'samples-species-dcc.json': true,
    'subjects-anatomy-assay.json': true,
    'subjects-anatomy-data_type.json': true,
    'subjects-anatomy-dcc.json': true,
    'subjects-anatomy-species.json': true,
    'subjects-assay-anatomy.json': true,
    'subjects-assay-data_type.json': true,
    'subjects-assay-dcc.json': true,
    'subjects-assay-species.json': true,
    'subjects-data_type-anatomy.json': true,
    'subjects-data_type-assay.json': true,
    'subjects-data_type-dcc.json': true,
    'subjects-data_type-species.json': true,
    'subjects-dcc-anatomy.json': true,
    'subjects-dcc-assay.json': true,
    'subjects-dcc-data_type.json': true,
    'subjects-dcc-species.json': true,
    'subjects-species-anatomy.json': true,
    'subjects-species-assay.json': true,
    'subjects-species-data_type.json': true,
    'subjects-species-dcc.json': true,
    'volume-anatomy-assay.json': true,
    'volume-anatomy-data_type.json': true,
    'volume-anatomy-dcc.json': true,
    'volume-anatomy-species.json': true,
    'volume-assay-anatomy.json': true,
    'volume-assay-data_type.json': true,
    'volume-assay-dcc.json': true,
    'volume-assay-species.json': true,
    'volume-data_type-anatomy.json': true,
    'volume-data_type-assay.json': true,
    'volume-data_type-dcc.json': true,
    'volume-data_type-species.json': true,
    'volume-dcc-anatomy.json': true,
    'volume-dcc-assay.json': true,
    'volume-dcc-data_type.json': true,
    'volume-dcc-species.json': true,
    'volume-species-anatomy.json': true,
    'volume-species-assay.json': true,
    'volume-species-data_type.json': true,
    'volume-species-dcc.json': true
};

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
    var file = y_axis_val + '-' + x_axis_val + '-' + group_by_val + '.json';
    var is_valid = file in json_files;

    var y_opts = document.getElementById(chart_id + '-y-axis').options;
    var gb_opts = document.getElementById(chart_id + '-group-by').options;

    var y_idx, gb_idx, is_ok;

    // if not, find a valid selection that includes the selected x_axis_val
    if (! is_valid) {
        var new_y = null;
        var new_gb = null;
        Object.keys(json_files).forEach(k => {
            var parts = k.replace('.json', '').split('-');

            // pick the first one in the list
            if ((parts[1] == x_axis_val) && (new_y == null)) {
                new_y = parts[0];
                new_gb = parts[2];
            }
        });

        y_axis_val = new_y;
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

    // enable y_axis choices that are valid given current x_axis, group_by
    for (y_idx = 0; y_idx < y_opts.length; ++y_idx) {
        file = y_opts[y_idx].value + '-' + x_axis_val + '-' + group_by_val + '.json';
        is_ok = file in json_files;
        y_opts[y_idx].disabled = ! is_ok;
    }

    // enable group_by choices that are valid given current x_axis, y_axis
    for (gb_idx = 0; gb_idx < gb_opts.length; ++gb_idx) {
        file = y_axis_val + '-' + x_axis_val + '-' + gb_opts[gb_idx].value + '.json';
        is_ok = file in json_files;
        gb_opts[gb_idx].disabled = ! is_ok;
    }
}

function register_dropdowns(chart_id) {
    $.each(['x-axis', 'y-axis', 'group-by'], function(i, id) {
        $('#' + chart_id + '-' + id).change(function() {
            update_chart(chart_id);
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

function update_chart(chart_id) {
    update_dropdowns(chart_id);

    var x_axis = $('#' + chart_id + '-x-axis option:checked').val();
    var y_axis = $('#' + chart_id + '-y-axis option:checked').val();
    var group_by = $('#' + chart_id + '-group-by option:checked').val();

    // Given the x, y and group by information, we formulate the URL
    // to retrieve data from.
    var data_url = './data/' + y_axis + '-' + x_axis + '-' + group_by + '.json';

    $.getJSON(data_url, function(data) {
        $('#' + chart_id).replaceWith('<svg id="' + chart_id + '"/>');
        register_export_buttons(chart_id, data);
        draw_chart(chart_id, data, x_axis, y_axis);
    }).fail(function() {
        console.error('Error loading data for chart combination.');
        show_error(chart_id);
    });
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

function draw_chart(svg_id, stacked_data, x_axis, y_axis,
    svg_height = 350, legend_width = 100, x_axis_rot = 25,
    review = false) {

    update_chart_title(svg_id);

    const y_map = {
        'file_count': 'File Count',
        'file_size': 'Data Volume (bytes)',
        'sample_count': 'Sample Count',
        'subject_count': 'Subject Count'
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

    // With the totals now calculated, we can use that to re-sort
    // the array containing data. We want to display the chart
    // in descending 'total' order.
    stacked_data.sort(function(a, b) { return b.total - a.total; });

    var stack = d3.stack().keys(categories);
    var series = stack(stacked_data);

    // add x index to series so it's not lost when empty bars are filtered
    series.forEach(s => {
	j = 0;
	s.forEach(t => t.push(j++));
    });

    const svg_width = 793;
    const top_margin = 30;
    const bottom_margin = 100;
    const x_margin = 60;
    const width = svg_width - 2 * x_margin - legend_width;
    const height = svg_height - top_margin - bottom_margin;
    const svg = d3.select('#' + svg_id);
    svg.attr('width', svg_width);
    svg.attr('height', svg_height);

    const chart = svg.append('g')
        .attr('transform', `translate(${x_margin}, ${top_margin})`);

    // Configure the x-axis scale to use discrete values from the
    // data, which are taken from the x_axis key from each object.
    const xScale = d3.scaleBand()
        .range([0, width])
        .domain(stacked_data.map((s) => s[x_axis]))
        .padding(0.2);

    // Configure the y-axis scale. It goes from 0 to the maximum
    // value (the height of the tallest stacked bar). We have already
    // computed this and stored the total in each objects "total" key.
    const yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0, 1.2 * d3.max(stacked_data.map((s) => s.total))]);


    var num_bars = stacked_data.length;
    function maxlen_fn(text, index) {
	// final bar has less space due to color key
	return (index+1 == num_bars) ? 13 : 28;
    }

    var tlc = 0;
    function trim_labels(text, maxlen_fn) {
	text.each(function() {
	    var node = d3.select(this);
	    var label = node.text();
	    var ml = maxlen_fn(label, tlc++);
	    if (label.length > (ml-3)) {
		node.text(label.substring(0, ml-3) + '...');
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
        .attr('dx', '-.8em')
        .attr('dy', '.5em')
        .style('text-anchor', 'start')
        .attr('transform', 'rotate(' + x_axis_rot + ')');

    var y_formatter = d3.format('.2s');
    var comma_formatter = d3.format(',');
    var large_number_formatter = d3.format('.2s');

    // Add the y-axis
    chart.append('g')
        .call(
            d3.axisLeft(yScale)
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
        .attr('y', (a) => yScale(a.total) - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#000')
        .text((a) => {if (a.total > 999999) {
            return `${large_number_formatter(a.total)}`;
        } else {
            return `${comma_formatter(a.total)}`;
        }});

    // Add the y-axis label
    svg.append('text')
        .attr('x', -(height / 2) - x_margin)
        .attr('y', bottom_margin / 2.4 - 5)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .text(y_title);

    svg.append('image')
        .attr('x', svg_width - x_margin - legend_width + 28)
        .attr('y', top_margin - 30)
        .attr('id', svg_id + '-export-button')
        .attr('height', 30)
        .attr('width', 150)
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
//    add_legend(svg_id, width, chart, categories.slice(0,max_categories), tooltip, title_fn, text_fn, x_margin, 0);
    add_legend(svg_id, width, chart, categories.slice(0,max_categories), null, title_fn, text_fn, x_margin, 0);

    groups.attr('fill', function(a, b) { return colorizer(b); })
        .selectAll('rect')
        .data(function(d, i) { return series[i]; })
        .enter()
        .filter(function(s, j) { return ! isNaN(s[0]) && ! isNaN(s[1]); })
        .append('rect')
        .attr('x', function(s, j) { return xScale(stacked_data[s[2]][x_axis]); })
        .attr('y', (s) => yScale(s[1]))
        .attr('width', xScale.bandwidth())
        .attr('height', (s) => height - yScale(s[1] - s[0]))
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
            var brick_name = d3.select(this.parentNode).datum().key;
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

            let tooltipX = xPosition + x_margin - (tooltip_width / 2);
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

function add_legend(svg_id, width, chart, categories, tooltip, title_fn, text_fn, x_offset, y_offset, mouseover_fn, mouseout_fn) {
    var top = 20;

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
        .attr('x', width + 28)
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', function(d, i) { return colorizer(i); });

    legend.append('text')
        .attr('x', width + 50)
        .attr('y', 8)
        .attr('dy', '.35em')
        .attr('font-family', 'sans-serif')
        .style('font-size', '0.7rem')
        .text(title_fn)
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
    $('#export-button').hide();
    saveSvgAsPng(document.getElementById(chart_id), 'export.png').then(function() {
        // Re-display the export button
        $('#export-button').show();
    });
}

function export2svg(chart_id) {
    var config = {
        filename: 'chart'
    };
    d3_save_svg.save(d3.select('#' + chart_id).node(), config);
}

function export2csv(chart_id) {
    var chdata = chart_data[chart_id];
    var filename = 'chart.csv';

    var data = [];
    var fields = d3.keys(chdata[0]).slice(0);

    data[0] = fields;
    var index = 1;

    chdata.forEach(function(obj_row) {
        data[index] = [];

        fields.forEach(function(field) {
            data[index].push(obj_row[field]);
        });

        index++;
    });

    save_csv(filename, data);
}
