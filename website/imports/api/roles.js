// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Roles} from 'meteor/alanning:roles';

// NPM Imports
import SimpleSchema from 'simpl-schema';

if (Meteor.isServer) {
	Meteor.publish('admin_roles', () => {
		if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
			return Meteor.roles.find({});
		} else {
			return null;
		}
	});
};

const schemaObject = {
	name: {
		type: String,
		label: 'Role Name',
		min: 1
	},
	desc: {
		type: String,
		label: 'Role Description',
		min: 1
	}
};

export const schemaRoles = {};
schemaRoles.insert = new SimpleSchema(schemaObject);
schemaRoles.update = new SimpleSchema({
	...schemaObject,
	_id: {
		type: String,
		label: 'Role ID',
		min: 1
	}
});

Meteor.methods({
	'roles.insert.admin'(roleItem) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaRoles.insert.validate(roleItem);

		Roles.createRole(roleItem.name);
		return Meteor.roles.update({name: roleItem.name}, {$set: {...roleItem}});
	},

	'roles.delete.many.admin'(roleList) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		return Meteor.roles.remove({_id: {'$in': roleList}});
	},

	'roles.update.admin'(roleItem) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaRoles.update.validate(roleItem);

		return Meteor.roles.update({_id: roleItem._id}, {$set: roleItem});
	},
});