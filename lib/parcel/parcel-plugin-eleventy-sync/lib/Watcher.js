"use strict";

const Asset = require('parcel-bundler/lib/Asset');
const fs = require('fs-extra');
const glob = require('fast-glob');
const path = require('path');
const Watcher = require('@parcel/watcher');
const logger = require('@parcel/logger');

class EleventyWatcher {
    constructor(entryName, bundler) {
        this.options = bundler.options;
        this.name = entryName;
        this.config;
        this.configFiles = [".eleventy.js"];
        this.packageKey = "eleventy";
        this.unlinked = new Set();
        this.tracked = new Set();
        this.watcher = new Watcher();
        
        // todo: get eleventy output dynamically
        // this.loadConfig();
        this.options.eleventyDist = path.resolve(this.options.rootDir, "../11ty/");

        this.watcher.add(this.options.eleventyDist);
        this.watcher.on('add', path => this.handleAdd(path));
        this.watcher.on('change', path => this.handleChange(path));
        this.watcher.on('unlink', path => this.handleUnlink(path));
        bundler.on('buildStart', () => this.handleBuildStart());
    }

    async handleAdd(path) {
        try {
            const isUnlinked = this.unlinked.has(path);

            if (isUnlinked) {
                await this._add(path);
                this.unlinked.delete(path);
            } else {
                await this._add(path);
                await this._forceUpdate()
            }
        } catch (error) {
            logger.error(error);
        }
    }

    async handleChange(path) {
        try {
            const isUnlinked = this.unlinked.has(path);

            if (isUnlinked) {
                this.unlinked.delete(path);
            }

            await this._add(path);
        } catch (error) {
            logger.error(error);
        }
    }

    async handleUnlink(path) {
        try {
            const isUnlinked = this.unlinked.has(path);

            if (!isUnlinked) {
                this.unlinked.add(path);
            }
        } catch (error) {
            logger.error(error);
        }
    }

    handleBuildStart() {
        try {
            const sourcePattern = path.join(this.options.eleventyDist, "**/*");
            const sourceFiles = glob.sync(sourcePattern);

            for (let file of this.unlinked) {
                const shouldDelete = sourceFiles.indexOf(file) === -1;
                const exists = fs.existsSync(file);

                if (shouldDelete && exists) {
                    this._delete(file);
                }
            }
        } catch (error) {
            logger.error(error);
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

    async _add(p) {
        try {
            // todo: replace with config-based 11ty path check
            const relPath = path.normalize(p).slice(p.indexOf('11ty') + 4);
            const outputPath = path.join(this.options.rootDir, relPath);
            const exists = await this._ensureFileExists(p, 200);
            const isDirectory = fs.lstatSync(p).isDirectory();

            if (exists && !isDirectory) {
                let oldData = "";
                const oldExists = fs.existsSync(outputPath);
                const newData = fs.readFileSync(p);

                if (oldExists) {
                    oldData = fs.readFileSync(outputPath);
                }

                if (!oldExists || oldExists && oldData != newData) {
                    fs.outputFileSync(outputPath, newData);
                    this.tracked.add(p);
                }
            }
        } catch (error) {
            throw error;
        }
    }

    _delete(p) {
        const exists = fs.existsSync(p);
        const isTracked = this.tracked.has(p);

        if (exists) {
            fs.unlinkSync(p);

            if (isTracked) {
                this.tracked.delete(p);
            }
        }
    }

    async _forceUpdate() {
        try {
            const eleventyManifestPath = path.resolve(this.options.rootDir, this.name);
            const exists = await this._ensureFileExists(eleventyManifestPath);

            if (exists) {
                fs.outputFileSync(eleventyManifestPath, "");
            }
        } catch (error) {
            throw error;
        }
    }

   _ensureFileExists(path, timeout) {
       return new Promise((resolve, reject) => {
            let tries = 0;
            const timer = setInterval(() => {
                const exists = fs.existsSync(path);

                if (exists) {
                    clearInterval(timer);
                    resolve(true);
                }

                if (tries >= 5) {
                    clearInterval(timer);
                    resolve(true);
                }

                tries++;
            }, timeout);
        });
    }
}

module.exports = EleventyWatcher;