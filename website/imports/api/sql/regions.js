// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {MysqlSubscription} from 'meteor/numtel:mysql';

if (Meteor.isServer) {
	// Custom Imports
	import {SqlConn} from './sql_conn.js';

	Meteor.publish('sql_regions', () => {
		if (Meteor.userId()) {
			return SqlConn.select(
				'SELECT Regions.region_id, Regions.region_name FROM Regions;',
				[{table: 'Regions'}]
			);
		} else {
			return null;
		}
	});
}

export const Regions = new MysqlSubscription('sql_regions');