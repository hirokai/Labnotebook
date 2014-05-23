Template.top_bar.userId = function () {
    return Meteor.userId();
};

Template.top_bar.localhost = function() {
    return Meteor.settings.public.localhost;
};

Template.top_bar.user = function () {
    //console.log(Meteor.user());
    Meteor.call('currentUser', function (err, user) {
        Session.set('currentUser', user);
        cfg = Config.findOne();
        if(user.email && cfg && !cfg.values.logemail){
            Config.update(cfg._id,{$set: {'values.logemail': user.email}});
        }
    });
    return Session.get('currentUser');
};

Template.layout.rendered = function(){
    Config.find({},{fields: {'values.logemail_interval_hours': true, 'values.logemail_auto': true}}).observeChanges({
        changed: function(id,fields){
            console.log(id,fields);
            var hours = fields.values.logemail_interval_hours;
            var auto = fields.values.logemail_auto;
            if(!auto){
                Meteor.call('stopAutoBackup', Meteor.userId());
            }else{
                Meteor.call('setupAutoBackup',Meteor.userId(),hours);
            }
        }
    });
//    console.log(Config.find({},{limit: 1, fields: {'values.logemail_interval_hours': true, 'values.logemail_auto': true}}).fetch());
};

Template.top_bar.loggedin = function () {
    return !!Meteor.userId();
//    //   console.log(Meteor.user());
//    Meteor.call('currentUser', function (err, user) {
//        Session.set('currentUser', user);
//    });
//    return Session.get('currentUser') != null;
};

Template.layout.config = function(){
  return Config.findOne();
};

Template.layout.loginShown = function(){
  return !Meteor.userId() && Accounts.loginServicesConfigured();
};

Template.layout.email = function () {
    var user = Session.get('currentUser');
    return user ? user.email : null;
};

Template.layout.config = function () {
    var cfg = Config.findOne();
    return cfg ? cfg.values : {};
};

Template.layout.is_logemail_auto = function () {
    var cfg = Config.findOne();
    return (cfg && cfg.values.logemail_auto) ? 'checked' : '';
}


Template.layout.loggedin = function () {
    //   console.log(Meteor.user());
    Meteor.call('currentUser', function (err, user) {
        Session.set('currentUser', user);
    });
    return Session.get('currentUser') != null;
};


Template.layout.events({
    'click #resetdb': function () {
        if (window.confirm("Are you sure you want to reset your data? (This does not affect other users' database.)")) {
            Meteor.call('resetMyDB');
        }
    },
    'click #verifydb': function() {
        Meteor.call('verifyMyDB',function(err,res){
            console.log(res);
            if(res.success){
                window.alert('Verification done. No error in DB found.');
            }else{
                window.alert('Verification done. DB Error: '+res.message);
            }
        });
    },
    'click #removeuser': function () {
        if (window.confirm("Are you sure you want to remove your account. This will remove all your data from the server.")) {
            Meteor.call('removeMyAccount');
            Meteor.logout();
        }
    },
    'click #showprefs': function () {
        $('#prefs_modal').modal();
    },
    'click #showhelp': function () {
        $('#help_modal').modal();
    },
    'click #dumpdb': function () {
        showMessage('Exporting database to Google Drive...',10000);
        dumpDBToGDrive(Meteor.userId(), function(res){
            if(res.url){
                showMessage('All database was exported to : <a href="'+ res.url+'">Google Drive</a>');
                //    window.open(res.url);
                var cfg = Config.findOne();
                Config.update(cfg._id, {$set: {'values.lastBackupOn': moment().valueOf()}});
            }else{
                showMessage('Error during saving the exp.');
            }
        });
    },
    'click #logout': function(){
        Meteor.logout();
    },
    'click #logoutAllClients': function(){
        Meteor.call('logoutAll');
    },
    'click #loginButton': function(){
        Meteor.loginWithGoogle({
            requestPermissions: [
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/photos'
            ],
            requestOfflineToken: true
//            forceApprovalPrompt: true
        });
    },
    'click #senddb': function () {
        var user = Session.get('currentUser');
        var ft = moment().startOf('day').toDate().getTime() || (new Date().getTime() - 1000 * 60 * 60 * 24);
        var n = 10 - Logs.find({op: 'senddb', timestamp: {$gt: ft}}).count();
        if (user && user.email && window.confirm('Do you want to send the backup data to ' + user.email + '? You can ' +
            'send the log ' + n + ' more times today.')) {
            Meteor.call('sendLogByEmail', function (err, res) {
                console.log(err, res);
                if (res.success) {
                    showMessage('Email sent to ' + user.email);
                    addLog({op: 'senddb', type: 'database', id: null, params: {email_to: user.email}})
                } else {
                    showMessage('Error occured.')
                }
            });
        }
    },
    'click #cfg_save': function () {
        var cfg = Config.findOne();
        var value = cfg.values || {};
        value.logemail = $('#cfg_email').val();
        value.logemail_auto = $('#cfg_auto_backup').is(':checked');
        value.logemail_interval_hours = parseInt($('input[name=email]:checked', '#backup_freq').val());
        if (validConfig(value)) {
            console.log(value);
            Config.update(cfg._id, {$set: {values: value}});
            $('#prefs_modal').modal('hide');
        } else {
            window.alert('Not valid values.');
            console.log(value);
        }
//        console.log(Config.findOne(),cfg);
    }
});

Template.layout.freq_radio_checked = function(v){
     return v == this.logemail_interval_hours ? 'checked' : '';
};

function validConfig(cfg) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var int = cfg.logemail_interval_hours;
    return re.test(cfg.logemail) && int >= 1 && int <= 10000;
}