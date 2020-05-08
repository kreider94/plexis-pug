'use strict';

exports = module.exports = {};

exports.jsFiles = [
	'/js/requirejs.js',
	'/js/soundcloud.player.api.js',
];

// gulp-sass (node-sass) options
//  https://github.com/sass/node-sass#options
//
exports.sass = {};

// gulp-cssmin options
//  https://github.com/chilijung/gulp-cssmin#api
exports.cssmin = {};

// autoprefixer options
//  https://github.com/sindresorhus/gulp-autoprefixer#options
//
exports.autoprefixer = {
	cascade: false // see -> https://github.com/postcss/autoprefixer#visual-cascade
};
