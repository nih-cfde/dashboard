// When this file is loaded, it will run the 2 Google Tag Manager tags.
// To use: Supply your Google Tag Manager container ID on the next line.
var gtmId = 'G-LNZN3CXFQK'; // Change null to be your GTM container ID (e.g. "GTM-XXXXXX")

(function(gtmId) {
    if (!gtmId) {
        return;
    }
    // Run <head> tag.
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtag/js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer', gtmId);

    // Insert <body> tag
    var bodyScript = document.createElement('noscript');
    bodyScript.innerHTML = '<iframe src="https://www.googletagmanager.com/ns.html?id=' + gtmId + '" height="0" width="0" style="display:none;visibility:hidden"></iframe>';
    document.addEventListener("DOMContentLoaded", function(event) {
        document.body.appendChild(bodyScript);
    });
})(gtmId);
