'use strict';
var neo4j       = require('neo4j-driver'),
    requirejs   = require('requirejs'),
    d3          = require('d3'),
    gulp        = require('gulp'),
    sass        = require('gulp-sass'),
    nodemon     = require('gulp-nodemon'),
    browserSync = require('browser-sync').create();


var fs = require('fs');
var cp = require('child_process');
var path = require('path');

var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var app, running;
var config = require('./gulp-config');

if(process.env.NODE_ENV !== 'production'){
  var browserSync = require('browser-sync');
}

gulp.task('nodemon', function() {
  nodemon({
    script: 'app.js',
    ext: 'js'
  })
  .on('restart', function() {
    console.log('>> node restart');
  })
});

// sass to css build
//
gulp.task('sass', function(){
  return gulp.src('sass/core.scss')
    .pipe(sourcemaps.init())
    .pipe(sass(config.sass).on('error', sass.logError))
    .pipe(autoprefixer(config.autoprefixer))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest('public/stylesheets'));
});
// watch task
//
gulp.task('watch', function(){
  var timer = {};

  // watch sass and rerun sass task
  gulp.watch('sass/**/*', gulp.series('sass'));

  gulp.watch('views/**/*.jade', browserSync.reload);

  // whenever there is in a change reload
  gulp.watch('public/**/*', function(){
    clearTimeout(timer.public);
    timer.public = setTimeout(browserSync.reload, 1000);
  });

  gulp.series('nodemon'); // restart the server
});

console.log('node env: ', process.env.NODE_ENV);

if(process.env.NODE_ENV === 'production'){
  gulp.task('default', ['sass']);
} else {
  gulp.task('default', gulp.parallel('sass', 'nodemon', 'watch'));
}

// assure we have closed the server process
process.on('exit', function(){
  if(app){ app.kill(); }
});
