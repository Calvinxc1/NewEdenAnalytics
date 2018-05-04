// Meteor Imports
import {Meteor} from 'meteor/meteor';

// NPM Imports
import React from 'react';
import {
	NavDropdown, MenuItem
} from 'react-bootstrap';
import {LinkContainer} from 'react-router-bootstrap';

// Custom Imports
import FA from '../../../modules/FontAwesome/FontAwesome.js';

export default class PrivateNavCorp extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isDirector: false
		};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.director = Tracker.autorun(() => {
			if (this.refs.navDrop) {
				if (Meteor.userId()) {
					this.setState({isDirector: Roles.userIsInRole(Meteor.userId(), 'director')});
				} else {
					this.setState({isDirector: false});
				}
			}
		});
	}

	comnponentWillUnmount() {
		for (var key in this.trackers) {
			if (this.trackers.hasOwnProperty(key)) {
				this.trackers[key].stop();
			}
		}
	}

	renderOreBuybackConfig() {
		if(this.state.isDirector) {
			return (
				<LinkContainer to='/corp/ore_buyback/config'>
					<MenuItem eventKey={2.1}>
						<FA fal fa-level-up fa-rotate-90 /> &thinsp; Config
					</MenuItem>
				</LinkContainer>
			)
		} else {
			return null;
		}
	}

	render() {
		return (
			<NavDropdown
				eventKey={2}
				title='Corporation'
				id='nav-corp-dropdown'
				ref='navDrop'
			>
				<LinkContainer to='/corp/ore_buyback'>
					<MenuItem eventKey={2.1}>Ore Buyback</MenuItem>
				</LinkContainer>
				{this.renderOreBuybackConfig.bind(this)()}
			</NavDropdown>
		);
	}
};
