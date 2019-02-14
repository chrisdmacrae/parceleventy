"use strict";

const glob = require('globby');
const path = require('path');
const fs = require('fs-extra');

module.exports = bundler => {
    const {rootDir, outDir } = bundler.options;
    let files = glob.sync(path.join(rootDir, "**/*"));
    let assets = [];
    let assetExts = [];
    let toCopy = [];

    Object.keys(bundler.parser.extensions).forEach(ext => assetExts = addExt(ext, assetExts));
    bundler.packagers.packagers.forEach((value, ext) => assetExts = addExt(ext, assetExts));

    bundler.on('bundled', (bundle) => {
        assets = resolveAssetsFromBundle(bundle, assets);
        toCopy = resolveFilesToCopy(files, assets, assetExts);

        for (let file of toCopy) {
            const outputPath = path.resolve(path.normalize(outDir), path.normalize(file).replace(path.normalize(rootDir), "./"));
            const data = fs.readFileSync(file);

            fs.outputFileSync(outputPath, data);
        }
    });
}

function resolveAssetsFromBundle(bundle, assets) {
    let bundles = [bundle];

    if (bundle.childBundles && bundle.childBundles.size > 0) {
        bundles = resolveChildBundlesFromBundle(bundle, bundles);
    }

    for (let bundle of bundles) {
        if (bundle.assets && bundle.assets.size > 0) {
            for (let [key, asset] of bundle.assets.entries()) {
                assets = resolveAssetsFromAsset(asset, assets);
            }
        }
    }

    return assets;
}

function resolveChildBundlesFromBundle(bundle, bundles) {
    if (bundle.childBundles && bundle.childBundles.size > 0) {
        for (let [key, childBundle] of bundle.childBundles.entries()) {
            bundles.push(childBundle);

            if (childBundle.childBundles) {
                bundles = resolveChildBundlesFromBundle(childBundle, bundles);
            }
        }
    }

    return bundles;
}

function resolveAssetsFromAsset(asset, assets) {
    const name = asset.name;
    const exists = assets.indexOf(name) > -1;

    if (!exists) {
        assets.push(name);
    }

    if (asset.depAssets.size > 0) {
        for (let [key, depAsset] of asset.depAssets.entries()) {
            assets = resolveAssetsFromAsset(depAsset, assets);
        }
    }

    return assets;
}

function resolveFilesToCopy(files, assets, exts) {
    files = files
        .filter(file => assets.indexOf(file) === -1)
        .filter(file => {
            const ext = path.extname(file);

            return exts.indexOf(ext) === -1;
        });

    return files;
}

function addExt(ext, exts) {
    const trueExt = ext.startsWith('.') ? ext : `.${ext}`;
    const exists = exts.indexOf(trueExt) > -1;

    return exists ? exts : exts.concat(trueExt);
}