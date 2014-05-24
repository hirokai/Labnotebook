/**
 * Created with IntelliJ IDEA.
 * User: hiroyuki
 * Date: 4/30/14
 * Time: 4:14 PM
 * To change this template use File | Settings | File Templates.
 */
okCancelEvents = function(selector, callbacks) {
    var ok = callbacks.ok || function () {};
    var cancel = callbacks.cancel || function () {};

    var events = {};
    events['keydown '+selector] =
//    events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
        function (evt) {
           console.log(evt,evt.which);
            if (evt.type === "keydown" && evt.which === 27) {
                // escape = cancel
                cancel.call(this, evt);

            } else if (evt.type === "keydown" && evt.which === 13
                //|| evt.type === "focusout"
                ) {
                // blur/return/enter = ok/submit if non-empty
                var value = String(evt.target.value || "");
//                if (value)
                    ok.call(this, value, evt);
//                else
//                    cancel.call(this, evt);
            }else if(evt.type === "focusout"){
              //  cancel.call(this,evt);
            }else{
             //   evt.preventDefault();
            }
        };

    return events;
};


activateInput = function (input) {
    input.focus();
    input.select();
};

formatDateTime = function(v){
    if(!v){
        return null;
    }else{
        return moment(v).format('MM/DD/YYYY h:m:s');
    }
};

formatDate2 = function(d){
    if(d){
        return moment(d).format('MM/DD/YYYY');
    }else{
        return null;
    }
};

formatDate = function(d){
    if(d){
        return moment(d).format('M/D/YYYY');
    }else{
        return null;
    }
};


formatTime = function(v){
//    console.log(v);
    return moment(d).format('h:m:s');
};

guid = function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
};

// O(n^2)!!
sortById = function(arr,ids){
    var res = [];
    _.each(ids,function(id){
        res.push(_.findWhere(arr,{_id: id}));
    });
    return _.compact(res);
};

repeat = function(n,item){
    return _.map(_.range(0,n),function(){return item;});
};

getButton = function(el){
    var e = $(el);
    var ee = e.prop('tagName') == 'BUTTON' ? e : e.parent('button');
    return ee;
};

getParentOrSelf = function(el,tag){
    var e = $(el);
    var ee = e.prop('tagName') == tag ? e : e.parent(tag);
    return ee;
};


getCurrentExp = function(){
    var eid = getCurrentExpId();
    return eid ? Experiments.findOne(eid) : null;
};

getCurrentExpId = function(){
    return Session.get('current_view_id').exp;
};

getCurrentSample = function(){
    var id = getCurrentSampleId();
    return id ? Samples.findOne(id) : null;
};

getCurrentSampleId = function(){
    return Session.get('current_view_id').sample;
};

callAndShow = function(name){
    Meteor.call(name,function(err,res){console.log(err,res);});
}
