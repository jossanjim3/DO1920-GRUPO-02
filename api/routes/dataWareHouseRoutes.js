'use strict';
module.exports = function(app) {
	var dataWareHouse = require('../controllers/dataWareHouseController');
	var authController=require('../controllers/authController');

  	/**
	 * Get a list of all indicators or post a new computation period for rebuilding
	 * RequiredRole: Administrator
	 * @section dataWareHouse
	 * @type get post
	 * @url /v1/dataWareHouse
	 * @param [string] rebuildPeriod
	 * 
	*/
	app.route('/v1/dataWareHouse')
	.get(dataWareHouse.list_all_indicators)
	.post(dataWareHouse.rebuildPeriod);

	/**
	 * Get a list of last computed indicator
	 * RequiredRole: Administrator
	 * @section dataWareHouse
	 * @type get
	 * @url /v1/dataWareHouse/latest
	 * 
	*/
	app.route('/v1/dataWareHouse/latest')
	.get(dataWareHouse.last_indicator);

	app.route('/v1/dataWareHouse/latest/cube/:emailUser/:startingMonth/:endingMonth')
		.get(dataWareHouse.getCubeDataByIntervalMonths);

	app.route('/v1/dataWareHouse/latest/cube/byCondition/:condition/:amount/:startingMonth/:endingMonth')
		.get(dataWareHouse.getCubeDataByComparisonAndMonths);

	app.route('/v1/dataWareHouse/latest/cube')
		.get(dataWareHouse.getCube);
	/*app.route('/v1/dataWareHouse/latest/cube/:emailUsuario/:intervalo')
		.get(dataWareHouse.getCubeDataByInterval);*/

	/*** V2 ***/
	/**
	 * Get a list of all indicators or post a new computation period for rebuilding
	 * RequiredRole: Administrator
	 * @section dataWareHouse
	 * @type get post
	 * @url /v2/dataWareHouse
	 * @param [string] rebuildPeriod
	 * 
	*/
	app.route('/v2/dataWareHouse')
	.get(authController.verifyUser(["ADMINISTRATOR"]),dataWareHouse.list_all_indicators)
	.post(authController.verifyUser(["ADMINISTRATOR"]),dataWareHouse.rebuildPeriod);

	/**
	 * Get a list of last computed indicator
	 * RequiredRole: Administrator
	 * @section dataWareHouse
	 * @type get
	 * @url /v2/dataWareHouse/latest
	 * 
	*/
	app.route('/v2/dataWareHouse/latest')
	.get(authController.verifyUser(["ADMINISTRATOR"]),dataWareHouse.last_indicator);
};
