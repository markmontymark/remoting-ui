requirejs.config({
	paths: {
		'jquery': '//cdnjs.cloudflare.com/ajax/libs/jquery/1.7.1/jquery.min',
		'JSON': '//cdnjs.cloudflare.com/ajax/libs/json2/20110223/json2',
		'underscore': '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore-min',
		'backbone' : '//cdnjs.cloudflare.com/ajax/libs/backbone.js/0.9.10/backbone-min',
		'backbone.marionette': '//cdnjs.cloudflare.com/ajax/libs/backbone.marionette/1.0.0-rc4-bundled/backbone.marionette.min',
		'application' : 'application',
	},

	shim: {
		'jquery': 					{'exports':'$'},
		'underscore': 				{'exports':'_'},
		'backbone': 				{'deps': ['underscore','jquery']},
		'backbone.marionette': 	{'deps': ['backbone']},
		'application': 			{'deps': ['backbone.marionette']}
	}
});

require(['application'], function(application) { });
