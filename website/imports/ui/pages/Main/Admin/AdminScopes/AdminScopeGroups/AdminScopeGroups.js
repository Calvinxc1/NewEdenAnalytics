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

// Custom Imports
import {ScopeGroups} from '../../../../../../api/scope_groups.js';
import {schemaScopeGroups} from '../../../../../../api/scope_groups.js';

export default class AdminScopeGroups extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			scopeGroups: [],
			tableParams: {
				options: {
					afterInsertRow: this.insertRow,
					afterDeleteRow: this.deleteRow,
					insertText: 'Add Scope Group',
					deleteText: 'Delete Selected Scope Groups'
				},
				selectRow: {
					mode: 'checkbox'
				}
			}
		};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.scopes = Tracker.autorun(() => {
			if (this.refs.rootItem) {
				if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
					Meteor.subscribe('admin_scopeGroups');

					const scopeGroups = ScopeGroups.find({}).fetch();

					this.setState({scopeGroups});
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

	insertRow(row) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaScopeGroups.validate(row);

		Meteor.call('scopeGroups.insert.admin', row, (err, res) => {
			if (err) {
				console.log(err);
			}
		});
	}

	deleteRow(rowIds) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		Meteor.call('scopeGroups.delete.many.admin', rowIds, (err, res) => {
			if (err) {
				console.log(err);
			}
		});	
	}

	render() {
		return (
			<Grid ref='rootItem'>
				<BootstrapTable
					data={this.state.scopeGroups}
					selectRow={this.state.tableParams.selectRow}
					options={this.state.tableParams.options}
					striped hover
					insertRow deleteRow
				>
					<TableHeaderColumn
						dataField='_id'
						isKey hidden
					>Group ID</TableHeaderColumn>
					<TableHeaderColumn
						dataField='category'
						dataSort
					>Category</TableHeaderColumn>
					<TableHeaderColumn
						dataField='name'
						dataSort
					>Group Name</TableHeaderColumn>
					<TableHeaderColumn
						dataField='scopes'
						dataSort
					>Group Scopes</TableHeaderColumn>
				</BootstrapTable>
			</Grid>
		);
	}
}