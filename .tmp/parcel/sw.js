"use strict";

/**
 * Welcome to your Workbox-powered service worker!
 * 
 * Learn how to configure workbox here: https://developers.google.com/web/tools/workbox/guides/configure-workbox
 *
 * First, we reference the locally bundled workbox script
 **/
importScripts(
    "/.workbox/workbox-v3.6.3/workbox-sw.js"
);

// Then, we add placeholder for the precache routes manifest
// DO NOT REMOVE! :)
workbox.precaching.precacheAndRoute([]);

// Put any of your custom workbox logic below!