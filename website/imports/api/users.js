// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';

// NPM Imports
import SimpleSchema from 'simpl-schema';

// Custom Imports
import {ScopeGroups} from './scope_groups.js';

if (Meteor.isServer) {
	Meteor.publish('admin_users', () => {
		if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
			return Meteor.users.find({}, {fields: {
				createdAt: 1,	username: 1, emails: 1,	profile: 1,
				scopeGroups: 1,	roles: 1
			}});
		} else {
			return null;
		}
	});
};

Accounts.onCreateUser((options, user) => {
	user.profile = {
		characters: []
	};
	return user;
});

export const schemaUser = new SimpleSchema({
	username: {
		type: String,
		label: 'New User Username'
	},
	emails: {
		type: Array,
		label: 'Email Array'
	},
	'emails.$': {
		type: Object,
		label: 'Email Object'
	},
	'emails.$.address': {
		type: String,
		label: 'Email Address',
		regEx: SimpleSchema.RegEx.Email
	},
	'emails.$.verified': {
		type: Boolean,
		label: 'Email Verified',
	},
	services: {
		type: Object,
		label: 'Services Object',
		blackbox: true
	},
	profile: {
		type: Object,
		label: 'User Profile'
	},
	'profile.characters': {
		type: Array,
		label: 'User EVE Accounts',
		maxCount: 0
	},
	createdAt: {
		type: Date,
		label: 'Created At'
	},
	_id: {
		type: String,
		label: 'User ID'
	}
});

Accounts.validateNewUser((user) => {
	schemaUser.validate(user);
	return true;
});
