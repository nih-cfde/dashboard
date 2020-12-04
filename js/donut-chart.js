/* global d3 add_tooltip colorizer */

function update_donut_chart_title(chart_id, dropdown) {
    const heading = d3.select('#' + chart_id + '-title');
    var dvalue = d3.select('#' + chart_id + '-' + dropdown + ' option:checked').text();
    var new_title;
    if (dropdown == 'data_type') {
        new_title = 'Subjects by Assay and Anatomy across Programs';
    } else if (dropdown == 'dcc') {
        new_title = 'Samples by Anatomy and CF Program';
    }
    heading.text(new_title);
}

function register_donut_dropdown(chart_id, data, dropdown, units) {
    $.each([dropdown], function(i, id) {
        $('#' + chart_id + '-' + id).change(function() {
            update_donut_chart(chart_id, data, id, units);
        });
    });
}

function update_donut_chart(chart_id, data, dropdown, units) {
    $('#' + chart_id).replaceWith('<svg id="' + chart_id + '" style="min-height: 400px; overflow: visible;"/>');
    draw_donut_chart(chart_id, data, dropdown, units);
}

function draw_donut_chart(svg_id, data, dropdown, units) {
    var dropdown_value = $('#' + svg_id + '-' + dropdown).val();
    update_donut_chart_title(svg_id, dropdown);

    const svg_width = 426;
    const top_margin = 90;
    const margin = 40;
    const legend_width = 0;
    const width = svg_width - 2 * margin - legend_width;
    const height = 300 - margin - top_margin;
    const hw = svg_width / 2;
    const hh = height / 2;
    const cx = hw;
    const cy = hh + top_margin;
    const outer_radius = hw - top_margin - margin;
    const inner_radius = outer_radius / 2.0;
    // console.log("hw=" + hw + " hh=" + hh + " cx=" + cx + " cy=" + cy + " outer_radius=" + outer_radius);

    const svg = d3.select('#' + svg_id);
    const chart = svg.append('g')
        .attr('transform', `translate(${cx}, ${cy})`);

    // reformat data
    var rf_data = {};
    if (dropdown == 'data_type') {
        data.forEach(d => {
            if (d['assay'] == dropdown_value) {
                Object.keys(d).forEach(k => {
                    if ((k != 'assay') && (d[k] > 0)) {
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

    // donut chart
    chart.selectAll('slices')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function(d) { return (colorizer(d.data.key)); })
        .attr('stroke', 'none')
        .style('stroke-width', '1px')
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
            $('#' + svg_id + '-brick-category').text(brick_name);
            tooltip.attr('transform', 'translate(' + xPosition + ',' + yPosition + ')');
        });

    // original, spoke, yspread
    var label_type = 'yspread';
    // var label_type = 'original';
    // var label_type = 'spoke';

    // define point of the arc to label
    var angle_fn = function(d) { return d.startAngle + ((d.endAngle - d.startAngle) / 2); };

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

        var t_height = height + top_margin + margin;
        var l_delta = (height + top_margin + margin) / (n_left + 1);
        var r_delta = (height + top_margin + margin) / (n_right + 1);
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

    // download icon
    svg.append('image')
        .attr('x', svg_width - 170)
        .attr('y', 0)
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

    add_tooltip(svg_id, svg);
    tooltip = d3.select('#' + svg_id + '-tooltip');
}

