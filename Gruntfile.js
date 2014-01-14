'use strict';

var LIVE_RELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({port: LIVE_RELOAD_PORT});
var rewriteRulesSnippet = require('grunt-connect-rewrite/lib/utils').rewriteRequest;
var gateway = require('gateway');
var proxySnippet = require('grunt-connect-proxy/lib/utils').proxyRequest;

var mountFolder = function (connect, dir) {
	return connect.static(require('path').resolve(dir));
};

var mountPHP = function (dir, options) {
	options = options || {
		'.php': 'php-cgi',
		'env': {
			'PHPRC': process.cwd() + '/node_modules/hazdev-template/src/conf/php.ini'
		}
	};
	return gateway(require('path').resolve(dir), options);
};

module.exports = function (grunt) {

	// Load grunt tasks
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	// App configuration, used throughout
	var appConfig = {
		src: 'src',
		dist: 'dist',
		test: 'test',
		tmp: '.tmp'
	};

	// TODO :: Read this from .bowerrc
	var bowerConfig = {
		directory: 'bower_components'
	};

	grunt.initConfig({
		app: appConfig,
		bower: bowerConfig,
		watch: {
			scripts: {
				files: ['<%= app.src %>/htdocs/**/*.js'],
				tasks: ['concurrent:scripts'],
				options: {
					livereload: LIVE_RELOAD_PORT
				}
			},
			scss: {
				files: ['<%= app.src %>/htdocs/**/*.scss'],
				tasks: ['compass:dev']
			},
			tests: {
				files: ['<%= app.test %>/*.html', '<%= app.test %>/**/*.js'],
				tasks: ['concurrent:tests']
			},
			livereload: {
				options: {
					livereload: LIVE_RELOAD_PORT
				},
				files: [
					'<%= app.src %>/htdocs/**/*.php',
					'<%= app.src %>/htdocs/**/*.html',
					'<%= app.src %>/htdocs/img/**/*.{png,jpg,jpeg,gif}',
					'.tmp/css/**/*.css',
					'<%= app.lib %>/inc/**/*.php'
				]
			},
			gruntfile: {
				files: ['Gruntfile.js'],
				tasks: ['jshint:gruntfile']
			}
		},
		concurrent: {
			scripts: ['jshint:scripts', 'mocha_phantomjs'],
			tests: ['jshint:tests', 'mocha_phantomjs'],
			predist: [
				'jshint:scripts',
				'jshint:tests',
				'compass'
			],
			dist: [
				'requirejs:dist',
				'cssmin:dist',
				'htmlmin:dist',
				'uglify',
				'copy'
			]
		},
		connect: {
			options: {
				hostname: 'localhost'
			},
			proxies: [{
				context: '/product',
				host: 'comcat.cr.usgs.gov',
				port: 80,
				https: false,
				changeOrigin: true,
				xforward: false
			}],
			rules: {
				'^/theme/(.*)$': '/hazdev-template/src/htdocs/$1'
			},
			dev: {
				options: {
					base: '<%= app.src %>/htdocs',
					port: 8080,
					components: bowerConfig.directory,
					middleware: function (connect, options) {
						return [
							lrSnippet,
							rewriteRulesSnippet,
							proxySnippet,
							mountFolder(connect, '.tmp'),
							mountFolder(connect, options.components),
							mountPHP(options.base),
							mountFolder(connect, options.base),
							mountFolder(connect, 'node_modules')
						];
					}
				}
			},
			dist: {
				options: {
					base: '<%= app.dist %>/htdocs',
					port: 8081,
					keepalive: true,
					middleware: function (connect, options) {
						return [
							mountPHP(options.base),
							mountFolder(connect, options.base)
						];
					}
				}
			},
			test: {
				options: {
					base: '<%= app.test %>',
					components: bowerConfig.directory,
					port: 8000,
					middleware: function (connect, options) {
						return [
							rewriteRulesSnippet,
							mountFolder(connect, '.tmp'),
							mountFolder(connect, 'bower_components'),
							mountFolder(connect, options.base),
							mountFolder(connect, 'node_modules'),
							mountFolder(connect, appConfig.src + '/htdocs/modules'),
							// module css is relative to module root which is at '/' above
							mountFolder(connect, '.tmp/modules')
						];
					}
				}
			}
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			gruntfile: ['Gruntfile.js'],
			scripts: [
				'<%= app.src %>/htdocs/js/**/*.js',
				'<%= app.src %>/htdocs/modules/**/*.js'
			],
			tests: ['<%= app.test %>/**/*.js']
		},
		compass: {
			dev: {
				options: {
					sassDir: '<%= app.src %>/htdocs',
					cssDir: '<%= app.tmp %>',
					environment: 'development'
				}
			}
		},
		mocha_phantomjs: {
			all: {
				options: {
					urls: [
						'http://localhost:<%= connect.test.options.port %>/index.html'
					]
				}
			}
		},
		requirejs: {
			dist: {
				options: {
					name: 'index',
					baseUrl: appConfig.src + '/htdocs/js',
					out: appConfig.dist + '/htdocs/js/index.js',
					optimize: 'uglify2',
					mainConfigFile: appConfig.src + '/htdocs/js/index.js',
					useStrict: true,
					wrap: true,
					uglify2: {
						report: 'gzip',
						mangle: true,
						compress: true,
						preserveComments: 'some'
					}
				}
			}
		},
		cssmin: {
			dist: {
				files: {
					'<%= app.dist %>/htdocs/css/index.css': [
						'<%= app.src %>/htdocs/css/**/*.css',
						'.tmp/css/**/*.css'
					]
				}
			}
		},
		htmlmin: {
			dist: {
				options: {
					collapseWhitespace: true
				},
				files: [{
					expand: true,
					cwd: '<%= app.src %>',
					src: '**/*.html',
					dest: '<%= app.dist %>'
				}]
			}
		},
		uglify: {
			options: {
				mangle: true,
				compress: true,
				report: 'gzip'
			},
			dist: {
				files: {
					'<%= app.dist %>/htdocs/lib/requirejs/require.js':
							['<%= bower.directory %>/requirejs/require.js'],
					'<%= app.dist %>/htdocs/lib/html5shiv/html5shiv.js':
							['<%= bower.directory %>/html5shiv-dist/html5shiv.js']
				}
			}
		},
		copy: {
			app: {
				expand: true,
				cwd: '<%= app.src %>/htdocs',
				dest: '<%= app.dist %>/htdocs',
				src: [
					'img/**/*.{png,gif,jpg,jpeg}',
					'**/*.php'
				]
			},
			conf: {
				expand: true,
				cwd: '<%= app.src %>/conf',
				dest: '<%= app.dist/conf',
				src: [
					'**/*',
					'!**/*.orig'
				]
			},
			lib: {
				expand: true,
				cwd: '<%= app.src %>/lib',
				dest: '<%= app.dist %>/lib',
				src: [
					'**/*'
				]
			}
		},
		replace: {
			dist: {
				src: [
					'<%= app.dist %>/htdocs/index.html',
					'<%= app.dist %>/**/*.php'
				],
				overwrite: true,
				replacements: [
					{
						from: 'requirejs/require.js',
						to: 'lib/requirejs/require.js'
					},
					{
						from: 'html5shiv-dist/html5shiv.js',
						to: 'lib/html5shiv/html5shiv.js'
					}
				]
			}
		},
		open: {
			dev: {
				path: 'http://localhost:<%= connect.dev.options.port %>'
			},
			test: {
				path: 'http://localhost:<%= connect.test.options.port %>'
			},
			dist: {
				path: 'http://localhost:<%= connect.dist.options.port %>'
			}
		},
		clean: {
			dist: ['<%= app.dist %>'],
			dev: ['<%= app.tmp %>', '.sass-cache']
		}
	});

	grunt.event.on('watch', function (action, filepath) {
		// Only lint the file that actually changed
		grunt.config(['jshint', 'scripts'], filepath);
	});

	grunt.registerTask('test', [
		'clean:dist',
		'connect:test',
		'mocha_phantomjs'
	]);

	grunt.registerTask('build', [
		'clean:dist',
		'concurrent:predist',
		'concurrent:dist',
		'replace',
		'open:dist',
		'connect:dist'
	]);

	grunt.registerTask('default', [
		'clean:dist',
		'compass:dev',
		'configureRewriteRules',
		'configureProxies',
		'connect:test',
		'connect:dev',
		'open:test',
		'open:dev',
		'watch'
	]);

};
