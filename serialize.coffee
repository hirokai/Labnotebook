root = global ? window

root.mkCsv = (eid) ->
  exp = Experiments.findOne eid
  return null unless exp
  runs = getExpRuns(eid).fetch()

  data = getTableData(exp, runs, [], []);
  cols = colNames(runs);
  d2 = adjustData(data);
  console.log(data, d2);
  str = arrayToCsv(d2)

#  sids = ExpRuns.find({exp: eid}).map((r) ->_.map(r.samples,(v) -> v))
  sids = _.flatten(ExpRuns.find({exp: eid}).map((r) ->_.map(r.samples,(v) -> {sample: v, run: r._id})))

  s_str = arrayToCsv(
    [['Name','ID','Time stamp','Note']].concat _.map sids, (ss) ->
      s = Samples.findOne(ss.sample)
      if s then [s.name, s._id, moment(s.timestamp).format('M/D/YYYY'), s.note] else ['Error','',ss.sample,'','']
  )


  'Generated by https://labnote.meteor.com/' + '\r\n' +
  'Experiment,' + exp.name + ',' + moment(exp.date).format('M/D/YYYY') + '\r\n' +
  'Exported time,' + moment().format('M/D/YYYY HH:mm:ss') + '\r\n' +
  (if exp.locked then 'Experiment finished (data frozen)' else '') +
  '''
  Samples\r\n''' +
  s_str +
  '''\r\n
  'Steps\r\n''' +
  str

root.arrayToCsv = (xss) ->
  (_.map xss, (xs) ->
    (_.map xs, (x) ->
      innerValue = x?.toString() || ''
      result = innerValue.replace(/"/g, '""')
      if result.search /("|,|\n)/g >= 0
        result = '"' + result + '"'
      result).join(',') + '\r\n').join('')


# PDF export
root.mkPdf = (exp) ->
  doc = new jsPDF()

  doc.setFont("helvetica");
  doc.setFontType("bold");
  doc.setFontSize(20)
  doc.text(20, 20, exp.name);

  doc.setFont("helvetica");
  doc.setFontType("normal");
  doc.setFontSize(12)
  doc.text(20, 30, 'Date: ' + moment(exp.date).format('M/D/YYYY'));

  doc.setFont("helvetica");
  doc.setFontType("normal");
  doc.setFontSize(12)
  doc.text(20, 50, 'Samples');

  str = doc.output 'datauristring', {}
  window.open(str)


root.getSpreadsheetUrl = (id) -> 'https://drive.google.com/spreadsheets/d/' + id # + '/preview'

root.getGDriveFileUrl = (id) -> 'https://drive.google.com/file/d/' + id # + '/preview'

root.adjustData = (dat) ->
  console.log dat
  numcol = dat[0].length
  _.map dat, (row) ->
    row = _.map row, (cell) ->
      if cell && cell.run # empty time cell
        ''
      else
        cell
    if row.length == numcol then row else [''].concat row

root.dumpDBToGDrive = (uid,callback) ->
  callback = callback || () -> {}
  console.log 'dumpDB...'
  Meteor.call 'getJSONOfWholeDB', uid, (err,str) ->
    if !str
      console.log 'Failed to obtain JSON.'
      callback({success: false})
      return
    Meteor.call 'getGoogle', uid, (err,auth) ->
#      console.log(err,auth)
      if !auth
        console.log 'getGoogle failed.'
        callback {success: false}
        return

      contentType = 'text/plain'
      metadata =
        title: 'Labnotebook Database dump as of ' + moment().format('YYYY-MM-DD hh:mm:ss')
        mimeType: contentType
      boundary = '-------314159265358979323846';
      delimiter = "\r\n--" + boundary + "\r\n";
      close_delim = "\r\n--" + boundary + "--";

      Auth = 'Bearer ' + auth.accessToken;


      headers =
        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        Authorization: Auth

      multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n\r\n' +
        str + '\r\n' +
        close_delim;

#      console.log(multipartRequestBody,headers);

      HTTP.post(
        'https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart&convert=false',
        {content: multipartRequestBody, headers: headers}, (err,res) ->
#          console.log(err,res);
          id = res.data.id;
          if id
            addLog
              type: 'database'
              op: 'dumpall'
              params:
                gdrive_id: id
            url = root.getGDriveFileUrl(id)
#            console.log(callback);
            callback({url: url, success:true, id: id});
          else
            callback({success: false, error: 'Insert failed.'});
      )
