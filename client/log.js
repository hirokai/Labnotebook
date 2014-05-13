Template.log.date = function(){
    var ds = Session.get('current_view_id').log;
    return moment(ds,'YYYYMMDD').format('M/D/YYYY');
//    return moment(new Date(this[0].timestamp)).format('M/D/YYYY')
};

Template.log.formatTime = function(timestamp){
    return moment(new Date(timestamp)).format('H:mm\'ss"')
};

Template.log.operation = function(){
  var str;
  if(this.op == 'insert' && this.type == 'sample'){
    str = 'Added sample: <a href="/sample/'+this.id+'">'+this.params.name+'</a>';
  }else if(this.op == 'updateparam' && this.type == 'run'){
      str = 'Changed a recorded parameter';
  }else if(this.op == 'insert' && this.type == 'type'){
      str = 'Added sample type: <a href="/type/'+this.id+'">'+this.params.name+'</a>';
  }else if(this.op == 'newsampletoprotocol'){
      str = 'Added sample to exp protocol';
  }else if(this.type == 'exp' && this.op == 'new'){
      str = 'New experiment: <a href="/exp/'+this.id+'">'+this.params.name+'</a>';
  }else if(this.type == 'op' && this.op == 'remove'){
      str = 'Removed operation from a protocol'
  }else{
    str = this.op + " " + this.type;
  }
  return str;
};

Template.log.detail = function(){
  var str;
    try{
  if(this.op == 'insert' && this.type == 'sample'){
    str = '';
  }else if(this.op == 'updateparam' && this.type == 'run'){
      str = this.params.name + ": " +
          (this.params.oldval || 'N/A')+ '&#8594;' + this.params.newval;
  }else if(this.type == 'class' && this.op == 'insert'){
      str = "";
  }else if(this.type == 'type' && this.op == 'insert'){
      str = "";
  }else if(this.type == 'op' && this.op == 'remove'){
      str = 'Exp:' + this.params.exp + ', Operation: '+ this.params.name;
  }else if(this.type == 'exp' && this.op == 'new'){
      str = '';
  }else if(this.op == 'newsampletoprotocol'){
      var exp = Experiments.findOne(this.params.to_id);
      str = 'Exp: <a href="/exp/'+this.params.to_id+'">'+(exp ? exp.name : "(no name)")+'</a>';
  }else{
    str = JSON.stringify(this.params)
  }
  return str;
    }catch(e){
        return '';
    }
};

Template.log.rendered = function(){
    //ga('send', 'event', 'view', 'log', Meteor.userId(),Session.get('current_view_id').log);
};