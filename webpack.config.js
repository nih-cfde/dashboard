var path = require('path');
var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');

// assets.js
var assets = require('./js/assets');

var copiers = [];

Object.keys(assets).forEach(function(key) {
    if (assets[key].length > 0) {

        var copier = new CopyWebpackPlugin(
            assets[key].map(asset => {
                if (typeof asset === 'object') {
                    var source = asset['source'];
                    var asset_type = asset['type'];
                    var dest = null;

                    if (asset.hasOwnProperty('dest')) {
                        dest = asset['dest'];
                    } else {
                        dest = path.basename(source);
                    }

                    var return_val = {
                        from: path.resolve(__dirname, `./node_modules/${source}`),
                        to: path.resolve(__dirname, `./${key}/components/${dest}`)
                    };

                    if (asset_type === 'dir') {
                        return_val['toType'] = 'dir';
                    }

                    return return_val;
                } else {
                    return {
                        from: path.resolve(__dirname, `./node_modules/${asset}`),
                        to: path.resolve(__dirname, `./${key}/components/`)
                    };
                }
            })
        );

        copiers.push(copier);
    }
});

module.exports = {
    performance: {
        maxAssetSize: 500000
    },
    entry: {
        'index': __dirname + '/js/index.js'
    },
    output: {
        path: __dirname + '/js/components/',
        filename: '[name].bundle.js'
    },
    plugins: copiers
};
