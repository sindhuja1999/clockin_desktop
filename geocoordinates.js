function getCoordinate() {
    let ipSettings = {
        "url": "https://api.ipify.org?format=json"
    };
    $.ajax(ipSettings).done(function (response) {
        window.ipAddress = response.ip;
        let geoCoordinates = {
            "url": "http://ip-api.com/json/" + response.ip
        }
        $.ajax(geoCoordinates).done(function (response) {
            if (response) {
                db.find({ module: 'GeoCoordinates' }, function (error, docs) {
                    if (docs.length) {
                        db.update({ module: 'GeoCoordinates' }, { $set: { latitude: response.lat, longitude: response.lon } }, function (err, coordinates) {
                            if (err) {
                                console.log('Error in Updating the GeoCoordinates with the latest coordinates', err)
                            }

                        })
                    }
                    else if (docs.length === 0) {
                        db.insert({ module: 'GeoCoordinates', latitude: response.lat, longitude: response.lon }, function (err, entities) {
                            if (err) {
                                console.log('Error in Creating the GeoCoordinates', err)
                            }
                        });
                    }
                })

            }
        }).fail((error) => {
            console.log("Error in getting the ip address", error)
        })
    }).fail((error) => {
        console.log("Error in getting the ip address", error)
    })

}



function getGeoCoordinates(){
    let url = 'https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyBCEUbV-AXTBy54TsXN0Gx9TUW0yHs6LUA'
    $.ajax({
        type: "POST",
        url: url
      }).done(function (response){
          if(response){
            db.find({ module: 'GeoCoordinates' }, function (error, docs) {
                if (docs.length) {
                    db.update({ module: 'GeoCoordinates' }, { $set: { latitude: response.location.lat, longitude: response.location.lng } }, function (err, coordinates) {
                        if (err) {
                            console.log('Error in Updating the GeoCoordinates with the latest coordinates', err)
                        }

                    })
                }
                else if (docs.length === 0) {
                    db.insert({ module: 'GeoCoordinates', latitude: response.location.lat, longitude: response.location.lng }, function (err, entities) {
                        if (err) {
                            console.log('Error in Creating the GeoCoordinates', err)
                        }
                    });
                }
            })
          }
      }).fail((error)=>{
          console.log('Error', error)
      })
}

