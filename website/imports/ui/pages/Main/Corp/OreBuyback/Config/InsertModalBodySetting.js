// Meteor imports
import {Meteor} from 'meteor/meteor';
import {moment} from 'meteor/momentjs:moment';

// NPM Imports
import React from 'react';
import {
	FormGroup, ControlLabel, FormControl, InputGroup, 
} from 'react-bootstrap';
import DatePicker from 'react-bootstrap-date-picker';
import {Typeahead} from 'react-bootstrap-typeahead';

// Custom Imports
import FA from '../../../../../modules/FontAwesome/FontAwesome.js';

export default class InsertModalBodySetting extends React.Component {
	constructor(props) {
		super(props);

		var regions = []
		for (var key in props.regions) {
			regions.push({id: key, label: props.regions[key]})
		}

		this.state = {
			regions,
			start_date: '',
			market_region_id: [],
			market_weight: ''
		}
	}

	getFieldValue() {
		const _id = (Math.random() + 1).toString(36).substring(7)
		const start_date = moment.utc(this.state.start_date).set({
			'hour': 0,
			'minute': 0,
			'second': 0,
			'milisecond': 0
		});
		const market_region_id = Number(this.state.market_region_id[0].id);
		const market_weight = Number(this.state.market_weight) / 100;

		return {
			_id,
			start_date,
			market_region_id,
			market_weight
		};
	}

	changeStartDate(dateValue) {
		this.setState({start_date: dateValue});
	}

	changeMarketRegionId(selected) {
		this.setState({market_region_id: selected});
	}

	changeMarketWeight(e) {
		const market_weight = e.target.value;
		this.setState({market_weight});
	}

	minDatePicker() {
		const minDate = moment.utc().set({
			'hour': 0,
			'minute': 0,
			'second': 0,
			'milisecond': 0
		}).add(1, 'd').format();
		//return minDate; Needed to invalidate because of bug: https://github.com/pushtell/react-bootstrap-date-picker/issues/134
	}

	render() {
		return (
			<div className='modal-body'>
				<FormGroup>
					<ControlLabel>Settings Date</ControlLabel>
					<DatePicker
						ref='start_date'
						value={this.state.start_date}
						onChange={this.changeStartDate.bind(this)}
						dateFormat='YYYY/MM/DD'
						minDate={this.minDatePicker()}
					/>
				</FormGroup>
				<FormGroup>
					<ControlLabel>Market Region</ControlLabel>
					<Typeahead
						ref='market_region_id'
						selected={this.state.market_region_id}
						onChange={this.changeMarketRegionId.bind(this)}
						options={this.state.regions}
						multiple={false}
						placeholder='Choose a Region...'
					/>
				</FormGroup>
				<FormGroup>
					<ControlLabel>Market Weight</ControlLabel>
					<InputGroup>
						<FormControl
							ref='market_weight'
							value={this.state.market_weight}
							onChange={this.changeMarketWeight.bind(this)}
							type='text'
						/>
						<InputGroup.Addon><FA far fa-percent fa-fw /></InputGroup.Addon>
					</InputGroup>
				</FormGroup>
			</div>
		);
	}
}