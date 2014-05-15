//tests/posts.js
var assert = require('assert');

suite('Samples', function() {
  test('in the server', function(done, server) {
    server.eval(function() {
      Samples.insert({owner: 'sandbox',name: 'My sample'});
      var samples = Samples.find().fetch();
      emit('samples', samples);
    });

    server.once('samples', function(samples) {
      var ss = _.filter(samples,function(sample){
          return _.trim(sample.name);
      });
      assert.equal(ss.length, samples.length);
      done();
    });
  });
});

