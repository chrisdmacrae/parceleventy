"use strict";

/**
 * The browser-sync configuration.
 * 
 * For a full list of options, see: http://www.browsersync.io/docs/options/
 */
module.exports = {
    serveStatic: ['./dist'],
    serveStaticOptions: {
        extensions: ['html']
    },
    https: true,
    open: false,
    watch: true,
    watchOptions: {
        ignoreInitial: true
    },
    ignore: [],
};