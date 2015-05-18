# jrex
Modern Javascript library for composable, iterable, lazy, and immutable regular expressions

Examples:

     jrex(/A.*E>/)
            .map(function(r) { return r.text().length; })
            .filter(function(r) { return r > 3; })
            .last()
            .map(function(r) { return 'm'+r; })
            .eval('AbcdEAEAbEAbcE')

    jrex({or:[{sub:/./,max:1,lazy:true}','orld'],flags:'i'})
