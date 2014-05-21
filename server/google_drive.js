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
