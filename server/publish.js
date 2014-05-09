var allowObj = {
    insert: function (userId, doc) {
        // the user must be logged in, and the document must be owned by the user
        return (userId && doc.owner === userId) || (!userId && doc.owner === 'sandbox');
    },
    update: function (userId, doc, fields, modifier) {
        // can only change your own documents
        return doc.owner === userId || (!userId && doc.owner === 'sandbox');
    },
    remove: function (userId, doc) {
        // can only remove your own documents
        return doc.owner === userId || (!userId && doc.owner === 'sandbox');
    },
    fetch: ['owner']
};

var denyObj = {
    update: function (userId, docs, fields, modifier) {
        // can't change owners
        return _.contains(fields, 'owner');
    },
    remove: function (userId, doc) {
        // can't remove locked documents
        return doc.locked;
    },
    fetch: ['locked'] // no need to fetch 'owner'
};

Experiments = new Meteor.Collection("experiments");
Meteor.publish('experiments', function() {
    return Experiments.find({owner: this.userId || 'sandbox'});
});
Experiments.allow(allowObj);
Experiments.deny(denyObj);

ExpRuns  = new Meteor.Collection("expruns");
ExpRuns.allow(allowObj);
ExpRuns.deny(denyObj);
Meteor.publish('expruns', function(eid) {
	var obj = {};
	obj.owner = this.userId || 'sandbox';
	if(eid){
		obj.exp = eid;
	}
    return ExpRuns.find(obj,{sort: {timestamp: 1}});
});

// Presets -- {name: String}
Presets = new Meteor.Collection("presets");
Meteor.publish('presets', function() {
	return Presets.find({owner: this.userId || 'sandbox'});
});
Presets.allow(allowObj);
Presets.deny(denyObj);


// Samples -- {name: String,
//           timestamp: Number,
//            sampletype_id: String,
//            exp_ids: [String, ...]
//           tags: [String, ...]}
Samples = new Meteor.Collection('samples');
Meteor.publish('samples', function() {
    if(this.userId){
        //      console.log(isAdmin(this.userId));
        return Samples.find({owner: this.userId});
    }else{
        return Samples.find({owner: 'sandbox'});
    }
});
Samples.allow(allowObj);
Samples.deny(denyObj);


SampleTypes = new Meteor.Collection("sampletypes");
Meteor.publish('sampletypes', function() {
    if(this.userId){
  //      console.log(isAdmin(this.userId));
    	return SampleTypes.find({owner: this.userId});
    }else{
        return SampleTypes.find({owner: 'sandbox'});
    }
});
SampleTypes.allow(allowObj);
SampleTypes.deny(denyObj);

TypeClasses = new Meteor.Collection("typeclasses");
Meteor.publish('typeclasses', function() {
    if(this.userId){
        return TypeClasses.find({owner: this.userId});
    }else{
        return TypeClasses.find({owner: 'sandbox'});
    }
});
TypeClasses.allow(allowObj);
TypeClasses.deny(denyObj);

// Dates -- {name: String,
//			timestamp: Number}
Dates = new Meteor.Collection("dates");
Meteor.publish('dates', function() {
	return this.userId ? Dates.find({owner: this.userId}) : Dates.find({owner: 'sandbox'});
});
Dates.allow(allowObj);
Dates.deny(denyObj);

// Operations -- {name: String,
//          exp_id: [String, ...],
//			timestamp: Number}
Operations = new Meteor.Collection("operations");
Meteor.publish('operations', function() {
	return this.userId ? Operations.find({owner: this.userId}) : Operations.find({owner: 'sandbox'});
});
Operations.allow(allowObj);
Operations.deny(denyObj);


SampleGroups = new Meteor.Collection("samplegroups");
Meteor.publish('samplegroups', function() {
	return this.userId ? SampleGroups.find({owner: this.userId}) : SampleGroups.find({owner: 'sandbox'});
});
SampleGroups.allow(allowObj);
SampleGroups.deny(denyObj);

//
//Arrows = new Meteor.Collection("arrows");
//Meteor.publish('arrows', function() {
//    return this.userId ? Arrows.find({owner: this.userId}) : Arrows.find({owner: 'sandbox'});
//});
//Arrows.allow(allowObj);
//Arrows.deny(denyObj);


function isAdmin(uid){
    try{
        var u = Meteor.users.findOne(uid);
        return u ? u.services.google.email == 'hiroyuki.kai@gmail.com' : false;
    }catch(e){
        return false;
    }
}