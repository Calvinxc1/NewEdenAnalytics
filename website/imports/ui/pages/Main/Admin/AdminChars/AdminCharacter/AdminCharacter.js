// Meteor Imports
import {Session} from 'meteor/session';
import {numeral} from 'meteor/numeral:numeral';

// NPM Imports
import React from 'react';
import {
	Grid, Image, Carousel, Jumbotron,
	Form, FormGroup, Checkbox
} from 'react-bootstrap';

// Custom Imports
import {EveChars} from '../../../../../../api/eve_chars.js';
import {EveCorps} from '../../../../../../api/eve_corps.js';
import AdminCharacterScopes from './AdminCharacterScopes.js';

export default class AdminCharacter extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			character: {},
			corporation: {}
		};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.character = Tracker.autorun(() => {
			const user = Meteor.user()
			if (user) {
				Meteor.subscribe('admin_eveChars');
				Meteor.subscribe('admin_eveCorps');
				const char_id = parseInt(Session.get('id'));
				
				var character = EveChars.findOne(char_id,	{fields: {
					char_name: 1, corp_id: 1, birthday: 1, sec_status: 1
				}});

				var corporation = {};
				if (character) {
					corporation = EveCorps.findOne(character.corp_id, {fields: {
						corporation_name: 1
					}});
				}

				this.setState({character, corporation});
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
				<Jumbotron><Carousel
					controls={false}
					indicators={false}
				><Carousel.Item>
					<Image
						src={'https://image.eveonline.com/Character/' + this.state.character._id + '_512.jpg'}
						alt='Character Image'
						className='center-block'
					/>
					<Carousel.Caption>
						<h2>{this.state.character.char_name}</h2>
					</Carousel.Caption>
				</Carousel.Item></Carousel></Jumbotron>
				<p>Character Name: {this.state.character.char_name}</p>
				<p>Character ID: {this.state.character._id}</p>
				<p>Corporation: {this.state.corporation.corporation_name}</p>
				<p>Security Status: {
					numeral(this.state.character.sec_status).format('0.00')
				}</p>
				<hr />
				<AdminCharacterScopes />
			</Grid>
		);
	}
};
