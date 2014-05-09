insertOp = function(eid,name, input, output, params){
    var owner = Meteor.userId() || 'sandbox';
    params = params || [];
    var op = Operations.insert({owner: owner, name: name,  input: input, output: output, params: params,
        timestamp: new Date().getTime() + 1});
    Experiments.update(eid,{$push: {'protocol.operations': op}});
    return op;
};

insertSampleType = function(name,cls){
    var owner = Meteor.userId() || 'sandbox';
    cls = cls || [];
    return SampleTypes.insert({owner: owner, name: name, timestamp: new Date().getTime(), classes: cls, tags: [], data: []});
};

newSample = function(name,type){
    var owner = Meteor.userId() || 'sandbox';
    type = type || generalSampleType();
    return Samples.insert({owner: owner, name: name, sampletype_id: type,
        timestamp: new Date().getTime(), tags: [], data: [], protocol: false});
};

insertTypeClass = function(name){
    var owner = Meteor.userId() || 'sandbox';
    return TypeClasses.insert({owner: owner, name: name});
};

newSampleToProtocol = function(eid,type_id,name){
    var owner = Meteor.userId() || 'sandbox';
    var sid = Samples.insert({owner: owner, sampletype_id: type_id, name: name, timestamp: new Date().getTime(), protocol: true});
    Experiments.update(eid,{$push: {'protocol.samples': sid}});
   return sid;
};

findSamplesInExp = function(eid){
    var sids = Experiments.findOne(eid).samples;
    return Samples.find({_id: {$in: sids}}).fetch();
};

findProtocolSamplesInExp = function(eid){
    var sids = Experiments.findOne(eid).protocol.samples;
    return Samples.find({_id: {$in: sids}}).fetch();
};


insertExp = function(name){
    var owner = Meteor.userId() || 'sandbox';
    var prot = {operations: [], samples: []};
    return Experiments.insert({owner: owner, name: name, protocol: prot, samples: [], date: (new Date()).getTime(),
    runs: []});
};

generalSampleType = function(){
    return SampleTypes.findOne({name: 'General sample'})._id;
};

removeOpsAboutSample = function(eid,sid){
    var ops = Operations.find({$or: [{input: sid},{output: sid}]}).fetch();
    //console.log(ops);
    _.each(ops,function(op){
        if(
            (op.input.length == 1 && op.input[0] == sid)
        || (op.output.length == 1 && op.output[0] == sid)){
            Operations.remove(op._id);
            Experiments.update(eid,{$pull: {'protocol.operations': op._id}});
        }else{
            Operations.update(op._id, {$pull: {input: sid}});
            Operations.update(op._id, {$pull: {output: sid}});
        }
    })
};



guid = function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
};

getCurrentExp = function(){
    var eid = getCurrentExpId();
    return eid ? Experiments.findOne(eid) : null;
};

getCurrentExpId = function(){
    return Session.equals('list_type', 'exp') ? Session.get('current_view_id') : null;
};

getCurrentSample = function(){
    var id = getCurrentExpId();
    return id ? Samples.findOne(id) : null;
};

getCurrentSampleId = function(){
    return Session.equals('list_type', 'sample') ? Session.get('current_view_id') : null;
};


findSamplePosInList = function(sid){
    return 0;
};

assignSampleInRun = function(runid,sample,newsample){
    console.log(runid,ExpRuns.findOne());
    var samples = ExpRuns.findOne(runid,{samples: 1}).samples;
    samples[sample] = newsample;
    ExpRuns.update(runid,{$set: {samples: samples}, $push: {samplelist: newsample}});
};

removeSampleInRun = function(runid,sample,old_sid){
    var obj = {};
    var key = 'samples.'+sample;
    obj[key] = null;
    console.log(runid,obj,ExpRuns.findOne(runid));
    ExpRuns.update(runid,{$set: obj, $pull: {samplelist: old_sid}});
}

sampleNotUsedAtAll = function(sid){
    return ExpRuns.find({samplelist: sid}).count() == 0;
};

getRunSamplesOf = function(exp,sid){
    var eid = exp._id;
    var runs = ExpRuns.find({exp: eid}).fetch();
    var res = _.compact(_.map(runs,function(run){
        var s = run.samples[sid];
        return s;
    }));
    console.log(res);
    return res;
};

getRunOpsOf = function(exp,opid){
    var eid = exp._id;
    var runs = ExpRuns.find({exp: eid}).fetch();
    return _.compact(_.map(runs,function(run){
        var s = run.ops[opid];
        return s;
    }));
};


getOpParam = function(runid,opid,name){
//    console.log(runid,opid,name);
    try{
        var run = ExpRuns.findOne(runid);
    var op = run ? run.ops[opid] : null;
    var params = op ? op.params : null;
    var p = _.findWhere(params,{name: name});
    return p ? p.value : null;
    }catch(e){
        console.log(e);
        return null;
    }
}

getOpTimestamp = function(runid,opid) {
    var run = ExpRuns.findOne(runid);
    var op = run ? run.ops[opid] : null
    return op ? op.timestamp : null;
};

setOpTimestamp = function(runid,opid,timestamp) {
    console.log(runid,opid,timestamp);
    if(runid && opid){
        var run = ExpRuns.findOne(runid);
        var op = run.ops[opid];
        var k,v;
        if(op){
            k = 'ops.'+opid+'.timestamp';
            v = timestamp;
        }else{
            k = 'ops.'+opid;
            v = {timestamp: timestamp};
        }
        var obj = {};
        obj[k] = v;
        ExpRuns.update(runid,{$set: obj});
    }
};

updateDBAccordingToCell = function(runid,opid,paramname,newval){
    if(!paramname || paramname == ''){
        return;
    }
    var op = ExpRuns.findOne(runid).ops[opid];
    var k,v;
    if(op){
        var params = op.params;
        var newparams = _.map(params,function(param){
           if(param.name == paramname){
               param.value = newval;
               return param;
           }else{
               return param;
           }
        });
        op.params = newparams;
        k = 'ops.'+opid+'.params';
        v = newparams;
    }else{
        op = {};
        op.params = {name: paramname, value: newval};
        k = 'ops.'+opid;
        v = op;
    }
    var obj = {};
    obj[k] = v;
    console.log(obj);
    ExpRuns.update(runid,{$set: obj});
};

addNewRunToExp = function(eid){
    var e = Experiments.findOne(eid);
    var ops = {};
    _.each(e.protocol.operations,function(opid){
        var op = Operations.findOne(opid);
        if(op){
            var ps = _.map(op.params,function(p){return {name: p.name, value: null}});
            var ins = repeat(op.input.length);
            var outs = repeat(op.output.length);
            ops[opid] = {params:ps, input: ins, output: outs, timestamp: null};
        }
    });
    return ExpRuns.insert({owner: Meteor.userId() || 'sandbox',
        exp: eid, name: 'Run', date: new Date().getTime(),
        samples: {},
        ops: ops});
};

deleteRun = function(runid){
    ExpRuns.remove(runid);
}