// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Roles} from 'meteor/alanning:roles';

// NPM Imports
import React from 'react';
import {
	NavDropdown, MenuItem
} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap';

export default class PrivateNavAdmin extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isAdmin: false
		};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.admin = Tracker.autorun(() => {
			if (this.refs.rootItem) {
				if (Meteor.userId()) {
					this.setState({isAdmin: Roles.userIsInRole(Meteor.userId(), 'admin')});
				} else {
					this.setState({isAdmin: false});
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
		if (this.state.isAdmin) {
			return (
				<NavDropdown
					eventKey={2}
					title='Admin'
					id='nav-admin-dropdown'
					ref='rootItem'
				>
					<LinkContainer to='/admin'>
						<MenuItem eventKey={2.1}>Dashboard</MenuItem>
					</LinkContainer>
					<MenuItem divider />
					<LinkContainer to='/admin/roles'>
						<MenuItem eventKey={2.2}>Roles</MenuItem>
					</LinkContainer>
					<LinkContainer to='/admin/users'>
						<MenuItem eventKey={2.3}>Users</MenuItem>
					</LinkContainer>
					<LinkContainer to='/admin/chars'>
						<MenuItem eventKey={2.4}>Characters</MenuItem>
					</LinkContainer>
					<LinkContainer to='/admin/scopes'>
						<MenuItem eventKey={2.5}>Scopes</MenuItem>
					</LinkContainer>
					<LinkContainer to='/admin/scopes/groups'>
						<MenuItem eventKey={2.6}>Scope Groups</MenuItem>
					</LinkContainer>
				</NavDropdown>
			);
		} else {
			return <div ref='rootItem'></div>;
		}
	}
};