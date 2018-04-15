// NPM Imports
import React from 'react';
import {Link} from 'react-router';
import {Button} from 'react-bootstrap';

export default (props) => {
	return(
		<div className='center-box'><div className='box'>
			<p>Path Not Found</p>
			<p>[404]</p>
			<Link to='/'><Button>Go To Home Page</Button></Link>
		</div></div>
	)
};