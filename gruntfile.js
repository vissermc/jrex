module.exports = function(grunt) {
    
grunt.initConfig({
  typescript: {
    base: {
      src: ['*.ts'],
      dest: 'jrex.js',
      options: {
        module: 'commonjs', //or amd 
      }
    }
  },
  uglify: {
      base: {
        src: ['jrex.js'],
        dest: 'jrex.min.js',
        options: {
        }
      }
  }  
});

grunt.loadNpmTasks('grunt-typescript');
grunt.loadNpmTasks('grunt-contrib-uglify');

grunt.registerTask('default', ['typescript','uglify']);

};