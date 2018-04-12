// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Tracker} from 'meteor/tracker';
import {Roles} from 'meteor/alanning:roles';
import {Accounts} from 'meteor/accounts-base';

// NPM Imports
import ReactDOM from 'react-dom';

// Custom Imports
import routesNavbar from '../imports/routing/routesNavbar.js';
import routesMain from '../imports/routing/routesMain.js';
import {onAuthChange} from '../imports/routing/pageAuth.js';

Tracker.autorun(() => {
	const userId = Meteor.userId();
	const isAuthenticated = !!userId;
	const isAdmin = Roles.userIsInRole(userId, 'admin');
	onAuthChange(isAuthenticated, isAdmin);
});

Meteor.startup(() => {
	ReactDOM.render(
		routesNavbar,
		document.getElementById('appNavbar')
	);
	ReactDOM.render(
		routesMain,
		document.getElementById('appMain')
	);
});
