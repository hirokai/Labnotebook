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
    var eid = Session.get('current_view_id');
    return eid ? Experiments.findOne(eid) : null;
};

getCurrentExpId = function(){
    return Session.get('current_view_id');
};


findSamplePosInList = function(sid){
    return 0;
};

assignSampleInRun = function(eid,runidx,sample,newsample){
    var key = 'runs.'+runidx+'.samples.'+sample;
    var obj = {};
    obj[key] = newsample;
    Experiments.update(eid,{$set: obj});
};

removeSampleInRun = function(eid,runidx,sample,old_sid){
    var key = 'runs.'+runidx+'.samples.'+sample;
    var obj = {};
    obj[key] = null;
    Experiments.update(eid,{$set: obj});
    console.log(old_sid);
    if(sampleNotUsedAtAll(old_sid)){
        Samples.remove(old_sid);
    }
};

sampleNotUsedAtAll = function(sid){
    var runcount = 0;
//    var es = Experiments.find({},{'runs.$.samples': 1}).fetch();
//    console.log(es);
    return Experiments.find({'protocol.samples': sid}).count() == 0
      && runcount == 0;
};

getRunSamplesOf = function(exp,sid){
    var res = _.compact(_.map(exp.runs,function(run){
        var s = run.samples[sid];
        return s;
    }));
    console.log(res);
    return res;
};

getRunOpsOf = function(exp,opid){
    return _.compact(_.map(exp.runs,function(run){
        var s = run.operations[opid];
        return s;
    }));
}

getOpParam = function(exp,opid,runidx,name){
    try{
    var run = exp.runs[runidx];
    var op = run ? run.operations[opid] : null;
    var params = op ? op.params : null;
    var p = _.findWhere(params,{name: name});
    return p ? p.value : null;
    }catch(e){
        return null;
    }
}

getOpTimestamp = function(exp,runidx,opid) {
    var run = exp.runs[runidx];
    var op = run ? run.operations[opid] : null
    return op ? op.timestamp : null;
};

setOpTimestamp = function(exp,runidx,opid,timestamp) {
    console.log(exp,runidx,opid,timestamp);
    if(runidx!=null && runidx!=undefined && opid){
        var op = exp.runs[runidx].operations[opid];
        if(op){
            op.timestamp = timestamp;
        }else{
            exp.runs[runidx].operations[opid] = {};
            exp.runs[runidx].operations[opid].timestamp = timestamp;
        }

        Experiments.update(exp._id,{$set: {runs: exp.runs}});
    }
};

updateDBAccordingToCell = function(eid,opid,runidx,paramname,newval){
    console.log(eid,opid,runidx,paramname,newval    );
    if(!paramname || paramname == ''){
        return;
    }
    var exp = Experiments.findOne(eid);
    var op = exp.runs[runidx].operations[opid];
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
        exp.runs[runidx].operations[opid].params = newparams;
    }else{
        exp.runs[runidx].operations[opid] = {};
        exp.runs[runidx].operations[opid].params = {name: paramname, value: newval};
    }
    Experiments.update(eid,{$set: {runs: exp.runs}});
};

addNewRunToExp = function(eid){
    var e = Experiments.findOne(eid);
    var run = {};
    run.name = 'Run '+ (e.runs.length+1);
    run.operations = {};
    _.each(e.protocol.operations,function(opid){
        var op = Operations.findOne(opid);
        if(op){
            var ps = _.map(op.params,function(p){return {name: p.name, value: null}});
            var ins = repeat(op.input.length);
            var outs = repeat(op.output.length);
            run.operations[opid] = {params:ps, input: ins, output: outs, timestamp: null};
        }
    });
    run.samples = {};
    console.log(run);
    Experiments.update(eid,{$push: {runs: run}});
};