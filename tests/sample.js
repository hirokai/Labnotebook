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
      assert.equal(samples.length, 1);
      done();
    });
  });
});

