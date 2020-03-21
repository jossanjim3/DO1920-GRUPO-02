'use strict';

module.exports = function (app){
    var config = require('../controllers/configController');
    var authController = require('../controllers/authController')

    app.route('/v1/config')
        .get(config.getConfig)
        .put(config.updateConfig);

    app.route('/v2/config')
        .put(authController.verifyUser(["ADMINISTRATOR"]), config.updateConfig_auth);
}