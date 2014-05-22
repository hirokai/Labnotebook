var defaultScale = function () {
    var len = findProtocolSamplesInExp(getCurrentExpId()).length;
    var bbox = document.querySelector('#exp_graph g.dagre').getBBox();
    //console.log(bbox);
    if (bbox.width > 0 && bbox.height > 0) {
        var v = Math.min(250 / bbox.width, 450 / bbox.height, 2);
        return v;
    } else {
        if (len <= 6) {
            return 1;
        } else {
            return 0.5;
        }
    }
}

defaultTranslateExpGraph = function () {
    var bbox = document.querySelector('g.dagre').getBBox();
    var sc = defaultScale();
    var el = $('#exp_graph');
    var w = 300; // el.width();
    var h = 509; //el.height();
    console.log(sc,w,bbox.width,h,bbox.height);
    return [ w/2 - sc * bbox.width / 2 - 10,h/2 - sc * bbox.height / 2 - 10];
//    return [0,0];
};

var currentScale = 1;

var defaultTransform = function () {
    var sc = defaultScale();
    var tl = defaultTranslateExpGraph();
    return 'scale(' + sc + ') translate(' + tl[0] + ',' + tl[1] + ')';
};

Template.d3graph.rendered = function () {
//    renderGraphOld(); //force directed graph
    //console.log('rendered called');
    var self = this;
    self.node = self.find("svg");
    if (!self.handle) {
        self.handle = Deps.autorun(function () {
            var eid = getCurrentExpId();
            //    var ops = eid ? Operations.find({exp_id: eid}).fetch() : [];
            try {
                var graph = mkDagreGraph();
                if (graph) {
                    tryDraw(graph);
                }
            } catch (e) {
                console.log(e);
            }
            var wrapper = $('#exp_graph_wrapper');
            wrapper.resizable({
                maxHeight: 1000,
                maxWidth: 800,
                minHeight: 100,
                minWidth: 100,
                resize: function (evt) {
                    graphWrapperSizeChanged($(evt.target));
                }
            });
            var dim;
            var view = getCurrentExp().view;
            try{
                dim = view.graph;
            }catch(e){
                dim = {width: 300, height: 700};
            }
     //       var dim = self.data.view ? (self.data.view.graph) : null;
            console.log(dim,self);
//            dim = dim || {width: 300, height: 700};
            wrapper.width(dim.width);
            wrapper.height(dim.height);
//                div.style('left',w + 80);
            graphWrapperSizeChanged(wrapper);

          //  graphWrapperSizeChanged(wrapper,!view.panes.protocol);
        });
    }
};

toggleProtocol = function(isVisible){
    var wrapper = $('exp_graph_wrapper');
    if(isVisible){
        wrapper.show();
    }else{
        wrapper.hide();
    }
}

graphWrapperSizeChanged = function (el,invisible) {
    var div = $('#sampleandprotocol');
    var w;
    if(invisible){
        w = 0;
    }else{
        w = el.width();
    }
    console.log(w);
    div.css('left', w + 80);
    var h = $('#graph_buttons').height() + 73;
    $('#svgWrapper').height(el.height() - h);
    //resetExpGraphZoom();
};

Template.d3graph.disabled_if_locked = function () {
    return this.locked ? 'disabled' : '';
};

getProtocolEdges = function (eid) {
    var e = getCurrentExp();
    var ops = Operations.find({_id: {$in: e.protocol.operations}});
    //console.log(ops);
    var arrs = _.flatten(ops.map(function (op) {
        // stub this is direct product of inputs and outputs, which may be wrong....
        return _.map(op.input, function (from) {
            return _.map(op.output, function (to) {

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

Template.d3graph.shrink_nodes = function () {
    return Session.get('exp_graph_shrink') ? 'checked' : '';
};

Template.d3graph.twonodes_edit_disabled = function () {
    return (Session.get('selected_nodes').length == 2) ? '' : 'disabled';
};

Template.d3graph.onenode_edit_disabled = function () {
    return (Session.get('selected_nodes').length == 1) ? '' : 'disabled';
};

Template.d3graph.oneormorenode_edit_disabled = function () {
    return (Session.get('selected_nodes').length > 0) ? '' : 'disabled';
};

Template.d3graph.oneedge_edit_disabled = function () {
    return (Session.get('selected_edges').length == 1) ? '' : 'disabled';
};

hasNoRunSample = function(eid,psid) {
  var sids = _.compact(ExpRuns.find({exp: eid}).map(function(run){
     return run.samples[psid];
  }));
  return sids.length == 0;
};


function mkDagreGraph() {
    var eid = getCurrentExpId();
    var samples = findProtocolSamplesInExp(eid);
    var edges = getProtocolEdges(eid);
    var graph = new dagreD3.Digraph();
//    console.log(samples,edges);

    var shrink = Session.get('exp_graph_shrink');

    _.each(samples, function (s) {
        var l;
        if(shrink && !isInputOrOutputOfExp(Experiments.findOne(eid), s._id)){
            l = "<div style='padding: 8px;font-size: 14px;' class='id_in_graph' data-id='" + s._id + "'></div>";
        }else{
            l = "<div style='padding: 8px;font-size: 14px;' class='id_in_graph' data-id='" + s._id + "'>" + s.name + "</div>";
        }

        graph.addNode(s._id, {label: l, custom_id: s._id});
    });
    _.map(edges, function (e) {
        graph.addEdge(null, e.from._id, e.to._id, {label: "<div style='padding: 5px;font-size: 14px;' class='id_in_edge' data-id='" + e.id + "'>" + e.name + "</div>", custom_id: e.id});
    });
    return graph;
}

Template.d3graph.destroyed = function () {
    this.handle && this.handle.stop();
};

Template.d3graph.events({
    'click #insertnode': function () {
        var eid = getCurrentExpId();
        var sids = Session.get('selected_nodes');
        var exp = Experiments.findOne(eid);
        var s = newSampleToProtocol(eid, generalSampleType(), getNewSampleName(exp));
        var op = newOpToProtocol(eid, 'Step', [sids[0]], [s]);
        var op2 = newOpToProtocol(eid, 'Step', [s], [sids[1]]);
    },
    'click #connectnodes': function () {
        var eid = getCurrentExpId();
        var sids = Session.get('selected_nodes');
        var edges = getProtocolEdges(eid);
        var es = new Array(edges.length + 1);
        es[0] = [sids[0], sids[1]];
        //console.log(edges,es);
        for (var i = 0; i < edges.length; i++) {
            es[i + 1] = [edges[i].from._id, edges[i].to._id];
        }
        //console.log(edges,es);
        try {
            toposort(es);  //Not using the data, just to check acyclicness.
            var op = newOpToProtocol(eid, 'Step', [sids[0]], [sids[1]]);
        } catch (e) {
            //  console.log(e.message);
            if (window.confirm('The resulting flowchart will have a cyclic flow. Are you sure you want to connect them?')) {
                var op = newOpToProtocol(eid, 'Step', [sids[0]], [sids[1]]);
            }
        }
    },
    //Adding next step along with op.
    'click #addnextstepbtn': function () {
        var from = Session.get('selected_nodes')[0];
        var eid = getCurrentExpId();
        if (from && eid) {
            var sfrom = Samples.findOne(from);
            var exp = Experiments.findOne(eid);
            var to = newSampleToProtocol(eid, sfrom.sampletype_id, getNewSampleName(exp));
            var name = getNewStepName(exp);
            var op = newOpToProtocol(eid, name, [from], [to]);
            Session.set('selected_nodes', [to]);
            return op;
        } else {
            return null;
        }
    },
    'click #addprevstepbtn': function () {
        var to = Session.get('selected_nodes')[0];
        var eid = getCurrentExpId();
        if (to && eid) {
            var sto = Samples.findOne(to);
            var exp = Experiments.findOne(eid);
            var from = newSampleToProtocol(eid, sto.sampletype_id, getNewSampleName(exp));
            var name = getNewStepName(exp);
            var op = newOpToProtocol(eid, name, [from], [to]);
            Session.set('selected_nodes', [from]);
            return op;
        } else {
            return null;
        }
    },
    'dblclick g.node': function () {
        var sel = Session.get('selected_nodes')[0];
        if (!sel) return;

        var el = $('div[data-id=' + sel + ']');
        var w = Math.max(50, el.width() - 10);
        el.html('<input id="nodeedit_in_graph" type="text" style="width: ' + w + 'px;"/>');
        var txt = Samples.findOne(sel).name;

        Session.set('editing_node_in_graph', sel);

        $('#nodeedit_in_graph').on('keydown', function (evt) {
            // console.log(evt);
            if (evt.keyCode === 13) {
                if (!renameProtocolSample(sel, $(this).val())) {
                    window.alert('Name is not valid');
                    Session.set('editing_node_in_graph', null);
                    Deps.flush();
                }
                Session.set('editing_node_in_graph', null);
                sel = Session.get('selected_nodes')[0];
//                    el.html('');
            } else if (evt.keyCode === 27) {
                sel = Session.get('selected_nodes')[0];
                Session.set('editing_node_in_graph', null);
            }
        });
        $('input', el).val(txt).focus().select();


        event.preventDefault();
    },
    'click #resetzoom': function () {
//        resetZoom();
        resetExpGraphZoom();
    },
    'click #deselect': function(){
        Session.set('selected_nodes',[]);
    },
    'click #newsamplebtn': function (evt, tmpl) {
        var eid = getCurrentExpId();
        var sid = newSampleToProtocol(eid, generalSampleType(), getNewSampleName(this));
        Session.set('selected_nodes', [sid]);
    },
    'click #deletesamplebtn': function () {
        var sids = Session.get('selected_nodes');
        //Keep sample in DB.
        var eid = getCurrentExpId();
        _.map(sids,function(sid){
            deleteSampleFromProtocol(eid, sid);
        });
        Session.set('selected_nodes',[]);
    },
    'click #newinputbtn': function () {
        var edge = Session.get('selected_edges')[0];
        if (edge) {
            var sid = newSampleToProtocol(getCurrentExpId(), generalSampleType(), getNewSampleName(this));
            var opid = Operations.findOne(edge)._id;
            addNewInputToOp(opid, sid);
        }
    },
    'click #newoutputbtn': function () {
        var edge = Session.get('selected_edges')[0];
        if (edge) {
            var sid = newSampleToProtocol(getCurrentExpId(), generalSampleType(), getNewSampleName(this));
            var opid = Operations.findOne(edge)._id;
            addNewOutputToOp(opid, sid);
        }
    },
    'click #deleteopbtn': function () {
        var edge = Session.get('selected_edges')[0];
        removeOp(edge);
    },
    'change #shrink_nodes': function(evt){
        var checked = $(evt.target).is(':checked');
        Session.set('exp_graph_shrink',checked);
    }
});


tryDraw = function (graph) {
    //console.log('tryDraw() called.');

    Session.set('editing_node_in_graph', null);
    var result;
    //      result = graphlibDot.parse(code);
    if (graph) {
        //console.log(graph);

        // Cleanup old graph
        var svg = d3.select("#exp_graph");
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
        var first = false;
        if (d3.selectAll('#exp_graph g.dagre')[0].length == 0) {
            g = svg.append('g').attr('class', 'dagre');
            //    svg.attr('transform',defaultTransform());
            // var exp = getCurrentExp();
            var gr = {translate: null, scale: null}; // exp.view ? exp.view.graph;
            first = true;
        } else {
            g = svg.select("g.dagre");
            //  svg.attr('transform',defaultTransform());
        }
        var layout = renderer.run(graph, g);
        console.log(layout);
        possiblyUpdateRank(getCurrentExp(),layout);

//        console.log(ranks);
        svg.selectAll('g.node div.id_in_graph').on('mousedown', mouseDown);
        svg.selectAll('g.edgeLabel div.id_in_edge').on('mousedown', mouseDownEdge);

        var gr = {translate: null, scale: null}; // exp.view ? exp.view.graph;
        translate = translate || defaultTranslateExpGraph();
        scale = scale || defaultScale();

        console.log(defaultTranslateExpGraph());

        var zm = d3.behavior.zoom().scaleExtent([0.2, 1.5]).scale(scale || 1).translate(translate).on("zoom", redrawExpGraph);
           // .on('zoomend',zoomEnd(this));
        if(first){
            translate = gr.translate || defaultTranslateExpGraph();
            scale = gr.scale || defaultScale();
        }

        d3.event = {translate: translate,scale: scale};
        redrawExpGraph();
        svg.call(zm);
//        if(first){
//            resetZoom();
//        }
//        var zm2 = d3.behavior.zoom().scaleExtent([0.2, 1.5]).scale(scale || 1).translate(translate || [0,0]).on('zoom.2',zoomEnd);
  //      svg.call(zm2);
    }
};

var zm;

function resetZoom() {
    translate = defaultTranslateExpGraph();
    scale = defaultScale();
    d3.event = {translate: translate, scale: scale};
    var zm = d3.behavior.zoom().scaleExtent([0.2, 1.5]).scale(scale || 1).translate(translate || [0,0]).on("zoom", redrawExpGraph);
    d3.select('#exp_graph').call(zm);
    redrawExpGraph();
}

function zoomEnd(){
    console.log('hry');
//    var eid = getCurrentExpId();
//    Experiments.update(eid,{$set: {view: {graph: {translate:translate,scale: scale}}}});
}

getExpGraphView = function(){
    return {translate: translate, scale: scale};
}

function redrawExpGraph() {
//    console.log("here", d3.event.translate, d3.event.scale);
    var svg = d3.select('#exp_graph');
    var g = svg.select('g.dagre');
    // var tl = defaultTranslate();
    translate = d3.event.translate;
    scale = d3.event.scale;
    return g.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
//    return g.attr("transform", "scale(" + d3.event.scale + ") translate("+tl[0]+","+tl[1]+")");
}

var translate;
var scale;

resetExpGraphZoom = function(){
    translate = null;
    scale = null;
    var el = document.querySelector('g.dagre');
    var bbox = el ? el.getBBox() : null;
//    if(bbox && bbox.width > 0 && bbox.height > 0){
//        console.log('resetExpGraphZoom: graphOffset found.');
//        graphOffset = {x: bbox.width/2, y: bbox.height/2};
//    }else{
//        console.log('resetExpGraphZoom: graphOffset not found.');
//        graphOffset = {x: 0, y: 0};
//    }
}

var downx, downscalex = Math.NaN;

function mouseDown() {
    console.log(d3.event);
    if (d3.event.button != 0) return;

    if (d3.event.altKey) {
        return;
    }
//    console.log(event.target);
    var nodes = Session.get('selected_nodes') || [];

    var id = $(d3.event.target).attr('data-id');
    console.log(id,d3.event.target);
    if (Session.get('editing_node_in_graph')) {
        //console.log('clicked editing tag');
        return;
    }

    if (!d3.event.shiftKey) {
        nodes = [];
        Session.set('selected_edges', []);
        Session.set('selected_ops', []);
    }
    if (_.contains(nodes, id)) {
        nodes = _.without(nodes, id);
    } else {
        nodes.push(id);
    }
    //console.log(nodes);
    // console.log($(event.target).parent('div').length);
    d3.event.preventDefault();

    Session.set('selected_nodes', nodes);
    _.each(nodes, function (id) {
        //     $('g[data-id='+id+'] rect').addClass('selected');
    });
}

function mouseDownEdge() {
    if (d3.event.button != 0) return;

    if (d3.event.altKey) {
        return;
    }
//    console.log(event.target);

    var edges = Session.get('selected_edges') || [];

    var id = $(d3.event.target).attr('data-id');
//    console.log($(event.target).find('div.id_in_edge'));
//    console.log($(event.target).attr('data-id'));

    if (!d3.event.shiftKey) {
        edges = [];
        Session.set('selected_nodes', []);
        Session.set('selected_ops', []);
    }
    if (_.contains(edges, id)) {
        edges = _.without(edges, id);
    } else {
        edges.push(id);
    }
    var opids = edges;
    //_.uniq(_.map(edges,function(e){return Arrows.findOne(e).op;}));

    //Operations.findOne(Arrows.findOne(edges[0]).op)._id;
    Session.set('selected_ops', opids);

    Session.set('selected_edges', edges);
    d3.event.preventDefault();
    //   console.log(edges,opids,id);
}

function getNewSampleName(exp) {
    var sids = exp.protocol.samples;
    for(var i=1;i<1000;i++){
        var name = 'Sample ' + i;
        var s = Samples.findOne({_id: {$in: sids}, name: name});
        if(!s){
            return name;
        }
    }
}

function getNewStepName(exp) {
    var opids = exp.protocol.operations;
    for(var i=1;i<1000;i++){
        var name = 'Step ' + i;
        var op = Operations.findOne({_id: {$in: opids}, name: name});
        if(!op){
            return name;
        }
    }
}

function possiblyUpdateRank(exp,layout) {
    var sids = exp.protocol.samples;
    var opids = exp.protocol.operations;
    var updating = Samples.find({_id: {$in: sids}, rank: {$exists: true}}).count() <
        Samples.find({_id: {$in: sids}}).count()
        || Operations.find({_id: {$in: opids}, rank: {$exists: true}}).count() <
        Operations.find({_id: {$in: opids}}).count();
    if(updating){
        var ranks = {};
        _.map(layout._nodes, function(n,k){
            ranks[k] = n.value.rank;
            Samples.update(k,{$set: {rank: n.value.rank || 0}});
        });
        _.map(opids,function(opid){
            var op = Operations.findOne(opid);
            var rank = _.min(_.map(op.output,function(s){return ranks[s];}));
            Operations.update(opid,{$set: {rank: rank}});
        });
    }
}