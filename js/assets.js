// The paths here are expressed from <ROOT>/node_modules/

var css = [
    'bootstrap/dist/css/bootstrap.min.css',
    'normalize.css/normalize.css',
    '@fortawesome/fontawesome-free/css/all.css',
    {'source': '@fortawesome/fontawesome-free/webfonts', 'dest': 'webfonts'}
];

var fonts = [
    'typeface-roboto/files/roboto-latin-400.woff',
    'typeface-roboto/files/roboto-latin-400.woff2',
    'typeface-roboto/files/roboto-latin-500.woff',
    'typeface-roboto/files/roboto-latin-500.woff2',
    'typeface-roboto/files/roboto-latin-700.woff',
    'typeface-roboto/files/roboto-latin-700.woff2',
    'typeface-roboto/files/roboto-latin-900.woff',
    'typeface-roboto/files/roboto-latin-900.woff2',
];

var js = [
    'bootstrap/dist/js/bootstrap.min.js',
    'd3/dist/d3.min.js',
    'jquery/dist/jquery.min.js',
    'save-svg-as-png/lib/saveSvgAsPng.js',
    'd3-save-svg/build/d3-save-svg.min.js'
];

module.exports = {'css': css, 'fonts': fonts, 'js': js};
