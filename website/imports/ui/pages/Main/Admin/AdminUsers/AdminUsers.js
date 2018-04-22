// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {moment} from 'meteor/momentjs:moment';

// NPM Imports
import React from 'react';
import {
	Grid, Button, Modal
} from 'react-bootstrap';
import {
	BootstrapTable, TableHeaderColumn
} from 'react-bootstrap-table';
import {browserHistory} from 'react-router';

// Custom Imports
import FA from '../../../../modules/FontAwesome/FontAwesome.js';

export default class AdminUsers extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			users: [],
			tableParams: {},
			roleModal: false
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
	}

	comnponentWillUnmount() {
		for (var key in this.trackers) {
			if (this.trackers.hasOwnProperty(key)) {
				this.trackers[key].stop();
			}
		}
	}

	rolesModalShow() {
		this.setState({roleModal: true});
	}

	rolesModalHide() {
		this.setState({roleModal: false});	
	}

	expandComponent(row) {
		return (
			<div>
				<Button bsStyle="success" bsSize="small" onClick={this.rolesModalShow.bind(this)}>
					Edit Roles
				</Button>
				<p>{row.roles}</p>
				<Modal show={this.state.roleModal} onHide={this.rolesModalHide.bind(this)}>
					<Modal.Header>
					  <Modal.Title>Modal title</Modal.Title>
					</Modal.Header>

					<Modal.Body>One fine body...</Modal.Body>

					<Modal.Footer>
						<Button>Close</Button>
						<Button bsStyle="primary">Save changes</Button>
					</Modal.Footer>
				</Modal>
			</div>
		);
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
			<Grid ref='rootItem'>
				<BootstrapTable
					data={this.state.users}
					options={this.state.tableParams.options}
					expandableRow={() => {return true}}
					expandComponent={this.expandComponent.bind(this)}
					expandColumnOptions={{
	          expandColumnVisible: true,
	          expandColumnComponent: this.expandColumnComponent,
	          columnWidth: 50
	        }}
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
					>Administrator?</TableHeaderColumn>

				</BootstrapTable>
			</Grid>
		);
	}
}