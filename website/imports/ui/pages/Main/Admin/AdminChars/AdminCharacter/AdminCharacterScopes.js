// Meteor Imports
import {Session} from 'meteor/session';

// NPM Imports
import React from 'react';
import {
	Form, FormGroup, Checkbox, Button
} from 'react-bootstrap';

// Custom Imports
import {EveChars} from '../../../../../../api/eve_chars.js';
import {EveScopes} from '../../../../../../api/eve_scopes.js';

export default class AdminCharacterScopes extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.scopes = Tracker.autorun(() => {
			const user = Meteor.user()
			if (user) {
				Meteor.subscribe('admin_eveChars');
				Meteor.subscribe('admin_eveScopes');

				const char_id = parseInt(Session.get('id'));
				var allScopes = EveScopes.find().fetch();
				
				const tokens = EveChars.findOne(char_id,	{fields: {
					'tokens.scopes': 1, 'tokens.last_set': 1
				}}).tokens;

				var scopes = {}
				allScopes.map((scope) => {
					scopes[scope._id] = {
						name: scope.name,
						active: tokens.scopes.includes(scope._id)
					}
				});

				this.setState(scopes);
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

	updateScope(e) {
		var scope = this.state[e.target.id];
		scope.enabled = e.target.checked;
		this.setState({[e.target.id]: scope});
	}

	saveScopes(e) {
		e.preventDefault();
		var enabled_scopes = [];
		Object.keys(this.state).forEach((key) => {
			const scope = this.state[key];
			if (scope.enabled) {
				enabled_scopes.push(key);
			}
		});
		Meteor.call('eveChars.enabled_scopes.update.admin',
			parseInt(Session.get('id')),
			enabled_scopes,
			(err, res) => {
				if (err) {
					console.log(err);
				}
			}
		);
	}

	renderScopes() {
		return Object.keys(this.state).map((key) => {
			const scope = this.state[key];
			return (
				<FormGroup key={key}>
					<Checkbox
						id={key}
						checked={scope.enabled}
						onChange={this.updateScope.bind(this)}
					>{scope.name}</Checkbox>
				</FormGroup>
			);
		});
	}

	render() {
		return (
			<Form onSubmit={this.saveScopes.bind(this)}>
				<h3>Scopes</h3>
				{this.renderScopes.bind(this)()}
				<Button type='submit'>
					Save Scopes
				</Button>
			</Form>
		)
	}
};