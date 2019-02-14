"use strict";

const nunjucks = require('nunjucks');
const html5Boilerplate = require('includes/extends/html5boilerplate.njk');

console.log(nunjucks.render('/src/includes/extends/html5boilerplate.njk'))

console.log('Hello world from /js/index.ts!');