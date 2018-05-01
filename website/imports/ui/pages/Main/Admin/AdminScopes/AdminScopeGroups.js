// Meteor Imports
import {Meteor} from 'meteor/meteor';

// NPM Imports
import React from 'react';
import {
	Grid, Button, Modal, ListGroup,
	ListGroupItem, Form, FormGroup, Checkbox
} from 'react-bootstrap';
import {
	BootstrapTable, TableHeaderColumn
} from 'react-bootstrap-table';

// Custom Imports
import {EveScopes} from '../../../../../api/eve_scopes.js';
import {ScopeGroups, schemaScopeGroups} from '../../../../../api/scope_groups.js';
import FA from '../../../../modules/FontAwesome/FontAwesome.js';

export default class AdminScopeGroups extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			scopeGroups: [],
			scopes: [],
			tableParams: {
				options: {
					afterInsertRow: this.insertRow,
					afterDeleteRow: this.deleteRows,
					insertText: 'Add Scope Group',
					deleteText: 'Delete Selected Scope Groups'
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
			},
			modalScopes: false,
			editGroup: {scopes: []}
		};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.scopeGroups = Tracker.autorun(() => {
			if (this.refs.rootItem) {
				if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
					Meteor.subscribe('admin_scopeGroups');

					const scopeGroups = ScopeGroups.find({}).fetch();

					this.setState({scopeGroups});
				}
			}
		});

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
		
		delete row._id;
		row.scopes = [];

		schemaScopeGroups.insert.validate(row);

		Meteor.call('scopeGroups.insert.admin', row, (err, res) => {
			if (err) {
				console.log(err);
			}
		});
	}

	deleteRows(rowIds) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		Meteor.call('scopeGroups.delete.many.admin', rowIds, (err, res) => {
			if (err) {
				console.log(err);
			}
		});	
	}

	updateRow(row) {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaScopeGroups.update.validate(row);

		Meteor.call('scopeGroups.update.admin', row, (err, res) => {
			if (err) {
				console.log(err);
			}
		});
	}

	expandRowComponent(row) {
		return (
			<div>
				<Button
					bsSize='xsmall'
					onClick={this.modalScopesShow.bind(this, row)}
					block
				><FA fa-edit /> Edit Scopes</Button>
				<ListGroup>
					{this.expandedScopes(row.scopes)}
				</ListGroup>
			</div>
		);
	}

	expandedScopes(scopeList) {
		return scopeList.map((scopeId) => {
			return(
				<ListGroupItem key={scopeId}>{scopeId}</ListGroupItem>
			);
		});
	}

	expandColumnComponent({isExpandableRow, isExpanded}) {
		if (isExpandableRow) {
			if (isExpanded) {
				return (
					<FA fa fa-caret-down />
				);
			} else {
				return (
					<FA fa fa-caret-right />
				);
			}
		} else {
			return null;
		}
	}

	modalScopesShow(editGroup) {
		this.setState({modalScopes: true, editGroup});
	}

	modalScopesHide() {
		this.setState({modalScopes: false, editGroup: {scopes: []}});	
	}

	renderModalScopes() {
		return this.state.scopes.map((scope) => {
			return (
				<FormGroup key={scope._id}>
					<Checkbox
						id={scope._id}
						checked={this.state.editGroup.scopes.includes(scope._id)}
						onChange={this.updateScopes.bind(this)}
					>{scope._id}</Checkbox>
				</FormGroup>
			);
		});
	}

	updateScopes(e) {
		var editGroup = this.state.editGroup;

		if(e.target.checked) {
			editGroup.scopes.push(e.target.id);
		} else {
			const index = editGroup.scopes.indexOf(e.target.id);

			if(index !== -1) {
				editGroup.scopes.splice(index, 1);
			}
		}

		this.setState({editGroup});
	}

	saveScopes() {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaScopeGroups.setScopes.validate({
			scopes: this.state.editGroup.scopes
		});

		Meteor.call(
			'scopeGroups.setScopes.admin',
			this.state.editGroup._id,
			this.state.editGroup.scopes,
			(err, res) => {
				if (err) {
					console.log(err);
				}
			}
		);

		this.modalScopesHide.bind(this)();
	}

	render() {
		return (
			<Grid ref='rootItem'>
				<Modal
					show={this.state.modalScopes}
					onHide={this.modalScopesHide.bind(this)}
				>
					<Modal.Header>
					  <Modal.Title>Scopes for Group</Modal.Title>
					</Modal.Header>

					<Modal.Body>
						<Form>{this.renderModalScopes.bind(this)()}</Form>
					</Modal.Body>

					<Modal.Footer>
						<Button onClick={this.modalScopesHide.bind(this)}>Close</Button>
						<Button bsStyle="primary" onClick={this.saveScopes.bind(this)}>Save changes</Button>
					</Modal.Footer>
				</Modal>
				<BootstrapTable
					data={this.state.scopeGroups}
					selectRow={this.state.tableParams.selectRow}
					options={this.state.tableParams.options}
					expandableRow={() => {return true}}
					expandComponent={this.expandRowComponent.bind(this)}
					expandColumnOptions={this.state.tableParams.expandColumnOptions}
					cellEdit={this.state.tableParams.cellEdit}
					keyField='_id'
					striped hover
					insertRow deleteRow
				>
					<TableHeaderColumn
						dataField='_id'
						hidden hiddenOnInsert
						autoValue
					>Record ID</TableHeaderColumn>
					<TableHeaderColumn
						dataField='cat'
						dataSort
					>Category</TableHeaderColumn>
					<TableHeaderColumn
						dataField='name'
						dataSort
					>Name</TableHeaderColumn>
				</BootstrapTable>
			</Grid>
		);
	}
}
