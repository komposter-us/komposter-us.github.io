const gulp = require("gulp");
const del = require("del"); // для удаления файлов/папок
let sass = require("gulp-sass");
sass.compiler = require("node-sass");
const browserSync = require("browser-sync").create();
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer"); // автоматически добавляет вендорные префиксы к CSS свойствам (req .browserslistrc)
const cssvariables = require("postcss-css-variables");
const calc = require("postcss-calc");
const sourcemaps = require("gulp-sourcemaps"); // указывает src файл js/css для инспектора браузров
const concat = require("gulp-concat");
const rename = require("gulp-rename");
const uncss = require("gulp-uncss"); // убирает неиспользуемые css классы
// minify js/css
const uglify = require("gulp-uglify-es").default; // сжатие js es6 кода
const cleanCSS = require("gulp-clean-css"); // сжатие CSS кода
const imagemin = require("gulp-imagemin");
const htmlmin = require("gulp-htmlmin");
// Node module support
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const merge = require("merge-stream");
// Helpers
const { getFilesList } = require("@raz1el/util");
const path = require("path");

// Пути
const ROOT = "./";
const DIST = "dist/";
const SRC = "src/";

const PATH = {
    // готовые файлы после сборки
    build: {
        css: ROOT + DIST + "css",
        js: ROOT + DIST + "js",
        img: ROOT + DIST + "img",
        font: ROOT + DIST + "font",
    },
    // пути исходных файлов
    src: {
        css: ROOT + SRC + "scss/",
        js: ROOT + SRC + "js/",
        img: ROOT + SRC + "img/*",
        font: ROOT + SRC + "font/*",
        html: ROOT + SRC + "*.html"
    }
};
// \ Пути

const pkg = JSON.parse(require("fs").readFileSync("./package.json", { encoding: "utf8" }));
/* Put obj into package.json
"gulp": {
    "sass": 1,
    "js": 1,
    // Список css классов (используются для js), которые игнорируются uncss
    "uncss": {
        enable: true,
        ignore: [".hidden"]
    }
},
*/
const SASS_COMPILE_TYPE = {
    MULTIPLE_OUT_FILES: 0, // Файлы считываются только в root директории scss. На выходе получается несколько файлов стилей
    MERGE_FILES: 1 // Файлы считываются рекурсивно в root директории scss. На выходе получается один файл стилей
};

const JS_COMPILE_TYPE = {
    MULTIPLE_OUT_FILES: 0,
    MERGE_FILES: 1
};

gulp.task("build:sass", () => {
    return sassBuild(true, pkg.gulp.sass);
});

gulp.task("build-dev:sass", () => {
    return sassBuild(false, pkg.gulp.sass);
});

gulp.task("build:js", () => {
    return jsBuild(true, pkg.gulp.js);
});

gulp.task("build:img", () => {
    return gulp.src(PATH.src.img)
        .pipe(imagemin({
            verbose: true
        }))
        .pipe(gulp.dest(PATH.build.img));
});

gulp.task("build:font", () => {
    return gulp.src(PATH.src.font)
        .pipe(gulp.dest(PATH.build.font));
});

gulp.task("build:html", () => {
    return gulp.src(PATH.src.html)
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true,
        }))
        .pipe(gulp.dest(DIST));
});

gulp.task("clean", () => {
    return del([ROOT + DIST]);
});

gulp.task("build", gulp.series(["clean", "build:sass", "build:js", "build:img", "build:html", "build:font"]));
gulp.task("build-dev", gulp.series(["clean", "build-dev:sass", "build:js", "build:img", "build:html", "build:font"]));

gulp.task("browserSync", gulp.series((done) => {
    browserSync.init({
        watch: true,
        server: ROOT + DIST
        // notify: false
    });
    done();
}));

gulp.task("watch", gulp.series(["build", "browserSync"], () => {
    gulp.watch(PATH.src.css, gulp.series(["build:sass"]));
    gulp.watch(PATH.src.js, gulp.series(["build:js"]));
    gulp.watch(PATH.src.img, gulp.series(["build:img"]));
    gulp.watch(PATH.src.html, gulp.series(["build:html"]));
    gulp.watch(PATH.src.html, gulp.series(["build:font"]));
}));

gulp.task("watch-dev", gulp.series(["build-dev", "browserSync"], () => {
    gulp.watch(PATH.src.css, gulp.series(["build-dev:sass"]));
    gulp.watch(PATH.src.js, gulp.series(["build:js"]));
    gulp.watch(PATH.src.img, gulp.series(["build:img"]));
    gulp.watch(PATH.src.html, gulp.series(["build:html"]));
    gulp.watch(PATH.src.html, gulp.series(["build:font"]));
}));

function sassBuild(production, sassCompileType) {
    switch (sassCompileType) {
        case SASS_COMPILE_TYPE.MULTIPLE_OUT_FILES: {
            return merge(getFilesList(PATH.src.css)
                .map(file => {
                    return sassCallback({
                        srcPath: file,
                        outPath: PATH.build.css,
                        outFileName: path.basename(file).replace(/(.scss|.css)$/, "") + ".min.css",
                        htmlPath: PATH.src.html,
                        production
                    });
                }));
        }
        case SASS_COMPILE_TYPE.MERGE_FILES: {
            return sassCallback({
                srcPath: PATH.src.css + "**/*.scss",
                outPath: PATH.build.css,
                outFileName: "style.min.css",
                htmlPath: PATH.src.html,
                production
            });
        }
    }
}

function sassCallback(config) {
    let stream = gulp.src(config.srcPath);

    if (config.production)
        stream = stream.pipe(sass({}).on("error", sass.logError));
    else
        stream = stream.pipe(sourcemaps.init()).pipe(sass({
            outputStyle: "expanded"
        }).on("error", sass.logError));

    stream = stream.pipe(postcss([autoprefixer(), cssvariables({
        preserve: true
    }), calc()]))
        .pipe(concat(config.outFileName));

    if (pkg.gulp.uncss.enable)
        stream = stream.pipe(uncss({
            html: [config.htmlPath],
            ignore: pkg.gulp.uncss.ignore
        }));

    return stream.pipe(gulp.dest(config.outPath))
        .pipe(rename((path) => {
            path.basename += ".min";
        }))
        .pipe(cleanCSS())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(config.outPath));
}

function jsBuild(production) {
    switch (pkg.gulp.js) {
        // https://stackoverflow.com/questions/41043032/browserify-parseerror-import-and-export-may-appear-only-with-sourcetype
        case JS_COMPILE_TYPE.MULTIPLE_OUT_FILES: {
            return merge(getFilesList(PATH.src.js)
                .map(file => {
                    return browserify({
                        entries: [file],
                        debug: true
                    }).bundle()
                        .pipe(source(path.basename(file).replace(/(.js)$/, "") + ".min.js"))
                        .pipe(buffer())
                        .pipe(sourcemaps.init({ loadMaps: true }))
                        // Add transformation tasks to the pipeline here.
                        .pipe(uglify())
                        .on("error", console.error)
                        .pipe(sourcemaps.write("./"))
                        .pipe(gulp.dest(PATH.build.js));
                }));
        }
        case JS_COMPILE_TYPE.MERGE_FILES: {
            if (production) {
                return gulp.src(PATH.src.js + "**//*js")
                    .pipe(concat("scripts.min.js"))
                    .pipe(uglify())
                    .pipe(gulp.dest(PATH.build.js));
            }
            return gulp.src(PATH.src.js)
                .pipe(sourcemaps.init({ loadMaps: true }))
                .pipe(concat("scripts.js"))
                .pipe(gulp.dest(PATH.build.js))
                .pipe(rename(function (path) {
                    path.basename += ".min";
                }))
                .pipe(uglify())
                .pipe(sourcemaps.write("./"))
                .pipe(gulp.dest(PATH.build.js));
        }
    }
}