// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {MysqlSubscription} from 'meteor/numtel:mysql';

if (Meteor.isServer) {
	// Custom Imports
	import {SqlConn} from './sql_conn.js';

	Meteor.publish('marketGroups.oreBuybackOreGroups', () => {
		if (Roles.userIsInRole(Meteor.userId(), 'director')) {
			return SqlConn.select(`
				SELECT MarketGroups.market_group_id,
					MarketGroups.market_group_name,
					MarketGroups.parent_group_id,
					MarketGroups.has_types
				FROM MarketGroups
				WHERE MarketGroups.parent_group_id IN (
						1031, 1855, 2395, 54
					)
					AND MarketGroups.market_group_id NOT IN (
						1856
					)
				ORDER BY MarketGroups.parent_group_id ASC,
					MarketGroups.market_group_name ASC
				;`,
				[{table: 'MarketGroups'}]
			);
		} else {
			return null;
		}
	});

	Meteor.publish('marketGroups.oreBuybackMineralGroups', () => {
		if (Roles.userIsInRole(Meteor.userId(), 'director')) {
			return SqlConn.select(`
				SELECT MarketGroups.market_group_id,
					MarketGroups.market_group_name,
					MarketGroups.parent_group_id,
					MarketGroups.has_types
				FROM MarketGroups
				WHERE MarketGroups.market_group_id IN (
						1857, 1033, 501
					)
				ORDER BY MarketGroups.parent_group_id ASC,
					MarketGroups.market_group_name ASC
				;`,
				[{table: 'MarketGroups'}]
			);
		} else {
			return null;
		}
	})
}

export const MarketGroups = {};

MarketGroups.oreBuybackOreGroups = new MysqlSubscription('marketGroups.oreBuybackOreGroups');
MarketGroups.oreBuybackMineralGroups = new MysqlSubscription('marketGroups.oreBuybackMineralGroups');