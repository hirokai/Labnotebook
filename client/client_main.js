Meteor.startup(function () {

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
    Session.setDefault('exp_graph_shrink',true);
    Session.setDefault('hide_intermediates',true);


    Session.setDefault('visible_addstepdiv', false);

//Exp info
    Session.setDefault('editing_sample_id', null);
    Session.setDefault('editing_sampletype_id', null);

    Session.setDefault('choosing_sample_for', {run: null, sample: null})

    Session.setDefault('info_shown', {protocol: true, sample: true, step: true, sheet: true});

    Session.setDefault('editing_sample_title', false);
    Session.setDefault('graph_offset',{x: 100, y: 100});

//Reset every time reloaded.
    Session.set('editing_node_in_graph', null);

    listsHandle = Meteor.subscribe('lists', function () {
        if (!Session.get('list_id')) {
            var list = Lists.findOne({}, {sort: {name: 1}});
        }
    });

    configHandle = Meteor.subscribe('config');

    //OAuth token refresh. This seems necessary (running it directly from server does not work yet.)
    Meteor.setInterval(function(){
        Meteor.call('doRefreshToken');
    },1000*60*55);

//    Meteor.call('checkAuthTokenOnServer',function(err,res){
//        if(err)
//            console.log('AuthToken expiration monitoring failed on server.');
//        else
//        console.log('AuthToken expiration monitoring started on server.');
//    });
});

Meteor.startup(function () {
    Hooks.init();
});

var timer;

showMessage = function (msg,time) {
    time = time || 3000;
    var el = $('#message');
    el.removeClass('hidden');
    el.html(msg);
    if(timer)
        window.clearTimeout(timer);
    timer = window.setTimeout(function () {
        el.addClass('hidden');
    }, time);
};

Hooks.onLoggedIn = function () {
    Meteor.call('currentUser', function (err, user) {
        if(!err && user){
            showMessage('Welcome, ' + (user.first_name || user.given_name) + '!');
            Session.set('currentUser', user);
        }
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

mkGoogleSheet = function(eid,callback){
    callback = callback || function(){};

    var csvData = mkCsv(eid);
    if(!csvData) return;

    Meteor.call('getGoogle',function(err,res){
        if(!err){
                console.log(res);
                var Auth = 'Bearer ' + res.accessToken;

                var contentType = 'text/csv';
               // var contentType = 'application/vnd.google-apps.spreadsheet';

                var exp = Experiments.findOne(eid);
                if(!exp) return;

                var title = 'Labnotebook: Experiment on '+moment(exp.date).format('YYYY-MM-DD')+': '+exp.name;
                var metadata = {
                    'title': title,
                    'mimeType': contentType
                };
                const boundary = '-------314159265358979323846';
                const delimiter = "\r\n--" + boundary + "\r\n";
                const close_delim = "\r\n--" + boundary + "--";

                var headers = {
                    'Content-Type': 'multipart/mixed; boundary="' + boundary + '"',
                    Authorization: Auth
                 };

                var multipartRequestBody =
                    delimiter +
                        'Content-Type: application/json\r\n\r\n' +
                        JSON.stringify(metadata) +
                        delimiter +
                        'Content-Type: ' + contentType + '\r\n' +
                        //      'Content-Transfer-Encoding: base64\r\n' +
                        '\r\n' +
                        csvData +
                        close_delim;

                var docId = exp.gdrive_id;

                if(docId){
                    //Update
                    updateCSV(eid,docId,headers,multipartRequestBody,function(res){
                        if(res.success){
                            callback(res);
                        }else{
                            addNewCSV2(eid,headers,multipartRequestBody,callback);
                        }
                    });
                }else{
                    //New
                    addNewCSV2(eid,headers,multipartRequestBody,callback);
                }
        }
    });
};

var updateCSV = function(eid,docId,headers,multipartRequestBody,callback){

    var request = gapi.client.request({
        'path': '/upload/drive/v2/files/'+docId,
        'method': 'PUT',
        'params': {'uploadType': 'multipart', convert: true},
        'headers': headers,
        'body': multipartRequestBody});
    request.execute(function(res){
        if(res.id){
            Experiments.update(eid,{$set: {gdrive_id: res.id}});
            var url = getSpreadsheetUrl(res.id);
            callback({url: url,success:true, id:res.id});
        }else{
            callback({success: false, error: 'Update failed.'});
        }
    });
};

var addNewCSV = function (eid,headers,multipartRequestBody,callback) {
//    console.log(multipartRequestBody,headers);

    var request = gapi.client.request({
        'path': '/upload/drive/v2/files',
        'method': 'POST',
        'params': {'uploadType': 'multipart', convert: true},
        'headers': headers,
        'body': multipartRequestBody});
    request.execute(function(res){
        if(res.id){
            Experiments.update(eid,{$set: {gdrive_id: res.id}});
            var url = getSpreadsheetUrl(res.id);
            callback({url: url,success:true, id:res.id});
        }else{
            callback({success: false, error: 'Insert failed.'});
        }
    });
};

//Using raw request.
addNewCSV2 = function (eid,headers,multipartRequestBody,callback) {
//    console.log(multipartRequestBody,headers);

    HTTP.post('https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart&convert=true',
        {content: multipartRequestBody, headers: headers},function(err,res){
            console.log(err,res);
            var id = res.data.id;
            if(id){
                Experiments.update(eid,{$set: {gdrive_id: id}});
                var url = getSpreadsheetUrl(id);
                callback({url: url,success:true, id: id});
            }else{
                callback({success: false, error: 'Insert failed.'});
            }
        }
    );
};

addHeaderCells = function(data,cols,rows){
  var d2 = [['Step','Property'].concat(cols)];
    console.log(cols,d2);

    var d3 = d2.concat(_.map(data,function(r,i){
        var prop = rows[i].prop + (rows[i].plan ? ': plan' : '') + (rows[i].actual ? ': actual' : '');
        return [rows[i].op, prop].concat(r);
    }));
    return d3;
};