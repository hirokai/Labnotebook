Template.sample.typeclasses = function () {
    var ids = SampleTypes.findOne(this._id).classes || [];
//    console.log(this._id,ids,SampleTypes.findOne(this._id));
    var r = TypeClasses.find({_id: {$in: ids}});
    return r;
}

Template.sample.sampletype = function () {
    console.log(this);
    return SampleTypes.findOne(this.sampletype_id);
};

Template.sample.classes = function () {
    var st = SampleTypes.findOne(this.sampletype_id);
    return st ? TypeClasses.find({_id: {$in: st.classes}}) : null;
};

//https://gist.github.com/dariocravero/3922137

Template.sample.events({
    'click #savesamplenote': function (evt, tmpl) {
        var note = tmpl.find('#samplenote').value;
        Samples.update(this._id, {$set: {note: note}});
    },
    'click #cancelsamplenote': function (evt, tmpl) {
        var note = Samples.findOne(this._id).note || "";
        tmpl.find('#samplenote').value = note;
    },
    'click #deletesample': function () {
        if (sampleNotUsedAtAll(getCurrentSampleId())) {
            Samples.remove(this._id);
            var pos = findSamplePosInList(this._id);
            console.log(Samples.find({}, {skip: Math.max(0, pos - 1), limit: 1}).fetch());
            var s = Samples.find({}, {skip: Math.max(0, pos - 1), limit: 1})[0]._id;
            Router.go('sample', {_id: s});
        }
    },
    'click #renamesample': function () {
        var name = Samples.findOne(this._id).name;
        var newname = window.prompt("Enter a new name.", name);
        Samples.update(this._id, {$set: {name: newname}});
    },
    'click #addtypeclass': function (evt, tmpl) {
        var name = tmpl.find('#nametypeclass').value;
        var id = insertTypeClass(name);
        Samples.update(this._id, {$push: {classes: id}});
    },
    'dblclick #sampletitle': function (evt, tmpl) {
        Session.set('editing_sample_title', true);
        Deps.flush(); // force DOM redraw, so we can focus the edit field
        activateInput(tmpl.find("#sampletitle_input"));
    },
    'change .fileUploader': function (e) {
        var files = event.target.files;
        for (var i = 0, ln = files.length; i < ln; i++) {
            var fsFile = new FS.File(files[i]);
            fsFile.owner = Meteor.userId() || 'sandbox';
            fsFile.sample = Session.get('current_view_id').sample;
            AttachmentsFS.insert(fsFile, function (err, fileObj) {
                if (!err) console.log('Saved');
                //Inserted new doc with ID fileObj._id, and kicked off the data upload using HTTP
            });
        }
    }
});

Template.sample.formatDate = function (d) {
    return formatDate(d);
}

Template.sample.sample_not_used = function () {
    return sampleNotUsedAtAll(this._id);
};

Template.sample.exps_used = function () {
    var runs = ExpRuns.find({samplelist: this._id});
    var eids = _.uniq(runs.map(function (run) {
        return run.exp;
    }));
    console.log(this);
    return Experiments.find({_id: {$in: eids}});
}

Template.sample.rendered = function () {
    //ga('send', 'event', 'view', 'sample', Meteor.userId(),getCurrentSampleId());
    console.log('hey');
};

Template.sample.editing_title = function () {
    return  Session.get('editing_sample_title');
};

Template.sample.events(okCancelEvents(
    '#sampletitle_input',
    {
        ok: function (value) {
            var sid = getCurrentSampleId();
            Samples.update(sid, {$set: {name: value}});
            Session.set('editing_sample_title', false);
        },
        cancel: function () {
            Session.set('editing_sample_title', false);
        }
    }));

Template.type.rendered = function () {
    //ga('send', 'event', 'view', 'type', Meteor.userId(),Session.get('current_view_id').type);
};

Template.type.events({
    'click #savetypenote': function (evt, tmpl) {
        var note = tmpl.find('#typenote').value;
        SampleTypes.update(this._id, {$set: {note: note}});
    },
    'click #canceltypenote': function (evt, tmpl) {
        var note = SampleTypes.findOne(this._id).note || "";
        tmpl.find('#typenote').value = note;
    },
    'click #deletesampletype': function () {
        SampleTypes.remove(this._id);
        Router.go('type');
    },
    'click #renamesampletype': function () {
        var name = SampleTypes.findOne(this._id).name;
        var newname = window.prompt("Enter a new name.", name);
        if (newname && _.trim(newname))
            SampleTypes.update(this._id, {$set: {name: newname}});
    },
    'click #addtypeclass': function (evt, tmpl) {
        var name = tmpl.find('#nametypeclass').value;
        var id = insertTypeClass(name);
        SampleTypes.update(this._id, {$push: {classes: id}});
    },
    'dblclick #typetitle': function (evt, tmpl) {
        var sid = Session.get('current_view_id').sampletype;
        if (!SampleTypes.findOne(sid).system) {
            Session.set('editing_type_title', true);
            Deps.flush(); // force DOM redraw, so we can focus the edit field
            activateInput(tmpl.find("#typetitle_input"));
        }
    }
});

Template.type.is_systemtype = function () {
    return this.system;
}

Template.type.events(okCancelEvents(
    '#typetitle_input',
    {
        ok: function (value) {
            if (allowedSampleTypeName(value)) {
                var sid = Session.get('current_view_id').sampletype;
                SampleTypes.update(sid, {$set: {name: value}});
            } else {
                window.alert('This name cannot be used. (Name must be unique, nonempty.)');
            }
            Session.set('editing_type_title', false);
        },
        cancel: function () {
            Session.set('editing_type_title', false);
        }
    }));

Template.type.classes = function () {
    if (this.classes && this.classes.length > 0) {
        return TypeClasses.find({_id: {$in: this.classes}});
    } else {
        return null;
    }
};

Template.type.samples = function () {
    return Samples.find({sampletype_id: this._id, protocol: false});
};

Template.type.hierarchy = function () {
    var cs = findDirectSubTypes(this._id);
    var str = "<ul>" + cs.map(function (t) {
        return "<li>" + t.name + "</li>"
    }).join('') + "</ul>";
    return mkHierarchy(this._id, str, true);
};

Template.type.sampletype_not_used = function () {
    return sampleTypeNotUsedAtAll(this._id);
};

Template.type.children = function () {
    return findDirectSubTypes(this._id);
};

Template.type.has_children = function () {
    return findDirectSubTypes(this._id).count() > 0;
};

Template.type.editing_title = function () {
    return  Session.get('editing_type_title');
};

Template.type.exps_used = function () {
    var runs = ExpRuns.find({samplelist: this._id}, {fields: {exp: 1}});
    var exps = runs.map(function (run) {
        return run.exp
    });
    return Experiments.find({_id: {$in: exps}}, {fields: {_id: 1, name: 1}});
}

Template.type.sample_used = function () {
    return !sampleNotUsedAtAll(this._id);
}

mkHierarchy = function (nodeid, childstr, start) {
    console.log(nodeid);
    var node = SampleTypes.findOne(nodeid);
    if (!node)
        return "";
    var name = node.name;
    if (start) {
        name = "<span class='hierarchy_this'>" + node.name + "</span>";
    } else {
        name = "<span>" + node.name + "</span>";
    }
    if (node.parent) {
        var str = name + "<ul><li>" + childstr + "</li></ul>";
        return mkHierarchy(node.parent, str, false);
    } else {
        return name + "<ul><li>" + childstr + "</li></ul>";
    }
}