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
                this.subscribe('expruns_id',this.params._id).wait();
//                this.subscribe('expruns').wait();
                this.subscribe('operations').wait();
                this.subscribe('samples').wait();
                this.subscribe('sampletypes').wait();
                this.subscribe('config').wait();
            },
            action: function () {
                var ids = Session.get('current_view_id');
                ids.exp = this.params._id;
                Session.set('current_view_id', ids);

                Session.set('list_type', 'exp');
                Session.set('input_samples', []);
                Session.set('output_samples', []);
                Session.set('selected_nodes', []);
                Session.set('selected_edges', []);
                Session.set('selected_ops', []);
//                if(Meteor.isClient){
//                    d3.select("svg").html('');
//                }
                if (this.ready()) {
//                    Router.onBeforeAction('loading');
                    this.render('exp_list', {to: 'left_pane'});
                    if (!this.params._id) {
                        this.render('empty_right', {to: 'right_pane'});
                    } else {
                        this.render('exp', {to: 'right_pane'});
                    }
               //     GAnalytics.pageview("/exp/"+(this.params ? this.params._id : ""));
                } else {
                    //Seems I need this line for correct rendering...
                    this.render('loading', {to: 'right_pane'});
           //         this.render('loading', {to: 'left_pane'});
                }
            },
//            waitOn: function () {
//                return Meteor.subscribe('experiments');
//            },
            data: function () {
                return Experiments.findOne(this.params._id);
            }
        });

    this.route('log', {path: '/log/:date?', layoutTemplate: 'layout',
        onBeforeAction: function(){
            this.subscribe('alllogs').wait();
            if(this.params.date){
                this.subscribe('logs',this.params.date).wait();
            }
        },
        action: function () {
            if (this.ready()) {

                Session.set('list_type', 'log');
                var ids = Session.get('current_view_id');
            ids.log = this.params.date;
            Session.set('current_view_id', ids);

            this.render('log_list', {to: 'left_pane'});
            if (!this.params.date) {
                this.render('empty_right', {to: 'right_pane'});
            } else {
                this.render('log', {to: 'right_pane'});
            }
             }else{
                this.render('loading', {to: 'right_pane'});

            }
        },
        data: function () {
            return Logs.find({date: this.params.date},{sort: {timestamp: -1}});
        }
    });

    this.route('multiexp', {path: '/multiexp/:_id?', layoutTemplate: 'layout',
        action: function () {
            Session.set('list_type', 'multiexp');
            var ids = Session.get('current_view_id');
            ids.multiexp = this.params._id;
            Session.set('current_view_id', ids);

            this.render('multiexp_list', {to: 'left_pane'});
            if (!this.params._id) {
                this.render('empty_right', {to: 'right_pane'});
            } else {
                this.render('multiexp', {to: 'right_pane'});
            }
        //    GAnalytics.pageview("/multiexp/"+(this.params ? this.params._id : ""));
        },
        data: function () {
//            return Operations.findOne(this.params._id);
        }
    });

    this.route('sample', {path: '/sample/:_id?', layoutTemplate: 'layout',
        onBeforeAction: function(){
            this.subscribe('samples').wait();
            this.subscribe('expruns').wait();
            this.subscribe('experiments').wait();
            this.subscribe('sampletypes').wait();
        },
        action: function () {
            var ids = Session.get('current_view_id');
            ids.sample = this.params._id;
            Session.set('list_type', 'sample');
            Session.set('current_view_id', ids);

            this.render('sample_list', {to: 'left_pane'});
            this.render('sample', {to: 'right_pane'});
            if (!this.params._id) {
                this.render('empty_right', {to: 'right_pane'});
            } else {
                this.render('sample', {to: 'right_pane'});
            }
        //    GAnalytics.pageview("/sample/"+(this.params ? this.params._id : ""));
        },
        waitOn: function(){
            return Meteor.subscribe('samples');
        },
        data: function () {
            return Samples.findOne(this.params._id);
        }});

    this.route('type', {path: '/type/:_id?', layoutTemplate: 'layout',
        onBeforeAction: function(){
            this.subscribe('sampletypes').wait();
        },
        action: function () {
            Session.set('list_type', 'type');
            var ids = Session.get('current_view_id');
            ids.sampletype = this.params._id;
            Session.set('current_view_id', ids);

            if(this.ready()){
                this.render('type_list', {to: 'left_pane'});
                if (!this.params._id) {
                    this.render('empty_right', {to: 'right_pane'});
                } else {
                    this.render('type', {to: 'right_pane'});
                }
            }else{
                this.render('loading', {to: 'left_pane'});
                this.render('loading', {to: 'right_pane'});
            }
        },
        data: function () {
            return SampleTypes.findOne(this.params._id);
        }});

    this.route('preset', {path: '/preset/:_id?', layoutTemplate: 'layout',
        action: function () {
            Session.set('list_type', 'preset');
            var ids = Session.get('current_view_id');
            ids.preset = this.params._id;
            Session.set('current_view_id', ids);

            this.render('preset_list', {to: 'left_pane'});
            this.render('preset', {to: 'right_pane'});
//            GAnalytics.pageview("/g/"+(this.params ? this.params._id : ""));
        }});

    this.route('alldb_dump', {
        path: '/alldb_dump/:owner',
        where: 'server',

        action: function () {
//          var filename = this.params.filename;
//          resp = {'lat' : this.request.body.lat,

            this.response.writeHead(200, {'Content-Type':
                                        'application/json; charset=utf-8'});

            var obj = dump_allmydb(this.params.owner);
            var str = JSON.stringify(obj);
           // console.log(obj);
          this.response.end(str);



        }
      });

    this.route('notfound', {path: '*'});
});
