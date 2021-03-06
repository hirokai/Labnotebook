/**
 * Created with IntelliJ IDEA.
 * User: hiroyuki
 * Date: 4/30/14
 * Time: 5:37 PM
 * To change this template use File | Settings | File Templates.
 */

Template.exp.exp_name = function () {
//  var e = getCurrentExp();
//  //  console.log(e);
    return  this.name;
};

Template.exp.samples = function () {
    var eid = getCurrentExpId();
    var edges = getProtocolEdges(eid);
    //console.log(edges);
    var es = _.map(edges, function (edge) {
        return [edge.from._id, edge.to._id];
    });
    var sorted = toposort(es);

    var e = Experiments.findOne(eid);
    var sids = e.samples;
    return Samples.find({_id: {$in: sids}});
};

Template.exp.disabled_if_locked = function () {
    return this.locked ? 'disabled' : '';
};

Template.exp.hide_intermediates = function () {
    return Session.get('hide_intermediates') ? 'checked' : '';
};

Template.exp.protocol_samples = function () {
    try{
        var eid = getCurrentExpId();
        var exp = Experiments.findOne(eid);
        var sids = exp.protocol.samples;
        var samples = Samples.find({_id: {$in: sids}},{sort: {rank: 1}}).fetch();
        if(samples.length > 1){
            var ins = findInputsOfExp(exp);
            var outs = findOutputsOfExp(exp);
            return _.compact(_.map(samples, function (s) {
                s.input = _.contains(ins, s._id);
                s.output = _.contains(outs, s._id);
                return Session.get('hide_intermediates') ? ((s.input || s.output) ? s : null) : s;
            }));
        }else if(samples.length == 1){
            var s = samples[0];
            s.input = true;
            s.output = true;
            return [s];
        }else{
            return [];
        }
    }catch(e){
         console.log(e);
         Session.set('error_occured',true);
         return [];
    }
};

Template.exp.error_occured = function(){
    return   Session.get('error_occured');
};

Template.exp.sample_link_in_run = function () {
    return
};

Template.exp.runs = function () {
    var runs = getExpRuns(getCurrentExpId());
    return runs.map(function(run,i){run.index = i; return run;});
};

Template.exp.sample_run = function (sid, runid) {
    var sid = ExpRuns.findOne(runid).samples[sid];
    return Samples.findOne(sid) || {stub: true};
//    console.log(s);
//    return s ? s : {stub: true};
};

Template.exp.operation_run = function (opid, runid) {
//   console.log(opid,runid,ExpRuns.findOne(runid));
    return ExpRuns.findOne(runid).ops[opid] || {};
};

Template.exp.eid = function () {
    return getCurrentExpId();
};

Template.exp.sample_selected = function () {
    return _.contains(Session.get('selected_nodes'), this._id) ? "selected" : '';
};

Template.exp.sample_inputoutput = function () {
    return this.input ? 'protocol_sample_input' : (this.output ? 'protocol_sample_output' : '');
};


Template.exp.op_selected = function () {
    return _.contains(Session.get('selected_ops'), this._id) ? "selected" : '';
};

Template.exp.formatTime = function (v) {
    return v ? moment(v).format("H:mm") : null;
};

Template.exp.formatDate = function (v) {
    return moment(v).format('M/D/YYYY');
};

Template.exp.all_samples = function () {
    return Samples.find({protocol: false});
};

Template.exp.sampletype = function () {
    var st = SampleTypes.findOne(this.sampletype_id);
    return st ? st.name : '';
};


Template.exp.editing_sample_name = function () {
    return Session.equals('editing_sample_id', this._id);
};

Template.exp.editing_sample_type = function () {
    return Session.equals('editing_sampletype_id', this._id);
};

Template.exp.protocol_operations = function () {
    // var e = getCurrentExp();
    var opids = this.protocol.operations;

    return Operations.find({_id: {$in: opids}},{sort: {rank: 1}})
        .map(function(op,i){op.index = i+1; return op;});
};

Template.exp.step_input = function () {
    var op = Operations.findOne(this._id);
    if (op && op.input)
        return Samples.find({_id: {$in: op.input}, protocol: true});
    else
        return [];
};

Template.exp.step_output = function () {
    var op = Operations.findOne(this._id);
    if (op && op.output)
        return Samples.find({_id: {$in: op.output}, protocol: true});
    else
        return [];
};

Template.exp.index_name = function() {
    return this.index + 1;
};

Template.exp.samplerun_selected = function(sid,rid,ridx) {
  var obj = Session.get('exp_sampletable_selection');
 // console.log(obj,ridx,sid);
  return (obj && obj.from && obj.from.sample == sid
            && obj.to &&
            ((obj.from.runidx <= ridx && obj.to.runidx >= ridx) || (obj.to.runidx <= ridx && obj.from.runidx >= ridx)))
        ? 'selected' : '';
};

Template.exp.disable_runsamples_btn = function(){
    return Session.get('exp_sampletable_selection').from ? '' : 'disabled';
};

Template.exp.disabled_new_runsamples = function() {
  var cells = getSelectedRunSampleCells();
  return _.compact(_.map(cells,function(c){return c.sample;})).length > 0 ? 'disabled_link' : '';
};

Template.exp.not_selected_runsamples = function(){
    var obj = Session.get('exp_sampletable_selection');
//    console.log(this._id,obj);
    return !(obj && obj.from && obj.from.sample == this._id);
}

Template.exp.events({
    'click .disabled_link': function(evt){
        evt.preventDefault();
    },
    'mousedown .stepdelete': function (e) {
//        var eid = getCurrentExpId();
        removeOp(this._id);
    },
    'change #exp_datepicker': function (evt) {
        var date = new Date(evt.target.value).getTime();
        changeDateOfExp(getCurrentExpId(), date);
    },
    'change #hide_intermediates': function(evt){
        var checked = $(evt.target).is(':checked');
        Session.set('hide_intermediates',checked);
    },
    'click .step_sample_list': function () {
        //     Router.go('sample',{_id: this._id});
    },
    'click .sample_name': function (evt, tmpl) {
        Session.set('protocol_sampleinfo_for', this._id);
        $('#protocol_sample_info').modal();
    },
    'click .sampledelete': function (evt, tmpl) {
        removeOpsAboutSample(getCurrentExpId(), this._id);
        Samples.remove(this._id);
    },
    'click #finishexp': function() {
        var msg = 'This command will make the experiment read only, and the copy of data is saved in your Google Drive. Are you sure?'
        if(window.confirm(msg)){
            freezeExp(this._id);
            mkGoogleSheet(getCurrentExpId());
        }
    },
    'click #unfinishexp': function() {
        var msg = 'Are you sure you want to unfreeze the experiment?'
        if(window.confirm(msg)){
            unfreezeExp(this._id);
        }
    },
    'click #dumpexp': function(){
        showMessage('Exporting as spreadsheet to Google Drive...', 5000);
        mkGoogleSheet(getCurrentExpId(),function(res){
            if(res.url){
                showMessage('Experiment was exported to : <a href="'+ res.url+'">Google Drive</a>');
            //    window.open(res.url);
            }else{
                showMessage('Error during saving the exp.');
            }
        });
//       Meteor.call('dumpExpToGoogleSheets',getCurrentExpId())
    },
    'click #showreport': function(){
        mkPdf(getCurrentExp());
    },
    'click #deleteexp': function () {
        var eid = getCurrentExpId();
        if (window.confirm('Are you sure you want to delete this exp?')) {
            deleteExp(eid);
            Router.go('exp');
        }
    },
    'click .sampletype a': function () {
        Router.go('type', {_id: this.sampletype_id});
    },
    'dblclick #exptitle': function (evt, tmpl) {
        if(getCurrentExp().locked)return;
        Session.set('editing_exp_title', true);
        Deps.flush(); // force DOM redraw, so we can focus the edit field
        activateInput(tmpl.find("#exptitle_input"));
    },
    'click .entertime': function (evt, tmpl) {
        if(getCurrentExp().locked)return;
        var ee = getButton(evt.target);
        var opid = ee.attr('data-operation');
        var runid = ee.attr('data-runid');
        setOpTimestamp(runid, opid, new Date().getTime());
    },
    'click .entertime_sheet': function (evt, tmpl) {
        console.log('entertime_sheet');
        if(getCurrentExp().locked)return;
        var ee = getButton(evt.target);
        var opid = ee.attr('data-operation');
        var runid = ee.attr('data-runid');
        console.log();
        setOpTimestamp(runid, opid, new Date().getTime());
    },
    'click .edittime': function (evt, tmpl) {
        if(getCurrentExp().locked)return;
        var ee = getButton(evt.target);
        var opid = ee.attr('data-operation');
        var runid = ee.attr('data-runid');

        Session.set('runopinfo_for', {op: opid, run: runid});
        //      $('#runop_timepicker').timepicker();
        $('#runop_info').modal();
    },
    'mousedown .timepoint': function (evt) {
        if(evt.button != 0) return;
        if(getCurrentExp().locked)return;
        console.log(evt);
        if (evt.altKey) {
            var ee = $(evt.target);
            var opid = ee.attr('data-operation');
            var runid = ee.attr('data-runid');
            setOpTimestamp(runid, opid, null);
        } else {
            var ee = $(evt.target);
            var opid = ee.attr('data-operation');
            var runid = ee.attr('data-runid');
            Session.set('runopinfo_for', {op: opid, run: runid});
            $('#runop_info').modal();
        }
    },
    'mousedown .timepoint_sheet': function (evt) {
        if(evt.button != 0) return;
        if(getCurrentExp().locked)return;
        console.log(evt);
        if (evt.altKey) {
            var ee = getParentOrSelf(evt.target,'DIV');
            var opid = ee.attr('data-operation');
            var runid = ee.attr('data-runid');
            console.log(ee,opid,runid)
            setOpTimestamp(runid, opid, null);
        }
    },
    'change #protocol_shown': function (evt) {
        var wrapper = $('#exp_graph_wrapper');
        toggleProtocol(evt.target.checked);
        graphWrapperSizeChanged(wrapper,!evt.target.checked);
        var obj = Session.get('info_shown');
        obj.protocol = evt.target.checked;
        Session.set('info_shown', obj);
    },
    'change #sample_shown': function (evt) {
        var obj = Session.get('info_shown');
        obj.sample = evt.target.checked;
        Session.set('info_shown', obj);
    },
    'change #step_shown': function (evt) {
        var obj = Session.get('info_shown');
        obj.step = evt.target.checked;
        Session.set('info_shown', obj);
    },
    'change #sheet_shown': function (evt) {
        var obj = Session.get('info_shown');
        obj.sheet = evt.target.checked;
        Session.set('info_shown', obj);
    },
    'click #addrunbtn': function (evt) {
        addNewRunToExp(getCurrentExpId());
    },
    'click .addmultiruns': function(evt){
        var eid = getCurrentExpId();
        var num = parseInt($(evt.target).attr('data-numruns'));
        _.map(_.range(0,num),function(){
            addNewRunToExp(eid);
        });
    },
    'click #runsamples_selectnone': function(){
      Session.set('exp_sampletable_selection',{from: null, to: null});
    },
    'click .new_runsamples': function(evt) {
        newRunSamplesForSelection(true);

    },
    'click .new_runsamples_copyname': function(evt) {
        newRunSamplesForSelection(false);
    },
    'click .delete_runsamples': function(){
        var cells = getSelectedRunSampleCells();
        _.map(cells,function(c){
            var runid = c.run;
            var protocol_sid = c.protocol_sample;
            var sid = c.sample;
            removeSampleInRun(runid, protocol_sid, sid);
        });
    },
    'click .run_name': function (evt) {
        if(evt.altKey){
            var e = $(evt.target);
//            var ee = e.prop('tagName') == 'TD' ? e : e.parent('td');
            var id = e.attr('data-runid');
          //  console.log(e,ee,id);
            deleteRun(id);
        }else{
            //stub: show run info.
        }
    },
//    'click #savelayout': function(evt){
//        var wrapper = $('#exp_graph_wrapper');
//        var w = wrapper.width();
//        var h = wrapper.height();
//        var eid = getCurrentExpId();
//        var pane = Session.get('info_shown');
//        Experiments.update(eid,{$set: {'view.graph': {width: w, height: h}, 'view.panes': pane}});
//        console.log(getCurrentExp());
//    },
//    'click .assignsamplebtn': function (evt) {
//        var ee = getButton(evt.target);
//        var sid = ee.attr('data-protocolsample');
//        var runid = ee.attr('data-runid');
//        Session.set('choosing_sample_for', {run: runid, sample: sid});
//        var html = mkHtmlForSampleChooser(sid, runid);
//        $('#sample_chooser_samples').html(html);
//        $('#sample_chooser').modal();
//    },
    'dblclick td.sample_run_cell': function (evt) {
        if(getCurrentExp().locked)return;
        var ee = $(evt.target);
        var eid = getCurrentExpId();
        var runid = ee.attr('data-runid');
        var protocol_sid = ee.attr('data-protocolsample');
        var protocol_sample = Samples.findOne(protocol_sid);
//        console.log(runid, protocol_sid, protocol_sample);
        var sid;
        if(evt.shiftKey){
            sid = newSample(protocol_sample.name, protocol_sample.sampletype_id);
            assignSampleInRun(runid, protocol_sid, sid);
        }else{
            Session.set('choosing_sample_for', {run: runid, sample: protocol_sid});
            var html = mkHtmlForSampleChooser(protocol_sid, runid);
            $('#sample_chooser_samples').html(html);
            $('#sample_chooser').modal();
        }

    },
    'click .choose_sample': function (evt) {
        var sid = $(evt.target).attr('data-sid');
        var eid = getCurrentExpId();
        var obj = Session.get('choosing_sample_for');
        var runid = $(evt.target).attr('data-runid')
        assignSampleInRun(runid, obj.sample, sid);
        $('#sample_chooser').modal('hide');
    },
    'mousedown td.sample_run_cell': function (evt) {
   //     console.log(evt,evt.button);
        if(evt.button != 0) return;
        var rid = $(evt.target).attr('data-runid');
        var sid = $(evt.target).attr('data-protocolsample');
        var ridx = $(evt.target).attr('data-runidx');
        if(evt.shiftKey){
            var obj = Session.get('exp_sampletable_selection');
            if(obj && obj.from && obj.from.sample == sid){ // only same row is allowed.
                obj.to = {run: rid, runidx: ridx, sample: sid};
                Session.set('exp_sampletable_selection',obj);
            }
        }else{
            var obj = {};
            obj.from = {run: rid, runidx: ridx, sample: sid};
            obj.to = {run: rid, runidx: ridx, sample: sid};
            Session.set('exp_sampletable_selection',obj);
        }
     //   $(evt.target).toggleClass('selected');
    },
    'click .sampleinrun': function (evt) {
        var e = $(evt.target);
        var ee = e.prop('tagName') == 'TD' ? e : e.parent('td');
        var runid = ee.attr('data-runid');
        //console.log(ee, runid, ee.attr('data-sample'));
        var currentid = ee.attr('data-sample');
        if (evt.altKey) {
            var sid = ee.attr('data-protocolsample');
            //console.log(sid);
            removeSampleInRun(runid, sid, currentid);
        } else {
            Session.set('sampleinfo_for', currentid);
            $('#sample_info').modal();
        }
    },
    'click .step_table_name': function () {
        Session.set('opinfo_for', this._id);
        var params = Operations.findOne(this._id).params;
        Session.set('op_param_list', params);
        $('#op_info').modal();
    },
    'click .stepname_sheet': function(evt){
        var e = $(evt.target);
        var opid = e.attr('data-operation');
        Session.set('opinfo_for', opid);
        var params = Operations.findOne(opid).params;
        Session.set('op_param_list', params);
        $('#op_info').modal();
    }
});

Template.exp.assignsample_possible = function (protocol_sid) {
    var p_ops = Experiments.findOne(getCurrentExpId(), {fields: {'protocol.operations': 1}}).protocol.operations;
    var ops = Operations.find({_id: {$in: p_ops}});
    var outs = _.flatten(ops.map(function (op) {
        return op.output;
    }));
    return !_.contains(outs, protocol_sid);
};

Template.exp.editing_title = function () {
    return  Session.get('editing_exp_title');
};

Template.exp.events(okCancelEvents(
    '#exptitle_input',
    {
        ok: function (value) {
            console.log(_.trim(value));
            if (_.trim(value) == '') {
                window.alert('');
            } else {
                var eid = getCurrentExpId();
                setExpTitle(eid,value,function(err,res){
                    if(err){
                        window.alert(err.message);
                    }else{
                        Session.set('editing_exp_title', false);
                    }
                });
            }
        },
        cancel: function () {
            Session.set('editing_exp_title', false);
        }
    }));

Template.exp.all_sampletypes = function () {
    return SampleTypes.find();
}

Template.exp.events(okCancelEvents(
    '#samplename_edit_input',
    {
        ok: function (value) {
            var id = Session.get('editing_sample_id');
            setSampleName(id,value,function(err,res){
                if(err){
                    window.alert(err.message);
                }else{
                    Session.set('editing_sample_id', null);
                }
            });
        },
        cancel: function () {
            Session.set('editing_sample_id', null);
        }
    }));

Template.exp.addstephidden = function () {

    return !Session.get('visible_addstepdiv');
};

Template.exp.info_active = function (name) {
    return Session.get('info_shown')[name];
};

Template.exp.date = function () {
//    var eid = getCurrentExpId();
//    var e = Experiments.findOne(eid);
    var e = this;
    var d = e ? e.date : null;
    return d ? formatDate(new Date(d)) : null;
};

Template.exp.rendered = function () {
    $("#exp_datepicker").datepicker({ autoSize: true });

    var self = this;
    self.node = self.find("svg");
    if (!self.handle) {
        self.handle = Deps.autorun(function () {
            var obj = Session.get('info_shown');
            if(obj.protocol){
                var div = $('#sampleandprotocol');
            }
            var eid = getCurrentExpId();
            if(eid){
                renderCells(eid);
            }
            //`ga('send', 'event', 'view', 'exp', Meteor.userId(),eid);
        });
    }
};


function mkHtmlForSampleChooser(sid, runid) {
//    console.log(sid,Samples.findOne(sid));
    var stid = Samples.findOne(sid).sampletype_id;
    var samples = findCompatibleSamples(stid);
    return _.map(samples,function (s) {
        var type = SampleTypes.findOne(s.sampletype_id).name;
        var exp = findExpMakingSample(s._id);
      //  console.log(exp);
        return "<tr class='chooser_tr'>" + "<td class='name'>" + s.name + "</td>"
            + "<td class='type'>" + type + "</td>"
            + "<td class='expmade'>" + formatExp(exp) + "</td>"
            + "<td class='choose_sample' data-sid='" + s._id + "' data-runid='" + runid + "'" + ">Choose</td></tr>";
    }).join('\n');
}

function formatExp(exp){
    return exp ? exp.name + ' <span class="exp_date">' + moment(exp.date).format('M/D/YY') + '</span>' : '<span class="danger">N/A</span>';
}


function dumpExperiment() {
    Meteor.call('dumpExperiment', Meteor.userId(), getCurrentExpId(), function (err, path) {
        window.open(path);
    });
}

Template.sample_info.sample = function () {
    return Samples.findOne(Session.get('sampleinfo_for'));
};

Template.sample_info.time_recorded = function () {
    return formatDateTime(this.timestamp);
};

Template.sample_info.type = function () {
    var stid = this.sampletype_id;
    return SampleTypes.findOne(stid);
};

Template.sample_info.time_made = function () {
    return moment(this.timestamp).format('MM/DD/YYYY');
};

Template.sample_info.exp_made = function () {
    return findExpMakingSample(this._id);
};

Template.sample_info.op_sampletype = function (sid) {
    var tids = findSubTypes(tid);
    return SampleTypes.find({_id: {$in: tids}});
}

Template.sample_info.possible_types = function (sid) {
    var rid = ExpRuns.findOne({samplelist: sid})._id;
    var tid = Samples.findOne(findProtocolSample(rid, sid)).sampletype_id;
    var tids = findSubTypes(tid);
    console.log(rid, tid, tids);
    return SampleTypes.find({_id: {$in: tids}});
};

Template.sample_info.sampletype_selected = function (sid) {
    var tid = Samples.findOne(sid).sampletype_id;
    return this._id == tid ? 'selected' : '';
};


Template.sample_info.disabled_if_locked = function () {
    return this.locked ? 'disabled' : '';
};

Template.sample_info.events({
//    'click #sample_info_type': function(evt){
//       $('#sample_info').modal("hide");
//        $('#sample_info_type').attr('data-jumping','1');
//   //     Router.go("type",{_id: $(evt.target).attr('data-sampletype')});
//    },

    'hidden.bs.modal #sample_info': function (evt) {
        if ($('#sample_info_type').attr('data-jumping')) {
            Router.go("type", {_id: $('#sample_info_type').attr('data-sampletype')});
        } else if ($('#seesampledetailbtn').attr('data-jumping')) {
            Router.go("sample", {_id: $('#seesampledetailbtn').attr('data-sample')});
        }
    },
    'click #close_sample_info': function () {
        Session.set('sampleinfo_for', null);
    },
    'click #save_sample_info': function (evt) {
        var name = $('#sampleinfo_name').val();
        var note = $('#sample_note').val();
        var type = $('#sample_info_type').val();
//        var array = $('#samplearray').is(':checked');
        var sid = Session.get('sampleinfo_for');
        console.log(sid);
        setSampleInfo(sid,name,note,type, function(err,res){
            if(err){
                window.alert(err.message);
            }else{
                $('#sample_info').modal('hide');
                Session.set('sampleinfo_for', null);
            }
        });
    },
    'shown.bs.modal #sample_info': function () {
        activateInput($('#sampleinfo_name'));
    },
    'keydown #sampleinfo_name': function (evt) {
        if (evt.keyCode == 13) {
            $('#save_sample_info').click();
        }
    },
    'click #seesampledetailbtn': function () {
        $('#sample_info').modal("hide");
        $('#seesampledetailbtn').attr('data-jumping', '1');
    },

    'click #close_psample_info': function () {
        Session.set('protocol_sampleinfo_for', null);
    },
    'click #save_psample_info': function (evt) {
        var name = $('#psampleinfo_name').val();
        var note = $('#psample_note').val();
        var type = $('#psample_info_type').val();
        var sid = Session.get('protocol_sampleinfo_for');
        var s = Samples.findOne(sid);
        var msg = 'There are already associated run samples with this step. '
            + 'Changing the sample type may break consistentcy of exp data. '
            + 'Are you sure you want to change the sample type?';
        if (s.sampletype_id == type || getRunSamplesOf(getCurrentExp(), sid).length == 0 || window.confirm(msg)) {
            var obj = {name: name, note: note, sampletype_id: type};
            setProtocolSampleInfo(sid,name,note,type);
            $('#protocol_sample_info').modal('hide');
            Session.set('protocol_sampleinfo_for', null);
        }
    },
    'keydown #psampleinfo_name': function (evt) {
        if (evt.keyCode == 13) {
            $('#save_psample_info').click();
        }
    }
});

Template.sample_info.protocol_sample = function () {
    return Samples.findOne(Session.get('protocol_sampleinfo_for'));
};

Template.sample_info.alltypes = function () {
    return SampleTypes.find();
};

Template.sample_info.is_array = function(){
    return this.array ? 'checked' : '';
}

Template.sample_info.type_selected = function (tid) {
    return this._id == tid ? 'selected' : '';
};

Template.op_info.operation = function () {
    var opid = Session.get('opinfo_for');
    var op = Operations.findOne(opid);
//    console.log(op);
    return op;
};

Template.op_info.sample = function (sid) {
    return Samples.findOne(sid);
};

function getParamsFromModal() {
    var params = Session.get('op_param_list');
    return params;
}

function paramsEqual(oldparams, newparams) {
    // console.log(oldparams,newparams);
    if (oldparams.length != newparams.length) {
        return false;
    }
    _.each(_.zip(oldparams, newparams), function (ps) {
        if (ps[0] != ps[1]) return false;
    });
    return true;
}

function doUpdateOp() {
    var opid = Session.get('opinfo_for');
    var params = Session.get('op_param_list');
    var note = $('#op_note').val();
    console.log(opid, params, note);
    params = _.filter(params, function (p) {
        return p.name != ''
    });
    if (_.uniq(_.map(params, function (p) {
        return p.name;
    })).length == params.length) {
        var name = $('#opinfo_name').val();
        var obj =  {'params': params, name: name, note: note};
        updateOpInfo(opid,params,name,note);
        $('#op_info').modal('hide');
        Session.set('opinfo_for', null);
        Session.set('op_param_list', []);
    } else {
        window.alert('Params have to have unique names.');
    }
}

Template.op_info.events({
    'click #close_op_info': function () {
        Session.set('opinfo_for', null);
        Session.set('op_param_list', []);
    },
    'click #save_op_info': function (evt) {
        var name = $('#opinfo_name').val();
        var note = $('#op_note').val();
        var params = getParamsFromModal();
        var opid = Session.get('opinfo_for');
        console.log(name, opid);
        if (name && opid) {
            var op = Operations.findOne(opid);
            if (paramsEqual(op.params, params) || getRunOpsOf(getCurrentExp(), opid).length == 0) {
                doUpdateOp();
                console.log('Done op update');
            } else {
                var msg = 'There are already associated run operations with this step. '
                    + 'Changing the operation parameters may break consistentcy of exp data. '
                    + 'Are you sure you want to change them?';
                if (window.confirm(msg)) {
                    doUpdateOp();
                } else {

                }
            }
        } else {
            console.log('Missing parameters.');
        }
    },
    'change .paramname': function (evt) {
        var name = $(evt.target).val();
        var idx = parseInt($(evt.target).attr('data-index'));
        var params = Session.get('op_param_list');
//        console.log(idx,params);
        params[idx].name = name;
        Session.set('op_param_list', params);
    },
    'change .paramtype': function (evt) {
        var idx = $(evt.target).attr('data-index');
        var params = Session.get('op_param_list');
        console.log(idx, params);
        params[idx].type = 'number';
        params[idx].unit = null;
        Session.set('op_param_list', params);
    },
    'click #makenewparambtn': function () {
        var params = Session.get('op_param_list') || [];
        params.push({name: getNewParamName(params), type: 'text', unit: ''})
        Session.set('op_param_list', params);
    },
    'shown.bs.modal #op_info': function(){
        $('#opinfo_name').select();
    },
    'keydown #opinfo_name': function(evt){
        if(evt.keyCode == 13){
            $('#save_op_info').click();
        }
    }
});

Template.op_info.params = function () {
    return _.map(Session.get('op_param_list'), function (param, i) {
        param.index = i;
        return param;
    });
};

Template.op_info.disabled_if_locked = function () {
    return this.locked ? 'disabled' : '';
};

function getNewParamName(params){
    var names = _.map(params,function(p){return p.name;});
    for(var i = 1; i < 1000; i++){
        var n = 'Param ' + i;
        if(!_.contains(names,n)){
            return n;
        }
    }
    return 'Param';
}

//stub: complete this.
var paramTypeDict =
{text: ['text', null], number: ['number', null], uL: ['volume', 'uL'], mL: ['volume', 'mL'], L: ['volume', 'L'], g: ['number', 'g'], mg: ['mass', 'mg'], ug: ['mass', 'ug'], min: ['time', 'min'], hour: ['time', 'hour']
}

Template.op_info.match_paramtype = function (type, unit) {
    //  console.log(this,paramTypeDict[this.id],[type,unit]);
    var d = paramTypeDict[this.id];
    return d ? (d[0] == type && d[1] == unit ? 'selected' : '') : '';
}


Template.op_info.types = function () {
    return [
        {id: 'text', name: "Text"},
        ,
        {id: null, name: '------'}
        ,
        {id: 'number', name: "Number"}
        ,
        {id: 'uL', name: "Volume / uL"}
        ,
        {id: 'mL', name: "Volume / mL"}
        ,
        {id: 'L', name: "Volume / L"}
        ,
        {id: null, name: '------'}
        ,
        {id: 'min', name: "Time / min"}
    ];
};


Template.runop_info.runop = function () {
    var ids = Session.get('runopinfo_for') || {run: null, op: null};
    return getRunOp(ids.op, ids.run) || {};
//    console.log(ids);
}

function getRunOp(opid, runid) {
    var run = ExpRuns.findOne(runid);
    var pop = run ? Operations.findOne(opid) : null;
    var res = {};
    if (run && pop) {
        res.name = pop ? pop.name : null;
        var op = run.ops[opid];
        res.params = op.params;
        res.timestamp = op.timestamp
        res.note = op.note;
        return res;
    } else {
        return null;
    }
}
//
//Template.runop_info.op = function(){
//    var ids = Session.get('runopinfo_for') || {run: null, op: null};
//    return Operations.findOne(ids.op);
//}

Template.runop_info.title = function () {
    var ids = Session.get('runopinfo_for') || {run: null, op: null};
//    console.log(ids);
    var run = ExpRuns.findOne(ids.run);
    var runname = run ? run.name : '';
    var op = Operations.findOne(ids.op);
    var opname = op ? op.name : '';
    return runname + ': ' + opname;
};

Template.runop_info.disabled_if_locked = function () {
    return this.locked ? 'disabled' : '';
};


Template.runop_info.events({
    'click #close_runop_info': function () {
        $('#runop_info').modal('hide');
    },
    'click #save_runop_info': function () {
        var s = $('#runop_datepicker').val() + ' ' + $('#runop_timepicker').val();
        var ids = Session.get('runopinfo_for') || {run: null, op: null};
        var time = moment(s).valueOf();
        if(time){
            setOpTimestamp(ids.run, ids.op, time);
            var note = $('#runop_note').val();
            setRunOpNote(ids.run, ids.op, note);
            $('#runop_info').modal('hide');
        }else{
            window.alert('Time format is invalid.');
        }
    },
    'keydown #runop_timepicker': function(evt){
        console.log(evt);
        if(evt.keyCode == 13){
            $('#save_runop_info').click();
        }
    },
    'hidden.bs.modal #runop_info': function () {
        Session.set('runopinfo_for', null);

//        $('.bootstrap-datetimepicker-widget').hide();
    }
});

Template.runop_info.formatTime = function (v) {
//    console.log(v);
    if (v) {
        var s = moment(v).format("h:m:s A");
//        console.log(s);
        return s;
    } else {
        return moment().format("h:m:s A");
    }
};

Template.runop_info.disabled_if_locked = function () {
    return getCurrentExp().locked ? 'disabled' : '';
};


Template.runop_info.formatDate = function (v) {
    //Use exp's date for new entry.
    return v ? moment(v).format("M/D/YYYY") : moment(getCurrentExp().date).format("M/D/YYYY");
};
//
//var enforceModalFocusFn = $.fn.modal.Constructor.prototype.enforceFocus;
//$.fn.modal.Constructor.prototype.enforceFocus = function() {};
//$.fn.modal.Constructor.prototype.enforceFocus = function() {};
//$('#runop_info').on('hidden', function() {
//    $.fn.modal.Constructor.prototype.enforceFocus = enforceModalFocusFn;
//});

Template.runop_info.rendered = function () {
    var self = this;
//    $("#runop_datepicker").datepicker({ autoSize: true });
   // $('#runop_timepicker').timepicker();

    self.node = self.find("#runop_timepicker");
    if (!self.handle) {
        self.handle = Deps.autorun(function () {
            $("#runop_datepicker").datepicker({ autoSize: true });
//            console.log('rendered');
            var ids = Session.get('runopinfo_for') || {run: null, op: null};
            var runop = getRunOp(ids.op, ids.run);
            var t = runop ? runop.timestamp : null;
//            var ts = t ? moment(new Date(t)).format("h:m:s A") : null;
        });
    }

};

Template.exp.runop_shown = function () {
    return !!Session.get('runopinfo_for');
}

function getSelectedRunSampleCells(){
    var sel = Session.get('exp_sampletable_selection');
    if(sel && sel.from){
        var psample = sel.from.sample;
        var ridxmin = Math.min(sel.from.runidx,sel.to.runidx);
        var ridxmax = Math.max(sel.from.runidx,sel.to.runidx);
        var rids = getExpRuns(getCurrentExpId()).map(function(run){return run._id});
        return _.map(_.range(ridxmin,ridxmax+1),function(ridx){
            var rid = rids[ridx];
            var sample = ExpRuns.findOne(rid).samples[psample];
            return {run: rid, protocol_sample: psample, sample: sample, runidx: ridx};
        });
    }else{
        return [];
    }
}

function newRunSamplesForSelection(useSerialNames) {
    var cells = getSelectedRunSampleCells();
    _.map(cells,function(c){
        var runid = c.run;
        var protocol_sid = c.protocol_sample;
        var protocol_sample = Samples.findOne(protocol_sid);
        console.log(runid, protocol_sid, protocol_sample);
        var name = useSerialNames ? mkSampleName(runid) : protocol_sample.name;
        var sid = newSample(name, protocol_sample.sampletype_id);
        assignSampleInRun(runid, protocol_sid, sid);
    });
}

function mkSampleName(runid){
    var run = ExpRuns.findOne(runid);
    var exp = Experiments.findOne(run.exp);
    var date = moment(exp.date).format('M/D/YY');
    var exists = true;
    var num = 0; // (getExpRunIndex(runid)+1);
    var str;
    do{
        num += 1;
        str = date + '-#' + num;
        exists = Samples.findOne({name: str});
    }while(exists)
    return str;
}