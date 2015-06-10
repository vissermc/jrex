# jRex
A modern Javascript library for composable, iterable, lazy, and immutable regular expressions.

Example 1: lazy iteration and method chaining:

     jRex(/\w+/)
            .filter( function(r) { return r.text().length < 6; } )
            .last()
            .map( function(r) { return 'last small word: ' + r; } )
            .eval( 'search the last word smaller than six characters' )

evaluates to:
    
    'last small word: six'

Example 2: Composing regex:

    jRex({or:['abc','def'],flags:'i'}).regex()
    
evaluates to:

    /(?:abc)|(?:def)/i

Example 3: text replace:

    jRex(/([xyz])/)
        .filter( function(r) { return r.index() % 2 == 0; })
        .format('<$1>').replace('playing my xylophone')
    
evaluates to:

    pla<y>ing m<y> <x>ylophone

Installation
============

    npm install jrex

Usage
=====

    var jRex = require('jrex');
    jRex(...)...;
    
API definition
==============
Patterns
--------
- jRex(element, flags?).chainFunction1(...).chainFunctionN(...).endFunction(...)
- jRex(...).getterFunction()

Element
-------
Any element, including the root element being the first argument of jRex, is either a:

- hash map of the form: {\<primary field>: ..., \<secondary field1>: ..., ...., \<secondary fieldN>: ...}
- a string being treated as text. Therefore it is escaped within the regular expression.
- an array of sub elements. The sub elements must sequentially match the input string.

Primary fields are:

- *or*: An array of elements where any of the elements matches the input string.
- *text*: Any element is treated/converted to text, and handled as defined previously. 
- *regex*: Any element being either a regular expression, treated as such but stripped of its flags, or converted to text and parsed as a regular expression, without the slashes and the flags.
- *sub*: Any sub element. 
- *any*: Any character.
- *in*: Match any from a collection or ranges of characters, as defined by RegExp's [...] notation, where the brackets are omitted.
- *out*: Match everything except any from a collection or ranges of charactes, as defined by RegExp's [^...], where the brackets and '^' are omitted.

Secondary fieds are:

- *store*: values: true. This will store the element, like /(...)/.
- *close*: values: start|end|both. This will close the element, like /^...$/.
- *ahead*: values: true|'not'. This will wrap the element like /(?=...)/ or not: /(?!...)/.
- *min*: values: any number. This will enable repeat and define the minimal amount of repeats.
- *max*: values: any number. This will enable repeat and define the maximum amount of repeats.
- *exact*: values: any number. Equivalent to \{...min: value, max: value...\}
- *lazy*: values: true. This will result in lazy parsing, like /.??/ or /.*?/.

Chain functions
---------------
These chain/cascading methods transform and filter the results:

	map( func: (result)=>any ): 
	 	It transforms the result as specified by the function.
	captures(): 
		Equivalent to map((r)=>r.captures()).
	text(key?: number): 
		Equivalent to map((r)=>r.text(key)).
	index(): 
		Equivalent to map((r)=>r.index()).
	filter(func: (result)=>boolean): 
		It filters outs all results for which the function evaluates to a falsy value.
	while(func: (result)=>boolean): 
		It includes results until the fuction evaluates to a falsy value.
	henceforth(func: (result)=>boolean): 
		It excludes results until the fuction evaluates to a truthy value.
	reduce(func: (accu, value)=>accu, accuValue/accuFactoryFunc?):
		Reduces by reiterating accu=func(accu,value). If initial value or factory function is not supplied,
		it will use the first value as accumulator.
	collect(number):
		It takes the first 'number' results and stops.
	skip(number): 
		It excludes the first 'number' results.
	first(), last(): 
		It will return either the first or last result.
	format(fmt: string): 
		A string with special meaning for $&, $1...$nn, or $$. (See javascript replace function).

When using these functions, it will always use the regular expression in 'global' mode.

### Result

As long as no mapping functions is applied, the supplied result argument is an object with the following functions:

	after(): string
		Returns the complete text after the match.
	between(): string
		Returns the texts between this match and the previous match or beginning.
	before(): string
		Returns the complete text before the match.
	endIndex(): number
		Returns the character position after the match.
	index(): number
		Return the character position of the start of the match.
	input(): string
		Returns the complete text.
	text(key?: number): string
		Returns the captured text. If the number is 0 or falsy, it returns the whole matched text.
	captures(): number[] {
		Returns the information about the captures, excluding the information about the whole matched text.
	setNextSearch(pos: number): void
		Sets the character position of the next search.

End functions
-------------
These functions will initiate the execution:

	eval(text, startPos?): any
		evaluates the result.
	test(text, startPos?): boolean 
		returns whether there is at least one result.
	replace(text, startPos?): string
		replaces the matches with strings.
	split(text, startPos?): string[]
		splits the function on matches that have not been filtered out.

Getter functions
-----------------
These functions return information about the regular expression:

	flags(): string
		returns the flags in one string.
	regex(): RegExp 
		returns the regular expression.
	toJSON(): any
		returns a json representation that can be fed back to jRex.
