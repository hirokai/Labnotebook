
Template.top_bar.userId = function(){
    return Meteor.userId();
};

Template.top_bar.user = function(){
    //console.log(Meteor.user());
    Meteor.call('currentUser',function(err,user){
        Session.set('currentUser',user);
    });
    return Session.get('currentUser');
};

Template.top_bar.loggedin = function(){
    //   console.log(Meteor.user());
    Meteor.call('currentUser',function(err,user){
        Session.set('currentUser',user);
    });
    return Session.get('currentUser') != null;
};


Template.layout.email = function(){
    var user = Session.get('currentUser');
    return user ? user.email : null;
};

Template.layout.config = function(){
    var cfg = Config.findOne();
    return cfg ? cfg.values : {};
};

Template.layout.is_logemail_auto = function(){
    var cfg = Config.findOne();
    return (cfg && cfg.values.logemail_auto) ? 'checked' : '';
}


Template.layout.loggedin = function(){
    //   console.log(Meteor.user());
    Meteor.call('currentUser',function(err,user){
        Session.set('currentUser',user);
    });
    return Session.get('currentUser') != null;
};


Template.layout.events({
    'click #resetdb': function(){
        if(window.confirm("Are you sure you want to reset your data? (This does not affect other users' database.)")){
            Meteor.call('resetMyDB');
        }
    },
    'click #removeuser': function(){
        if(window.confirm("Are you sure you want to remove your account. This will remove all your data from the server.")){
            Meteor.call('removeMyAccount');
            Meteor.logout();
        }
    },
    'click #showprefs': function(){
        $('#prefs_modal').modal();
    },
    'click #showhelp': function(){
        $('#help_modal').modal();
    },
    'click #dumpdb': function(){
        var owner = Meteor.userId() || 'sandbox';
        window.open('/alldb_dump/'+owner);
    },
    'click #senddb': function(){
        var user = Session.get('currentUser');
        var ft = moment().startOf('day').toDate().getTime() || (new Date().getTime() - 1000*60*60*24);
        var n = 10 - Logs.find({op: 'senddb',timestamp: {$gt: ft}}).count();
        if(user && user.email && window.confirm('Do you want to send the backup data to '+user.email+'? You can '+
            'send the log '+ n +' more times today.')){
            Meteor.call('sendLogByEmail',function(err,res){
                console.log(err,res);
                if(res.success){
                    showMessage('Email sent to '+user.email);
                    addLog({op: 'senddb', type: 'database', id: null, params: {email_to: user.email}})
                }else{
                    showMessage('Error occured.')
                }
            });
        }
    },
    'click #cfg_save': function(){
        var cfg = Config.findOne()
        var value = cfg.values || {};
        value.logemail = $('#cfg_email').val();
        value.logemail_auto = $('cfg_email_auto').is(':checked');
        if(validConfig(value)){
            Config.update(cfg._id,{$set: {values: value}});
            $('#prefs_modal').modal('hide');
        }else{
            window.alert('Not valid values.');
            console.log(value);
        }
//        console.log(Config.findOne(),cfg);
    }
});

function validConfig(cfg){
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(cfg.logemail);
}