// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {Roles} from 'meteor/alanning:roles';

// NPM Imports
import SimpleSchema from 'simpl-schema';

export const EveChars = new Mongo.Collection('eve_characters');

if (Meteor.isServer) {
	Meteor.publish('eveChars', (user) => {
		if (user._id == Meteor.userId()) {
			return EveChars.find(
				{_id: {$in: user.profile.characters}},
				{fields: {char_name: 1, corp_id: 1, 'tokens.enabled_scopes': 1}}
			);
		} else {
			return null;
		}
	});

	Meteor.publish('admin_eveChars', () => {
		if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
			return EveChars.find({});
		} else {
			return null;
		}
	});
};

Meteor.methods({
	'eveChars.enabled_scopes.update.admin'(charId, enabledScopes) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		new SimpleSchema({
			charId: {
				type: Number,
				label: 'Character ID'
			},
			enabledScopes: {
				type: Array,
				label: 'Enabled Scopes'
			},
			'enabledScopes.$': {
				type: String,
				label: 'Scope',
				optional: true
			}
		}).validate({charId, enabledScopes});

		EveChars.update(charId,
			{$set: {'tokens.enabled_scopes' : enabledScopes}}
		);
	}
});
