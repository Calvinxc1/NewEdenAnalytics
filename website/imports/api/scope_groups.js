// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';

// NPM Imports
import SimpleSchema from 'simpl-schema';

export const ScopeGroups = new Mongo.Collection('scope_groups');

if (Meteor.isServer) {
	Meteor.publish('scopeGroups', () => {
		if (Meteor.userId()) {
			return ScopeGroups.find({});
		} else {
			return null;
		}
	});

	Meteor.publish('admin_scopeGroups', () => {
		if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
			return ScopeGroups.find({});
		} else {
			return null;
		}
	});
};

export const schemaScopeGroups = new SimpleSchema({
	name: {
		type: String,
		label: 'Scope Group Name',
		min: 1
	},
	scopes: {
		type: Array,
		label: 'Array of Scopes in Group'
	},
	'scopes.$': {
		type: String,
		label: 'Scope',
		min: 1
	}
});

Meteor.methods({
	'scopeGroups.insert.admin'(scopeGroupItem) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaScopeGroups.validate(scopeGroupItem);

		return ScopeGroups.insert(scopeGroupItem);
	},

	'scopeGroups.delete.many.admin'(idList) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		return ScopeGroups.remove({_id: {$in: idList}});
	}
});
