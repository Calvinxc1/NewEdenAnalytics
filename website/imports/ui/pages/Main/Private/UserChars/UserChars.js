// Meteor imports
import {Meteor} from 'meteor/meteor';

// NPM Imports
import React from 'react';
import {
	Row, Col, Thumbnail, Button,
	Carousel, Image, Grid, Well,
	Modal, Form, FormGroup, Checkbox
} from 'react-bootstrap';

// Custom Imports
import EveLogin from '../../../../modules/EveOAuth/EveOAuth.js';
import SortBy from '../../../../modules/SortBy/SortBy.js';
import FA from '../../../../modules/FontAwesome/FontAwesome.js';
import {EveChars} from '../../../../../api/eve_chars.js';
import {EveCorps} from '../../../../../api/eve_corps.js';
import {ScopeGroups} from '../../../../../api/scope_groups.js';

export default class UsreChars extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			characters: [],
			scopes: [],
			scopeGroups: [],
			checkedGroups: [],
			modalSso: false
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

		this.trackers.scopeGroups = Tracker.autorun(() => {
			if (this.refs.rootItem) {
				if (Meteor.userId()) {
					Meteor.subscribe('scopeGroups');

					const scopeGroups = ScopeGroups.find({}).fetch();
					
					this.setState({scopeGroups});
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
								<h4 style={{color: '#ffffff'}}>{char.char_name}</h4>
								<h6 style={{color: '#ffffff'}}>ID: {char._id}</h6>
							</Carousel.Caption>
						</Carousel.Item></Carousel>
					</Col>
				);
			});
		}
	}

	modalSsoShow() {
		this.setState({modalSso: true});
	}

	modalSsoHide() {
		this.setState({modalSso: false, checkedGroups: []});	
	}

	runSso() {
		var scopeList = [];
		this.state.scopeGroups.forEach((scopeGroup) => {
			if(this.state.checkedGroups.includes(scopeGroup._id)) {
				scopeGroup.scopes.forEach((scope) => {
					if(scopeList.indexOf(scope) == -1) {
						scopeList.push(scope);
					}
				});
			}
		});

		this.modalSsoHide.bind(this)();

		EveLogin(scopeList);
	}

	renderSsoGroups() {
		return this.state.scopeGroups.map((scopeGroup) => {
			return (
				<FormGroup key={scopeGroup._id}>
					<Checkbox
						id={scopeGroup._id}
						checked={this.state.checkedGroups.includes(scopeGroup._id)}
						onChange={this.setCheckedGroups.bind(this)}
					>{scopeGroup.name}</Checkbox>
				</FormGroup>
			)
		});
	}

	setCheckedGroups(e) {
		checkedGroups = this.state.checkedGroups;

		if(e.target.checked) {
			checkedGroups.push(e.target.id);
		} else {
			const index = checkedGroups.indexOf(e.target.id);

			if(index !== -1) {
				checkedGroups.splice(index, 1);
			}
		}

		this.setState({checkedGroups});
	}

	renderSsoModal() {
		return (
			<Modal
				show={this.state.modalSso}
				onHide={this.modalSsoHide.bind(this)}
			>
				<Modal.Header>
				  <Modal.Title>Select Scope Groups for SSO Auth</Modal.Title>
				</Modal.Header>

				<Modal.Body>
					<Form>{this.renderSsoGroups.bind(this)()}</Form>
				</Modal.Body>

				<Modal.Footer>
					<Button
						onClick={this.modalSsoHide.bind(this)}
						className="pull-left"
					>Cancel</Button>
					<Image
						src='https://web.ccpgamescdn.com/eveonlineassets/developers/eve-sso-login-black-large.png'
						onClick={this.runSso.bind(this)}
					/>
				</Modal.Footer>
			</Modal>
		);
	}

	render() {
		return (
			<Grid ref='rootItem'>
				{this.renderSsoModal.bind(this)()}
				<Button onClick={this.modalSsoShow.bind(this)}><FA fa-plus /> Add/Update Character</Button>
				<Well>
					<Row>
						{this.renderChars.bind(this)()}
					</Row>
				</Well>
			</Grid>
		)
	}
};