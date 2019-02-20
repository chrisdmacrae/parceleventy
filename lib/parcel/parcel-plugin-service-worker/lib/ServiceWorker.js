"use strict";

const Asset = require('parcel-bundler/lib/Asset');
const fs = require('fs-extra');
const glob = require('fast-glob');
const logger = require('@parcel/logger');
const path = require('path');
const workbox = require('workbox-build');
const STRATEGIES = [
    "GENERATE",
    "INJECT"
];

class ParcelServiceWorker {
    constructor(bundler) {
        this.options = bundler.options;
        this.name = "sw.js";
        this.configFiles = ['.workboxrc', '.workbox-config.js'];
        this.packageKey = "workbox";
        this.strategy = STRATEGIES[0];
        this.importScripts = [];
        this.hasCopiedLibraries = false;

        bundler.on('buildEnd', () => this.handleBuildEnd());
    }

    async handleBuildEnd() {
        try {
            const destination = path.resolve(this.options.outDir, this.name);
            const config = await this.loadConfig();
            
            if (config && config.strategy) {
                this.strategy = STRATEGIES[config.strategy];
            }

            if (!this.hasCopiedLibraries) {
                await this.copyLibraries();
            }

            if (this.strategy == STRATEGIES[0]) {
                await this.generateSW(destination, config.generate);
            } else if (this.strategy == STRATEGIES[1]) {
                await this.injectSW(destination, config.inject);
            } else {
                throw new Error('Invalid strategy');
            }

        } catch (error) {
            logger.error(error);
        }
    }

    async copyLibraries() {
        try {
            const libraryPath = ".workbox";
            const destination = path.resolve(this.options.outDir, libraryPath);

            await workbox.copyWorkboxLibraries(destination);

            const vendorImports = glob.sync(path.join(destination, "**/workbox-sw.js"), {
                dot: true
            }).map(p => path.normalize(p).replace(path.normalize(this.options.outDir), ""));

            this.importScripts = this.importScripts.concat(vendorImports);
            this.hasCopiedLibraries = true;
        } catch (error) {
            throw error;
        }
    }

    async generateSW(destination, config = {}) {
        try {
            const defaultConfig = {
                globDirectory: this.options.outDir,
                globPatterns: [
                '**/*.{js,css,html,png,jpg,jpeg,gif,tiff}'
                ],
                importWorkboxFrom: 'disabled',
                importScripts: [],
                swDest: destination
            }
            const cfg = Object.assign(defaultConfig, config);

            cfg.importScripts = cfg.importScripts.concat(this.importScripts);

            logger.progress('Creating service worker...');

            await workbox.generateSW(cfg);

            logger.log('Service worker generated at: ' + cfg.swDest);
        } catch (error) {
            throw error;
        }
    }

    async injectSW(destination, config = {}) {
        try {
            const defaultConfig = {
                globDirectory: this.options.outDir,
                globPatterns: [
                '**/*.{js,css,html,png,jpg,jpeg,gif,tiff}'
                ],
                swSrc: destination + ".tmp",
                swDest: destination
            }
            const cfg = Object.assign(defaultConfig, config);

            logger.progress('Injecting service worker manifest...');

            fs.copySync(cfg.swDest, cfg.swDest + ".tmp");

            let { count, size } = await workbox.injectManifest(cfg);
            fs.unlinkSync(cfg.swDest + ".tmp");

            logger.log('Service worker manifest injected at: ' + cfg.swDest);
            logger.log(`Will precache ${count} files, totaling ${size} bytes.`);
        } catch (error) {
            throw error;
        }
    }

    async loadConfig() {
        try {
            const asset = new Asset(path.resolve(this.options.rootDir, this.name), this.options);
            const config = await asset.getConfig(this.configFiles, {
                packageKey: this.packageKey
            });

            if (config) {
                return typeof config === "function" ? config() : config;
            }

            return {};
        } catch (error) {
            logger.error(error);
        }
    }
}

module.exports = ParcelServiceWorker;
