// Modeled after gulpfile here:
// https://hacks.mozilla.org/2014/08/browserify-and-gulp-with-react/
var gulp = require('gulp');
var reactify = require('reactify');
var browserify = require('browserify');
var del = require('del');
var source = require('vinyl-source-stream');
var eslint = require('gulp-eslint');

var paths = {
    jsx: ['src/lazytree.jsx', 'src/lazynode.jsx', 'demo/app.jsx']
};

gulp.task('clean', function(done) {
    del(['build'], done);
});

gulp.task('lint', function() {
    return gulp.src(paths.jsx)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError())
});

gulp.task('lazytree', function() {
    browserify(paths.jsx)
    .transform(reactify)
    .bundle()
    .pipe(source('lazytree.js'))
    .pipe(gulp.dest('./build/'));
});

gulp.task('watch', function() {
    gulp.watch(paths.jsx, ['lint', 'lazytree']);
});

gulp.task('default', ['watch', 'jsx']);
