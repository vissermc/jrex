Test.add('trex',function() {
	function test(expectedRegex, tree,text) {
		assert_equal(expectedRegex,window.Trex(tree).regex(),text);
	}
	test(/./g, /./g,'untreated regex'); 
	test(/./, {regex:/./g},'regex stripped of flags');
	test(/./gi, {regex:'.',flags:'gi'},'flags');
	test(/./gi, {regex:'.',flags:'ig'},'sorting of flags'); 
	test(/.*/, {sub:/./,min:0},'infinite loop');
	test(/.{3}/, {sub:/./,exact:3},'exact loop count');
	test(/.{3}/, {sub:/./,min:3, max:3},'exact loop count using min and max');
	test(/.{0,3}/, {sub:/./,max:3},'maximum loop only');
	test(/.{3,}/, {sub:/./,min:3},'minimum loop only');
	test(/.?/, {sub:/./,max:1},'optional');
	test(/.??/, {sub:/./,max:1,lazy:true},'optional lazy');
	test(/.*?/, {sub:/./,lazy:true},'infinite loop lazy');
	test(/.*/, {regex:/./,min:0},'short way for looping');
	test(/(?:ab)*/, {sub:/ab/,min:0},'enclosing');
	test(/(abc)*/, {sub:/(abc)/,min:0},'no enclosing around brackets');
	test(/(?:(ab)(c))*/, {sub:/(ab)(c)/, min:0},'no enclosing around brackets except in multiple parts');
	test(/\./, '.','escaping text');
	test(/\./, {text:'.'},'explicit escaping text');
	test(/(?=.)/,{sub:/./, ahead:true},'ahead');
	test(/(?!.)/,{sub:/./, ahead:'not'},'not ahead');
	test(/(.)/,{sub:/./, store: true},'capture');
	test(/abcdef/,['abc','def'],'concat');
	test(/abcdef/i,{sub:['abc','def'],flags:'i'},'concat through sub');
	test(/(?:a|b)def/,[/a|b/,'def'],'concat with enclosing paratheses when pipe is there');
	test(/(?:abc)|(?:def)/i,{or:['abc','def'],flags:'i'},'or');
	test(/(?:abc)|(?:def)/i,{or:['abc','def'],flags:'i'},'or');
	test(/./, {any:true},'any true');
	test(/./, {any:1},'any one');
	test(/[a-z]/, {in:'a-z'},'in');
	test(/[^a-z]/, {out:'a-z'},'out');
	test(/.{2}/, {any:2},'any twice');
	test(/(?:.{2}){3}/, {any:2, exact:3},'any twice three times');
	test(/^./, {any:1,close:'start'},'begin');
	test(/.$/, {any:1,close:'end'},'end');
	test(/^.$/, {any:1,close:true},'begin and end');
});

Test.add('trex.eval',function() {
    assert_equal([],window.Trex(/a(.*)e/).eval(''), 'zero results');
    assert_equal('[{"index":0,"texts":["abcde","bcd"]}]',JSON.stringify(window.Trex(/a(.*)e/).eval('abcde')),'one result');
    assert_equal('[{"index":0,"texts":["abcde","bcd"]},{"index":5,"texts":["ae",""]}]',JSON.stringify(window.Trex(/a(.*?)e/).eval('abcdeae')), 'two results');
});

Test.add('trex.filter',function() {
    assert_equal('[{"index":0,"texts":["abcde"]},{"index":10,"texts":["abce"]}]',
        JSON.stringify(window.Trex(/a.*?e/).filter(function(r) { return r.text().length > 3; }).eval('abcdeaeabeabce')));
});

Test.add('trex.map',function() {
    assert_equal('[5,2,3,4]',
        JSON.stringify(window.Trex(/a.*?e/).map(function(r) { return r.text().length; }).eval('abcdeaeabeabce')));
});

Test.add('trex.last',function() {
    assert_equal('{"index":10,"texts":["abce"]}',
        JSON.stringify(window.Trex(/a.*?e/).last().eval('abcdeaeabeabce')));
});


Test.add('trex.first',function() {
    assert_equal('{"index":0,"texts":["abcde"]}',
        JSON.stringify(window.Trex(/a.*?e/).first().eval('abcdeaeabeabce')));
});


Test.add('trex.map.filter.first.map',function() {
    assert_equal('"m4"',
        JSON.stringify(window.Trex(/a.*?e/)
            .map(function(r) { return r.text().length; })
            .filter(function(r) { return r > 3; })
            .last()
            .map(function(r) { return 'm'+r; })
            .eval('abcdeaeabeabce')
        )
	);
});