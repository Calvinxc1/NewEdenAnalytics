// Meteor Imports
import {Accounts} from 'meteor/accounts-base';

// NPM Imports
import React from 'react';
import {
	Well, Form, FormGroup, InputGroup,
	FormControl, Button, ButtonToolbar, Link,
	ListGroup, ListGroupItem, Grid, PageHeader
} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap';
import SimpleSchema from 'simpl-schema';
import {browserHistory} from 'react-router';

// Custom Imports
import FA from '../../../../modules/FontAwesome/FontAwesome.js';

export default class Signup extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			username: '',
			email: '',
			password: '',
			passwordVerif: '',
			schema: new SimpleSchema({
				username: {
					type: String,
					label: 'New User Username',
					min: 1
				},
				email: {
					type: String,
					label: 'New User EMail',
					regEx: SimpleSchema.RegEx.Email
				},
				password: {
					type: String,
					label: 'Signup Password',
					min: 8
				},
				passwordVerif: {
					type: String,
					label: 'Signup Password Verification',
					custom() {
						if (this.value !== this.field('password').value) {
							return 'passwordMismatch'
						}
					}
				}
			}).newContext(),
			errors: []
		};
	}

	createAccount(e) {
		e.preventDefault();

		const newUser = {
			username: this.state.username,
			email: this.state.email,
			password: this.state.password,
		}

		this.state.schema.validate({
			...newUser,
			passwordVerif: this.state.passwordVerif
		});

		if (this.state.schema.isValid()) {
			Accounts.createUser(newUser, (err, res) => {
				if (err) {
					this.setState({errors: [{
						name: err.message,
						type: 'creation'
					}]});
				} else {
					this.setState({errors: []});
					browserHistory.replace('/dashboard');
				}
			});
		} else {
			this.setState({errors: this.state.schema.validationErrors()});
		}
	}

	renderError() {
		if (this.state.errors.length > 0) {
			return this.state.errors.map((error) => {
				return (
					<ListGroupItem bsStyle='danger' key={error.name}>
						Error on: {error.name}, Error type: {error.type}
					</ListGroupItem>
				);
			});
		} else {
			return undefined;
		}
	}

	render() {return (
		<Grid><Well>
			<PageHeader>Create New Account</PageHeader>
			<Form onSubmit={this.createAccount.bind(this)}>
				<FormGroup><InputGroup>
					<InputGroup.Addon><FA fa-user fa-fw /></InputGroup.Addon>
					<FormControl
						type='text'
						placeholder='Username'
						value={this.state.username}
						onChange={(e) => this.setState({username: e.target.value})}
					/>
				</InputGroup></FormGroup>
				<FormGroup><InputGroup>
					<InputGroup.Addon><FA fa-at fa-fw /></InputGroup.Addon>
					<FormControl
						type='email'
						placeholder='EMail'
						value={this.state.email}
						onChange={(e) => this.setState({email: e.target.value})}
					/>
				</InputGroup></FormGroup>
				<FormGroup><InputGroup>
					<InputGroup.Addon><FA fa-unlock-alt fa-fw /></InputGroup.Addon>
					<FormControl
						type='password'
						placeholder='Password'
						value={this.state.password}
						onChange={(e) => this.setState({password: e.target.value})}
					/>
					<FormControl
						type='password'
						placeholder='Verify Password'
						value={this.state.passwordVerif}
						onChange={(e) => this.setState({passwordVerif: e.target.value})}
					/>
				</InputGroup></FormGroup>
				<ButtonToolbar>
					<Button bsStyle="primary" type='submit'>Create Account</Button>
					<LinkContainer to='/' className='pull-right'>
						<Button bsStyle="danger">Cancel</Button>
					</LinkContainer>
				</ButtonToolbar>
				<ListGroup>{this.renderError.bind(this)()}</ListGroup>
			</Form>
		</Well></Grid>
	);}
};
