/* jshint node: true */

module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'ember-music-player',
    environment: environment,
    baseURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    'ember-simple-auth': {
      authenticationRoute:          'auth.login',
      routeAfterAuthentication:     'index',
      routeIfAlreadyAuthenticated:  'index'
    },

    VK: {
      apiId: 4297865,
      permissions: 8 //audio
    },

    LastFM: {
      apiKey: '12ceaa11a67c256dade27f1ebfbea9db',
      apiSecret: '155a15c8ec6132b58e83ea24c3671979'
    },

    Soundcloud: {
      client_id: '258b552acd09074b03f147ab423acd04'
    }
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.baseURL = '/';
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'production') {

  }

  return ENV;
};
