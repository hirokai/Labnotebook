// copyright vida.io 2013
// source code license: BSD
// d3js library is from Mike Bostock

var defaultScale = function(){
    var len = findProtocolSamplesInExp(getCurrentExpId()).length;
    var bbox = document.querySelector('g.dagre').getBBox();
    //console.log(bbox);
    if(bbox.width > 0 && bbox.height > 0){
        var v = Math.min(200 / bbox.width,450 /bbox.height);
        return v;
    }else{
        if(len <= 6){
            return 1;
        }else{
            return 0.5;
        }
    }
}
var defaultTranslate = function(){
    var bbox = document.querySelector('g.dagre').getBBox();
    var sc = defaultScale();
    return [200-sc*bbox.width/2-10,300-sc*bbox.height/2-10];
};

var currentScale = 1;

var defaultTransform = function(){
    var sc = defaultScale();
    var tl = defaultTranslate();
    return 'scale('+sc+') translate('+tl[0]+','+tl[1]+')';
};

Template.d3graph.rendered = function () {
//    renderGraphOld(); //force directed graph
    //console.log('rendered called');
    var self = this;
    self.node = self.find("svg");
    if (!self.handle) {
        self.handle = Deps.autorun(function () {
            var eid = Session.get('current_view_id');
        //    var ops = eid ? Operations.find({exp_id: eid}).fetch() : [];
            var graph = genGraphvizGraph();
            if(graph){
                tryDraw(graph);
            }
        });
    }
};

getEdges = function(eid){
    var e = getCurrentExp();
    var ops = Operations.find({_id: {$in: e.protocol.operations}}).fetch();
    //console.log(ops);
    var arrs = _.flatten(_.map(ops,function(op){
        // stub this is direct product of inputs and outputs, which may be wrong....
        return _.map(op.input,function(from){
            return _.map(op.output, function(to){
                return {name: op.name, from: from, to: to, id: op._id};
            });
        });
    }));
    //console.log(arrs);
    var edges = _.map(arrs, function (ar) {
        var from = Samples.findOne(ar.from);
        var to = Samples.findOne(ar.to);
        return {id: ar.id, from: from, to: to, name: ar.name};
    });
//    console.log(edges);
    return edges;
};


Template.d3graph.twonodes_edit_disabled = function(){
    return (Session.get('selected_nodes').length == 2) ? '' : 'disabled';
};

Template.d3graph.onenode_edit_disabled = function(){
    return (Session.get('selected_nodes').length == 1) ? '' : 'disabled';
};

Template.d3graph.oneedge_edit_disabled = function(){
    return (Session.get('selected_edges').length == 1) ? '' : 'disabled';
};

function genGraphvizGraph(){
    var eid = Session.get('current_view_id');
    var samples = findProtocolSamplesInExp(eid);
    var edges = getEdges(eid);
    var graph = new dagreD3.Digraph();
//    console.log(samples,edges);
    _.each(samples,function(s){
        var l = "<div style='padding: 10px;' class='id_in_graph' data-id='"+s._id+"'>"+ s.name+"</div>";
      graph.addNode(s._id, {label: l, data_id: s._id});
    });
    _.map(edges,function(e){
        graph.addEdge(null, e.from._id, e.to._id, {label: "<div style='padding: 5px;font-size: 10px;' class='id_in_edge' data-id='"+e.id+"'>"+ e.name+"</div>"});
    });
    return graph;
}

Template.d3graph.destroyed = function () {
    this.handle && this.handle.stop();
};

Template.d3graph.twonodes_edit_disabled = function() {
//    console.log('template called...')
    return $('rect.selected').length == 2 ? '' : 'disabled';
};

Template.d3graph.onenodes_edit_disabled = function() {
//    console.log('template called...')
    return $('rect.selected').length == 1 ? '' : 'disabled';
};

Template.d3graph.events({
    'click #insertnode': function(){
        var eid = getCurrentExpId();
        var sids = Session.get('selected_nodes');
        var s = newSampleToProtocol(eid,generalSampleType(),'Sample');
        var op = insertOp(eid,'Step',[sids[0]],[s]);
        var op2 = insertOp(eid,'Step',[s],[sids[1]]);
    },
        'click #connectnodes': function(){
            var eid = Session.get('current_view_id');
            var sids = Session.get('selected_nodes');
            var edges = getEdges(eid);
            var es = new Array(edges.length + 1);
            es[0] = [sids[0],sids[1]];
            //console.log(edges,es);
            for(var i = 0; i< edges.length; i++){
                es[i+1] = [edges[i].from._id,edges[i].to._id];
            }
            //console.log(edges,es);
            try{
                toposort(es);  //Not using the data, just to check acyclicness.
                var op = insertOp(eid,'Step',[sids[0]],[sids[1]]);
            }catch(e){
              //  console.log(e.message);
                if(window.confirm('The resulting flowchart will have a cyclic flow. Are you sure you want to connect them?')){
                    var op = insertOp(eid,'Step',[sids[0]],[sids[1]]);
                }
            }
        },
    //Adding next step along with op.
    'click #addnextstepbtn': function(){
        var from = Session.get('selected_nodes')[0];
        var eid = Session.get('current_view_id');
        if(from && eid){
            var to = newSampleToProtocol(eid,generalSampleType(),'Sample');
            var op = insertOp(eid, 'Step',[from],[to]);
            Session.set('selected_nodes',[to]);
            return op;
        }else{
            return null;
        }
    },
    'click #addprevstepbtn': function(){
        var to = Session.get('selected_nodes')[0];
        var eid = Session.get('current_view_id');
        if(to && eid){
            var from = newSampleToProtocol(eid,generalSampleType(),'Sample');
            return insertOp(eid, 'Step',[from],[to]);
        }else{
            return null;
        }
    },
    'dblclick g.node': function(){
//            Session.set('editing_node_graph',$('div.id_in_graph',event.target).attr('data-id'));
            var sel = Session.get('selected_nodes')[0];
            if(!sel) return;

            var el = $('div[data-id='+sel+']');
            var w = Math.max(50,el.width() - 10);
            el.html('<input id="nodeedit_in_graph" type="text" style="width: '+w+'px;"/>');
            var txt = Samples.findOne(sel).name;

            Session.set('editing_node_in_graph',sel);

            $('#nodeedit_in_graph').on('keydown',function(evt){
               // console.log(evt);
                if(evt.keyCode === 13){
                    Samples.update(sel,{$set: {name: $(this).val()}});
                    Session.set('editing_node_in_graph',null);
                    sel = Session.get('selected_nodes')[0];
                    var name = Samples.findOne(sel).name;
                    //console.log(name);
                    el.html('');
                }else if(evt.keyCode === 27){
                    sel = Session.get('selected_nodes')[0];
                    var name = Samples.findOne(sel).name;
                    el.html(name);
                    Session.set('editing_node_in_graph',null);
                }
            });

//
//            Template.d3graph.events(okCancelEvents(
//                '#nodeedit_in_graph',
//                {
//                    ok: function (value) {
//                    },
//                    cancel: function () {
//                        el.html('hoge');
//                    }
//                }));

            $('input',el).val(txt).focus().select();



            event.preventDefault();
        },
    'click #resetzoom': function(){
        resetZoom();
    },
    'click #newsamplebtn': function(evt,tmpl){
        var eid = Session.get('current_view_id');
        var tid = SampleTypes.findOne({name: 'General sample'})._id;
        newSampleToProtocol(eid,tid,'Sample');
    },
    'click #importsamplebtn': function(evt,tmpl){
//        var eid = Session.get('current_view_id');
//        var tid = SampleTypes.findOne({name: 'General sample'})._id;
//        var sid = Samples.insert({owner: owner, sampletype_id: type_id, name: name, timestamp: new Date().getTime()});
//        Experiments.update(eid,{$push: {samples: sid}});
    },
    'click #deletesamplebtn': function(){
        var sid = Session.get('selected_nodes')[0];
        //Keep sample in DB.
        var eid = Session.get('current_view_id');
        Experiments.update(eid,{$pull: {'protocol.samples': sid}});
        removeOpsAboutSample(eid,sid);
    },
    'click #newinputbtn': function(){
        var edge = Session.get('selected_edges')[0];
        if(edge){
            var sid = newSampleToProtocol(getCurrentExpId(),generalSampleType(),'Sample');
            var opid = Operations.findOne(edge)._id;
            //console.log(sid,opid);
            Operations.update(opid,{$push: {input: sid}});
        }
    },
    'click #newoutputbtn': function(){
        var edge = Session.get('selected_edges')[0];
        if(edge){
            var sid = newSampleToProtocol(getCurrentExpId(),generalSampleType(),'Sample');
            var opid = Operations.findOne(edge)._id;
            //console.log(sid,opid);
            Operations.update(opid,{$push: {output: sid}});
        }
    }
});


tryDraw = function(graph) {
    //console.log('tryDraw() called.');

    Session.set('editing_node_in_graph',null);
  var result;
    //      result = graphlibDot.parse(code);
    if (graph) {
        //console.log(graph);

      // Cleanup old graph
      var svg = d3.select("svg");
       // svg.html('');

      var renderer = new dagreD3.Renderer();

      // Uncomment the following line to get straight edges
      //renderer.edgeInterpolate('linear');

      // Custom transition function
      function transition(selection) {
        return selection.transition().duration(500);
      }

      renderer.transition(transition);

        var g;
        if(d3.selectAll('svg g.dagre')[0].length == 0){
          g = svg.append('g').attr('class','dagre');
      //    svg.attr('transform',defaultTransform());
        }else{
          g = d3.select("svg g.dagre");
      //  svg.attr('transform',defaultTransform());
        }
      var layout = renderer.run(graph, g);
    //    console.log(layout);
        d3.selectAll('g.node div.id_in_graph').on('mousedown',mouseDown);
        var n = Session.get('editing_node_graph');
        //console.log('Hey',n);
        d3.selectAll('g.edgeLabel div.id_in_edge').on('mousedown',mouseDownEdge);

        //This assumes label is unique.
        var eid = Session.get('current_view_id');
        if(eid){
            var samples = findSamplesInExp(eid);
            _.each($('g.node'),function(el){
                var label = $(el).text();
                var id = _.findWhere(samples,{name: label});
                $(el).attr('data-label',label);
                $(el).attr('data-id',id ? id._id : null);
            });
        }
     //   myDraw(layout);

//      d3.select("svg")
//        .call(d3.behavior.zoom().scaleExtent([0.2,2])).on("mousedown.zoom", null);

//        d3.select("svg")
//            .call(d3.behavior.zoom()).on("zoom", function() {
//             // if(d3.event.button == 0 ){
//               var ev = d3.event;
//                console.log('hey');
//              svg.select("g.dagre")
//                .attr("transform", "translate(" + ev.translate + ") scale(" + ev.scale + ")");
//            });

        var svg = d3.select('svg');
        var g = d3.select('g.dagre');
//        zm =
//        if(zm){
//            svg.call(zm = d3.behavior.zoom().scaleExtent([0.2, 1.5]).scale(zm.scale()).on("zoom", redraw));
//        }else{
//            svg.call(zm = d3.behavior.zoom().scaleExtent([0.2, 1.5]).scale(defaultScale()).on("zoom", redraw));
//        }

      //  svg.attr('transform',defaultTransform());

      zm = d3.behavior.zoom().scaleExtent([0.2, 1.5]).scale(defaultScale()).on("zoom", redraw);
       svg.call(zm);

     //  svg.on("mousemove", null);

    }
};

var zm;

function resetZoom(){
    d3.select('svg').transition().duration(300).attr('transform',defaultTransform());
    zm.scale(defaultScale()).translate(defaultTranslate());
    svg.call(zm);
    //   redraw();
}

function redraw() {
//    console.log("here", d3.event.translate, d3.event.scale);
    var svg = d3.select('svg');
    var g = d3.select('g.dagre');
var tl = defaultTranslate();
    return g.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
//    return g.attr("transform", "scale(" + d3.event.scale + ") translate("+tl[0]+","+tl[1]+")");
}

var downx,downscalex = Math.NaN;

function mouseDown(){
    if(d3.event.button != 0) return;

    if(event.altKey){
        return;
    }
//    console.log(event.target);
    var nodes = Session.get('selected_nodes') || [];

    var id = $(event.target).attr('data-id');
    if(Session.get('editing_node_in_graph')){
        //console.log('clicked editing tag');
        return;
    }

    if(!event.shiftKey){
        nodes = [];
        Session.set('selected_edges',[]);
        Session.set('selected_ops',[]);
    }
    if(_.contains(nodes,id)){
        nodes = _.without(nodes,id);
    }else{
        nodes.push(id);
    }
    //console.log(nodes);
   // console.log($(event.target).parent('div').length);
    event.preventDefault();

    Session.set('selected_nodes',nodes);
    _.each(nodes,function(id){
   //     $('g[data-id='+id+'] rect').addClass('selected');
    });
}

function mouseDownEdge(){
    if(d3.event.button != 0) return;

    if(event.altKey){
        return;
    }
//    console.log(event.target);

    var edges = Session.get('selected_edges') || [];

    var id = $(event.target).attr('data-id');
//    console.log($(event.target).find('div.id_in_edge'));
//    console.log($(event.target).attr('data-id'));

    if(!event.shiftKey){
        edges = [];
        Session.set('selected_nodes',[]);
        Session.set('selected_ops',[]);
    }
    if(_.contains(edges,id)){
        edges = _.without(edges,id);
    }else{
        edges.push(id);
    }
    var opids = edges;
    //_.uniq(_.map(edges,function(e){return Arrows.findOne(e).op;}));

    //Operations.findOne(Arrows.findOne(edges[0]).op)._id;
    Session.set('selected_ops',opids);
    event.preventDefault();

    Session.set('selected_edges',edges);
 //   console.log(edges,opids,id);
}