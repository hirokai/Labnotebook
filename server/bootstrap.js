// if the database is empty on server start, create some sample data.
Meteor.startup(function () {
    if(Experiments.find({owner: 'sandbox'}).count() == 0){
        initializeDB("sandbox");
    }
});

// Support for playing D&D: Roll 3d6 for dexterity
Accounts.onCreateUser(function (options, user) {
    //console.log(user);
    initializeDB(user._id);
    return user;
});

//Create user DB for the user of user ID uid.
initializeDB = function(uid) {

    var uid = uid || "sandbox";

    function mkRun(i){
        var s_a = Samples.insert({owner: uid, name: "DOPC-"+i, sampletype_id: st,  timestamp: new Date().getTime(), data: [], tags: [], protocol: false});
        var s1_a = Samples.insert({owner: uid, name: "TR-"+i, sampletype_id: st1,  timestamp: new Date().getTime(), data: [], tags: [], protocol: false});
        var samples = {};
        samples[s] = s_a;
        samples[s1] = s1_a;
        var ops = {};
        ops[op1] = {timestamp: new Date().getTime(), input: [], output: [], params: [{name: 'TR volume', value: 100},{name: 'DOPC volume', value: 100}]};
        ops[op2] = {timestamp: new Date().getTime(), input: [], output: [], params: []};
        ops[op3] = {timestamp: new Date().getTime(), input: [], output: [], params: []};
        ops[op4] = {timestamp: new Date().getTime(), input: [], output: [], params: []};
        ExpRuns.insert({owner: uid, exp: eid, name: 'Run '+i, date: new Date().getTime(),
            samples: samples,
            samplelist: [s_a,s1_a],
            ops: ops});
        return [s_a,s1_a];
    }

    Dates.remove({owner: uid});

    Presets.remove({owner: uid});

    TypeClasses.remove({owner: uid});
    var names = ['Lipid','Purchased','Glass substrate','Solvent','Buffer','SUVs'];
    var cs = _.map(names,function(name){
        TypeClasses.insert({owner: uid, name: name});
    })
    var c1 = cs[0], c2 = cs[1];

    SampleTypes.remove({owner: uid});
    var st0, st, st1, st2, st3, st4, st5;
    st = SampleTypes.insert({owner: uid, name: "DOPC", timestamp: new Date().getTime(), data: [], tags: [], classes: [c1, c2]});
    st1 = SampleTypes.insert({owner: uid, name: "TR", timestamp: new Date().getTime(), data: [], tags: [], classes: [c1, c2]});
    st2 = SampleTypes.insert({owner: uid, name: "Lipids in CHCl3", timestamp: new Date().getTime(), data: [], tags: [], classes: []});
    st3 = SampleTypes.insert({owner: uid, name: "Lipids evaporated", timestamp: new Date().getTime(), data: [], tags: [], classes: []});
    st4 = SampleTypes.insert({owner: uid, name: "Lipids dried", timestamp: new Date().getTime(), tags: [], classes: []});
    st5 = SampleTypes.insert({owner: uid, name: "DOPC 100% SUVs", timestamp: new Date().getTime(), data: [], tags: ["SUV"], classes: []});
    st0 = SampleTypes.insert({owner: uid, name: "General sample", timestamp: new Date().getTime(), data: [], tags: [], classes: []});

    //These samples are used in the protocol in the exp.
    Samples.remove({owner: uid});
    var s0, s, s1, s2, s3, s4, s5;
    s = Samples.insert({owner: uid, name: "DOPC", sampletype_id: st, timestamp: new Date().getTime(), data: [], tags: [], protocol: true});
    s1 = Samples.insert({owner: uid, name: "TR", sampletype_id: st1, timestamp: new Date().getTime(), data: [], tags: [], protocol: true});
    s2 = Samples.insert({owner: uid, name: "Lipids in CHCl3", sampletype_id: st2, timestamp: new Date().getTime(), data: [], tags: [], protocol: true});
    s3 = Samples.insert({owner: uid, name: "Lipids dried", sampletype_id: st3, timestamp: new Date().getTime(), data: [], tags: [], protocol: true});
    s4 = Samples.insert({owner: uid, name: "Lipids hydrated", sampletype_id: st4, timestamp: new Date().getTime(), tags: [], protocol: true});
    s5 = Samples.insert({owner: uid, name: "DOPC 100% SUVs", sampletype_id: st5, timestamp: new Date().getTime(), data: [], tags: ["SUV"], protocol: true});

    // Operations belongs to only one experiment.
    Operations.remove({owner: uid});
    var op1, op2, op3, op4;
    op1 = Operations.insert({owner: uid, name: 'Mix lipids', input: [s,s1], output: [s2],
                params:[
                    {type: "volume", unit: "uL", name: "TR volume"},
                    {type: "volume", unit: "uL", name: "DOPC volume"}
                    ]
            , timestamp: new Date().getTime()});
    op2 = Operations.insert({owner: uid, name: "Evapo",  input: [s2], output: [s3], timestamp: new Date().getTime() + 1, params: []});
    op3 = Operations.insert({owner: uid, name: "N2 dry", input: [s3], output: [s4], timestamp: new Date().getTime() + 2, params: []});
    op4 = Operations.insert({owner: uid, name: "Sonication", input: [s4], output: [s5], timestamp: new Date().getTime() + 2, params: []});

    Experiments.remove({owner: uid});
    var prot = {operations: [op1,op2,op3,op4], samples: [s,s1,s2,s3,s4,s5]};
    var eid = Experiments.insert({owner: uid, name: "Make SUVs", date: new Date('4/3/2014').getTime(),
        protocol: prot,
        samples: []  // only includes actual samples, not samples in protocols
        });
    if(!verifyExperiment(eid)){
        throw('Database format Error');
    }

    ExpRuns.remove({owner: uid});
    var ss = [];
    ss = ss.concat(mkRun(1));
    ss = ss.concat(mkRun(2));
    ss = ss.concat(mkRun(3));
    ss = _.uniq(ss);
    Experiments.update(eid,{$set: {samples: ss}});

};

function verifyExperiment(eid){
    var e = Experiments.findOne(eid);
    //stub
    try{
//        _.each(e.runs,function(run){
//            _.each(run.samples,function(v,k){
//                var sv = Samples.findOne(v);
//                var sk = Samples.findOne(k);
//                if(sv.sampletype_id != sk.sampletype_id || sv.protocol || !sk.protocol){
//                    return false;
//                }
//            });
//        });
    }catch(e){
        return false;
    }
    return true;
}