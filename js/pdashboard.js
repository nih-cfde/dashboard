/* global register_dropdowns update_chart */

const UPDATE_DELAY_SECS = 0.05;
var scrolling = false;
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


var hidWidth;
var scrollBarWidths = 40;

var widthOfList = function(){
  var itemsWidth = 0;
  $('.list a').each(function(){
    var itemWidth = $(this).outerWidth();
    itemsWidth+=itemWidth;
  });
  return itemsWidth;
};

var widthOfHidden = function(){
    var ww = 0 - $('.wrapper').outerWidth();
    var hw = (($('.wrapper').outerWidth())-widthOfList()-getLeftPosi())-scrollBarWidths;
    var rp = $(document).width() - ($('.nav-item.nav-link').last().offset().left + $('.nav-item.nav-link').last().outerWidth());
    
    if (ww>hw) {
        //return ww;
        return (rp>ww?rp:ww);
    }
    else {
        //return hw;
        return (rp>hw?rp:hw);
    }
};

var getLeftPosi = function(){
    
    var ww = 0 - ($('.wrapper').outerWidth() + 10);
    var lp = $('.list').position().left;
    if (ww>lp) {
        return ww;
    }
    else {
        return lp;
    }
};

var reAdjust = function() {
  
  // check right pos of last nav item
  var doc_width = $(document).width();
  var nav_item_offset_left = $('.nav-item.nav-link').last().offset().left + 170;
  var nav_item_outerwidth = $('.nav-item.nav-link').last().outerWidth();
  var rp = doc_width - (nav_item_offset_left + nav_item_outerwidth);
  var wrapper_width = $('.wrapper').outerWidth();
  var width_of_list = widthOfList();

  if ((wrapper_width < width_of_list) && (rp < nav_item_outerwidth)) {
    $('.scroller-right').show().css('display', 'block');
  }
  else {
    $('.scroller-right').hide();
  }
  
  var left_position = getLeftPosi();
  if (left_position < 0) {
    $('.scroller-left').css('display', 'block').show();
  }
  else {
  	$('.scroller-left').hide();
  }

  scrolling = false;
}

$('.scroller-right').click(function() {
  $('.scroller-left').fadeIn('slow');
  if (scrolling) { //prevent double click
    return;
  }
  scrolling = true;
  $('.list').animate({left:"-=200px"},'slow',function(){
    reAdjust();
  });
});

$('.scroller-left').click(function() {
  $('.scroller-right').fadeIn('slow');
  if (scrolling) { //prevent double click
    return;
  }
  scrolling = true;
  var left_position = getLeftPosi();
  if (left_position < 0) {
    $('.list').animate({left:"+=200px"},'slow',function(){
        reAdjust();
    });
  }
});    


// TODO - copied from dcc_review.js; put into a cental location
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
            + ' ' + d.getHours() + ':' + minutes

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

function equalize_table_heights() {
    var h1 = parseInt($('#personal_collections_table_wrapper').css('height'));
    var h2 = parseInt($('#saved_query_table_wrapper').css('height'));
    if (h1 > h2)
        $('#saved_query_table_wrapper').height(h1);
    else
        $('#personal_collections_table_wrapper').height(h2);
}

function update_saved_queries() {
    var saved_queries_url = DASHBOARD_API_URL + '/user/saved_queries';
    
    var dataset = []

    get_json_retry(saved_queries_url, function(data) {
        if (data.length == 0) {
            var dt = $('#saved_query_table');
            dt.addClass('saved_query_message');
            dt.append($("<tr><td class='saved_query_message'>You have no saved searches. Use the Data Browser menu (above) to run and save searches.</td></tr>"));
        }
        else {
            data.forEach(query => {
                dataset.push([query['name'],query['table_name'],query['creation_ts'],query['last_execution_ts'],query['description'],query['query']]);
            });
            var dt = $('#saved_query_table').DataTable( {
                "language": {
                    "emptyTable": "No saved searches"
                },
                data: dataset,
                columnDefs: [
                    {
                        targets: [ 0 ],
                        width: "40%",
                        render: function ( data, type, row ) {
                            value = data;
                            return '<span class="row_hover" title="' + row[0] + ' - ' + row[4] + '"><a href="' + row[5] + '" target="chaise">'+ value +'</a></span>';
                        }
                    },
                    {
                        targets: [ 1 ],
                        width: "15%",
                    },
                    {
                        targets: [ 2, 3 ],
                        width: "20%",
                        class:"nowrap",
                        render: function ( data, type, row ) {
                            var d = new Date(data);
                            value = get_formatted_date(d);
                            return value;
                        }
                    },
                    {
                        "targets": [ 4, 5 ],
                        "visible": false
                    }
                ],
                columns: [
                    { title: "Search Name" },
		            { title: "Table" },
                    { title: "Creation Date" },
                    { title: "Last Searched" },
                    { title: "Description" }, // col 3 which is invisible
                    { title: "Search"} // col 4 which is invisible
                ]
            });
            dt.column('2').order('desc');
            dt.columns.adjust().draw();
            equalize_table_heights();
        }
    });
}


function update_personal_collections() {
    var personal_collections_url = DASHBOARD_API_URL + '/user/personal_collections';
    
    var dataset = []
    
    get_json_retry(personal_collections_url, function(data) {
        if (data.length == 0) {
            var dt = $('#personal_collections_table');
            dt.addClass('saved_query_message');
            dt.append($("<tr><td class='saved_query_message'>You have no Personal Collections. "
                + "To create one, click on your profile name in the top-right corner of the menu and select 'Personal Collections'.</td></tr>"));
        }
        else {
            data.forEach(query => {
                dataset.push([query['name'],query['description'],query['creation_ts'],query['query']]);
            });
            var dt = $('#personal_collections_table').DataTable( {
                "language": {
                    "emptyTable": "No personal collections"
                },
                data: dataset,
                columnDefs: [
                    {
                        targets: [ 0 ],
                        width: "30%",
                        render: function ( data, type, row ) {
                            value = data;
                            return '<span class="row_hover" title="' + row[0] + ' - ' + row[1] + '"><a href="' + row[3] + '" target="chaise">'+ value +'</a></span>';
                        }
                    },
                    {
                        targets: [ 1 ],
                        width: "50%",
                    },
                    {
                        targets: [ 2 ],
                        width: "20%",
                        class:"nowrap",
                        render: function ( data, type, row ) {
                            var d = new Date(data);
                            value = get_formatted_date(d);
                            return value;
                        }
                    }
                ],
                columns: [
                    { title: "Collection Name" },
		            { title: "Description" },
                    { title: "Creation Date" }
                    // { title: "Search"} // col 4 which is invisible
                ]
            });
            dt.columns.adjust().draw();
            equalize_table_heights();
        }
    });
}


var fav_dccs = [];

function update_favorites() {
    var favorites_url = DASHBOARD_API_URL + '/user/favorites';

    get_json_retry(favorites_url, function(data) {
        Object.keys(data).forEach(favorite_type => {
          let tbl = $('#favorite-' + favorite_type);
          let favs = data[favorite_type];
          let tbl_data = [];

          favs.forEach(fav => {
            if (favorite_type == "dcc") {
              fav_dccs.push(fav.id);
            }
            tbl_data.push([fav.id, fav.abbreviation, fav.name, fav.description, fav.url]);
          });

          //              tbl.append($("<li class='favorite'><a href='" + favorite_list["url"] + "' target='chaise'>" + favorite_list["abbreviation"] + ": " + favorite_list["name"] + "</a></li>"));

          var dt = tbl.DataTable({
            "language": {
              "emptyTable": "To add a favorite, browse the data portal and click on the star associated with a facet."
            },
            data: tbl_data,
            columnDefs: [
              {
                targets: [ 0 ],
                width: "100%",
                render: function ( data, type, row ) {
                  let value = row[1] != null ? row[1] + ": " + row[2] : row[2];
                  let title = row[2] != row[3] ? row[2] + ' - ' + row[3] : row[2];
                  return '<span class="row_hover" title="' + title + '"><a href="' + row[4] + '" target="chaise">'+ value +'</a></span>';
                }
              },
            ],
            columns: [
              { title: "&nbsp;" },
            ]
          });
          dt.columns.adjust().draw();
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
	    checkboxes.append("<i title='" + dcc['complete_name'] + "'  class='fas fa-info-circle' style='color: #bdbdbd; font-size:80%; padding-left: 10px'></i><br clear='both'/>");
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
    update_personal_collections();
    reAdjust();

    // chart 3 - donut graph
    var dc1_data = null;
    var count = 'subjects';
    var group1 = 'assay';
    var group2 = 'anatomy';
    var dc1_url = DASHBOARD_API_URL + '/stats/' + [count, group1, MAX_DONUT_GROUP1, group2, MAX_DONUT_GROUP2].join('/');
    if (catalog_id != null) dc1_url += '?catalogId=' + catalog_id;
    
    var dc1_data_fn =  function(data) {
        dc1_data = data;
        register_donut_dropdown('dc1', data, 'data_type', count);
        register_export_buttons('dc1', data);
        draw_donut_chart('dc1', data, 'data_type', count);
    };
    var dc1_fail_fn = function() {
        // TODO: Show something where the SVG would be.
    };

    get_json_retry(dc1_url,dc1_data_fn,dc1_fail_fn);


    // chart 4 - donut graph
    count = 'samples';
    group1 = 'dcc';
    group2 = 'anatomy';
    var dc2_url = DASHBOARD_API_URL + '/stats/' + [count, group1, MAX_DONUT_GROUP1, group2, MAX_DONUT_GROUP2].join('/');
    if (catalog_id != null) dc2_url += '?catalogId=' + catalog_id;

    var dc2_data_fn = function(data) {
        dc2_data = data;
        register_donut_dropdown('dc2', data, 'dcc', 'samples');
        register_export_buttons('dc2', data);
        draw_donut_chart('dc2', data, 'dcc', 'samples');
    };
    var dc2_fail_fn = function() {
        // TODO: Show something where the SVG would be.
    };
    
    get_json_retry(dc2_url, dc2_data_fn, dc2_fail_fn);

    // display a single chart, hide the others
    function showChart(cnum) {
        for (var i = 1; i <= 4; ++i) {
            $('#chart' + i).hide();
            $('#thumb' + i).removeClass('selected');
        }
        $('#chart' + cnum).show();
        if (cnum == 1) update_chart(catalog_id, 'sbc1');
        if (cnum == 2) update_chart(catalog_id, 'sbc2');
        if (cnum == 3) update_donut_chart('dc1', dc1_data, 'data_type', 'subjects');
        if (cnum == 4) update_donut_chart('dc2', dc2_data, 'dcc', 'samples');
        $('#thumb' + cnum).addClass('selected');
    }

    // display all charts
    function showAllCharts() {
        for (var i = 1; i <= 4; ++i) {
                $('#chart' + i).show();
            $('#thumb' + i).addClass('selected');
        }
        update_chart(catalog_id, 'sbc1');
        update_chart(catalog_id, 'sbc2');
        update_donut_chart('dc1', dc1_data, 'data_type', 'subjects');
        update_donut_chart('dc2', dc2_data, 'dcc', 'samples');
    }

    // enable interactive chart selection by clicking thumbnails
    for (var i = 1; i <= 4; ++i) {
        const cnum = i;
        $('#thumb' + cnum).off('click');
        $('#thumb' + cnum).click(function() {
            showChart(cnum);
        });
    }


    window.addEventListener('resize', function() { window_resized(catalog_id, 'sbc1'); reAdjust(); });
    //window.addEventListener('resize', function() { window_resized(catalog_id, 'dc1'); });

});
