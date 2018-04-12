// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Tracker} from 'meteor/tracker';

// NPM Imports
import React from 'react';
import {Link} from 'react-router';
import {
	Navbar,	Nav,	NavItem
} from 'react-bootstrap';

// Custom Imports
import PrivateNavUser from './PrivateNavUser.js';
import PrivateNavAdmin from './PrivateNavAdmin.js';

export default (props) => {
	return (
		<Navbar>
			<Navbar.Header><Navbar.Brand>
				<Link to='/dashboard'>New Eden Analytics</Link>
			</Navbar.Brand></Navbar.Header>
			<Navbar.Collapse>
				<Nav pullRight>
					<PrivateNavAdmin />
					<PrivateNavUser />
				</Nav>
			</Navbar.Collapse>
		</Navbar>
	);
};