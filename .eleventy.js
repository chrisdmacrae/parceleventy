"use strict";

const glob = require('fast-glob');
const path = require('path');

/**
 * The @11ty/eleventy configuration.
 * 
 * For a full list of options, see: https://www.11ty.io/docs/config/
 */
module.exports = (eleventyConfig) => {
    const paths = {
        filters: path.join(process.cwd(), "src/filters/*.js"),
        shortcodes: path.join(process.cwd(), "src/shortcodes/*.js"),
        transforms: path.join(process.cwd(), "src/transforms/*.js")
    }
    const dirs = {
        input: "src/assets/",
        data: `../data/`,
        includes: `../includes/`,
    }
    const files = glob.sync(path.join(process.cwd(), dirs.input, "**/*"));
    const exts = files.map(file => path.extname(file).replace('.', ''));
    const filters = glob.sync(paths.filters);
    const shortcodes = glob.sync(paths.shortcodes);
    const transforms = glob.sync(paths.transforms);

    // Add all found filters
    filters.forEach(filter => eleventyConfig.addFilter(resolveNameFromPath(filter), filter));

    // Add all found shortcodes
    shortcodes.forEach(shortcode => eleventyConfig.addShortcode(resolveNameFromPath(shortcode), shortcode));

    // Add all found transforms
    transforms.forEach(transform => eleventyConfig.addTransform(resolveNameFromPath(transform), transform));

    // Make all files pass through to cache
    eleventyConfig.setTemplateFormats(exts);

    return {
        // Set the path from the root of the deploy domain
        // i.e, example.com + "/"
        pathPrefix: "/",

        // Set the src and output directories
        dir: dirs,

        // Set the default template engine from `liquid` to `njk`
        htmlTemplateEngine: "njk",
        markdownTemplateEngine: "njk",
        dataTemplateEngine: "njk",

        // Set up eleventy to pass-through files to be compiled by Parcel
        passthroughFileCopy: true
    };
};

function resolveNameFromPath(path) {
    return path.basename(path);
}