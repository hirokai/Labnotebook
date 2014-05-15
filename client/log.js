Template.log.date = function () {
    var ds = Session.get('current_view_id').log;
    return moment(ds, 'YYYYMMDD').format('M/D/YYYY');
//    return moment(new Date(this[0].timestamp)).format('M/D/YYYY')
};

Template.log.formatTime = function (timestamp) {
    return moment(new Date(timestamp)).format('H:mm\'ss"')
};

var opnametable = {
    'exp': {'new': function (log) {
        return 'New experiment: <a href="/exp/' + log.id + '">' + log.params.name + '</a>';
    },
        'insertop': 'Added operation to protocol',
        'cloneprotocol': 'Cloned protocol',
        'remove': 'Deleted experiment'},
    'protocol_sample': {'new': 'Added sample to exp protocol.',
        'delete': 'Deleted sample from protocol'},
    'run': {
        'remove': 'Deleted exp run',
        'updateparam': 'Changed a recorded parameter',
        'insert': 'Insert run to exp'
    },
    'op': {
        'remove': 'Removed operation from a protocol'
    },
    'database': {
        'senddb': 'Send the database by email'
    },
    'sample': {
        'insert': function (log) {
            return 'Added sample: <a href="/sample/' + log.id + '">' + log.params.name + '</a>'
        }
    },
    'type': {
        'insert': function (log) {
            return 'Added sample type: <a href="/type/' + log.id + '">' + log.params.name + '</a>';
        }
    }
};

Template.log.operation = function () {
    var obj = opnametable[this.type] ? opnametable[this.type][this.op] : null;
    var str = typeof obj == 'function' ? obj(this) : obj;
    str = str || (this.op + " " + this.type);
    return str;
};

Template.log.detail = function () {
    var str;
    try {
        if (this.op == 'insert' && this.type == 'sample') {
            str = '';
        } else if (this.op == 'updateparam' && this.type == 'run') {
            str = this.params.name + ": " +
                (this.params.oldval || 'N/A') + '&#8594;' + this.params.newval;
        } else if (this.type == 'class' && this.op == 'insert') {
            str = "";
        } else if (this.type == 'type' && this.op == 'insert') {
            str = "";
        } else if (this.type == 'op' && this.op == 'remove') {
            str = 'Exp:' + this.params.exp + ', Operation: ' + this.params.name;
        } else if (this.type == 'exp' && this.op == 'new') {
            str = '';
        } else if (this.op == 'newsampletoprotocol') {
            var exp = Experiments.findOne(this.params.to_id);
            str = 'Exp: <a href="/exp/' + this.params.to_id + '">' + (exp ? exp.name : "(no name)") + '</a>';
        } else {
            str = JSON.stringify(this.params)
        }
        return str;
    } catch (e) {
        return '';
    }
};

Template.log.rendered = function () {
    //ga('send', 'event', 'view', 'log', Meteor.userId(),Session.get('current_view_id').log);
};