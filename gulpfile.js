/* global require, console */
var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
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

    if (cb) {
        cb();
    }
});
