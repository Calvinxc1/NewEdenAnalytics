// Meteor Imports
import {Meteor} from 'meteor/meteor';

// NPM Imports
import React from 'react';
import {Router, Route, browserHistory} from 'react-router';

// Routes
import PublicNav from '../ui/pages/Navbar/PublicNav/PublicNav.js';
import PrivateNav from '../ui/pages/Navbar/PrivateNav/PrivateNav.js';
import EmptyNav from '../ui/pages/Navbar/EmptyNav/EmptyNav.js';

const routesNavbar = (
	<Router history={browserHistory}>
		<Route path='/' component={PublicNav} />
		
		<Route path='/dashboard' component={PrivateNav} />
		<Route path='/settings' component={PrivateNav} />
		<Route path='/admin' component={PrivateNav} />
		<Route path='/admin/*' component={PrivateNav} />

		<Route path='/signup' component={EmptyNav} />
		<Route path='*' component={EmptyNav} />
	</Router>
);

export default routesNavbar;