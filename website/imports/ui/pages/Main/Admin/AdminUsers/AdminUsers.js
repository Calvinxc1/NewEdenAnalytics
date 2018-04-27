// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {moment} from 'meteor/momentjs:moment';
import {Roles} from 'meteor/alanning:roles';

// NPM Imports
import React from 'react';
import {
	Grid, Form, FormGroup, Checkbox,
	Button, Modal, Well, ListGroup,
	ListGroupItem
} from 'react-bootstrap';
import {
	BootstrapTable, TableHeaderColumn
} from 'react-bootstrap-table';
import {browserHistory} from 'react-router';

// Custom Imports
import FA from '../../../../modules/FontAwesome/FontAwesome.js';
import {schemaUsers} from '../../../../../api/users.js';

export default class AdminUsers extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			users: [],
			roles: [],
			tableParams: {
				expandColumnOptions: {
					expandColumnVisible: true,
					expandColumnComponent: this.expandColumnComponent,
					columnWidth: 50
				}
			},
			editUser: {roles: []},
			roleModal: false
		};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.users = Tracker.autorun(() => {
			if (this.refs.rootItem) {
				if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
					Meteor.subscribe('admin_users');

					const users = Meteor.users.find({}, {fields: {
						createdAt: 1,
						username: 1,
						roles: 1
					}}).map((user) => {
						return {
							...user,
							createdAt: moment(user.createdAt).format("YYYY-MM-DD"),
							roles: user.roles.__global_roles__,
							admin: user.roles.__global_roles__.includes("admin")
						};
					});

					this.setState({users});
				}
			}
		});
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

	rolesModalShow(editUser) {
		this.setState({roleModal: true, editUser});
	}

	rolesModalHide() {
		this.setState({roleModal: false, editUser: {roles: []}});	
	}

	updateRoles(e) {
		var editUser = this.state.editUser;

		if(e.target.checked) {
			editUser.roles.push(e.target.id);
		} else {
			const index = editUser.roles.indexOf(e.target.id);

			if(index !== -1) {
				editUser.roles.splice(index, 1);
			}
		}

		this.setState({editUser});
	}

	saveRoles() {
		if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaUsers.setRoles.validate({
			roles: {
				__global_roles__:	this.state.editUser.roles
			}
		});

		Meteor.call('accounts.setRoles.admin', this.state.editUser._id, this.state.editUser.roles, (err, res) => {
			if (err) {
				console.log(err);
			}
		});

		this.rolesModalHide.bind(this)();
	}

	renderModalRoles() {
		return this.state.roles.map((role) => {
			return (
				<FormGroup key={role.name}>
					<Checkbox
						id={role.name}
						checked={this.state.editUser.roles.includes(role.name)}
						onChange={this.updateRoles.bind(this)}
					>{role.desc}</Checkbox>
				</FormGroup>
			);
		});
	}

	expandRowComponent(row) {
		return (
			<div>
				<Button
					bsSize="small"
					onClick={this.rolesModalShow.bind(this, row)}
					block
				>Edit Roles</Button>
				<ListGroup>
					{this.expandedRoles(row.roles)}
				</ListGroup>
			</div>
		);
	}

	expandedRoles(roleList) {
		return roleList.map((role) => {
			const roleItem = this.state.roles.filter((roleObj) => {
			  return roleObj.name == role;
			})[0];

			if(roleItem) {
				return (
					<ListGroupItem key={roleItem._id}>{roleItem.desc}</ListGroupItem>
				);
			} else {
				return null;
			}
		});
	}

	expandColumnComponent({isExpandableRow, isExpanded}) {
		if (isExpandableRow) {
			if (isExpanded) {
				return (
					<FA fa-caret-down />
				)
			} else {
				return (
					<FA fa-caret-right />
				)
			}
		} else {
			return null;
		}
	}

	render() {
		return (
			<div ref='rootItem'>
				<Modal show={this.state.roleModal} onHide={this.rolesModalHide.bind(this)}>
					<Modal.Header>
					  <Modal.Title>User Roles for {this.state.editUser.username}</Modal.Title>
					</Modal.Header>

					<Modal.Body>
						<Form>{this.renderModalRoles.bind(this)()}</Form>
					</Modal.Body>

					<Modal.Footer>
						<Button onClick={this.rolesModalHide.bind(this)}>Close</Button>
						<Button bsStyle="primary" onClick={this.saveRoles.bind(this)}>Save changes</Button>
					</Modal.Footer>
				</Modal>
				<Grid>
					<BootstrapTable
						data={this.state.users}
						options={this.state.tableParams.options}
						expandableRow={() => {return true}}
						expandComponent={this.expandRowComponent.bind(this)}
						expandColumnOptions={this.state.tableParams.expandColumnOptions}
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
							dataField='admin'
						>Admin?</TableHeaderColumn>
					</BootstrapTable>
				</Grid>
			</div>
		);
	}
}