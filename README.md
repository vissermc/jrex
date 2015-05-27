# jrex
Modern Javascript library for composable, iterable, lazy, and immutable regular expressions

Example 1: iteration and chaining:

     jRex(/\w+/)
            .filter(function(r) { return r.text().length < 6; })
            .last()
            .map(function(r) { return 'last small word: ' + r; })
            .eval('search the last word smaller than six characters')

evaluates to:
    
    'last small word: six'

Example 2: Composing regex:

    jRex({or:['abc','def'],flags:'i'}).regex()
    
evaluates to:

    /(?:abc)|(?:def)/i

Example 3: text replace:

    jRex(/([xyz])/).filter(function(r) { return r.index() % 2 == 0; }).format('<\1>').replace('playing my xylophone')
    
evaluates to:

TODO

API definition:

jRex(element, [flags]).chainFunction1(...).chainFunction2(...)...endFunction(...)

element: Any element, including the root element being the first argument of jRex, is either a:

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

- store
- close
- ahead
- lazy 
