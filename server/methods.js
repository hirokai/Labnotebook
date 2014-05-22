/**
 * TODO support other encodings:
 * http://stackoverflow.com/questions/7329128/how-to-write-binary-data-to-a-file-using-node-js
 */
Meteor.methods({
    saveFile: function (blob, name, path, encoding) {
        //var path = Npm.require('path');

        var path = cleanPath(path), fs = Npm.require('fs'),
            name = cleanName(name || 'file'), encoding = encoding || 'binary',
            chroot = Meteor.chroot || 'uploaded~';
        // Clean up the path. Remove any initial and final '/' -we prefix them-,
        // any sort of attempt to go to the parent directory '..' and any empty directories in
        // between '/////' - which may happen after removing '..'
        path = chroot + (path ? '/' + path + '/' : '/');

        // TODO Add file existance checks, etc...
//     var pathtosave = path + name;
//      var pathtosave = "/Users/hiroyuki/Documents/labnote/public/test"
        var pathtosave = '/Users/hiroyuki/Documents/labnote/' + path + name;
        console.log(pathtosave);
        fs.writeFile(pathtosave, blob, encoding, function (err) {
            if (err) {
                throw (new Meteor.Error(500, 'Failed to save file.', err));
            } else {
                console.log('The file ' + name + ' (' + encoding + ') was saved to ' + path);
            }
        });

        function cleanPath(str) {
            if (str) {
                return str.replace(/\.\./g, '').replace(/\/+/g, '').
                    replace(/^\/+/, '').replace(/\/+$/, '');
            }
        }

        function cleanName(str) {
            return str.replace(/\.\./g, '').replace(/\//g, '');
        }
    },
    currentUser: function () {
        var u = Meteor.users.findOne(Meteor.userId());
        var g = u ? Meteor.users.findOne(Meteor.userId()).services.google : null;
        if (g) {
            var name = g.name;
            var email = g.email;
//      console.log(u,g,name,email);
//            return (name && email) ? {name: name, email: email, first_name: g.given_name, last_name: g.family_name, google: g} : null;
            return {name: name, email: email, first_name: g.given_name, last_name: g.family_name, google: g};
        } else {
            if(!u){
                console.log('currentUser(): User not found.')
            }else{
                console.log('currentUser(): Google not found.')
            }
            return null;
        }
//      return Meteor.userId();
    },
    resetMyDB: function () {
        initializeDB(Meteor.userId());
    },
    removeMyAccount: function () {
        removeUser(Meteor.userId());
    },
    verifyMyDB: function(){
        return verifyDB(Meteor.userId());
    },
    freezeExp: function(eid){
        doFreezeExp(eid);
    },
    unfreezeExp: function(eid){
        doUnfreezeExp(eid);
    },
    // In your server code: define a method that the client can call
    sendLogByEmail: function () {
        try {
            this.unblock();
            var obj = dump_allmydb(Meteor.userId());
            var jsonstr = JSON.stringify(obj);
            var email = Meteor.user().services.google.email;
            var name = Meteor.user().services.google.name;

            var str = "The following data is the dump of database generated by http://labnote.meteor.com\n"
                + "User: " + name + " (" + email + ")\n"
                + "Date and time: " + moment().format('YYYY-MM-DD hh:mm:ss Z') + "\n"
                + "Database version: 0.1    \n"
                + "------------------\n";
            str += jsonstr;

            Email.send({
                to: email,
                from: email,
                subject: "Labnote Log",
                text: str
            });
        } catch (e) {
            console.log(e);
            return {success: false, error: JSON.stringify(e)};

        }
        return {success: true};

    },
//    dumpDBOnServer: function(){
//        dumpDBToGDrive(function(res){
//            console.log(res);
//        });
//    },
    getJSONOfWholeDB: function(){
        var obj = dump_allmydb(Meteor.userId());
        return JSON.stringify(obj);
    },
    calendarTest: function(a,b,c,d){
        gCal.insertEvent(a,b,c,d);
    },
    getGoogle: function(){
       var u = Meteor.user();
       return u ? (u.services ? u.services.google : null) : null;
    }
});


doUnfreezeExp = function(eid){
    console.log('Unfreezing: ' + eid);
    var uid = Meteor.userId() || 'sandbox';
    ExpRuns.find({owner: uid, exp: eid}).forEach(function(run){
        ExpRuns.update(run._id, {$set: {locked: false}});
    });
    var opids = Experiments.findOne(eid).protocol.operations;
    _.map(opids,function(opid){
        Operations.update(opid,{$set: {locked: false}});
    });
    Experiments.update({owner: uid, _id: eid},{$set: {locked: false}});
};

doFreezeExp = function(eid){
    var uid = Meteor.userId() || 'sandbox';
    ExpRuns.find({owner: uid, exp: eid}).forEach(function(run){
        ExpRuns.update(run._id, {$set: {locked: true}});
    });
    var opids = Experiments.findOne(eid).protocol.operations;
    _.map(opids,function(opid){
        Operations.update(opid,{$set: {locked: true}});
    });
    Experiments.update({owner: uid, _id: eid},{$set: {locked: true}});
};
