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

    function mkRun(uid,i,s6,s7,op1,op2,op3,op4,st5){
        var run = {};
        var out = Samples.insert({owner: uid, name: "SUV "+i, sampletype_id: st5,  timestamp: new Date().getTime(), data: [], tags: [], protocol: false});
        run.operations = {};
        run.operations[op1] = {params: [{name: 'TR volume', value: 100},{name: 'DOPC volume', value: 100}],input: [s6,s7],output: [] };
        run.operations[op2] = {params: []};
        run.operations[op3] = {params: []};
        run.operations[op4] = {output: out};
        run.samples = {};
        var s_a = Samples.insert({owner: uid, name: "DOPC 1", sampletype_id: st,  timestamp: new Date().getTime(), data: [], tags: [], protocol: false});
        var s1_a = Samples.insert({owner: uid, name: "TR 1", sampletype_id: st1,  timestamp: new Date().getTime(), data: [], tags: [], protocol: false});
        run.samples[s] = s_a;
        run.samples[s1] = s1_a;
        run.name = 'Run '+(i+1);
        return run;
    }

    Dates.remove({owner: uid});

    Presets.remove({owner: uid});
    Presets.insert({owner: uid, name: "IPA/water sonication"});
    Presets.insert({owner: uid, name: "Piranha"});
    Presets.insert({owner: uid, name: "Plasma"});

    var t = new Date("Mar 13, 2014 11:13:00");
    var name = "" + (t.getMonth() + 1) + "/" + t.getDate() + "/" + t.getFullYear();
    Dates.insert({owner: uid, name: name, timestamp: t.getTime()});


    TypeClasses.remove({owner: uid});
    var c1, c2, c3, c4, c5, c6;
    c1 = TypeClasses.insert({owner: uid, name: 'Lipid'});
    c2 = TypeClasses.insert({owner: uid, name: 'Purchased'});
    c3 = TypeClasses.insert({owner: uid, name: 'Glass substrate'});
    c4 = TypeClasses.insert({owner: uid, name: 'Solvent'});
    c5 = TypeClasses.insert({owner: uid, name: 'Buffer'});
    c6 = TypeClasses.insert({owner: uid, name: 'SUV'});

    SampleTypes.remove({owner: uid});
    var st0, st, st1, st2, st3, st4, st5;
    st = SampleTypes.insert({owner: uid, name: "DOPC", timestamp: new Date().getTime(), data: [], tags: [], classes: [c1, c2]});
    st1 = SampleTypes.insert({owner: uid, name: "TR", timestamp: new Date().getTime(), data: [], tags: [], classes: [c1, c2]});
    st2 = SampleTypes.insert({owner: uid, name: "Lipids in CHCl3", timestamp: new Date().getTime(), data: [], tags: [], classes: []});
    st3 = SampleTypes.insert({owner: uid, name: "Lipids evaporated", timestamp: new Date().getTime(), data: [], tags: [], classes: []});
    st4 = SampleTypes.insert({owner: uid, name: "Lipids dried", timestamp: new Date().getTime(), tags: [], classes: []});
    st5 = SampleTypes.insert({owner: uid, name: "DOPC 100% SUVs", timestamp: new Date().getTime(), data: [], tags: ["SUV"], classes: []});
    st0 = SampleTypes.insert({owner: uid, name: "General sample", timestamp: new Date().getTime(), data: [], tags: [], classes: []});

    Samples.remove({owner: uid});
    var s0, s, s1, s2, s3, s4, s5;
    s = Samples.insert({owner: uid, name: "DOPC", sampletype_id: st, timestamp: new Date().getTime(), data: [], tags: [], protocol: true});
    s1 = Samples.insert({owner: uid, name: "TR", sampletype_id: st1, timestamp: new Date().getTime(), data: [], tags: [], protocol: true});
    s2 = Samples.insert({owner: uid, name: "Lipids in CHCl3", sampletype_id: st2, timestamp: new Date().getTime(), data: [], tags: [], protocol: true});
    s3 = Samples.insert({owner: uid, name: "Lipids dried", sampletype_id: st3, timestamp: new Date().getTime(), data: [], tags: [], protocol: true});
    s4 = Samples.insert({owner: uid, name: "Lipids hydrated", sampletype_id: st4, timestamp: new Date().getTime(), tags: [], protocol: true});
    s5 = Samples.insert({owner: uid, name: "DOPC 100% SUVs", sampletype_id: st5, timestamp: new Date().getTime(), data: [], tags: ["SUV"], protocol: true});
   // s0 = Samples.insert({owner: uid, name: "General sample", sampletype_id: st0, timestamp: new Date().getTime(), data: [], tags: []});

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

    var eid;
    var d1 = new Date("Mar 13, 2014 11:13:00");
    Experiments.remove({owner: uid});

    var t2 = new Date("Mar 13, 2014 11:15:00");
    var t3 = new Date("Mar 13, 2014 11:17:00");

    var s6,s7,s8,s9,s10,s11;
    s6 = Samples.insert({owner: uid, name: "DOPC 1", sampletype_id: st, timestamp: new Date().getTime(), data: [], tags: []});
    s7 = Samples.insert({owner: uid, name: "TR 1", sampletype_id: st1, timestamp: new Date().getTime(), data: [], tags: []});
//    s8 = Samples.insert({owner: uid, name: "TR 1", sampletype_id: st1, timestamp: new Date().getTime(), data: [], tags: []});
//    s11 = Samples.insert({owner: uid, name: "TR 1", sampletype_id: st1, timestamp: new Date().getTime(), data: [], tags: []});

    var runs = _.map(_.range(0,3),function(i){
              return mkRun(uid,i,s6,s7,op1,op2,op3,op4,st5);
            });
    var _sids = _.map(runs,function(run){return _.map(run.samples,function(v,k){
       // console.log(k,v);
        return v})});
    //    console.log(_sids);
    var sids = _.uniq(_.flatten((_sids.concat([s,s1,s2,s3,s4,s5]))));
    //console.log(sids);
    var prot = {operations: [op1,op2,op3,op4], samples: [s,s1,s2,s3,s4,s5]};
    eid = Experiments.insert({owner: uid, name: "Make SUVs", date: d1.getTime(),
        protocol: prot,
        samples: _.uniq(_.flatten(_sids)),  // only includes actual samples, not samples in protocols
        runs: runs
        });
    if(!verifyExperiment(eid)){
        throw('Database format Error');
    }

    ExpRuns.remove({owner: uid});
    ExpRuns.insert({experiment: eid});

 //   Arrows.remove({owner: uid});
/*    Arrows.insert({owner: uid, op: op1, type: 'sample', from: s, to: s2});
    Arrows.insert({owner: uid, op: op1, type: 'sample', from: s1, to: s2});
    Arrows.insert({owner: uid, op: op2, type: 'sample', from: s2, to: s3});
    Arrows.insert({owner: uid, op: op3, type: 'sample', from: s3, to: s4});
    Arrows.insert({owner: uid, op: op4, type: 'sample', from: s4, to: s5}); */
};

function verifyExperiment(eid){
    var e = Experiments.findOne(eid);
    //stub
    try{
        _.each(e.runs,function(run){
            _.each(run.samples,function(v,k){
                var sv = Samples.findOne(v);
                var sk = Samples.findOne(k);
                if(sv.sampletype_id != sk.sampletype_id || sv.protocol || !sk.protocol){
                    return false;
                }
            });
        });
    }catch(e){
        return false;
    }
    return true;
}