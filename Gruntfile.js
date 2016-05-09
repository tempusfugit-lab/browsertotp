module.exports = function (grunt) {
  'use strict';

  // Configurable paths
  var config = {
    app: 'app',
  };

  // Define the configuration for all the tasks
  grunt.initConfig({

    // Project settings
    config: config,

    copy: {
      appjs: {
        files: [
          {expand: true, cwd: "bower_components/blirhotp/dist/", src: ["*.min.js"], dest: "app/scripts/"},
          {expand: true, cwd: "bower_components/Sortable/", src: ["*.min.js"], dest: "app/scripts/"},
        ]
      }
    },
  });
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.registerTask('build', [
    'copy:appjs',
  ]);

  grunt.registerTask('default', [
    'build',
  ]);
};
