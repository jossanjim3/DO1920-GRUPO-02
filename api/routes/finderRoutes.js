'use strict'
module.exports = function(app){
    var applications = require('../controllers/finderController');
    const authController = require('../controllers/authController');
    
    /**
     * Get all finders.
     * 
     * Create a new finder.
     *     Required role: Explorer.
     * 
     * @section finders
     * @type get, post
     * @url /v1/finders
     */
    app.route('/v1/finders')
        .get(applications.all_finders);  
    
    /**
     * Get the actor's finder.
     *     Required role: Explorer
     * 
     * Update the finder.
     *     Required role: Explorer.
     * 
     * @section finders
     * @type get, put
     * @url /v1/finders/:actorId
     */
    app.route('/v1/finders/explorers/:actorId')
        .get(applications.finder_of_actor)
        .put(applications.update_finder)
        .delete(applications.remove_finder);
    
    app.route('/v2/finders/explorers')
        .get(authController.verifyUser(["EXPLORER"]), applications.finder_of_actor_auth)
        .put(authController.verifyUser(["EXPLORER"]), applications.update_finder_auth)
        .delete(authController.verifyUser(["EXPLORER"]), applications.remove_finder_auth);
}