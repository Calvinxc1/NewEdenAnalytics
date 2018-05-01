// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Tracker} from 'meteor/tracker';

// NPM Imports
import React from 'react';
import {Link} from 'react-router';
import {
	Navbar,	Nav,	NavItem, Image
} from 'react-bootstrap';

// Custom Imports
import PrivateNavUser from './PrivateNavUser.js';
import PrivateNavAdmin from './PrivateNavAdmin.js';
import PrivateNavCorp from './PrivateNavCorp.js';

export default (props) => {
	return (
		<Navbar>
			<Navbar.Header><Navbar.Brand>
				<Link to='/dashboard'>
					Tritanium Forge Industries
				</Link>
			</Navbar.Brand></Navbar.Header>
			<Navbar.Collapse>
				<Nav pullRight>
					<PrivateNavCorp />
					<PrivateNavAdmin />
					<PrivateNavUser />
				</Nav>
			</Navbar.Collapse>
		</Navbar>
	);
};