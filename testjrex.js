var jRex = require('./jrex.min.js');
var assert = require('assert');
var _ = require('lodash');

suite('jRex',function() {
	suite('builder', function() {
		function myTest(expectedRegex, tree,text) {
			test(text, function() {
				var result = jRex(tree).regex();
				assert.deepEqual(expectedRegex,result);
			});
		}
		myTest(/./g, /./g,'untreated regex'); 
		myTest(/./g, jRex(/./g),'untreated sub jRex'); 
		myTest(/./, {regex:/./g},'regex stripped of flags');
		myTest(/./gi, {regex:'.',flags:'gi'},'flags');
		myTest(/./gi, {regex:'.',flags:'ig'},'sorting of flags'); 
		myTest(/.*/, {sub:/./,min:0},'infinite loop');
		myTest(/.{3}/, {sub:/./,exact:3},'exact loop count');
		myTest(/.{3}/, {sub:/./,min:3, max:3},'exact loop count using min and max');
		myTest(/.{0,3}/, {sub:/./,max:3},'maximum loop only');
		myTest(/.{3,}/, {sub:/./,min:3},'minimum loop only');
		myTest(/.?/, {sub:/./,max:1},'optional');
		myTest(/.??/, {sub:/./,max:1,lazy:true},'optional lazy');
		myTest(/.*?/, {sub:/./,lazy:true},'infinite loop lazy');
		myTest(/.*/, {regex:/./,min:0},'short way for looping');
		myTest(/(?:ab)*/, {sub:/ab/,min:0},'enclosing');
		myTest(/(abc)*/, {sub:/(abc)/,min:0},'no enclosing around brackets');
		myTest(/(?:(ab)(c))*/, {sub:/(ab)(c)/, min:0},'no enclosing around brackets except in multiple parts');
		myTest(/\./, '.','escaping text');
		myTest(/\./, {text:'.'},'explicit escaping text');
		myTest(/(?=.)/,{sub:/./, ahead:true},'ahead');
		myTest(/(?!.)/,{sub:/./, ahead:'not'},'not ahead');
		myTest(/(.)/,{sub:/./, store: true},'capture');
		myTest(/abcdef/,['abc','def'],'concat');
		myTest(/abcdef/i,{sub:['abc','def'],flags:'i'},'concat through sub');
		myTest(/(?:a|b)def/,[/a|b/,'def'],'concat with enclosing paratheses when pipe is there');
		myTest(/(?:abc)|(?:def)/i,{or:['abc','def'],flags:'i'},'or');
		myTest(/(?:(?:ab)|c)|(?:def)/i,{or:[{or:['ab','c']},'def'],flags:'i'},'or');
		myTest(/./, {any:true},'any true');
		myTest(/./, {any:1},'any one');
		myTest(/[a-z]/, {in:'a-z'},'in');
		myTest(/[^a-z]/, {out:'a-z'},'out');
		myTest(/.{2}/, {any:2},'any twice');
		myTest(/(?:.{2}){3}/, {any:2, exact:3},'any twice three times');
		myTest(/^./, {any:1,close:'start'},'begin');
		myTest(/.$/, {any:1,close:'end'},'end');
		myTest(/^.$/, {any:1,close:true},'begin and end');
		myTest(/(?:abc)|(?:def)/i,{or:[jRex('abc'),jRex('def')],flags:'i'},'or');
	});

	test('#eval',function() {
	    assert.deepEqual([],jRex(/a(.*)e/).eval(''), 'zero results');
	    assert.deepEqual('[{"index":0,"texts":["abcde","bcd"]}]',JSON.stringify(jRex(/a(.*)e/).eval('abcde')),'one result');
	    assert.deepEqual('[{"index":0,"texts":["abcde","bcd"]},{"index":5,"texts":["ae",""]}]',JSON.stringify(jRex(/a(.*?)e/).eval('abcdeae')), 'two results');
	});

	test('#eval:startPos',function() {
	    assert.deepEqual(2,jRex(/a/).eval('aa',0).length);
	    assert.deepEqual(1,jRex(/a/).eval('aa',1).length);
	    assert.deepEqual(0,jRex(/a/).eval('aa',2).length);
	});
	
	test('#filter',function() {
	    assert.deepEqual('[{"index":0,"texts":["abcde"]},{"index":10,"texts":["abce"]}]',
	        JSON.stringify(jRex(/a.*?e/).filter(function(r) { return r.text().length > 3; }).eval('abcdeaeabeabce')));
	});
	
	test('#map',function() {
	    assert.deepEqual([5,2,3,4],
	        jRex(/a.*?e/).map(function(r) { return r.text().length; }).eval('abcdeaeabeabce'));
	});

	test('#reduce(val)',function() {
	    assert.deepEqual(14,
	        jRex(/a.*?e/).map(function(r) { return r.text().length; }).reduce(function(sum,val) { return sum+val; },0).eval('abcdeaeabeabce'));
	    assert.deepEqual(14,
	        jRex(/a.*?e/).map(function(r) { return r.text().length; }).reduce(function(sum,val) { return sum+val; }).eval('abcdeaeabeabce'));
	});
	test('#reduce(array)',function() {
		var f=jRex(/a.*?e/).map(function(r) { return r.text().length; }).reduce(function(sum,val) { sum.push(val);return sum; },[]);
	     _.times(2,function() { assert.deepEqual([5,2,3,4],f.eval('abcdeaeabeabce'))});
	});
	test('#reduce(factory)',function() {
		var f=jRex(/a.*?e/).map(function(r) { return r.text().length; }).reduce(function(sum,val) { sum.v+=val; return sum; },function() { return {v:0}; } );
	     _.times(2,function() { assert.deepEqual({v:14},f.eval('abcdeaeabeabce'))});
	});
	
	test('#last',function() {
	    assert.deepEqual('{"index":10,"texts":["abce"]}',
	        JSON.stringify(jRex(/a.*?e/).last().eval('abcdeaeabeabce')));
	});

	test('#test',function() {
	    assert.equal(true,
	        jRex(/b/).test('abc'));
	    assert.equal(false,
	        jRex(/d/).test('abc'));
	});	

	test('#test:startPos',function() {
	    assert.equal(false,
	        jRex(/b/).test('abc',2));
	    assert.equal(true,
	        jRex(/c/).test('abc',2));
	});	

	test('#replace',function() {
	    assert.deepEqual('"aBcdBf"',
	        JSON.stringify(jRex(/b/).map(function (r) { return "B"; }).replace('abcdbf')));
	});	

	test('#replace.first',function() {
	    assert.deepEqual('"aBcdbf"',
	        JSON.stringify(jRex(/b/).map(function (r) { return "B"; }).first().replace('abcdbf')));
	});	
	
	test('#replace.last',function() {
	    assert.deepEqual('"abcdBf"',
	        JSON.stringify(jRex(/b/).map(function (r) { return "B"; }).last().replace('abcdbf')));
	});	

	test('#format',function() {
	    assert.deepEqual('["XcYaZ","XcYaZ"]',
	        JSON.stringify(jRex(/(.).(.)/).format("X$2Y$1Z").eval('abcabc')));
	    assert.deepEqual(["$1$$1$babc"],
	        jRex(/a(b)c/).format("$$1$$$$1$$$1$&").eval('abc'));
	});

	
	test('#first',function() {
	    assert.deepEqual('{"index":0,"texts":["abcde"]}',
	        JSON.stringify(jRex(/a.*?e/).first().eval('abcdeaeabeabce')));
	});
	
	test('#captures',function() {
	    assert.deepEqual('[["bcd"],[""],["b"],["bc"]]',
	        JSON.stringify(jRex(/a(.*?)e/).captures().eval('abcdeaeabeabce')));
	});
	
	test('#map(text)',function() {
	    assert.deepEqual('"abcde"',
	        JSON.stringify(jRex(/a(.*?)e/).map(function(r) { return r.text();}).first().eval('abcdeaeabeabce')));
	});
	
	test('#map(text(1))',function() {
	    assert.deepEqual('"bcd"',
	        JSON.stringify(jRex(/a(.*?)e/).map(function(r) { return r.text(1);}).first().eval('abcdeaeabeabce')));
	});
	
	test('#map(between)',function() {
	    assert.deepEqual(["a","","b","cde","","f"],
	        jRex(/!/).map(function(r) { return r.between();}).eval('a!!b!cde!!f!'));
	});
	
	test('#index',function() {
	    assert.deepEqual('[0,5,7,10]',
	        JSON.stringify(jRex(/a(.*?)e/).index().eval('abcdeaeabeabce')));
	});

	test('#text()',function() {
	    assert.deepEqual(['abcde','ae','abe','abce'],
	        jRex(/a(.*?)e/).text().eval('abcdeaeabeabce'));
	});

	test('#text(1)',function() {
	    assert.deepEqual(['bcd','','b','bc'],
	        jRex(/a(.*?)e/).text(1).eval('abcdeaeabeabce'));
	});

	test('#while',function() {
	    assert.deepEqual([0,1],
	        jRex(/./).while(function(r) { return r.text()=='a';}).index().eval('aaba'));
	});

	test('#henceforth',function() {
		var f=jRex(/./).henceforth(function(r) { return r.text()=='b';}).index();
	     _.times(2,function() { assert.deepEqual([2,3],f.eval('aaba'))});
	});

	test('#collect',function() {
	    assert.deepEqual([],
	        jRex(/./).collect(0).index().eval('aabab'));
		var f=jRex(/./).collect(3).index();
	    _.times(2,function() { assert.deepEqual([0,1,2],f.eval('aabab'))});
	});

	test('#skip',function() {
	    assert.deepEqual([0,1,2,3,4],
	        jRex(/./).skip(0).index().eval('aabab'));
	    assert.deepEqual([3,4],
	        jRex(/./).skip(3).index().eval('aabab'));
	});

	test('#split',function() {
		assert.deepEqual(['a','c'],jRex(/b/).split('abc'));			
		assert.deepEqual(['a','cbe'],jRex(/b/).first().split('abcbe'));			
		assert.deepEqual(['a','cbe'],jRex(/b/).collect(1).split('abcbe'));			
		assert.deepEqual(['abc','e',''],jRex(/b/).skip(1).split('abcbeb'));			
	});
	
	test('#flags',function() {
        assert.equal('', jRex(/./).flags());
        assert.equal('im', jRex(/./mi).flags());
	});

	test('#regex',function() {
        assert.deepEqual('/.?/', jRex(/.?/).regex()+'');
        assert.deepEqual('/.*/im', jRex(/.*/mi).regex()+'');
	});

	test('#toJSON',function() {
        assert.deepEqual({"regex":".*","flags":"im"}, jRex(/.*/mi).toJSON());
	});

	test('#map.map.skip.filter.map',function() {
	    assert.deepEqual(['m2','m3'],
	        jRex(/a.*?e/)
	            .map(function(r) { return r.text().length; })
	            .skip(1)
				.filter(function(r) { return r<4; })
	            .map(function(r) { return 'm'+r; })
	            .eval('abcdeaeabeabce')
		);
	});
	
	test('#map.filter.first.map',function() {
	    assert.deepEqual('"m4"',
	        JSON.stringify(jRex(/a.*?e/)
	            .map(function(r) { return r.text().length; })
	            .filter(function(r) { return r > 3; })
	            .last()
	            .map(function(r) { return 'm'+r; })
	            .eval('abcdeaeabeabce')
	        )
		);
	});
	test('#readme example', function() {
		assert.deepEqual('pla<y>ing m<y> <x>ylophone',jRex(/([xyz])/).filter(function(r) { return r.index() % 2 == 1; }).format('<$1>').replace('playing my xylophone'));
	});
});
