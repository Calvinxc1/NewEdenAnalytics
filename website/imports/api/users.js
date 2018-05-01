// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';

// NPM Imports
import SimpleSchema from 'simpl-schema';

// Custom Imports
import {schemaRoles} from './roles.js';

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

const schemaObject = {
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
}

export const schemaUsers = {}
schemaUsers.insert = new SimpleSchema(schemaObject);
schemaUsers.update = new SimpleSchema({
	...schemaObject,
	_id: {
		type: String,
		regEx: SimpleSchema.RegEx.Id
	}
});
schemaUsers.setRoles = new SimpleSchema({
	roles: {
		type: Object,
		label: 'Roles Groups'
	},
	'roles.__global_roles__': {
		type: Array,
		label: 'Global Roles'
	},
	'roles.__global_roles__.$': {
		type: String,
		label: 'Roles'
	}
});

if(Meteor.isServer) {
	Accounts.validateNewUser((user) => {
		schemaUsers.insert.validate(user);
		return true;
	});

	Accounts.onCreateUser((options, user) => {
		user.profile = {
			characters: []
		};
		return user;
	});
}

Meteor.methods({
	'accounts.setRoles.admin'(userId, roleList) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaUsers.setRoles.validate({
			roles: {
				__global_roles__:	roleList
			}
		});

		return Roles.setUserRoles(userId, roleList, Roles.GLOBAL_GROUP);
	}
});