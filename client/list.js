Template.lists.group_selected = function(type) {
    return Session.equals("list_type",type) ? "selected" : "";
};

Template.exp_list.lists = function(){
//    console.log(experimentsHandle.ready());
    if(!experimentsHandle.ready()){
        return [{name: 'hoge'}];
    }else{
        var exps = Experiments.find({},{sort: {date: -1}}).fetch();
//        console.log(exps);
        return exps;
    }
    return Experiments.find();
};

Template.exp_list.selected = function() {
    return Session.equals('current_view_id', this._id) ? "selected" : "";
};

Template.exp_list.events({
   'mousedown .list-name': function(evt){
       Router.go('exp',{_id: this._id});
   }
});

Template.exp_list.events(okCancelEvents(
  '#new-exp',
  {
    ok: function (text, evt) {
      var id = insertExp(text);
      Router.go('exp',{_id: id});
      evt.target.value = "";
    }
  }));

Template.exp_list.events(
    {'click #newexpbtn': function(){
        var id = insertExp('Experiment '+formatDate(new Date()));
        Router.go('exp',{_id: id});
    }
    }
);

Template.sample_list.lists = function(){
    var samples = Samples.find({protocol: false},{sort: {timestamp: 1}}).fetch();
    return _.map(samples,function(s,i){
      //  console.log(s);
        s.index = i;
        return s;
    });
};

Template.sample_list.selected = function(id) {
    return Session.equals('current_view_id', this._id) ? "selected" : "";
};

Template.sample_list.events({
   'mousedown .list-name': function(evt){
       Router.go('sample',{_id: this._id});
   }
});

Template.sample_list.events(okCancelEvents(
  '#new-sample',
  {
    ok: function (text, evt) {
      var id = newSample(text);
      Router.go('sample',{_id: id});
      evt.target.value = "";
    }
  }));

Template.type_list.events({
    'mousedown .list-name': function(evt){
        Router.go('type',{_id: this._id});
    }
});

Template.type_list.lists = function(){
    return SampleTypes.find();
};


Template.type_list.events(okCancelEvents(
  '#new-sample-type',
  {
    ok: function (text, evt) {
      var id = insertSampleType(text);
      Router.go('type',{_id: id});
      evt.target.value = "";
    }
  }));

Template.type_list.selected = function(id) {
    return Session.equals('current_view_id', this._id) ? "selected" : "";
};


Template.date_list.lists = function(){
    return Dates.find();
};


Template.date_list.selected = function(id) {
    return Session.equals('current_view_id', this._id) ? "selected" : "";
};

Template.date_list.events({
   'mousedown .list-name': function(evt){
       Router.go('exp',{_id: this._id});
   }
});


Template.layout.selected_id = function(){
    return Session.get('current_view_id') || "N/A";
};

Template.layout.title = function(){
    var type = Session.get('list_type');
    var id = Session.get('current_view_id');
    if(id){
        var str,name;
        if(type == 'exp'){
            str = "Experiment";
            var e = Experiments.findOne(id);
            name = e ? e.name : "";
        }else if(type == 'sample'){
            str = "Sample";
            var e = Samples.findOne(id);
            name = e ? e.name : "";
        }else if(type == 'type'){
            str = "Sample type";
            var e = SampleTypes.findOne(id);
            name = e ? e.name : "";
        }else if(type == 'date'){
            str = "Date: "
            var e = Dates.findOne(id);
            name = e ? e.name : "";
        }
        return name + ": "+ str + " - Lab notebook"
    }else{
        return "Lab notebook"
    }
};

function okCancelEvents(selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};

  var events = {};
  events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
    function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);

      } else if (evt.type === "keyup" && evt.which === 13 ||
                 evt.type === "focusout") {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };

  return events;
}