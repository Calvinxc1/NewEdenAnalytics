// Meteor imports
import {Meteor} from 'meteor/meteor';

// NPM Imports
import React from 'react';
import {
	Grid, Button
} from 'react-bootstrap';
import {
	BootstrapTable, TableHeaderColumn
} from 'react-bootstrap-table';
import {browserHistory} from 'react-router';

// Custom Imports
import {EveChars} from '../../../../../api/eve_chars.js';
import {EveCorps} from '../../../../../api/eve_corps.js';

export default class AdminChars extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			characters: [],
			options: {
				onRowClick: (row) => {
					browserHistory.push(`/admin/chars/${row.char_id}`);
				}
			}
		};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.admin = Tracker.autorun(() => {
			if (this.refs.rootItem) {
				if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
					Meteor.subscribe('admin_eveChars');
					Meteor.subscribe('admin_eveCorps');

					const characters = EveChars.find({}, {fields: {
						char_name: 1, corp_id: 1, 'tokens.scopes': 1,
						'tokens.enabled_scopes': 1
					}}).map((char) => {
						const corp = EveCorps.findOne(char.corp_id);
						return {
							char_id: char._id,
							char_name: char.char_name,
							corp_id: char.corp_id,
							scopes: char.tokens.scopes,
							enabled_scopes: char.tokens.enabled_scopes,
							corp_name: corp ? corp.corporation_name : null
						};
					});

					this.setState({characters});
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

	resetFilters() {
		for (var key in this.refs) {
			this.refs[key].cleanFiltered();
		}
	}

	render() {
		return (
			<Grid ref='rootItem'>
				<Button
					onClick={this.resetFilters.bind(this)}
					bsStyle='link'
				>Reset Filters</Button>
				<BootstrapTable
					data={this.state.characters}
					options={this.state.options}
					striped
					hover
				>
					<TableHeaderColumn
						dataField='char_id'
						ref='char_id'
						dataSort={true}
						filter={{type: 'TextFilter', delay: 0}}
						isKey
					>Character ID</TableHeaderColumn>

					<TableHeaderColumn
						dataField='char_name'
						ref='char_name'
						dataSort={true}
						filter={{type: 'TextFilter', delay: 0}}
					>Character</TableHeaderColumn>

					<TableHeaderColumn
						dataField='corp_name'
						ref='corp_name'
						dataSort={true}
						filter={{type: 'TextFilter', delay: 0}}
					>Corporation</TableHeaderColumn>

					<TableHeaderColumn
						dataField='scopes'
						ref='scopes'
						filter={{type: 'TextFilter', delay: 0}}
					>Active Scopes</TableHeaderColumn>

					<TableHeaderColumn
						dataField='enabled_scopes'
						ref='enabled_scopes'
						filter={{type: 'TextFilter', delay: 0}}
					>Enabled Scopes</TableHeaderColumn>
				</BootstrapTable>
			</Grid>
		)
	};
}