Meteor.startup(function(){

// Define Minimongo collections to match server/publish.js.
Presets = new Meteor.Collection("presets");
Experiments = new Meteor.Collection("experiments");
ExpRuns  = new Meteor.Collection("expruns");
SampleTypes = new Meteor.Collection("sampletypes");
TypeClasses = new Meteor.Collection("typeclasses");
Dates = new Meteor.Collection("dates");
Operations = new Meteor.Collection("operations");
SampleGroups = new Meteor.Collection("samplegroups");

//Arrows = new Meteor.Collection("arrows");

Samples = new Meteor.Collection('samples');

Session.setDefault('list_type','exp');

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
});


// Subscribe to 'lists' collection on startup.
// Select a list once data has arrived.
listsHandle = Meteor.subscribe('lists', function () {
  if (!Session.get('list_id')) {
    var list = Lists.findOne({}, {sort: {name: 1}});
  //  if (list)
    //  Router.setList(list._id);
  }
});

//presetsHandle = Meteor.subscribe('presets');
experimentsHandle = Meteor.subscribe('experiments');
exprunsHandle = Meteor.subscribe('expruns');
//datesHandle = Meteor.subscribe('dates');
sampletypesHandle = Meteor.subscribe('sampletypes');
typeclassesHandle = Meteor.subscribe('typeclasses');
operationsHandle = Meteor.subscribe('operations');
samplegroupsHandle = Meteor.subscribe('samplegroups');
//var arrowsHandle = Meteor.subscribe('arrows');
samplesHandle = Meteor.subscribe('samples');

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
        //console.log($(evt.target));
        Router.go($(evt.target).attr('data-value'));
//            Router.go($(evt.target).attr('data-value')+"empty");
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



Template.top_bar.userId = function(){
    return Meteor.userId();
};

Template.top_bar.user = function(){
    //console.log(Meteor.user());
    Meteor.call('currentUser',function(err,user){
        Session.set('currentUser',user);
    });
    return Session.get('currentUser');
};

Template.top_bar.loggedin = function(){
    //console.log(Meteor.user());
    Meteor.call('currentUser',function(err,user){
        Session.set('currentUser',user);
    });
    return Session.get('currentUser') != null;
};

Template.top_bar.events({
   'click #resetdb': function(){
       if(window.confirm('Are you sure you want to reset your data?')){
           Meteor.call('resetMyDB');
       }
   }
});

////////// Tracking selected list in URL //////////


//Router = new TodosRouter;

Meteor.startup(function () {
    $.ready(function(){
        $('#datepicker').datePicker();
    })
});

$(function(){
$('#grouping_select').on('change',function(){
    Session.set('list_type',this.value);
    Router.go(this.value)
});

});
