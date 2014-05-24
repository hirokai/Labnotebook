findSamplesInExp = function (eid) {
    var sids = Experiments.findOne(eid).samples;
    return Samples.find({_id: {$in: sids}}).fetch();
};

findProtocolSamplesInExp = function (eid) {
    var sids = Experiments.findOne(eid).protocol.samples;
    return Samples.find({_id: {$in: sids}}).fetch();
};

//
// Functions for samples and sampletypes, standalone (not directly related to exp and exp protocol)
//

newSampleType = function (name, parent, cls) {
    var owner = Meteor.userId() || 'sandbox';
    parent = parent || generalSampleType();
    cls = cls || [];
    var st = SampleTypes.insert({owner: owner, name: name, timestamp: new Date().getTime(), classes: cls, tags: [], data: [], parent: parent});
    addLog({type: 'type', op: 'insert', id: st, params: {name: name, parent: parent}});
    return st;
};

newSample = function (name, type) {
    var owner = Meteor.userId() || 'sandbox';
    type = type || generalSampleType();
    var sid = Samples.insert({owner: owner, name: name, sampletype_id: type,
        timestamp: new Date().getTime(), tags: [], data: [], protocol: false});
    addLog({type: 'sample', op: 'insert', id: sid, params: {name: name}});
    return sid;
};

newTypeClass = function (name) {
    var owner = Meteor.userId() || 'sandbox';
    var cid = TypeClasses.insert({owner: owner, name: name});
    addLog({type: 'class', op: 'insert', id: cid, params: {name: name}});
    return cid;
};

generalSampleType = function () {
    return generalSampleTypeObj()._id;
};

generalSampleTypeObj = function () {
    return SampleTypes.findOne({name: 'Any'});
};

verifySampleTypeName = function (name) {
    return _.trim(name) && !SampleTypes.findOne({name: name});
};

//check if Sample has some info added (other than just added to exp run as a new sample).
sampleActualInfo = function(sample){
    // stub: maybe we need some change flag.
    return sample.note || sample.tags.length > 0 || sample.data.length > 0;
}

sampleNotUsedAtAll = function (sid) {
    return ExpRuns.find({samplelist: sid}).count() == 0;
};

sampleTypeNotUsedAtAll = function (tid) {
    return Samples.find({sampletype_id: tid}).count() == 0;
};

//
// Editing and obtaining exp protocol.
//

newSampleToProtocol = function (eid, type_id, name) {
    var owner = Meteor.userId() || 'sandbox';
    var sid = Samples.insert({owner: owner, sampletype_id: type_id, name: name, timestamp: new Date().getTime(), protocol: true});
    Experiments.update(eid, {$push: {'protocol.samples': sid}});
    addLog({type: 'protocol_sample', op: 'new', id: sid, params: {to_id: eid}});
    return sid;
};

//Add new operation to exp protocol. If there are runs for this exp already, we need to add stub op object.
newOpToProtocol = function (eid, name, input, output, params) {
    var owner = Meteor.userId() || 'sandbox';
    params = params || [];

    if(!Array.isArray(input) || !Array.isArray(output)) throw "Operations needs input and output arrays.";

    var op = Operations.insert({owner: owner, name: name, input: input, output: output, params: params,
        timestamp: new Date().getTime() + 1});
    Experiments.update(eid, {$push: {'protocol.operations': op}});

    //Add stub op object for all ExpRun's.
    ExpRuns.find({exp: eid}).map(function (run) {
        var ops = run.ops;
        ops[op] = {timestamp: null, input: [], output: [], params: []};
        ExpRuns.update(run._id, {$set: {ops: ops}});
    });
    addLog({type: 'exp', op: 'insertop', id: eid, params: {op: op, name: name}});
    return op;
};

removeOpsAboutSample = function (eid, sid) {
    if(!Samples.findOne(sid).protocol){
        console.log('removeOpsAboutSample() only works with protocol sample')
        return;
    }
    var ops = Operations.find({$or: [
        {input: sid},
        {output: sid}
    ]});
    //console.log(ops);
    ops.forEach(function (op) {
        if (
            (op.input.length == 1 && op.input[0] == sid)
                || (op.output.length == 1 && op.output[0] == sid)) {
            //var op = Operations.findOne(op._id);
            addLog({type: 'op', op: 'remove', id: op._id, params: {exp: eid, name: op.name}});
            Operations.remove(op._id);
            Experiments.update(eid, {$pull: {'protocol.operations': op._id}});
        } else {
            Operations.update(op._id, {$pull: {input: sid}});
            Operations.update(op._id, {$pull: {output: sid}});
        }
    });
};

addNewInputToOp = function (opid, sid) {
    Operations.update(opid, {$push: {input: sid}});
    addLog({type: 'op', op: 'newinput', id: opid, params: {sample: sid}});
};

addNewOutputToOp = function (opid, sid) {
    Operations.update(opid, {$push: {output: sid}});
    addLog({type: 'op', op: 'newoutput', id: opid, params: {sample: sid}});
};

deleteSampleFromProtocol = function (eid, sid) {
    Experiments.update(eid, {$pull: {'protocol.samples': sid}});
    removeOpsAboutSample(eid, sid);
    Samples.remove(sid);

    //Remove rank info to make graph recalculate them.
    var sids = Experiments.findOne(eid).protocol.samples;
    _.map(sids,function(s){
        Samples.update(s, {$unset: {rank: ""}});
    })

    addLog({type: 'protocol_sample', op: 'delete', id: sid, params: {exp: eid}});
};

removeOp = function (opid) {
    Operations.remove(opid);
    addLog({type: 'op', id: opid, op: 'remove'});
};

renameProtocolSample = function (sid, name) {
    if (_.trim(name)) {
        Samples.update(sid, {$set: {name: name}});
        addLog({type: 'op',op: 'rename', id: sid, params: {name: name}});
        return true;
    } else {
        var name = Samples.findOne(sid).name;
        //To flush DOM.
        Samples.update(sid, {$set: {name: ''}});
        Samples.update(sid, {$set: {name: name}});
        return false;
    }
};

//
// Editing and obtaining exp and expruns.
//

newExp = function (name) {
    var owner = Meteor.userId() || 'sandbox';
    var prot = {operations: [], samples: []};
    var eid = Experiments.insert({owner: owner, name: name, protocol: prot, samples: [], date: (new Date()).getTime(),
        runs: []});
    addLog({type: 'exp', op: 'new', id: eid, params: {name: name}});
    return eid;
};

copyProtocolForNewExp = function (eid) {
    var e = Experiments.findOne(eid);
    var prot = e.protocol;
    var newe = newExp(e.name);
    Experiments.update(newe, {$set: {protocol: prot}});
    addLog({type: 'exp', op: 'cloneprotocol', id: newe, params: {from: eid}});
};

deleteExp = function (eid) {
    var runs = ExpRuns.find({exp: eid});
    runs.map(function (run) {
        deleteRun(run._id);
    });
    Experiments.remove(eid);
    addLog({type: 'exp', op: 'remove', id: eid, params: {}});
};

freezeExp = function (eid) {
    if(Meteor.isClient){
        Meteor.call('freezeExp',eid);
    }else{
        doFreezeExp(eid);
    }
};

unfreezeExp = function (eid) {
    if(Meteor.isClient){
        Meteor.call('unfreezeExp',eid);
    }else{
        doUnfreezeExp(eid);
    }
};

expRunUsingThisSampleLocked = function(sid) {
    try{
        ExpRuns.find({samplelist: sid}).map(function(run){
            if(run.locked){
                throw 'ExpRun using this sample is not changeable.'
            }
        });
    }catch(e){
        return true;
    }
    return false;
};

getExpRuns = function(eid){
    return ExpRuns.find({exp: eid}, {sort: {timestamp: 1, date: 1}});
};

getExpRunIndex = function(rid){
//    var run = ExpRuns.find(rid);
    var runids = ExpRuns.find({},{fields: {_id: 1}, sort: {timestamp: 1, date: 1}}).map(function(run){return run._id});
    return _.indexOf(runids,rid);
}

addNewRunToExp = function (eid) {
    var e = Experiments.findOne(eid);
    var ops = {};
    _.each(e.protocol.operations, function (opid) {
        var op = Operations.findOne(opid);
        if (op) {
            var ps = _.map(op.params, function (p) {
                return {name: p.name, value: null}
            });
            var ins = repeat(op.input.length);
            var outs = repeat(op.output.length);
            ops[opid] = {params: ps, input: ins, output: outs, timestamp: null};
        }
    });
    var name = 'Run ' + (ExpRuns.find({exp: eid}).count() + 1);
    var rid = ExpRuns.insert({owner: Meteor.userId() || 'sandbox',
        exp: eid, name: name, date: new Date().getTime(),
        samples: {},
        ops: ops, timestamp: new Date().getTime()});
    addLog({type: 'run', op: 'insert', id: rid, params: {to: eid, name: name}});
    return rid;
};

deleteRun = function (runid) {
    addLog({type: 'run', op: 'remove', id: runid, params: {}});
    ExpRuns.remove(runid);
};

assignSampleInRun = function (runid, sample, newsample, overwrite) {
//    console.log(runid,ExpRuns.findOne());
    var samples = ExpRuns.findOne(runid, {samples: 1}).samples;
    if(!samples[sample] || overwrite){
        samples[sample] = newsample;
        ExpRuns.update(runid, {$set: {samples: samples}, $push: {samplelist: newsample}});
    }
};

findCompatibleSamples = function (tid) {
    var tids = findSubTypes(tid);
    tids.push(tid);
    return Samples.find({sampletype_id: {$in: tids}, protocol: false}).fetch();
};

removeSampleInRun = function (runid, sample, old_sid) {
    var obj = {};
    var key = 'samples.' + sample;
    obj[key] = null;
    //FIXME: also update ops.
//    console.log(runid,obj,ExpRuns.findOne(runid));
    ExpRuns.update(runid, {$set: obj, $pull: {samplelist: old_sid}});
    if(ExpRuns.find({samplelist: old_sid}).count() == 0){
        var s = Samples.findOne(old_sid);
        if(!sampleActualInfo(s)){
            Samples.remove(old_sid);
        }
    }
};

getRunSamplesOf = function (exp, sid) {
    var eid = exp._id;
    var runs = ExpRuns.find({exp: eid}).fetch();
    var res = _.compact(_.map(runs, function (run) {
        var s = run.samples[sid];
        return s;
    }));
    console.log(res);
    return res;
};

getRunOpsOf = function (exp, opid) {
    var eid = exp._id;
    var runs = ExpRuns.find({exp: eid}).fetch();
    return _.compact(_.map(runs, function (run) {
        var s = run.ops[opid];
        return s;
    }));
};

getOpParam = function (runid, opid, name) {
//    console.log(runid,opid,name);
    try {
        var run = ExpRuns.findOne(runid);
        var op = run ? run.ops[opid] : null;
        var params = _.compact(op ? op.params : []);
        var p = _.findWhere(params, {name: name});
        return p ? p.value : null;
    } catch (e) {
        console.log(e);
        return null;
    }
}

getOpTimestamp = function (runid, opid) {
    var run = ExpRuns.findOne(runid);
    var op = run ? run.ops[opid] : null
    return op ? op.timestamp : null;
};

setOpTimestamp = function (runid, opid, timestamp) {
    if(timestamp && typeof timestamp != 'number')
        return null;

//    console.log(runid,opid,timestamp);
    if (runid && opid) {
        var run = ExpRuns.findOne(runid);
        var op = run.ops[opid];
        var k, v;
        if (op) {
            k = 'ops.' + opid + '.timestamp';
            v = timestamp;
        } else {
            k = 'ops.' + opid;
            v = {timestamp: timestamp};
        }
        var obj = {};
        obj[k] = v;
        ExpRuns.update(runid, {$set: obj});
    }
};

setRunOpNote = function (runid, opid, note) {
    if (runid && opid) {
        var run = ExpRuns.findOne(runid);
        var op = run.ops[opid];
        var k, v;
        if (op) {
            k = 'ops.' + opid + '.note';
            v = note;
        } else {
            k = 'ops.' + opid;
            v = {note: note};
        }
        var obj = {};
        obj[k] = v;
        ExpRuns.update(runid, {$set: obj});
    }
};

updateDBAccordingToCell = function (exp, runid, opid, paramname, newval, oldval) {
  //  console.log(runid, opid, paramname, newval, oldval);
    if (!paramname || paramname == '') {
        return false;
    }
    if(paramname == '__note'){
        console.log('updateDBAccordingToCell: note')
        var obj = {};
        obj['ops.'+opid+'.note'] = newval;
        ExpRuns.update(runid, {$set: obj});
        addLog({type: 'run', op: 'updatenote', id: runid,
            params: {oldval: oldval, newval: newval}});
        return true;
    }else if(paramname == '__time'){
        if(newval == ''){
            setOpTimestamp(runid,opid, null);
            addLog({type: 'run', op: 'removetime', id: runid,
                params: {oldval: oldval, newval: null}});
            return true;
        }else{
            var m = momentFromTimeStr(newval,exp.date);
            if(m.isValid()){
                setOpTimestamp(runid,opid, m.valueOf());
                addLog({type: 'run', op: 'updatetime', id: runid,
                    params: {oldval: oldval, newval: newval}});
                return true;
            }else{
                console.log('updateDBAccordingToCell(): invalid time format.');
                return false;
            }
        }
    }else{
//        return null; //stub
        var op = ExpRuns.findOne(runid).ops[opid];
        var k, v;
        if (op) {
            var protocol_params = Operations.findOne(opid).params;
            var protocol_paramnames = _.compact(_.map(protocol_params,function(p){return p.name;}));
            if(!_.contains(protocol_paramnames,paramname))
                return false;

            var runparams = _.compact(op.params || []);
            var newparams = _.compact(_.map(protocol_params, function (param) {
         //       console.log(param,paramname);
                if (param.name == paramname) {
                    return {name: paramname, value: newval};
                } else {
                    if(param.name){
                        return _.findWhere(runparams, {name: param.name});
                    }else{
                        return null;
                    }
                }
            }));
            k = 'ops.' + opid + '.params';
            v = newparams;
        } else {
            op = {};
            op.params = {name: paramname, value: newval};
            k = 'ops.' + opid;
            v = op;
        }
        var obj = {};
        obj[k] = v;
        console.log(obj);
        ExpRuns.update(runid, {$set: obj});
        addLog({type: 'run', op: 'updateparam', id: runid,
            params: {name: paramname, oldval: oldval, newval: newval}});
        return true;
    }
};

changeTypeParent = function (tid, newparent, oldparent) {
    SampleTypes.update(tid, {$set: {parent: newparent}});
    var s_from = SampleTypes.findOne(oldparent);
    var s_to = SampleTypes.findOne(newparent);
    var target = SampleTypes.findOne(tid);
    //  console.log(s_from,s_to,target);
    addLog({type: 'type', op: 'update', id: tid, params: {parent: newparent, old_parent: oldparent}});
};

resetTypeParent = function () {
    var st0;
    if (!generalSampleTypeObj()) {
        st0 = SampleTypes.insert({owner: Meteor.userId(), name: "Any", timestamp: new Date().getTime(), data: [], tags: [], classes: [], system: true});
    }
    var alltypes = SampleTypes.find().fetch();
    _.each(alltypes, function (t) {
        if (t._id != st0) {
            SampleTypes.update(t._id, {$set: {parent: st0}});
        } else {
            SampleTypes.update(t._id, {$set: {parent: null}});
        }
    });
};

findProtocolSample = function (rid, sid) {
    if (!sid || !rid) return null;

    var run = ExpRuns.findOne(rid);
    console.log(run);
    console.log(_.map(run.samples, function (v, k) {
        return v == sid ? k : null
    }));
    console.log(_.compact(_.map(run.samples, function (v, k) {
        return v == sid ? k : null
    })));
    return _.compact(_.map(run.samples, function (v, k) {
//        console.log(k, v, sid);
        return v == sid ? k : null
    }))[0];
}

changeDateOfExp = function (eid, date) {
    Experiments.update(eid, {$set: {date: date}});
    addLog({type: 'exp', op: 'updatedate', id: eid, params: {date: date}});
};

//
// Sample input and output for inter-exp analysis.
//

//Find protocol samples that have no outgoing edge (operation).
findOutputsOfRun = function(run,exp){
    var out_pss =  findOutputsOfExp(exp);
    var res = _.compact(_.map(out_pss,function(ps){return run.samples ? run.samples[ps] : null;}));
//    console.log(run,exp,ins,out_pss,res);
    return res;
};

//Find protocol samples that have no incoming edge (operation).
findInputsOfRun = function(run,exp){
    var in_pss =  findInputsOfExp(exp);
    var res = _.compact(_.map(in_pss,function(ps){return run.samples ? run.samples[ps] : null;}));
//    console.log(run,exp,ins,out_pss,res);
    return res;
};

findOutputsOfExp = function(exp){
    if(!exp) return [];
    var ops = exp.protocol.operations;
    var samples = exp.protocol.samples;
    var ins = _.compact(_.flatten(_.map(ops,function(opid){
        var op = Operations.findOne(opid);
        return op ? op.input : null;
    })));
    return _.difference(samples,ins);
};

findInputsOfExp = function(exp){
    var ops = exp.protocol.operations;
    var samples = exp.protocol.samples;
    var ins = _.compact(_.flatten(_.map(ops,function(opid){
        var op = Operations.findOne(opid);
        return op ? op.output : null;
    })));
    return _.difference(samples,ins);
};

isInputOrOutputOfExp = function(exp,sid){
    var ins = findInputsOfExp(exp);
    var outs = findOutputsOfExp(exp);
    return _.contains(ins,sid) || _.contains(outs,sid);
}
findRunWithSampleAsOutput = function (sid) {
    var runs = ExpRuns.find({samplelist: sid});
//    console.log(runs.count());
    var found;
    var BreakException = {};
    try {
        runs.forEach(function (run) {
            var exp = Experiments.findOne(run.exp);
            if(!exp) return;
            var outs = findOutputsOfRun(run, exp);
//            console.log(run,exp,outs,sid);
            if (_.contains(outs, sid)) {
                found = run;
                throw BreakException;
            }
        });
    } catch (e) {
        if (e !== BreakException) throw e;
    }
    return found;
};

findRunWithSampleAsInput = function (sid) {
    var runs = ExpRuns.find({samplelist: sid});
    var found;
    var BreakException = {};
    try {
        runs.forEach(function (run) {
            var exp = Experiments.findOne(run.exp);
            var ins = findInputsOfRun(run, exp);
     //       console.log(ins,sid);
            if (_.contains(ins, sid)) {
                found = run;
                throw BreakException;
            }
        });
    } catch (e) {
        if (e !== BreakException) throw e;
    }
    return found;
};

findExpMakingSample = function(sid){
//    //FIXME: This can be wrong if there are more than one exp in one day...
//    var eids = _.compact(ExpRuns.find({samplelist: sid}).map(function(run){return run.exp}));
//    console.log(sid, eids);
//    return Experiments.findOne({_id: {$in: eids}},{sort: {timestamp: 1}});

    var run = findRunWithSampleAsOutput(sid);
    console.log(sid,run);
    return run ? Experiments.findOne(run.exp) : null;

}

//
// Sample types
//

findSuperTypes = function (tid) {
    var f = function (from, accum) {
        var t = SampleTypes.findOne(from);
        if (t.system && t.name == 'Any') {
            return accum;
        } else {
            return f(t.parent, accum.concat([t.parent]));
        }
    }
    return f(tid, []);
};

findDirectSubTypes = function (tid) {
    return SampleTypes.find({parent: tid});
};

// O(n^2) ?? Looks inefficient.
findSubTypes = function (rootid) {
    var treeFrom = function (allts, thisroot, depth) {
        var children = _.sortBy(_.filter(allts, function (t) {
            return t.parent == thisroot._id;
        }), function (c) {
            return c.name;
        });
        if (depth == 0) children = [];
        console.log(children, allts);
        return [thisroot._id].concat(_.map(children, function (c) {
            return treeFrom(allts, c, depth - 1);
        }));
    };
    var ts = SampleTypes.find({}, {fields: {_id: 1, parent: 1, name: 1}}).fetch();

    var root = SampleTypes.findOne(rootid);
    if (root) {
        return _.flatten(treeFrom(ts, root, 20));
    } else {
        return [];
    }
}

// O(n^2) ?? Looks inefficient.
mkTypeTree = function () {
    var treeFrom = function (allts, thisroot, depth) {
        var children = _.sortBy(_.filter(allts, function (t) {
            return t.parent == thisroot._id;
        }), function (c) {
            return c.name;
        });
        if (depth == 0) children = [];
//        console.log(children,allts);
        return {label: thisroot.name, id: thisroot._id, children: _.map(children, function (c) {
            return treeFrom(allts, c, depth - 1);
        })};
    };
    var ts = SampleTypes.find({}, {fields: {_id: 1, parent: 1, name: 1}}).fetch();
//    var roots = _.filter(ts,function(t){return !t.parent;});
//    return _.map(roots,function(root){
//        return treeFrom(ts,root);
//    });
    var root = generalSampleTypeObj();
    return [treeFrom(ts, root, 20)];
};

changeTypeParent = function (tid, newparent, oldparent) {
    SampleTypes.update(tid, {$set: {parent: newparent}});
    var s_from = SampleTypes.findOne(oldparent);
    var s_to = SampleTypes.findOne(newparent);
    var target = SampleTypes.findOne(tid);
    //  console.log(s_from,s_to,target);
    addLog({type: 'type', op: 'update', id: tid, params: {parent: newparent, old_parent: oldparent}});
};

//Usually not used.
resetTypeParent = function () {
    var st0;
    if (!generalSampleTypeObj()) {
        st0 = SampleTypes.insert({owner: Meteor.userId(), name: "Any", timestamp: new Date().getTime(), data: [], tags: [], classes: [], system: true});
    }
    var alltypes = SampleTypes.find().fetch();
    _.each(alltypes, function (t) {
        if (t._id != st0) {
            SampleTypes.update(t._id, {$set: {parent: st0}});
        } else {
            SampleTypes.update(t._id, {$set: {parent: null}});
        }
    });
};

//
// Misc helpers
//

addLog = function (o) {
    var obj = {};
    try{
        obj.owner = Meteor.userId() || 'sandbox';
    }catch(e){
        obj.owner = this.userId || 'sandbox';
    }
    obj.timestamp = new Date().getTime();
    obj.date = moment(obj.timestamp).format('YYYYMMDD');

    obj.type = o.type;
    obj.op = o.op;
    obj.id = o.id;
    obj.params = o.params;
    Logs.insert(obj);
};

guid = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
};

momentFromTimeStr = function(s,expdate){
    var m = moment(s);
    if(!m.isValid()){
        var expday = moment(expdate).format('YYYY-MM-DD ');
        m = moment(expday+s);
    }
    console.log(m, m.format());
    return m;
};

