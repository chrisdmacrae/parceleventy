"use strict";

const JSAsset = require('parcel-bundler/lib/assets/JSAsset');
const nunjucks = require('nunjucks');
const path = require('path');

class NunjucksAsset extends JSAsset {
    constructor(name, opts) {
        super(name, opts);

        this.configFiles = ['.nunjucksrc', '.nunjucks.js'];
        this.packageName = "nunjucks";
    }

    async pretransform() {
        const configOpts = {
            packageName: this.packageName
        }
        const config = await this.getConfig(this.configFiles, configOpts) || {};
        const nunjucksOpts = Object.assign({}, config, {
            name: this.name.replace(path.normalize(process.cwd()), "")
        });
        const precompiled = nunjucks.precompileString(this.contents, nunjucksOpts);

        if (nunjucksOpts.asFunction) {
            this.contents = 
                `
                const nunjucks = require('nunjucks');
                module.exports = ${precompiled}
                `
        } else {
            this.contents = 
                `
                module.exports = ${precompiled}
                `
        }

        return await super.pretransform();
    }
}

module.exports = NunjucksAsset