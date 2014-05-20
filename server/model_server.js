//
// Verification
// 

//Verify DB and correct non-fatal errors.
verifyDB = function(uid) {
    var corrected = [];
    if(uid != Meteor.userId()) return {success: false, message: 'User ID invalid.'};
    try{
        //Samples
        Samples.find({owner: uid}).forEach(function(s){
            if(!_.trim(s.name)){throw {msg: 'Sample name is missing or invalid. sample ID: ' + s._id};}
            if(!SampleTypes.findOne(s.sampletype_id)){throw {msg: 'Sample has invalid sample type. Sample ID: ' + s._id};}
            if(!s.data){
                Samples.update(s._id,{$set: {data: []}});
                corrected.push({msg: 'Sample data field was initialized.'});
            }
            if(!s.tags){
                Samples.update(s._id,{$set: {tags: []}});
                corrected.push({msg: 'Sample tags field was initialized.'});
            }
            if(typeof s.timestamp !== 'number'){
                throw {msg: 'Sample timestamp must be a number. Sample ID: ' + s._id};
            }
        });

        Operations.find()

        //ExpRuns
        ExpRuns.find({owner: uid}).forEach(function(r){
            if(!_.trim(r.name)){throw {msg: 'Exp run name is missing or invalid. Run ID: ' + r._id};}
            if(!Experiments.findOne(r.exp)) throw {msg: 'ExpRun refers to nonexistent experiment. '+ r._id};
            if(typeof r.timestamp !== 'number'){
                throw {msg: 'Run timestamp must be a number. Run ID: ' + r._id};
            }
            if(typeof r.date !== 'number'){
                throw {msg: 'Run date must be a number. Run ID: ' + r._id};
            }
            if(typeof r.samples !== 'object'){
                throw {msg: 'Run samples must be a key-value object. Run ID: ' + r._id};
            }
            _.map(r.samples,function(v,k){
                if(v && !isValidID(v)) throw {msg: 'Sample ID in RxpRun samples values is invalid. ' + r._id};
                if(!isValidID(k)) throw {msg: 'Sample ID in RxpRun samples keys is invalid. ' + r._id};
                var ks = Samples.findOne(k);
                var vs = Samples.findOne(v);
                if(!ks) throw {msg: 'Protocol sample is missing in run: ' + r._id + ' ' + k};
                if(v && !vs) throw {msg: 'Run sample is missing in run: ' + r._id + ' ' + k};
                if(!ks.protocol) throw {msg: 'Sample must be protocol sample' + r._id + ' ' + k}
                if(vs && vs.protocol) throw {msg: 'Sample must not be protocol sample' + r._id + ' ' + v}
            });
            _.map(r.samplelist,function(sid){
                if(!Samples.findOne(sid)) throw {msg: 'Sample is missing.' + r._id + ' ' + sid};
            });
            _.map(r.ops,function(runop,opid){
                var op = Operations.findOne(opid);
                if(!op) throw {msg: 'Operation is missing in exp run: '+ r._id}
                if(!runop) throw {msg: 'Operation data is missing in exp run. Stub object {} is needed.' + r._id}
               // if(typeof runop.timestamp !== 'number') {msg: 'RunOp timestamp must be a number. Run ID: ' + r._id};
//                if(!Array.isArray(runop.input)) {msg: 'RunOp input must be an array. Run ID: ' + r._id};
//                if(!Array.isArray(runop.output)) {msg: 'RunOp output must be an array. Run ID: ' + r._id};
//                _.map(runop.input,function(sid){
//                    var s = Samples.findOne(sid);
//                    if(sid && !s) throw {msg: 'Sample in RunOp input is missing. ' + [r._id,opid,sid].join(' ')};
//                    if(s && s.protocol) throw {msg: 'Sample must not be protocol sample' + [r._id,opid,sid].join(' ')}
//                });
//                _.map(runop.output,function(sid){
//                    var s = Samples.findOne(sid);
//                    if(sid && !s) throw {msg: 'Sample in RunOp output is missing. ' + [r._id,opid,sid].join(' ')};
//                    if(s && s.protocol) throw {msg: 'Sample must not be protocol sample' + [r._id,opid,sid].join(' ')}
//                });
//                var newops = {};
//                _.map(ops,function(v,k){
//                    newops[k] = {timestamp: v.timestamp, input: _.compact(runop.input)};
//                });
//                if(_.compact(runop.input).length != runop.input.length){
//                    corrected.push({msg: 'null found in RunOp input'});
//                }
            })
        });

        return {success: true, corrected: corrected};
    }catch(e){
        return {success: false, message: e.msg, exception: e};
    }
};

isValidID = function(str){
    var re = /^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17}$/;
    return re.test(str);
};