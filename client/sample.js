Template.sample.loggedin = function () {
    //   console.log(Meteor.user());
    Meteor.call('currentUser', function (err, user) {
        Session.set('currentUser', user);
    });
    return Session.get('currentUser') != null;
};


Template.sample.typeclasses = function () {
    var ids = SampleTypes.findOne(this._id).classes || [];
//    console.log(this._id,ids,SampleTypes.findOne(this._id));
    var r = TypeClasses.find({_id: {$in: ids}});
    return r;
}

Template.sample.sampletype = function () {
    return SampleTypes.findOne(this.sampletype_id);
};

Template.sample.classes = function () {
    var st = SampleTypes.findOne(this.sampletype_id);
    return st ? TypeClasses.find({_id: {$in: st.classes}}) : null;
};

Template.sample.made_exp = function(){
    var run = findRunWithSampleAsOutput(this._id);
    return run ? Experiments.findOne(run.exp) : null;
};

//https://gist.github.com/dariocravero/3922137

Template.sample.events({
    'click #savesamplenote': function (evt, tmpl) {
        var note = tmpl.find('#samplenote').value;
        //var note = editor.getElement('editor').body.innerHTML;
        setSampleNote(this._id,note,function(err,res){
            if(err){
                window.alert(err.message);
            }else{
            }
        });
    },
    'click #cancelsamplenote': function (evt, tmpl) {
        var note = Samples.findOne(this._id).note || "";
        tmpl.find('#samplenote').value = note;
    },
    'click #deletesample': function () {
        if (sampleNotUsedAtAll(getCurrentSampleId())) {
            Samples.remove(this._id);
            var pos = findSamplePosInList(this._id);
            console.log(Samples.find({}, {skip: Math.max(0, pos - 1), limit: 1}).fetch());
            var s = Samples.find({}, {skip: Math.max(0, pos - 1), limit: 1})[0]._id;
            Router.go('sample', {_id: s});
        }
    },
//    'click #renamesample': function () {
//        var name = Samples.findOne(this._id).name;
//        var newname = window.prompt("Enter a new name.", name);
//        setSampleName(this._id, newname);
//    },
//    'click #addtypeclass': function (evt, tmpl) {
//        var name = tmpl.find('#nametypeclass').value;
//        var id = newTypeClass(name);
//        Samples.update(this._id, {$push: {classes: id}});
//    },
    'dblclick #sampletitle': function (evt, tmpl) {
        Session.set('editing_sample_title', true);
        Deps.flush(); // force DOM redraw, so we can focus the edit field
        activateInput(tmpl.find("#sampletitle_input"));
    },
    'click #dropbox' : function(e){
        e.preventDefault();
        Dropbox.choose({
            linkType: "preview",
            multiselect: true,
            success: function(files) {
                _.map(files,function(file){
                    addSampleData(getCurrentSampleId(),'dropbox',file.link, file.name, file.icon);
                });
            },
            cancel:  function() {}
        });
    },
    'click #gdrive': function(){
        createPicker();
    },
    'change #localfile': function(evt){
        var f = evt.target.files[0];
        console.log(f);
        var reader = new FileReader();
        reader.onload = function(res){
            console.log(res);
        };
        reader.readAsBinaryString(f);
    },
    'dragover #localfile': function(evt){
        evt.preventDefault();
    },
    'dragenter #localfile': function(evt){
        $(evt.target).addClass('dragover');
    },
    'dragleave #localfile': function(evt){
        $(evt.target).removeClass('dragover');
    },
    'drop #localfile': function(evt){
        evt.preventDefault();
        evt.stopPropagation();

        console.log(evt);

        var file = evt.originalEvent.dataTransfer.files[0],
            reader = new FileReader();
        reader.onload = function (event) {
            console.log(event.target);
//            holder.style.background = 'url(' + event.target.result + ') no-repeat center';
        };
        console.log(file);
        reader.readAsDataURL(file);

        return false;
    },
    'click .unlink_data': function(evt){
        var sid = getCurrentSampleId();
        var url = $(evt.target).attr('data-url');
        removeSampleData(sid,url);
    }
});

Template.sample.data_where = function(d){
    var d = this;
    return d.type == 'dropbox' ? 'Dropbox' : (d.type == 'gdrive' ? 'Google Drive' : '');
};

Template.sample.formatDate = function (d) {
    return formatDate(d);
}

Template.sample.sample_not_used = function () {
    return sampleNotUsedAtAll(this._id);
};

Template.sample.exps_used = function () {
    var runs = ExpRuns.find({samplelist: this._id});
    var eids = _.uniq(runs.map(function (run) {
        return run.exp;
    }));
    return Experiments.find({_id: {$in: eids}});
}

var editor;
Template.sample.rendered = function () {
    //ga('send', 'event', 'view', 'sample', Meteor.userId(),getCurrentSampleId());
    var self = this;

    var scr = document.createElement('script');
    scr.setAttribute('data-app-key',Meteor.settings.public.dropbox.api_key);
    scr.setAttribute('type','text/javascript');
    scr.setAttribute('id','dropboxjs');
    scr.setAttribute('src',"https://www.dropbox.com/static/api/2/dropins.js");
    document.body.appendChild(scr);
//
//    if(editor){
//        console.log('Unloading EpicEditor');
//        editor.unload();
//    }
//    editor = new EpicEditor({
//        container: 'samplenote',
//        basePath: '',
//        button: {fullscreen: false},
//        theme: {editor: 'themes/editor/epic-light.css'}
//    }).load();

    self.node = self.find("#sample_graph");
    if (!self.handle) {
        self.handle = Deps.autorun(function () {


            drawSampleGraph();
            var wrapper = $('#sample_graph_wrapper');
            var setSize = function (el) {
            };
            wrapper.resizable({
                maxHeight: 1000,
                maxWidth: 450,
                minHeight: 100,
                minWidth: 100,
                resize: function (evt) {
                    setSize($(evt.target));
                }
            });
//            wrapper.width(500);
//            wrapper.height(300);
            setSize(wrapper);
        });
    }
};

Template.sample.editing_title = function () {
    return  Session.get('editing_sample_title');
};

Template.sample.events(okCancelEvents(
    '#sampletitle_input',
    {
        ok: function (value) {
            var sid = getCurrentSampleId();
            setSampleName(sid,value,function(err,res){
                if(err){
                    window.alert(err.message);
                }else{
                    Session.set('editing_sample_id', null);
                }
            });
        },
        cancel: function () {
            Session.set('editing_sample_title', false);
        }
    }));


function drawSampleGraph(){
    var svg = d3.select("#sample_graph");
    var first;
//    if(svg.selectAll('g').length == 0){
//        first = true;
//    }else{
//        svg.html('');
////        console.log(translate);
//    }

    var graph = genGraphvizSampleGraph();
    if(!graph) {
        console.log('Graph making failed.')
        return;
    }

    var g;
    var renderer = new dagreD3.Renderer();

    if (svg.selectAll('g.dagre')[0].length == 0) {
        g = svg.append('g').attr('class', 'dagre');
        //    svg.attr('transform',defaultTransform());
        // var exp = getCurrentExp();
        var gr = {translate: null, scale: null}; // exp.view ? exp.view.graph;
        translate = gr.translate || defaultTranslateSampleGraph();
        scale = gr.scale || defaultScale();
        first = true;
    } else {
        g = svg.select("g.dagre");
        //  svg.attr('transform',defaultTransform());
    }

    var layout = renderer.run(graph, g);

    if(first){
        translate = gr.translate || defaultTranslateSampleGraph();
        scale = gr.scale || defaultScale();
    }
    console.log(translate,scale);


        svg.selectAll('g.node div.id_in_graph').on('mousedown', mouseDownSampleGraph);
        svg.selectAll('g.node div.id_in_graph').on('dblclick', dblclickSampleGraph);
        svg.selectAll('g.edgeLabel div.id_in_edge').on('mousedown', mouseDownEdgeSampleGraph);

  //  g.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
  //  console.log(translate,scale);
        var zm = d3.behavior.zoom().scaleExtent([0.2, 1.5]).scale(scale).translate(translate).on("zoom", redrawSampleGraph);
    d3.event = {translate: translate,scale: scale};
    redrawSampleGraph();
//    var g = svg.select('g.dagre');
    svg.call(zm);
// .on('zoom.dblclick',null);

}


function redrawSampleGraph() {
//    console.log("here", d3.event.translate, d3.event.scale);
    var g = d3.select('#sample_graph g.dagre');
    translate = d3.event.translate;
    scale = d3.event.scale;
    return g.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
//    return g.attr("transform", "scale(" + d3.event.scale + ") translate("+tl[0]+","+tl[1]+")");
}

var translate;
var scale;

resetSampleGraphZoom = function(){
    translate = null;
    scale = null;
    //graphOffset = {x: 100, y: 100};
}

function genGraphvizSampleGraph() {
    var sample = getCurrentSample();
    if(!sample) return null;
    var sid = sample._id;

    var graph = new dagreD3.Digraph();
    var runs = ExpRuns.find({samplelist: sample._id});

    var tree_input = mkSampleTree(sid, true, 30);
//    console.log(tree);
    addNodesByTree(graph, true, tree_input);
    addEdgesByTree(graph, true, tree_input);

    var tree_output = mkSampleTree(sid, false, 30);
//    console.log(tree);
    addNodesByTree(graph, false, tree_output,true);
    addEdgesByTree(graph, false, tree_output);
    return graph;
}

function mkSampleTree(sid, for_input, depth) {
    if(depth <= 1){
        return {node: sid, depthlimit: true};
    }
    var run = for_input ? findRunWithSampleAsOutput(sid) : findRunWithSampleAsInput(sid);
    if(run){
        var exp = Experiments.findOne(run.exp);
        var sids = for_input ? findInputsOfRun(run,exp) : findOutputsOfRun(run,exp);
        sids = _.difference(sids,sid);  // some bug.
//        console.log(run,sids)
        return {node: sid, exp: exp._id, subtree: _.map(sids,function(sid){return mkSampleTree(sid,for_input,depth-1)})};
    }else{
        return {node: sid, nosubtree: true};
    }
}

function addNodesByTree(graph, for_input, tree,root){
    try{
        var s = Samples.findOne(tree.node);
        if(!root)
            var l = "<div style='padding: 10px;' class='id_in_graph' data-id='" + s._id + "'>" + s.name + "</div>";
        try{
            graph.addNode(tree.node,{label: l});
        }catch(e){
            console.log(e);
        }
        if(tree.subtree){
            _.map(tree.subtree,function(p){addNodesByTree(graph,for_input,p,false)});
        }

    }catch(e){
        console.log(e);
    }
}

function addEdgesByTree(graph, for_input, tree){
    try{
        var s = Samples.findOne(tree.node);
        if(tree.subtree){
            _.map(tree.subtree,function(p){
                var e = Experiments.findOne(tree.exp);
                var l = "<div style='padding: 5px;font-size: 10px;' class='id_in_edge' data-id='" + e._id + "'>" + e.name + "</div>";
                for_input ? graph.addEdge(null,p.node,tree.node,{label: l}) : graph.addEdge(null,tree.node,p.node,{label: l});
                addEdgesByTree(graph,for_input, p)
            });
        }

    }catch(e){
        console.log(e);
    }
}

function dblclickSampleGraph(){
    var sid = $(d3.event.target).attr('data-id');
    console.log(sid,Session.get('selected_nodes'));
    Router.go('sample',{_id: sid});
    d3.event.preventDefault();
}

function mouseDownSampleGraph() {
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

function mouseDownEdgeSampleGraph() {
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

var defaultScale = function () {
    return 1;
}

defaultTranslateSampleGraph = function () {
    var bbox = document.querySelector('g.dagre').getBBox();
    var sc = defaultScale();
    var el = $('#exp_graph');
    var w = 400; // el.width();
    var h = 300; //el.height();
    console.log(sc,w,bbox.width,h,bbox.height);
    return [ w/2 - sc * bbox.width / 2 - 10,h/2 - sc * bbox.height / 2 - 10];
//    return [0,0];
};


// Create and render a Picker object for picking user Photos.
function createPicker() {
    Meteor.call('getGoogle',function(err,res){
        if(err) {
            console.log('Error in Google Auth');
            console.log(err);
            return;
        }
        console.log(res);
        gapi.load('picker', {'callback': function(){
            var oauthToken = res.accessToken;
            var developerKey = Meteor.settings.public.gdrive.developer_key;
            gapi.client.setApiKey(developerKey);
            console.log(oauthToken,developerKey);
            if (oauthToken) {
                var docsView = new google.picker.DocsView().setIncludeFolders(true).setSelectFolderEnabled(true);
                var picker = new google.picker.PickerBuilder().
                    addView(docsView).
//                    addView(google.picker.ViewId.FOLDERS).
                    addView(google.picker.ViewId.PHOTOS).
                    enableFeature(google.picker.Feature.MULTISELECT_ENABLED).
                    setOAuthToken(oauthToken).
                    setDeveloperKey(developerKey).
                    setCallback(pickerCallback).
                    build();
                picker.setVisible(true);
            }
        }});
    });
}

// A simple callback implementation.s
function pickerCallback(data) {
    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
        var docs = data[google.picker.Response.DOCUMENTS];
        console.log(docs);
        _.map(docs,function(doc){
            var url = doc[google.picker.Document.URL];
            if(url){
                addSampleData(getCurrentSampleId(),'gdrive',file.link, file.name, file.icon, doc.id);
//                console.log(getCurrentSample());
            }
        });
    }
}
