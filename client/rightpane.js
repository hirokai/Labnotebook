
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