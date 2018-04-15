// Meteor Imports
import {Meteor} from 'meteor/meteor';

// NPM Imports
import React from 'react';
import {Link} from 'react-router';
import {
	Navbar,	Nav, NavItem, NavDropdown,
	MenuItem, Button
} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap';

// Custom Imports
import PublicNavLogin from './PublicNavLogin.js';

export default (props) => {
	return (
		<Navbar>
			<Navbar.Header><Navbar.Brand>
				<Link to='/'>New Eden Analytics</Link>
			</Navbar.Brand></Navbar.Header>
			<Navbar.Collapse>
				<Nav pullRight>
					<NavDropdown
						eventKey={1}
						title='Login'
						id='navbar-login-dropdown'
					>
						<PublicNavLogin />
						<LinkContainer
							to='/signup'
							className='text-center'
						><MenuItem eventKey={1.2}>
							Create Account
						</MenuItem></LinkContainer>
					</NavDropdown>
				</Nav>
			</Navbar.Collapse>
		</Navbar>
	);
};
