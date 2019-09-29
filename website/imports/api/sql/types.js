// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {MysqlSubscription} from 'meteor/numtel:mysql';

if (Meteor.isServer) {
	// Custom Imports
	import {SqlConn} from './sql_conn.js';

	Meteor.publish('types.oreBuybackOreTypes', () => {
		if (Roles.userIsInRole(Meteor.userId(), ['director', 'member'])) {
			return SqlConn.select(`
				SELECT Types.type_id AS id,
					Types.type_name AS name,
					Types.market_group_id
				FROM Types
				JOIN TypeMarketGroups
					ON Types.market_group_id = TypeMarketGroups.market_group_id
				WHERE TypeMarketGroups.parent_group_id IN (
						1031, 1855, 2395, 54
					)
					AND TypeMarketGroups.market_group_id NOT IN (
						1856
					)
				ORDER BY Types.type_name ASC
				;`,
				[{table: 'Types'}, {table: 'TypeMarketGroups'}]
			);
		} else {
			return null;
		}
	});

	Meteor.publish('types.oreBuybackMineralTypes', () => {
		if (Roles.userIsInRole(Meteor.userId(), 'director')) {
			return SqlConn.select(`
				SELECT Types.type_id AS id,
					Types.type_name AS name,
					Types.market_group_id
				FROM Types
				WHERE Types.market_group_id IN (
						1857, 1033, 501
					)
				ORDER BY Types.type_name ASC
				;`,
				[{table: 'Types'}]
			);
		} else {
			return null;
		}
	});
}

export const Types = {};

Types.oreBuybackOreTypes = new MysqlSubscription('types.oreBuybackOreTypes');
Types.oreBuybackMineralTypes = new MysqlSubscription('types.oreBuybackMineralTypes');