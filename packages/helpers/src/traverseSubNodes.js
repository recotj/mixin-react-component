const React = require('react');

module.exports = {
	// add a filter parameter to help separate concerns into finer grains.
	processSubNodes(element, process, filter, context) {
		if (typeof filter === 'function') {
			process = (child, path, element, next) => {
				let error, newChild, shouldContinue;

				try {
					shouldContinue = Reflect.apply(filter, context, [child, path, element]);
					if (shouldContinue) {
						newChild = Reflect.apply(process, context, [child, path, element, next]);
					}
				} catch (err) {
					error = err;
				}

				if (!shouldContinue) return child;
				if (error) return next(error);
				return newChild;
			};

			return traverseSubNodes(element, process, context);
		} else {
			context = filter;
		}

		return this.processAllSubNodes(element, process, context);
	},
	processAllSubNodes(element, process, context) {
		if (typeof process !== 'function') return element;
		process = (child, path, element, next) => {
			let error, newChild;

			try {
				newChild = Reflect.apply(process, context, [child, path, element, next]);
			} catch (err) {
				error = err;
			}

			if (error) next(error);
			return newChild;
		};

		return traverseSubNodes(element, process, context);
	},
	removeSubNodes(element, filter, context) {
		if (typeof filter !== 'function') return element;
		return traverseSubNodes(element, (child, path, element, next) => {
			let error, shouldRemove;

			try {
				shouldRemove = Reflect.apply(filter, context, [child, path, element])
			} catch (err) {
				error = err;
			}

			if (shouldRemove) return undefined;

			next(error, child);
		}, context);
	},
	traverseSubNodes
};

function traverseSubNodes(element, process, context) {
	// fast case
	if (typeof process !== 'function') return element;
	return traverse(element, process, context);
}


function traverse(element, process, context, path) {
	path = path || [];

	const props = element.props;
	if (!props || Object.keys(props).length === 0) return undefined;

	const children = props.children;
	if (!children) return undefined;

	// if children are not objects, such as text nodes, return them as early as possible.
	if (typeof children !== 'object') return children;

	return React.Children.map(children, (child, key) => {
		path = path.slice();
		path.push(key);

		//let error;
		let shouldContinue = false;
		let newChild = null;

		const next = (err, data) => {
			shouldContinue = true;
			if (err) console.error(err);
			else newChild = data;
		};

		const breakChild = Reflect.apply(process, context, [child, path, element, next]);
		// if the next callback is not called yet, then break out of the current traverse.
		if (shouldContinue === false) return breakChild;
		// if null, false or undefined value returned after process, it means to remove the child element.
		if (newChild === null || newChild === undefined || newChild === false) return undefined;

		return React.cloneElement(
			newChild,
			null,
			traverse(newChild, process, context, path)
		);
	}, context || element);
}
