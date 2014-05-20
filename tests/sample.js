////tests/posts.js
//var assert = require('assert');
//var _ = require('../.node_modules/node_modules/underscore');
//_.str = require('../.node_modules/node_modules/underscore.string');
//_.mixin(_.str.exports());
//
//suite('Samples', function() {
//  test('in the server', function(done, server,client) {
//    server.eval(function() {
//      Samples.insert({owner: 'sandbox',name: 'My sample'});
//      var samples = Samples.find().fetch();
//      emit('samples', samples);
//    });
//
//    server.once('samples', function(samples) {
//      var ss = _.filter(samples,function(sample){
//          return _.trim(sample.name);
//      });
//      assert.equal(ss.length, samples.length);
//      done();
//    });
//  });
//});
//
//suite('Experiment',function(){
//   test('samples in exp',function(done,server,client){
//       client.eval(function(){
//           _.map(_.range(0,10),function(){
//               var name = Math.random().toString(36).substring(7);
//               return newExp(name);
//           });
//           var exps = Experiments.find().fetch();
//               var eids = _.map(_.range(0,10),function(){
//               var name = Math.random().toString(36).substring(7);
//               return newExp(name);
//           });
//           _.map(eids,deleteExp);
//           var exps2 = Experiments.find().fetch();
//           emit('exps',exps,exps2);
//       });
//       server.once('exps',function(exps,exps2){
//           assert.equal(JSON.stringify(exps),JSON.stringify(exps2));
//           done();
//       });
//
//   }) ;
//});
