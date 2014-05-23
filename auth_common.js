var def_threshold_sec = 60; // For expires_in below this, auth token is refreshed.

checkAuthToken = function(token,threshold_sec){
    threshold_sec = threshold_sec || def_threshold_sec;
    Meteor.call('getGoogle',function(err,res){
        console.log('checkAuthToken(): Current authtoken: '+res.accessToken);
        HTTP.post('https://www.googleapis.com/oauth2/v1/tokeninfo',
            {params: {access_token: token || res.accessToken}},
            function(err,res){
//                console.log(err,res);
                if(res.data && res.data.expires_in <= threshold_sec){
                    Meteor.call('doRefreshToken');
                }else{
                    var time = (res.data.expires_in - (threshold_sec*0.9))*1000;
                    if(!time || isNaN(time)) time = 1000*30;
                    Meteor.setTimeout(checkAuthToken,time);
                    console.log('checkAuthToken(): expires in: '+res.data.expires_in+' sec, will check again '+(time/1000)+' sec later.');
                }
            });
    });
};

