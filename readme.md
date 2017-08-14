# can-mustache

[![Greenkeeper badge](https://badges.greenkeeper.io/canjs/can-mustache.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/canjs/can-mustache.png?branch=master)](https://travis-ci.org/canjs/can-mustache)

Legacy Mustache view layer for CanJS. While this code has been heavily tested and is considered stable, it is no longer supported or maintained. CanJS now ships with Stache which is much more feature rich and much faster - you should use it instead!

## Usage

### ES6 use

With StealJS, you can import this module directly in a template that is autorendered:

```js
import plugin from 'can-mustache';
```

### CommonJS use

Use `require` to load `can-mustache` and everything else
needed to create a template that uses `can-mustache`:

```js
var plugin = require("can-mustache");
```

## AMD use

Configure the `can` and `jquery` paths and the `can-mustache` package:

```html
<script src="require.js"></script>
<script>
	require.config({
	    paths: {
	        "jquery": "node_modules/jquery/dist/jquery",
	        "can": "node_modules/canjs/dist/amd/can"
	    },
	    packages: [{
		    	name: 'can-mustache',
		    	location: 'node_modules/can-mustache/dist/amd',
		    	main: 'lib/can-mustache'
	    }]
	});
	require(["main-amd"], function(){});
</script>
```

### Standalone use

Load the `global` version of the plugin:

```html
<script src='./node_modules/can-mustache/dist/global/can-mustache.js'></script>
```

## Contributing

### Making a Build

To make a build of the distributables into `dist/` in the cloned repository run

```
npm install
node build
```

### Running the tests

Tests can run in the browser by opening a webserver and visiting the `test.html` page.
Automated tests that run the tests from the command line in Firefox can be run with

```
npm test
```
