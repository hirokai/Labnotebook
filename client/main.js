Meteor.startup(function () {

// Define Minimongo collections to match server/publish.js.
    Presets = new Meteor.Collection("presets");
    Experiments = new Meteor.Collection("experiments");
    ExpRuns = new Meteor.Collection("expruns");
    SampleTypes = new Meteor.Collection("sampletypes");
    TypeClasses = new Meteor.Collection("typeclasses");
    Dates = new Meteor.Collection("dates");
    Operations = new Meteor.Collection("operations");
    Logs = new Meteor.Collection("logs");

    Samples = new Meteor.Collection('samples');

    Config = new Meteor.Collection("config");

    Session.setDefault('list_type', 'exp');
    Session.setDefault('current_view_id', {exp: null, sample: null, sampletype: null, multiexp: null, date: null, log: null});
    Session.setDefault('list_sortby', {exp: 'date', sample: 'date', sampletype: 'hierarchy', multiexp: 'date'});

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
    Session.setDefault('selected_param_type', null);
    Session.setDefault('newstep_params', []);

    Session.setDefault('op_param_list', []);

//D3 graph
    Session.setDefault('selected_nodes', []);
    Session.setDefault('selected_edges', []);
    Session.setDefault('selected_ops', []);

    Session.setDefault('visible_addstepdiv', false);

//Exp info
    Session.setDefault('editing_sample_id', null);
    Session.setDefault('editing_sampletype_id', null);

    Session.setDefault('choosing_sample_for', {run: null, sample: null})


    Session.setDefault('info_shown', {protocol: true, sample: true, step: true, sheet: true});

    Session.setDefault('editing_sample_title', false);

//Reset every time reloaded.
    Session.set('editing_node_in_graph', null);

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


function renderDate(ts) {
//    console.log(ts);
    var t = new Date(ts);
    return "" + (t.getMonth() + 1) + "/" + t.getDate();
}

////////// Tracking selected list in URL //////////


//Router = new TodosRouter;

Meteor.startup(function () {
    $.ready(function () {
        $('#datepicker').datePicker();
    });
    Hooks.init();
});


var timer;

showMessage = function (msg) {
    var el = $('#message');
    el.removeClass('hidden');
    el.html(msg);
    timer = null;
    timer = window.setTimeout(function () {
        el.addClass('hidden');
    }, 3000);
};

Hooks.onLoggedIn = function () {
    Meteor.call('currentUser', function (err, user) {
        showMessage('Welcome, ' + user.first_name + '!');
        Session.set('currentUser', user);
    });
};

Hooks.onLoggedOut = function () {
    Router.go('exp');
    showMessage('Logged out.');
    Meteor.call('currentUser', function (err, user) {
        Session.set('currentUser', user);
    });
};

Template.googleAnalytics.rendered = function () {

    var self = this;
    self.node = self.find("#analyticsstub");
    if (!self.handle) {
        self.handle = Deps.autorun(function () {
            new GA('UA-50868581-1');
        });
    }
}

GA = function (code) {
    var _gaq = window._gaq || [];
    _gaq.push(['_setAccount', code]);
    _gaq.push(['_trackPageview']);
    (function () {
        var ga = document.createElement('script');
        ga.type = 'text/javascript';
        ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(ga, s);
    })();
};
