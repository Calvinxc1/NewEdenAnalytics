// Meteor imports
import {Meteor} from 'meteor/meteor';

// NPM Imports
import React from 'react';
import {
	Well, Button, Modal, Form,
	FormGroup, FormControl, InputGroup, PanelGroup,
	Panel, ListGroup, ListGroupItem,
} from 'react-bootstrap';

// Custom Imports
import FA from '../../../../../modules/FontAwesome/FontAwesome.js';
import {OreBuybackSettings} from '../../../../../../api/Corp/ore_buyback.js';
import {schemaOreBuybackSettings} from '../../../../../../api/Corp/ore_buyback.js';

export default class MineralWeightsTable extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			_id: props._id,
			editRow: props.editRow,
			mineralStructure: JSON.parse(JSON.stringify(props.mineralStructure)),
			mineralData: {},
			modalShow: false
		};

		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.settingMinerals = Tracker.autorun(() => {
			if (this.refs.rootItem) {
				if (Roles.userIsInRole(Meteor.userId(), 'director')) {
					Meteor.subscribe('director_OreBuybackSettings');
					
					const buybackRecord = OreBuybackSettings.findOne(
						{_id: this.state._id},
						{mineral_weights: 1}
					)

					if (buybackRecord) {
						mineralData = buybackRecord.mineral_weights;
						const mineralStructure = this.state.mineralStructure.map((mineralGroup) => {
							return this.parseMineralOptions.bind(this)(mineralData, mineralGroup);
						});
						
						this.setState({
							mineralData,
							mineralStructure
						});
					}
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

	parseMineralOptions(mineralData, mineralOptions) {
		var activeTypes = 0;
		mineralOptions.children = mineralOptions.children.map(
			(childGroup) => {
				newChild = this.parseMineralOptions.bind(this)(mineralData, childGroup);
				activeTypes += newChild.active;
				return newChild
			}
		);
		mineralOptions.types = mineralOptions.types.map(
			(typeItem) => {
				newType = this.parseMineralTypes(mineralData, typeItem);
				activeTypes += newType.active;
				return newType
			}
		);
		mineralOptions.active = Boolean(activeTypes);
		return mineralOptions;
	}

	parseMineralTypes(mineralData, typeItem) {
		const active = !!mineralData[typeItem.type_id];

		return {
			...typeItem,
			mineral_weight: 1,
			active
		};
	}

	modalShow() {
		this.setState({modalShow: true});
	}

	modalHide() {
		const mineralData = OreBuybackSettings.findOne(
			{_id: this.state._id},
			{mineral_weights: 1}
		).mineral_weights;

		const mineralStructure = this.state.mineralStructure.map((mineralGroup) => {
			return this.parseMineralOptions.bind(this)(mineralData, mineralGroup);
		});

		this.setState({
			modalShow: false,
			mineralData,
			mineralStructure
		});
	}

	renderEditButton() {
		return (
			<Button
				bsSize='xsmall'
				onClick={this.modalShow.bind(this)}
				block
			>
				<FA fal fa-edit /> Edit Mineral Weights
			</Button>
		)
	}

	renderActiveGroups(mineralData, idChain) {
		return mineralData.filter((mineralGroup) => {
			return mineralGroup.active;
		}).map((mineralGroup) => {
			const idSubChain = idChain + '.' + mineralGroup.group_id;
			return (
				<Panel
					key={idSubChain}
					eventKey={idSubChain}
				>
					<Panel.Heading>
						<Panel.Title toggle>{mineralGroup.group_name}</Panel.Title>
					</Panel.Heading>
					<Panel.Body collapsible>
						<PanelGroup accordion id={idSubChain}>
							{this.renderActiveGroups.bind(this)(mineralGroup.children, idSubChain)}
						</PanelGroup>
						<ListGroup>
							{this.renderActiveTypes(mineralGroup.types, idSubChain)}
						</ListGroup>
					</Panel.Body>
				</Panel>
			);
		});
	}

	renderActiveTypes(typeData, idChain) {
		return typeData.filter((typeItem) => {
			return typeItem.active;
		}).map((typeItem) => {
			const idSubChain = idChain + '.' + typeItem.type_id;
			var editValue = typeItem.mineral_weight;

			if (this.state.mineralData[typeItem.type_id]) {
				editValue = this.state.mineralData[typeItem.type_id];
			}

			return (
				<ListGroupItem key={idSubChain}>
					{typeItem.type_name}: {editValue * 100}<FA fal fa-percent />
				</ListGroupItem>
			);
		});
	}

	renderEditModal() {
		const idInc = this.state._id + '.minerals.edit';
		return (
			<Modal
				show={this.state.modalShow}
				onHide={this.modalHide.bind(this)}
			>
				<Modal.Header>
					<Modal.Title>Edit Mineral Weights</Modal.Title>
				</Modal.Header>

				<Modal.Body>
					<PanelGroup accordion id={idInc}>
						{this.renderEditGroups.bind(this)(this.state.mineralStructure, idInc)}
					</PanelGroup>
				</Modal.Body>

				<Modal.Footer>
					<Button onClick={this.modalHide.bind(this)}>Cancel</Button>
					<Button bsStyle="primary" onClick={this.saveTypes.bind(this)}>Save Changes</Button>
				</Modal.Footer>
			</Modal>
		);
	}

	renderEditGroups(mineralData, idChain) {
		return mineralData.map((mineralGroup) => {
			const idSubChain = idChain + '.' + mineralGroup.group_id;
			return (
				<Panel
					key={idSubChain}
					eventKey={idSubChain}
				>
					<Panel.Heading>
						<Panel.Title toggle>{mineralGroup.group_name}</Panel.Title>
					</Panel.Heading>
					<Panel.Body collapsible>
						<PanelGroup accordion id={idSubChain}>
							{this.renderEditGroups.bind(this)(mineralGroup.children, idSubChain + '.children')}
						</PanelGroup>
						<Form>
							{this.renderEditTypes(mineralGroup.types, idSubChain + '.types')}
						</Form>
					</Panel.Body>
				</Panel>
			);
		});
	}

	renderEditTypes(typeData, idChain) {
		return typeData.map((typeItem) => {
			const idSubChain = idChain + '.' + typeItem.type_id;
			var editValue = this.state.mineralData[typeItem.type_id];

			if (!editValue) {
				editValue = typeItem.mineral_weight;
			}

			return (
				<FormGroup key={idSubChain}>
					<InputGroup>
						<InputGroup.Addon
							style={{minWidth: '250px'}}
						>{typeItem.type_name}</InputGroup.Addon>
						<FormControl
							id={typeItem.type_id.toString()}
							type='text'
							value={editValue * 100}
							onChange={this.updateTypes.bind(this)}
						/>
						<InputGroup.Addon
							style={{minWidth: '50px'}}
						><FA fal fa-percent /></InputGroup.Addon>
					</InputGroup>
				</FormGroup>
			);
		});
	}

	updateTypes(e) {
		var mineralData = this.state.mineralData;
		const newVal = Number(e.target.value) / 100;

		if (newVal == 1) {
			delete mineralData[e.target.id];
		} else {
			mineralData[e.target.id] = newVal;
		}

		this.setState({
			mineralData
		});
	}

	saveTypes() {
		if (!Roles.userIsInRole(Meteor.userId(), 'director')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaOreBuybackSettings.mineralWeights.set.validate({
			mineral_weights: this.state.mineralData
		});

		const mineralStructure = this.state.mineralStructure.map((mineralGroup) => {
			return this.parseMineralOptions.bind(this)(this.state.mineralData, mineralGroup);
		});

		this.setState({mineralStructure});

		Meteor.call(
			'oreBuybackSettings.mineralWeights.set.director',
			this.state._id,
			this.state.mineralData,
			(err, res) => {
				if (err) {
					console.log(err);
				}
			}
		);

		this.modalHide.bind(this)();
	}

	renderMineralsListing() {
		if (Object.keys(this.state.mineralData).length > 0) {
			const idInc = this.state._id + '.minerals';
			return (
				<PanelGroup accordion id={idInc}>
					{this.renderActiveGroups.bind(this)(this.state.mineralStructure, idInc)}
				</PanelGroup>
			)
		} else {
			return (
				<ListGroup>
					<ListGroupItem bsStyle='warning'>No Mineral Weights Specified - All weights set to 100<FA fal fa-percent /></ListGroupItem>
				</ListGroup>
			);
		}
	}

	render() {
		return (
			<Well ref='rootItem'>
				{this.renderEditModal.bind(this)()}
				{this.state.editRow ? this.renderEditButton.bind(this)() : null}
				{this.renderMineralsListing.bind(this)()}
			</Well>
		);
	}
}