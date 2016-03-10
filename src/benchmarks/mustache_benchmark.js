import Benchmark from "benchmark";
import loader from "@loader";
import "can-mustache";

window._oldDefine = window.define;
window.define = loader.amdDefine;

var suite = new Benchmark.Suite();

suite.on('cycle', function(event) {
	console.log(String(event.target));
});

var benchmarks =  {
	add: function(name, setup, benchmark, teardown){
		if(!benchmark){
			benchmark = setup;
			setup = undefined;
		}
		suite.add(name, benchmark, {
			setup: setup,
			teardown: teardown
		});
		return this;
	},
	run: function(){
		suite.run({ 'async': true, 'queued': true });
	},
	suite: suite,
	on: function(){
		return suite.on.apply(this, arguments);
	}
};

/* jshint ignore:start */
benchmarks.add(
	"can-mustache Updating elements",
	function () {

		var template = can.view.mustache(
			"{{#each boxes}}" +
			"<div class='box-view'>" +
			"<div class='box' id='box-{{count}}'  style='top: {{top}}px; left: {{left}}px; background: rgb(0,0,{{color}});'>" +
			"{{content}}" +
			"</div>" +
			"</div>" +
			"{{/each}}");

		var boxes = [],
			Box = can.Map.extend({
				count: 0,
				content: 0,
				top: 0,
				left: 0,
				color: 0,
				tick: function () {
					var count = this.attr("count") + 1;
					this.attr({
						count: count,
						left: Math.cos(count / 10) * 10,
						top: Math.sin(count / 10) * 10,
						color: count % 255,
						content: count
					});
				}
			});

		for (var i = 0; i < 100; i++) {
			boxes.push(new Box({
				count: i
			}));
		}

		var frag = template({
			boxes: boxes
		});
		var div = document.createElement("div");
		document.body.appendChild(div);
		div.appendChild(frag);
	},
	function () {
		for (var j = 0; j < 2; j++) {
			for (var n = 0; n < boxes.length; n++) {
				boxes[n].tick();
			}
		}
	},
	function () {
		document.body.removeChild(div);
		window.define = window._oldDefine;
	}
);
/* jshint ignore:end */

steal.done().then(function(){
	benchmarks.run();
});
