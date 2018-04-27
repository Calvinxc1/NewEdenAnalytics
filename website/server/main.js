// Meteor Imports
import {Meteor} from 'meteor/meteor';

// Custom Imports - API's
import '../imports/api/users.js';
import '../imports/api/roles.js';
import '../imports/api/eve_chars.js';
import '../imports/api/eve_corps.js';
import '../imports/api/eve_scopes.js';
import '../imports/api/eve_oauth.js';
import '../imports/api/scope_groups.js';

// Custom Imports - Startups
import '../imports/startup/simple-schema-config.js';
import '../imports/startup/eve-oauth-init.js';
import '../imports/startup/roles-init.js';

Meteor.startup(() => {

});
