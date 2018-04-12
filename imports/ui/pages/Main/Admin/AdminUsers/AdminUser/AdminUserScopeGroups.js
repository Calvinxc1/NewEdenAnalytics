// Meteor Imports
import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';

// NPM Imports
import React from 'react';
import {
	Form, FormGroup, Checkbox, Button
} from 'react-bootstrap';
import numeral from 'numeral';

// Custom Imports
import {ScopeGroups} from '../../../../../../api/scope_groups.js';

export default class AdminUserScopeGroups extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.user = Tracker.autorun(() => {
			const user = Meteor.user()
			if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
				Meteor.subscribe('admin_users');
				Meteor.subscribe('admin_scopeGroups');

				const user_id = Session.get('id');
				const userScopeGroups = Meteor.users.findOne(user_id,	{fields: {
					'profile.scopeGroups': 1
				}}).profile.scopeGroups;

				var scopeGroups = {};
				ScopeGroups.find({}, {
					fields: {
						name: 1, category: 1
					},
					sort: {category: 1, name: 1}
				}).fetch().forEach((scopeGroup) => {
					const scopeId = scopeGroup._id.valueOf();
					scopeGroups[scopeId] = {
						name: scopeGroup.name,
						category: scopeGroup.category,
						enabled: userScopeGroups.includes(scopeId)
					}
				});

				this.setState(scopeGroups);
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

	updateScopeGroups(e) {
		e.preventDefault();

		var scopeGroups = [];
		Object.keys(this.state).forEach((key) => {
			const scopeGroup = this.state[key];
			if (scopeGroup.enabled) {
				scopeGroups.push(key);
			}
		});

		Meteor.call('users.update.scopeGroups.admin',
			Session.get('id'),
			scopeGroups,
			(err, res) => {
				if (err) {
					console.log(err);
				}
			}
		);
	}

	toggleScopeGroup(e) {
		var scopeGroup = this.state[e.target.id];
		scopeGroup.enabled = !scopeGroup.enabled;
		this.setState({[e.target.id]: scopeGroup});
	}

	renderScopeGroups() {
		return Object.keys(this.state).map((key) => {
			const scopeGroup = this.state[key];
			return (
				<FormGroup key={key}>
					<Checkbox
						id={key}
						checked={scopeGroup.enabled}
						onChange={this.toggleScopeGroup.bind(this)}
					>{scopeGroup.category}: {scopeGroup.name}</Checkbox>
				</FormGroup>
			);
		});
	}

	render() {
		return (
			<Form onSubmit={this.updateScopeGroups.bind(this)}>
				{this.renderScopeGroups.bind(this)()}
				<Button
					type='submit'
				>Save Scope Groups</Button>
			</Form>
		);
	}
};