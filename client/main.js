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


Session.setDefault('info_shown',{sample: false, step: true, sheet: true});

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
//
//  'change #grouping_select': function(evt){
//      console.log(evt,this);
//    Router.go(evt.target.value+"empty");
//  },
    'click .listmenu':function(evt){
        //console.log($(evt.target));
        Router.go($(evt.target).attr('data-value'));
//            Router.go($(evt.target).attr('data-value')+"empty");
    },
  'dblclick .list': function (evt, tmpl) { // start editing list name
    Session.set('editing_listname', this._id);
    Deps.flush(); // force DOM redraw, so we can focus the edit field
    activateInput(tmpl.find("#list-name-input"));
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

////////// Todos //////////

Template.todos.loading = function () {
  return todosHandle && !todosHandle.ready();
};

Template.todos.any_list_selected = function () {
  return !Session.equals('list_id', null);
};

Template.todos.events(okCancelEvents(
  '#new-todo',
  {
    ok: function (text, evt) {
      var tag = Session.get('tag_filter');
      Todos.insert({
        text: text,
        list_id: Session.get('list_id'),
        done: false,
        timestamp: (new Date()).getTime(),
        tags: tag ? [tag] : []
      });
      evt.target.value = '';
    }
  }));

Template.todos.todos = function () {
  // Determine which todos to display in main pane,
  // selected based on list_id and tag_filter.

  var list_id = Session.get('list_id');
  if (!list_id)
    return {};

  var sel = {list_id: list_id};
  var tag_filter = Session.get('tag_filter');
  if (tag_filter)
    sel.tags = tag_filter;

  return Todos.find(sel, {sort: {timestamp: 1}});
};
//
//Template.todos.presets = function(){
//	console.log(Presets.find().fetch());
//	return Presets.find();
//}
//
//Template.todo_item.tag_objs = function () {
//  var todo_id = this._id;
//  return _.map(this.tags || [], function (tag) {
//    return {todo_id: todo_id, tag: tag};
//  });
//};
//
//Template.todo_item.done_class = function () {
//  return this.done ? 'done' : '';
//};
//
//Template.todo_item.editing = function () {
//  return Session.equals('editing_itemname', this._id);
//};
//
//Template.todo_item.adding_tag = function () {
//  return Session.equals('editing_addtag', this._id);
//};
//
//Template.todo_item.time_formatted = function() {
//	var t = new Date(this.timestamp);
//	return ""+(t.getMonth()+1)+"/"+t.getDate()+"/"+t.getFullYear()+" "+t.getHours()+":"+t.getMinutes();
//}
//
//Template.todo_item.events({
//  'click .check': function () {
//    Todos.update(this._id, {$set: {done: !this.done}});
//  },
//
//  'click .destroy': function () {
//    Todos.remove(this._id);
//  },
//
//  'click .addtag': function (evt, tmpl) {
//    Session.set('editing_addtag', this._id);
//    Deps.flush(); // update DOM before focus
//    activateInput(tmpl.find("#edittag-input"));
//  },
//
//  'dblclick .display .todo-text': function (evt, tmpl) {
//    Session.set('editing_itemname', this._id);
//    Deps.flush(); // update DOM before focus
//    activateInput(tmpl.find("#todo-input"));
//  },
//
//  'click .remove': function (evt) {
//    var tag = this.tag;
//    var id = this.todo_id;
//
//    evt.target.parentNode.style.opacity = 0;
//    // wait for CSS animation to finish
//    Meteor.setTimeout(function () {
//      Todos.update({_id: id}, {$pull: {tags: tag}});
//    }, 300);
//  }
//});
//
//Template.todo_item.events(okCancelEvents(
//  '#todo-input',
//  {
//    ok: function (value) {
//      Todos.update(this._id, {$set: {text: value}});
//      Session.set('editing_itemname', null);
//    },
//    cancel: function () {
//      Session.set('editing_itemname', null);
//    }
//  }));
//
//Template.todo_item.events(okCancelEvents(
//  '#edittag-input',
//  {
//    ok: function (value) {
//      Todos.update(this._id, {$addToSet: {tags: value}});
//      Session.set('editing_addtag', null);
//    },
//    cancel: function () {
//      Session.set('editing_addtag', null);
//    }
//  }));

////////// Tag Filter //////////

// Pick out the unique tags from all todos in current list.
Template.tag_filter.tags = function () {
  var tag_infos = [];
  var total_count = 0;

  Todos.find({list_id: Session.get('list_id')}).forEach(function (todo) {
    _.each(todo.tags, function (tag) {
      var tag_info = _.find(tag_infos, function (x) { return x.tag === tag; });
      if (! tag_info)
        tag_infos.push({tag: tag, count: 1});
      else
        tag_info.count++;
    });
    total_count++;
  });

  tag_infos = _.sortBy(tag_infos, function (x) { return x.tag; });
  tag_infos.unshift({tag: null, count: total_count});

  return tag_infos;
};

Template.tag_filter.tag_text = function () {
  return this.tag || "All items";
};

Template.tag_filter.selected = function () {
  return Session.equals('tag_filter', this.tag) ? 'selected' : '';
};

Template.tag_filter.events({
  'mousedown .tag': function () {
    if (Session.equals('tag_filter', this.tag))
      Session.set('tag_filter', null);
    else
      Session.set('tag_filter', this.tag);
  }
});

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
