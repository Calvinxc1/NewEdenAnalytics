// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Roles} from 'meteor/alanning:roles';
import {Session} from 'meteor/session';

// NPM Imports
import React from 'react';
import {browserHistory} from 'react-router';

const unauthenticatedPages = [
	'/',
	'/signup'
];
const authenticatedPages = [
	'/dashboard',
	'/settings'
];
const adminPages = [
	'/admin'
];

export const onEnterPublicPage = (nextState) => {
	if(Meteor.userId()) {
		browserHistory.replace('/dashboard');
	} else {
		setSessionVars(nextState.params);
	}
};

export const onEnterPrivatePage = (nextState) => {
	if(!Meteor.userId()) {
		browserHistory.replace('/');
	} else {
		setSessionVars(nextState.params);
	}
};

export const onEnterAdminPage = (nextState) => {
	if(!Roles.userIsInRole(Meteor.userId(), 'admin')) {
		browserHistory.replace('/');
	} else {
		setSessionVars(nextState.params);
	}
};

const setSessionVars = (params) => {
	for (var key in params) {
		if (params.hasOwnProperty(key)) {
			Session.set(key, params[key]);
		}
	}
}

export const onAuthChange = (isAuthenticated, isAdmin) => {
	const pathName = browserHistory.getCurrentLocation().pathname;
	const isUnauthenticatedPage = unauthenticatedPages.includes(pathName);
	const isAuthenticatedPage = authenticatedPages.includes(pathName);
	const isAdminPage = adminPages.includes(pathName);

	if(isUnauthenticatedPage && isAuthenticated) {
		browserHistory.replace('/dashboard');
	} else if(isAuthenticatedPage && !isAuthenticated) {
		browserHistory.replace('/');
	} else if(isAdminPage && !isAdmin) {
		browserHistory.replace('/');
	}
};