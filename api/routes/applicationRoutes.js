'use strict';

module.exports = function (app){
    var applications = require('../controllers/applicationController');
    var authController = require('../controllers/authController');

    app.route('/v1/applications')
        // list all the applications
        .get(applications.list_all_applications)        
        // create an applicaction
        .post(applications.create_an_application);

    app.route('/v1/applications/:applicationId')
        // read an application
        .get(applications.read_an_application)
        // update an application status
        .put(applications.update_an_application)
        // delete an application. Currently an application cannot be deleted!
        .delete(applications.delete_an_application);  

    app.route('/v2/applications/:applicationId')
        // update an application status
        .put(authController.verifyUser(["EXPLORER","MANAGER"]), applications.update_an_application_authorized)

    app.route('/v1/applications/:applicationId/cancel')
        // update an application status to rejected by manager or cancelled by explorer
        .put(applications.cancel_an_application);

    app.route('/v2/applications/:applicationId/cancel')
        // update an application status to rejected by manager or cancelled by explorer
        .put(authController.verifyUser(["EXPLORER","MANAGER"]), applications.cancel_an_application_authorized);

    app.route('/v1/applications/users/:userId')
        // list applications that explorers have made
        .get(applications.list_all_my_applications);

    app.route('/v1/applications/trips/:tripId')
        // list applications from a trip
        .get(applications.list_all_trip_applications);   
}