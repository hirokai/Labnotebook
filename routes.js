Router.map(function () {
    this.route('home', {path: '/',
        action: function () {
            this.redirect('exp');
        }
    });

    this.route('exp',
        {path: '/exp/:_id?',
            layoutTemplate: 'layout',
            onBeforeAction: function(){
                this.subscribe('experiments').wait();
                this.subscribe('operations').wait();
            },
            action: function () {
                Session.set('current_view_id', this.params._id);
                Session.set('list_type', 'exp');
                Session.set('input_samples', []);
                Session.set('output_samples', []);
                Session.set('selected_nodes', []);
                Session.set('selected_edges', []);
                Session.set('selected_ops', []);
                if(Meteor.isClient){
                    d3.select("svg").html('');
                }
                if (this.ready()) {
//                    Router.onBeforeAction('loading');
                    this.render('exp_list', {to: 'left_pane'});
                    if (!this.params._id) {
                        this.render('empty_right', {to: 'right_pane'});
                    } else {
                        this.render('exp', {to: 'right_pane'});
                    }
                } else {
                    this.render('loading', {to: 'right_pane'});
                    this.render('loading', {to: 'left_pane'});
                }
            }
//            waitOn: function () {
//                return Meteor.subscribe('experiments');
//            },
//            data: function () {
//                return Experiments.findOne(this.params._id);
//            }
        });

    this.route('operation', {path: '/op/:_id?', layoutTemplate: 'layout',
        action: function () {
            Session.set('current_view_id', this.params._id);
            Session.set('list_type', 'op');

            this.render('op_list', {to: 'left_pane'});
            if (!this.params._id) {
                this.render('empty_right', {to: 'right_pane'});
            } else {
                this.render('operation', {to: 'right_pane'});
            }
        },
        data: function () {
            return Operations.findOne(this.params._id);
        }
    });

    this.route('sample', {path: '/sample/:_id?', layoutTemplate: 'layout',
        action: function () {
            Session.set('current_view_id', this.params._id);
            Session.set('list_type', 'sample');
            this.render('sample_list', {to: 'left_pane'});
            this.render('sample', {to: 'right_pane'});
            if (!this.params._id) {
                this.render('empty_right', {to: 'right_pane'});
            } else {
                this.render('sample', {to: 'right_pane'});
            }
        },
        waitOn: function(){
            return Meteor.subscribe('samples');
        },
        data: function () {
            return Samples.findOne(this.params._id);
        }});

    this.route('type', {path: '/type/:_id?', layoutTemplate: 'layout',
        action: function () {
            Session.set('current_view_id', this.params._id);
            Session.set('list_type', 'type');
            this.render('type_list', {to: 'left_pane'});
            if (!this.params._id) {
                this.render('empty_right', {to: 'right_pane'});
            } else {
                this.render('type', {to: 'right_pane'});
            }
        },
        waitOn: function(){
            return Meteor.subscribe('sampletypes');
        },
        data: function () {
            return SampleTypes.findOne(this.params._id);
        }});

    this.route('date', {path: '/date/:_id?', layoutTemplate: 'layout',
        action: function () {
            Session.set('current_view_id', this.params._id);
            Session.set('list_type', 'date');
            this.render('date_list', {to: 'left_pane'});
            this.render('date', {to: 'right_pane'});
        }});

    this.route('notfound', {path: '*'});
});
