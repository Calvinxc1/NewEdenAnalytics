// Meteor imports
import {Meteor} from 'meteor/meteor';

// NPM Imports
import React from 'react';
import {
	Modal, Checkbox, Button, Form,
	PanelGroup, Panel, ListGroup, ListGroupItem,
	FormGroup, Well, InputGroup
} from 'react-bootstrap';

// Custom Imports
import FA from '../../../../../modules/FontAwesome/FontAwesome.js';
import {OreBuybackSettings} from '../../../../../../api/Corp/ore_buyback.js';
import {schemaOreBuybackSettings} from '../../../../../../api/Corp/ore_buyback.js';

export default class OreSettingTable extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			_id: props._id,
			editRow: props.editRow,
			oreStructure: JSON.parse(JSON.stringify(props.oreStructure)),
			oreData: [],
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
						{ore_types: 1}
					)

					if (buybackRecord) {
						const oreData = buybackRecord.ore_types;
						const oreStructure = this.state.oreStructure.map((oreGroup) => {
							return this.parseOreOptions.bind(this)(oreData, oreGroup);
						});

						
						
						this.setState({
							oreData,
							oreStructure
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

	parseOreOptions(oreData, oreOptions) {
		var activeTypes = 0;
		oreOptions.children = oreOptions.children.map(
			(childGroup) => {
				newChild = this.parseOreOptions.bind(this)(oreData, childGroup);
				activeTypes += newChild.active;
				return newChild
			}
		);
		oreOptions.types = oreOptions.types.map(
			(typeItem) => {
				newType = this.parseOreTypes(oreData, typeItem);
				activeTypes += newType.active;
				return newType
			}
		);
		oreOptions.active = Boolean(activeTypes);
		return oreOptions;
	}

	parseOreTypes(oreData, typeItem) {
		const active = oreData.includes(typeItem.type_id);

		return {
			...typeItem,
			active
		};
	}

	modalShow() {
		this.setState({modalShow: true});
	}

	modalHide() {
		const oreData = OreBuybackSettings.findOne(
			{_id: this.state._id},
			{ore_types: 1}
		).ore_types;

		const oreStructure = this.state.oreStructure.map((oreGroup) => {
			return this.parseOreOptions.bind(this)(oreData, oreGroup);
		});

		this.setState({
			modalShow: false,
			oreData,
			oreStructure
		});
	}

	renderEditButton() {
		return (
			<Button
				bsSize='xsmall'
				onClick={this.modalShow.bind(this)}
				block
			>
				<FA fal fa-edit /> Edit Valid Ores
			</Button>
		)
	}

	renderActiveGroups(oreData, idChain) {
		return oreData.filter((oreGroup) => {
			return oreGroup.active;
		}).map((oreGroup) => {
			const idSubChain = idChain + '.' + oreGroup.group_id;
			return (
				<Panel
					key={idSubChain}
					eventKey={idSubChain}
				>
					<Panel.Heading>
						<Panel.Title toggle>{oreGroup.group_name}</Panel.Title>
					</Panel.Heading>
					<Panel.Body collapsible>
						<PanelGroup accordion id={idSubChain}>
							{this.renderActiveGroups.bind(this)(oreGroup.children, idSubChain)}
						</PanelGroup>
						<ListGroup>
							{this.renderActiveTypes(oreGroup.types, idSubChain)}
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
			return (
				<ListGroupItem key={idSubChain}>
					{typeItem.type_name}
				</ListGroupItem>
			);
		});
	}

	renderEditModal() {
		const idInc = this.state._id + '.ores.edit';
		return (
			<Modal
				show={this.state.modalShow}
				onHide={this.modalHide.bind(this)}
			>
				<Modal.Header>
					<Modal.Title>Edit Valid Ores</Modal.Title>
				</Modal.Header>

				<Modal.Body>
					<PanelGroup accordion id={idInc}>
						{this.renderEditGroups.bind(this)(this.state.oreStructure, idInc)}
					</PanelGroup>
				</Modal.Body>

				<Modal.Footer>
					<Button onClick={this.modalHide.bind(this)}>Cancel</Button>
					<Button bsStyle="primary" onClick={this.saveTypes.bind(this)}>Save Changes</Button>
				</Modal.Footer>
			</Modal>
		);
	}

	renderEditGroups(oreData, idChain) {
		return oreData.map((oreGroup) => {
			const idSubChain = idChain + '.' + oreGroup.group_id;
			return (
				<Panel
					key={idSubChain}
					eventKey={idSubChain}
				>
					<Panel.Heading>
						<Panel.Title toggle>{oreGroup.group_name}</Panel.Title>
					</Panel.Heading>
					<Panel.Body collapsible>
						<PanelGroup accordion id={idSubChain}>
							{this.renderEditGroups.bind(this)(oreGroup.children, idSubChain + '.children')}
						</PanelGroup>
						<Form>
							{this.renderEditTypes(oreGroup.types, idSubChain + '.types')}
						</Form>
					</Panel.Body>
				</Panel>
			);
		});
	}

	renderEditTypes(typeData, idChain) {
		return typeData.map((typeItem) => {
			const idSubChain = idChain + '.' + typeItem.type_id;
			return (
				<FormGroup key={idSubChain}>
					<Checkbox
						id={typeItem.type_id.toString()}
						checked={this.state.oreData.includes(typeItem.type_id)}
						onChange={this.updateTypes.bind(this)}
					>{typeItem.type_name}</Checkbox>
				</FormGroup>
			);
		});
	}

	updateTypes(e) {
		var oreData = this.state.oreData;
		const type_id = Number(e.target.id);

		if (e.target.checked) {
			oreData.push(type_id);
		} else {
			const index = oreData.indexOf(type_id);
			oreData.splice(index, 1);
		}

		this.setState({
			oreData
		});
	}

	saveTypes() {
		if (!Roles.userIsInRole(Meteor.userId(), 'director')) {
			throw new Meteor.Error('not-authorized');
		}

		schemaOreBuybackSettings.oreTypes.set.validate({
			ore_types: this.state.oreData
		});

		const oreStructure = this.state.oreStructure.map((oreGroup) => {
			return this.parseOreOptions.bind(this)(this.state.oreData, oreGroup);
		});

		this.setState({oreStructure});

		Meteor.call(
			'oreBuybackSettings.oreTypes.set.director',
			this.state._id,
			this.state.oreData,
			(err, res) => {
				if (err) {
					console.log(err);
				}
			}
		);

		this.modalHide.bind(this)();
	}

	renderOreListing() {
		if (this.state.oreData.length > 0) {
			const idInc = this.state._id + '.ores';
			return (
				<PanelGroup accordion id={idInc}>
					{this.renderActiveGroups.bind(this)(this.state.oreStructure, idInc)}
				</PanelGroup>
			)
		} else {
			return (
				<ListGroup>
					<ListGroupItem bsStyle='danger'>No Valid Ores Selected</ListGroupItem>
				</ListGroup>
			);
		}
	}

	render() {
		return (
			<Well ref='rootItem'>
				{this.renderEditModal.bind(this)()}
				{this.state.editRow ? this.renderEditButton.bind(this)() : null}
				{this.renderOreListing.bind(this)()}
			</Well>
		);
	}
}