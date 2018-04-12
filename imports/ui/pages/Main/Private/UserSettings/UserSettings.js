// Meteor imports
import {Meteor} from 'meteor/meteor';

// NPM Imports
import React from 'react';
import {
	Well, Form, FormGroup, InputGroup,
	FormControl, ControlLabel, Button, Grid,
	ButtonToolbar
} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap';

// Custom Imports
import FA from '../../../../modules/FontAwesome/FontAwesome.js';
import UserSettingsAccounts from './UserSettingsAccounts.js';

export default class UserSettings extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			username: '',
			emails: []
		};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.username = Tracker.autorun(() => {
			if (this.refs.formWell) {
				const user = Meteor.user();
				if (user) {
					this.setState({
						username: user.username,
						emails: user.emails
					});
				} else {
					this.setState({
						username: '',
						emails: []
					});
				}
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

	renderEmails() {
		let key_val = -1
		return this.state.emails.map((email) => {
			key_val = key_val + 1
			return (
				<InputGroup key={'email_' + key_val.toString()}>
					<FormControl
						id={key_val.toString()}
						type='email'
						placeholder='EMail'
						value={email.address}
						onChange={(e) => {
							this.editEmail.bind(this)(
								e.target.id,
								e.target.value
							)
						}}
						disabled
					/>
					<InputGroup.Button><Button>
						Verify
					</Button></InputGroup.Button>
				</InputGroup>
			);
		});
	}

	editEmail(updateIndex, newEmail) {
		let emails = this.state.emails;
		emails[updateIndex].address = newEmail;
		this.setState({emails});
	}

	saveSettings(e) {
		e.preventDefault();
	}

	render() {
		return (
			<Grid><Well ref='formWell'>
				<Form onSubmit={this.saveSettings.bind(this)}>
					<FormGroup>
						<ControlLabel>Username</ControlLabel>
						<InputGroup>
							<InputGroup.Addon>
								<FA fa-user fa-fw />
							</InputGroup.Addon>
							<FormControl
								type='text'
								placeholder='Username'
								value={this.state.username}
								disabled
							/>
						</InputGroup>
					</FormGroup>
					<FormGroup>
						<ControlLabel>EMails</ControlLabel>
						<InputGroup>
							<InputGroup.Addon>
								<FA fa-at fa-fw />
							</InputGroup.Addon>
							{this.renderEmails.bind(this)()}
						</InputGroup>
					</FormGroup>
					<ButtonToolbar>
						<Button bsStyle="primary" type='submit'>Save Changes</Button>
						<LinkContainer to='/dashboard' className='pull-right'>
							<Button bsStyle="danger">Cancel</Button>
						</LinkContainer>
					</ButtonToolbar>
				</Form>
				<hr />
				<UserSettingsAccounts />
			</Well></Grid>
		);
	}
};
