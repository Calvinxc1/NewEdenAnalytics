// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {Roles} from 'meteor/alanning:roles';

// NPM Imports
import SimpleSchema from 'simpl-schema';

export const OreBuyback = new Mongo.Collection('ore_buyback');
export const OreBuybackSettings = new Mongo.Collection('ore_buyback_settings');

if (Meteor.isServer) {
	Meteor.publish('member_OreBuyback', () => {
		if (Roles.userIsInRole(Meteor.userId(), 'member')) {
			return OreBuyback.find();
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
		min: moment.utc().set({
			'hour': 23,
			'minute': 59,
			'second': 59,
			'milisecond': 999
		}).toDate()
	},
	market_region_id: {
		type: SimpleSchema.Integer,
		label: 'Market Region ID'
	},
	market_weight: {
		type: Number,
		label: 'Market Weight'
	}
};
const schemaOre = {
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
const schemaMineralWeights = {
	mineral_weights: {
		type: Object,
		label: 'Mineral Weights',
		optional: true,
		blackbox: true
	}
}

export const schemaOreBuybackSettings = {
	root: {},
	oreTypes: {},
	mineralWeights: {}
};

schemaOreBuybackSettings.root.insert = new SimpleSchema({
	...schemaObject,
	...schemaOre,
	...schemaMineralWeights
});
schemaOreBuybackSettings.root.delete = new SimpleSchema({
	...schemaObject,
	...schemaOre,
	...schemaMineralWeights,
	_id: {
		type: String,
		label: "Document ID",
		optional: true
	}
});
schemaOreBuybackSettings.oreTypes.set = new SimpleSchema({
	...schemaOre
});
schemaOreBuybackSettings.mineralWeights.set = new SimpleSchema({
	...schemaMineralWeights
});

Meteor.methods({
	'oreBuybackSettings.insert.director'(newSetting) {
		if (!Roles.userIsInRole(Meteor.userId(), 'director')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaOreBuybackSettings.root.insert.validate(newSetting);

		return OreBuybackSettings.insert(newSetting);
	},

	'oreBuybackSettings.delete.many.director'(idList) {
		if (!Roles.userIsInRole(Meteor.userId(), 'director')) {
			throw new Meteor.Error('not-authorized');
		}

		return OreBuybackSettings.remove({_id: {$in: idList}});
	},

	'oreBuybackSettings.oreTypes.set.director'(_id, ore_types) {
		if (!Roles.userIsInRole(Meteor.userId(), 'director')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaOreBuybackSettings.oreTypes.set.validate({ore_types});

		return OreBuybackSettings.update(
			{_id},
			{$set: {ore_types}}
		);
	},

	'oreBuybackSettings.mineralWeights.set.director'(_id, mineral_weights) {
		if (!Roles.userIsInRole(Meteor.userId(), 'director')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaOreBuybackSettings.mineralWeights.set.validate({mineral_weights});

		return OreBuybackSettings.update(
			{_id},
			{$set: {mineral_weights}}
		);
	}
});