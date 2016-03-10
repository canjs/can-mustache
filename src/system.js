import can from "./can-mustache";

function translate(load) {
	return "define(['can-mustache'],function(module){" +
		"var can = module.default || module;" +
		"return can.view.preloadStringRenderer('" + load.metadata.pluginArgument + "'," +
		'can.Mustache(function(scope,options) { ' + new can.Mustache({
			text: load.source,
			name: load.name
		})
		.template.out + ' })' +
		")" +
		"})";
}

export default {
	translate: translate
};
