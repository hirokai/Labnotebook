renderCells = function (eid) {

//    console.log('renderCells()');
    if(!getCurrentExpId()) return;

    var experimentLocked;

    var row_opids = [];
    var row_paramnames = [];
    //You cannot use map of meteor cursor, because it will use up the collection and you can use it only once.
    var runs = ExpRuns.find({exp: eid}, {sort: {timestamp: 1}}).fetch();
    var runids = _.map(runs, function (run) {
        return run._id;
    });
    // console.log(runs,runids);



    var exp = getCurrentExp();
    experimentLocked = exp.locked;

//    function cols() {
//        var cs = [];
//        cs.push({type: 'text'});
//        var num_cols = colNames().length - 1;
//        _.each(_.range(0, num_cols), function () {
//            cs.push({
//                type: 'handsontable',
//                handsontable: {
//                    colHeaders: false,
//                    data: colorData
//                }
//            });
//
//        });
//        return cs;
//
//    }

    var colors = SampleTypes.find({}, {fields: {name: 1}}).map(function (s) {
        return s.name
    });
    var colorData = [];
    var color;
    while (color = colors.shift()) {
        colorData.push([
            [color]
        ]);
    }
    var dat = getTableData(exp,runs,row_opids,row_paramnames);
    var colnames = colNames(runs);
    var rownames = rowNames(exp);
    console.log(dat);

    try{
    var tbl = $("#spreadsheet").handsontable('getInstance');
    tbl && tbl.removeHook('afterChange');
    }catch(e){
        console.log(e);
    }
        $("#spreadsheet").handsontable({
        data: dat,
        manualColumnResize: true,
        startRows: 7,
        startCols: colnames.length,
        colWidths: _.map(_.range(0, runs.length), function () {
            return Math.max(80,500/runs.length);
        }),
        rowHeaders: rownames,
        colHeaders: colnames,
        //   columns: cols(),
        cells: function (row, col, prop) {
            var cellProperties = {};
            if (row_paramnames[row] == '' || experimentLocked) {
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
            var runid = runids[(change[0][1])];
            console.log(change, runids, runid, opid, paramname, newval);
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
    var arr = _.map(exp.protocol.operations, function (opid) {
        var op = Operations.findOne(opid);
        if (op) {
            row_opids.push(opid);
            row_paramnames.push('');
            row_opids.push(opid);
            row_paramnames.push('__note');
            var pss = [_.map(runs, function (run, idx) {
                //console.log(run,idx,opid);
                var t = getOpTimestamp(run._id, opid);
                var m = moment(t);
                if(t){
                    if(m.format('YYYYMMDD') == moment(exp.date).format('YYYYMMDD')){
                        return t ? moment(t).format('H:mm:ss') : '';
                    }else{
                        return t ? moment(t).format('MM/DD/YYYY H:mm:ss') : '';
                    }
                }else{
                    return '';
                }

            })
            ];
            pss = pss.concat([_.map(runs,function(run){
                return run.ops[opid].note;
            })]);
            pss = pss.concat(_.flatten(_.map(op.params, function (param) {
                var rowplan = _.map(_.range(0,runs.length),function(i){return ''});
                var rowactual = getRowData(exp._id, opid, param);
                row_opids.push(opid);
                row_paramnames.push("");
                row_opids.push(opid);
                row_paramnames.push(param.name);
//                console.log(row);
                return [rowplan,rowactual];
            }),true));
            return pss;
        }
        else {
            return [];
        }

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
    return runs.map(function (run) {
        return run.name;
    });
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
