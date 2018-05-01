// Meteor Imports
import {Meteor} from 'meteor/meteor';

// NPM Imports
import React from 'react';
import {Router, Route, browserHistory} from 'react-router';

// Custom Imports
import {
	onEnterPublicPage,
	onEnterPrivatePage,
	onEnterAdminPage
} from './pageAuth.js';

// Public Routes
import Home from '../ui/pages/Main/Public/Home/Home.js';
import Signup from '../ui/pages/Main/Public/Signup/Signup.js';

// Private Routes
import Dashboard from '../ui/pages/Main/Private/Dashboard/Dashboard.js';
import UserSettings from '../ui/pages/Main/Private/UserSettings/UserSettings.js';
import UserChars from '../ui/pages/Main/Private/UserChars/UserChars.js';

// Corp Routes
import OreBuyback from '../ui/pages/Main/Corp/OreBuyback/OreBuyback.js';
import OreBuybackConfig from '../ui/pages/Main/Corp/OreBuyback/OreBuybackConfig.js';

// Admin Routes
import AdminDashboard from '../ui/pages/Main/Admin/AdminDashboard/AdminDashboard.js';
import AdminChars from '../ui/pages/Main/Admin/AdminChars/AdminChars.js';
import AdminCharacter from '../ui/pages/Main/Admin/AdminChars/AdminCharacter/AdminCharacter.js';
import AdminScopes from '../ui/pages/Main/Admin/AdminScopes/AdminScopes.js';
import AdminScopeGroups from '../ui/pages/Main/Admin/AdminScopes/AdminScopeGroups.js';
import AdminUsers from '../ui/pages/Main/Admin/AdminUsers/AdminUsers.js';
import AdminRoles from '../ui/pages/Main/Admin/AdminRoles/AdminRoles.js';

// Other Routes
import NotFound from '../ui/pages/Main/NotFound/NotFound.js';

const routesMain = (
	<Router history={browserHistory}>
		<Route path='/' component={Home} onEnter={onEnterPublicPage} />
		<Route path='/signup' component={Signup} onEnter={onEnterPublicPage} />

		<Route path='/dashboard' component={Dashboard} onEnter={onEnterPrivatePage} />
		<Route path='/user/settings' component={UserSettings} onEnter={onEnterPrivatePage} />
		<Route path='/user/chars' component={UserChars} onEnter={onEnterPrivatePage} />
		
		<Route path='/corp/ore_buyback' component={OreBuyback} onEnter={onEnterPrivatePage} />
		<Route path='/corp/ore_buyback/config' component={OreBuybackConfig} onEnter={onEnterPrivatePage} />

		<Route path='/admin' component={AdminDashboard} onEnter={onEnterAdminPage} />
		<Route path='/admin/users' component={AdminUsers} onEnter={onEnterAdminPage} />
		<Route path='/admin/chars' component={AdminChars} onEnter={onEnterAdminPage} />
		<Route path='/admin/chars/:id' component={AdminCharacter} onEnter={onEnterAdminPage} />
		<Route path='/admin/scopes' component={AdminScopes} onEnter={onEnterAdminPage} />
		<Route path='/admin/scopes/groups' component={AdminScopeGroups} onEnter={onEnterAdminPage} />
		<Route path='/admin/roles' component={AdminRoles} onEnter={onEnterAdminPage} />
		
		<Route path='*' component={NotFound} />
	</Router>
);

export default routesMain;