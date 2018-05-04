// Meteor imports
import {Meteor} from 'meteor/meteor';
import {moment} from 'meteor/momentjs:moment';

// NPM Imports
import React from 'react';
import {
	Grid, Well, Label
} from 'react-bootstrap';
import {
	BootstrapTable, TableHeaderColumn
} from 'react-bootstrap-table';

// Custom Imports
import InsertModalBodySetting from './InsertModalBodySetting.js';
import OreSettingTable from './OreSettingTable.js';
import MineralWeightsTable from './MineralWeightsTable.js';
import {OreBuybackSettings} from '../../../../../../api/Corp/ore_buyback.js';
import {schemaOreBuybackSettings} from '../../../../../../api/Corp/ore_buyback.js';
import {Regions} from '../../../../../../api/sql/regions.js';
import {MarketGroups} from '../../../../../../api/sql/market_groups.js';
import {Types} from '../../../../../../api/sql/types.js';
import FA from '../../../../../modules/FontAwesome/FontAwesome.js';

export default class OreBuybackConfig extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			buybackSettings: [],
			oreOptions: [],
			mineralOptions: [],
			regions: {},
			tableParamsSetting: {
				options: {
					afterInsertRow: this.insertRowSetting,
					afterDeleteRow: this.deleteRowsSetting,
					insertText: 'Add Ore Buyback Setting',
					deleteText: 'Delete Selected Setting(s)',
					insertModalBody: this.customInsertModalBodySetting.bind(this)
				},
				selectRow: {
					mode: 'checkbox',
					clickToSelect: false,
					clickToExpand: true,
					unselectable: []
				},
				expandColumnOptions: {
					expandColumnVisible: true,
					expandColumnComponent: this.expandColumnComponent,
					columnWidth: 50
				}
			},
		};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.settings = Tracker.autorun(() => {
			if (this.refs.rootItem) {
				if (Roles.userIsInRole(Meteor.userId(), 'director')) {
					Meteor.subscribe('director_OreBuybackSettings');
					
					const buybackSettings = OreBuybackSettings.find().fetch();

					var tableParamsSetting = this.state.tableParamsSetting;

					tableParamsSetting.selectRow.unselectable = this.unselectableRows.bind(this)(buybackSettings);
					
					this.setState({
						buybackSettings,
						tableParamsSetting
					});
				}
			}
		});

		this.trackers.regions = Tracker.autorun(() => {
			if (this.refs.rootItem) {
				if (Roles.userIsInRole(Meteor.userId(), 'director')) {
					var regions = {};

					if (Regions.all.ready()) {
						Regions.all.forEach((region) => {
							regions[region.region_id] = region.region_name
						});
					}

					this.setState({regions});
				}
			}
		});

		this.trackers.oreOptions = Tracker.autorun(() => {
			if (this.refs.rootItem) {
				if (Roles.userIsInRole(Meteor.userId(), 'director')) {
					var oreOptions = [];
					if (MarketGroups.oreBuybackOreGroups.ready()) {
						oreOptions = MarketGroups.oreBuybackOreGroups.filter(
							(marketGroup) => {
								return marketGroup.parent_group_id == 1031
							}
						).map(
							(marketGroup) => {
								return this.parseOreMarketStructure.bind(this)(marketGroup);
							}
						);
					}

					this.setState({oreOptions});
				}
			}
		});

		this.trackers.mineralOptions = Tracker.autorun(() => {
			if (this.refs.rootItem) {
				if (Roles.userIsInRole(Meteor.userId(), 'director')) {
					var mineralOptions = []
					if (MarketGroups.oreBuybackMineralGroups.ready()) {
						mineralOptions = MarketGroups.oreBuybackMineralGroups.map(
							(marketGroup) => {
								return this.parseMineralsMarketStructure.bind(this)(marketGroup);
							}
						);
					}

					this.setState({mineralOptions});
				}
			}
		});
	}

	unselectableRows(buybackSettings) {
		const futureThresh = moment.utc().set({
			'hour': 23,
			'minute': 59,
			'second': 59,
			'milisecond': 999
		});

		var unselectCols = [];

		buybackSettings.map((setting) => {
			if (moment.utc(setting.start_date) <= futureThresh) {
				unselectCols.push(setting._id);
			}
		});

		 return unselectCols;
	}

	componentWillUnmount() {
		for (var key in this.trackers) {
			if (this.trackers.hasOwnProperty(key)) {
				this.trackers[key].stop();
			}
		}
	}

	parseOreMarketStructure(marketGroup) {
		var marketGroupItem = {
			group_id: marketGroup.market_group_id,
			group_name: marketGroup.market_group_name,
			children: [],
			types: []
		}

		if (MarketGroups.oreBuybackOreGroups.ready()) {
			marketGroupItem.children = MarketGroups.oreBuybackOreGroups.filter(
				(marketSubGroup) => {
					return marketSubGroup.parent_group_id == marketGroup.market_group_id;
				}
			).map((marketSubGroup) => {
				return this.parseOreMarketStructure.bind(this)(marketSubGroup);
			});
		}

		if (Types.oreBuybackOreTypes.ready()) {
			marketGroupItem.types = Types.oreBuybackOreTypes.filter(
				(type) => {
					return type.market_group_id == marketGroup.market_group_id;
				}
			).map((type) => {
				return {
					type_id: type.id,
					type_name: type.name
				}
			});
		}

		return marketGroupItem;
	}

	parseMineralsMarketStructure(marketGroup) {
		var marketGroupItem = {
			group_id: marketGroup.market_group_id,
			group_name: marketGroup.market_group_name,
			children: [],
			types: []
		}

		if (MarketGroups.oreBuybackMineralGroups.ready()) {
			marketGroupItem.children = MarketGroups.oreBuybackMineralGroups.filter(
				(marketSubGroup) => {
					return marketSubGroup.parent_group_id == marketGroup.market_group_id;
				}
			).map((marketSubGroup) => {
				return this.parseMineralsMarketStructure.bind(this)(marketSubGroup);
			});
		}

		if (Types.oreBuybackMineralTypes.ready()) {
			marketGroupItem.types = Types.oreBuybackMineralTypes.filter(
				(type) => {
					return type.market_group_id == marketGroup.market_group_id;
				}
			).map((type) => {
				return {
					type_id: type.id,
					type_name: type.name,
					mineral_weight: 1
				}
			});
		}

		return marketGroupItem;
	}

	insertRowSetting(row) {
		if (!Roles.userIsInRole(Meteor.userId(), 'director')) {
			throw new Meteor.Error('not-authorized');
		}
		
		row = {
			start_date: row.start_date.toDate(),
			market_region_id: row.market_region_id,
			market_weight: row.market_weight,
			mineral_weights: {},
			ore_types: []
		};

		schemaOreBuybackSettings.root.insert.validate(row);

		Meteor.call('oreBuybackSettings.insert.director', row, (err, res) => {
			if (err) {
				console.log(err);
			}
		});
	}

	deleteRowsSetting(rowIds, rows) {
		if (!Roles.userIsInRole(Meteor.userId(), 'director')) {
			throw new Meteor.Error('not-authorized');
		}

		rows.forEach((row) => {
			schemaOreBuybackSettings.root.delete.validate(row);
		});

		Meteor.call('oreBuybackSettings.delete.many.director', rowIds, (err, res) => {
			if (err) {
				console.log(err);
			}
		});	
	}

	formatterDate(cell, row) {
		return moment.utc(cell).format('YYYY-MM-DD');
	}

	formatterRegion(cell, row) {
		return this.state.regions[row.market_region_id];
	}

	formatterMarketWeight(cell, row) {
		const percentFormat = row.market_weight * 100
		return (
			<div>
				{percentFormat}<FA fal fa-percent />
			</div>
		)
	}

	customInsertModalBodySetting(columns, validateState, ignoreEditable) {
		return (
			<InsertModalBodySetting
				columns={columns}
				regions={this.state.regions}
				validateState={validateState}
				ignoreEditable={ignoreEditable}
			/>
		);
	}

	expandRowComponent(row) {
		var oreData = [];
		var mineralData = {};

		if (row.ore_types) {
			oreData = row.ore_types;
		}

		if (row.mineral_weights) {
			mineralData = row.mineral_weights;
		}

		const futureThresh = moment.utc().set({
			'hour': 23,
			'minute': 59,
			'second': 59,
			'milisecond': 999
		});

		const editRow = moment.utc(row.start_date) > futureThresh;

		return (
			<div>
				<Label>Valid Ores</Label>
				<OreSettingTable
					_id={row._id}
					editRow={editRow}
					oreStructure={this.state.oreOptions}
				/>
				<Label>Mineral Weighting</Label>
				<MineralWeightsTable
					_id={row._id}
					editRow={editRow}
					mineralStructure={this.state.mineralOptions}
				/>
			</div>
		)
	}

	expandColumnComponent({isExpandableRow, isExpanded}) {
		if (isExpandableRow) {
			if (isExpanded) {
				return (
					<FA fas fa-caret-down />
				);
			} else {
				return (
					<FA fas fa-caret-right />
				);
			}
		} else {
			return null;
		}
	}

	render() {
		return (
			<Grid ref='rootItem'><Well>
				<BootstrapTable
					data={this.state.buybackSettings}
					selectRow={this.state.tableParamsSetting.selectRow}
					options={this.state.tableParamsSetting.options}
					expandableRow={() => {return true}}
					expandComponent={this.expandRowComponent.bind(this)}
					expandColumnOptions={this.state.tableParamsSetting.expandColumnOptions}
					keyField='_id'
					striped hover
					insertRow deleteRow
				>
					<TableHeaderColumn
						dataField='_id'
						hidden hiddenOnInsert
						autoValue
					>Document ID</TableHeaderColumn>
					<TableHeaderColumn
						dataField='start_date'
						dataFormat={this.formatterDate}
						dataSort
					>Start Date</TableHeaderColumn>
					<TableHeaderColumn
						dataField='market_region_id'
						dataFormat={this.formatterRegion.bind(this)}
						dataSort
					>Market Region</TableHeaderColumn>
					<TableHeaderColumn
						dataField='market_weight'
						dataFormat={this.formatterMarketWeight}
						dataSort
					>Market Weight</TableHeaderColumn>
				</BootstrapTable>
			</Well></Grid>
		);
	}
}