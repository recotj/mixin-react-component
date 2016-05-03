const React = require('react');

const ValidateState = {
	DEFAULT: 0,
	FAILED: 1,
	SUCCESS: 2
};
const DEFAULT_ERROR_TYPE = 0;

module.exports = {
	statics: { ValidateState },
	displayName: 'Validatable',

	propTypes: {
		controls: NonEmptyArray,
		errorMessage: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.object]).isRequired,
		validation: React.PropTypes.func.isRequired
	},

	getInitialState() {
		return { validateState: ValidateState.DEFAULT, errorType: DEFAULT_ERROR_TYPE };
	},

	checkValidity() {
		const { validateState, errorType } = this.state;
		if (validateState === ValidateState.SUCCESS) return Promise.resolve(true);
		if (validateState === ValidateState.FAILED) return Promise.reject(errorType);

		const {controls, validation} = this.props;
		const values = mapControlToValues(controls);

		return executeValidation(validation, values).then(
			() => {
				this.setState({ validateState: ValidateState.SUCCESS });
				return collectControlValues(controls);
			},
			(error) => {
				let errorType = error || DEFAULT_ERROR_TYPE;
				if (error instanceof Error) errorType = error.name;

				this.setState({ validateState: ValidateState.FAILED, errorType });
				throw error;
			});
	},

	restore() {
		this.setState({ validateState: ValidateState.DEFAULT, errorType: DEFAULT_ERROR_TYPE });
	},

	get controls() {
		return mapControls(this.props.controls);
	},

	get validationMessage() {
		const { validateState, errorType } = this.state;
		if (validateState !== ValidateState.FAILED) return;

		let {errorMessage} = this.props;
		if (typeof errorMessage === 'object') errorMessage = errorMessage[errorType];

		return String(errorMessage);
	}
};

function executeValidation(validate, values) {
	let validity = true;

	if (typeof validate === 'function') {
		validity = Reflect.apply(validate, null, values);
	}

	if (isPromise(validity)) return validity;

	if (validity !== true) {
		const reason = validity && validity.message;
		return Promise.reject(reason);
	}

	return Promise.resolve(validity);
}

function collectControlValues(controls) {
	return reduceControls(controls, (result, control) => {
		if (control) result[control.id] = control.value;
		return result;
	}, {});
}

function reduceControls(controls, callback, initial) {
	if (typeof callback !== 'function') return initial;

	return mapControls(controls).reduce(callback, initial)
}

function mapControlToValues(controls) {
	return mapControls(controls, (control) => control && control.value);
}

function mapControls(controls, callback) {
	controls = controls.map((control) => {
		if (!(control instanceof HTMLElement)) {
			control = document.getElementById(control);
		}
		return control;
	});

	if (typeof callback !== 'function') return controls;

	return controls.map(callback);
}

function isPromise(promise) {
	return Reflect.apply(Object.prototype.toString, promise, []) === '[object Promise]';
}

function NonEmptyArray(props, propName, componentName) {
	const prop = props[propName];
	if (!Array.isArray(prop) || prop.length === 0) {
		return new TypeError(
			`Invalid prop ${propName} supplied to ${componentName}. A non-empty array expected.`
		);
	}
}

