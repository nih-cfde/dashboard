/* global */

// dev
const DASHBOARD_API_URL='/dashboard-api';
const DERIVA_URL='';

const MAX_GRAPH_GROUP1 = 12;
const MAX_GRAPH_GROUP2 = 5;

const MAX_DONUT_GROUP1 = 15;
const MAX_DONUT_GROUP2 = 12;

// read DERIVA catalog id from URL
function get_catalog_id() {
    var url = new URL(window.location.href);
    var catalog_id = url.searchParams.get("catalogId");
    return catalog_id;
}
