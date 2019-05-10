"format cjs";
/* jshint asi:true,multistr:true*/
/*global Mustache*/
var QUnit = require("steal-qunit");
var can = require("./can-mustache");
require("can-legacy-view-helpers/test-helper");

QUnit.module("can-mustache, rendering", {
	beforeEach: function(assert) {
		can.view.ext = '.mustache';

		this.animals = ['sloth', 'bear', 'monkey']
		if (!this.animals.each) {
			this.animals.each = function (func) {
				for (var i = 0; i < this.length; i++) {
					func(this[i])
				}
			}
		}

		this.squareBrackets = "<ul>{{#animals}}" +
			"<li>{{.}}</li>" +
			"{{/animals}}</ul>";
		this.squareBracketsNoThis = "<ul>{{#animals}}" +
			"<li>{{.}}</li>" +
			"{{/animals}}</ul>";
		this.angleBracketsNoThis = "<ul>{{#animals}}" +
			"<li>{{.}}</li>" +
			"{{/animals}}</ul>";

	}
});

// Override expected spec result for whitespace only issues
var override = {
	comments: {
		'Standalone Without Newline': '!'
	},
	inverted: {
		'Standalone Line Endings': '|\n\n|',
		'Standalone Without Newline': '^\n/'
	},
	partials: {
		'Standalone Line Endings': '|\n>\n|',
		'Standalone Without Newline': '>\n  >\n>',
		'Standalone Without Previous Line': '  >\n>\n>',
		'Standalone Indentation': '\\\n |\n<\n->\n|\n\n/\n'
	},
	sections: {
		'Standalone Line Endings': '|\n\n|',
		'Standalone Without Newline': '#\n/'
	}
};

// Add mustache specs to the test
can.each(window.MUSTACHE_SPECS, function(specData){
	var spec = specData.name;
	can.each(specData.data.tests, function (t) {
		QUnit.test('specs/' + spec + ' - ' + t.name + ': ' + t.desc, function(assert) {
			// can uses &#34; to escape double quotes, mustache expects &quot;.
			// can uses \n for new lines, mustache expects \r\n.
			var expected = (override[spec] && override[spec][t.name]) || t.expected.replace(/&quot;/g, '&#34;')
				.replace(/\r\n/g, '\n');

			// Mustache's "Recursion" spec generates invalid HTML
			if (spec === 'partials' && t.name === 'Recursion') {
				t.partials.node = t.partials.node.replace(/</g, '[')
					.replace(/\}>/g, '}]');
				expected = expected.replace(/</g, '[')
					.replace(/>/g, ']');
			}

			// register the partials in the spec
			if (t.partials) {
				for (var name in t.partials) {
					can.view.registerView(name, t.partials[name], ".mustache");
				}
			}

			// register lambdas
			if (t.data.lambda && t.data.lambda.js) {
				t.data.lambda = eval('(' + t.data.lambda.js + ')');
			}

			assert.deepEqual(new can.Mustache({
					text: t.template
				})
				.render(t.data), expected);
		});
	});
});


var getAttr = function (el, attrName) {
	return attrName === "class" ?
		el.className :
		el.getAttribute(attrName);
}

QUnit.test("basics", function(assert) {
	var template = can.view.mustache("<ul>{{#items}}<li>{{helper foo}}</li>{{/items}}</ul>");
	template()
	assert.ok(true, "just to force the issue")
})

QUnit.test("Model hookup", function(assert) {

	// Single item hookup
	var template = '<p id="foo" {{  data "name "   }}>data rocks</p>';
	var obsvr = new can.Map({
		name: 'Austin'
	});
	var frag = new can.Mustache({
		text: template
	})
		.render(obsvr);
	can.append(can.$('#qunit-fixture'), can.view.frag(frag));
	assert.deepEqual(can.data(can.$('#foo'), 'name '), obsvr, 'data hooks worked and fetched');

	// Multi-item hookup
	var listTemplate = '<ul id="list">{{#list}}<li class="moo" id="li-{{name}}" {{data "obsvr"}}>{{name}}</li>{{/#list}}</ul>';
	var obsvrList = new can.List([obsvr]);
	var listFrag = new can.Mustache({
		text: listTemplate
	})
		.render({
			list: obsvrList
		});
	can.append(can.$('#qunit-fixture'), can.view.frag(listFrag));

	assert.deepEqual(can.data(can.$('#li-Austin'), 'obsvr'), obsvr, 'data hooks for list worked and fetched');

	// Mulit-item update with hookup
	var obsvr2 = new can.Map({
		name: 'Justin'
	});
	obsvrList.push(obsvr2);
	assert.deepEqual(can.data(can.$('#li-Justin'), 'obsvr'), obsvr2, 'data hooks for list push worked and fetched');

	// Delete last item added
	obsvrList.pop();
	assert.deepEqual(can.$('.moo')
		.length, 1, 'new item popped off and deleted from ui');
});

/*test("Variable partials", function(){
 var template = "{{#items}}<span>{{>partial}}</span>{{/items}}";
 var data = { items: [{}], partial: "test_template.mustache" }

 var frag = new can.Mustache({ text: template }).render(data);
 can.append( can.$('#qunit-fixture'), can.view.frag(frag));
 });*/

/*
 // FIX THIS
 QUnit.test('Helpers sections not returning values', function(){
 Mustache.registerHelper('filter', function(attr,options){
 return true;
 });

 var template = "<div id='sectionshelper'>{{#filter}}moo{{/filter}}</div>";
 var frag = new can.Mustache({ text: template }).render({ });;
 can.append( can.$('#qunit-fixture'), can.view.frag(frag));
 assert.deepEqual(can.$('#sectionshelper')[0].innerHTML, "moo", 'helper section worked');

 });

 // FIX THIS
 QUnit.test('Helpers with obvservables in them', function(){
 Mustache.registerHelper('filter', function(attr,options){
 return options.fn(attr === "poo");
 });

 var template = "<div id='sectionshelper'>{{#filter 'moo'}}moo{{/filter}}</div>";
 var obsvr = new can.Map({ filter: 'moo' });
 var frag = new can.Mustache({ text: template }).render({ filter: obsvr });;
 can.append( can.$('#qunit-fixture'), can.view.frag(frag));
 assert.deepEqual(can.$('#sectionshelper')[0].innerHTML, "", 'helper section showed none');

 obsvr.attr('filter', 'poo')
 assert.deepEqual(can.$('#sectionshelper')[0].innerHTML, "poo", 'helper section worked');
 });
 */

QUnit.test('Tokens returning 0 where they should diplay the number', function(assert) {
	var template = "<div id='zero'>{{completed}}</div>";
	var frag = new can.Mustache({
		text: template
	})
		.render({
			completed: 0
		});
	can.append(can.$('#qunit-fixture'), can.view.frag(frag));
	assert.deepEqual(can.$('#zero')[0].innerHTML, "0", 'zero shown');
})

QUnit.test('Inverted section function returning numbers', function(assert) {
	var template = "<div id='completed'>{{^todos.completed}}hidden{{/todos.completed}}</div>";
	var obsvr = new can.Map({
		named: false
	});

	var todos = {
		completed: function () {
			return obsvr.attr('named');
		}
	};

	// check hidden there
	var frag = new can.Mustache({
		text: template
	})
		.render({
			todos: todos
		});
	can.append(can.$('#qunit-fixture'), can.view.frag(frag));
	assert.deepEqual(can.$('#completed')[0].innerHTML, "hidden", 'hidden shown');

	// now update the named attribute
	obsvr.attr('named', true);
	assert.deepEqual(can.$('#completed')[0].innerHTML, "", 'hidden gone');

	can.remove(can.$('#qunit-fixture>*'));
});

QUnit.test("Mustache live-binding with escaping", function(assert) {
	var template = "<span id='binder1'>{{ name }}</span><span id='binder2'>{{{name}}}</span>";

	var teacher = new can.Map({
		name: "<strong>Mrs Peters</strong>"
	});

	var tpl = new can.Mustache({
		text: template
	});

	can.append(can.$('#qunit-fixture'), can.view.frag(tpl.render(teacher)));

	assert.deepEqual(can.$('#binder1')[0].innerHTML, "&lt;strong&gt;Mrs Peters&lt;/strong&gt;");
	assert.deepEqual(can.$('#binder2')[0].getElementsByTagName('strong')[0].innerHTML, "Mrs Peters");

	teacher.attr('name', '<i>Mr Scott</i>');

	assert.deepEqual(can.$('#binder1')[0].innerHTML, "&lt;i&gt;Mr Scott&lt;/i&gt;");
	assert.deepEqual(can.$('#binder2')[0].getElementsByTagName('i')[0].innerHTML, "Mr Scott")

	can.remove(can.$('#qunit-fixture>*'));
});

QUnit.test("Mustache truthy", function(assert) {
	var t = {
		template: "{{#name}}Do something, {{name}}!{{/name}}",
		expected: "Do something, Andy!",
		data: {
			name: 'Andy'
		}
	};

	var expected = t.expected.replace(/&quot;/g, '&#34;')
		.replace(/\r\n/g, '\n');
	assert.deepEqual(new can.Mustache({
			text: t.template
		})
		.render(t.data), expected);
});

QUnit.test("Mustache falsey", function(assert) {
	var t = {
		template: "{{^cannot}}Don't do it, {{name}}!{{/cannot}}",
		expected: "Don't do it, Andy!",
		data: {
			name: 'Andy'
		}
	};

	var expected = t.expected.replace(/&quot;/g, '&#34;')
		.replace(/\r\n/g, '\n');
	assert.deepEqual(new can.Mustache({
			text: t.template
		})
		.render(t.data), expected);
});

QUnit.test("Handlebars helpers", function(assert) {
	can.Mustache.registerHelper('hello', function (/*options*/) {
		return 'Should not hit this';
	});
	can.Mustache.registerHelper('there', function (/*options*/) {
		return 'there';
	});
	// Test for #1109
	can.Mustache.registerHelper('zero', function (/*options*/) {
		return 0;
	});
	can.Mustache.registerHelper('bark', function (obj, str, number, options) {
		var hash = options.hash || {};
		return 'The ' + obj + ' barked at ' + str + ' ' + number + ' times, ' +
			'then the ' + hash.obj + ' ' + hash.action + ' ' +
			hash.where + ' times' + (hash.loud === true ? ' loudly' : '') + '.';
	});
	var t = {
		template: "{{hello}} {{there}}!\n{{bark name 'Austin and Andy' 3 obj=name action='growled and snarled' where=2 loud=true}} Then there were {{zero}} barks :(",
		expected: "Hello there!\nThe dog barked at Austin and Andy 3 times, then the dog growled and snarled 2 times loudly. Then there were 0 barks :(",
		data: {
			name: 'dog',
			hello: 'Hello'
		}
	};

	var expected = t.expected.replace(/&quot;/g, '&#34;')
		.replace(/\r\n/g, '\n');

	assert.deepEqual(new can.Mustache({ text: t.template }).render(t.data), expected);
});

QUnit.test("Handlebars advanced helpers (from docs)", function(assert) {
	Mustache.registerHelper('exercise', function (group, action, num, options) {
		if (group && group.length > 0 && action && num > 0) {
			return options.fn({
				group: group,
				action: action,
				where: options.hash.where,
				when: options.hash.when,
				num: num
			});
		} else {
			return options.inverse(this);
		}
	});

	var t = {
		template: "{{#exercise pets 'walked' 3 where='around the block' when=time}}" +
			"Along with the {{#group}}{{.}}, {{/group}}" +
			"we {{action}} {{where}} {{num}} times {{when}}." +
			"{{else}}" +
			"We were lazy today." +
			"{{/exercise}}",
		expected: "Along with the cat, dog, parrot, we walked around the block 3 times this morning.",
		expected2: "We were lazy today.",
		data: {
			pets: ['cat', 'dog', 'parrot'],
			time: 'this morning'
		}
	};

	assert.deepEqual(new can.Mustache({
			text: t.template
		})
		.render(t.data), t.expected);
	assert.deepEqual(new can.Mustache({
			text: t.template
		})
		.render({}), t.expected2);
});

QUnit.test("Passing functions as data, then executing them", function(assert) {
	var t = {
		template: "{{#nested}}{{welcome name}}{{/nested}}",
		expected: "Welcome Andy!",
		data: {
			name: 'Andy',
			nested: {
				welcome: function (name) {
					return 'Welcome ' + name + '!';
				}
			}
		}
	};

	var expected = t.expected.replace(/&quot;/g, '&#34;')
		.replace(/\r\n/g, '\n');
	assert.deepEqual(new can.Mustache({
			text: t.template
		})
		.render(t.data), expected);
});

QUnit.test("Absolute partials", function(assert) {
	var test_template = can.test.path('src/test/test_template.mustache');
	var t = {
		template1: "{{> " + test_template + "}}",
		template2: "{{> " + test_template + "}}",
		expected: "Partials Rock"
	};

	assert.deepEqual(new can.Mustache({
			text: t.template1
		})
		.render({}), t.expected);
	assert.deepEqual(new can.Mustache({
			text: t.template2
		})
		.render({}), t.expected);
});

QUnit.test("No arguments passed to helper", function(assert) {
	can.view.mustache("noargs", "{{noargHelper}}");
	can.Mustache.registerHelper("noargHelper", function () {
		return "foo"
	})
	var div1 = document.createElement('div');
	var div2 = document.createElement('div');

	div1.appendChild(can.view("noargs", {}));
	div2.appendChild(can.view("noargs", new can.Map()));

	assert.deepEqual(div1.innerHTML, "foo");
	assert.deepEqual(div2.innerHTML, "foo");
});

QUnit.test("No arguments passed to helper with list", function(assert) {
	can.view.mustache("noargs", "{{#items}}{{noargHelper}}{{/items}}");
	var div = document.createElement('div');

	div.appendChild(can.view("noargs", {
		items: new can.List([{
			name: "Brian"
		}])
	}, {
		noargHelper: function () {
			return "foo"
		}
	}));

	assert.deepEqual(div.innerHTML, "foo");
});

QUnit.test("String literals passed to helper should work (#1143)", 1, function(assert) {
	can.Mustache.registerHelper("concatStrings", function(arg1, arg2) {
		return arg1 + arg2;
	});

	// Test with '=' because the regexp to find arguments uses that char
	// to delimit a keyword-arg name from its value.
	can.view.mustache('testStringArgs', '{{concatStrings "==" "word"}}');
	var div = document.createElement('div');
	div.appendChild(can.view('testStringArgs', {}));

	assert.equal(div.innerHTML, '==word');
});

QUnit.test("Partials and observes", function(assert) {
	var template;
	var div = document.createElement('div');

	template = can.view.mustache("table", "<table><thead><tr>{{#data}}{{{>" +
		can.test.path('src/test/partial.mustache') + "}}}{{/data}}</tr></thead></table>")

	var dom = can.view("table", {
		data: new can.Map({
			list: ["hi", "there"]
		})
	});
	div.appendChild(dom);
	var ths = div.getElementsByTagName('th');

	assert.equal(ths.length, 2, 'Got two table headings');
	assert.equal(ths[0].innerHTML, 'hi', 'First column heading correct');
	assert.equal(ths[1].innerHTML, 'there', 'Second column heading correct');
});

QUnit.test("Deeply nested partials", function(assert) {
	var t = {
		template: "{{#nest1}}{{#nest2}}{{>partial}}{{/nest2}}{{/nest1}}",
		expected: "Hello!",
		partials: {
			partial: '{{#nest3}}{{name}}{{/nest3}}'
		},
		data: {
			nest1: {
				nest2: {
					nest3: {
						name: 'Hello!'
					}
				}
			}
		}
	};
	for (var name in t.partials) {
		can.view.registerView(name, t.partials[name], ".mustache")
	}

	assert.deepEqual(new can.Mustache({
			text: t.template
		})
		.render(t.data), t.expected);
});

QUnit.test("Partials correctly set context", function(assert) {
	var t = {
		template: "{{#users}}{{>partial}}{{/users}}",
		expected: "foo - bar",
		partials: {
			partial: '{{ name }} - {{ company }}'
		},
		data: {
			users: [{
				name: 'foo'
			}],
			company: 'bar'
		}
	};
	for (var name in t.partials) {
		can.view.registerView(name, t.partials[name], ".mustache")
	}

	assert.deepEqual(new can.Mustache({
			text: t.template
		})
		.render(t.data), t.expected);
});

QUnit.test("Handlebars helper: if/else", function(assert) {
	var expected;
	var t = {
		template: "{{#if name}}{{name}}{{/if}}{{#if missing}} is missing!{{/if}}",
		expected: "Andy",
		data: {
			name: 'Andy',
			missing: undefined
		}
	};

	expected = t.expected.replace(/&quot;/g, '&#34;')
		.replace(/\r\n/g, '\n');
	assert.deepEqual(new can.Mustache({
			text: t.template
		})
		.render(t.data), expected);

	t.data.missing = null;
	expected = t.expected.replace(/&quot;/g, '&#34;')
		.replace(/\r\n/g, '\n');
	assert.deepEqual(new can.Mustache({
			text: t.template
		})
		.render(t.data), expected);
});

QUnit.test("Handlebars helper: is/else (with 'eq' alias)", function(assert) {

	var t = {
		template: '{{#eq "10" "10" ducks getDucks}}10 ducks{{else}}Not 10 ducks{{/eq}}',
		expected: "10 ducks",
		data: {
			ducks: '10',
			getDucks: function() {
				return '10'
			}
		},
		liveData: new can.Map({
			ducks: '10',
			getDucks: function() {
				return '10'
			}
		})
	};

	var div = document.createElement('div');

	div.appendChild(can.view.mustache(t.template)(t.data));
	assert.deepEqual(div.innerHTML, t.expected);

	div = document.createElement('div');
	div.appendChild(can.view.mustache(t.template)(t.liveData));
	assert.deepEqual(div.innerHTML, t.expected);

	t.data.ducks = 5;

	div = document.createElement('div');
	div.appendChild(can.view.mustache(t.template)(t.data));
	assert.deepEqual(div.innerHTML, 'Not 10 ducks');
});


QUnit.test("Handlebars helper: unless", function(assert) {
	var t = {
		template: "{{#unless missing}}Andy is missing!{{/unless}}" +
		          "{{#unless isCool}} But he wasn't cool anyways.{{/unless}}",
		expected: "Andy is missing! But he wasn't cool anyways.",
		data: {
			name: 'Andy'
		},
		liveData: new can.Map({
			name: 'Andy',
			// #1202 #unless does not work with computes
			isCool: can.compute(function () {
				return t.liveData.attr("missing");
			})
		})
	};

	var expected = t.expected.replace(/&quot;/g, '&#34;')
		.replace(/\r\n/g, '\n');
	assert.deepEqual(new can.Mustache({
			text: t.template
		})
		.render(t.data), expected);

	// #1019 #unless does not live bind
	var div = document.createElement('div');
	div.appendChild(can.view.mustache(t.template)(t.liveData));
	assert.deepEqual(div.innerHTML, expected, '#unless condition false');
	t.liveData.attr('missing', true);
	assert.deepEqual(div.innerHTML, '', '#unless condition true');
});

QUnit.test("Handlebars helper: each", function(assert) {
	var t = {
		template: "{{#each names}}{{this}} {{/each}}",
		expected: "Andy Austin Justin ",
		data: {
			names: ['Andy', 'Austin', 'Justin']
		},
		data2: {
			names: new can.List(['Andy', 'Austin', 'Justin'])
		}
	};

	var expected = t.expected.replace(/&quot;/g, '&#34;')
		.replace(/\r\n/g, '\n');
	assert.deepEqual(new can.Mustache({
			text: t.template
		})
		.render(t.data), expected);

	var div = document.createElement('div');
	div.appendChild(can.view.mustache(t.template)(t.data2));
	assert.deepEqual(div.innerHTML, expected, 'Using Observe.List');
	t.data2.names.push('What');
});

QUnit.test("Handlebars helper: with", function(assert) {
	var t = {
		template: "{{#with person}}{{name}}{{/with}}",
		expected: "Andy",
		data: {
			person: {
				name: 'Andy'
			}
		}
	};

	var expected = t.expected.replace(/&quot;/g, '&#34;')
		.replace(/\r\n/g, '\n');
	assert.deepEqual(new can.Mustache({
			text: t.template
		})
		.render(t.data), expected);
});

QUnit.test("render with left bracket", function(assert) {
	var compiled = new can.Mustache({
		text: this.squareBrackets,
		type: '['
	})
		.render({
			animals: this.animals
		})
	assert.equal(compiled, "<ul><li>sloth</li><li>bear</li><li>monkey</li></ul>", "renders with bracket")
});
QUnit.test("render with with", function(assert) {
	var compiled = new can.Mustache({
		text: this.squareBracketsNoThis,
		type: '['
	})
		.render({
			animals: this.animals
		});
	assert.equal(compiled, "<ul><li>sloth</li><li>bear</li><li>monkey</li></ul>", "renders bracket with no this")
});
QUnit.test("default carrot", function(assert) {
	var compiled = new can.Mustache({
		text: this.angleBracketsNoThis
	})
		.render({
			animals: this.animals
		});

	assert.equal(compiled, "<ul><li>sloth</li><li>bear</li><li>monkey</li></ul>")
})
QUnit.test("render with double angle", function(assert) {
	var text = "{{& replace_me }}{{{ replace_me_too }}}" +
		"<ul>{{#animals}}" +
		"<li>{{.}}</li>" +
		"{{/animals}}</ul>";
	var compiled = new can.Mustache({
		text: text
	})
		.render({
			animals: this.animals
		});
	assert.equal(compiled, "<ul><li>sloth</li><li>bear</li><li>monkey</li></ul>", "works")
});

QUnit.test("comments", function(assert) {
	var text = "{{! replace_me }}" +
		"<ul>{{#animals}}" +
		"<li>{{.}}</li>" +
		"{{/animals}}</ul>";
	var compiled = new can.Mustache({
		text: text
	})
		.render({
			animals: this.animals
		});
	assert.equal(compiled, "<ul><li>sloth</li><li>bear</li><li>monkey</li></ul>")
});

QUnit.test("multi line", function(assert) {
	var text = "a \n b \n c",
		result = new can.Mustache({
			text: text
		})
			.render({});

	assert.equal(result, text)
})

QUnit.test("multi line elements", function(assert) {
	var text = "<img\n class=\"{{myClass}}\" />",
		result = new can.Mustache({
			text: text
		})
			.render({
				myClass: 'a'
			});

	assert.ok(result.indexOf("<img\n class=\"a\"") !== -1, "Multi-line elements render correctly.");
	
	// clear hookups b/c we are using .render;
	can.view.hookups = {};
})

QUnit.test("escapedContent", function(assert) {
	var text = "<span>{{ tags }}</span><label>&amp;</label><strong>{{ number }}</strong><input value='{{ quotes }}'/>";
	var compiled = new can.Mustache({
		text: text
	})
		.render({
			tags: "foo < bar < car > zar > poo",
			quotes: "I use 'quote' fingers & &amp;ersands \"a lot\"",
			number: 123
		});

	var div = document.createElement('div');
	div.innerHTML = compiled;

	assert.equal(div.getElementsByTagName('span')[0].firstChild.nodeValue, "foo < bar < car > zar > poo");
	assert.equal(div.getElementsByTagName('strong')[0].firstChild.nodeValue, 123);
	assert.equal(div.getElementsByTagName('input')[0].value, "I use 'quote' fingers & &amp;ersands \"a lot\"", "attributes are always safe, and strings are kept as-is without additional escaping");
	assert.equal(div.getElementsByTagName('label')[0].innerHTML, "&amp;");
	// clear hookups b/c we are using .render;
	can.view.hookups = {};
})

QUnit.test("unescapedContent", function(assert) {
	var text = "<span>{{{ tags }}}</span><div>{{{ tags }}}</div><input value='{{{ quotes }}}'/>";
	var compiled = new can.Mustache({
		text: text
	})
		.render({
			tags: "<strong>foo</strong><strong>bar</strong>",
			quotes: 'I use \'quote\' fingers "a lot"'
		});

	var div = document.createElement('div');
	div.innerHTML = compiled;

	assert.equal(div.getElementsByTagName('span')[0].firstChild.nodeType, 1);
	assert.equal(div.getElementsByTagName('div')[0].innerHTML.toLowerCase(), "<strong>foo</strong><strong>bar</strong>");
	assert.equal(div.getElementsByTagName('span')[0].innerHTML.toLowerCase(), "<strong>foo</strong><strong>bar</strong>");
	assert.equal(div.getElementsByTagName('input')[0].value, "I use 'quote' fingers \"a lot\"", "escaped no matter what");
	// clear hookups b/c we are using .render;
	can.view.hookups = {};
});

/*
 not really applicable...but could update to work oince complete
 QUnit.test("returning blocks", function(){
 var somethingHelper = function(cb){
 return cb([1,2,3,4])
 }

 var res = can.view.
 render("//can/src/test_template.mustache",{
 something: somethingHelper,
 items: ['a','b']
 });
 // make sure expected values are in res
 assert.ok(/\s4\s/.test(res), "first block called" );
 assert.equal(res.match(/ItemsLength4/g).length, 4, "innerBlock and each")
 }); */

QUnit.test("easy hookup", function(assert) {
	var div = document.createElement('div');
	div.appendChild(can.view(can.test.path("src/test/easyhookup.mustache"), {
		text: "yes"
	}))

	assert.ok(div.getElementsByTagName('div')[0].className.indexOf("yes") !== -1, "has yes")
});

QUnit.test('multiple function hookups in a tag', function(assert) {

	var text = "<span {{(el)-> can.data(can.$(el),'foo','bar')}}" +
		" {{(el)-> can.data(can.$(el),'baz','qux')}}>lorem ipsum</span>",
		compiled = new can.Mustache({
			text: text
		})
			.render(),
		div = document.createElement('div');

	div.appendChild(can.view.frag(compiled));
	var span = div.getElementsByTagName('span')[0];

	assert.equal(can.data(can.$(span), 'foo'), 'bar', "first hookup");
	assert.equal(can.data(can.$(span), 'baz'), 'qux', "second hookup");
	// clear hookups b/c we are using .render;
	can.view.hookups = {};

})

/*
 needs andy's helper logic
 QUnit.test("helpers", function() {
 can.Mustache.Helpers.prototype.simpleHelper = function()
 {
 return 'Simple';
 }

 can.Mustache.Helpers.prototype.elementHelper = function()
 {
 return function(el) {
 el.innerHTML = 'Simple';
 }
 }

 var text = "<div>{{ simpleHelper() }}</div>";
 var compiled = new can.Mustache({text: text}).render() ;
 assert.equal(compiled, "<div>Simple</div>");

 text = "<div id=\"hookup\" {{ elementHelper() }}></div>";
 compiled = new can.Mustache({text: text}).render() ;
 can.append( can.$('#qunit-fixture'), can.view.frag(compiled));
 assert.equal(can.$('#hookup')[0].innerHTML, "Simple");
 }); */

QUnit.test("attribute single unescaped, html single unescaped", function(assert) {

	var text = "<div id='me' class='{{#task.completed}}complete{{/task.completed}}'>{{ task.name }}</div>";
	var task = new can.Map({
		name: 'dishes'
	})
	var compiled = new can.Mustache({
		text: text
	})
		.render({
			task: task
		});

	var div = document.createElement('div');

	div.appendChild(can.view.frag(compiled))

	assert.equal(div.getElementsByTagName('div')[0].innerHTML, "dishes", "html correctly dishes")
	assert.equal(div.getElementsByTagName('div')[0].className, "", "class empty")

	task.attr('name', 'lawn')

	assert.equal(div.getElementsByTagName('div')[0].innerHTML, "lawn", "html correctly lawn")
	assert.equal(div.getElementsByTagName('div')[0].className, "", "class empty")

	task.attr('completed', true);

	assert.equal(div.getElementsByTagName('div')[0].className, "complete", "class changed to complete");
	// clear hookups b/c we are using .render;
	can.view.hookups = {};
});

QUnit.test("event binding / triggering on options", function(assert) {
	var addEventListener = function (el, name, fn) {
		if (el.addEventListener) {
			el.addEventListener(name, fn, false);
		} else {
			el['on' + name] = fn;
		}
	};
	var frag = can.buildFragment("<select><option>a</option></select>", [document]);
	var qta = document.getElementById('qunit-fixture');
	qta.innerHTML = "";
	qta.appendChild(frag);

	/*qta.addEventListener("foo", function(){
	 assert.ok(false, "event handler called")
	 },false)*/

	// destroyed events should not bubble
	addEventListener(qta.getElementsByTagName("option")[0], "foo", function (ev) {
		assert.ok(true, "option called");
		if (ev.stopPropagation) {
			ev.stopPropagation();
		}
		//ev.cancelBubble = true;
	});

	addEventListener(qta.getElementsByTagName("select")[0], "foo", function () {
		assert.ok(true, "select called")
	});

	var ev;
	if (document.createEvent) {
		ev = document.createEvent("HTMLEvents");
	} else {
		ev = document.createEventObject("HTMLEvents");
	}

	if (ev.initEvent) {
		ev.initEvent("foo", true, true);
	} else {
		ev.eventType = "foo";
	}

	if (qta.getElementsByTagName("option")[0].dispatchEvent) {
		qta.getElementsByTagName("option")[0].dispatchEvent(ev);
	} else {
		qta.getElementsByTagName("option")[0].onfoo(ev);
	}

	can.trigger(qta, "foo")

	var done = assert.async();
	setTimeout(function () {
		done();
		assert.ok(true);
	}, 100)
})

QUnit.test("select live binding", function(assert) {
	var text = "<select>{{ #todos }}<option>{{ name }}</option>{{ /todos }}</select>";
	var Todos, compiled, div;
	Todos = new can.List([{
		id: 1,
		name: 'Dishes'
	}]);
	compiled = new can.Mustache({
		text: text
	})
		.render({
			todos: Todos
		});
	div = document.createElement('div');

	div.appendChild(can.view.frag(compiled))
	assert.equal(div.getElementsByTagName('option')
		.length, 1, '1 item in list')

	Todos.push({
		id: 2,
		name: 'Laundry'
	})
	assert.equal(div.getElementsByTagName('option')
		.length, 2, '2 items in list')

	Todos.splice(0, 2);
	assert.equal(div.getElementsByTagName('option')
		.length, 0, '0 items in list');
		
	// clear hookups b/c we are using .render;
	can.view.hookups = {};
});

QUnit.test('multiple hookups in a single attribute', function(assert) {
	var text = '<div class=\'{{ obs.foo }}' +
		'{{ obs.bar }}{{ obs.baz }}{{ obs.nest.what }}\'></div>';

	var obs = new can.Map({
		foo: 'a',
		bar: 'b',
		baz: 'c',
		nest: new can.Map({
			what: 'd'
		})
	});

	var compiled = new can.Mustache({
		text: text
	})
		.render({
			obs: obs
		})

	var div = document.createElement('div');

	div.appendChild(can.view.frag(compiled));

	var innerDiv = div.childNodes[0];

	assert.equal(getAttr(innerDiv, 'class'), "abcd", 'initial render');

	obs.attr('bar', 'e');

	assert.equal(getAttr(innerDiv, 'class'), "aecd", 'initial render');

	obs.attr('bar', 'f');

	assert.equal(getAttr(innerDiv, 'class'), "afcd", 'initial render');

	obs.nest.attr('what', 'g');

	assert.equal(getAttr(innerDiv, 'class'), "afcg", 'nested observe');
	
	// clear hookups b/c we are using .render;
	can.view.hookups = {};
});

QUnit.test('adding and removing multiple html content within a single element', function(assert) {

	var text, obs, compiled;

	text = '<div>{{ obs.a }}{{ obs.b }}{{ obs.c }}</div>';

	obs = new can.Map({
		a: 'a',
		b: 'b',
		c: 'c'
	});

	compiled = new can.Mustache({
		text: text
	})
		.render({
			obs: obs
		});

	var div = document.createElement('div');

	div.appendChild(can.view.frag(compiled));

	assert.equal(div.childNodes[0].innerHTML, 'abc', 'initial render');

	obs.attr({
		a: '',
		b: '',
		c: ''
	});

	assert.equal(div.childNodes[0].innerHTML, '', 'updated values');

	obs.attr({
		c: 'c'
	});

	assert.equal(div.childNodes[0].innerHTML, 'c', 'updated values');
	
	// clear hookups b/c we are using .render;
	can.view.hookups = {};
});

QUnit.test('live binding and removeAttr', function(assert) {

	var text = '{{ #obs.show }}' +
		'<p {{ obs.attributes }} class="{{ obs.className }}"><span>{{ obs.message }}</span></p>' +
		'{{ /obs.show }}',

		obs = new can.Map({
			show: true,
			className: 'myMessage',
			attributes: 'some=\"myText\"',
			message: 'Live long and prosper'
		}),

		compiled = new can.Mustache({
			text: text
		})
			.render({
				obs: obs
			}),

		div = document.createElement('div');

	div.appendChild(can.view.frag(compiled));

	var p = div.getElementsByTagName('p')[0],
		span = p.getElementsByTagName('span')[0];

	assert.equal(p.getAttribute("some"), "myText", 'initial render attr');
	assert.equal(getAttr(p, "class"), "myMessage", 'initial render class');
	assert.equal(span.innerHTML, 'Live long and prosper', 'initial render innerHTML');

	obs.removeAttr('className');

	assert.equal(getAttr(p, "class"), '', 'class is undefined');

	obs.attr('className', 'newClass');

	assert.equal(getAttr(p, "class"), 'newClass', 'class updated');

	obs.removeAttr('attributes');

	assert.equal(p.getAttribute('some'), null, 'attribute is undefined');

	obs.attr('attributes', 'some="newText"');

	assert.equal(p.getAttribute('some'), 'newText', 'attribute updated');

	obs.removeAttr('message');

	assert.equal(span.innerHTML, '', 'text node value is empty');

	obs.attr('message', 'Warp drive, Mr. Sulu');

	assert.equal(span.innerHTML, 'Warp drive, Mr. Sulu', 'text node updated');

	obs.removeAttr('show');

	assert.equal(div.innerHTML, '', 'value in block statement is undefined');

	obs.attr('show', true);

	p = div.getElementsByTagName('p')[0];
	span = p.getElementsByTagName('span')[0];

	assert.equal(p.getAttribute("some"), "newText", 'value in block statement updated attr');
	assert.equal(getAttr(p, "class"), "newClass", 'value in block statement updated class');
	assert.equal(span.innerHTML, 'Warp drive, Mr. Sulu', 'value in block statement updated innerHTML');
	
	// clear hookups b/c we are using .render;
	can.view.hookups = {};

});

QUnit.test('hookup within a tag', function(assert) {
	var text = '<div {{ obs.foo }} ' + '{{ obs.baz }}>lorem ipsum</div>',

		obs = new can.Map({
			foo: 'class="a"',
			baz: 'some=\'property\''
		}),

		compiled = new can.Mustache({
			text: text
		})
			.render({
				obs: obs
			});

	var div = document.createElement('div');
	div.appendChild(can.view.frag(compiled));
	var anchor = div.getElementsByTagName('div')[0];

	assert.equal(getAttr(anchor, 'class'), 'a');
	assert.equal(anchor.getAttribute('some'), 'property');

	obs.attr('foo', 'class="b"');
	assert.equal(getAttr(anchor, 'class'), 'b');
	assert.equal(anchor.getAttribute('some'), 'property');

	obs.attr('baz', 'some=\'new property\'');
	assert.equal(getAttr(anchor, 'class'), 'b');
	assert.equal(anchor.getAttribute('some'), 'new property');

	obs.attr('foo', 'class=""');
	obs.attr('baz', '');
	assert.equal(getAttr(anchor, 'class'), "", 'anchor class blank');
	assert.equal(anchor.getAttribute('some'), undefined, 'attribute "some" is undefined');
	
	// clear hookups b/c we are using .render;
	can.view.hookups = {};
});

QUnit.test('single escaped tag, removeAttr', function(assert) {
	var text = '<div {{ obs.foo }}>lorem ipsum</div>',

		obs = new can.Map({
			foo: 'data-bar="john doe\'s bar"'
		}),

		compiled = new can.Mustache({
			text: text
		})
			.render({
				obs: obs
			});

	var div = document.createElement('div');
	div.appendChild(can.view.frag(compiled));
	var anchor = div.getElementsByTagName('div')[0];

	assert.equal(anchor.getAttribute('data-bar'), "john doe's bar");

	obs.removeAttr('foo');
	assert.equal(anchor.getAttribute('data-bar'), null);

	obs.attr('foo', 'data-bar="baz"');
	assert.equal(anchor.getAttribute('data-bar'), 'baz');
	
	// clear hookups b/c we are using .render;
	can.view.hookups = {};
});

QUnit.test('html comments', function(assert) {
	var text = '<!-- bind to changes in the todo list --> <div>{{obs.foo}}</div>';

	var obs = new can.Map({
		foo: 'foo'
	});

	var compiled = new can.Mustache({
		text: text
	})
		.render({
			obs: obs
		});

	var div = document.createElement('div');
	div.appendChild(can.view.frag(compiled));
	assert.equal(div.getElementsByTagName('div')[0].innerHTML, 'foo', 'Element as expected');
	
	// clear hookups b/c we are using .render;
	can.view.hookups = {};
})

QUnit.test("hookup and live binding", function(assert) {

	var text = "<div class='{{ task.completed }}' {{ (el)-> can.data(can.$(el),'task',task) }}>" +
		"{{ task.name }}" +
		"</div>",
		task = new can.Map({
			completed: false,
			className: 'someTask',
			name: 'My Name'
		}),
		compiled = new can.Mustache({
			text: text
		})
			.render({
				task: task
			}),
		div = document.createElement('div');

	div.appendChild(can.view.frag(compiled))
	var child = div.getElementsByTagName('div')[0];
	assert.ok(child.className.indexOf("false") > -1, "is incomplete")
	assert.ok( !! can.data(can.$(child), 'task'), "has data")
	assert.equal(child.innerHTML, "My Name", "has name")

	task.attr({
		completed: true,
		name: 'New Name'
	});

	assert.ok(child.className.indexOf("true") !== -1, "is complete")
	assert.equal(child.innerHTML, "New Name", "has new name");
	
	// clear hookups b/c we are using .render;
	can.view.hookups = {};

})

QUnit.test('multiple curly braces in a block', function(assert) {
	var text = '{{^obs.items}}' +
		'<li>No items</li>' +
		'{{/obs.items}}' +
		'{{#obs.items}}' +
		'<li>{{name}}</li>' +
		'{{/obs.items}}',

		obs = new can.Map({
			items: []
		}),

		compiled = new can.Mustache({
			text: text
		})
			.render({
				obs: obs
			});

	var ul = document.createElement('ul');
	ul.appendChild(can.view.frag(compiled));

	assert.equal(ul.getElementsByTagName('li')[0].innerHTML, 'No items', 'initial observable state');

	obs.attr('items', [{
		name: 'foo'
	}]);
	assert.equal(ul.getElementsByTagName('li')[0].innerHTML, 'foo', 'updated observable');
});

QUnit.test("unescape bindings change", function(assert) {
	var l = new can.List([{
		complete: true
	}, {
		complete: false
	}, {
		complete: true
	}]);
	var completed = function () {
		l.attr('length');
		var num = 0;
		l.each(function (item) {
			if (item.attr('complete')) {
				num++;
			}
		})
		return num;
	};

	var text = '<div>{{ completed }}</div>',

		compiled = new can.Mustache({
			text: text
		})
			.render({
				completed: completed
			});

	var div = document.createElement('div');
	div.appendChild(can.view.frag(compiled));

	var child = div.getElementsByTagName('div')[0];
	assert.equal(child.innerHTML, "2", "at first there are 2 true bindings");
	var item = new can.Map({
		complete: true,
		id: "THIS ONE"
	})
	l.push(item);

	assert.equal(child.innerHTML, "3", "now there are 3 complete");

	item.attr('complete', false);

	assert.equal(child.innerHTML, "2", "now there are 2 complete");

	l.pop();

	item.attr('complete', true);

	assert.equal(child.innerHTML, "2", "there are still 2 complete");
});

QUnit.test("escape bindings change", function(assert) {
	var l = new can.List([{
		complete: true
	}, {
		complete: false
	}, {
		complete: true
	}]);
	var completed = function () {
		l.attr('length');
		var num = 0;
		l.each(function (item) {
			if (item.attr('complete')) {
				num++;
			}
		})
		return num;
	};

	var text = '<div>{{{ completed }}}</div>',

		compiled = new can.Mustache({
			text: text
		})
			.render({
				completed: completed
			});

	var div = document.createElement('div');
	div.appendChild(can.view.frag(compiled));

	var child = div.getElementsByTagName('div')[0];
	assert.equal(child.innerHTML, "2", "at first there are 2 true bindings");
	var item = new can.Map({
		complete: true
	})
	l.push(item);

	assert.equal(child.innerHTML, "3", "now there are 3 complete");

	item.attr('complete', false);

	assert.equal(child.innerHTML, "2", "now there are 2 complete");
});

QUnit.test("tag bindings change", function(assert) {
	var l = new can.List([{
		complete: true
	}, {
		complete: false
	}, {
		complete: true
	}]);
	var completed = function () {
		l.attr('length');
		var num = 0;
		l.each(function (item) {
			if (item.attr('complete')) {
				num++;
			}
		})
		return "items='" + num + "'";
	};

	var text = '<div {{{ completed }}}></div>',

		compiled = new can.Mustache({
			text: text
		})
			.render({
				completed: completed
			});

	var div = document.createElement('div');
	div.appendChild(can.view.frag(compiled));

	var child = div.getElementsByTagName('div')[0];
	assert.equal(child.getAttribute("items"), "2", "at first there are 2 true bindings");
	var item = new can.Map({
		complete: true
	})
	l.push(item);

	assert.equal(child.getAttribute("items"), "3", "now there are 3 complete");

	item.attr('complete', false);

	assert.equal(child.getAttribute("items"), "2", "now there are 2 complete");
})

QUnit.test("attribute value bindings change", function(assert) {
	var l = new can.List([{
		complete: true
	}, {
		complete: false
	}, {
		complete: true
	}]);
	var completed = function () {
		l.attr('length');
		var num = 0;
		l.each(function (item) {
			if (item.attr('complete')) {
				num++;
			}
		})
		return num;
	};

	var text = '<div items="{{{ completed }}}"></div>',

		compiled = new can.Mustache({
			text: text
		})
			.render({
				completed: completed
			});

	var div = document.createElement('div');
	div.appendChild(can.view.frag(compiled));

	var child = div.getElementsByTagName('div')[0];
	assert.equal(child.getAttribute("items"), "2", "at first there are 2 true bindings");
	var item = new can.Map({
		complete: true
	})
	l.push(item);

	assert.equal(child.getAttribute("items"), "3", "now there are 3 complete");

	item.attr('complete', false);

	assert.equal(child.getAttribute("items"), "2", "now there are 2 complete");
})

QUnit.test("in tag toggling", function(assert) {
	var text = "<div {{ obs.val }}></div>"

	var obs = new can.Map({
		val: 'foo="bar"'
	})

	var compiled = new can.Mustache({
		text: text
	})
		.render({
			obs: obs
		});

	var div = document.createElement('div');

	div.appendChild(can.view.frag(compiled));

	obs.attr('val', "bar='foo'");
	obs.attr('val', 'foo="bar"')
	var d2 = div.getElementsByTagName('div')[0];
	// toUpperCase added to normalize cases for IE8
	assert.equal(d2.getAttribute("foo"), "bar", "bar set");
	assert.equal(d2.getAttribute("bar"), null, "bar set")
});

// not sure about this w/ mustache
QUnit.test("nested properties", function(assert) {

	var text = "<div>{{ obs.name.first }}</div>"

	var obs = new can.Map({
		name: {
			first: "Justin"
		}
	})

	var compiled = new can.Mustache({
		text: text
	})
		.render({
			obs: obs
		});

	var div = document.createElement('div');

	div.appendChild(can.view.frag(compiled));

	div = div.getElementsByTagName('div')[0];

	assert.equal(div.innerHTML, "Justin")

	obs.attr('name.first', "Brian")

	assert.equal(div.innerHTML, "Brian")

});

QUnit.test("tags without chidren or ending with /> do not change the state", function(assert) {

	var text = "<table><tr><td/>{{{ obs.content }}}</tr></div>"
	var obs = new can.Map({
		content: "<td>Justin</td>"
	})
	var compiled = new can.Mustache({
		text: text
	})
		.render({
			obs: obs
		});
	var div = document.createElement('div');
	var html = can.view.frag(compiled);
	div.appendChild(html);

	assert.equal(div.getElementsByTagName('span')
		.length, 0, "there are no spans");
	assert.equal(div.getElementsByTagName('td')
		.length, 2, "there are 2 td");
})

QUnit.test("nested live bindings", function(assert) {
	QUnit.expect(0);

	var items = new can.List([{
		title: 0,
		is_done: false,
		id: 0
	}]);

	var div = document.createElement('div');

	var template = can.view.mustache('<form>{{#items}}{{^is_done}}<div id="{{title}}"></div>{{/is_done}}{{/items}}</form>')

	div.appendChild(template({
		items: items
	}));

	items.push({
		title: 1,
		is_done: false,
		id: 1
	});
	// this will throw an error unless Mustache protects against
	// nested objects
	items[0].attr('is_done', true);
});

QUnit.test("list nested in observe live bindings", function(assert) {
	can.view.mustache("list-test", "<ul>{{#data.items}}<li>{{name}}</li>{{/data.items}}</ul>");
	var data = new can.Map({
		items: [{
			name: "Brian"
		}, {
			name: "Fara"
		}]
	});
	var div = document.createElement('div');
	div.appendChild(can.view("list-test", {
		data: data
	}));
	data.items.push(new can.Map({
		name: "Scott"
	}))
	assert.ok(/Brian/.test(div.innerHTML), "added first name")
	assert.ok(/Fara/.test(div.innerHTML), "added 2nd name")
	assert.ok(/Scott/.test(div.innerHTML), "added name after push")
});

QUnit.test("trailing text", function(assert) {
	can.view.mustache("count", "There are {{ length }} todos")
	var div = document.createElement('div');
	div.appendChild(can.view("count", new can.List([{}, {}])));
	assert.ok(/There are 2 todos/.test(div.innerHTML), "got all text")
})

QUnit.test("recursive views", function(assert) {

	var data = new can.List([{
		label: 'branch1',
		children: [{
			id: 2,
			label: 'branch2'
		}]
	}])

	var div = document.createElement('div');
	div.appendChild(can.view(can.test.path('src/test/recursive.mustache'), {
		items: data
	}));
	assert.ok(/class="?leaf"?/.test(div.innerHTML), "we have a leaf")

})

QUnit.test("live binding textarea", function(assert) {
	can.view.mustache("textarea-test", "<textarea>Before{{ obs.middle }}After</textarea>");

	var obs = new can.Map({
		middle: "yes"
	}),
		div = document.createElement('div');

	div.appendChild(can.view("textarea-test", {
		obs: obs
	}))
	var textarea = div.firstChild

	assert.equal(textarea.value, "BeforeyesAfter");

	obs.attr("middle", "Middle")
	assert.equal(textarea.value, "BeforeMiddleAfter")

})

QUnit.test("reading a property from a parent object when the current context is an observe", function(assert) {
	can.view.mustache("parent-object", "{{#foos}}<span>{{bar}}</span>{{/foos}}")
	var data = {
		foos: new can.List([{
			name: "hi"
		}, {
			name: 'bye'
		}]),
		bar: "Hello World"
	}

	var div = document.createElement('div');
	var res = can.view("parent-object", data);
	div.appendChild(res);
	var spans = div.getElementsByTagName('span');

	assert.equal(spans.length, 2, 'Got two <span> elements');
	assert.equal(spans[0].innerHTML, 'Hello World', 'First span Hello World');
	assert.equal(spans[1].innerHTML, 'Hello World', 'Second span Hello World');
})

QUnit.test("helper parameters don't convert functions", function(assert) {
	can.Mustache.registerHelper('helperWithFn', function (fn) {
		assert.ok(can.isFunction(fn), 'Parameter is a function');
		assert.equal(fn(), 'Hit me!', 'Got the expected function');
	});

	var renderer = can.view.mustache('{{helperWithFn test}}');
	renderer({
		test: function () {
			return 'Hit me!';
		}
	});
})

QUnit.test("computes as helper parameters don't get converted", function(assert) {
	can.Mustache.registerHelper('computeTest', function (no) {
		assert.equal(no(), 5, 'Got computed calue');
		assert.ok(no.isComputed, 'no is still a compute')
	});

	var renderer = can.view.mustache('{{computeTest test}}');
	renderer({
		test: can.compute(5)
	});
})

QUnit.test("computes are supported in default helpers", function(assert) {

	var staches = {
		"if": "{{#if test}}if{{else}}else{{/if}}",
		"not_if": "not_{{^if test}}not{{/if}}if",
		"each": "{{#each test}}{{.}}{{/each}}",
		"with": "wit{{#with test}}<span>{{3}}</span>{{/with}}"
	};

	can.view.mustache("count", "There are {{ length }} todos")
	var div = document.createElement('div');
	div.appendChild(can.view("count", new can.List([{}, {}])));
	assert.ok(/There are 2 todos/.test(div.innerHTML), "got all text")

	var renderer, result, data, actual, span;

	for (result in staches) {
		renderer = can.view.mustache("compute_" + result, staches[result]);
		data = ["e", "a", "c", "h"];
		div = document.createElement("div");
		actual = can.view("compute_" + result, {
			test: can.compute(data)
		});
		div.appendChild(actual);
		span = div.getElementsByTagName("span")[0];
		if (span && span.firstChild) {
			div.replaceChild(span.firstChild, span);
		}
		actual = div.innerHTML;

		assert.equal(actual, result, "can.compute resolved for helper " + result);
	}

	var inv_staches = {
		"else": "{{#if test}}if{{else}}else{{/if}}",
		"not_not_if": "not_{{^if test}}not_{{/if}}if",
		"not_each": "not_{{#each test}}_{{/each}}each",
		"not_with": "not{{#with test}}_{{/with}}_with"
	};

	for (result in inv_staches) {
		renderer = can.view.mustache("compute_" + result, inv_staches[result]);
		data = null;
		div = document.createElement("div");
		actual = can.view("compute_" + result, {
			test: can.compute(data)
		});
		div.appendChild(actual);
		actual = div.innerHTML;

		assert.equal(actual, result, "can.compute resolved for helper " + result);
	}

});

//Issue 233
QUnit.test("multiple tbodies in table hookup", function(assert) {
	var text = "<table>" +
		"{{#people}}" +
		"<tbody><tr><td>{{name}}</td></tr></tbody>" +
		"{{/people}}" +
		"</table>",
		people = new can.List([{
			name: "Steve"
		}, {
			name: "Doug"
		}]),
		compiled = new can.Mustache({
			text: text
		})
			.render({
				people: people
			});

	can.append(can.$('#qunit-fixture'), can.view.frag(compiled));
	assert.equal(can.$('#qunit-fixture table tbody')
		.length, 2, "two tbodies");
})

// http://forum.javascriptmvc.com/topic/live-binding-on-mustache-template-does-not-seem-to-be-working-with-nested-properties
QUnit.test("Observe with array attributes", function(assert) {
	var renderer = can.view.mustache('<ul>{{#todos}}<li>{{.}}</li>{{/todos}}</ul><div>{{message}}</div>');
	var div = document.createElement('div');
	var data = new can.Map({
		todos: ['Line #1', 'Line #2', 'Line #3'],
		message: 'Hello',
		count: 2
	});
	div.appendChild(renderer(data));

	assert.equal(div.getElementsByTagName('li')[1].innerHTML, 'Line #2', 'Check initial array');
	assert.equal(div.getElementsByTagName('div')[0].innerHTML, 'Hello', 'Check initial message');

	data.attr('todos.1', 'Line #2 changed');
	data.attr('message', 'Hello again');

	assert.equal(div.getElementsByTagName('li')[1].innerHTML, 'Line #2 changed', 'Check updated array');
	assert.equal(div.getElementsByTagName('div')[0].innerHTML, 'Hello again', 'Check updated message');
})

QUnit.test("Observe list returned from the function", function(assert) {
	var renderer = can.view.mustache('<ul>{{#todos}}<li>{{.}}</li>{{/todos}}</ul>');
	var div = document.createElement('div');
	var todos = new can.List();
	var data = {
		todos: function () {
			return todos;
		}
	};
	div.appendChild(renderer(data));

	todos.push("Todo #1")

	assert.equal(div.getElementsByTagName('li')
		.length, 1, 'Todo is successfuly created');
	assert.equal(div.getElementsByTagName('li')[0].innerHTML, 'Todo #1', 'Pushing to the list works');
});

// https://github.com/canjs/canjs/issues/228
QUnit.test("Contexts within helpers not always resolved correctly", function(assert) {
	can.Mustache.registerHelper("bad_context", function (context, options) {
		return "<span>" + this.text + "</span> should not be " + options.fn(context);
	});

	var renderer = can.view.mustache('{{#bad_context next_level}}<span>{{text}}</span><br/><span>{{other_text}}</span>{{/bad_context}}'),
		data = {
			next_level: {
				text: "bar",
				other_text: "In the inner context"
			},
			text: "foo"
		},
		div = document.createElement('div');

	div.appendChild(renderer(data));
	assert.equal(div.getElementsByTagName('span')[0].innerHTML, "foo", 'Incorrect context passed to helper');
	assert.equal(div.getElementsByTagName('span')[1].innerHTML, "bar", 'Incorrect text in helper inner template');
	assert.equal(div.getElementsByTagName('span')[2].innerHTML, "In the inner context", 'Incorrect other_text in helper inner template');
});

// https://github.com/canjs/canjs/issues/227
QUnit.test("Contexts are not always passed to partials properly", function(assert) {
	can.view.registerView('inner', '{{#if other_first_level}}{{other_first_level}}{{else}}{{second_level}}{{/if}}', ".mustache")

	var renderer = can.view.mustache('{{#first_level}}<span>{{> inner}}</span> should equal <span>{{other_first_level}}</span>{{/first_level}}'),
		data = {
			first_level: {
				second_level: "bar"
			},
			other_first_level: "foo"
		},
		div = document.createElement('div');

	div.appendChild(renderer(data));
	assert.equal(div.getElementsByTagName('span')[0].innerHTML, "foo", 'Incorrect context passed to helper');
	assert.equal(div.getElementsByTagName('span')[1].innerHTML, "foo", 'Incorrect text in helper inner template');
});

// https://github.com/canjs/canjs/issues/231
QUnit.test("Functions and helpers should be passed the same context", function(assert) {
	can.Mustache.registerHelper("to_upper", function (fn/*, options*/) {
		if (!fn.fn) {
			return typeof fn === "function" ? fn()
				.toString()
				.toUpperCase() : fn.toString()
				.toUpperCase();
		} else {
			//fn is options
			return can.trim(fn.fn(this))
				.toString()
				.toUpperCase();
		}
	});

	var renderer = can.view.mustache('"{{next_level.text}}" uppercased should be "<span>{{to_upper next_level.text}}</span>"<br/>"{{next_level.text}}" uppercased with a workaround is "<span>{{#to_upper}}{{next_level.text}}{{/to_upper}}</span>"'),
		data = {
			next_level: {
				text: function () {
					return this.other_text;
				},
				other_text: "In the inner context"
			}
		},
		div = document.createElement('div');
	window.other_text = 'Window context';

	div.appendChild(renderer(data));
	assert.equal(div.getElementsByTagName('span')[0].innerHTML, data.next_level.other_text.toUpperCase(), 'Incorrect context passed to function');
	assert.equal(div.getElementsByTagName('span')[1].innerHTML, data.next_level.other_text.toUpperCase(), 'Incorrect context passed to helper');
});

// https://github.com/canjs/canjs/issues/153
QUnit.test("Interpolated values when iterating through an Observe.List should still render when not surrounded by a DOM node", function(assert) {
	var renderer = can.view.mustache('{{ #todos }}{{ name }}{{ /todos }}'),
		renderer2 = can.view.mustache('{{ #todos }}<span>{{ name }}</span>{{ /todos }}'),
		todos = [{
			id: 1,
			name: 'Dishes'
		}, {
			id: 2,
			name: 'Forks'
		}],
		liveData = {
			todos: new can.List(todos)
		},
		plainData = {
			todos: todos
		},
		div = document.createElement('div');

	div.appendChild(renderer2(plainData));
	
	assert.equal(div.getElementsByTagName('span')[0].innerHTML, "Dishes", 'Array item rendered with DOM container');
	assert.equal(div.getElementsByTagName('span')[1].innerHTML, "Forks", 'Array item rendered with DOM container');

	div = document.createElement('div')
	div.appendChild(renderer2(liveData));
	
	assert.equal(div.getElementsByTagName('span')[0].innerHTML, "Dishes", 'List item rendered with DOM container');
	assert.equal(div.getElementsByTagName('span')[1].innerHTML, "Forks", 'List item rendered with DOM container');
	
	div = document.createElement('div');

	div.appendChild(renderer(plainData));
	assert.equal(div.innerHTML, "DishesForks", 'Array item rendered without DOM container');

	div = document.createElement('div');

	div.appendChild(renderer(liveData));
	assert.equal(div.innerHTML, "DishesForks", 'List item rendered without DOM container');

	liveData.todos.push({
		id: 3,
		name: 'Knives'
	});
	assert.equal(div.innerHTML, "DishesForksKnives", 'New list item rendered without DOM container');
});

QUnit.test("objects with a 'key' or 'index' property should work in helpers", function(assert) {
	var renderer = can.view.mustache('{{ #obj }}{{ show_name }}{{ /obj }}'),
		div = document.createElement('div');

	div.appendChild(renderer({
		obj: {
			id: 2,
			name: 'Forks',
			key: 'bar'
		}
	}, {
		show_name: function () {
			return this.name;
		}
	}));
	assert.equal(div.innerHTML, "Forks", 'item name rendered');

	div.innerHTML = '';

	div.appendChild(renderer({
		obj: {
			id: 2,
			name: 'Forks',
			index: 'bar'
		}
	}, {
		show_name: function () {
			return this.name;
		}
	}));
	assert.equal(div.innerHTML, "Forks", 'item name rendered');
});

QUnit.test("2 way binding helpers", function(assert) {

	var Value = function (el, value) {
		this.updateElement = function (ev, newVal) {
			el.value = newVal || "";
		};
		value.bind("change", this.updateElement);
		el.onchange = function () {
			value(el.value)
		}
		this.teardown = function () {
			value.unbind("change", this.updateElement);
			el.onchange = null;
		}
		el.value = value() || "";
	}
	var val;
	can.Mustache.registerHelper('value', function (value) {
		return function (el) {
			val = new Value(el, value);
		}
	});

	var renderer = can.view.mustache('<input {{value user.name}}/>');

	var div = document.createElement('div'),
		u = new can.Map({
			name: "Justin"
		});

	div.appendChild(renderer({
		user: u
	}));

	var input = div.getElementsByTagName('input')[0];

	assert.equal(input.value, "Justin", "Name is set correctly")

	u.attr('name', 'Eli')

	assert.equal(input.value, "Eli", "Changing observe updates value");

	input.value = "Austin";
	input.onchange();

	assert.equal(u.attr('name'), "Austin", "Name changed by input field");

	val.teardown();

	// name is undefined
	renderer = can.view.mustache('<input {{value user.name}}/>');
	div = document.createElement('div');
	u = new can.Map({});
	div.appendChild(renderer({
		user: u
	}));
	input = div.getElementsByTagName('input')[0];

	assert.equal(input.value, "", "Name is set correctly")

	u.attr('name', 'Eli')

	assert.equal(input.value, "Eli", "Changing observe updates value");

	input.value = "Austin";
	input.onchange();
	assert.equal(u.attr('name'), "Austin", "Name changed by input field");
	val.teardown();

	// name is null
	renderer = can.view.mustache('<input {{value user.name}}/>');
	div = document.createElement('div');
	u = new can.Map({
		name: null
	});
	div.appendChild(renderer({
		user: u
	}));
	input = div.getElementsByTagName('input')[0];

	assert.equal(input.value, "", "Name is set correctly with null")

	u.attr('name', 'Eli')

	assert.equal(input.value, "Eli", "Changing observe updates value");

	input.value = "Austin";
	input.onchange();
	assert.equal(u.attr('name'), "Austin", "Name changed by input field");
	val.teardown();

});

QUnit.test("can pass in partials", function(assert) {
	var hello = can.view(can.test.path('src/test/hello.mustache'));
	var fancyName = can.view(can.test.path('src/test/fancy_name.mustache'));
	var result = hello.render({
		name: "World"
	}, {
		partials: {
			name: fancyName
		}
	});

	assert.ok(/World/.test(result.toString()), "Hello World worked");
});

QUnit.test("can pass in helpers", function(assert) {
	var helpers = can.view.render(can.test.path('src/test/helper.mustache'));
	var result = helpers.render({
		name: "world"
	}, {
		helpers: {
			cap: function (name) {
				return can.capitalize(name);
			}
		}
	});

	assert.ok(/World/.test(result.toString()), "Hello World worked");
});

QUnit.test("HTML comment with helper", function(assert) {
	var text = ["<ul>",
		"{{#todos}}",
		"<li {{data 'todo'}}>",
		"<!-- html comment #1 -->",
		"{{name}}",
		"<!-- html comment #2 -->",
		"</li>",
		"{{/todos}}",
		"</ul>"
	],
		Todos = new can.List([{
			id: 1,
			name: "Dishes"
		}]),
		compiled = new can.Mustache({
			text: text.join("\n")
		})
			.render({
				todos: Todos
			}),
		div = document.createElement("div"),
		li;

	var comments = function (el) {
		var count = 0;
		for (var i = 0; i < el.childNodes.length; i++) {
			if (el.childNodes[i].nodeType === 8) {
				++count;
			}
		}
		return count;
	};

	div.appendChild(can.view.frag(compiled));
	li = div.getElementsByTagName("ul")[0].getElementsByTagName("li");
	assert.equal(li.length, 1, "1 item in list");
	assert.equal(comments(li[0]), 2, "2 comments in item #1");

	Todos.push({
		id: 2,
		name: "Laundry"
	});
	assert.equal(li.length, 2, "2 items in list");
	assert.equal(comments(li[0]), 2, "2 comments in item #1");
	assert.equal(comments(li[1]), 2, "2 comments in item #2");

	Todos.splice(0, 2);
	assert.equal(li.length, 0, "0 items in list");
});

QUnit.test("correctness of data-view-id and only in tag opening", function(assert) {
	var text = ["<textarea><select>{{#items}}",
		"<option{{data 'item'}}>{{title}}</option>",
		"{{/items}}</select></textarea>"
	],
		items = [{
			id: 1,
			title: "One"
		}, {
			id: 2,
			title: "Two"
		}],
		compiled = new can.Mustache({
			text: text.join("")
		})
			.render({
				items: items
			}),
		expected = "^<textarea data-view-id='[0-9]+'><select><option data-view-id='[0-9]+'>One</option>" +
			"<option data-view-id='[0-9]+'>Two</option></select></textarea>$";

	assert.ok(compiled.search(expected) === 0, "Rendered output is as expected");
	
	// clear hookups b/c we are using .render;
	can.view.hookups = {};
});

QUnit.test("Empty strings in arrays within Observes that are iterated should return blank strings", function(assert) {
	var data = new can.Map({
		colors: ["", 'red', 'green', 'blue']
	}),
		compiled = new can.Mustache({
			text: "<select>{{#colors}}<option>{{.}}</option>{{/colors}}</select>"
		})
			.render(data),
		div = document.createElement('div');

	div.appendChild(can.view.frag(compiled));
	assert.equal(div.getElementsByTagName('option')[0].innerHTML, "", "Blank string should return blank");
});

QUnit.test("Null properties do not throw errors in Mustache.get", function(assert) {
	var renderer = can.view.mustache("Foo bar {{#foo.bar}}exists{{/foo.bar}}{{^foo.bar}}does not exist{{/foo.bar}}"),
		div = document.createElement('div'),
		div2 = document.createElement('div'),
		frag, frag2;

	try {
		frag = renderer(new can.Map({
			foo: null
		}))
	} catch (e) {
		assert.ok(false, "rendering with null threw an error");
	}
	frag2 = renderer(new can.Map({
		foo: {
			bar: "baz"
		}
	}))
	div.appendChild(frag);
	div2.appendChild(frag2);
	assert.equal(div.innerHTML, "Foo bar does not exist");
	assert.equal(div2.innerHTML, "Foo bar exists");
});

// Issue #288
QUnit.test("Data helper should set proper data instead of a context stack", function(assert) {
	var partials = {
		'nested_data': '<span id="has_data" {{data "attr"}}></span>',
		'nested_data2': '{{#this}}<span id="has_data" {{data "attr"}}></span>{{/this}}',
		'nested_data3': '{{#bar}}<span id="has_data" {{data "attr"}}></span>{{/bar}}'
	};
	for (var name in partials) {
		can.view.registerView(name, partials[name],".mustache")
	}

	var renderer = can.view.mustache("{{#bar}}{{> #nested_data}}{{/bar}}"),
		renderer2 = can.view.mustache("{{#bar}}{{> #nested_data2}}{{/bar}}"),
		renderer3 = can.view.mustache("{{#bar}}{{> #nested_data3}}{{/bar}}"),
		div = document.createElement('div'),
		data = new can.Map({
			foo: "bar",
			bar: new can.Map({})
		}),
		span;

	div.innerHTML = '';
	div.appendChild(renderer(data));
	span = can.$(div.getElementsByTagName('span')[0]);
	assert.strictEqual(can.data(span, 'attr'), data.bar, 'Nested data 1 should have correct data');

	div.innerHTML = '';
	div.appendChild(renderer2(data));
	span = can.$(div.getElementsByTagName('span')[0]);
	assert.strictEqual(can.data(span, 'attr'), data.bar, 'Nested data 2 should have correct data');

	div.innerHTML = '';
	div.appendChild(renderer3(data));
	span = can.$(div.getElementsByTagName('span')[0]);
	assert.strictEqual(can.data(span, 'attr'), data.bar, 'Nested data 3 should have correct data');
});

// Issue #333
QUnit.test("Functions passed to default helpers should be evaluated", function(assert) {
	var renderer = can.view.mustache("{{#if hasDucks}}Ducks: {{ducks}}{{else}}No ducks!{{/if}}"),
		div = document.createElement('div'),
		data = new can.Map({
			ducks: "",
			hasDucks: function () {
				return this.attr("ducks")
					.length > 0;
			}
		});

	var span;

	div.innerHTML = '';
	div.appendChild(renderer(data));
	span = can.$(div.getElementsByTagName('span')[0]);
	assert.equal(div.innerHTML, 'No ducks!', 'The function evaluated should evaluate false');
});

QUnit.test("avoid global helpers", function(assert) {
	var noglobals = can.view.mustache("{{sometext person.name}}");

	var div = document.createElement('div'),
		div2 = document.createElement('div');

	var person = new can.Map({
		name: "Brian"
	});
	var result = noglobals({
		person: person
	}, {
		sometext: function (name) {
			return "Mr. " + name()
		}
	});

	var result2 = noglobals({
		person: person
	}, {
		sometext: function (name) {
			return name() + " rules"
		}
	});

	div.appendChild(result);
	div2.appendChild(result2);

	person.attr("name", "Ajax")

	assert.equal(div.innerHTML, "Mr. Ajax");
	assert.equal(div2.innerHTML, "Ajax rules");
});

QUnit.test("Helpers always have priority (#258)", function(assert) {
	can.Mustache.registerHelper('callMe', function (arg) {
		return arg + ' called me!';
	});

	var t = {
		template: "<div>{{callMe 'Tester'}}</div>",
		expected: "<div>Tester called me!</div>",
		data: {
			callMe: function (arg) {
				return arg + ' hanging up!';
			}
		}
	};

	var expected = t.expected.replace(/&quot;/g, '&#34;')
		.replace(/\r\n/g, '\n');
	assert.deepEqual(new can.Mustache({
			text: t.template
		})
		.render(t.data), expected);
});

if (typeof steal !== 'undefined') {
	QUnit.test("avoid global helpers", function(assert) {
		var done = assert.async();
		steal('src/test/noglobals.mustache!', function (noglobals) {
			var div = document.createElement('div'),
				div2 = document.createElement('div');
			var person = new can.Map({
				name: "Brian"
			});
			var result = noglobals({
				person: person
			}, {
				sometext: function (name) {
					return "Mr. " + name()
				}
			});
			var result2 = noglobals({
				person: person
			}, {
				sometext: function (name) {
					return name() + " rules"
				}
			});
			div.appendChild(result);
			div2.appendChild(result2);

			person.attr("name", "Ajax")

			assert.equal(div.innerHTML, "Mr. Ajax");
			assert.equal(div2.innerHTML, "Ajax rules");
			done();
		});
	});
}

QUnit.test("Each does not redraw items", function(assert) {

	var animals = new can.List(['sloth', 'bear']),
		renderer = can.view.mustache("<div>my<b>favorite</b>animals:{{#each animals}}<label>Animal=</label> <span>{{this}}</span>{{/}}!</div>");

	var div = document.createElement('div')

	var frag = renderer({
		animals: animals
	});
	div.appendChild(frag)

	div.getElementsByTagName('label')[0].myexpando = "EXPANDO-ED";

	//animals.push("dog")
	assert.equal(div.getElementsByTagName('label')
		.length, 2, "There are 2 labels")

	animals.push("turtle")

	assert.equal(div.getElementsByTagName('label')[0].myexpando, "EXPANDO-ED", "same expando");

	assert.equal(div.getElementsByTagName('span')[2].innerHTML, "turtle", "turtle added");

});

QUnit.test("Each works with the empty list", function(assert) {

	var animals = new can.List([]),
		renderer = can.view.mustache("<div>my<b>favorite</b>animals:{{#each animals}}<label>Animal=</label> <span>{{this}}</span>{{/}}!</div>");

	var div = document.createElement('div')

	var frag = renderer({
		animals: animals
	});
	div.appendChild(frag)

	animals.push('sloth', 'bear')

	//animals.push("dog")
	assert.equal(div.getElementsByTagName('label')
		.length, 2, "There are 2 labels")

	animals.push("turtle")

	assert.equal(div.getElementsByTagName('span')[2].innerHTML, "turtle", "turtle added");

});

QUnit.test("each works within another branch", function(assert) {
	var animals = new can.List([]),
		template = "<div>Animals:" +
			"{{#if animals.length}}~" +
			"{{#each animals}}" +
			"<span>{{.}}</span>" +
			"{{/each}}" +
			"{{else}}" +
			"No animals" +
			"{{/if}}" +
			"!</div>";

	var renderer = can.view.mustache(template)

	var div = document.createElement('div');

	var frag = renderer({
		animals: animals
	});
	div.appendChild(frag)

	assert.equal(div.getElementsByTagName('div')[0].innerHTML, "Animals:No animals!");
	animals.push('sloth');

	assert.equal(div.getElementsByTagName('span')
		.length, 1, "There is 1 sloth");
	animals.pop();

	assert.equal(div.getElementsByTagName('div')[0].innerHTML, "Animals:No animals!");
});

QUnit.test("a compute gets passed to a plugin", function(assert) {

	can.Mustache.registerHelper('iamhungryforcomputes', function (value) {
		assert.ok(value.isComputed, "value is a compute")
		return function (/*el*/) {

		}
	});

	var renderer = can.view.mustache('<input {{iamhungryforcomputes userName}}/>');

	var div = document.createElement('div'),
		u = new can.Map({
			name: "Justin"
		});

	div.appendChild(renderer({
		userName: u.compute("name")
	}));

});

QUnit.test("Object references can escape periods for key names containing periods", function(assert) {
	var template = can.view.mustache("{{#foo.bar}}" +
		"{{some\\\\.key\\\\.name}} {{some\\\\.other\\\\.key.with\\\\.more}}" +
		"{{/foo.bar}}"),
		data = {
			foo: {
				bar: [{
					"some.key.name": 100,
					"some.other.key": {
						"with.more": "values"
					}
				}]
			}
		};

	var div = document.createElement('div');
	div.appendChild(template(data))

	assert.equal(div.innerHTML, "100 values");
})

QUnit.test("Computes should be resolved prior to accessing attributes", function(assert) {
	var template = can.view.mustache("{{list.length}}"),
		data = {
			list: can.compute(new can.List())
		};

	var div = document.createElement('div');
	div.appendChild(template(data))

	assert.equal(div.innerHTML, "0");
})

QUnit.test("Helpers can be passed . or this for the active context", function(assert) {
	can.Mustache.registerHelper('rsvp', function (attendee, event) {
		return attendee.name + ' is attending ' + event.name;
	});
	var template = can.view.mustache("{{#attendee}}{{#events}}<div>{{rsvp attendee .}}</div>{{/events}}{{/#attendee}}"),
		data = {
			attendee: {
				name: 'Justin'
			},
			events: [{
				name: 'Reception'
			}, {
				name: 'Wedding'
			}]
		};

	var div = document.createElement('div');
	div.appendChild(template(data));
	var children = div.getElementsByTagName('div');

	assert.equal(children[0].innerHTML, 'Justin is attending Reception');
	assert.equal(children[1].innerHTML, 'Justin is attending Wedding');
});

QUnit.test("helpers only called once (#477)", function(assert) {

	var callCount = 0;

	Mustache.registerHelper("foo", function (/*text*/) {
		callCount++;
		assert.equal(callCount, 1, "call count is only ever one")
		return "result";
	});

	var obs = new can.Map({
		quux: false
	});

	var template = can.view.mustache("Foo text is: {{#if quux}}{{foo 'bar'}}{{/if}}");

	template(obs);

	obs.attr("quux", true);

});

QUnit.test("helpers between tags (#469)", function(assert) {

	can.Mustache.registerHelper("items", function () {
		return function (li) {
			assert.equal(li.nodeName.toLowerCase(), "li", "right node name")
		}
	});

	var template = can.view.mustache("<ul>{{items}}</ul>");
	template();
})

QUnit.test("hiding image srcs (#157)", function(assert) {
	var template = can.view.mustache('<img {{#image}}src="{{.}}"{{/image}} alt="An image" />'),
		data = new can.Map({
			image: null
		}),
		url = "http://canjs.us/scripts/static/img/canjs_logo_yellow_small.png";

	var frag = template(data),
		img = frag.childNodes[0];

	assert.equal(img.src, "", "there is no src");

	data.attr("image", url)
	assert.notEqual(img.src, "", 'Image should have src')
	assert.equal(img.src, url, "images src is correct");

	/*var renderer = can.view.mustache('<img {{#image}}src="{{.}}"{{/image}} alt="An image" />{{image}}'),
	 url = 'http://farm8.staticflickr.com/7102/6999583228_99302b91ac_n.jpg',
	 data = new can.Map({
	 user: 'Tina Fey',
	 messages: 0
	 }),
	 div = document.createElement('div');

	 div.appendChild(renderer(data));

	 var img = div.getElementsByTagName('img')[0];
	 assert.equal(img.src, "", 'Image should not have src');

	 data.attr('messages', 5);
	 data.attr('image', url);
	 assert.notEqual(img.src, "", 'Image should have src');
	 assert.equal(img.src, url, 'Image should have src URL');*/
});

QUnit.test("live binding in a truthy section", function(assert) {
	var template = can.view.mustache('<div {{#width}}width="{{.}}"{{/width}}></div>'),
		data = new can.Map({
			width: '100'
		});

	var frag = template(data),
		img = frag.childNodes[0];

	assert.equal(img.getAttribute("width"), "100", "initial width is correct");

	data.attr("width", "300")
	assert.equal(img.getAttribute('width'), "300", "updated width is correct");

});

QUnit.test("backtracks in mustache (#163)", function(assert) {

	var template = can.view.mustache(
		"{{#grid.rows}}" +
		"{{#grid.cols}}" +
		"<div>{{columnData ../. .}}</div>" +
		"{{/grid.cols}}" +
		"{{/grid.rows}}");

	var grid = new can.Map({
		rows: [{
			first: "Justin",
			last: "Meyer"
		}, {
			first: "Brian",
			last: "Moschel"
		}],
		cols: [{
			prop: "first"
		}, {
			prop: "last"
		}]
	})

	var frag = template({
		grid: grid
	}, {
		columnData: function (row, col) {
			return row.attr(col.attr("prop"))
		}
	});

	var divs = frag.childNodes;
	assert.equal(divs.length, 4, "there are 4 divs");

	var vals = can.map(divs, function (div) {
		return div.innerHTML
	});

	assert.deepEqual(vals, ["Justin", "Meyer", "Brian", "Moschel"], "div values are the same");

})

QUnit.test("support null and undefined as an argument", function(assert) {

	var template = can.view.mustache("{{aHelper null undefined}}")

	template({}, {
		aHelper: function (arg1, arg2) {
			assert.ok(arg1 === null);
			assert.ok(arg2 === undefined)
		}
	});
});

QUnit.test("passing can.List to helper (#438)", function(assert) {
	var renderer = can.view.mustache('<ul><li {{helper438 observeList}}>observeList broken</li>' +
		'<li {{helper438 array}}>plain arrays work</li></ul>')

	can.Mustache.registerHelper('helper438', function (/*classnames*/) {
		return function (el) {
			el.innerHTML = 'Helper called';
		};
	});

	var frag = renderer({
		observeList: new can.List([{
			test: 'first'
		}, {
			test: 'second'
		}]),
		array: [{
			test: 'first'
		}, {
			test: 'second'
		}]
	});
	var div = document.createElement('div');

	div.appendChild(frag);

	var ul = div.children[0];

	assert.equal(ul.children[0].innerHTML, 'Helper called', 'Helper called');
	assert.equal(ul.children[1].innerHTML, 'Helper called', 'Helper called');
});

QUnit.test("hiding image srcs (#494)", function(assert) {
	var template = can.view.mustache('<img src="{{image}}"/>'),
		data = new can.Map({
			image: ""
		}),
		url = "http://canjs.us/scripts/static/img/canjs_logo_yellow_small.png";

	var str = template.render(data);

	assert.ok(str.indexOf('__!!__') === -1, "no __!!___ " + str)

	var frag = template(data),
		img = frag.childNodes[0];

	assert.equal(img.src, "", "there is no src");

	data.attr("image", url);
	assert.notEqual(img.src, "", 'Image should have src');
	assert.equal(img.src, url, "images src is correct");
	
	// clear hookups b/c we are using .render;
	can.view.hookups = {};
});

QUnit.test("hiding image srcs with complex content (#494)", function(assert) {
	var template = can.view.mustache('<img src="{{#image}}http://{{domain}}/{{loc}}.png{{/image}}"/>'),
		data = new can.Map({}),
		imgData = {
			domain: "canjs.us",
			loc: "scripts/static/img/canjs_logo_yellow_small"
		},
		url = "http://canjs.us/scripts/static/img/canjs_logo_yellow_small.png";

	var str = template.render(data);

	assert.ok(str.indexOf('__!!__') === -1, "no __!!__")

	var frag = template(data),
		img = frag.childNodes[0];

	assert.equal(img.src, "", "there is no src");

	data.attr("image", imgData);
	assert.notEqual(img.src, "", 'Image should have src');
	assert.equal(img.src, url, "images src is correct");
	
	// clear hookups b/c we are using .render;
	can.view.hookups = {};
});

QUnit.test("style property is live-bindable in IE (#494)", 4, function(assert) {

	var template = can.view.mustache('<div style="width: {{width}}px; background-color: {{color}};">hi</div>')

	var dims = new can.Map({
		width: 5,
		color: 'red'
	});

	var div = template(dims)
		.childNodes[0]

	assert.equal(div.style.width, "5px");
	assert.equal(div.style.backgroundColor, "red");

	dims.attr("width", 10);
	dims.attr('color', 'blue');

	assert.equal(div.style.width, "10px");
	assert.equal(div.style.backgroundColor, "blue");
});

QUnit.test("empty lists update", 2, function(assert) {
	var template = can.view.mustache('<p>{{#list}}{{.}}{{/list}}</p>');
	var map = new can.Map({
		list: ['something']
	});

	var frag = template(map);
	var div = document.createElement('div');

	div.appendChild(frag);

	assert.equal(div.children[0].innerHTML, 'something', 'initial list content set');
	map.attr('list', ['one', 'two']);
	assert.equal(div.children[0].innerHTML, 'onetwo', 'updated list content set');
});

QUnit.test("attributes in truthy section", function(assert) {
	var template = can.view.mustache('<p {{#attribute}}data-test="{{attribute}}"{{/attribute}}></p>');
	var data1 = {
		attribute: "test-value"
	};
	var frag1 = template(data1);
	var div1 = document.createElement('div');

	div1.appendChild(frag1);
	assert.equal(div1.children[0].getAttribute('data-test'), 'test-value', 'hyphenated attribute value');

	var data2 = {
		attribute: "test value"
	};
	var frag2 = template(data2);
	var div2 = document.createElement('div');

	div2.appendChild(frag2);
	assert.equal(div2.children[0].getAttribute('data-test'), 'test value', 'whitespace in attribute value');
});

QUnit.test("live bound attributes with no '='", function(assert) {
	var template = can.view.mustache('<input type="radio" {{#selected}}checked{{/selected}}>');
	var data = new can.Map({
		selected: false
	});
	var frag = template(data);
	var div = document.createElement('div');

	div.appendChild(frag);
	data.attr('selected', true);
	assert.equal(div.children[0].checked, true, 'hyphenated attribute value');

	data.attr("selected", false)
	assert.equal(div.children[0].checked, false, 'hyphenated attribute value');
});

QUnit.test("outputting array of attributes", function(assert) {
	var template = can.view.mustache('<p {{#attribute}}{{name}}="{{value}}"{{/attribute}}></p>');
	var data = {
		attribute: [{
			"name": "data-test1",
			"value": "value1"
		}, {
			"name": "data-test2",
			"value": "value2"
		}, {
			"name": "data-test3",
			"value": "value3"
		}]
	};
	var frag = template(data);
	var div = document.createElement('div');

	div.appendChild(frag);
	assert.equal(div.children[0].getAttribute('data-test1'), 'value1', 'first value');
	assert.equal(div.children[0].getAttribute('data-test2'), 'value2', 'second value');
	assert.equal(div.children[0].getAttribute('data-test3'), 'value3', 'third value');
});

QUnit.test("incremental updating of #each within an if", function(assert) {
	var template = can.view.mustache('{{#if items.length}}<ul>{{#each items}}<li/>{{/each}}</ul>{{/if}}');

	var items = new can.List([{}, {}]);
	var div = document.createElement('div');
	div.appendChild(template({
		items: items
	}));

	var ul = div.getElementsByTagName('ul')[0]
	ul.setAttribute("original", "yup");

	items.push({});
	assert.ok(ul === div.getElementsByTagName('ul')[0], "ul is still the same")

});

QUnit.test("can.mustache.safeString", function(assert) {
	var text = "Google",
		url = "http://google.com/",
		templateEscape = can.view.mustache('{{link "' + text + '" "' + url + '"}}'),
		templateUnescape = can.view.mustache('{{{link "' + text + '" "' + url + '"}}}');
	can.mustache.registerHelper('link', function (text, url) {
		var link = '<a href="' + url + '">' + text + '</a>';
		return can.mustache.safeString(link);
	});

	var div = document.createElement('div');
	div.appendChild(templateEscape({}));

	assert.equal(div.children.length, 1, 'rendered a DOM node');
	assert.equal(div.children[0].nodeName, 'A', 'rendered an anchor tag');
	assert.equal(div.children[0].innerHTML, text, 'rendered the text properly');
	assert.equal(div.children[0].getAttribute('href'), url, 'rendered the href properly');

	div = document.createElement('div');
	div.appendChild(templateUnescape({}));

	assert.equal(div.children.length, 1, 'rendered a DOM node');
	assert.equal(div.children[0].nodeName, 'A', 'rendered an anchor tag');
	assert.equal(div.children[0].innerHTML, text, 'rendered the text properly');
	assert.equal(div.children[0].getAttribute('href'), url, 'rendered the href properly');
});

QUnit.test("changing the list works with each", function(assert) {
	var template = can.view.mustache("<ul>{{#each list}}<li>.</li>{{/each}}</ul>");

	var map = new can.Map({
		list: ["foo"]
	});

	var lis = template(map)
		.childNodes[0].getElementsByTagName('li');

	assert.equal(lis.length, 1, "one li")

	map.attr("list", new can.List(["bar", "car"]));

	assert.equal(lis.length, 2, "two lis")

});

QUnit.test("nested properties binding (#525)", function(assert) {
	var template = can.view.mustache("<label>{{name.first}}</label>");

	var me = new can.Map()

	var label = template(me)
		.childNodes[0];
	me.attr("name", {
		first: "Justin"
	});
	assert.equal(label.innerHTML, "Justin", "set name object");

	me.attr("name", {
		first: "Brian"
	});
	assert.equal(label.innerHTML, "Brian", "merged name object");

	me.removeAttr("name");
	me.attr({
		name: {
			first: "Payal"
		}
	});

	assert.equal(label.innerHTML, "Payal", "works after parent removed");

})

QUnit.test("Rendering indicies of an array with @index", function(assert) {
	var template = can.view.mustache("<ul>{{#each list}}<li>{{@index}} {{.}}</li>{{/each}}</ul>");
	var list = [0, 1, 2, 3];

	var lis = template({
		list: list
	})
		.childNodes[0].getElementsByTagName('li');

	for (var i = 0; i < lis.length; i++) {
		assert.equal(lis[i].innerHTML, (i + ' ' + i), 'rendered index and value are correct');
	}
});

QUnit.test("Rendering indicies of an array with @index + offset (#1078)", function(assert) {
	var template = can.view.mustache("<ul>{{#each list}}<li>{{@index 5}} {{.}}</li>{{/each}}</ul>");
	var list = [0, 1, 2, 3];

	var lis = template({
		list: list
	})
		.childNodes[0].getElementsByTagName('li');

	for (var i = 0; i < lis.length; i++) {
		assert.equal(lis[i].innerHTML, (i+5 + ' ' + i), 'rendered index and value are correct');
	}
});

QUnit.test("Passing indices into helpers as values", function(assert) {
	var template = can.view.mustache("<ul>{{#each list}}<li>{{test @index}} {{.}}</li>{{/each}}</ul>");
	var list = [0, 1, 2, 3];

	var lis = template({
		list: list
	}, {
		test: function(index) {
			return ""+index;
		}
	}).childNodes[0].getElementsByTagName('li');

	for (var i = 0; i < lis.length; i++) {
		assert.equal(lis[i].innerHTML, (i + ' ' + i), 'rendered index and value are correct');
	}
});

QUnit.test("Rendering live bound indicies with #each, @index and a simple can.List", function(assert) {
	var list = new can.List(['a', 'b', 'c']);
	var template = can.view.mustache("<ul>{{#each list}}<li>{{@index}} {{.}}</li>{{/each}}</ul>");

	var lis = template({
		list: list
	})
		.childNodes[0].getElementsByTagName('li');

	assert.equal(lis.length, 3, "three lis");

	assert.equal(lis[0].innerHTML, '0 a', "first index and value are correct");
	assert.equal(lis[1].innerHTML, '1 b', "second index and value are correct");
	assert.equal(lis[2].innerHTML, '2 c', "third index and value are correct");

	// add a few more items
	list.push('d', 'e');

	assert.equal(lis.length, 5, "five lis");

	assert.equal(lis[3].innerHTML, '3 d', "fourth index and value are correct");
	assert.equal(lis[4].innerHTML, '4 e', "fifth index and value are correct");

	// splice off a few items and add some more
	list.splice(0, 2, 'z', 'y');

	assert.equal(lis.length, 5, "five lis");
	assert.equal(lis[0].innerHTML, '0 z', "first item updated");
	assert.equal(lis[1].innerHTML, '1 y', "second item udpated");
	assert.equal(lis[2].innerHTML, '2 c', "third item the same");
	assert.equal(lis[3].innerHTML, '3 d', "fourth item the same");
	assert.equal(lis[4].innerHTML, '4 e', "fifth item the same");

	// splice off from the middle
	list.splice(2, 2);

	assert.equal(lis.length, 3, "three lis");
	assert.equal(lis[0].innerHTML, '0 z', "first item the same");
	assert.equal(lis[1].innerHTML, '1 y', "second item the same");
	assert.equal(lis[2].innerHTML, '2 e', "fifth item now the 3rd item");
});

QUnit.test('Rendering keys of an object with #each and @key', function(assert) {
	delete can.Mustache._helpers.too;
	var template = can.view.mustache("<ul>{{#each obj}}<li>{{@key}} {{.}}</li>{{/each}}</ul>");
	var obj = {
		foo: 'string',
		bar: 1,
		baz: false
	};

	var lis = template({
		obj: obj
	})
		.childNodes[0].getElementsByTagName('li');

	assert.equal(lis.length, 3, "three lis");

	assert.equal(lis[0].innerHTML, 'foo string', "first key value pair rendered");
	assert.equal(lis[1].innerHTML, 'bar 1', "second key value pair rendered");
	assert.equal(lis[2].innerHTML, 'baz false', "third key value pair rendered");
});

QUnit.test('Live bound iteration of keys of a can.Map with #each and @key', function(assert) {
	delete can.Mustache._helpers.foo;
	var template = can.view.mustache("<ul>{{#each map}}<li>{{@key}} {{.}}</li>{{/each}}</ul>");
	var map = new can.Map({
		foo: 'string',
		bar: 1,
		baz: false
	});

	var lis = template({
		map: map
	})
		.childNodes[0].getElementsByTagName('li');

	assert.equal(lis.length, 3, "three lis");

	assert.equal(lis[0].innerHTML, 'foo string', "first key value pair rendered");
	assert.equal(lis[1].innerHTML, 'bar 1', "second key value pair rendered");
	assert.equal(lis[2].innerHTML, 'baz false', "third key value pair rendered");

	map.attr('qux', true);

	assert.equal(lis.length, 4, "four lis");

	assert.equal(lis[3].innerHTML, 'qux true', "fourth key value pair rendered");

	map.removeAttr('foo');

	assert.equal(lis.length, 3, "three lis");

	assert.equal(lis[0].innerHTML, 'bar 1', "new first key value pair rendered");
	assert.equal(lis[1].innerHTML, 'baz false', "new second key value pair rendered");
	assert.equal(lis[2].innerHTML, 'qux true', "new third key value pair rendered");
});

QUnit.test('Make sure data passed into template does not call helper by mistake', function(assert) {
	var template = can.view.mustache("<h1>{{text}}</h1>");
	var data = {
		text: 'with'
	};

	var h1 = template(data)
		.childNodes[0];

	assert.equal(h1.innerHTML, "with");
});

QUnit.test("no memory leaks with #each (#545)", function(assert) {
	var tmp = can.view.mustache("<ul>{{#each children}}<li></li>{{/each}}</ul>");

	var data = new can.Map({
		children: [{
			name: 'A1'
		}, {
			name: 'A2'
		}, {
			name: 'A3'
		}]
	});
	var div = document.createElement('div')

	can.append(can.$('#qunit-fixture'), div);
	can.append(can.$(div), tmp(data));

	var done = assert.async();
	setTimeout(function () {

		can.remove(can.$(div));

		assert.equal(data._bindings, 0, "there are no bindings")

		done()
	}, 50)

})

QUnit.test("each directly within live html section", function(assert) {

	var tmp = can.view.mustache(
		"<ul>{{#if showing}}" +
		"{{#each items}}<li>item</li>{{/items}}" +
		"{{/if}}</ul>")

	var items = new can.List([1, 2, 3]);
	var showing = can.compute(true);
	var frag = tmp({
		showing: showing,
		items: items
	});

	showing(false);

	// this would break because things had not been unbound
	items.pop();

	showing(true);

	items.push("a")

	assert.equal(frag.childNodes[0].getElementsByTagName("li")
		.length, 3, "there are 3 elements");

});

QUnit.test("mustache loops with 0 (#568)", function(assert) {

	var tmp = can.view.mustache("<ul>{{#array}}<li>{{.}}</li>{{/array}}");

	var data = {
		array: [0, null]
	};

	var frag = tmp(data)

	assert.equal(frag.childNodes[0].getElementsByTagName("li")[0].innerHTML, "0")
	assert.equal(frag.childNodes[0].getElementsByTagName("li")[1].innerHTML, "")

})

QUnit.test('@index is correctly calculated when there are identical elements in the array', function(assert) {
	var data = new can.List(['foo', 'bar', 'baz', 'qux', 'foo']);
	var tmp = can.view.mustache('{{#each data}}{{@index}} {{/each}}');

	var div = document.createElement('div')

	can.append(can.$('#qunit-fixture'), div);
	can.append(can.$(div), tmp({
		data: data
	}));

	assert.equal(div.innerHTML, '0 1 2 3 4 ');
})

QUnit.test("if helper within className (#592)", function(assert) {

	var tmp = can.view.mustache('<div class="fails {{#state}}animate-{{.}}{{/state}}"></div>');
	var data = new can.Map({
		state: "ready"
	})
	var frag = tmp(data);

	assert.equal(frag.childNodes[0].className, "fails animate-ready")

	tmp = can.view.mustache('<div class="fails {{#if state}}animate-{{state}}{{/if}}"></div>');
	data = new can.Map({
		state: "ready"
	})
	tmp(data);

	assert.equal(frag.childNodes[0].className, "fails animate-ready")
})

QUnit.test('html comments must not break mustache scanner', function(assert) {
	can.each([
		'text<!-- comment -->',
		'text<!-- comment-->',
		'text<!--comment -->',
		'text<!--comment-->'
	], function (content) {
		var div = document.createElement('div');

		can.append(can.$('#qunit-fixture'), div);
		can.append(can.$(div), can.view.mustache(content)());
		assert.equal(div.innerHTML, content, 'Content did not change: "' + content + '"');
	});
});

QUnit.test("Rendering live bound indicies with #each, @index and a simple can.List when remove first item (#613)", function(assert) {
	var list = new can.List(['a', 'b', 'c']);
	var template = can.view.mustache("<ul>{{#each list}}<li>{{@index}} {{.}}</li>{{/each}}</ul>");

	var lis = template({
		list: list
	})
		.childNodes[0].getElementsByTagName('li');

	// remove first item
	list.shift();
	assert.equal(lis.length, 2, "two lis");

	assert.equal(lis[0].innerHTML, '0 b', "second item now the 1st item");
	assert.equal(lis[1].innerHTML, '1 c', "third item now the 2nd item");
});

QUnit.test("can.Mustache.safestring works on live binding (#606)", function(assert) {

	var num = can.compute(1)

	can.mustache.registerHelper("safeHelper", function () {

		return can.mustache.safeString(
			"<p>" + num() + "</p>"
		)

	});

	var template = can.view.mustache("<div>{{safeHelper}}</div>")

	var frag = template();
	assert.equal(frag.childNodes[0].childNodes[0].nodeName.toLowerCase(), "p", "got a p element");

});

QUnit.test("directly nested subitems and each (#605)", function(assert) {

	var template = can.view.mustache("<div>" +

		"{{#item}}" +
		"<p>This is the item:</p>" +
		"{{#each subitems}}" +
		"<label>" + "item" + "</label>" +
		"{{/each}}" +
		"{{/item}}" +
		"</div>")

	var data = new can.Map({
		item: {
			subitems: ['first']
		}
	})

	var frag = template(data),
		div = frag.childNodes[0],
		labels = div.getElementsByTagName("label");

	assert.equal(labels.length, 1, "initially one label");

	data.attr('item.subitems')
		.push('second');

	assert.equal(labels.length, 2, "after pushing two label");

	data.removeAttr('item');

	assert.equal(labels.length, 0, "after removing item no label");

});

QUnit.test("directly nested live sections unbind without needing the element to be removed", function(assert) {
	var template = can.view.mustache(
		"<div>" +
		"{{#items}}" +
		"<p>first</p>" +
		"{{#visible}}<label>foo</label>{{/visible}}" +
		"<p>second</p>" +
		"{{/items}}" +
		"</div>");

	var data = new can.Map({
		items: [{
			visible: true
		}]
	});
	var unbindCount = 0;
	function handler(eventType) {
		can.Map.prototype.unbind.apply(this, arguments);
		if (eventType === "visible") {
			assert.ok(true, "unbound visible");
			unbindCount++;
			if(unbindCount >= 1) {
				done();
			}
		}
	}

	data.attr("items.0")
		.unbind = handler;

	template(data);

	data.attr("items", [{
		visible: true
	}]);

	var done = assert.async();
});

QUnit.test("direct live section", function(assert) {
	var template = can.view.mustache("{{#if visible}}<label/>{{/if}}");

	var data = new can.Map({
		visible: true
	})

	var div = document.createElement("div");
	div.appendChild(template(data));

	assert.equal(div.getElementsByTagName("label")
		.length, 1, "there are 1 items")

	data.attr("visible", false)
	assert.equal(div.getElementsByTagName("label")
		.length, 0, "there are 0 items")

});

QUnit.test('Rendering keys of an object with #each and @key in a Component', function(assert) {

	var template = can.view.mustache("<ul>" +
		"{{#each data}}" +
		"<li>{{@key}} : {{.}}</li>" +
		"{{/data}}" +
		"</ul>")

	var map = new can.Map({
		data: {
			some: 'test',
			things: false,
			other: 'things'
		}
	})

	var frag = template(map);

	var lis = frag.childNodes[0].getElementsByTagName("li");
	assert.equal(lis.length, 3, "there are 3 properties of map's data property")

	assert.equal("some : test", lis[0].innerHTML)

});

QUnit.test("{{each}} does not error with undefined list (#602)", function(assert) {
	var renderer = can.view.mustache('<div>{{#each data}}{{name}}{{/each}}</div>');

	assert.equal(renderer.render({}), '<div></div>', 'Empty text rendered');
	assert.equal(renderer.render({
		data: false
	}), '<div></div>', 'Empty text rendered');
	assert.equal(renderer.render({
		data: null
	}), '<div></div>', 'Empty text rendered');
	assert.equal(renderer.render({
		data: [{
			name: 'David'
		}]
	}), '<div>David</div>', 'Expected name rendered');
});

QUnit.test('{{#each}} helper works reliably with nested sections (#604)', function(assert) {
	var renderer = can.view.mustache('{{#if first}}<ul>{{#each list}}<li>{{name}}</li>{{/each}}</ul>' +
		'{{else}}<ul>{{#each list2}}<li>{{name}}</li>{{/each}}</ul>{{/if}}');
	var data = new can.Map({
		first: true,
		list: [{
			name: "Something"
		}, {
			name: "Else"
		}],
		list2: [{
			name: "Foo"
		}, {
			name: "Bar"
		}]
	});
	var div = document.createElement('div'),
		lis = div.getElementsByTagName("li");

	div.appendChild(renderer(data));

	assert.deepEqual(
		can.map(lis, function (li) {
			return li.innerHTML
		}), ["Something", "Else"],
		'Expected HTML with first set');

	data.attr('first', false);

	assert.deepEqual(
		can.map(lis, function (li) {
			return li.innerHTML
		}), ["Foo", "Bar"],
		'Expected HTML with first false set');

});

QUnit.test("Block bodies are properly escaped inside attributes", function(assert) {
	var html = "<div title='{{#test}}{{.}}{{{.}}}{{/test}}'></div>",
		div = document.createElement("div"),
		title = "Alpha&Beta";

	div.appendChild(can.view.mustache(html)(new can.Map({
		test: title
	})));

	assert.equal(div.getElementsByTagName("div")[0].title, title + title);
});

QUnit.test('Constructor static properties are accessible (#634)', function(assert) {
	can.Map.extend("can.Foo", {
		static_prop: "baz"
	}, {
		proto_prop: "thud"
	});
	var template = '\
			Straight access: <br/> \
				<span>{{own_prop}}</span><br/> \
				<span>{{constructor.static_prop}}</span><br/> \
				<span>{{constructor.proto_prop}}</span><br/> \
				<span>{{proto_prop}}</span><br/> \
			Helper argument: <br/> \
				<span>{{print_prop own_prop}}</span><br/> \
				<span>{{print_prop constructor.static_prop}}</span><br/> \
				<span>{{print_prop constructor.proto_prop}}</span><br/> \
				<span>{{print_prop proto_prop}}</span><br/> \
			Helper hash argument: <br/> \
				<span>{{print_hash prop=own_prop}}</span><br/> \
				<span>{{print_hash prop=constructor.static_prop}}</span><br/> \
				<span>{{print_hash prop=constructor.proto_prop}}</span><br/> \
				<span>{{print_hash prop=proto_prop}}</span><br/>',
		renderer = can.view.mustache(template),
		data = new can.Foo({
			own_prop: "quux"
		}),
		div = document.createElement('div');

	div.appendChild(renderer(data, {
		print_prop: function () {
			return can.map(
				can.makeArray(arguments)
				.slice(0, arguments.length - 1), function (arg) {
					while (arg && arg.isComputed) {
						arg = arg();
					}
					return arg;
				}
			)
				.join(" ");
		},
		print_hash: function () {
			var ret = [];
			can.each(
				arguments[arguments.length - 1].hash, function (arg, key) {
					while (arg && arg.isComputed) {
						arg = arg();
					}
					ret.push([key, arg].join("="));
				}
			);
			return ret.join(" ");
		}
	}));
	var spans = div.getElementsByTagName('span'),
		i = 0;

	// Straight access
	assert.equal(spans[i++].innerHTML, 'quux', 'Expected "quux"');
	assert.equal(spans[i++].innerHTML, 'baz', 'Expected "baz"');
	assert.equal(spans[i++].innerHTML, '', 'Expected ""');
	assert.equal(spans[i++].innerHTML, 'thud', 'Expected "thud"');

	// Helper argument
	assert.equal(spans[i++].innerHTML, 'quux', 'Expected "quux"');
	assert.equal(spans[i++].innerHTML, 'baz', 'Expected "baz"');
	assert.equal(spans[i++].innerHTML, '', 'Expected ""');
	assert.equal(spans[i++].innerHTML, 'thud', 'Expected "thud"');

	// Helper hash argument
	assert.equal(spans[i++].innerHTML, 'prop=quux', 'Expected "prop=quux"');
	assert.equal(spans[i++].innerHTML, 'prop=baz', 'Expected "prop=baz"');
	assert.equal(spans[i++].innerHTML, 'prop=', 'Expected "prop="');
	assert.equal(spans[i++].innerHTML, 'prop=thud', 'Expected "prop=thud"');
});

QUnit.test("{{#each}} handles an undefined list changing to a defined list (#629)", function(assert) {
	var renderer = can.view.mustache('    {{description}}: \
<ul> \
{{#each list}} \
    <li>{{name}}</li> \
{{/each}} \
</ul>');

	var div = document.createElement('div'),
		data1 = new can.Map({
			description: 'Each without list'
		}),
		data2 = new can.Map({
			description: 'Each with empty list',
			list: []
		});

	div.appendChild(renderer(data1));
	div.appendChild(renderer(data2));

	assert.equal(div.getElementsByTagName('ul')[0].getElementsByTagName('li')
		.length, 0);
	assert.equal(div.getElementsByTagName('ul')[1].getElementsByTagName('li')
		.length, 0);

	var done = assert.async();
	setTimeout(function () {
		done();
		data1.attr('list', [{
			name: 'first'
		}]);
		data2.attr('list', [{
			name: 'first'
		}]);
		assert.equal(div.getElementsByTagName('ul')[0].getElementsByTagName('li')
			.length, 1);
		assert.equal(div.getElementsByTagName('ul')[1].getElementsByTagName('li')
			.length, 1);
		assert.equal(div.getElementsByTagName('ul')[0].getElementsByTagName('li')[0].innerHTML, 'first');
		assert.equal(div.getElementsByTagName('ul')[1].getElementsByTagName('li')[0].innerHTML, 'first');
	}, 250);
});

QUnit.test('can.compute should live bind when the value is changed to a Construct (#638)', function(assert) {
	var renderer = can.view.mustache('<p>{{#counter}} Clicked <span>{{count}}</span> times {{/counter}}</p>'),
		div = document.createElement('div'),
		// can.compute(null) will pass
		counter = can.compute(),
		data = {
			counter: counter
		};

	div.appendChild(renderer(data));

	assert.equal(div.getElementsByTagName('span')
		.length, 0);
	var done = assert.async();
	setTimeout(function () {
		done();
		counter({
			count: 1
		});
		assert.equal(div.getElementsByTagName('span')
			.length, 1);
		assert.equal(div.getElementsByTagName('span')[0].innerHTML, '1');
	}, 10);
});

QUnit.test("@index in partials loaded from script templates", function(assert) {

	// add template as script

	var script = document.createElement("script");
	script.type = "text/mustache";
	script.id = "itempartial";
	script.text = "<label></label>"

	document.body.appendChild(script)

	//can.view.mustache("itempartial","<label></label>")

	var itemsTemplate = can.view.mustache(
		"<div>" +
		"{{#each items}}" +
		"{{>itempartial}}" +
		"{{/each}}" +
		"</div>")

	var items = new can.List([{}, {}])

	var frag = itemsTemplate({
		items: items
	}),
		div = frag.childNodes[0],
		labels = div.getElementsByTagName("label");

	assert.equal(labels.length, 2, "two labels")

	items.shift();

	assert.equal(labels.length, 1, "first label removed")
})

//!steal-remove-start
if (can.dev) {
	QUnit.test("Logging: Custom tag does not have a registered handler", function(assert) {
		if (window.html5) {
			window.html5.elements += ' my-custom';
			window.html5.shivDocument();
		}
		
		var oldlog = can.dev.warn;
		can.dev.warn = function (text) {
			assert.equal(text, 'can/view/scanner.js: No custom element found for my-custom',
				'Got expected message logged.')
		}

		can.view.mustache('<my-custom></my-custom>')();

		can.dev.warn = oldlog;
	});

	QUnit.test("Logging: Helper not found in mustache template(#726)", function(assert) {
		var oldlog = can.dev.warn,
				message = 'can-mustache.js: Unable to find helper "helpme".';

		can.dev.warn = function (text) {
			assert.equal(text, message, 'Got expected message logged.');
		}

		can.view.mustache('<li>{{helpme name}}</li>')({
			name: 'Hulk Hogan'
		});

		can.dev.warn = oldlog;
	});

	QUnit.test("Logging: Variable not found in mustache template (#720)", function(assert) {
		var oldlog = can.dev.warn,
				message = 'can-mustache.js: Unable to find key "user.name".';

		can.dev.warn = function (text) {
			assert.equal(text, message, 'Got expected message logged.');
		}

		can.view.mustache('<li>{{user.name}}</li>')({
			user: {}
		});

		can.dev.warn = oldlog;
	});

	QUnit.test("Logging: Don't show a warning on helpers (#1257)", 1, function(assert) {
		var oldlog = can.dev.warn;

		can.dev.warn = function (/*text*/) {
			assert.ok(false, 'Log warning not called for helper');
		}

		can.mustache.registerHelper('myHelper', function() {
			return 'Hi!';
		});

		var frag = can.view.mustache('<li>{{myHelper}}</li>')({});
		assert.equal(frag.textContent, 'Hi!');

		can.dev.warn = oldlog;
	});
}
//!steal-remove-end

QUnit.test('Computes returning null values work with #each (#743)', function(assert) {
	var people = new can.List(["Curtis","Stan", "David"]);
	var map = new can.Map({ showPeople: false });
	var list = can.compute(function(){
		if( map.attr("showPeople") ) {
			return people
		} else {
			return null;
		}
	});
	var template = can.view.mustache("<ul>" +
		"{{#each list}}" +
		"<li>{{.}}</li>" +
		"{{/each}}" +
		"</ul>")
	var frag = template({
		list: list
	});
	var ul = frag.childNodes[0];

	assert.equal(ul.innerHTML, '', 'list is empty');
	map.attr('showPeople', true);
	assert.equal(ul.childNodes.length, 3, 'List got updated');
	assert.equal(ul.getElementsByTagName('li')[0].innerHTML, 'Curtis', 'List got updated');
	assert.equal(ul.getElementsByTagName('li')[1].innerHTML, 'Stan', 'List got updated');
	assert.equal(ul.getElementsByTagName('li')[2].innerHTML, 'David', 'List got updated');
});

QUnit.test('each with child objects (#750)', function(assert) {
	var list = new can.List([{
		i: 0
	}, {
		i: 1
	}, {
		i: 2
	}]);

	var template = can.view.mustache('{{#each list}}{{i}}{{/each}}');

	var frag = template({
		list: list
	});

	var div = document.createElement('div');
	div.appendChild(frag);

	assert.equal(div.innerHTML, '012');

	list.pop();
	assert.equal(div.innerHTML, '01');
});

QUnit.test('Mustache helper: if w/ each removing all content', function(assert) {
	var expected = '123content',
	container = new can.Map({
		items: [1,2,3]
	});

	var template = can.view.mustache('{{#if items.length}}{{#each items}}{{this}}{{/each}}content{{/if}}');
	var frag = template(container);

	var div = document.createElement('div');
	div.appendChild(frag);

	assert.equal(div.innerHTML, expected);

	container.attr('items').replace([]);
	assert.equal(div.innerHTML, '');
});

QUnit.test("Inverse ^if should work with an else clause (#751)", function(assert) {
	var tmpl = "{{^if show}}" +
		"<div>Not showing</div>" +
		"{{else}}" +
		"<div>Is showing</div>" +
		"{{/if}}";

	var data = new can.Map({show: false});
	var frag = can.view.mustache(tmpl)(data);

	// Should not be showing at first.
	var node = frag.childNodes[0];
	assert.equal(node.innerHTML, "Not showing", "Inverse resolved to true");

	// Switch show to true and should show {{else}} section
	data.attr("show", true);
	assert.equal(frag.childNodes[0].innerHTML, "Is showing", "Not showing the else");
});

QUnit.test("Expandos (#744)", function(assert) {
	var template =  can.mustache("{{#each items}}<div>{{name}}</div>{{/each}}"+
		"{{#if items.spliced}}<strong>List was spliced</strong>{{/if}}");
	var items = new can.List([
		{ name: 1}
	]);

	var frag = template({
		items: items
	});
	//items.splice(0,2);
	items.attr('spliced', true);
	// 2 because {{#each}} keeps a textnode placeholder
	assert.equal(frag.childNodes[2].nodeName.toLowerCase(),"strong", "worked");
});


QUnit.test("Calling .fn without arguments should forward scope by default (#658)", function(assert) {
	var tmpl = "{{#foo}}<span>{{bar}}</span>{{/foo}}";
	var frag = can.mustache(tmpl)(new can.Map({
		bar : 'baz'
	}), {
		foo : function(opts){
			return opts.fn();
		}
	});
	var node = frag.childNodes[0];

	assert.equal(node.innerHTML, 'baz', 'Context is forwarded correctly');
});

QUnit.test("Calling .fn with falsy value as the context will render correctly (#658)", function(assert) {
	var tmpl = "{{#zero}}<span>{{ . }}</span>{{/zero}}{{#emptyString}}<span>{{ . }}</span>{{/emptyString}}{{#nullVal}}<span>{{ . }}</span>{{/nullVal}}";

	var frag = can.mustache(tmpl)({ foo: 'bar' }, {
		zero : function(opts){
			return opts.fn(0);
		},
		emptyString : function(opts){
			return opts.fn("");
		},
		nullVal : function(opts){
			return opts.fn(null);
		}
	});

	assert.equal(frag.childNodes[0].innerHTML, '0', 'Context is set correctly for falsy values');
	assert.equal(frag.childNodes[1].innerHTML, '', 'Context is set correctly for falsy values');
	assert.equal(frag.childNodes[2].innerHTML, '', 'Context is set correctly for falsy values');
})

QUnit.test("can.Construct derived classes should be considered objects, not functions (#450)", 8, function(assert) {
	
	can.Mustache.registerHelper("cat", function(options) {
		var clazz = options.hash ? options.hash.clazz : options;
		// When using the anonymous function containing foostructor, it will need to be executed
		return clazz.text || clazz().text;
	});

	var foostructor = can.Map({ text: "bar" }, {}),
		obj = {
			next_level: {
				thing: foostructor,
				text: "In the inner context"
			}
		},
		div = document.createElement("div"),
		description;
		
	foostructor.self = foostructor;
	window.other_text = "Window context";

	for (var i = 0; i < 2; i++) {
		if (i === 1) {
			foostructor.self = function() { return foostructor; };
		}

		// // Fully dotted
		div.appendChild(can.view.mustache("<div>{{next_level.thing.self.text}}</div>")(obj));

		// // With attribute nested
		div.appendChild(can.view.mustache("<div>{{#next_level.thing.self}}{{text}}{{/next_level.thing}}</div>")(obj));

		// Passed as an argument to helper
		div.appendChild(can.view.mustache("<div>{{cat next_level.thing.self}}</div>")(obj));

		// Passed as a hash to helper
		div.appendChild(can.view.mustache("<div>{{cat clazz=next_level.thing.self}}</div>")(obj));
	}

	var content = div.getElementsByTagName('div');

	description = " (constructor by itself)";
	
	assert.equal(content[0].innerHTML, "bar", "fully dotted" + description);
	assert.equal(content[1].innerHTML.replace(/<\/?span>/ig,''), "", "with attribute nested" + description);
	assert.equal(content[2].innerHTML, "bar", "passed as an argument to helper" + description);
	assert.equal(content[3].innerHTML, "bar", "passed as a hash to helper" + description);

	description = " (constructor as function returning itself)";
	assert.equal(content[4].innerHTML, "bar", "fully dotted" + description);
	assert.equal(content[5].innerHTML.replace(/<\/?span>/ig,''), "", "with attribute nested" + description);
	assert.equal(content[6].innerHTML, "bar", "passed as an argument to helper" + description);
	assert.equal(content[7].innerHTML, "bar", "passed as a hash to helper" + description);
});

QUnit.test("Partials are passed helpers (#791)", function(assert) {
	var t = {
		template: "{{>partial}}",
		expected: "foo",
		partials: {
			partial: '{{ help }}'
		},
		helpers: {
			'help': function(){
				return 'foo';
			}
		}
	};
	for (var name in t.partials) {
		can.view.registerView(name, t.partials[name], ".mustache")
	}

	assert.deepEqual(new can.Mustache({
			text: t.template
		})
		.render({}, t.helpers), t.expected);
});

QUnit.test("{{else}} with {{#unless}} (#988)", function(assert) {
	var tmpl = "<div>{{#unless noData}}data{{else}}no data{{/unless}}</div>";

	var frag = can.mustache(tmpl)({ noData: true });
	assert.equal(frag.childNodes[0].innerHTML, 'no data', 'else with unless worked');
});

// It seems like non-jQuery libraries do not recognize <col> elements in fragments which is what we
// are feature-detecting here. This works in Stache because it generates the DOM elements instead
// of creating a string from a document fragment.
try {
	if(can.$('<col>').length) {
		QUnit.test("<col> inside <table> renders correctly (#1013)", 1, function(assert) {
			var template = '<table><colgroup>{{#columns}}<col class="{{class}}" />{{/columns}}</colgroup><tbody></tbody></table>';
			var frag = can.mustache(template)({
				columns: new can.List([
					{ 'class': 'test' }
				])
			});

			var child = frag.childNodes[1] || frag.childNodes[0];
			assert.ok(child.innerHTML.indexOf('<colgroup><col class="test"') === 0, '<col> nodes added in proper position');
		});
	}
} catch(e) {
	// DOJO throws an error
}

QUnit.test('getHelper returns null when no helper found', function(assert) {
	assert.ok( !Mustache.getHelper('__dummyHelper') );
});

QUnit.test("getHelper 'options' parameter should be optional", function(assert) {
	Mustache.registerHelper('myHelper', function() {
		return true;
	});

	assert.ok( Mustache.getHelper('myHelper').name === 'myHelper' );
	assert.ok( typeof Mustache.getHelper('myHelper').fn === 'function' );
	assert.ok( Mustache.getHelper('myHelper').fn() );
});

QUnit.test("Passing Partial set in options (#1388 and #1389).", function(assert) {
	var data = new can.Map({
		name: "World",
		greeting: "hello"
	});

	can.view.registerView("hello", "hello {{name}}", ".mustache");

	var template = can.view.mustache("<div>{{>greeting}}</div>")(data);

	var div = document.createElement("div");
	div.appendChild(template);
	assert.equal(div.childNodes[0].innerHTML, "hello World", "partial retreived and rendered");

});


if(Object.keys) {
	QUnit.test('Mustache memory leak (#1393)', function(assert) {
		for(var prop in can.view.nodeLists.nodeMap) {
			delete can.view.nodeLists.nodeMap[prop];
		}

		var studentsTemplate = can.mustache(
			'<div>{{#each students}}abc{{/each}}</div>'
		);
		var students = new can.List(['first', 'second']);
		var frag = studentsTemplate({
			students: students
		});

		can.append(can.$('#qunit-fixture'), frag);

		assert.equal(Object.keys(can.view.nodeLists.nodeMap).length, 3, 'Three items added');
		can.remove(can.$('#qunit-fixture > *'));
		assert.equal(Object.keys(can.view.nodeLists.nodeMap).length, 0, 'All nodes have been removed from nodeMap');
	});
}

QUnit.test('registerSimpleHelper', 3, function(assert) {
	can.Mustache.registerSimpleHelper('simple', function(first, second) {
		assert.equal(first, 2);
		assert.equal(second, 4);
		return first + second;
	});

	var template = can.view.mustache('<div>Result: {{simple first second}}</div>');
	var frag = template(new can.Map({
		first: 2,
		second: 4
	}));
	assert.equal(frag.childNodes[0].innerHTML, 'Result: 6');
});

QUnit.test('Helper handles list replacement (#1652)', 3, function(assert) {

	var state = new can.Map({
		list: []
	});

	var helpers = {
		listHasLength: function (options) {
			assert.ok(true, 'listHasLength helper evaluated');
			return this.attr('list').attr('length') ?
				options.fn() :
				options.inverse();
		}
	};

	// Helper evaluated 1st time...
	can.mustache('{{#listHasLength}}{{/listHasLength}}')(state, helpers);

	// Helper evaluated 2nd time...
	state.attr('list', []);
	
	// Helper evaluated 3rd time...
	state.attr('list').push('...')

});

QUnit.test('Helper binds to nested properties (#1651)', function(assert) {

	var nestedAttrsCount = 0,
		state = new can.Map({
			parent: null
		});

	var helpers = {
		bindViaNestedAttrs: function (options) {

			nestedAttrsCount++;

			if (nestedAttrsCount === 3) {
				assert.ok(true, 'bindViaNestedAttrs helper evaluated 3 times');
			}

			return this.attr('parent') && this.attr('parent').attr('child') ?
				options.fn() :
				options.inverse();
		}
	};

	// Helpers evaluated 1st time...
	can.mustache('{{#bindViaNestedAttrs}}{{/bindViaNestedAttrs}}')(state, helpers);

	// Helpers evaluated 2nd time...
	state.attr('parent', {
		child: 'foo'
	});

	// Helpers evaluated 3rd time...
	state.attr('parent.child', 'bar');
});

QUnit.test('registerSimpleHelper', 3, function(assert) {
	can.Mustache.registerSimpleHelper('simple', function(first, second) {
		assert.equal(first, 2);
		assert.equal(second, 4);
		return first + second;
	});

	var template = can.view.mustache('<div>Result: {{simple first second}}</div>');
	var frag = template(new can.Map({
		first: 2,
		second: 4
	}));
	assert.equal(frag.childNodes[0].innerHTML, 'Result: 6');
});

QUnit.test('registerSimpleHelper', 3, function(assert) {
	can.Mustache.registerSimpleHelper('simple', function(first, second) {
		assert.equal(first, 2);
		assert.equal(second, 4);
		return first + second;
	});

	var template = can.view.mustache('<div>Result: {{simple first second}}</div>');
	var frag = template(new can.Map({
		first: 2,
		second: 4
	}));
	assert.equal(frag.childNodes[0].innerHTML, 'Result: 6');
});

module.exports = QUnit;
