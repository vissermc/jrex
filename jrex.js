/*
The MIT License (MIT)

Copyright (c) 2015 vissermc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

-------------------------------------------------------------------------------

TODO:
- test(text, startPos)	if there is at least one hit (give error on using map/captures/first/last/search,format).
- replace(text, startPos)	A String method that executes a search for a match in a string, and replaces the matched substring with a replacement substring.
- split(text, startPos)	give error on map/captures/search/format
*/
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var jRexModule;
(function (jRexModule) {
    var jRexNode = (function () {
        function jRexNode(_parent, _iter) {
            this._parent = _parent;
            this._iter = _iter;
        }
        jRexNode.prototype.getIter = function () {
            return this._iter;
        };
        jRexNode.prototype.map = function (func) {
            var iter = this.getIter();
            return new jRexNode(this, function (params, sub) { return iter(params, function (r, orig) { return sub(func(r), orig); }); });
        };
        jRexNode.prototype.captures = function () {
            return this.map(function (r) { return r.captures(); });
        };
        jRexNode.prototype.text = function (index) {
            return this.map(function (r) { return r.text(index); });
        };
        jRexNode.prototype.index = function () {
            return this.map(function (r) { return r.index(); });
        };
        jRexNode.prototype.filter = function (func) {
            var iter = this.getIter();
            return new jRexNode(this, function (params, sub) { return iter(params, function (r, orig) { return (func(r) ? sub(r, orig) : undefined); }); });
        };
        jRexNode.prototype.while = function (func) {
            var iter = this.getIter();
            return new jRexNode(this, function (params, sub) { return iter(params, function (r, orig) { return (func(r) ? sub(r, orig) : null); }); });
        };
        jRexNode.prototype.henceforth = function (func) {
            var found;
            return this.filter(function (r) { return (found || (found = func(r))); });
        };
        jRexNode.prototype.skip = function (count) {
            var skip = count;
            return this.filter(function (r) { return (skip < 0 || --skip < 0); });
        };
        jRexNode.prototype.first = function () {
            var iter = this.getIter();
            return new jRexNode(this, function (params, sub) { return iter(params, function (r, orig) { sub(r, orig); return true; }); });
        };
        jRexNode.prototype.last = function () {
            var iter = this.getIter();
            return new jRexNode(this, function (params, sub) {
                var cur, curOrig;
                var found = false;
                iter(params, function (r, orig) {
                    cur = r;
                    curOrig = orig;
                    found = true;
                });
                if (found) {
                    sub(cur, curOrig);
                }
                return true;
            });
        };
        jRexNode.prototype.format = function (fmt) {
            var f = function (res) { return jRex(/\$\$|\$&|\$([0-9]+)/).
                map(function (r) {
                switch (r.text()) {
                    case '$$': return '$';
                    case '$&': return res.text();
                    default: return res.text(parseInt(r.text(1)));
                }
            }).replace(fmt); };
            return this.map(f);
        };
        jRexNode.prototype.eval = function (text, startPos) {
            var res = [];
            var isSingle = this.getIter()({ text: text, startPos: startPos }, function (r) {
                res.push(r);
            });
            return isSingle ? res[0] : res;
        };
        jRexNode.prototype.test = function (text, startPos) {
            return this.getIter()({ text: text, startPos: startPos }, function (r) {
                return true;
            }) || false;
        };
        jRexNode.prototype.replace = function (text, startPos) {
            var str = '';
            var index = 0;
            this.getIter()({ text: text, startPos: startPos }, function (r, orig) {
                str += text.substring(index, orig.index()) + r;
                index = orig.endIndex();
            });
            return str + text.substr(index);
        };
        jRexNode.prototype.split = function (text, startPos) {
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
        return jRexNode;
    })();
    var jRexResult = (function () {
        function jRexResult(_regex, _result, _endOfPrevIndex) {
            this._regex = _regex;
            this._result = _result;
            this._endOfPrevIndex = _endOfPrevIndex;
        }
        jRexResult.prototype.after = function () {
            return this.input().substring(this.endIndex());
        };
        jRexResult.prototype.between = function () {
            return this.input().substring(this._endOfPrevIndex, this.index());
        };
        jRexResult.prototype.before = function () {
            return this.input().substring(0, this.index());
        };
        jRexResult.prototype.endIndex = function () {
            return this.index() + this.text().length;
        };
        jRexResult.prototype.index = function () {
            return this._result.index;
        };
        jRexResult.prototype.input = function () {
            return this._result.input;
        };
        jRexResult.prototype.text = function (key) {
            return this._result[key ? key : 0];
        };
        jRexResult.prototype.setNextSearch = function (pos) {
            this._regex.lastIndex = pos;
        };
        jRexResult.prototype.captures = function () {
            return this._result.slice(1);
        };
        jRexResult.prototype.toJSON = function () {
            return { index: this.index(), texts: this._result };
        };
        return jRexResult;
    })();
    var jRexObj = (function (_super) {
        __extends(jRexObj, _super);
        function jRexObj(_regex) {
            _super.call(this);
            this._regex = _regex;
            this._flagsGlobal = 'g' + this.flags().replace('g', '');
        }
        jRexObj.prototype.getIter = function () {
            var _this = this;
            return function (params, sub) { return _this.iter(params.text, sub, params.startPos); };
        };
        jRexObj.prototype.iter = function (text, func, startPos) {
            var result;
            var endOfPrevIndex = 0;
            var regex = new RegExp(this._regex.source, this._flagsGlobal);
            regex.lastIndex = startPos || 0;
            while ((result = regex.exec(text)) !== null) {
                var tr = new jRexResult(regex, result, endOfPrevIndex);
                endOfPrevIndex = regex.lastIndex;
                var fRes = func.call(this, tr, tr);
                if (typeof fRes !== 'undefined')
                    return fRes;
            }
        };
        jRexObj.prototype.flags = function () {
            return (this._regex + "").replace(/.+\//, "");
        };
        jRexObj.prototype.regex = function () {
            return new RegExp(this._regex.source, this.flags());
        };
        jRexObj.prototype.toJSON = function () {
            return { regex: this._regex.source, flags: this.flags() }; // TODO: test
        };
        return jRexObj;
    })(jRexNode);
    var RegexBuilder = (function () {
        function RegexBuilder() {
        }
        RegexBuilder.prototype.construct = function (node) {
            var _this = this;
            if (node instanceof jRexObj) {
                return node.regex().source;
            }
            if (typeof node === 'string') {
                return this.escapeRegExp(node);
            }
            else if (typeof node === 'object' && typeof node.length === 'number') {
                return node.map(function (i) {
                    return _this.encloseForConcat(_this.construct(i));
                }).join('');
            }
            else if (node instanceof RegExp) {
                return node.source;
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
    function jRex(tree, flags) {
        var regex = tree instanceof RegExp ?
            new RegExp(tree, flags) :
            new RegExp(new RegexBuilder().construct(tree), flags || (typeof tree.flags === 'function' ? tree.flags() : tree.flags));
        return new jRexObj(regex);
    }
    jRexModule.jRex = jRex;
})(jRexModule || (jRexModule = {}));
module.exports = exports = jRexModule.jRex;
