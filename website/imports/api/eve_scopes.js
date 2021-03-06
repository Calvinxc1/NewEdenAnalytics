// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';

// NPM Imports
import SimpleSchema from 'simpl-schema';

export const EveScopes = new Mongo.Collection('eve_scopes');

if (Meteor.isServer) {
	Meteor.publish('eveScopes', () => {
		if (Meteor.userId()) {
			return EveScopes.find({});
		} else {
			return null;
		}
	});

	Meteor.publish('admin_eveScopes', () => {
		if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
			return EveScopes.find({});
		} else {
			return null;
		}
	});
};

export const schemaEveScopes = new SimpleSchema({
	_id: {
		type: String,
		label: 'Scope ID',
		min: 1
	},
	cat: {
		type: String,
		label: 'Scope Category',
		min: 1
	},
	action: {
		type: String,
		label: 'Scope Action',
		min: 1
	},
	area: {
		type: String,
		label: 'Scope Area',
		min: 1
	},
	desc: {
		type: String,
		label: 'Scope Description',
		min: 0
	}
});

Meteor.methods({
	'eveScopes.insert.admin'(scopeItem) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaEveScopes.validate(scopeItem);

		return EveScopes.insert(scopeItem);
	},

	'eveScopes.delete.many.admin'(idList) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		return EveScopes.remove({_id: {$in: idList}});
	},

	'eveScopes.update.admin'(scopeItem) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaEveScopes.validate(scopeItem);

		return EveScopes.update({_id: scopeItem._id}, scopeItem, {upsert: true});
	}
});
