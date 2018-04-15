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
import {EveScopes} from '../../../../../api/eve_scopes.js';
import {schemaEveScopes} from '../../../../../api/eve_scopes.js';

export default class AdminScopes extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			scopes: [],
			tableParams: {
				options: {
					afterInsertRow: this.insertRow,
					afterDeleteRow: this.deleteRow,
					insertText: 'Add Scope',
					deleteText: 'Delete Selected Scopes',
					defaultSortName: '_id',
					defaultSortOrder: 'asc'
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
					Meteor.subscribe('admin_eveScopes');

					const scopes = EveScopes.find({}).fetch();

					this.setState({scopes});
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

		schemaEveScopes.validate(row);

		Meteor.call('eveScopes.insert.admin', row, (err, res) => {
			if (err) {
				console.log(err);
			}
		});
	}

	deleteRow(rowIds) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		Meteor.call('eveScopes.delete.many.admin', rowIds, (err, res) => {
			if (err) {
				console.log(err);
			}
		});	
	}

	render() {
		return (
			<Grid ref='rootItem'>
				<BootstrapTable
					data={this.state.scopes}
					selectRow={this.state.tableParams.selectRow}
					options={this.state.tableParams.options}
					striped hover
					insertRow	deleteRow
				>
					<TableHeaderColumn
						dataField='_id'
						dataSort isKey
					>Scope ID</TableHeaderColumn>
					<TableHeaderColumn
						dataField='name'
						dataSort
					>Scope Name</TableHeaderColumn>
					<TableHeaderColumn
						dataField='desc'
						dataSort
					>Description</TableHeaderColumn>
				</BootstrapTable>
			</Grid>
		);
	}
}