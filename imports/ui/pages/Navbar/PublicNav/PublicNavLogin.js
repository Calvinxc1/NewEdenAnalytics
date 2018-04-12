// Meteor Imports
import {Meteor} from 'meteor/meteor';

// NPM Imports
import React from 'react';
import {
	NavDropdown, Navbar, FormGroup, Form,
	InputGroup, FormControl, Button, ListGroup,
	ListGroupItem
} from 'react-bootstrap';
import SimpleSchema from 'simpl-schema';
import {browserHistory} from 'react-router';

// Custom Imports
import FA from '../../../modules/FontAwesome/FontAwesome.js';

export default class PublicNavLogin extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			username: '',
			password: '',
			schema: new SimpleSchema({
				username: {
					type: String,
					label: 'New User Username',
					min: 1
				},
				password: {
					type: String,
					label: 'Signup Password',
					min: 1
				}
			}).newContext(),
			errors: []
		};
	}

	loginClick(e) {
		e.preventDefault();

		this.state.schema.validate({
			username: this.state.username,
			password: this.state.password
		});

		if (this.state.schema.isValid()) {
			Meteor.loginWithPassword(
				this.state.username,
				this.state.password,
				(err, res) => {
					if (err) {
						this.setState({errors: [{
							name: err.message,
							type: 'login'
						}]});
					} else {
						this.setState({errors: []});
						browserHistory.replace('/dashboard');
					}
				}
			);
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

	render() {
		return (
			<Navbar.Form style={{minWidth: 250 + 'px'}}>
				<Form onSubmit={this.loginClick.bind(this)}>
					<FormGroup><InputGroup>
						<InputGroup.Addon><FA fa-user fa-fw /></InputGroup.Addon>
						<FormControl
							type='text'
							placeholder='Username/Email'
							value={this.state.username}
							onChange={(e) => this.setState({username: e.target.value})}
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
					</InputGroup></FormGroup>
					<Button
						type='submit'
						bsSize='small'
						block
					>Login</Button>
				</Form>
				<ListGroup>{this.renderError.bind(this)()}</ListGroup>
			</Navbar.Form>
		);
	}
}
