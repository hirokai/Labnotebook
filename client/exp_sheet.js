var row_opids = [];
var row_paramnames = [];

renderCells = function (eid) {

//    console.log('renderCells()');
    if(!getCurrentExpId()) return;

    var experimentLocked;

    row_opids = [];
    row_paramnames = [];

    //You cannot use map of meteor cursor, because it will use up the collection and you can use it only once.
    var runs = ExpRuns.find({exp: eid}, {sort: {timestamp: 1}}).fetch();
    var runids = _.map(runs, function (run) {
        return run._id;
    });
    // console.log(runs,runids);

    var exp = getCurrentExp();
    experimentLocked = exp.locked;

    var dat = getTableData(exp,runs,row_opids,row_paramnames);
    var colnames = colNames(runs);

    $("#spreadsheet").handsontable('destroy');
        $("#spreadsheet").html('');

        $("#spreadsheet").handsontable({
        data: dat,
        manualColumnResize: true,
        startRows: 7,
        startCols: colnames.length,
        colWidths: [100,100].concat(_.map(_.range(0, runs.length), function () {
            return Math.max(80,500/runs.length);
        })),
//        rowHeaders: [],
        colHeaders: colnames,
        fixedColumnsLeft: 2,
        //   columns: cols(),
        cells: function (row, col, prop) {
            var cellProperties = {};
            if (row_paramnames[row] == '__time' && col >= 2) {
                cellProperties.readOnly = true;
                cellProperties.renderer = timeCellRenderer;
            }
            if(experimentLocked || (row_paramnames[row] != '__time' && col == 0)){
                cellProperties.readOnly = true;
            }
            if(row_paramnames[row] == '__time' && col == 0){
                cellProperties.renderer = stepNameColumnRenderer;
                cellProperties.readOnly = true;
            }
            if(row_paramnames[row] == '__time' && col == 1){
                cellProperties.readOnly = true;
            }
            return cellProperties;
        },
        afterChange: function (change, source) {
            if (source === 'loadData') {
                return; //don't save this change
            }
//            console.log(change,source);
            var opid = row_opids[change[0][0]];
            var paramname = row_paramnames[change[0][0]];
            var oldval = change[0][2];
            var newval = change[0][3];
            var n = paramname == '__time' ? 2 : 1;
            var runid = runids[change[0][1] - n];
            console.log(change, runid, opid, paramname, newval);
            updateDBAccordingToCell(runid, opid, paramname, newval, oldval);
        }
    });

    function bindDumpButton() {
        $('body').on('click', 'button[name=dump]', function () {
            var dump = $(this).data('dump');
            var $container = $(dump);
            //     console.log('data of ' + dump, $container.handsontable('getData'));
        });
    }

    bindDumpButton();

}

getTableData = function(exp,runs,row_opids,row_paramnames) {

//        console.log(exp.protocol.operations);
    var opids = exp.protocol.operations;
    var arr = Operations.find({_id: {$in: opids}},{sort: {rank: 1}}).map(function(op){
            var opid = op._id
            row_opids.push(opid);
            row_paramnames.push('__time');
            row_opids.push(opid);
            row_paramnames.push('__note');
            var pss = [[op.name,'Time'].concat(_.map(runs, function (run, idx) {
                //console.log(run,idx,opid);
                var t = getOpTimestamp(run._id, opid);
                return {time: t, exp_date: exp.date, run: run._id, op: opid};
            })
            )];
            pss = pss.concat([['Note'].concat(_.map(runs,function(run){
                return run.ops[opid] ? run.ops[opid].note : null;
            }))]);
            pss = pss.concat(_.flatten(_.map(op.params, function (param) {
                //Stub
                var rowplan = [param.name+': Plan'].concat(_.map(_.range(0,runs.length),function(i){return ''}));
                var rowactual = [param.name+': Actual'].concat(getRowData(exp._id, opid, param));
                row_opids.push(opid);
                row_paramnames.push("");
                row_opids.push(opid);
                row_paramnames.push(param.name);
//                console.log(row);
                return [rowplan,rowactual];
            }),true));
            return pss;
    });
    //    console.log(arr);
    return _.flatten(arr, true);
}

function getRowData(eid, opid, param) {
    var runs =  getExpRuns(eid);
    //   console.log(param);
    return runs.map(function (run, runidx) {
        return getOpParam(run._id, opid, param.name);
    });
}

colNames = function(runs){
    return ['',''].concat(runs.map(function (run) {
        return run.name;
    }));
}

rowNames = function(exp) {
    return _.map(rowNames2(exp),function(obj){return obj.op + ": <br>" + obj.prop + (obj.plan ? ': plan' : '') + (obj.actual ? ': actual' : '');});
}

//Structured version
rowNames2 = function(exp) {
    var opids = exp.protocol.operations;
    //A bit ad hoc...
    var ops = sortById(Operations.find({_id: {$in: opids}}).fetch(), opids);
//        var exp = getCurrentExp();
    var cs = _.map(ops, function (op) {
        var arr =  [{op: op.name, prop: "Time"},{op: op.name, prop: "Note"}];
        if(op.params && op.params.length > 0){
            _.map(op.params, function (p) {
                arr.push({op: op.name, prop: p.name + (p.unit ? " [" + p.unit + "]" : ""), plan: true});
                arr.push({op: op.name, prop: p.name + (p.unit ? " [" + p.unit + "]" : ""), actual: true});
            });
        }
        return arr;
    });
    return _.flatten(cs);
}

var timeCellRenderer = function (instance, td, row, col, prop, value, cellProperties) {
    if(value.time){
        var m = moment(value.time);
        var txt;
        if(m.format('YYYYMMDD') == moment(value.exp_date).format('YYYYMMDD')){
            txt = m.format('H:mm:ss');
        }else{
            txt = m.format('MM/DD/YYYY H:mm:ss');
        }
        td.innerHTML = '<div class="timepoint_sheet" data-runid="'+value.run+
            '" data-operation="'+ value.op +'"><i>'+txt+'</i></div>';
    }else{
        var btnhtml = '<div class="time_cell"><button class="entertime_sheet btn btn-xs btn-primary" type="button" >' +
            '<span class="glyphicon glyphicon-ok"></span>' +
            '</button></div>';
        td.innerHTML = btnhtml;
      //  var e = $(td);
     //   e.addClass('time_td');
        var btn = $('button',td);
        btn.attr('data-runid',value.run);
        btn.attr('data-operation',value.op);
    }
    return td;
};


var stepNameColumnRenderer = function(instance, td, row, col, prop, value, cellProperties){
//    console.log(row_opids);
    if(row_paramnames[row] == '__time'){
        var opid = row_opids[row];
        var op = Operations.findOne(opid);
//        console.log(row,opid,op);
        var num = op.params.length;
        var selected = _.contains(Session.get('selected_edges'),opid);
        td.innerHTML = "<div class='stepname_div"+(selected ? ' selected' : '')+"'><span class='stepname_sheet link' data-operation='" + opid + "'>" + op.name + "</span></div>";
        td.setAttribute('style','padding: 0;');

        td.setAttribute("rowSpan", ""+(num*2+2));
    }
}