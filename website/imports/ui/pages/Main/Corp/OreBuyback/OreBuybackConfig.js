// Meteor imports
import {Meteor} from 'meteor/meteor';
import {moment} from 'meteor/momentjs:moment';

// NPM Imports
import React from 'react';
import {
	Grid, Well, Form, FormGroup,
	ControlLabel, FormControl
} from 'react-bootstrap';
import {
	BootstrapTable, TableHeaderColumn
} from 'react-bootstrap-table';
import SimpleSchema from 'simpl-schema';
import DatePicker from 'react-bootstrap-date-picker';

// Custom Imports
import {OreBuybackSettings} from '../../../../../api/Corp/ore_buyback.js';
import {schemaOreBuybackSettings} from '../../../../../api/Corp/ore_buyback.js';
import {Regions} from '../../../../../api/sql/regions.js';
import FA from '../../../../modules/FontAwesome/FontAwesome.js';

export default class OreBuybackConfig extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			buybackSettings: [],
			regions: {},
			tableParams: {
				options: {
					afterInsertRow: this.insertRow,
					afterDeleteRow: this.deleteRows,
					insertText: 'Add Ore Buyback Setting',
					deleteText: 'Delete Selected Setting(s)',
					insertModalBody: this.customInsertModalBody
				},
				selectRow: {
					mode: 'checkbox',
					clickToSelect: false,
					clickToExpand: true
				},
				cellEdit: {
					mode: 'dbclick',
					blurToSave: true,
					afterSaveCell: this.updateRow
				},
				expandColumnOptions: {
					expandColumnVisible: true,
					expandColumnComponent: this.expandColumnComponent,
					columnWidth: 50
				}
			}
		};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.settingsAndRegions = Tracker.autorun(() => {
			if (this.refs.rootItem) {
				if (Roles.userIsInRole(Meteor.userId(), 'director')) {
					Meteor.subscribe('director_OreBuybackSettings');
					Meteor.subscribe('sql_regions');
					
					const buybackSettings = OreBuybackSettings.find().fetch()
					const regions = {}
					Regions.forEach((region) => {
						regions[region.region_id] = region.region_name
					});

					this.setState({buybackSettings, regions});
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

	insertRow(row) {
		if (!Roles.userIsInRole(Meteor.userId(), 'director')) {
			throw new Meteor.Error('not-authorized');
		}
		
		console.log(row);

		row = {
			start_date: new Date(row.start_date),
			market_region_id: Number(row.market_region_id),
			market_weight: Number(row.market_weight),
			mineral_weights: {},
			ore_types: []
		};

		schemaOreBuybackSettings.insert.validate(row);

		Meteor.call('oreBuybackSettings.insert.director', row, (err, res) => {
			if (err) {
				console.log(err);
			}
		});
	}

	deleteRows(rowIds) {
		if (!Roles.userIsInRole(Meteor.userId(), 'director')) {
			throw new Meteor.Error('not-authorized');
		}

		Meteor.call('oreBuybackSettings.delete.many.director', rowIds, (err, res) => {
			if (err) {
				console.log(err);
			}
		});	
	}

	formatterDate(cell, row) {
		return moment(cell).format('YYYY-MM-DD');
	}

	formatterRegion(cell, row) {
		return this.state.regions[row.market_region_id];
	}

	formatterMarketWeight(cell, row) {
		const percentFormat = row.market_weight * 100
		return (
			<div>
				{percentFormat} <FA fa fa-percent />
			</div>
		)
	}

	customInsertModalBody(columns, validateState, ignoreEditable) {
		return (
			<InsertModalBody
				columns={columns}
				validateState={validateState}
				ignoreEditable={ignoreEditable}
			/>
		);
	}

	render() {
		return (
			<Grid ref='rootItem'><Well>
				<BootstrapTable
					data={this.state.buybackSettings}
					selectRow={this.state.tableParams.selectRow}
					options={this.state.tableParams.options}
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

class InsertModalBody extends React.Component {
	getFieldValue() {
		const newRow = {};
		this.props.columns.forEach((column, i) => {
			newRow[column.field] = this.refs[column.field].value;
		}, this);
		return newRow;
	}

	render() {
		return (
			<div className='modal-body'>
				<FormGroup>
					<ControlLabel>Settings Date</ControlLabel>
					<DatePicker ref='start_date'/>
				</FormGroup>
			</div>
		);
	}
}