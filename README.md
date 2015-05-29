# jrex
Modern Javascript library for composable, iterable, lazy, and immutable regular expressions

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

API definition
==============
Patterns
--------
- jRex(element, flags?).chainFunction1(...).chainFunctionN(...).endFunction(...)
- jRex(...).getterFunction()

Element
-------
Any element, including the root element being the first argument of jRex, is either a:

- hash map of the form: {<primary field>: ..., <secondary field1>: ..., ....}
- a string being treated as text. Therefore it is escaped within the regular expression.
- an array of sub elements. The sub elements must sequentially match the input string.

Primary fields are:

- or: an array of elements where any of the elements matches the input string.
- text: any element is treated/converted to text, and handled as defined previously. 
- regex: any element being either a regular expression, treated as such but stripped of its flags, or converted to text and parsed as a regular expression, without the slashes and the flags.
- sub: any sub element 
- any: any character
- in: match any from a collection or ranges of characters, as defined by RegExp's [...] notation, where the brackets are omitted.
- out: match everything except any from a collection or ranges of charactes, as define by RegExp's [^...], where the brackets and '~' are omitted.

Secondary fieds are:

- store: values: true. This will store the element, like /(...)/.
- close: values: start|end|both. This will close the element, like /^...$/.
- ahead: values: true|'not'. This will wrap the element like /(?=...)/ or not: /(?!...)/.
- min: values: any number. This will enable repeat and define the minimal amount of repeats.
- max: values: any number. This will enable repeat and define the maximum amount of repeats.
- exact: values: any number. Equivalent to \{...min: value, max: value...\}
- lazy: values: true. This will result in lazy parsing, like /.??/ or /.*?/.

Chain functions
---------------
When using these functions, it will always use the regular expression in 'global' mode.
As long as no mapping functions is applied, the supplied result argument is an object with the following functions:
	after(): string
		returns the complete text after the match.
	between(): string
		returns the texts between this match and the previous match or beginning.
	before(): string
		returns the complete text before the match.
	endIndex(): number
		returns the character position after the match.
	index(): number
		return the character position of the start of the match.
	input(): string
		returns the complete text.
	text(key?: number): string
		returns the captured text. If the number is 0 or falsy, it returns the whole matched text.
	setNextSearch(pos: number): void
		sets the character position of the next search.
	captures(): number[] {
		returns the information about the captures, excluding the information about the whole matched text.

- map( func: (result)=>any ): it transforms the result as specified by the function.
- captures(): it transforms the result to the information as specified by the result function 'captures'.
- texts(key?: number): it transforms the result to the text as specified by the result function 'text'.
- indices(): : it transforms the result to the text as specified by the result function 'text'.
- filter(func: (result)=>boolean): it filters outs all results for which the function evaluates to a falsy value.
- while(func: (result)=>boolean): it includes results until the fuction evaluates to a falsy value.
- henceforth(func: (result)=>boolean): it excludes results until the fuction evaluates to a truthy value.
- skip(number): it excludes the first 'number' results.
- first(), last(): it will return either the first or last result.
- format(fmt: string): a string with special meaning for $&, $1...$nn, or $$. (See javascript replace function).

End functions
-------------
- eval(text, startPos?): evaluates the result.
- test(text, startPos?): return whether	if there is at least one result.
- replace(text, startPos?): replaces the matches with strings.
- split(text, startPos?): splits the function on matches that have not been filtered out.

Getter functions
-----------------
flags(): returns the flags in one string.
regex(): returns the regular expression.
toJSON(): returns a json representation that can be fed back to jRex.