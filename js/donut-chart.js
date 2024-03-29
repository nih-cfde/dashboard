/* global d3 saveSvgAsPng d3_save_svg colorizer ellipsize */

var chart_data = {};
var chart_id_to_dropdown = {};
var chart_id_to_units = {};

function register_donut_export_buttons() {
    // Prevent accumulations of click handlers by clearing any past
    // registrations of 'click' to the buttons by using jquery's off()
    // function.
    $('#donut-export-png').off('click');
    $('#donut-export-png').click(function () {
        var chart_id = $('#export-modal-donut').attr('name').split('-')[0];
        var dropdown = chart_id_to_dropdown[chart_id];
        var units = chart_id_to_units[chart_id];
        var data = chart_data[chart_id];
        donut_export2png(chart_id, chart_data[chart_id], dropdown, units);
    });

    $('#donut-export-svg').off('click');
    $('#donut-export-svg').click(function () {
        var chart_id = $('#export-modal-donut').attr('name').split('-')[0];
        var dropdown = chart_id_to_dropdown[chart_id];
        var units = chart_id_to_units[chart_id];
        var data = chart_data[chart_id];
        donut_export2svg(chart_id, chart_data[chart_id], dropdown, units);
    });

    $('#donut-export-csv').off('click');
    $('#donut-export-csv').click(function () {
        var chart_id = $('#export-modal-donut').attr('name').split('-')[0];
        donut_export2csv(chart_id);
    });
}

function add_donut_tooltip(chart_id, svg) {
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
        .attr('dy', '1.3em');

    tooltip.append('text')
        .attr('x', 5)
        .attr('dy', '3.4em')
        .attr('id', chart_id + '-brick-value')
        .attr('class', 'chart_tooltip_value');
}

function update_donut_chart_title(chart_id, dropdown) {
    const heading = d3.select('#' + chart_id + '-title');
    // var dvalue = d3.select('#' + chart_id + '-' + dropdown + ' option:checked').text();
    var new_title;

    if (dropdown == 'data_type') {
        new_title = 'Subjects by Assay and Anatomy';
    } else if (dropdown == 'dcc') {
        new_title = 'Samples by Anatomy and CF Program';
    }

    heading.text(new_title);
}

function register_donut_dropdown(chart_id, data, dropdown, units) {
    var field = dropdown;
    if (field == 'data_type') field = 'assay_type';
    chart_data[chart_id] = data;
    chart_id_to_dropdown[chart_id] = dropdown;
  
    // populate dropdown menu with observed values from data
    var sel = $('#' + chart_id + '-' + dropdown);
    data.forEach(d => {
	// compute total, exclude any options where it's 0
	var total = 0;
	Object.keys(d).forEach(k => {
	    if (k != field) {
		total += d[k];
	    }
	});
	if (total > 0) {
	    sel.append($('<option></option>').val(d[field]).text(d[field]));
	}
    });
    
    $.each([dropdown], function(i, id) {
        $('#' + chart_id + '-' + id).change(function() {
            update_donut_chart(chart_id, data, id, units);
        });
    });
}

function add_donut_legend(svg_id, chart_width, legend_width, chart, categories, tooltip, title_fn, text_fn, x_offset, y_offset, mouseover_fn, mouseout_fn) {
    var top = 0;

    // Create the legend
    var legend = chart.append('g').selectAll('.legend')
        .data(categories)
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

            var brick_name = d.data.key;
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

function update_donut_chart(chart_id, data, dropdown, units) {
   $('#' + chart_id).replaceWith('<svg id="' + chart_id + '"/>');
   draw_donut_chart(chart_id, null, data, dropdown, units, false);
}

function draw_donut_chart(svg_id, svg, data, dropdown, units, show_labels) {
   let draw_detached = (svg != null)
   if (!draw_detached) {
       svg = d3.select('#' + svg_id)
       $('#' + svg_id).empty();
    }
    var dropdown_value = $('#' + svg_id + '-' + dropdown).val();
    update_donut_chart_title(svg_id, dropdown);

    var svg_height;
    var svg_width;
    var svg_style = window.getComputedStyle(svg.node());

    if (svg_style.height == "") {
      svg_height = 600;
      svg_width = 1200;
    } else {
      svg_height = parseInt(svg_style.height);
      svg_width = parseInt(svg_style.width);
    }

    if (svg_width < 300) svg_width = 300;
    if (svg_height < 200) svg_height = 200;

    svg.attr('width', svg_width);
    svg.attr('height', svg_height);

    const top_margin = 35;
    const bottom_margin = 10;
    const margin = 30;

    var legend_width = svg_width * 0.3;
    if (legend_width > 350) {
        legend_width = 350;
    }

    const width = svg_width - 2 * margin - legend_width;
    const height = svg_height - top_margin - bottom_margin;
    const hw = svg_width / 2;
    const hh = height / 2;
    const cx = (svg_width * 0.35) - margin;
    const cy = hh;
    const outer_radius = hh;
    const inner_radius = outer_radius / 2.0;
    // console.log("hw=" + hw + " hh=" + hh + " cx=" + cx + " cy=" + cy + " outer_radius=" + outer_radius);

    const chart = svg.append('g')
        .attr('transform', `translate(${margin}, ${top_margin})`);

    // reformat data
    var rf_data = {};
    if (dropdown == 'data_type') {
        data.forEach(d => {
            if (d['assay_type'] == dropdown_value) {
                Object.keys(d).forEach(k => {
                    if ((k != 'assay_type') && (d[k] > 0)) {
                        rf_data[k] = d[k];
                    }
                });
            }
        });
    } else if (dropdown == 'dcc') {
        data.forEach(d => {
            if (d['dcc'] == dropdown_value) {
                Object.keys(d).forEach(k => {
                    if ((k != 'dcc') && (d[k] > 0)) {
                        rf_data[k] = d[k];
                    }
                });
            }
        });
    }
    var pie = d3.pie()
        .sort(null) // don't sort by size
        .value(function(d) { return d.value; });
    var data_ready = pie(d3.entries(rf_data));

    var arc = d3.arc()
        .innerRadius(inner_radius)
        .outerRadius(outer_radius);

    var label_radius = outer_radius + 10;
    var labelLineArc = d3.arc()
        .innerRadius(label_radius - 5)
        .outerRadius(label_radius - 5);
    var labelArc = d3.arc()
        .innerRadius(label_radius)
        .outerRadius(label_radius);
    var outerLabelArc = d3.arc()
        .innerRadius(label_radius + 10)
        .outerRadius(label_radius + 10);

    var comma_formatter = d3.format(',');
    var large_number_formatter = d3.format('.2s');
    var tooltip = null;
    var cat2path = {};

    // donut chart
    chart.selectAll('slices')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('transform', 'translate(' + cx + ',' + cy + ')')
        .attr('d', arc)
        .attr('fill', function(d, i) { const th = this; cat2path[d.data.key] = th; return (colorizer(i)); })
        .attr('stroke', 'none')
        .attr('stroke-width', '1px')
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
            var brick_name = d.data.key;
            var brick_value = 0;
            var xPosition = d3.mouse(this)[0] - 50 + cx;
            var yPosition = d3.mouse(this)[1] - 75 + cy;
            if (d.data.value > 999999) {
                brick_value = large_number_formatter(d.data.value);
            } else {
                brick_value = comma_formatter(d.data.value);
            }
            $('#' + svg_id + '-brick-value').text(brick_value + ' ' + units);
            let text = $('#' + svg_id + '-brick-category');
            text.append('tspan').text(brick_name).each(ellipsize(190, 5));
            tooltip.attr('transform', 'translate(' + xPosition + ',' + yPosition + ')');
        });

    // original, spoke, yspread
    var label_type = 'yspread';
    // var label_type = 'original';
    // var label_type = 'spoke';

    // define point of the arc to label
    var angle_fn = function(d) { return d.startAngle + ((d.endAngle - d.startAngle) / 2); };

    if (show_labels) {
    // yspread - arrange labels using entire vertical space on left and right
        var ypos = {};
        if (label_type == 'yspread') {
        // count labels on left and right
            var n_left = 0;
            var n_right = 0;

            data_ready.forEach(d => {
                var midangle = angle_fn(d);
                d.isLeft = (midangle > Math.PI);
                if (d.isLeft) {
                    n_left += 1;
                } else {
                    n_right += 1;
                }
            });

            var t_height = height + top_margin + bottom_margin;
            var l_delta = t_height / (n_left + 1);
            var r_delta = t_height / (n_right + 1);
            var l_offset = t_height - l_delta - cy;
            var r_offset = r_delta - cy;

            // console.log("n_left=" + n_left + " n_right=" + n_right + " cy=" + cy + " t_height=" + t_height + " l_delta=" + l_delta + " l_offset=" + l_offset + " r_delta=" + r_delta + " r_offset=" + r_offset);

            data_ready.forEach(d => {
                if (d.isLeft) {
                    ypos[d.data.key] = l_offset;
                    l_offset -= l_delta;
                } else {
                    ypos[d.data.key] = r_offset;
                    r_offset += r_delta;
                }
            });
        }

        // label lines
        svg.selectAll('slice_lines')
            .data(data_ready)
            .enter()
            .append('polyline')
            .attr('stroke', 'black')
            .style('fill', 'none')
            .attr('stroke-width', 1)
            .attr('points', function(d) {
                var posA = arc.centroid(d);
                var posB = labelLineArc.centroid(d);
                var posC = labelArc.centroid(d);
                var midangle = angle_fn(d);
                posC[0] = label_radius * 0.95 * (midangle < Math.PI ? 1 : -1);
                posA[0] += cx;
                posA[1] += cy;
                posB[0] += cx;
                posB[1] += cy;
                posC[0] += cx;
                posC[1] += cy;

                // original
                if (label_type == 'original') {
                    return [posA, posB, posC];
                }
                // spoke
                else if (label_type == 'spoke') {
                    return [posA, posB];
                }
                // yspread
                else if (label_type == 'yspread') {
                    posC[1] = posB[1];
                    var posD = [cx + (label_radius * 1.08 * (midangle < Math.PI ? 1 : -1)), ypos[d.data.key] + cy];
                    return [posA, posD];
                }
            });

        // slice labels
        chart.selectAll('slice_labels')
            .data(data_ready)
            .enter()
            .append('text')
            .attr('font-size', '10px')
            .text( function (d) { return d.data.key; } )
            .attr('vertical-align', 'middle')
            .attr('transform', function(d) {
                var pos = labelArc.centroid(d);
                var midangle = angle_fn(d);
                // original
                if (label_type == 'original') {
                    pos[0] = label_radius * 0.99 * (midangle < Math.PI ? 1 : -1);
                    return 'translate(' + pos + ')';
                }
                // spoke
                else if (label_type == 'spoke') {
                    return 'translate(' + pos + ') rotate(' + (((midangle * 180) / Math.PI) + (midangle < Math.PI ? -90 : 90)) + ' )';
                }
                // yspread
                else if (label_type == 'yspread') {
                    pos[0] = label_radius * 1.1 * (midangle < Math.PI ? 1 : -1);
                    pos[1] = ypos[d.data.key];
                    return 'translate(' + pos + ')';
                }
            })
            .style('text-anchor', function(d) {
                var midangle = angle_fn(d);
                return (midangle < Math.PI ? 'start' : 'end');
            });
    }

    var max_categories = 16;
    const legend = chart.append('g');

    add_donut_tooltip(svg_id, svg);
    tooltip = d3.select('#' + svg_id + '-tooltip');

    var categories = data_ready.slice(0, max_categories);
    var title_fn = function(d) { return d.data.key; };

    // highlight donut chart slice when mouse is over corresponding legend entry
    var mouseover_fn = function(d, e) {
        d3.select(cat2path[d.data.key]).attr('stroke', '#000');
    };

    var mouseout_fn = function(d, e) {
        d3.select(cat2path[d.data.key]).attr('stroke', 'none');
    };

    var text_fn = function(d) {
        var value = d.data.value;
        if (value > 999999) {
            value = large_number_formatter(d.data.value);
        } else {
            value = comma_formatter(d.data.value);
        }
	text = value + ' ' + units;
        return text
    };

    var x_offset = 0;
    var y_offset = 0;
    var chart_width = svg_width - legend_width - (2 * margin);
    add_donut_legend(svg_id, chart_width, legend_width, legend, categories, tooltip, title_fn, text_fn, x_offset, y_offset, mouseover_fn, mouseout_fn);
}

function export_donut_chart_data(svg_id) {
    $('#export-modal-donut').attr('name', svg_id + '-modal-donut');
    $('#export-modal-donut').modal();
}

function donut_draw2svg(chart_id, data, dropdown, units) {
    let svg_obj = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let svg = d3.select(svg_obj);
    let svg_id = chart_id + '-export2svg';
    svg.attr('id', svg_id);
    svg.attr('style', 'height: 800px;');
    draw_donut_chart(chart_id, svg, data, dropdown, units);
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

function donut_export2png(chart_id, data, dropdown, units) {
  // Hide the export button
    $('#' + chart_id + '-export-button').hide();
    dsvg = donut_draw2svg(chart_id, data, dropdown, units);
    let options = { backgroundColor: 'white' };
    saveSvgAsPng(dsvg['svg'].node(), 'donut-chart.png', options).then(function () {
        // redisplay the export button
        dsvg['div'].remove();
        $('#' + chart_id + '-export-button').show();
    });
}

function donut_export2svg(chart_id, data, dropdown, units) {
    $('#' + chart_id + '-export-button').hide();
    dsvg = donut_draw2svg(chart_id, data, dropdown, units);
    var config = {
        filename: 'donut-chart'
    };
    d3_save_svg.save(dsvg['svg'].node(), config);
    // redisplay the export button
    dsvg['div'].remove();
    $('#' + chart_id + '-export-button').show();
}

function donut_save_csv(filename, rows) {
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

function donut_export2csv(chart_id) {
    var chdata = chart_data[chart_id];
    var filename = 'donut-chart.csv';

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

    donut_save_csv(filename, data);
}
