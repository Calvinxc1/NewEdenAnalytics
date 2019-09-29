// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {MysqlSubscription} from 'meteor/numtel:mysql';

if (Meteor.isServer) {
	// Custom Imports
	import {SqlConn} from './sql_conn.js';

	Meteor.publish('marketGroups.oreBuybackOreGroups', () => {
		if (Roles.userIsInRole(Meteor.userId(), 'director')) {
			return SqlConn.select(`
				SELECT TypeMarketGroups.market_group_id,
					TypeMarketGroups.market_group_name,
					TypeMarketGroups.parent_group_id,
					TypeMarketGroups.has_types
				FROM TypeMarketGroups
				WHERE TypeMarketGroups.parent_group_id IN (
						1031, 1855, 2395, 54
					)
					AND TypeMarketGroups.market_group_id NOT IN (
						1856
					)
				ORDER BY TypeMarketGroups.parent_group_id ASC,
					TypeMarketGroups.market_group_name ASC
				;`,
				[{table: 'TypeMarketGroups'}]
			);
		} else {
			return null;
		}
	});

	Meteor.publish('marketGroups.oreBuybackMineralGroups', () => {
		if (Roles.userIsInRole(Meteor.userId(), 'director')) {
			return SqlConn.select(`
				SELECT TypeMarketGroups.market_group_id,
					TypeMarketGroups.market_group_name,
					TypeMarketGroups.parent_group_id,
					TypeMarketGroups.has_types
				FROM TypeMarketGroups
				WHERE TypeMarketGroups.market_group_id IN (
						1857, 1033, 501
					)
				ORDER BY TypeMarketGroups.parent_group_id ASC,
					TypeMarketGroups.market_group_name ASC
				;`,
				[{table: 'TypeMarketGroups'}]
			);
		} else {
			return null;
		}
	})
}

export const MarketGroups = {};

MarketGroups.oreBuybackOreGroups = new MysqlSubscription('marketGroups.oreBuybackOreGroups');
MarketGroups.oreBuybackMineralGroups = new MysqlSubscription('marketGroups.oreBuybackMineralGroups');