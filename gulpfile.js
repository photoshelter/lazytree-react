// Modeled after gulpfile here:
// https://hacks.mozilla.org/2014/08/browserify-and-gulp-with-react/
var gulp = require('gulp');
var reactify = require('reactify');
var browserify = require('browserify');
var del = require('del');
var source = require('vinyl-source-stream');
var eslint = require('gulp-eslint');

var paths = {
    lazytree: ['src/lazytree.jsx', 'src/lazynode.jsx', 'src/utils.jsx'],
    demo: ['demo/demo.jsx']
};

gulp.task('clean', function(done) {
    del(['build'], done);
});

gulp.task('lint', function() {
    return gulp.src(paths.lazytree, paths.demo)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError())
});

gulp.task('build-lazytree', function() {
    browserify(paths.lazytree)
    .transform(reactify)
    .bundle()
    .pipe(source('lazytree.js'))
    .pipe(gulp.dest('./build/'));
});

gulp.task('build-demo', function() {
    browserify(paths.demo)
    .transform(reactify)
    .bundle()
    .pipe(source('demo.js'))
    .pipe(gulp.dest('./build/'));
});

gulp.task('build', ['build-lazytree', 'build-demo']);

gulp.task('watch', function() {
    gulp.watch(paths.lazytree, ['lint', 'build-lazytree']);
    gulp.watch(paths.demo, ['lint', 'build-demo']);
});

gulp.task('default', ['watch', 'build-lazytree', 'build-demo']);
