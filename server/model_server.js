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

        addLog({type: 'db',op: 'verify', params: {success: true, corrected: corrected}});

        return {success: true, corrected: corrected};
    }catch(e){
        addLog({type: 'db',op: 'verify', params: {success: false, corrected: corrected}});
        return {success: false, message: e.msg, exception: e};
    }
};

isValidID = function(str){
    var re = /^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17}$/;
    return re.test(str);
};


//
// Background jobs
//

var def_interval_hours = 24;  // 24 hours

checkAutoBackup = function(uid,failcount){
    failcount = failcount || 0;
    if(failcount > 5) return;

    var cfg = Config.findOne(uid);
    if(!cfg || !cfg.logemail_auto) return;

    var interval_min;
    try{
        interval_min = (cfg.values.logemail_interval_hours || def_interval_hours)*60;
    }catch(e){
        interval_min = def_interval_hours * 60;
    }

    uid = uid || this.userId;
    var cfg = Config.findOne({owner: uid});
    if(!cfg){
        console.log('Config not foun.')
        return;
    }

    var timelapse = (moment().valueOf() - (cfg.values.lastBackupOn || 0)) / (1000*60);
    console.log('checkAutoBackup(): '+numeral(timelapse).format('0.0')+' min passed from last auto backup. '+numeral(interval_min-timelapse).format('0.0')+' min to wait.')

    //timelapse / min
    if(cfg && cfg.values.logemail_auto && (interval_min - timelapse)/interval_min < 0.1){
        console.log('Time has come. Doing backup...');
        Meteor.call('sendLogByEmail', function (err, res) {
            //    console.log(err, res);
            if (res.success) {
                console.log('Autobackup email sent to ' + cfg.values.logemail);
                addLog({op: 'autobackup', type: 'db', id: null, params: {target: 'email', email_to: cfg.values.logemail}});
            } else {
                console.log('Error occured.')
            }
        });

        dumpDBToGDrive(uid, function(res){
            if(res.url){
                showMessage('Database snapshot was auto-saved to : <a href="'+ res.url+'">Google Drive</a>');
                //    window.open(res.url);
                var t = moment().valueOf();
                Config.update(cfg._id, {$set: {'values.lastBackupOn': t}});
                addLog({type:'db',op:'autobackup',params: {target: 'gdrive'}});
                console.log('Next backup check will be run in ~'+interval_min+' min.');
            }else{
                console.log('Error during saving the exp.');
                console.log('Next backup run will be run immediately');
                checkAutoBackup(uid,failcount+1);
            }
        });

    }
};

getLatestLogs = function(uid){
    var from = Config.findOne({owner: uid}).values.lastLogExportedAt;
    return Logs.find({owner: uid, timestamp: {$gt: from}}).fetch();
};

