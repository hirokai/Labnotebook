Meteor.startup(function(){

// Define Minimongo collections to match server/publish.js.
Presets = new Meteor.Collection("presets");
Experiments = new Meteor.Collection("experiments");
ExpRuns  = new Meteor.Collection("expruns");
SampleTypes = new Meteor.Collection("sampletypes");
TypeClasses = new Meteor.Collection("typeclasses");
Dates = new Meteor.Collection("dates");
Operations = new Meteor.Collection("operations");
//SampleGroups = new Meteor.Collection("samplegroups");
Logs = new Meteor.Collection("logs");

//Arrows = new Meteor.Collection("arrows");

Samples = new Meteor.Collection('samples');

Config = new Meteor.Collection("config");

//    attachmentStore = new FS.Store.GridFS("attachments", {
//        //     mongoUrl: 'mongodb://127.0.0.1:27017/test/', // optional, defaults to Meteor's local MongoDB
//        //  mongoOptions: {...},  // optional, see note below
//        //  transformWrite: myTransformWriteFunction, //optional
//        //  transformRead: myTransformReadFunction, //optional
//        //  maxTries: 1, // optional, default 5
//        //  chunkSize: 1024*1024  // optional, default GridFS chunk size in bytes (can be overridden per file).
//// Default: 2MB. Reasonable range: 512KB - 4MB
//    });
//
//    AttachmentsFS = new FS.Collection("attachments", {
//        stores: [attachmentStore]
//    });


    Session.setDefault('list_type','exp');
Session.setDefault('current_view_id',{exp: null, sample: null, sampletype:null,multiexp: null,date: null,log:null});
Session.setDefault('list_sortby',{exp: 'date',sample: 'date',sampletype: 'hierarchy', multiexp: 'date'});

// Name of currently selected tag for filtering
Session.setDefault('tag_filter', null);

// When adding tag to a todo, ID of the todo
Session.setDefault('editing_addtag', null);

// When editing a list name, ID of the list
Session.setDefault('editing_listname', null);

// When editing todo text, ID of the todo
Session.setDefault('editing_itemname', null);

Session.setDefault('input_samples', []);
Session.setDefault('output_samples', []);
Session.setDefault('selected_param_type',null);
Session.setDefault('newstep_params',[]);

Session.setDefault('op_param_list',[]);

//D3 graph
Session.setDefault('selected_nodes',[]);
Session.setDefault('selected_edges',[]);
Session.setDefault('selected_ops',[]);

Session.setDefault('visible_addstepdiv',false);

//Exp info
Session.setDefault('editing_sample_id',null);
Session.setDefault('editing_sampletype_id',null);

Session.setDefault('choosing_sample_for',{run: null, sample: null})


Session.setDefault('info_shown',{sample: true, step: true, sheet: true});

Session.setDefault('editing_sample_title',false);

//Reset every time reloaded.
Session.set('editing_node_in_graph',null);

// Subscribe to 'lists' collection on startup.
// Select a list once data has arrived.
listsHandle = Meteor.subscribe('lists', function () {
  if (!Session.get('list_id')) {
    var list = Lists.findOne({}, {sort: {name: 1}});
  //  if (list)
    //  Router.setList(list._id);
  }
});

////presetsHandle = Meteor.subscribe('presets');
//experimentsHandle = Meteor.subscribe('experiments');
//
//all_exprunsHandle = Meteor.subscribe('all-expruns');
//
////datesHandle = Meteor.subscribe('dates');
//sampletypesHandle = Meteor.subscribe('sampletypes');
//typeclassesHandle = Meteor.subscribe('typeclasses');
//
////all_operationsHandle = Meteor.subscribe('operations');
//
//
////samplegroupsHandle = Meteor.subscribe('samplegroups');
////var arrowsHandle = Meteor.subscribe('arrows');
//samplesHandle = Meteor.subscribe('samples');
configHandle = Meteor.subscribe('config');

//attachmentsHandle = Meteor.subscribe('attachments');

});


//logsHandle = Meteor.subscribe('logs','all');

////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".



function renderDate(ts){
//    console.log(ts);
    var t = new Date(ts);
    return ""+ (t.getMonth()+1)+"/"+ t.getDate();
}

////////// Lists //////////

Template.lists.loading = function () {
  return !listsHandle.ready();
};


Template.lists.events({
    'click .listmenu':function(evt){
        var p = {};
        var t = $(evt.target).attr('data-value');
        var ids = Session.get('current_view_id');
        if(t == 'exp'){
            p = ids.exp ? {_id: ids.exp} : null;
        }else if(t == 'sample'){
            p = ids.sample ? {_id: ids.sample} : null;
        }else if(t == 'type'){
            p = ids.sampletype ? {_id: ids.sampletype} : null;
        }else if(t == 'log'){
            p = ids.log ? {date: ids.log} : null;
        }else if(t == 'date'){
            p = ids.date ? {_id: ids.date} : null;
        }else if(t == 'multiexp'){
            p = ids.multiexp ? {_id: ids.multiexp} : null;
        }
      //  console.log(t,p);
        Router.go(t,p);
    }
});

// Attach events to keydown, keyup, and blur on "New list" input box.
Template.lists.events(okCancelEvents(
  '#new-list',
  {
    ok: function (text, evt) {
      var id = Lists.insert({name: text});
      Router.setList(id);
      evt.target.value = "";
    }
  }));

Template.lists.events(okCancelEvents(
  '#list-name-input',
  {
    ok: function (value) {
      Lists.update(this._id, {$set: {name: value}});
      Session.set('editing_listname', null);
    },
    cancel: function () {
      Session.set('editing_listname', null);
    }
  }));

Template.lists.selected = function () {
  return Session.equals('list_id', this._id) ? 'selected' : '';
};

Template.lists.type = function() {
    return Session.get("list_type");
};

Template.lists.name_class = function () {
  return this.name ? '' : 'empty';
};

Template.lists.editing = function () {
  return Session.equals('editing_listname', this._id);
};


////////// Tracking selected list in URL //////////


//Router = new TodosRouter;

Meteor.startup(function () {
    $.ready(function(){
        $('#datepicker').datePicker();
    });
    Hooks.init();
});


var timer;

showMessage = function(msg){
    var el = $('#message');
    el.removeClass('hidden');
    el.html(msg);
    timer = null;
    timer = window.setTimeout(function(){
        el.addClass('hidden');
    },3000);
};

Hooks.onLoggedIn = function () {
    Meteor.call('currentUser',function(err,user){
        showMessage('Welcome, '+user.first_name+'!');
        Session.set('currentUser',user);
    });
};

Hooks.onLoggedOut = function () {
    Router.go('exp');
    showMessage('Logged out.');
    Meteor.call('currentUser',function(err,user){
        Session.set('currentUser',user);
    });
};

Template.googleAnalytics.rendered = function() {

    var self = this;
    self.node = self.find("#analyticsstub");
    if (!self.handle) {
        self.handle = Deps.autorun(function () {
            new GA('UA-50868581-1');
        });
    }
}

GA = function(code) {
    var _gaq = window._gaq || [];
    _gaq.push(['_setAccount', code]);
    _gaq.push(['_trackPageview']);
    (function() {
        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
    })();
};
