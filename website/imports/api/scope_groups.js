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

const schemaObject = {
	name: {
		type: String,
		label: 'Scope Group Name',
		min: 1
	},
	cat: {
		type: String,
		label: 'Scope Group Category',
		min: 1
	}
};

const schemaScopes = {
	scopes: {
		type: Array,
		label: 'Array of Scopes in Group'
	},
	'scopes.$': {
		type: String,
		label: 'Scope',
		min: 1
	}
};

export const schemaScopeGroups = {}
schemaScopeGroups.insert = new SimpleSchema({
	...schemaObject,
	...schemaScopes
});
schemaScopeGroups.update = new SimpleSchema({
	...schemaObject,
	...schemaScopes,
	_id: {
		type: String,
		regEx: SimpleSchema.RegEx.Id
	}
});
schemaScopeGroups.setScopes = new SimpleSchema({
	...schemaScopes
});

Meteor.methods({
	'scopeGroups.insert.admin'(scopeGroupItem) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaScopeGroups.insert.validate(scopeGroupItem);

		return ScopeGroups.insert(scopeGroupItem);
	},

	'scopeGroups.delete.many.admin'(idList) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		return ScopeGroups.remove({_id: {$in: idList}});
	},

	'scopeGroups.update.admin'(scopeGroupItem) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaScopeGroups.update.validate(scopeGroupItem);

		return ScopeGroups.update({_id: scopeGroupItem._id}, scopeGroupItem, {upsert: true});
	},

	'scopeGroups.setScopes.admin'(scopeGroupId, scopeList) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaScopeGroups.setScopes.validate({scopes: scopeList});

		return ScopeGroups.update({_id: scopeGroupId}, {'$set': {scopes: scopeList}}, {upsert: true});
	}
});
