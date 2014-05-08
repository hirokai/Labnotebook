Template.sample.typeclasses = function(){
    var ids = SampleTypes.findOne(this._id).classes || [];
    console.log(this._id,ids,SampleTypes.findOne(this._id));
    var r = TypeClasses.find({_id: {$in: ids}});
    console.log(r.fetch());
    return r;
}

Template.sample.sampletype = function(){
    return SampleTypes.findOne(this.sampletype_id);
};

Template.sample.classes = function(){
    var st = SampleTypes.findOne(this.sampletype_id);
    return st ? TypeClasses.find({_id: {$in: st.classes}}) : null;
};

//https://gist.github.com/dariocravero/3922137

Template.sample.events({
   'click #savesamplenote': function(evt,tmpl){
       var note = tmpl.find('#samplenote').value;
       Samples.update(this._id, {$set: {note: note}});
   },
    'click #cancelsamplenote': function(evt,tmpl){
        var note = Samples.findOne(this._id).note || "";
        tmpl.find('#samplenote').value = note;
    },
    'change input': function(ev) {
        console.log(ev)
        var id = this._id
      _.each(ev.currentTarget.files, function(file) {
        Meteor.saveFile(file, file.name,null,null,function(err,res){
            console.log(res,id);
            Samples.update(id, {$push: {data: {path: res.path}}});
        });
      });
    },
    'click #deletesample': function(){
        Samples.remove(this._id);
        var pos = findSamplePosInList(this._id);
        console.log(Samples.find({},{skip: Math.max(0,pos - 1), limit: 1}).fetch());
        var s = Samples.find({},{skip: Math.max(0,pos - 1), limit: 1})[0]._id;
        Router.go('sample',{_id: s});
    },
    'click #renamesample': function(){
        var name = Samples.findOne(this._id).name;
        var newname = window.prompt("Enter a new name.",name);
        Samples.update(this._id, {$set: {name: newname}});
    },
    'click #addtypeclass': function(evt,tmpl){
        var name = tmpl.find('#nametypeclass').value;
        var id = insertTypeClass(name);
        Samples.update(this._id, {$push: {classes: id}});
    }
});

Template.sample.sample_not_used = function(){
    return sampleNotUsedAtAll(this._id);
};

Template.sample.rendered = function(){
//    var editor = new EpicEditor().load();

};

Template.type.events({
//    'click #savesamplenote': function(evt,tmpl){
//        var note = tmpl.find('#samplenote').value;
//        SampleTypes.update(this._id, {$set: {note: note}});
//    },
//    'click #cancelsamplenote': function(evt,tmpl){
//        var note = SampleTypes.findOne(this._id).note || "";
//        tmpl.find('#samplenote').value = note;
//    },
//    'change input': function(ev) {
//        console.log(ev)
//        var id = this._id
//        _.each(ev.currentTarget.files, function(file) {
//            Meteor.saveFile(file, file.name,null,null,function(err,res){
//                console.log(res,id);
//                SampleTypes.update(id, {$push: {data: {path: res.path}}});
//            });
//        });
//    },
    'click #deletesampletype': function(){
        SampleTypes.remove(this._id);
        Router.go('type');
    },
    'click #renamesampletype': function(){
        var name = SampleTypes.findOne(this._id).name;
        var newname = window.prompt("Enter a new name.",name);
        SampleTypes.update(this._id, {$set: {name: newname}});
    },
    'click #addtypeclass': function(evt,tmpl){
        var name = tmpl.find('#nametypeclass').value;
        var id = insertTypeClass(name);
        SampleTypes.update(this._id, {$push: {classes: id}});
    }
});

Template.type.classes = function(){
    if(this.classes && this.classes.length > 0){
        return TypeClasses.find({_id: {$in: this.classes}});
    }else{
        return null;
    }
}

Template.type.samples = function(){
    return Samples.find({sampletype_id: this._id, protocol: false});
}