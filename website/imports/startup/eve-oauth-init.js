import {ServiceConfiguration} from 'meteor/service-configuration';

ServiceConfiguration.configurations.upsert(
	{ service: 'eve' },
	{ $set: Meteor.settings.private.eveService}
);
