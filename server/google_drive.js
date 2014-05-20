//Meteor.Loader.loadJs('https://apis.google.com/js/client.js')

gCal = {
  insertEvent: function(cliente, poblacion, texto, fecha){
    var url = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
    var event =  {
      summary: cliente,
      location: poblacion,
      description: texto,
      start:{
        "date": fecha},
      end:
      {date: fecha}
    }
    evento = JSON.stringify(event)
    console.log(evento)
    Auth = 'Bearer ' + Meteor.user().services.google.accessToken
    Meteor.http.post(url, {
      params: {key: 'AIzaSyBWQOGSOkQfRiqoaFz41MG7N1TtY1EJUHI'},
      data: event,
      headers: {'Authorization': Auth }
    },
    function(err, result){
      console.log(result)
      return(result.id)
    });
  }
};

//https://developers.google.com/drive/v2/reference/files/insert

mkGoogleSheet = function(eid){
    var url = "https://www.googleapis.com/upload/drive/v2/files";
    var Auth = 'Bearer ' + Meteor.user().services.google.accessToken

    var contentType = 'application/vnd.google-apps.spreadsheet';

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    var exp = Experiments.findOne(eid);
    var title = 'Experiment on '+moment(exp.date).format('YYYY-MM-DD')+': '+exp.name;
    var metadata = {
        'title': title,
        'mimeType': contentType
    };

    var base64Data = '';
    var multipartRequestBody =
        delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
          //  'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' +
            base64Data +
            close_delim;

    console.log(multipartRequestBody);

    Meteor.http.post(url,{
        params: {key: 'AIzaSyBWQOGSOkQfRiqoaFz41MG7N1TtY1EJUHI',
            uploadType: 'multipart'
        },
        headers: {
            'Content-Type': 'multipart/mixed; boundary="' + boundary + '"',
            'Authorization': Auth },
        content: multipartRequestBody
    },    function(err, result){
        console.log(result)
        return(result.id)
    });
};

