// Meteor Imports
import {Meteor} from 'meteor/meteor';

// NPM Imports
import React from 'react';
import {
	NavDropdown, MenuItem
} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap';

export default class PrivateNavUser extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			username: ''
		};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.username = Tracker.autorun(() => {
			if (this.refs.navDrop) {
				if (Meteor.user()) {
					this.setState({username: Meteor.user().username});
				} else {
					this.setState({username: ''});
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
			<NavDropdown
				eventKey={1}
				title={this.state.username}
				id='nav-user-dropdown'
				ref='navDrop'
			>
				<LinkContainer to='/user/settings'>
					<MenuItem eventKey={1.1}>Settings</MenuItem>
				</LinkContainer>
				<LinkContainer to='/user/chars'>
					<MenuItem eventKey={1.2}>Characters</MenuItem>
				</LinkContainer>
				<MenuItem divider />
				<MenuItem
					eventKey={1.2}
					onClick={() => Meteor.logout()}
				>Logout</MenuItem>
			</NavDropdown>
		);
	}
};
