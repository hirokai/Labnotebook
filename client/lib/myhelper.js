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
//    console.log(v);
    var d = new Date(v);
    var m = (d.getMonth() + 1);
    var day = d.getDate();
    var y = d.getFullYear();
    var ds = (m < 10 ? '0'+m : ''+m)+'/'+(day < 10 ? '0'+day : ''+day)+"/"+ y;
    var ts = ''+d.getHours()+ ':' + d.getMinutes() + "'" + d.getSeconds() + '"';
    return ds + ' ' + ts;
    }
};

formatDate2 = function(d){
    if(d){
    var date = new Date(d);
    var m = (date.getMonth() + 1);
    var d = date.getDate();
    var y = date.getFullYear();
    return (m < 10 ? '0'+m : ''+m)+'/'+(d < 10 ? '0'+d : ''+d)+"/"+ y;
    }else{
        return null;
    }
};

formatDate = function(d){
    if(d){
        var date = new Date(d);
        var m = (date.getMonth() + 1);
        var d = date.getDate();
        var y = date.getFullYear();
        return ''+m+'/'+d+"/"+ y;
    }else{
        return null;
    }
};


formatTime = function(v){
//    console.log(v);
    var d = new Date(v);
         return ''+d.getHours()+ ':' + d.getMinutes() + "'" + d.getSeconds() + '"';
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
