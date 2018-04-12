// Meteor Imports
import {Meteor} from 'meteor/meteor';

// NPM Imports
import React from 'react';
import {
	Grid, Button, Modal
} from 'react-bootstrap';
import {
	BootstrapTable, TableHeaderColumn
} from 'react-bootstrap-table';
import {browserHistory} from 'react-router';

export default class AdminUsers extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			users: [],
			tableParams: {
				options: {
					onRowClick: (row) => {
						browserHistory.push(`/admin/users/${row._id}`);
					}
				}
			}
		};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.scopes = Tracker.autorun(() => {
			if (this.refs.rootItem) {
				if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
					Meteor.subscribe('admin_users');

					const users = Meteor.users.find({}, {fields: {
						createdAt: 1,
						username: 1,
						scopeGroups: 1,
						roles: 1
					}}).fetch();

					this.setState({users});
				}
			}
		});
	}

	comnponentWillUnmount() {
		for (var key in this.trackers) {
			if (this.trackers.hasOwnProperty(key)) {
				this.trackers[key].stop();
			}
		}
	}

	render() {
		return (
			<Grid ref='rootItem'>
				<BootstrapTable
					data={this.state.users}
					options={this.state.tableParams.options}
					striped hover
				>
					<TableHeaderColumn
						dataField='_id'
						isKey hidden
					>User ID</TableHeaderColumn>

					<TableHeaderColumn
						dataField='username'
					>Username</TableHeaderColumn>

					<TableHeaderColumn
						dataField='createdAt'
					>Created</TableHeaderColumn>

					<TableHeaderColumn
						dataField='roles'
					>App Roles</TableHeaderColumn>

					<TableHeaderColumn
						dataField='scopeGroups'
					>API Scope Groups</TableHeaderColumn>

				</BootstrapTable>
			</Grid>
		);
	}
}