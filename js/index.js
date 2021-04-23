/*
  Author:   Robert Zaranek
  Date:     April 15, 2021

  Purpose:  The JavaScript portion of the "Red Light, Green Light" application.
*/

function loadMapScenario() {

    map = new Microsoft.Maps.Map(document.getElementById('myMap'), {
        center: new Microsoft.Maps.Location(43.2557, -79.871)
    });

    $(document).ready(function () {
        let combinedWarnings = [];  // Stores a combined list of red light camera and user created warnings 
                                    // as a representation of the current state
        let lat; // Holds the current latitude of the user
        let long; // Holds the current longitude of the user

        // Create an InfoBox
        let infoboxOptions = {
            visible: false,
            autoAlignment: true
        }
        let infobox = new Microsoft.Maps.Infobox(map.getCenter(), infoboxOptions)
        infobox.setMap(map)

        // Load autosuggest module
        Microsoft.Maps.loadModule('Microsoft.Maps.AutoSuggest', function () {
            var options = {
                maxResults: 4,
                map: map
            };
            var manager = new Microsoft.Maps.AutosuggestManager(options);
            manager.attachAutosuggest('#location_input', '#location_input_container');
        });

        // Requests the user's current location
        navigator.geolocation.getCurrentPosition(succesCallback, errorCallback)

        /**
         * Function for a successful user location query
         * 
         * @param {*} position The user's positional data 
         */
        function succesCallback(position) {

            createUserPushPin(position)

            // Creates all the local data and pushpins nessessary on application start
            fetch("php/get_red_light_cameras.php")
                .then(res => res.json())
                .then(
                    (result) => {
                        // Store camera locations in a local array
                        combinedWarnings = result;
                        for (i = 0; i < result.length; i++) {
                            // Set a location for this red light camera
                            let location = new Microsoft.Maps.Location(
                                result[i].LATITUDE,
                                result[i].LONGITUDE
                            )

                            // Label this pushpin as the location of this red light camera
                            let pushpinOptions = {
                                title: result[i].LOCATION
                            }

                            // This pushpin's metadata
                            let pushpin = new Microsoft.Maps.Pushpin(location, pushpinOptions)
                            pushpin.metadata = {
                                title: "Direction:",
                                description: result[i].DIRECTION,
                                cameraLat: result[i].LATITUDE,
                                cameraLong: result[i].LONGITUDE,
                                cameraCategory: "default"
                            }

                            // Add the click event handler
                            Microsoft.Maps.Events.addHandler(pushpin, 'click', pushpinClicked)

                            // Add the pushpin to the map
                            map.entities.push(pushpin)
                        }
                        fetch("php/get_user_created_warnings.php")
                            .then(res => res.json())
                            .then(
                                (result) => {
                                    // Add user warnings to the local array
                                    for (i = 0; i < result.length; i++) {
                                        combinedWarnings.push(result[i])
                                    }
                                    for (i = 0; i < result.length; i++) {
                                        // Set a location for this user warning
                                        let location = new Microsoft.Maps.Location(
                                            result[i].LATITUDE,
                                            result[i].LONGITUDE
                                        )

                                        // Label this pushpin as the location of this user warning
                                        let pushpinOptions = {
                                            title: result[i].LOCATION,
                                            color: 'green'
                                        }

                                        // This pushpin's metadata
                                        let pushpin = new Microsoft.Maps.Pushpin(location, pushpinOptions)
                                        pushpin.metadata = {
                                            title: "",
                                            description: result[i].DIRECTION,
                                            cameraLat: result[i].LATITUDE,
                                            cameraLong: result[i].LONGITUDE,
                                            warningId: result[i].WARNING_ID,
                                            cameraCategory: "user_created"
                                        }

                                        // Add the click event handler
                                        Microsoft.Maps.Events.addHandler(pushpin, 'click', userCreatedPushpinClicked)

                                        // Add the pushpin to the map
                                        map.entities.push(pushpin)
                                    }
                                    findClosestCamera();
                                })
                    })
        }

        /**
         * Function for a failed user location query
         * 
         * @param {*} error Error data
         */
        function errorCallback(error) {
            let errorMessage
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Request for geolocation denied'
                    break
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information is unavailable'
                    break
                case error.TIMEOUT:
                    errorMessage = 'The request to get your location has timed out'
                    break
                case error.UNKNOWN_ERROR:
                default:
                    errorMessage = 'An unknown error has occurred'
                    break
            }
            alert(`Error: ${errorMessage}, application disabled.`)
        }


        /**
         * Event handler function for clicking on a default pushpin
         * 
         * @param {*} e An event
         */
        function pushpinClicked(e) {
            let infoboxNewOptions = {
                location: e.target.getLocation(),
                title: e.target.metadata.title,
                description: e.target.metadata.description,
                visible: true,
                actions: [{
                    label: ""
                }]
            }
            infobox.setOptions(infoboxNewOptions)
        }

        /**
         * Event handler function for clicking on a user created warning pushpin
         * 
         * @param {*} e An event
         */
        function userCreatedPushpinClicked(e) {
            let deleteURL = "php/delete_user_created_warning.php?id=" + e.target.metadata.warningId;
            let infoboxNewOptions = {
                location: e.target.getLocation(),
                title: "",
                description: e.target.metadata.description,
                visible: true,
                actions: [{
                    label: "Delete",
                    eventHandler: function () {
                        fetch(deleteURL)
                            .then(res => res.json())
                            .then(
                                (result) => {
                                    if (result === 1) {
                                        for (let i = map.entities.getLength() - 1; i >= 0; i--) {
                                            let pushpin = map.entities.get(i);
                                            if (pushpin instanceof Microsoft.Maps.Pushpin && pushpin.metadata.warningId === e.target.metadata.warningId) {
                                                map.entities.removeAt(i);
                                                break
                                            }
                                        }
                                        for (i = 0; i < combinedWarnings.length; i++) {
                                            if (combinedWarnings[i]["WARNING_ID"] === `${e.target.metadata.warningId}`) {
                                                combinedWarnings.splice(i, 1);
                                                break;
                                            }
                                        }
                                        findClosestCamera();
                                        infobox.setOptions({
                                            visible: false
                                        })
                                    } else {
                                        alert(`Error: Data not deleted`);
                                    }
                                })
                    }
                }]
            }
            infobox.setOptions(infoboxNewOptions)
        }

        // Create Instance of Search Manager
        let searchManager
        Microsoft.Maps.loadModule('Microsoft.Maps.Search', function () {
            searchManager = new Microsoft.Maps.Search.SearchManager(map)
        })

        // Event handler for submitting a new address in the form
        $(new_location_form).on('submit', function (e) {
            e.preventDefault()
            geocodeQuery($(location_input).val(), $(description_input).val())
            $(location_input).val("")
            $(description_input).val("")
        })

        /**
         * If a location is found that matches the query, creates a new pushpin at the location 
         * and adds the appropriate information to the local storage array.
         * 
         * @param {*} query The user input query
         * @param {*} locationDescription The user input description for this location
         */
        function geocodeQuery(query, locationDescription) {
            let searchRequest = {
                where: query,
                callback: function (r) {
                    // Check for a valid query
                    if (r && r.results && r.results.length > 0) {
                        let insertURL = "php/insert_user_created_warning.php?location=" + r.results[0].location.name +
                            "&direction=" + locationDescription + "&latitude=" + r.results[0].location.latitude +
                            "&longitude=" + r.results[0].location.longitude;

                        // Insert new location into the database
                        fetch(insertURL)
                            .then(res => res.json())
                            .then(
                                (result) => {
                                    if (result > 0) {
                                        // Add new location to the local storage array
                                        combinedWarnings.push({
                                            LOCATION: r.results[0].location.name,
                                            DIRECTION: locationDescription,
                                            LATITUDE: `${r.results[0].location.latitude}`,
                                            LONGITUDE: `${r.results[0].location.longitude}`,
                                            WARNING_ID: result
                                        })

                                        let pushpinOptions = {
                                            title: r.results[0].location.name,
                                            color: 'green'
                                        }
                                        
                                        let pin = new Microsoft.Maps.Pushpin(r.results[0].location, pushpinOptions)
                                        pin.metadata = {
                                            description: locationDescription,
                                            warningId: result,
                                            cameraCategory: "user_created"
                                        }

                                        // Add a Click Handler to the new Pushpin
                                        Microsoft.Maps.Events.addHandler(pin, 'click', userCreatedPushpinClicked)

                                        map.entities.push(pin)

                                        // Zooms into pushpin
                                        map.setView({
                                            bounds: r.results[0].bestView
                                        })
                                        findClosestCamera();
                                    } else {
                                        alert(`Error: Database not updated`)
                                    }
                                })
                    }
                },
                errorCallback: function (e) {
                    alert(`Error: No Results Found!`)
                }
            }
            //Make the geocode request.
            searchManager.geocode(searchRequest)
        }

        // Update location button event handler
        $(update_current_location_button).on('click', updateCurrentLocation)

        function updateCurrentLocation() {
            navigator.geolocation.getCurrentPosition(locationUpdater, errorCallback)
        }

        /**
         * Deletes the user's previous pushpin and puts a new pushin on the map for the new location.
         * 
         * @param {*} position The user's positional data 
         */
        function locationUpdater(position) {
            // Delete User Pushpin
            for (let i = map.entities.getLength() - 1; i >= 0; i--) {
                let pushpin = map.entities.get(i);
                if (pushpin instanceof Microsoft.Maps.Pushpin && pushpin.metadata.cameraCategory === "user") {
                    map.entities.removeAt(i);
                }
            }
            createUserPushPin(position, 0)  // Set the second perameter to 1 for testing of this function
            findClosestCamera()
            $(update_current_location_button).blur()
        }


        /**
         * Calculates the distance between all locations and the user to find the lowest distances,
         * and displays that information in the application.
         * 
         * Distance calculation aquired from:
         * https://stackoverflow.com/questions/10175724/calculate-distance-between-two-points-in-bing-maps
         */
        function findClosestCamera() {
            let shortestDistance = 1000000;
            let closestCamera = "";
            let closestCameraDirection = "";
            for (i = 0; i < combinedWarnings.length; i++) {
                let distance = 0;
                let lat2 = lat;
                let lat1 = combinedWarnings[i].LATITUDE;
                let long2 = long;
                let long1 = combinedWarnings[i].LONGITUDE;

                let dLat = (lat2 - lat1) / 180 * Math.PI;
                let dLong = (long2 - long1) / 180 * Math.PI;

                let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 / 180 * Math.PI) * Math.cos(lat2 / 180 * Math.PI) *
                    Math.sin(dLong / 2) * Math.sin(dLong / 2);
                let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                //Calculate radius of earth
                // For this you can assume any of the two points.
                let radiusE = 6378135; // Equatorial radius, in metres
                let radiusP = 6356750; // Polar Radius

                //Numerator part of function
                let nr = Math.pow(radiusE * radiusP * Math.cos(lat1 / 180 * Math.PI), 2);
                //Denominator part of the function
                let dr = Math.pow(radiusE * Math.cos(lat1 / 180 * Math.PI), 2) +
                    Math.pow(radiusP * Math.sin(lat1 / 180 * Math.PI), 2);
                let radius = Math.sqrt(nr / dr);

                //Calculate distance in meters.
                distance = radius * c;

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    closestCamera = combinedWarnings[i].LOCATION;
                    closestCameraDirection = combinedWarnings[i].DIRECTION;
                }
            }
            $("#closest_red_light").html(`The closest camera/hazard is at ${closestCamera} (${closestCameraDirection}), and is ${shortestDistance.toFixed(2)} meters away.`)
        }

        /**
         * Creates a new pushpin at the user's current location.
         * Set second perameter to 1 to activate testing mode.
         * 
         * @param {*} position The user's positional data 
         * @param {*} testing integer 1 for testing mode, all else for production
         */
        function createUserPushPin(position, testing) {
            // Create User's Pushpin
            if (testing === 1) {
                lat = 43.2325151
                long = -79.7023612
            } else {
                lat = position.coords.latitude
                long = position.coords.longitude
            }
            let userLocation = new Microsoft.Maps.Location(lat, long)
            let userPushpin = new Microsoft.Maps.Pushpin(userLocation, {
                text: 'ME',
                color: 'crimson'
            })
            userPushpin.metadata = {
                cameraCategory: "user"
            }

            // Add a Click Handler for the User's Pushpin and Invoke it at start
            Microsoft.Maps.Events.addHandler(userPushpin, 'click', userPushpinClicked)
            Microsoft.Maps.Events.invoke(userPushpin, 'click', userPushpinClicked)

            // Displays the user's location in an infobox
            function userPushpinClicked() {
                let newOptions = {
                    location: userLocation,
                    title: "Your location:",
                    description: `${lat}, ${long}`,
                    visible: true,
                    actions: [{
                        label: ""
                    }]
                }
                infobox.setOptions(newOptions)
            }

            // Add the user's location as a pushpin on the map
            map.entities.push(userPushpin)
        }

    })
}