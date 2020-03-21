'use strict';

module.exports = function (app){
    var trips = require('../controllers/tripController');
    var authController=require('../controllers/authController');

    /** 
     * Post an trip
     *   RequiredRoles: to be a Manager
     *
     * @section trips
     * @type post
     * @url /v1/trips
     */
    app.route('/v1/trips')
        .post(trips.create_an_trip);

    /** 
     * Search trips
     *   
     * @section trips
     * @type get
     * @url /v1/trips/search
     * @param {string} keyword
     */
    app.route('/v1/trips/search')
        .get(trips.search_trips);


    /**
     * Read all trips of a manager
     *   RequiredRoles: to be a Manager
     * @section trips
     * @type get
     * @url /v1/trips/manager/:managerId
     */
    app.route('/v1/trips/manager/:managerId')
        .get(trips.list_all_trips_of_manager);
    
    /**
     * Read, modify and delete a trip
     *   RequiredRoles: to be a Manager for modify and delete
     * @section trips
     * @type get put delete
     * @url /v1/trips/:ticker
     */
    app.route('/v1/trips/:ticker')
        .get(trips.read_an_trip_ticker)
        .put(trips.update_an_trip_ticker)
        .delete(trips.delete_an_trip_ticker);

    /**
     * Publish an trip
     *   RequiredRoles: to be a Manager
     * 
     * @section trips
     * @type put
     * @url /v1/trips/:ticker
     */
    app.route('/v1/trips/:ticker/publish')
        .put(trips.publish_an_trip);
    
    /** 
     * Cancel an trip
     *   RequiredRoles: to be a Manager
     *
     * @section trips
     * @type put
     * @url /v1/trips/:ticker/cancel
     */
    app.route('/v1/trips/:ticker/cancel')
        .put(trips.cancel_an_trip);


    /*** V2 ***/

    /** 
     * Post an trip
     *   RequiredRoles: to be a Manager
     *
     * @section trips
     * @type post
     * @url /v2/trips
     */
    app.route('/v2/trips')
        .post(authController.verifyUser(["MANAGER"]),trips.create_an_trip_validation);


    /**
     * Read all trips of a manager
     *   RequiredRoles: to be a Manager
     * @section trips
     * @type get
     * @url /v2/trips/manager/:managerId
     */
    app.route('/v2/trips/manager/:managerId')
        .get(authController.verifyUser(["MANAGER"]),trips.list_all_trips_of_manager_validation);
    
    /**
     * Read, modify and delete a trip
     *   RequiredRoles: to be a Manager for modify and delete
     * @section trips
     * @type get put delete
     * @url /v2/trips/:ticker
     */
    app.route('/v2/trips/:ticker')
        .put(authController.verifyUser(["MANAGER"]),trips.update_an_trip_ticker_validation)
        .delete(authController.verifyUser(["MANAGER"]),trips.delete_an_trip_ticker_validation);

    /**
     * Publish an trip
     *   RequiredRoles: to be a Manager
     * 
     * @section trips
     * @type put
     * @url /v2/trips/:ticker
     */
    app.route('/v2/trips/:ticker/publish')
        .put(authController.verifyUser(["MANAGER"]),trips.publish_an_trip_validation);
    
    /** 
     * Cancel an trip
     *   RequiredRoles: to be a Manager
     *
     * @section trips
     * @type put
     * @url /v2/trips/:ticker/cancel
     */
    app.route('/v2/trips/:ticker/cancel')
        .put(authController.verifyUser(["MANAGER"]),trips.cancel_an_trip_validation);

}