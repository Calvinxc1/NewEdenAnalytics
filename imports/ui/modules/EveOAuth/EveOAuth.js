// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {OAuth} from 'meteor/oauth';
import {ServiceConfiguration} from 'meteor/service-configuration';
import {Random} from 'meteor/random';

// Custom Imports
import {EveChars} from '../../../api/eve_chars.js';
import {ScopeGroups} from '../../../api/scope_groups.js';

export default (e) => {
	Meteor.subscribe('scopeGroups', (err, res) => {
		if (err) {
			console.log(err);
		} else {
			var scopeList = [];

			Meteor.user().profile.scopeGroups.forEach((scopeGroup) => {
				const scope = ScopeGroups.findOne(new Mongo.ObjectID(scopeGroup)).scopes.forEach((scope) => {
					if (!scopeList.includes(scope)) {
						scopeList.push(scope);
					}
				});
			});

			const config = ServiceConfiguration.configurations.findOne({service: 'eve'});

			const loginStyle = OAuth._loginStyle('eve', config, {});
			const credentialToken = Random.secret();
			const redirectUri = encodeURIComponent(OAuth._redirectUri('eve', config));
			const state = OAuth._stateParam(loginStyle, credentialToken, redirectUri)
			const scopes = scopeList.join(' ')

			const loginUrl = 'https://login.eveonline.com/oauth/authorize/' +
				'?response_type=code'
				+ '&redirect_uri=' + redirectUri
				+ '&client_id=' + config.clientId
				+ '&scope=' + scopes
				+ '&state=' + state;

			Meteor.call('eveTokens.insert', credentialToken, (err, res) => {
				if (err) {
					console.log(err);
				}
			});

			OAuth.showPopup(
				loginUrl,
				(err, res) => {
					if (err) {
						console.log(err);
					}
				},
				{width: 450, height: 600}
			);
		}
	});

	
};
