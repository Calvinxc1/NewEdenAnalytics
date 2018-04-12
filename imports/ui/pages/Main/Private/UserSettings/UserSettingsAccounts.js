// Meteor imports
import {Meteor} from 'meteor/meteor';

// NPM Imports
import React from 'react';
import {
	Row, Col, Thumbnail, Button,
	Carousel, Image
} from 'react-bootstrap';

// Custom Imports
import EveLogin from '../../../../modules/EveOAuth/EveOAuth.js';
import SortBy from '../../../../modules/SortBy/SortBy.js';
import FA from '../../../../modules/FontAwesome/FontAwesome.js';
import {EveChars} from '../../../../../api/eve_chars.js';
import {EveCorps} from '../../../../../api/eve_corps.js';

export default class UserSettingsAccounts extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			characters: []
		};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.characters = Tracker.autorun(() => {
			const user = Meteor.user()
			if (user) {
				Meteor.subscribe('eveChars', user);
				Meteor.subscribe('eveCorps', user);
				
				const characters = EveChars.find().map((char) => {
					const corp = EveCorps.findOne(char.corp_id)
					if (corp) {
						return {
							_id: char._id,
							char_name: char.char_name,
							corp_id: char.corp_id,
							corp_name: corp.corp_name
						};
					} else {
						return {
							_id: char._id,
							char_name: char.char_name,
							corp_id: char.corp_id,
							corp_name: null
						};
					}
				});

				characters.sort(SortBy('char_name', false, (a) => {
					return a.toUpperCase();
				}));

				this.setState({characters});
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

	renderChars() {
		if (this.state.characters) {
			return this.state.characters.map((char) => {
				return (
					<Col xs={6} md={4} key={char._id}>
						<Carousel
							controls={false}
							indicators={false}
						><Carousel.Item style={{width: '100%', position: 'relative'}}>
							<Thumbnail
								src={'https://image.eveonline.com/Character/' + char._id + '_256.jpg'}
								alt='Character Image'
								style={{maxWidth: '100%', height: 'auto'}}
							/>
							<Image
								src={'https://image.eveonline.com/Corporation/' + char.corp_id + '_32.png'}
								style={{position: 'absolute', zIndex: '99', left: '46px', top: '10px'}}
							/>
							<h6
								style={{
									color: '#ffffff',
									position: 'absolute',
									zIndex: '99',
									left: '86px',
									top: '6px',
									textShadow: '0px 0px 0.5px #000000'
								}}
							>{char.corp_name}</h6>
							<Carousel.Caption>
								<h4>{char.char_name}</h4>
								<h6>ID: {char._id}</h6>
							</Carousel.Caption>
						</Carousel.Item></Carousel>
					</Col>
				);
			});
		}
	}

	render() {
		return (
			<div ref='formDiv'>
				<Button onClick={EveLogin}><FA fa-plus /> Add Character</Button>
				<Row>
					{this.renderChars.bind(this)()}
				</Row>
			</div>
		)
	}
};