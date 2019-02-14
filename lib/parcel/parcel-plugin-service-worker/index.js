"use strict";

const ServiceWorker = require('./lib/ServiceWorker');

module.exports = bundler => {
    new ServiceWorker(bundler);
}