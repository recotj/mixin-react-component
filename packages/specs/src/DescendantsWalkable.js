const React = require('react');
const Policy = require('utils/lib/mixin').PresetPolicy;
const helpers = require('mixin-react-component/lib/helpers');
const ReactMixinPolicy = require('mixin-react-component/lib/mixin').ReactMixinPolicy;

const DESCENDANTS = Symbol('descendants');

module.exports = {
	descendantProps(child, path) {
		const ref = child.props.ref;
		const owner = child._owner;

		return {
			ref(instance) {
				// If #ref# and #owner# exists, then reattach the instance to the original owner.
				if (ref && owner) owner.refs[ref] = instance;
				this[DESCENDANTS][path] = instance;
			}
		};
	},
	walkDescendants(callback) {
		if (typeof callback !== 'function') return;

		const descendants = this[DESCENDANTS];
		let result;
		let shouldBreak = true;

		Object.keys(descendants).some((path) => {
			shouldBreak = true;
			Reflect.apply(callback, this, [result, descendants[path], path, next]);
			return shouldBreak;
		});

		return result;

		function next(error, data) {
			if (error) {
				console.error(error);
				result = undefined;
			} else {
				result = data;
			}
			shouldBreak = Boolean(error);
		}
	},
	render(element) {
		if (!React.isValidElement(element)) return null;

		let children = element.props.children;
		let modified = false;

		if (typeof this.descendantProps === 'function') {
			children = helpers.processAllSubNodes(
				this,
				(child, path, parent, next) => {
					const newChild = React.cloneElement(child, this.descendantProps(child, path, parent));
					next(null, newChild);
				},
				this
			);
			modified = true;
		}

		if (!modified) return element;

		return React.cloneElement(element, null, children);
	}
};

ReactMixinPolicy.register('descendantProps', Policy.MERGE_RIGHT);
