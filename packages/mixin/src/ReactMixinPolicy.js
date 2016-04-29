const Policy = require('utils/lib/mixin').PresetPolicy;

const BuiltinMixinPolicy = {
	displayName: Policy.OVERRIDE_RIGHT,
	propTypes: Policy.OBJECT_MERGE,
	getInitialState: Policy.MERGE,
	getDefaultProps: Policy.MERGE,
	componentWillMount: Policy.CHAIN,
	componentDidMount: Policy.CHAIN,
	componentWillReceiveProps: Policy.CHAIN,
	componentWillUpdate: Policy.CHAIN,
	componentDidUpdate: Policy.CHAIN,
	componentWillUnmount: Policy.CHAIN,
	componentDidUnmount: Policy.CHAIN,
	render: Policy.FLOW
};

const ReactMixinPolicy = module.exports = {
	...BuiltinMixinPolicy
};

ReactMixinPolicy.register = (key, policy) => {
	if (ReactMixinPolicy[key]) {
		return console.warn(
			`ReactMixinPolicy.${key} policy already exists. If ReactMixinPolicy.${key} policy is
			not a built-in one and you want to override it, please unregister it first and then
			register it with a new and valid policy.`
		);
	}

	if (Reflect.apply(Object.prototype.hasOwnProperty, BuiltinMixinPolicy, [key])) {
		return console.warn(
			`You cannot register or override a built-in react mixin policy.`
		);
	}

	if (!Policy.isPresetPolicy(policy)) {
		return console.warn(
			`Only a policy listed in the preset ones can be allowed to register.`
		);
	}

	ReactMixinPolicy[key] = policy;
};

ReactMixinPolicy.unregister = (key) => {
	if (Reflect.apply(Object.prototype.hasOwnProperty, BuiltinMixinPolicy, [key])) {
		return console.warn(
			`You cannot unregister a built-in react mixin policy.`
		);
	}

	Reflect.deleteProperty(ReactMixinPolicy, key);
};
