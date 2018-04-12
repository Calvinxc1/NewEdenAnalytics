// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';

// NPM Imports
import React from 'react';
import {
	Grid, Image, Carousel, Jumbotron
} from 'react-bootstrap';
import numeral from 'numeral';

// Custom Imports
import {ScopeGroups} from '../../../../../../api/scope_groups.js';
import AdminUserScopeGroups from './AdminUserScopeGroups.js';

export default class AdminUser extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			user: {},
			scopeGroups: []
		};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.user = Tracker.autorun(() => {
			const user = Meteor.user()
			if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
				Meteor.subscribe('admin_users');
				Meteor.subscribe('admin_scopeGroups');

				const user_id = Session.get('id');
				const user = Meteor.users.findOne(user_id,	{fields: {
					createdAt: 1,	username: 1, emails: 1,	profile: 1,
					roles: 1
				}});

				this.setState({user});
			}
		});
	}

	componentWillUnmount() {
		for (var key in this.trackers) {
			if (this.trackers.hasOwnProperty(key)) {
				this.trackers[key].stop();
			}
		}
	}

	render() {
		return (
			<Grid>
				<h3>{this.state.user.username}</h3>
				<AdminUserScopeGroups />
			</Grid>
		);
	}
};
