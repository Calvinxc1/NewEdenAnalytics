// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {Roles} from 'meteor/alanning:roles';

// NPM Imports
import SimpleSchema from 'simpl-schema';

export const OreBuybackHistory = new Mongo.Collection('ore_buyback_history');
export const OreBuybackSettings = new Mongo.Collection('ore_buyback_settings');

if (Meteor.isServer) {
	Meteor.publish('member_OreBuybackHistory', () => {
		if (Roles.userIsInRole(Meteor.userId(), 'member')) {
			return OreBuybackHistory.find();
		} else {
			return null;
		}
	});

	Meteor.publish('director_OreBuybackSettings', () => {
		if (Roles.userIsInRole(Meteor.userId(), 'director')) {
			return OreBuybackSettings.find();
		} else {
			return null;
		}
	});
}

const schemaObject = {
	start_date: {
		type: Date,
		label: 'Start Date',
		min: moment().utcOffset(0).hour(0).minute(0).second(0).millisecond(0).add(1, 'd')
	},
	market_region_id: {
		type: SimpleSchema.Integer,
		label: 'Market Region ID'
	},
	market_weight: {
		type: Number,
		label: 'Market Weight'
	},
	mineral_weights: {
		type: Object,
		label: 'Mineral Weights'
	},
	'mineral_weights.$': {
		type: Number,
		label: 'Mineral Weight',
		optional: true
	},
	ore_types: {
		type: Array,
		label: 'Ore Types'
	},
	'ore_types.$': {
		type: SimpleSchema.Integer,
		label: 'Ore Type',
		optional: true
	}
};

export const schemaOreBuybackSettings = {};
schemaOreBuybackSettings.insert = new SimpleSchema({
	...schemaObject
});

Meteor.methods({
	'oreBuybackSettings.insert.director'(newSetting) {
		if (!Roles.userIsInRole(Meteor.userId(), 'director')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaOreBuybackSettings.insert.validate(newSetting);

		return OreBuybackSettings.insert(newSetting);
	},

	'oreBuybackSettings.delete.many.director'(idList) {
		if (!Roles.userIsInRole(Meteor.userId(), 'director')) {
			throw new Meteor.Error('not-authorized');
		}

		return OreBuybackSettings.remove({_id: {$in: idList}});
	},
});