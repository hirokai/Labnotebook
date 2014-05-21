Meteor.startup(function () {
    Accounts.ui.config({requestPermissions: {google:
        [
            //'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/drive.file'
           // 'https://www.googleapis.com/auth/tasks'
           ]}}, {requestOfflineToken: {google: true}});

//    Meteor
//    gapi.client.setApiKey('AIzaSyBWQOGSOkQfRiqoaFz41MG7N1TtY1EJUHI');


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


mkGoogleSheetOld = function(eid){
    var url = "https://www.googleapis.com/upload/drive/v2/files";

    gapi.client.setApiKey('AIzaSyBWQOGSOkQfRiqoaFz41MG7N1TtY1EJUHI');

    Meteor.call('getGoogle',function(err,res){
        if(!err){
            var Auth = 'Bearer ' + res.accessToken;
            var contentType = 'application/vnd.google-apps.spreadsheet';

            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            var exp = Experiments.findOne(eid);
            if(!exp) return;

            var title = 'Experiment on '+moment(exp.date).format('YYYY-MM-DD')+': '+exp.name;
            var metadata = {
                'title': title,
                'mimeType': contentType
            };

            var base64Data = '';
            var multipartRequestBody =
                delimiter +
                    'Content-Type: application/json\r\n\r\n' +
                    JSON.stringify(metadata) +
                    delimiter +
                    'Content-Type: ' + contentType + '\r\n' +
                    'Content-Transfer-Encoding: base64\r\n' +
                    '\r\n' +
                    base64Data +
                    close_delim;

            console.log(multipartRequestBody);

            Meteor.http.post(url,{
                params: {key: 'AIzaSyBWQOGSOkQfRiqoaFz41MG7N1TtY1EJUHI',
                    uploadType: 'multipart'
                },
                headers: {
                    'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                    ,'Authorization': Auth
                },
                content: multipartRequestBody
            },    function(err, result){
                console.log(result)
                return(result.id)
            });
        }
    });
   // var Auth = 'Bearer ' + Meteor.user().services.google.accessToken


};

mkGoogleSheet = function(eid,callback){
    callback = callback || function(){};


    Meteor.call('getGoogle',function(err,res){
        if(!err){
            var url = "https://www.googleapis.com/upload/drive/v2/files";
            var Auth = 'Bearer ' + res.accessToken;

            gapi.auth.authorize({client_id: '599783734738-9ttlsfq55256kd1u0hmdtj9ohfn80170.apps.googleusercontent.com',
                scope: 'https://www.googleapis.com/auth/drive.file',
                immediate: true
            },function(auth){
                console.log(auth);
                var id = '1IwHJnhvoFc9YVGMXbdUvjQONZ0SwWA2FB4U1DeHQhrc';

                var contentType = 'text/csv';
               // var contentType = 'application/vnd.google-apps.spreadsheet';


                var exp = Experiments.findOne(eid);
                if(!exp) return;

                var title = 'Experiment on '+moment(exp.date).format('YYYY-MM-DD')+': '+exp.name;
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

                var csvData = mkCsv(eid);
                if(!csvData) return;

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
                            addNewCSV(eid,headers,multipartRequestBody,callback);
                        }
                    });
                }else{
                    //New
                    addNewCSV(eid,headers,multipartRequestBody,callback);
                }
            });

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
            var url = 'https://drive.google.com/spreadsheets/d/' + res.id;
            callback({url: url,success:true, id:res.id});
        }else{
            callback({success: false, error: 'Update failed.'});
        }
    });
};

var addNewCSV = function (eid,headers,multipartRequestBody,callback) {
    var request = gapi.client.request({
        'path': '/upload/drive/v2/files',
        'method': 'POST',
        'params': {'uploadType': 'multipart', convert: true},
        'headers': headers,
        'body': multipartRequestBody});
    request.execute(function(res){
        if(res.id){
            Experiments.update(eid,{$set: {gdrive_id: res.id}});
            var url = 'https://drive.google.com/spreadsheets/d/' + res.id;
            callback({url: url,success:true, id:res.id});
        }else{
            callback({success: false, error: 'Insert failed.'});
        }
    });
};

myFunc = function(res){
    console.log('myFunc!!', res);
}

mkCsv = function(eid){
    var exp = Experiments.findOne(eid);
    if(!exp) return null;

    var runs = getExpRuns(eid).fetch();

    var data = getTableData(exp,runs,[],[]);
    var cols = colNames(runs);
    var d2 = addHeaderCells(data, colNames(runs), rowNames2(exp));
    console.log(data,d2);
    var str = _.map(d2,function(row){
       return _.map(row,function(s){
           return (s ? s.replace(',','_').replace('"','').replace("'",'') : '') + ',';
       }).join('') + '\r\n  ';
//           return s ? s.replace(',',"\,").replace('"','\\"').replace("'","\\''") +',' : ',';}).join('') + '\r\n  ';
    }).join('');
//    console.log(str);
    return 'Generated by https://labnote.meteor.com/'+'\r\n'+
        'Experiment,'+exp.name+','+moment(exp.date).format('M/D/YYYY')+'\r\n'+
        'Exported time,'+moment().format('M/D/YYYY HH:mm:ss')+'\r\n' +
        (exp.locked ? 'Experiment finished (data frozen)' : '') + '\r\n'+
        '\r\n' +
        'Samples\r\n' +
        '\r\n' +
        'Steps\r\n' +
        str;
}

addHeaderCells = function(data,cols,rows){
  var d2 = [['Step','Property'].concat(cols)];
    console.log(cols,d2);

    var d3 = d2.concat(_.map(data,function(r,i){
        var prop = rows[i].prop + (rows[i].plan ? ': plan' : '') + (rows[i].actual ? ': actual' : '');
        return [rows[i].op, prop].concat(r);
    }));
    return d3;
};