var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*
    Composable, iterable, lazy, Immutable

TODO:
    each, while
    filter op results moet results aanpassen
NEW:
always use global!
regexp functions:
    chain funcs
        map
        captures: it returns the captures
        search: It returns the index of the match, or -1 if the search fails
        filter
        first, last
        format
    end functions
        eval(text, startPos)
        test(text, startPos)	if there is at least one hit (give error on using map/captures/first/last/search,format).
        replace(text, startPos)	A String method that executes a search for a match in a string, and replaces the matched substring with a replacement substring.
        split(text, startPos)	give error on map/captures/search/format
        NOT: exec	A RegExp method that executes a search for a match in a string. It returns an array of information.
        NOT: search	A String method that tests for a match in a string. It returns the index of the match, or -1 if the search fails.
    flags: returns flags

result struct functions: index(), text(optional capture index or name), capture(index of name): {index:..., text:...}, captures(), input(), setNextSearch,remainder(), between(), before()


jrex(..).map((r)=>r.text).eval('sdfsd')
jrex(..).filter(r=>r.text!='').map(r=>'x'+r.text+'y').first().replace('dsfsdfsd')
jrex(..).filter(r=>r.text!='').template('\1hello').first().replace('dsfsdfsd')
jrex(..).each((r)=>{...}).eval('sdfsd')
----

properties: store, min, max, begin, end, lazy,ahead, in, out

/^([rgbycmld.])([0-9]?)(?:([rgbycmld.])([0-9]?))?$/

var colorLetterStore = {in:'rgbycmld.',store:true};
var optionalNumberStore = {in:'0-9',max:1,store:true};
var color= { sub:[colorLetterStore,optionalNumberStore};

{
    sub:[
        color,
        { sub: color, max: 1},
    ]
    close: true,
}

{{store:{in:'rgbycmld.'}}}

all properties:
begin:true, end:true, flags, min, max
{} or /./ is one single character



/^--(=*)([0-9]*),?([0-9]*)((?:[rgbycmld.][0-9]?){0,2})$/

{close:true, sub:['--',{store:{sub:'=',min:0},{store:{in:'0-9',min:0}]}
[/^/,'--',{store:{in:'0-9',min:0}]

*/
/*
implementation:

jrex(...).filter(r=>r.text().length>3).map(...).last()
*/
var jrexModule;
(function (jrexModule) {
    var jrexNode = (function () {
        function jrexNode(_parent, _iter) {
            this._parent = _parent;
            this._iter = _iter;
        }
        jrexNode.prototype.getIter = function () {
            return this._iter;
        };
        jrexNode.prototype.map = function (func) {
            var iter = this.getIter();
            return new jrexNode(this, function (params, sub) { return iter(params, function (r) { return sub(func(r)); }); });
        };
        jrexNode.prototype.captures = function () {
            return this.map(function (r) { return r.captures(); });
        };
        jrexNode.prototype.text = function (index) {
            return this.map(function (r) { return r.text(index); });
        };
        jrexNode.prototype.indices = function () {
            return this.map(function (r) { return r.index(); });
        };
        jrexNode.prototype.filter = function (func) {
            var iter = this.getIter();
            return new jrexNode(this, function (params, sub) { return iter(params, function (r) { return (func(r) ? sub(r) : undefined); }); });
        };
        jrexNode.prototype.first = function () {
            var iter = this.getIter();
            return new jrexNode(this, function (params, sub) { return iter(params, function (r) { sub(r); return true; }); });
        };
        jrexNode.prototype.last = function () {
            var iter = this.getIter();
            return new jrexNode(this, function (params, sub) {
                var cur;
                var found = false;
                iter(params, function (r) {
                    cur = r;
                    found = true;
                });
                if (found) {
                    sub(cur);
                }
                return true;
            });
        };
        jrexNode.prototype.format = function (fmt) {
            //todo: can we use replace if we: captures.join('').replace(/(.{10})(...{20})/,fmt);
            //
            var f = function (res) { return jrex(/(\\+)([0-9]+)/).filter(function (r) { return (r.text(0).length % 2) == 1; }).map(function (r) { return res.text(parseInt(r.text())); }).replace(fmt); };
            return this.map(f);
        };
        jrexNode.prototype.eval = function (text, startPos) {
            var res = [];
            var isSingle = this.getIter()({ text: text, startPos: startPos }, function (r) {
                res.push(r);
            });
            return isSingle ? res[0] : res;
        };
        jrexNode.prototype.test = function (text, startPos) {
            return this.getIter()({ text: text, startPos: startPos }, function (r) {
                return true;
            }) || false;
        };
        jrexNode.prototype.replace = function (text, startPos) {
            var str = '';
            this.getIter()({ text: text, startPos: startPos }, function (r) {
                str += 'x'; //todo: cannot be implemented yet!!!
            });
            return str;
        };
        jrexNode.prototype.split = function (text, startPos) {
            var res = [];
            var cur;
            this.getIter()({ text: text, startPos: startPos }, function (r) {
                res.push(r.between());
                cur = r;
            });
            if (cur)
                res.push(cur.after());
            return res;
        };
        return jrexNode;
    })();
    var jrexResult = (function () {
        function jrexResult(_regex, _result, _endOfPrevIndex) {
            this._regex = _regex;
            this._result = _result;
            this._endOfPrevIndex = _endOfPrevIndex;
        }
        jrexResult.prototype.after = function () {
            this.input().substring(this.endIndex());
        };
        jrexResult.prototype.between = function () {
            return this.input().substring(this._endOfPrevIndex, this.index());
        };
        jrexResult.prototype.before = function () {
            return this.input().substring(0, this.index());
        };
        jrexResult.prototype.endIndex = function () {
            return this.index() + this.text().length;
        };
        jrexResult.prototype.index = function () {
            return this._result.index;
        };
        jrexResult.prototype.input = function () {
            return this._result.input;
        };
        jrexResult.prototype.text = function (key) {
            return this._result[key == null ? 0 : key + 1];
        };
        jrexResult.prototype.setNextSearch = function (pos) {
            this._regex.lastIndex = pos;
        };
        jrexResult.prototype.captures = function () {
            return this._result.slice(1);
        };
        jrexResult.prototype.toJSON = function () {
            return { index: this.index(), texts: this._result };
        };
        return jrexResult;
    })();
    var jrexObj = (function (_super) {
        __extends(jrexObj, _super);
        function jrexObj(_regex) {
            _super.call(this);
            this._regex = _regex;
            this._flagsGlobal = 'g' + this.flags().replace('g', '');
        }
        jrexObj.prototype.getIter = function () {
            var _this = this;
            return function (params, sub) { return _this.iter(params.text, sub, params.startPos); };
        };
        jrexObj.prototype.iter = function (text, func, startPos) {
            var result;
            var endOfPrevIndex = 0;
            var regex = new RegExp(this._regex.source, this._flagsGlobal);
            regex.lastIndex = startPos || 0;
            while ((result = regex.exec(text)) !== null) {
                var tr = new jrexResult(regex, result, endOfPrevIndex);
                endOfPrevIndex = regex.lastIndex;
                var fRes = func.call(this, tr);
                if (typeof fRes !== 'undefined')
                    return fRes;
            }
        };
        jrexObj.prototype.flags = function () {
            return (this._regex + "").replace(/.+\//, "");
        };
        jrexObj.prototype.regex = function () {
            return new RegExp(this._regex.source, this.flags());
        };
        return jrexObj;
    })(jrexNode);
    var RegexBuilder = (function () {
        function RegexBuilder() {
        }
        RegexBuilder.prototype.construct = function (node) {
            var _this = this;
            if (typeof node === 'string') {
                return this.escapeRegExp(node);
            }
            else if (typeof node === 'object' && typeof node.length === 'number') {
                return node.map(function (i) {
                    return _this.encloseForConcat(_this.construct(i));
                }).join('');
            }
            else if (node instanceof RegExp) {
                return node.toString().replace(/\/(.*)\/[gim]*$/, '$1');
            }
            var re = this.constructPrimary(node);
            re = this.constructLoop(node, re);
            if (node.store)
                re = '(' + re + ')';
            if (node.close && node.close !== 'end')
                re = '^' + re;
            if (node.close && node.close !== 'start')
                re = re + '$';
            if (node.ahead)
                re = '(?' + (node.ahead == 'not' ? '!' : '=') + re + ')';
            return re;
        };
        RegexBuilder.prototype.escapeRegExp = function (string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        };
        RegexBuilder.prototype.requiresEnclosing = function (re) {
            return !((/^\\?.$/.test(re) || /^\[[^\]})]*\]$/.test(re) || /^\([^\]})]*\)$/.test(re) || /^\{[^\]})]*\}$/.test(re)));
        };
        RegexBuilder.prototype.enclose = function (re) {
            return this.requiresEnclosing(re) ? '(?:' + re + ')' : re;
        };
        RegexBuilder.prototype.encloseForConcat = function (re) {
            return this.requiresEnclosing(re) && re.indexOf('|') >= 0 ? '(?:' + re + ')' : re;
        };
        RegexBuilder.prototype.getPrimaryProperty = function (node) {
            var primProp;
            ['or', 'text', 'regex', 'sub', 'any', 'in', 'out'].forEach(function (prop) {
                var avail = node[prop] != null;
                if (avail) {
                    if (primProp != null)
                        throw ('expected only one primary property');
                    primProp = prop;
                }
            });
            return primProp;
        };
        RegexBuilder.prototype.constructPrimary = function (node) {
            var _this = this;
            var primProp = this.getPrimaryProperty(node);
            var val = node[primProp];
            switch (primProp) {
                case 'or':
                    return val.map(function (i) {
                        return _this.enclose(_this.construct(i));
                    }).join('|');
                case 'text':
                    return this.construct(val.toString());
                case 'regex':
                    if (typeof val == 'string')
                        return val;
                    else if (!(val instanceof RegExp))
                        throw ('Expected a string or RegExp');
                    else
                        return this.construct(val);
                case 'in':
                    return '[' + val + ']';
                case 'out':
                    return '[^' + val + ']';
                case 'any':
                    if (typeof val === 'number' ? val <= 0 : val !== true)
                        throw ('expected positive number or true on "any"');
                    return val === 1 || val === true ? '.' : '.{' + val + '}';
                case 'sub':
                    return this.construct(val);
            }
        };
        RegexBuilder.prototype.constructLoop = function (node, re) {
            if (node.lazy || node.min != null || node.max != null || node.exact != null) {
                re = this.enclose(re);
                if (node.exact != null)
                    re += '{' + node.exact + '}';
                else if (!node.min && node.max == null)
                    re += '*';
                else if (!node.min && node.max == 1)
                    re += '?';
                else if (node.max == null)
                    re += '{' + node.min + ',}';
                else if (node.max == node.min)
                    re += '{' + node.min + '}';
                else
                    re += '{' + (node.min || 0) + ',' + node.max + '}';
                if (node.lazy)
                    re += '?';
            }
            return re;
        };
        return RegexBuilder;
    })();
    function jrex(tree, flags) {
        var regex = tree instanceof RegExp ?
            new RegExp(tree, flags) :
            new RegExp(new RegexBuilder().construct(tree), flags || tree.flags);
        return new jrexObj(regex);
    }
    jrexModule.jrex = jrex;
})(jrexModule || (jrexModule = {}));
exports.jrex = jrexModule.jrex;
