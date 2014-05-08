/**
 * Created with IntelliJ IDEA.
 * User: hiroyuki
 * Date: 4/30/14
 * Time: 5:37 PM
 * To change this template use File | Settings | File Templates.
 */

Template.exp.exp_name = function(){
    var eid = Session.get('current_view_id');
    return Experiments.findOne(eid).name;
};

Template.exp.samples = function() {
    var eid = getCurrentExpId();
    var edges = getEdges(eid);
    //console.log(edges,es);
    var es = _.map(edges,function(edge){
        return [edge.from._id,edge.to._id];
    });
    var sorted = toposort(es);

    var e = Experiments.findOne(eid);
    var sids = e.samples;
    return Samples.find({_id: {$in: sids}}).fetch();
};

Template.exp.protocol_samples = function() {
    var eid = getCurrentExpId();
    var edges = getEdges(eid);
    //console.log(edges,es);
    var es = _.map(edges,function(edge){
        return [edge.from._id,edge.to._id];
    });
    var sorted = toposort(es);

    var e = Experiments.findOne(eid);
    var sids = e.protocol.samples;
    var samples = Samples.find({_id: {$in: sids}}).fetch();
    var res =  _.map(sorted,function(id,i){
        var sample = _.findWhere(samples,{_id: id});
        sample.runs = _.map(e.runs,function(run, i){
            var sid = run.samples[sample._id];
            var s = Samples.findOne(sid);
            return {_id: sid, name: s ? s.name : null, index: i};
        });
        return sample;
    });
    return res;
};

Template.exp.sample_link_in_run = function(){
   return
};

Template.exp.runs = function(){
  return _.map(getCurrentExp().runs,function(run,i){return {name: run.name, index: i}});
};

Template.exp.eid = function(){
    return Session.get('current_view_id');
};

Template.exp.sample_selected = function(){
    return _.contains(Session.get('selected_nodes'),this._id) ? "selected" : '';
};

Template.exp.op_selected = function(){
    return _.contains(Session.get('selected_ops'),this._id) ? "selected" : '';
};

Template.exp.formatTime = function(v){
//    console.log(v);
    var d = new Date(v);
         return ''+d.getHours()+ ':' + d.getMinutes() + "'" + d.getSeconds() + '"';
};

Template.exp.formatDate = function(v){
    var d = new Date(v);
         return ''+(d.getMonth()+1)+ '/' + d.getDate() + '/' + d.getFullYear();
};

Template.exp.all_samples = function(){
    return Samples.find({protocol: false});
};

Template.exp.sampletype = function(){
    var st = SampleTypes.findOne(this.sampletype_id);
    return st ? st.name : '';
};


Template.exp.editing_sample_name = function(){
    return Session.equals('editing_sample_id',this._id);
};

Template.exp.editing_sample_type = function(){
    return Session.equals('editing_sampletype_id',this._id);
};

//Template.define_step.all_samples = function() {
//    return Samples.find({protocol: false});
//};
//
//Template.define_step.input_samples = function(){
//    var ids = Session.get('input_samples');
//    //Include duplicates like the following.
//    return _.map(ids,function(id,i){
//        var obj = SampleTypes.findOne(id);
//        obj.index = i;
//        return obj;
//    });
////    return SampleTypes.find({_id: {$in: ids}});
//};
//
//Template.define_step.output_samples = function(){
//    var ids = Session.get('output_samples');
//    //Include duplicates like the following.
//    return _.map(ids,function(id,i){
//        var obj = Samples.findOne(id);
//        obj.type = SampleTypes.fineOne(obj.sampletype_id);
//        obj.index = i;
//        return obj;
//    });
////    return SampleTypes.find({_id: {$in: ids}});
//};
//
//Template.define_step.rendered = function(){
//    var tags = _.map(SampleTypes.find().fetch(),function(s){
//        return s.name;
//    });
////  $('#outsamplelist').tagit({
////      availableTags: tags,
////      allowDuplicates: true});
//};
//
//
//Template.define_step.events({
//    'change #stepinput': function(evt,tmpl){
//        var id = tmpl.find('#stepinput').value;
//        var ids = Session.get('input_samples');
//        ids.push(id);
//        Session.set('input_samples',ids);
//        tmpl.find('#stepinput').value = null;
//    },
//    'change #stepoutput': function(evt,tmpl){
//        var id = tmpl.find('#stepoutput').value;
//        var ids = Session.get('output_samples');
//        ids.push(id);
//        Session.set('output_samples',ids);
//        tmpl.find('#stepoutput').value = null;
//    },
//    'click #addstepbtn': function(evt,tmpl){
//        var name = tmpl.find('#stepname').value;
//        var v1s = Session.get('input_samples');
//        var v2s = Session.get('output_samples');
//        if(name != '' && v1s.length > 0 && v2s.length > 0){
//            $('#addstep').removeClass('has-error');
//            var ps = Session.get('newstep_params');
//            var op = insertOp(this._id,name,ps);
//            //Stub this is a direct product of v1s and v2s
//            _.map(v1s,function(v1){
//                _.map(v2s,function(v2){
//                    insertArrow(op,v1,v2);
//                });
//            });
//            Session.set('input_samples',[]);
//            Session.set('output_samples',[]);
//            Session.set('newstep_params',[]);
//
//        }else{
//            $('#addstepdiv').addClass('has-error');
//            $("#addstepdiv").stop().css("background-color", "#FFFF9C")
//                .animate({ backgroundColor: "#FFFFFF"}, 1000);
//        }
//    },
//    'click #cancelstepbtn': function(evt,tmpl){
//        Session.set('input_samples',[]);
//        Session.set('output_samples',[]);
//        Session.set('newstep_params',[]);
//        tmpl.find('#paramname').value = '';
//        tmpl.find('#stepname').value = '';
//    },
//    'click .delete_in_sample': function(evt,tmpl){
//        var ids = Session.get('input_samples');
//        var i = evt.target.parentNode.attributes['data-index'].value;
//        ids.splice(i,1);
//        Session.set('input_samples', ids);
//    },
//    'click .delete_out_sample': function(evt,tmpl){
//        var ids = Session.get('output_samples');
//        var i = evt.target.parentNode.attributes['data-index'].value;
//        ids.splice(i,1);
//        Session.set('output_samples', ids);
//    },
//    'change #paramtype': function(evt){
//        Session.set('selected_param_type', evt.target.value);
//    },
//    'click #addparambtn': function(evt,tmpl){
//        var name = tmpl.find('#paramname').value;
//        var type = tmpl.find('#paramtype').value;
//        var unit = tmpl.find('#paramunit').value;
//        var ps = Session.get('newstep_params');
//        ps.push({name: name, type: type, unit: unit});
//        Session.set('newstep_params',ps);
//    }
//});
//
//Template.define_step.units = function(){
//    var t = Session.get('selected_param_type');
//    if(t == 'volume'){
//        return [{name: "&micro;L", value: "uL", selected: 'selected'},
//            {name: "mL", value: "mL"},
//            {name: "L", value: "L"}
//        ];
//    }else if(t == 'mass'){
//        return [{name: "&micro;g", value: "ug"},
//            {name: "mg", value: "mg", selected: 'selected'},
//            {name: "g", value: "g"},
//            {name: "kg", value: "kg"}];
//    }else if(t == 'time'){
//        return [{name: "&micro;s", value: "us"},
//            {name: "ms", value: "ms"},
//            {name: "s", value: "s"},
//            {name: "min", value: "min", selected: 'selected'},
//            {name: "hour", value: "hour"},
//            {name: "day", value: "day"}
//        ];
//    }else {
//        return [];
//    }
//};
//
//Template.define_step.params = function(){
//    return Session.get('newstep_params');
//};

Template.exp.protocol_operations = function(){
    var e = getCurrentExp();
    var opids = e.protocol.operations;

    //A bit ad hoc...
    var ops = sortById(Operations.find({_id: {$in: opids}}).fetch(),opids);
    return _.map(ops,function(op,i){
        op.index = i+1;
        op.runs = _.map(e.runs,function(r){
            var rop = r.operations[op._id];
            return rop;
        });
        return op;
    });
};

Template.exp.step_input = function(){
    var op = Operations.findOne(this._id);
    if(op && op.input)
        return Samples.find({_id: {$in: op.input}, protocol: true});
    else
        return [];
};

Template.exp.step_output = function(){
    var op = Operations.findOne(this._id);
    if(op && op.output)
        return Samples.find({_id: {$in: op.output}, protocol: true});
    else
        return [];
};


Template.d3graph.twonodes_edit_disabled = function(){
    return (Session.get('selected_nodes').length == 2) ? '' : 'disabled';
};

Template.d3graph.onenode_edit_disabled = function(){
    return (Session.get('selected_nodes').length == 1) ? '' : 'disabled';
};

Template.d3graph.oneedge_edit_disabled = function(){
    return (Session.get('selected_edges').length == 1) ? '' : 'disabled';
};

Template.exp.events({
    'mousedown .stepdelete': function(e){
        var eid = Session.get('current_view_id');
        Operations.remove(this._id);
    },
    'click #deselect': function(){
        Session.set('selected_nodes',[]);
    },
    'click #insertnodebeforebtn': function(evt,tmpl){
        var name = tmpl.find('#newnodename').value;
        var to = tmpl.find('circle.selected').attributes['data-sample-id'].value;
        if(name && name != "" && to){
            var from = insertSampleType(name);
            var op = insertOp(this._id,name);
            insertArrow(op,from,to);
            Arrows.update({owner: Meteor.userId(), to: to},{$set: {to: from}});
        }
    },
    'click #connectnodesbtn': function(evt,tmpl){
        var name = tmpl.find('#newnodename').value;
        var to = tmpl.find('circle.selected').attributes['data-sample-id'].value;
        if(name && name != "" && to){
            // console.log(toname);
            var from = insertSampleType(name);
            var op = insertOp(this._id, name);
//            var to = SampleTypes.findOne({name: toname})._id // stub
            //     console.log(name,from,to,toname,op);
            insertArrow(op,from,to);
            Arrows.update({owner: Meteor.userId(), to: to},{$set: {to: from}});
        }
    },
    'change #exp_datepicker': function(evt){
        var date = new Date(evt.target.value);
        Experiments.update(getCurrentExpId(), {$set: {date: date.getTime()}});
    },
    'click .step_sample_list': function(){
   //     Router.go('sample',{_id: this._id});
    },
    'click #addsteplink': function(){
        var b = Session.get('visible_addstepdiv');
        Session.set('visible_addstepdiv',!b);
//        $('#addstepexpand').text('-');
    },
    'click .sample_name': function(evt,tmpl){
//        Session.set('editing_sample_id',this._id);
//        Deps.flush(); // force DOM redraw, so we can focus the edit field
//        activateInput(tmpl.find("#samplename_edit_input"));

   //     var html = mkHtmlForSampleChooser(sid);
     //   $('#protocol_sample_info').html(html);
        Session.set('protocol_sampleinfo_for',this._id);
        $('#protocol_sample_info').modal();
    },
    'click .sampleedit': function(evt,tmpl){
        Session.set('editing_sampletype_id',this._id);
        Deps.flush(); // force DOM redraw, so we can focus the edit field
    },
    'click .sampledelete': function(evt,tmpl){
        removeOpsAboutSample(getCurrentExpId(),this._id);
        Samples.remove(this._id);
    },
    'click #deleteexp': function(){
        var eid = Session.get('current_view_id');
        if(window.confirm('Are you sure you want to delete this exp?')){
            Experiments.remove(eid);
            Router.go('exp');
        }
    },
    'click .sampletype a': function(){
        Router.go('type',{_id: this.sampletype_id});
    },
    'dblclick #exptitle': function(evt,tmpl){
        Session.set('editing_exp_title',true);
        Deps.flush(); // force DOM redraw, so we can focus the edit field
        activateInput(tmpl.find("#exptitle_input"));
    },
    'change #sampletype_select': function(evt,tmpl){
        var st = evt.target.value;
        console.log(st);
        Samples.update(this._id, {$set: {sampletype_id: st}});
        Session.set('editing_sampletype_id',null);
    },
    'click .entertime': function(evt,tmpl){
        var e = $(evt.target);
        var ee = e.prop('tagName') == 'BUTTON' ? e : e.parent('button');
        var opid = ee.attr('data-operation');
       // console.log(opid,this.index);
        var eid = getCurrentExpId();
        var exp = getCurrentExp();
        var runidx = parseInt(ee.attr('data-runidx'));
        setOpTimestamp(exp,runidx,opid,new Date().getTime());
    },
    'click .timepoint':function(evt){
        if(evt.altKey){
            var e = $(evt.target);
            var opid = e.attr('data-operation');
            var runidx = parseInt(e.attr('data-runidx'));
            setOpTimestamp(getCurrentExp(),runidx,opid,null);
        }
    },
    'change #sample_shown': function(evt){
        var obj = Session.get('info_shown');
        obj.sample = evt.target.checked;
        Session.set('info_shown',obj);
    },
    'change #step_shown': function(evt){
        var obj = Session.get('info_shown');
        obj.step = evt.target.checked;
        Session.set('info_shown',obj);
    },
    'change #sheet_shown': function(evt){
        var obj = Session.get('info_shown');
        obj.sheet = evt.target.checked;
        Session.set('info_shown',obj);
    },
    'click #addrunbtn': function(evt){
        addNewRunToExp(getCurrentExpId());
    },
    'click .deleterunbtn': function(evt){
        var e = getCurrentExp();
        var eid = e._id;
        var runs = e.runs;
        var idx = this.index;
        runs.splice(idx,1);
        Experiments.update(eid,{$set: {runs: runs}});
    },
    'click .assignsamplebtn': function(evt){
        var e = $(evt.target);
        var ee = e.prop('tagName') == 'BUTTON' ? e : e.parent('button');
        console.log(ee,ee.attr('data-runidx'), ee.attr('data-sample'));
        //evt.target.attributes['data-runidx'].value
        var sid = ee.attr('data-sample');
        Session.set('choosing_sample_for',{run: ee.attr('data-runidx'), sample: sid});
        var html = mkHtmlForSampleChooser(sid);
        $('#sample_chooser_samples').html(html);
        $('#sample_chooser').modal();
    },
    'click .makenewsamplebtn': function(evt){
        var e = $(evt.target);
        var ee = e.prop('tagName') == 'BUTTON' ? e : e.parent('button');
       // console.log(ee,ee.attr('data-runidx'), ee.attr('data-sample'));
        var eid = getCurrentExpId();
        var runidx = parseInt(ee.attr('data-runidx'));
        var protocol_sid = ee.attr('data-sample');
        var protocol_sample = Samples.findOne(protocol_sid);
        var sid = newSample(protocol_sample.name+"-"+(runidx+1),protocol_sample.sampletype_id);
        assignSampleInRun(eid,runidx,protocol_sid,sid);

    },
    'click .choose_sample': function(evt){
        var sid = $(evt.target).attr('data-id');
        var eid = getCurrentExpId();
        var obj = Session.get('choosing_sample_for');
        assignSampleInRun(eid,obj.run,obj.sample,sid);
        $('#sample_chooser').modal('hide');
    },
    'click .sampleinrun': function(evt){
        var e = $(evt.target);
        var ee = e.prop('tagName') == 'TD' ? e : e.parent('td');
        console.log(ee,ee.attr('data-runidx'), ee.attr('data-sample'));
        var currentid = ee.attr('data-samplerun');
        if(evt.altKey){
            removeSampleInRun(getCurrentExpId(),ee.attr('data-runidx'),ee.attr('data-sample'),currentid);
        }else{
            Session.set('sampleinfo_for',currentid);
            $('#sample_info').modal();
        }
    },
    'click #saveexp': function(evt){
        var msg = 'Saving the experiment will dump the data as a file as well as send the log to the set email address.';
        if(window.confirm(msg)){
        dumpExperiment();
//            var user = Session.get('currentUser');
//            Meteor.call('sendEmail',
//                user.email,
//                        user.email,
//                'E-Lab notebook dump on '+ formatDate(new Date()),
//                        json);
        }
    },
    'click .step_table_name': function(){
        Session.set('opinfo_for',this._id);
        var params = Operations.findOne(this._id).params;
        Session.set('op_param_list',params);
        $('#op_info').modal();
    }
});

Template.exp.assignsample_possible = function(sid){
    var e = getCurrentExp();
    var ops = Operations.find({_id: {$in: e.protocol.operations}}).fetch();
    var outs = _.flatten(_.map(ops,function(op){return op.output;}));
    return !_.contains(outs,sid);
};

Template.exp.editing_title = function(){
    return  Session.get('editing_exp_title');

};

Template.exp.events(okCancelEvents(
    '#exptitle_input',
    {
        ok: function (value) {
            var eid = Session.get('current_view_id');
            Experiments.update(eid,{$set: {name: value}});
            Session.set('editing_exp_title',false);
        },
        cancel: function () {
            Session.set('editing_exp_title',false);
        }
    }));

Template.exp.all_sampletypes = function(){
    return SampleTypes.find();
}

Template.exp.events(okCancelEvents(
    '#samplename_edit_input',
    {
        ok: function (value) {
            var id = Session.get('editing_sample_id');
            Samples.update(id,{$set: {name: value}});
            Session.set('editing_sample_id', null);
        },
        cancel: function () {
            Session.set('editing_sample_id', null);
        }
    }));

Template.exp.addstephidden = function(){

    return !Session.get('visible_addstepdiv');
};

Template.exp.info_active = function(name) {
  return Session.get('info_shown')[name];
};

Template.exp.date = function(){
    var eid = Session.get('current_view_id');
    var e = Experiments.findOne(eid);
    var d = e ? e.date : null;
    return d ? formatDate(new Date(d)) : null;
};

Template.exp.rendered = function () {
    $( "#exp_datepicker" ).datepicker({ autoSize: true });
    var self = this;
    self.node = self.find("svg");
    if (!self.handle) {
        self.handle = Deps.autorun(function () {
            var eid = getCurrentExpId();
            renderCells(eid);
        });
    }
};


function mkHtmlForSampleChooser(sid){
    var stid = Samples.findOne(sid).sampletype_id;
    var samples = Samples.find({sampletype_id: stid, protocol: false}).fetch();
    return _.map(samples,function(s){
        return "<tr class='chooser_tr'>"+"<td class='name'>" + s.name + "</td>"
        + "<td class='expmade'>" + formatDate(new Date(s.timestamp)) + "</td>"
        + "<td class='choose_sample' data-id='"+ s._id+"'>Choose</td></tr>";
    }).join('\n');
}


function dumpExperiment(){
    Meteor.call('dumpExperiment',Meteor.userId(),getCurrentExpId(),function(err,path){
        window.open(path);
    });
}

Template.sample_info.sample = function(){
    return Samples.findOne(Session.get('sampleinfo_for'));
};

Template.sample_info.time_recorded = function(){
    return formatDateTime(this.timestamp);
};

Template.sample_info.type = function(){
    var stid = this.sampletype_id;
    return SampleTypes.findOne(stid);
};

Template.sample_info.time_made = function(){
    return formatDateTime(this.timestamp);
};

Template.exp.runs_time = function(){
    console.log(this);
    var opid = this._id;
    var eid = getCurrentExpId();
    var runs = Experiments.findOne(eid).runs;
  return _.map(runs,function(run,i){
   //   console.log(run,i);
      var op = run ? run.operations[opid] : null;
      return op ? {timestamp: op.timestamp, index: i} : {};
  });
};

Template.sample_info.events({
    'click #sample_info_type': function(evt){
       $('#sample_info').modal("hide");
        $('#sample_info_type').attr('data-jumping','1');
   //     Router.go("type",{_id: $(evt.target).attr('data-sampletype')});
    },
    'hidden.bs.modal #sample_info': function(evt){
        if($('#sample_info_type').attr('data-jumping')){
                   Router.go("type",{_id: $('#sample_info_type').attr('data-sampletype')});
        }else if($('#seesampledetailbtn').attr('data-jumping')){
            Router.go("sample",{_id: $('#seesampledetailbtn').attr('data-sample')});
        }
    },
    'click #close_sample_info': function(){
        Session.set('sampleinfo_for',null);
    },
    'click #save_sample_info': function(evt){
        var name = $('#sampleinfo_name').val();
        var note = $('#sample_note').val();
        var sid = Session.get('sampleinfo_for');
        console.log(sid);
        Samples.update(sid,{$set: {name: name, note: note}});
        $('#sample_info').modal('hide');
        Session.set('sampleinfo_for',null);
    },
    'shown.bs.modal #sample_info': function(){
        activateInput($('#sampleinfo_name'));
    },
    'keydown #sampleinfo_name': function(evt){
        if(evt.keyCode == 13){
            $('#save_sample_info').click();
        }
    },
    'click #seesampledetailbtn': function(){
        $('#sample_info').modal("hide");
         $('#seesampledetailbtn').attr('data-jumping','1');
    },

    'click #close_psample_info': function(){
        Session.set('protocol_sampleinfo_for',null);
    },
    'click #save_psample_info': function(evt){
        var name = $('#psampleinfo_name').val();
        var note = $('#psample_note').val();
        var type = $('#psample_info_type').val();
        var sid = Session.get('protocol_sampleinfo_for');
        var s = Samples.findOne(sid);
        if(s.sampletype_id == type || getRunSamplesOf(getCurrentExp(),sid).length == 0){
            Samples.update(sid,{$set: {name: name, note: note, sampletype_id: type}});
            $('#protocol_sample_info').modal('hide');
            Session.set('protocol_sampleinfo_for',null);
        }else{
            var msg = 'There are already associated run samples with this step. '
                + 'Changing the sample type may break consistentcy of exp data. '
                + 'Are you sure you want to change the sample type?';
            if(window.confirm(msg)){
                Samples.update(sid,{$set: {name: name, note: note, sampletype_id: type}});
                $('#protocol_sample_info').modal('hide');
                Session.set('protocol_sampleinfo_for',null);
            }else{

            }
        }
    },
    'keydown #psampleinfo_name': function(evt){
        if(evt.keyCode == 13){
            $('#save_psample_info').click();
        }
    }
});

Template.sample_info.protocol_sample = function(){
    return Samples.findOne(Session.get('protocol_sampleinfo_for'));
};

Template.sample_info.alltypes = function(){
    return SampleTypes.find();
};

Template.sample_info.type_selected = function(tid){
    return this._id == tid ? 'selected' : '';
};

Template.op_info.operation = function(){
    var opid = Session.get('opinfo_for');
    var op = Operations.findOne(opid);
    console.log(op);
    return op;
};

Template.op_info.sample = function(sid){
    return Samples.findOne(sid);
};

function getParamsFromModal(){
    var params = Session.get('op_param_list');
    return params;
}

function paramsEqual(oldparams,newparams){
   // console.log(oldparams,newparams);
    if(oldparams.length != newparams.length){
        return false;
    }
        _.each(_.zip(oldparams,newparams),function(ps){
            if(ps[0] != ps[1]) return false;
        });
    return true;
}

function doUpdateOp(){
    var opid = Session.get('opinfo_for');
    var params = Session.get('op_param_list');
    var note = $('#op_note').val();
    console.log(opid,params,note);
    params = _.filter(params,function(p){return p.name != ''});
    if(_.uniq(_.map(params,function(p){return p.name;})).length == params.length){
        var name = $('#opinfo_name').val();
        Operations.update(opid,{$set: {'params': params, name: name, note: note}});
        $('#op_info').modal('hide');
        Session.set('opinfo_for',null);
        Session.set('op_param_list',[]);
    }else{
        window.alert('Params have to have unique names.');
    }
}

Template.op_info.events({
    'click #close_op_info': function(){
        Session.set('opinfo_for',null);
        Session.set('op_param_list',[]);
    },
    'click #save_op_info': function(evt){
        var name = $('#opinfo_name').val();
        var note = $('#op_note').val();
        var params = getParamsFromModal();
        var opid = Session.get('opinfo_for');
        console.log(name,opid);
        if(name && opid){
            var op = Operations.findOne(opid);
            if(paramsEqual(op.params,params) || getRunOpsOf(getCurrentExp(),opid).length == 0){
                doUpdateOp();
                console.log('Done op update');
            }else{
                var msg = 'There are already associated run operations with this step. '
                    + 'Changing the operation parameters may break consistentcy of exp data. '
                    + 'Are you sure you want to change them?';
                if(window.confirm(msg)){
                    doUpdateOp();
                }else{

                }
            }
        }else{
            console.log('Missing parameters.');
        }
    },
    'change .paramname': function(evt){
        var name = $(evt.target).val();
        var idx = parseInt($(evt.target).attr('data-index'));
        var params = Session.get('op_param_list');
//        console.log(idx,params);
            params[idx].name = name;
        Session.set('op_param_list',params);
    },
    'change .paramtype': function(evt){
        var idx = $(evt.target).attr('data-index');
        var params = Session.get('op_param_list');
        console.log(idx,params);
        params[idx].type = 'number';
        params[idx].unit = null;
        Session.set('op_param_list',params);
    },
    'click #makenewparambtn': function(){
        var params = Session.get('op_param_list') || [];
        params.push({name: 'Param '+(params.length+1), type: 'text', unit: ''})
        Session.set('op_param_list',params);
    }
});

Template.op_info.params = function(){
    return _.map(Session.get('op_param_list'),function(param,i){
        param.index = i;
        return param;
    });
};

//stub: complete this.
var paramTypeDict =
    {text: ['text',null]
    , number: ['number',null]

    , uL: ['volume','uL']
    , mL: ['volume','mL']
    , L: ['volume','L']

    , g: ['number','g']
    , mg: ['mass','mg']
    , ug: ['mass','ug']

    , min: ['time','min']
    , hour: ['time','hour']
    }

Template.op_info.match_paramtype = function(type,unit){
  //  console.log(this,paramTypeDict[this.id],[type,unit]);
    var d = paramTypeDict[this.id];
    return d ? (d[0] == type && d[1] == unit ? 'selected' : '') : '';
}
//
//Template.op_info.units = function(){
//    var t = Session.get('selected_param_type');
//    if(t == 'volume'){
//        return [{name: "&micro;L", value: "uL", selected: 'selected'},
//            {name: "mL", value: "mL"},
//            {name: "L", value: "L"}
//        ];
//    }else if(t == 'mass'){
//        return [{name: "&micro;g", value: "ug"},
//            {name: "mg", value: "mg", selected: 'selected'},
//            {name: "g", value: "g"},
//            {name: "kg", value: "kg"}];
//    }else if(t == 'time'){
//        return [{name: "&micro;s", value: "us"},
//            {name: "ms", value: "ms"},
//            {name: "s", value: "s"},
//            {name: "min", value: "min", selected: 'selected'},
//            {name: "hour", value: "hour"},
//            {name: "day", value: "day"}
//        ];
//    }else {
//        return [];
//    }
//};

Template.op_info.types = function(){
    return [{id: 'text', name: "Text"},
        , {id: null, name: '------'}
        , {id: 'number', name: "Number"}
        , {id: 'uL', name: "Volume / uL"}
        , {id: 'mL', name: "Volume / mL"}
        , {id: 'L', name: "Volume / L"}
        , {id: null, name: '------'}
        , {id: 'min', name: "Time / min"}
    ];
};

