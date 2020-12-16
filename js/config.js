/* global */

// dev - laptop
const DASHBOARD_API_URL='http://localhost:5000';
const DERIVA_URL='http://app-dev.nih-cfde.org';

// read DERIVA catalog id from URL
function get_catalog_id() {
    var url = new URL(window.location.href);
    var catalog_id = url.searchParams.get("catalogId");
    return catalog_id;
}
