// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {Roles} from 'meteor/alanning:roles';

// NPM Imports
import SimpleSchema from 'simpl-schema';

export const EveCorps = new Mongo.Collection('eve_corporations');

if (Meteor.isServer) {
	Meteor.publish('eveCorps', () => {
		return EveCorps.find({});
	});

	Meteor.publish('admin_eveCorps', () => {
		if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
			return EveCorps.find({});
		} else {
			return null;
		}
	});
}
