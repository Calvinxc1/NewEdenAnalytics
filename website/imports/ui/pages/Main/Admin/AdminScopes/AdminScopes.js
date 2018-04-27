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
import {EveScopes} from '../../../../../api/eve_scopes.js';
import {schemaEveScopes} from '../../../../../api/eve_scopes.js';
import FA from '../../../../modules/FontAwesome/FontAwesome.js';

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
					mode: 'checkbox',
					clickToSelect: false,
					clickToExpand: true
				},
				cellEdit: {
					mode: 'dbclick',
					blurToSave: true,
					afterSaveCell: this.updateRow
				},
				expandColumnOptions: {
					expandColumnVisible: true,
					expandColumnComponent: this.expandColumnComponent,
					columnWidth: 50
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

	updateRow(row) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaEveScopes.validate(row);
		
		Meteor.call('eveScopes.update.admin', row, (err, res) => {
			if (err) {
				console.log(err);
			}
		});
	}

	expandRowComponent(row) {
		return (
			<div>
				{row.desc}
			</div>
		);
	}

	expandColumnComponent({isExpandableRow, isExpanded}) {
		if (isExpandableRow) {
			if (isExpanded) {
				return (
					<FA fa-caret-down />
				);
			} else {
				return (
					<FA fa-caret-right />
				);
			}
		} else {
			return null;
		}
	}

	render() {
		return (
			<Grid ref='rootItem'>
				<BootstrapTable
					data={this.state.scopes}
					selectRow={this.state.tableParams.selectRow}
					options={this.state.tableParams.options}
					cellEdit={this.state.tableParams.cellEdit}
					expandableRow={() => {return true}}
					expandComponent={this.expandRowComponent.bind(this)}
					expandColumnOptions={this.state.tableParams.expandColumnOptions}
					keyField='_id'
					striped hover
					insertRow	deleteRow
				>
					<TableHeaderColumn
						dataField='_id'
						width='300'
						dataSort
					>Scope ID</TableHeaderColumn>
					<TableHeaderColumn
						dataField='cat'
						dataSort
					>Category</TableHeaderColumn>
					<TableHeaderColumn
						dataField='action'
						dataSort
					>Action</TableHeaderColumn>
					<TableHeaderColumn
						dataField='area'
						dataSort
					>Area</TableHeaderColumn>
					<TableHeaderColumn
						dataField='desc'
						hidden
					>Description</TableHeaderColumn>
				</BootstrapTable>
			</Grid>
		);
	}
}