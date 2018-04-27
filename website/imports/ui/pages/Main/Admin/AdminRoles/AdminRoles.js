// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Roles} from 'meteor/alanning:roles';

// NPM Imports
import React from 'react';
import {
	Grid, Button, Modal
} from 'react-bootstrap';
import {
	BootstrapTable, TableHeaderColumn
} from 'react-bootstrap-table';

// Custom Imports
import {schemaRoles} from '../../../../../api/roles.js';

export default class AdminRoles extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			roles: [],
			tableParams: {
				options: {
					afterInsertRow: this.insertRow,
					afterDeleteRow: this.deleteRow,
					insertText: 'Add Role',
					deleteText: 'Delete Selected Role(s)',
					defaultSortName: 'name',
					defaultSortOrder: 'asc'
				},
				selectRow: {
					mode: 'checkbox'
				},
				cellEdit: {
					mode: 'dbclick',
					blurToSave: true,
					afterSaveCell: this.updateRow
				}
			}
		};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.roles = Tracker.autorun(() => {
			if (this.refs.rootItem) {
				if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
					Meteor.subscribe('admin_roles');
					
					const roles = Roles.getAllRoles().fetch();
					
					this.setState({roles});
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

		schemaRoles.insert.validate(row);

		Meteor.call('roles.insert.admin', row, (err, res) => {
			if (err) {
				console.log(err);
			}
		});
	}

	deleteRow(rowIds) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		Meteor.call('roles.delete.many.admin', rowIds, (err, res) => {
			if (err) {
				console.log(err);
			}
		});
	}

	updateRow(row) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaRoles.update.validate(row);

		Meteor.call('roles.update.admin', row, (err, res) => {
			if (err) {
				console.log(err);
			}
		});
	}

	render() {
		return (
			<Grid ref='rootItem'>
				<BootstrapTable
					data={this.state.roles}
					selectRow={this.state.tableParams.selectRow}
					options={this.state.tableParams.options}
					cellEdit={this.state.tableParams.cellEdit}
					keyField='_id'
					striped hover
					insertRow	deleteRow
				>
					<TableHeaderColumn
						dataField='name'
						dataSort
					>Name</TableHeaderColumn>
					<TableHeaderColumn
						dataField='desc'
						dataSort
					>Description</TableHeaderColumn>
				</BootstrapTable>
			</Grid>
		);
	}
}