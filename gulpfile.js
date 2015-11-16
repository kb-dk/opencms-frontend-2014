/* global require */
var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var minifyCSS = require('gulp-minify-css');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var del = require('del');

// CONSTANTS
var DEVDEST = 'development';
var PRODDEST = 'production';
var JSSRC = 'js/kb/*.js';
var BUNDLEJSSRC = ['js/Kb_mediaChannel_min.js', 'js/Kb_youtube_min.js', 'js/Kb_soundcloud_min.js'];
var LESSSRC = 'less/style.less';
var MEDIACHANNELLESSSRC = 'less/kb/mediaChannelBundle.less';

gulp.task('default', [PRODDEST], function () {});

gulp.task('clean', function (cb) {
    del([PRODDEST, DEVDEST], cb);
});

gulp.task('production', ['clean'], function (cb) {
    gutil.log('Building a ', gutil.colors.cyan('production'), 'build');
    // minify and move js file
    gutil.log('Minifying and moving js/kb/*.js files ...');
    gulp.src(JSSRC)
    .pipe(uglify())
    .pipe(rename(function (path) {
        path.basename += '_min';
    }))
    .pipe(gulp.dest(PRODDEST + '/js'));

    gutil.log('Create a bundle of ', gutil.colors.cyan('Kb_mediaChannel_min.js'), ',', gutil.colors.cyan('Kb_youtube_min.js'), 'and', gutil.colors.cyan('Kb_soundcloud_min.js'), 'by typing', gutil.colors.green('gulp bundle'));

    gutil.log('Compiling, minifying and moving less/style.less ...');
    gulp.src(LESSSRC)
    .pipe(less())
    .pipe(minifyCSS())
    .pipe(gulp.dest(PRODDEST + '/css'));

    gutil.log('Compiling, minifying and moving less/kb/mediaChannelBundle.less.js ...');
    gulp.src(MEDIACHANNELLESSSRC)
    .pipe(less())
    .pipe(minifyCSS())
    .pipe(gulp.dest(PRODDEST + '/css'));

    if (cb) {
        cb();
    }
});

gulp.task('development', [], function (cb) {
    gutil.log('Building a ', gutil.colors.cyan('development'), 'build');
    gutil.log('copying youtube and soundcloud scripts');
    gulp.src(['js/kb/Kb_youtube.js', 'js/kb/Kb_soundcloud.js'])
    .pipe(gulp.dest(DEVDEST));
    gutil.log('Concatenating mediachannel, youtube and soundcloud script in a bundle');
    gulp.src(BUNDLEJSSRC)
    .pipe(concat('Kb_youtubeSoundcloudBundle_full.js'))
    .pipe(gulp.dest(DEVDEST));
});

gulp.task('bundle', [], function (cb) {
    gutil.log('Doing', gutil.colors.cyan('postprod'), 'build');
    gutil.log('Concatening youtube and soundcloud minified scripts ...');
    gulp.src(BUNDLEJSSRC.map(function (path) { return PRODDEST + '/' + path}))
    .pipe(concat('Kb_youtubeSoundcloudBundle.js'))
    .pipe(gulp.dest(PRODDEST + '/js'));

    if (cb) {
        cb();
    }
});
