// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';

// NPM Imports
import SimpleSchema from 'simpl-schema';

export const EveTokens = new Mongo.Collection('eve_tokens');

Meteor.methods({
	'eveTokens.insert'(credentialToken) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}

		new SimpleSchema({
			credentialToken: {
				type: String,
				label: 'Credential Token',
				min: 43,
				max: 43
			}
		}).validate({credentialToken});

		EveTokens.insert({
			_id: credentialToken,
			userId: Meteor.userId(),
			createdAt: new Date()
		});
	}
});
