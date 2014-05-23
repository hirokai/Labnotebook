Meteor.startup(function () {
//    Accounts.ui.config({requestPermissions: {google:
//        [
//            //'https://www.googleapis.com/auth/calendar',
//            'https://www.googleapis.com/auth/userinfo.profile',
//            'https://www.googleapis.com/auth/drive.file',
////            'https://www.googleapis.com/auth/drive.readonly',
//            'https://www.googleapis.com/auth/photos'
//           // 'https://www.googleapis.com/auth/tasks'
//           ]}}, {requestOfflineToken: {google: false}});

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

// Subscribe to 'lists' collection on startup.
// Select a list once data has arrived.
    listsHandle = Meteor.subscribe('lists', function () {
        if (!Session.get('list_id')) {
            var list = Lists.findOne({}, {sort: {name: 1}});
            //  if (list)
            //  Router.setList(list._id);
        }
    });

    configHandle = Meteor.subscribe('config');

    checkAuthToken();

});

checkAuthToken = function(token){
    Meteor.call('getGoogle',function(err,res){
        console.log('checkAuthToken(): Current authtoken: '+res.accessToken);
        $.post('https://www.googleapis.com/oauth2/v1/tokeninfo',
            {access_token: token || res.accessToken},
            function(res){
                console.log(res);
                if(res.error || res.expires_in <= 60){
                    Meteor.call('doRefreshToken');
                }else{
                    var time = (res.expires_in - 50)*1000;
                    Meteor.setTimeout(checkAuthToken,time);
                    console.log('checkAuthToken(): will check again '+(time/1000)+' sec later.');
                }
            });
    });
};

checkAutoBackup = function(){
    if(configHandle.ready()){
        var cfg = Config.findOne();

        var timelapse = (moment().valueOf() - (cfg.lastBackupOn || 0)) / (1000*60);
        console.log('checkAutoBackup(): '+numeral(timelapse).format('0.0')+' min passed from last auto backup.')

        //timelapse / min
        if(cfg && cfg.values.logemail_auto && timelapse > 60){
            console.log('Time has come. Doing backup...');
            dumpDBToGDrive(function(res){
                if(res.url){
                    showMessage('Database snapshot was auto-saved to : <a href="'+ res.url+'">Google Drive</a>');
                    //    window.open(res.url);
                    var cfg = Config.findOne();
                    var t = moment().valueOf();
                    Config.update(cfg._id, {$set: {lastBackupOn: t}});
                    addLog({type:'db',op:'autobackup',params: {target: 'gdrive'}});
                }else{
                    // showMessage('Error during saving the exp.');
                }
            });
            Meteor.call('sendLogByEmail', function (err, res) {
                console.log(err, res);
                if (res.success) {
                    showMessage('Autobackup email sent to ' + cfg.values.logemail);
                    addLog({op: 'autobackup', type: 'db', id: null, params: {target: 'email', email_to: cfg.values.logemail}});
                } else {
                    showMessage('Error occured.')
                }
            });
            Meteor.setTimeout(checkAutoBackup,1000*60*60);  // 60 min later.
            console.log('Next backup check will be run in ~60 min.');
        }else{
            Meteor.setTimeout(checkAutoBackup,1000*60*1);  // 1 min later.
            console.log('Next backup check will be run in ~1 min.');
        }
    }
};


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
    var timer = Meteor.setInterval(function(){
        if(configHandle.ready()){
           Meteor.clearInterval(timer);
           checkAutoBackup();
        }
    },1000);
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
//                var Auth = 'Bearer ' + auth.access_token;

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