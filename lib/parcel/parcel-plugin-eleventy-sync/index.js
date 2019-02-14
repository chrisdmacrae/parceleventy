"use strict";

const EleventyWatcher = require('./lib/Watcher');
const DynamicEntry = require('./lib/DynamicEntry');

module.exports = bundler => {
    const dynamicEntry = "_11ty.html";

    new DynamicEntry(dynamicEntry, bundler);

    if (!bundler.options.production) {
        new EleventyWatcher(dynamicEntry, bundler);
    }
}