/* global require */
var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var del = require('del');

gulp.task('default', ['production'], function () {});

gulp.task('clean', function (cb) {
    del(['production'], cb);
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

    gutil.log('Create a bundle of ', gutil.colors.cyan('Kb_youtube_min.js'), 'and', gutil.colors.cyan('Kb_soundcloud_min.js'), 'by typing', gutil.colors.green('gulp bundle'));

    if (cb) {
        cb();
    }
});

gulp.task('bundle', [], function (cb) {
    gutil.log('Doing', gutil.colors.cyan('postprod'), 'build');
    gutil.log('Concatening youtube and soundcloud minified scripts ...');
    gulp.src(['production/Kb_youtube_min.js', 'production/Kb_soundcloud_min.js'])
    .pipe(concat('Kb_youtubeSoundcĺoudBundle.js'))
    .pipe(gulp.dest('production'));

    if (cb) {
        cb();
    }
});
