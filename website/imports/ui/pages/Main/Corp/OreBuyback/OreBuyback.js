// Meteor imports
import {Meteor} from 'meteor/meteor';

// NPM Imports
import React from 'react';
import {
	Grid
} from 'react-bootstrap';

export default class OreBuyback extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
		this.trackers = {};
	}

	componentDidMount() {
		this.trackers.oreBuyback = Tracker.autorun(() => {
			if (this.refs.rootItem) {
				if (Meteor.userId()) {
					
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

	render() {
		return (
			<Grid ref='rootItem'>
			</Grid>
		);
	}
}