RegExp.prototype.toJSON = RegExp.prototype.toString;

function _genAssertMessage(txt,level) {
	console.log("Assert: "+txt+(new Error).stack.split("\n").slice(level||3).join("\n"));
}
function assert(expr,level) {
	if (!expr) {
		//throw("assert");
		_genAssertMessage('',level);
	}
}

function assert_equal(v1,v2,level) {
	v1=JSON.stringify(v1);
	v2=JSON.stringify(v2);
	if (v1!=v2)
		_genAssertMessage(''+(v1)+" != "+(v2),level);
}

function assert_refEqual(v1,v2,level) {
	if (v1!==v2)
		_genAssertMessage('references not equal',level);
}

function assert_shallowEqual(v1,v2,level) {
	if (v1.length!=v2.length)
		_genAssertMessage('different length in shallowEqual',level);
	else {
		for(var i=0; i<v1.length;i++) {
			if (v1[i]!==v2[i]) {
				_genAssertMessage('At least one element different in shallowEqual',level);
			}
		}
	}
}

function assert_reciprocal(func, arg,func2) {
	assert_equal(func2(func(arg)),arg,4);
}

function assert_reciprocalObject(constructor, arg,func) {
	assert_equal(func.call(new constructor(arg)),arg,4);
}

Test = {
	tests: {},
	add: function(name, func) {
		if (Test.tests[name]!=null)
			throw "Test with name '"+name+"' already exists";
		Test.tests[name] = func;
	},
	run: function() {
		for(var prop in Test.tests) {
			if (Test.tests.hasOwnProperty(prop)) {
				console.log("Executing: "+prop);
				Test.tests[prop].call();
			}
		}
	}
};
