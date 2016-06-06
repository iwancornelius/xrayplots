module.exports = function(grunt) {

  grunt.initConfig({
    concat: {
      options: {
        separator: ';',
      },
      js_frontend: {
        src: [
          './bower_components/jquery/dist/jquery.js',
          './bower_components/Materialize/dist/js/materialize.js',
          './bower_components/angular/angular.js',
          './bower_components/angular-touch/angular-touch.js',
          './node_modules/HTTPRequest/HTTPRequest.js',
          './bower_components/d3/d3.js',
          './controllers/trackingcode.js',
          './controllers/xray.js'
        ],
        dest: './public/scripts/frontend.js',
      },
    },
    uglify: {
      frontend: {
        src: './public/scripts/frontend.js',
        dest: './public/scripts/frontend.min.js'
      }
    }
  });

  // Load the plugin that provides the "concat" and "uglify" tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['concat', 'uglify']);

};
