//RegExp.prototype.toJSON = RegExp.prototype.toString;
(function() {

var tests = {};

function _genAssertMessage(txt,level) {
	console.log("Assert: "+txt+(new Error).stack.split("\n").slice(level||3).join("\n"));
}

exports.Test = {
	assert: function(expr,level) {
		if (!expr) {
			//throw("assert");
			_genAssertMessage('',level);
		}
	},
	assert_equal: function(v1,v2,level) {
		v1=JSON.stringify(v1);
		v2=JSON.stringify(v2);
		if (v1!=v2)
			_genAssertMessage(''+(v1)+" != "+(v2),level);
	},
	assert_refEqual: function(v1,v2,level) {
		if (v1!==v2)
			_genAssertMessage('references not equal',level);
	},
	assert_shallowEqual: function(v1,v2,level) {
		if (v1.length!=v2.length)
			_genAssertMessage('different length in shallowEqual',level);
		else {
			for(var i=0; i<v1.length;i++) {
				if (v1[i]!==v2[i]) {
					_genAssertMessage('At least one element different in shallowEqual',level);
				}
			}
		}
	},
	assert_reciprocal: function(func, arg,func2) {
		assert_equal(func2(func(arg)),arg,4);
	},	
	assert_reciprocalObject: function(constructor, arg,func) {
		assert_equal(func.call(new constructor(arg)),arg,4);
	},
	add: function(name, func) {
		if (tests[name]!=null)
			throw "Test with name '"+name+"' already exists";
		tests[name] = func;
	},
	run: function() {
		for(var prop in tests) {
			if (tests.hasOwnProperty(prop)) {
				console.log("Executing: "+prop);
				tests[prop].call();
			}
		}
		tests = {};
	}
};

})();
