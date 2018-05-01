// NPM Imports
import React from 'react';

export default (props) => {
	return (
		<span
			className={Object.keys(props).join(' ')}
			aria-hidden='true'
		></span>
	);
}