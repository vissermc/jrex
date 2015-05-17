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
  }  
});

grunt.loadNpmTasks('grunt-typescript');

grunt.registerTask('default', ['typescript']);

};