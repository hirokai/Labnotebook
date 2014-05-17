renderCells = function (eid) {

//    console.log('renderCells()');
    if(!getCurrentExpId()) return;

    var row_opids = [];
    var row_paramnames = [];
    //You cannot use map of meteor cursor, because it will use up the collection and you can use it only once.
    var runs = ExpRuns.find({exp: eid}, {sort: {timestamp: 1}}).fetch();
    var runids = _.map(runs, function (run) {
        return run._id;
    });
    // console.log(runs,runids);

    function getTableData() {

//        console.log(exp.protocol.operations);
        var exp = getCurrentExp();
        var arr = _.map(exp.protocol.operations, function (opid) {
            var op = Operations.findOne(opid);
            if (op) {
                row_opids.push(opid);
                row_paramnames.push('');
                var pss = [_.map(runs, function (run, idx) {
                    //console.log(run,idx,opid);
                    return formatDateTime(getOpTimestamp(run._id, opid));
                })
                ];
                pss = pss.concat(_.map(op.params, function (param) {
                    var row = getRowData(exp, opid, param);
                    row_opids.push(opid);
                    row_paramnames.push(param.name);
//                console.log(row);
                    return row;
                }));
                return pss;
            }
            else {
                return [];
            }

        });
        //    console.log(arr);
        return _.flatten(arr, true);
    }

    function colNames() {
        return getExpRuns(eid).map(function (run) {
            return run.name;
        });
    }

    function getRowData(exp, opid, param) {
        var runs =  getExpRuns(eid);
        //   console.log(param);
        return runs.map(function (run, runidx) {
            return getOpParam(run._id, opid, param.name);
        });
    }


    function rowNames() {
        var e = getCurrentExp();
        var opids = e.protocol.operations;
        //A bit ad hoc...
        var ops = sortById(Operations.find({_id: {$in: opids}}).fetch(), opids);
//        var exp = getCurrentExp();
        var cs = _.flatten(_.map(ops, function (op) {
            return [op.name + ": <br>Time"].concat(_.map(op.params, function (p) {
                return op.name + ": <br>" + p.name + (p.unit ? " [" + p.unit + "]" : "")
            }));
        }));
        var res = ["Run #"].concat(cs);
//        console.log(ops,cs,res);
        return cs;
    }

    function cols() {
        var cs = [];
        cs.push({type: 'text'});
        var num_cols = colNames().length - 1;
        _.each(_.range(0, num_cols), function () {
            cs.push({
                type: 'handsontable',
                handsontable: {
                    colHeaders: false,
                    data: colorData
                }
            });

        });
        return cs;

    }

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
    var dat = getTableData();
    var colnames = colNames();
    var rownames = rowNames();
//    console.log(dat);

    $("#spreadsheet").handsontable({
        data: dat,
        manualColumnResize: true,
        startRows: 7,
        startCols: colnames.length,
        colWidths: _.map(_.range(0, 20), function () {
            return 80
        }),
        rowHeaders: rownames,
        colHeaders: colnames,
        //   columns: cols(),
        cells: function (row, col, prop) {
            var cellProperties = {};
            if (row_paramnames[row] == '') {
                cellProperties.readOnly = true; //make cell read-only if it is first row or the text reads 'readOnly'
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
