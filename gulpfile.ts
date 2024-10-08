// Dependencies
const {src, dest, series, parallel} = require('gulp')
const concat = require('gulp-concat')
// const debug = require('gulp-debug')
const gulpDest = require('gulp-dest')
const terser = require('gulp-terser')
const del = require('del')
// @ts-ignore
const _ = require('lodash')

// Unit Testing
// const mocha = require('mocha')
// const chai = require('chai')

// Task Specific
const standard = require('gulp-standard')
// const gulpStylelint = require('gulp-stylelint')
const minCSS = require('gulp-clean-css')
const htmlmin = require('gulp-htmlmin')

// Interpreters
const babel = require('gulp-babel')
const less = require('gulp-less')
const sass = require('gulp-dart-sass')
const coffee = require('gulp-coffee')
const sourcemaps = require('gulp-sourcemaps')
const ts = require('gulp-typescript')

// TypeScript Transformers
const keysTransformer = require('ts-transformer-keys/transformer').default

// Helper Functions
const nullify = (proto: any) => {
    proto = proto || []
    if (!_.size(proto)) {
        return proto
    }
    const clone = _.clone(proto)
    _.each(clone, (value: string, key: number, list: string[]) => {
        list[key] = '!' + value
    })
    return clone
}

const babelSettings: any = {
    /* *
    presets: [
        [
            'env', {
            targets: {
                // The % refers to the global coverage of users from browserslist
                browsers: ['>0.25%']
            }
            // exclude: ['transform-strict-mode']
        }
        ]
    ],
     /* */
    plugins: [
        // 'transform-runtime',
        [
            'transform-es2015-modules-commonjs', {
            allowTopLevelThis: true,
            strictMode: false
        }
        ]
    ]
}

// Interfaces
interface Locations {
    template: {
        core: string[]
        min: string[]
        external: string[]
        nonstandard: string[]
    }
    css: {
        core: string[]
        min: string[]
        external: string[]
        nonstandard: string[]
    }
    coffee: {
        core: string[]
        compile: any[]
        external: string[]
    }
    preserve: {
        core: string[]
        min: string[]
        external: string[]
        nonstandard: string[]
    }
    less: {
        core: string[]
        compile: string[]
        external: string[]
    }
    sass: {
        core: string[]
        compile: string[]
        external: string[]
    }
    typescript: {
        core: string[]
        compile: string[]
        external: string[]
        nonstandard: string[]
    }
    boot: {
        output: string
        source: string[]
    }
    mangle: {
        core: string[]
        min: string[]
        nonstandard: string[]
    }
}

// Locations
const locations: Locations = {
    boot: {
        source: [
            'packages/boot/src/env.js',
            'packages/boot/src/config.js',
            'packages/boot/src/init.js'
        ],
        output: 'packages/boot/dist/boot.js'
    },
    // external: {
    //   core: [],
    //   min: []
    // },
    mangle: {
        core: [
            'dist/**/*.js',
            'packages/*/src/**/*.js'
        ],
        min: [
            'dist/**/*.min.js',
            'packages/*/src/**/*.min.js'
        ],
        nonstandard: []
    },
    preserve: {
        core: [
            'packages/*/dist/*.js',
            'packages/angularjs/src/**/*.js',
            'packages/angularjs-extras/src/**/*.js',
            'packages/calendar/src/**/*.js',
            'packages/idx/src/**/*.js',
            'packages/swiper/src/**/*.js'
        ],
        min: [
            'packages/*/dist/*.min.js',
            'packages/angularjs/src/**/*.min.js',
            'packages/angularjs-extras/src/**/*.min.js',
            'packages/boot/src/**/*.min.js',
            'packages/calendar/src/**/*.min.js',
            'packages/idx/src/**/*.min.js',
            'packages/swiper/src/**/*.min.js'
        ],
        external: [],
        nonstandard: []
    },
    less: {
        core: [
            // 'stratus.less',
            'packages/*/src/**/*.less'
        ],
        compile: [],
        external: [
            'packages/idx/src/**/*.less'
        ]
    },
    sass: {
        core: [
            // 'stratus.scss',
            'packages/*/src/**/*.scss'
        ],
        compile: [],
        external: []
    },
    css: {
        core: [
            // 'stratus.css',
            'packages/*/src/**/*.css'
        ],
        min: [
            // 'stratus.min.css',
            'packages/*/src/**/*.min.css'
        ],
        external: [],
        nonstandard: [
            'packages/*/src/**/*.css',
            'packages/*/dist/**/*.min.css'
        ]
    },
    coffee: {
        core: [
            'packages/*/src/**/*.coffee'
        ],
        compile: [],
        external: [],
    },
    typescript: {
        core: [
            'packages/*/src/**/*.ts'
        ],
        compile: [
            // 'packages/*/src/**/*.js.map'
        ],
        external: [
            '**/node_modules/**/*.ts'
        ],
        nonstandard: [
            'packages/angular/src/froala/**/*.ts',
            'packages/react/src/**/*.ts'
        ]
    },
    template: {
        core: [
            'packages/*/src/**/*.html'
        ],
        min: [
            'packages/*/src/**/*.min.html'
        ],
        external: [],
        nonstandard: []
    }
}

// Code Linters
function lintJS() {
    return src([
        // Pure JavaScript Files
        'packages/angularjs-extras/src/**/*.js',
        '!packages/angularjs-extras/src/**/*.min.js',
        'packages/boot/src/**/*.js',
        '!packages/boot/src/**/*.min.js',
        '!packages/boot/node_modules/**/*.js',
        'packages/runtime/src/**/*.js',
        '!packages/runtime/src/**/*.min.js',
        '!packages/runtime/node_modules/**/*.js',
        // TypeScript Supersedes
        '!packages/angularjs-extras/src/components/*.js',
        '!packages/angularjs-extras/src/controllers/*.js',
        '!packages/angularjs-extras/src/directives/*.js',
        '!packages/angularjs-extras/src/filters/*.js',
        '!packages/angularjs-extras/src/services/*.js',
        '!packages/boot/src/**/*.js',
        '!packages/runtime/src/stratus.js',
    ])
        /* *
         .pipe(debug({
         title: 'Lint JS:'
         }))
         /* */
        .pipe(standard())
        .pipe(standard.reporter('default', {
            fix: true,
            breakOnError: true,
            breakOnWarning: true,
            showRuleNames: true
        }))
}

/* *
function lintCSS() {
    return src(_.union(location.css.core, nullify(location.css.min), nullify(location.css.nonstandard)))
        .pipe(debug({
            title: 'Lint CSS:'
        }))
        .pipe(gulpStylelint({
            // fix: true,
            reporters: [
                {
                    formatter: 'string',
                    console: true
                }
            ]
        }))
}

/* */

// Distribution Functions
function distBoot() {
    return src(locations.boot.source)
        /* *
         .pipe(debug({
             title: 'Build Boot:'
         }))
         /* */
        .pipe(concat(locations.boot.output))
        .pipe(dest('.'))
}

// Mangle Functions
function cleanMangle() {
    if (!locations.mangle.min.length) {
        return Promise.resolve('No files selected.')
    }
    return del(_.union(locations.mangle.min, nullify(locations.mangle.nonstandard), nullify(locations.preserve.min)))
}

function compressMangle() {
    if (!locations.mangle.core.length) {
        return Promise.resolve('No files selected.')
    }
    return src(
        _.union(
            locations.mangle.core,
            nullify(locations.mangle.min),
            nullify(locations.mangle.nonstandard),
            nullify(locations.preserve.core)
        ), {
            base: '.'
        }
    )
        /* *
        .pipe(debug({
            title: 'Compress Mangle:'
        }))
        /* */
        // .pipe(sourcemaps.init())
        // .pipe(babel(babelSettings))
        .pipe(terser({
            // parse: {},
            // compress: {},
            mangle: true,
            output: {
                comments: false,
                ecma: 5,
                wrap_func_args: false
            }
            // sourceMap: {
            //   url: 'inline'
            // }
        }))
        // .pipe(sourcemaps.mapSources((sourcePath, file) => sourcePath.substring(sourcePath.lastIndexOf('/') + 1)))
        // .pipe(sourcemaps.write('.', {
        //   includeContent: false
        //   // sourceRoot: '.'
        // }))
        .pipe(gulpDest('.', {
            ext: '.min.js'
        }))
        .pipe(dest('.'))
}

// External Functions
// function cleanExternal () {
//   if (!location.external.min.length) {
//     return Promise.resolve('No files selected.')
//   }
//   return del(location.external.min)
// }
// function compressExternal () {
//   if (!location.external.core.length) {
//     return Promise.resolve('No files selected.')
//   }
//
//   return src(_.union(location.external.core, nullify(location.external.min)), {
//     base: '.'
//   })
//     /* *
//     .pipe(debug({
//       title: 'Compress External:'
//     }))
//     /* */
//     // .pipe(sourcemaps.init())
//     .pipe(babel(babelSettings))
//     .pipe(terser({
//       // parse: {},
//       // compress: {},
//       mangle: true,
//       output: {
//         comments: false,
//         ecma: 5,
//         wrap_func_args: false,
//       },
//       // sourceMap: {
//       //   url: 'inline'
//       // }
//     }))
//     .pipe(gulpDest('.', {
//       ext: '.min.js'
//     }))
//     .pipe(dest('.'))
// }

// Preserve Functions
function cleanPreserve() {
    if (!locations.preserve.min.length) {
        return Promise.resolve('No files selected.')
    }
    return del(_.union(locations.preserve.min, nullify(locations.mangle.min), nullify(locations.preserve.external)))
}

function compressPreserve() {
    if (!locations.preserve.core.length) {
        return Promise.resolve('No files selected.')
    }
    return src(
        _.union(
            locations.preserve.core,
            nullify(locations.preserve.min),
            nullify(locations.preserve.external),
            nullify(locations.mangle.min)
        ), {
        base: '.'
    })
        /* *
        .pipe(debug({
            title: 'Compress Preserve:'
        }))
        /* */
        // .pipe(sourcemaps.init())
        .pipe(babel(babelSettings))
        .pipe(terser({
            // parse: {},
            // compress: {},
            mangle: false,
            output: {
                comments: false,
                ecma: 2015,
                wrap_func_args: false
            }
            // sourceMap: {
            //   url: 'inline'
            // }
        }))
        // .pipe(sourcemaps.write())
        .pipe(gulpDest('.', {
            ext: '.min.js'
        }))
        .pipe(dest('.'))
}

// LESS Functions
const cleanLESS = () => {
    if (!locations.less.compile.length) {
        return Promise.resolve('No files selected.')
    }
    return del(_.union(locations.less.compile, nullify(locations.less.external)))
}

function compileLESS() {
    if (!locations.less.core.length) {
        return Promise.resolve('No files selected.')
    }
    return src(_.union(locations.less.core, nullify(locations.less.compile), nullify(locations.less.external)), {base: '.'})
        // .pipe(debug({ title: 'Compile LESS:' }))
        .pipe(sourcemaps.init())
        .pipe(less({
            globalVars: {
                asset: `'/assets/1/0'`
            }
        }))
        .pipe(sourcemaps.mapSources(
            (sourcePath: string, file: any) => sourcePath.substring(sourcePath.lastIndexOf('/') + 1))
        )
        .pipe(sourcemaps.write('.', {
            includeContent: false,
            /* *
            sourceRoot: (file: any) => {
                console.log(file, _.keys(file))
                return '/assets/1/0/bundles'
            }
            /* */
        }))
        // .pipe(gulpDest('.', { ext: '.css' }))
        .pipe(dest('.'))
}

// SASS Functions
function cleanSASS() {
    if (!locations.sass.compile.length) {
        return Promise.resolve('No files selected.')
    }
    return del(_.union(locations.sass.compile, nullify(locations.sass.external)))
}

function compileSASS() {
    if (!locations.sass.core.length) {
        return Promise.resolve('No files selected.')
    }
    return src(_.union(locations.sass.core, nullify(locations.sass.compile), nullify(locations.sass.external)), {base: '.'})
        // .pipe(debug({ title: 'Compile SASS:' }))
        .pipe(sourcemaps.init())
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(sourcemaps.write('.'))
        // .pipe(gulpDest('.', { ext: '.css' }))
        .pipe(dest('.'))
}

// CSS Functions
function cleanCSS() {
    if (!locations.css.min.length) {
        return Promise.resolve('No files selected.')
    }
    return del(_.union(locations.css.min, nullify(locations.css.external)))
}

function compressCSS() {
    if (!locations.css.core.length) {
        return Promise.resolve('No files selected.')
    }
    return src(_.union(locations.css.core, nullify(locations.css.min), nullify(locations.css.external)), {base: '.'})
        // .pipe(debug({ title: 'Compress CSS:' }))
        .pipe(minCSS({
            compatibility: '*',
            inline: ['none'],
            // rebaseTo: 'none' // FIXME: This is a temporary hack I created by breaking some code in CleanCSS to get back relative urls
        }))
        .pipe(gulpDest('.', {ext: '.min.css'}))
        .pipe(dest('.'))
}

// CoffeeScript Functions
function cleanCoffee() {
    if (!locations.coffee.compile.length) {
        return Promise.resolve('No files selected.')
    }
    return del(_.union(locations.coffee.compile, nullify(locations.coffee.external)))
}

function compileCoffee() {
    if (!locations.coffee.core.length) {
        return Promise.resolve('No files selected.')
    }
    return src(_.union(locations.coffee.core, nullify(locations.coffee.compile), nullify(locations.coffee.external)), {base: '.'})
        // .pipe(debug({ title: 'Compile Coffee:' }))
        .pipe(coffee({}))
        .pipe(gulpDest('.', {ext: '.js'}))
        .pipe(dest('.'))
}

// TypeScript Functions
function cleanTypeScript() {
    if (!locations.typescript.compile.length) {
        return Promise.resolve('No files selected.')
    }
    return del(_.union(locations.typescript.compile, nullify(locations.typescript.external)))
}

function compileTypeScript() {
    if (!locations.typescript.core.length) {
        return Promise.resolve('No files selected.')
    }
    const tsProject = ts.createProject('tsconfig.json', {
        getCustomTransformers: (program: any) => ({
            before: [
                keysTransformer(program)
            ]
        })
    })
    return src(
        _.union(locations.typescript.core,
            nullify(
                _.union(
                    locations.typescript.compile,
                    locations.typescript.external
                )
            )
        ),
        {base: '.'}
    )
        // .pipe(debug({ title: 'Compile TypeScript:' }))
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.mapSources(
            (sourcePath: string, file: any) => sourcePath.substring(sourcePath.lastIndexOf('/') + 1))
        )
        .pipe(sourcemaps.write('.', {
            includeContent: false
            // sourceRoot: '.'
        }))
        // .pipe(gulpDest('.', { ext: '.js' }))
        .pipe(dest('.'))
}

function compileES6TypeScript() {
    if (!locations.typescript.core.length) {
        return Promise.resolve('No files selected.')
    }
    const tsProject = ts.createProject('tsconfig.json', {
        target: 'es6',
        module: 'ES2020',
        getCustomTransformers: (program: any) => ({
            before: [
                keysTransformer(program)
            ]
        })
    })
    return src(
        _.union(locations.typescript.core,
            nullify(
                _.union(
                    locations.typescript.compile,
                    locations.typescript.external
                )
            )
        ),
        {base: '.'}
    )
        // .pipe(debug({ title: 'Compile TypeScript:' }))
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.mapSources(
            (sourcePath: string, file: any) => sourcePath.substring(sourcePath.lastIndexOf('/') + 1))
        )
        .pipe(sourcemaps.write('.', {
            includeContent: false
            // sourceRoot: '.'
        }))
        // .pipe(gulpDest('.', { ext: '.js' }))
        .pipe(dest('.'))
}

// Template Functions
const cleanTemplate = () => {
    if (!locations.template.min.length) {
        return Promise.resolve('No files selected.')
    }
    return del(locations.template.min)
}

function compressTemplate() {
    if (!locations.template.core.length) {
        return Promise.resolve('No files selected.')
    }
    return src(_.union(locations.template.core, nullify(locations.template.min)), {
        base: '.'
    })
        /* *
        .pipe(debug({
            title: 'Compress Template:'
        }))
        /* */
        .pipe(htmlmin({
            caseSensitive: true, // Angular+ uses case sensitive templates
            collapseWhitespace: true,
            removeComments: true,
            removeEmptyAttributes: true
        }))
        .pipe(gulpDest('.', {
            ext: '.min.html'
        }))
        .pipe(dest('.'))
}

// Modules Exports
// ---------------

// clean all
exports.clean = parallel(
    cleanMangle,
    cleanPreserve,
    cleanLESS,
    cleanSASS,
    cleanCSS,
    cleanCoffee,
    cleanTypeScript,
    cleanTemplate
    // cleanExternal
)

// lint all
exports.lint = parallel(
    lintJS
)

// build distribution
exports.dist = parallel(
    distBoot
    // distStratus
)

// specific compilations
exports.compileLESS = series(cleanLESS, compileLESS)
exports.compileSASS = series(cleanSASS, compileSASS)
exports.compileTypeScript = series(cleanTypeScript, compileTypeScript)
exports.compileES6TypeScript = series(cleanTypeScript, compileES6TypeScript)
exports.compileCoffee = series(cleanCoffee, compileCoffee)

// specific compressions
exports.compressMangle = series(cleanMangle, compressMangle)
exports.compressPreserve = series(cleanPreserve, compressPreserve)
exports.compressCSS = series(cleanCSS, compressCSS)
exports.compressTemplate = series(cleanTemplate, compressTemplate)

// compile CSS extensions
exports.compileCSS = parallel(
    exports.compileLESS,
    exports.compileSASS
)

// compress JavaScript files
exports.compressJavaScript = parallel(
    exports.compressMangle,
    exports.compressPreserve
)

// compile and compress design files
exports.design = series(
    exports.compileCSS,
    parallel(
        exports.compressCSS,
        exports.compressTemplate
    )
)

// compile all files
exports.compile = parallel(
    exports.compileLESS,
    exports.compileSASS,
    exports.compileTypeScript,
    exports.compileCoffee
)

// compile all files
exports.compileES6 = parallel(
    exports.compileLESS,
    exports.compileSASS,
    exports.compileES6TypeScript,
    exports.compileCoffee
)

// compress all files
exports.compress = parallel(
    exports.compressMangle,
    exports.compressPreserve,
    exports.compressCSS,
    exports.compressTemplate
    // series(cleanExternal, compressExternal)
)

// build all files
exports.build = series(
    exports.compile,
    exports.compress
)

// test: build and lint
exports.test = series(
    exports.build,
    exports.lint
)

// test quick: build and lint in parallel
// note: a break in parallel linting may result in a partial build
exports.testQuick = parallel(
    exports.build,
    exports.lint
)

// default: a full test (build and lint in series)
exports.default = exports.test
