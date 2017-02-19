module.exports = function (wallaby) {
  return {
    files: [
      'lib/**/*.js',
      '!lib/**/*.spec.js',
    ],

    tests: [
      'lib/**/*.spec.js',
    ],

    compilers: {
      'lib/**/*.js': wallaby.compilers.babel(),
    },

    env: {
      type: 'node',
    },

  };
};
