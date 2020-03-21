'use strict';
module.exports = function(app) {
    var sponsorships = require('../controllers/sponsorshipController');
    const authController = require('../controllers/authController');
    
    /**
     * Get all the sponsorships belonging to a sponsor.
     *    Required role: Sponsor
     * Create a sponsorship.
     *    Required role: Sponsor
     * 
     * @section sponsorships
     * @type get, post
     * @url /v1/sponsorships
     */
    app.route('/v1/sponsorships')
        .get(sponsorships.list_all_sponsorships)
        .post(sponsorships.create_a_sponsorship);


    /**
     * Get a sponsorship by id.
     *     Required role: Sponsor
     * Update a sponsorship:
     *     Required role: Sponsor.
     * Remove a sponsorship:
     *     Required role: Sponsor.
     * 
     * @section sponsorships
     * @type get, put, delete
     * @url /v1/sponsorships/:sponsorshipId
     */
    app.route('/v1/sponsorships/:sponsorshipId')
        .get(sponsorships.find_a_sponsorship)
        .put(sponsorships.update_a_sponsorship)
        .delete(sponsorships.delete_a_sponsorship);

    /**
     * Get all the sponsorships belonging to a sponsor
     *     Required role: Sponsor
     * 
     * @section sponsorships
     * @type get
     * @url /v1/sponsorships/:sponsorId
     */
    app.route('/v1/sponsorships/sponsors/:sponsorId')
        .get(sponsorships.list_sponsorships_sponsor);
    
    /**
     * Get all the sponsorships belonging to a trip.
     * 
     * @section sponsorships
     * @type get
     * @url /v1/sponsorships/:tripId
     */
    app.route('/v1/sponsorships/trips/:tripId')
        .get(sponsorships.find_sponsorships_trip);

    /**
     * Pay a sponsorship for a trip.
     * 
     * @section sponsorships
     * @type put
     * @url /v1/sponsorships/:sponsorshipId/:tripId/pay
     */
    app.route('/v1/sponsorships/:sponsorshipId/:tripId/pay')
        .put(sponsorships.pay_sponsorships_trip);

    /**
     * Cancel a sponsorship for a trip.
     * 
     * @section sponsorships
     * @type put
     * @url /v1/sponsorships/:sponsorshipId/:tripId/cancel
     */
    app.route('/v1/sponsorships/:sponsorshipId/:tripId/cancel')
        .put(sponsorships.cancel_sponsorships_trip);

    
    app.route('/v2/sponsorships')
        .post(authController.verifyUser(["SPONSOR"]), sponsorships.create_a_sponsorship_auth);

    app.route('/v2/sponsorships/sponsors/:sponsorId')
        .get(authController.verifyUser(["SPONSOR"]), sponsorships.list_sponsorships_sponsor_auth);
    
    app.route('/v2/sponsorships/trips/:tripId')
        .get(authController.verifyUser(["SPONSOR"]), sponsorships.find_sponsorships_trip_auth);

    app.route('/v2/sponsorships/trips/:tripId/pay')
        .get(authController.verifyUser(["SPONSOR"]), sponsorships.pay_sponsorships_trip_auth);
    
    app.route('/v2/sponsorships/trips/:tripId/cancel')
        .get(authController.verifyUser(["SPONSOR"]), sponsorships.cancel_sponsorships_trip_auth);
    
    
};