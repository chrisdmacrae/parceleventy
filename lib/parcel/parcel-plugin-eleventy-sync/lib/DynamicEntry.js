"use strict";

const glob = require('globby');
const path = require('path');
const fs = require('fs-extra');

class DynamicEntry {
    constructor(entryName, bundler) {
        this.options = bundler.options;
        this.name = entryName;
        this.path = path.join(this.options.rootDir, this.name);

        bundler.entryFiles.push(this.path);
        bundler.options.entryFiles.push(this.path);
        this._write(this.path);

        bundler.on('buildStart', () => this.handleBuildStart());
        bundler.on('buildEnd', () => this.handleBuildEnd());
    }

    handleBuildStart() {
        this._write(this.path);
    }

    handleBuildEnd() {
        const exists = fs.existsSync(this.destination);
    
        if (this.options.production && exists) {
            fs.unlinkSync(this.destination);
    
            return true;
        }
    
        return false;
    }

    _write(p) {
        let output = "";
        let existing = "";
        const entryFilesPattern = path.join(this.options.rootDir, "**/*.html");
        const entryFiles = glob.sync(entryFilesPattern);
        const exists = fs.existsSync(p);
    
        if (exists) {
            existing = fs.readFileSync(p, {encoding: "utf-8"});
        }
    
        for (var file of entryFiles) {
            if (!file.endsWith(this.name)) {
                const rootPath = path.normalize(file).replace(path.normalize(this.options.rootDir), "");
                const anchor = `<a href="${rootPath}"></a>\n`;
                output += anchor;
            }
        }
    
        if (existing.trim() !== output.trim()) {
            fs.writeFileSync(p, output.trim());
        }
    }
}

module.exports = DynamicEntry;