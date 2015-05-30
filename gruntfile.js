module.exports = function(grunt) {
    
grunt.initConfig({
  typescript: {
    base: {
      src: ['jrex.ts'],
        dest: '',
      options: {
        module: 'commonjs',
        target: 'es5',
        declaration: false 
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