findSamplesInExp = function (eid) {
    var sids = Experiments.findOne(eid).samples;
    return Samples.find({_id: {$in: sids}}).fetch();
};

findProtocolSamplesInExp = function (eid) {
    var sids = Experiments.findOne(eid).protocol.samples;
    return Samples.find({_id: {$in: sids}}).fetch();
};


generalSampleType = function () {
    return SampleTypes.findOne({name: 'Any'})._id;
};

generalSampleTypeObj = function () {
    return SampleTypes.findOne({name: 'Any'});
};

insertOp = function (eid, name, input, output, params) {
    var owner = Meteor.userId() || 'sandbox';
    params = params || [];
    var op = Operations.insert({owner: owner, name: name, input: input, output: output, params: params,
        timestamp: new Date().getTime() + 1});
    Experiments.update(eid, {$push: {'protocol.operations': op}});
    ExpRuns.find({exp: eid}).map(function (run) {
        var ops = run.ops;
        ops[op] = {timestamp: null, input: [], output: [], params: []};
        ExpRuns.update(run._id, {$set: {ops: ops}});
    });
    addLog({type: 'exp', op: 'insertop', id: eid, params: {op: op, name: name}});
    return op;
};

insertSampleType = function (name, parent, cls) {
    var owner = Meteor.userId() || 'sandbox';
    var parent = parent || generalSampleType();
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

insertTypeClass = function (name) {
    var owner = Meteor.userId() || 'sandbox';
    var cid = TypeClasses.insert({owner: owner, name: name});
    addLog({type: 'class', op: 'insert', id: cid, params: {name: name}});
    return cid;
};

newSampleToProtocol = function (eid, type_id, name) {
    var owner = Meteor.userId() || 'sandbox';
    var sid = Samples.insert({owner: owner, sampletype_id: type_id, name: name, timestamp: new Date().getTime(), protocol: true});
    Experiments.update(eid, {$push: {'protocol.samples': sid}});
    addLog({type: 'protocol_sample', op: 'new', id: sid, params: {to_id: eid}});
    return sid;
};

insertExp = function (name) {
    var owner = Meteor.userId() || 'sandbox';
    var prot = {operations: [], samples: []};
    var eid = Experiments.insert({owner: owner, name: name, protocol: prot, samples: [], date: (new Date()).getTime(),
        runs: []});
    addLog({type: 'exp', op: 'new', id: eid, params: {name: name}});
    return eid;
};

removeOpsAboutSample = function (eid, sid) {
    var ops = Operations.find({$or: [
        {input: sid},
        {output: sid}
    ]}).fetch();
    //console.log(ops);
    _.each(ops, function (op) {
        if (
            (op.input.length == 1 && op.input[0] == sid)
                || (op.output.length == 1 && op.output[0] == sid)) {
            var op = Operations.findOne(op._id);
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
    addLog({type: 'protocol_sample', op: 'delete', id: sid, params: {exp: eid}});
};

renameProtocolSample = function (sid, name) {
    if (_.trim(name)) {
        Samples.update(sid, {$set: {name: name}});
        return true;
    } else {
        var name = Samples.findOne(sid).name;
        Samples.update(sid, {$set: {name: name}});
        return false;
    }
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

findSamplePosInList = function (sid) {
    return 0;
};

assignSampleInRun = function (runid, sample, newsample) {
//    console.log(runid,ExpRuns.findOne());
    var samples = ExpRuns.findOne(runid, {samples: 1}).samples;
    samples[sample] = newsample;
    ExpRuns.update(runid, {$set: {samples: samples}, $push: {samplelist: newsample}});
};

removeSampleInRun = function (runid, sample, old_sid) {
    var obj = {};
    var key = 'samples.' + sample;
    obj[key] = null;
//    console.log(runid,obj,ExpRuns.findOne(runid));
    ExpRuns.update(runid, {$set: obj, $pull: {samplelist: old_sid}});
};

sampleNotUsedAtAll = function (sid) {
    return ExpRuns.find({samplelist: sid}).count() == 0;
};

sampleTypeNotUsedAtAll = function (tid) {
    return Samples.find({sampletype_id: tid}).count() == 0;
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
        var params = op ? op.params : null;
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

updateDBAccordingToCell = function (runid, opid, paramname, newval, oldval) {
    if (!paramname || paramname == '') {
        return;
    }
    var op = ExpRuns.findOne(runid).ops[opid];
    var k, v;
    if (op) {
        var params = op.params;
        var newparams = _.map(params, function (param) {
            if (param.name == paramname) {
                param.value = newval;
                return param;
            } else {
                return param;
            }
        });
        op.params = newparams;
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
};

removeOp = function (opid) {
    Operations.remove(opid);
    addLog({type: 'op', id: opid, op: 'remove'});
}

deleteExp = function (eid) {
    var runs = ExpRuns.find({exp: eid});
    runs.map(function (run) {
        deleteRun(run._id);
    });
    Experiments.remove(eid);
    addLog({type: 'exp', op: 'remove', id: eid, params: {}});
};

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

addLog = function (o) {
    var obj = {};
    obj.owner = Meteor.userId() || 'sandbox';
    obj.timestamp = new Date().getTime();
    obj.date = moment(obj.timestamp).format('YYYYMMDD');

    obj.type = o.type;
    obj.op = o.op;
    obj.id = o.id;
    obj.params = o.params;
    Logs.insert(obj);
};


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
}

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


allowedSampleTypeName = function (name) {
    return _.trim(name) && !SampleTypes.findOne({name: name});
};

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

findCompatibleSamples = function (tid) {
    var tids = findSubTypes(tid);
    tids.push(tid);
    return Samples.find({sampletype_id: {$in: tids}, protocol: false}).fetch();
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
        console.log(k, v, sid);
        return v == sid ? k : null
    }))[0];
}

copyProtocolForNewExp = function (eid) {
    var e = Experiments.findOne(eid);
    var prot = e.protocol;
    var newe = insertExp(e.name);
    Experiments.update(newe, {$set: {protocol: prot}});
    addLog({type: 'exp', op: 'cloneprotocol', id: newe, params: {from: eid}});
};

changeDateOfExp = function (eid, date) {
    Experiments.update(eid, {$set: {date: date}});
    addLog({type: 'exp', op: 'updatedate', id: eid, params: {date: date}});
};
