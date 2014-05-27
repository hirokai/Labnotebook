
Template.lists.loading = function () {
    return !listsHandle.ready();
};


Template.lists.events({
    'click .listmenu': function (evt) {
        var p = {};
        var t = $(evt.target).attr('data-value');
        var ids = Session.get('current_view_id');
        if (t == 'exp') {
            p = ids.exp ? {_id: ids.exp} : null;
        } else if (t == 'sample') {
            p = ids.sample ? {_id: ids.sample} : null;
        } else if (t == 'type') {
            p = ids.sampletype ? {_id: ids.sampletype} : null;
        } else if (t == 'log') {
            p = ids.log ? {date: ids.log} : null;
        } else if (t == 'date') {
            p = ids.date ? {_id: ids.date} : null;
        } else if (t == 'multiexp') {
            p = ids.multiexp ? {_id: ids.multiexp} : null;
        }
        //  console.log(t,p);
        Router.go(t, p);
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

Template.lists.type = function () {
    return Session.get("list_type");
};

Template.lists.name_class = function () {
    return this.name ? '' : 'empty';
};

Template.lists.editing = function () {
    return Session.equals('editing_listname', this._id);
};


Template.lists.group_selected = function (type) {
    return Session.equals("list_type", type) ? "selected" : "";
};

Template.exp_list.formatDate = function (d) {
    return moment(d).format('M/D/YYYY');
};

Template.exp_list.lists = function () {
//    console.log(experimentsHandle.ready());
    var sort = {};
    var s = Session.get('list_sortby').exp;
    if (s == 'name') {
        sort = {name: 1};
    } else if (s == 'date') {
        sort = {date: -1};
    }
    return Experiments.find({}, {sort: sort});
};

Template.exp_list.sortby_selected = function (n) {
    return Session.get('list_sortby').exp == n ? 'selected' : '';
};

Template.exp_list.selected = function () {
    return Session.get('current_view_id').exp == this._id ? "selected" : "";
};

Template.exp_list.old_notlocked = function () {
    console.log(this);
    return (moment().valueOf() - this.date) > 1000*60*60*24*7 && !this.locked ? 'unfinished' : '';
}

Template.exp_list.events({
    'mousedown .list-name-div': function (evt) {
        Router.go('exp', {_id: this._id});
    }
});

Template.exp_list.events(okCancelEvents(
    '#new-exp',
    {
        ok: function (text, evt) {
            var id = newExp(text);
            Router.go('exp', {_id: id});
            evt.target.value = "";
        }
    }));

Template.exp_list.events({'click #newexpbtn': function () {
    var id = newExp('Experiment ' + formatDate(new Date()));
    Router.go('exp', {_id: id});
},
    'change #sortby': function (evt) {
//        var v = $(evt.target).val();
        var obj = Session.get('list_sortby');
        obj.exp = $(evt.target).val();
        Session.set('list_sortby', obj);
    },
    'click #copyprotocol': function (evt) {
        copyProtocolForNewExp(getCurrentExpId());
    }
});

Template.sample_list.lists = function () {
    var sort = {};
    var s = Session.get('list_sortby').sample;
    if (s == 'name') {
        sort = {name: 1};
    } else if (s == 'date') {
        sort = {timestamp: -1};
    } else if (s == 'type') {
        sort = {sampletype_id: 1};
    }

    var samples = Samples.find({protocol: false}, {sort: sort});
    return samples.map(function (s, i) {
        //  console.log(s);
        s.index = i;
        return s;
    });
};

Template.sample_list.selected = function (id) {
    return Session.get('current_view_id').sample == this._id ? "selected" : "";
};

Template.sample_list.sortby_selected = function (n) {
    return Session.get('list_sortby').sample == n ? 'selected' : '';
};

Template.sample_list.events({
    'mousedown .list-name-div': function (evt) {
        Router.go('sample', {_id: this._id});
    },
    'change #sample_sortby': function (evt) {
        var obj = Session.get('list_sortby');
        obj.sample = $(evt.target).val();
        Session.set('list_sortby', obj);
    }
});

Template.sample_list.events(okCancelEvents(
    '#new-sample',
    {
        ok: function (text, evt) {
            var id = newSample(text);
            Router.go('sample', {_id: id});
            evt.target.value = "";
        }
    }));

Template.sample_list.first_expdate = function () {
    return formatDate(this.timestamp);
}

Template.type_list.events({
    'mousedown .list-name': function (evt) {
        Router.go('type', {_id: this._id});
    }
});

Template.type_list.lists = function () {
    var sort = {};
    var s = Session.get('list_sortby').type;
    if (s == 'name') {
        sort = {name: 1};
    } else if (s == 'date') {
        sort = {timestamp: -1};
    }
    return SampleTypes.find({}, {sort: sort});
};


Template.type_list.events(okCancelEvents(
    '#new-sample-type',
    {
        ok: function (text, evt) {
            if (_.trim(text)) {
//            var node = $('#tree1').tree('getSelectedNode');
//            var parent = node ? node.id : get;
                var parent = Session.get('current_view_id').sampletype;
                var id = newSampleType(text, parent);
                Router.go('type', {_id: id});
                evt.target.value = "";
            }
        }
    }));


Template.type_list.selected = function (id) {
    return Session.get('current_view_id').sampletype == this._id ? "selected" : "";
};

Template.type_list.rendered = function () {
    var self = this;
    self.node = self.find("#tree1");
    if (!self.handle) {
        self.handle = Deps.autorun(function () {
            var data = mkTypeTree();
//            console.log(data);
            var tr = $('#tree1');
            tr.tree({
                data: data,
                autoOpen: true,
                dragAndDrop: true,
                onCanMoveTo: function (moved_node, target_node, position) {
                    return (target_node.id == generalSampleType() && (position == 'before' || position == 'after')) ? false : true;
                },
                onCreateLi: function (node, $li) {
                    // Append a link to the jqtree-element div.
                    // The link has an url '#node-[id]' and a data property 'node-id'.
                    if (node.id == Session.get('current_view_id').sampletype)
                        $li.find('.jqtree-element').addClass('treeselected');
                }
            });
            tr.bind('tree.move', function (evt) {
                var mi = evt.move_info;
                console.log(evt.move_info);
                var moved = mi.moved_node.id;
                var to = mi.target_node.id;
                var from = mi.previous_parent.id;
                console.log(moved, from, to);
                changeTypeParent(moved, to, from);
            });
            tr.bind('tree.select', function (evt) {
                var node = evt.node;
                if (node) {
                    var id = node.id;
                    var current = Session.get('current_view_id').sampletype;
                    if (id != current) {
                        Router.go('type', {_id: id});
                    }
                }
            });
            var node = tr.tree('getNodeById', Session.get('current_view_id').sampletype);
//            console.log(node);
            tr.tree('selectNode', node);
        });
    }

};

Template.preset_list.lists = function () {
    return Dates.find();
};


Template.preset_list.selected = function (id) {
    return Session.get('current_view_id').preset == this._id ? "selected" : "";
};

Template.preset_list.events({
    'mousedown .list-name': function (evt) {
        Router.go('preset', {_id: this._id});
    }
});


Template.layout.title = function () {
    var type = Session.get('list_type');
    var id = Session.get('current_view_id');
    if (id) {
        var str, name;
        if (type == 'exp') {
            str = "Experiment";
            var e = Experiments.findOne(id.exp);
            name = e ? e.name : "";
        } else if (type == 'sample') {
            str = "Sample";
            var e = Samples.findOne(id.sample);
            name = e ? e.name : "";
        } else if (type == 'type') {
            str = "Sample type";
            var e = SampleTypes.findOne(id.sampletype);
            name = e ? e.name : "";
        } else if (type == 'date') {
            str = "Date: "
            var e = Dates.findOne(id.date);
            name = e ? e.name : "";
        } else if (type == 'log') {
            str = "Log: "
            var e = Logs.findOne(id.log);
            name = e ? moment(e.timestamp).format('M/D/YYYY') : "";
        } else if (type == 'multiexp') {
        }
        return name + ": " + str + " - Lab notebook"
    } else {
        return "Lab notebook"
    }
};


Template.log_list.lists = function () {
    var logs = Logs.find({}, {sort: {timestamp: -1}}, {fields: {timestamp: 1}}).fetch();
    return _.map(_.groupBy(logs, function (log) {
        return moment(log.timestamp).format('YYYY/M/D');
    }), function (v) {
        return v;
    });
};

Template.log_list.date = function () {
//    console.log(this);
    return moment(this).format('M/D/YYYY');
};


Template.log_list.events({
    'mousedown .list-name-div': function (evt) {
        var ts = moment(this).format('YYYYMMDD');
        Router.go('log', {date: ts});
    }
});

Template.log_list.selected = function () {
    console.log(this);
    return Session.get('current_view_id').log == this ? "selected" : "";
};


Template.preset_list.lists = function () {
    return Presets.find();
};