/*jslint plusplus: true, sloppy: true, indent: 4 */
// DataBindings: declarative data-source resolver for widgets.
//
// A binding spec is a string describing where to read a value from the global
// clientraw arrays. Widgets declare `config.bindings = { field: spec, ... }`
// in the manifest; WidgetBase compiles them once at construction and calls
// readBindings() on each data event. Spec grammar:
//
//   clientraw[N]        -> arrayClientraw[N]
//   clientrawExtra[N]   -> arrayClientrawExtra[N]
//   clientrawHour[N]    -> arrayClientrawHour[N]
//   clientrawDaily[N]   -> arrayClientrawDaily[N]
//   extraInput(N)       -> getExtraInput(N) (returns [current, high, low])
//   extraInput(N)[K]    -> getExtraInput(N)[K]
//   widgetListInput:KEY -> getExtraInput(widgetList[KEY].input)
//   widgetListInput:KEY[K] -> getExtraInput(widgetList[KEY].input)[K]
//   const:VALUE         -> literal string VALUE
//   dict:KEY            -> useDict(KEY) (dictionary lookup, evaluated each read)
//   fn:NAME             -> window[NAME]() (escape hatch for computed values)
//
// A binding value may also be a function; it is called verbatim each time.
// Unknown prefixes throw during compilation so typos surface at bootstrap.

(function (global) {

    function parseIndex(str) {
        var n = parseInt(str, 10);
        if (isNaN(n)) { throw new Error("DataBindings: invalid index '" + str + "'"); }
        return n;
    }

    function wrapSubscript(fn, subStr) {
        if (subStr === undefined || subStr === null || subStr === "") { return fn; }
        var idx = parseIndex(subStr);
        return function () { var v = fn(); return (v == null) ? v : v[idx]; };
    }

    // Compile a single spec string into a zero-arg function that returns
    // the current value. Throws for unrecognised prefixes.
    function compileSpec(spec) {
        if (typeof spec === "function") { return spec; }
        if (typeof spec !== "string") {
            throw new Error("DataBindings: spec must be string or function, got " + typeof spec);
        }

        var m;

        m = /^clientraw\[(-?\d+)\]$/.exec(spec);
        if (m) {
            var iA = parseIndex(m[1]);
            return function () { return arrayClientraw[iA]; };
        }

        m = /^clientrawExtra\[(-?\d+)\]$/.exec(spec);
        if (m) {
            var iB = parseIndex(m[1]);
            return function () { return arrayClientrawExtra[iB]; };
        }

        m = /^clientrawHour\[(-?\d+)\]$/.exec(spec);
        if (m) {
            var iC = parseIndex(m[1]);
            return function () { return arrayClientrawHour[iC]; };
        }

        m = /^clientrawDaily\[(-?\d+)\]$/.exec(spec);
        if (m) {
            var iD = parseIndex(m[1]);
            return function () { return arrayClientrawDaily[iD]; };
        }

        m = /^extraInput\(([^)]+)\)(?:\[(-?\d+)\])?$/.exec(spec);
        if (m) {
            var arg = m[1];
            // argument may be a number or the literal string "indoor"
            var numArg = parseInt(arg, 10);
            var useStr = isNaN(numArg);
            var argVal = useStr ? arg.replace(/^['"]|['"]$/g, "") : numArg;
            var base = function () { return getExtraInput(argVal); };
            return wrapSubscript(base, m[2]);
        }

        m = /^widgetListInput:([A-Za-z0-9_]+)(?:\[(-?\d+)\])?$/.exec(spec);
        if (m) {
            var key = m[1];
            var base2 = function () { return getExtraInput(widgetList[key].input); };
            return wrapSubscript(base2, m[2]);
        }

        m = /^const:(.*)$/.exec(spec);
        if (m) {
            var lit = m[1];
            return function () { return lit; };
        }

        m = /^dict:([A-Za-z0-9_]+)$/.exec(spec);
        if (m) {
            var dkey = m[1];
            return function () {
                return (typeof useDict === "function") ? useDict(dkey) : dkey;
            };
        }

        m = /^fn:([A-Za-z_$][A-Za-z0-9_$]*)$/.exec(spec);
        if (m) {
            var fname = m[1];
            return function () {
                var f = global[fname];
                if (typeof f !== "function") {
                    throw new Error("DataBindings: fn '" + fname + "' is not callable");
                }
                return f();
            };
        }

        throw new Error("DataBindings: unrecognised spec '" + spec + "'");
    }

    // Compile an object of specs into an object of zero-arg resolver functions.
    function compileBindings(map) {
        var out = {};
        if (!map) { return out; }
        for (var k in map) {
            if (Object.prototype.hasOwnProperty.call(map, k)) {
                try {
                    out[k] = compileSpec(map[k]);
                } catch (e) {
                    throw new Error("DataBindings: error compiling field '" + k + "': " + e.message);
                }
            }
        }
        return out;
    }

    // Run each compiled resolver and return { field: value, ... }.
    function readCompiled(compiled) {
        var out = {};
        if (!compiled) { return out; }
        for (var k in compiled) {
            if (Object.prototype.hasOwnProperty.call(compiled, k)) {
                out[k] = compiled[k]();
            }
        }
        return out;
    }

    global.DataBindings = {
        compile: compileBindings,
        compileSpec: compileSpec,
        read: readCompiled
    };

})(typeof window !== "undefined" ? window : this);
