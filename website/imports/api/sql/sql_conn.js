// Meteor Imports
import {LiveMysql} from 'meteor/numtel:mysql';

if (Meteor.isServer) {
	export const SqlConn = new LiveMysql(Meteor.settings.private.sqlServer);
}
