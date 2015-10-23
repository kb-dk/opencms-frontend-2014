/* global require */
var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var del = require('del');

gulp.task('default', ['production'], function () {});

gulp.task('clean', function (cb) {
    del(['production', 'development'], cb);
});

gulp.task('production', ['clean'], function (cb) {
    gutil.log('Building a ', gutil.colors.cyan('production'), 'build');
    // minify and move js file
    gutil.log('Minifying and moving js/kb/*.js files ...');
    gulp.src('js/kb/*.js')
    .pipe(uglify())
    .pipe(rename(function (path) {
        path.basename += '_min';
    }))
    .pipe(gulp.dest('production'));

    gutil.log('Create a bundle of ', gutil.colors.cyan('Kb_mediaChannel_min.js'), ',', gutil.colors.cyan('Kb_youtube_min.js'), 'and', gutil.colors.cyan('Kb_soundcloud_min.js'), 'by typing', gutil.colors.green('gulp bundle'));

    if (cb) {
        cb();
    }
});

gulp.task('development', [], function (cb) {
    gutil.log('Building a ', gutil.colors.cyan('development'), 'build');
    gutil.log('copying youtube and soundcloud scripts');
    gulp.src(['js/kb/Kb_youtube.js', 'js/kb/Kb_soundcloud.js'])
    .pipe(gulp.dest('development'));
    gutil.log('Concatenating mediachannel, youtube and soundcloud script in a bundle');
    gulp.src(['js/kb/Kb_mediaChannel.js','js/kb/Kb_youtube.js','js/kb/Kb_soundcloud.js'])
    .pipe(concat('Kb_youtubeSoundcloudBundle_full.js'))
    .pipe(gulp.dest('development'));
});

gulp.task('bundle', [], function (cb) {
    gutil.log('Doing', gutil.colors.cyan('postprod'), 'build');
    gutil.log('Concatening youtube and soundcloud minified scripts ...');
    gulp.src(['production/Kb_mediaChannel_min.js', 'production/Kb_youtube_min.js', 'production/Kb_soundcloud_min.js'])
    .pipe(concat('Kb_youtubeSoundcloudBundle.js'))
    .pipe(gulp.dest('production'));

    if (cb) {
        cb();
    }
});
