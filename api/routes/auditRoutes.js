'use strict';

module.exports = function (app){
    var audits = require('../controllers/auditController');
    var authController = require('../controllers/authController');

    app.route('/v1/audits')
        // list all the audits
        .get(audits.list_all_audits)        
        // create an applicaction
        .post(audits.create_an_audit);

    app.route('/v1/audits/:auditId')
        // read an Audit
        .get(audits.read_an_audit)
        // update an Audit status
        .put(audits.update_an_audit)
        // delete an Audit. Currently an Audit cannot be deleted!
        .delete(audits.delete_an_audit);  

    app.route('/v1/audits/users/:userId')
        // list audits that auditors have made
        .get(audits.list_all_my_audits);

    app.route('/v1/audits/trips/:tripId')
        // list audits from a trip
        .get(audits.list_all_trip_audits);   
}