function word_to_u32(w) {
  let x = 0;
  for (let i = 0; w.$ === "WCon"; i++) {
    x |= Number(w.head) << i;
    w = w.tail;
  }
  return x >>> 0;
}

function u32_to_word(x) {
  let w = {$: "WNil"};
  for (let i = 31; i >= 0; i--) {
    w = {$: "WCon", head: ((x >>> i) & 1) === 1, tail: w};
  }
  return w;
}

function cmp_new(a, b) {
  return {$: a < b ? "LT" : a === b ? "EQ" : "GT"};
}

function tup_new(a, b) {
  return {$: "Tuple", fst: a, snd: b};
}

function nat_divmod(a, b) {
  return tup_new(b && Math.trunc(a / b), b ? a % b : a);
}

function nat_chk(n) {
  if (n > 281474976710655) {
    throw "bend: a Nat past the largest immediate 2^48-1";
  }
  return n;
}

function nat_in(n) {
  if (!Number.isInteger(n) || n < 0 || n > 2 ** 53) {
    throw "bend: expected a Nat host number: an integer from 0 to 2^53";
  }
  return n;
}

function f32_show(x) {
  let s = "nan";
  for (let p = 1; x === x && p <= 9 && f32_round(s) !== x; p += 1) {
    s = String(Number(x.toExponential(p - 1)));
  }
  return (Object.is(x, -0) ? "-0" : s).replace("Infinity", "inf");
}

function f32_bits(x) {
  return new Uint32Array(new Float32Array([x]).buffer)[0];
}

function f32_from_bits(u) {
  return new Float32Array(new Uint32Array([u]).buffer)[0];
}

function f32_read(s) {
  const re = /^[\t\n\v\f\r ]*[+-]?((\d+(?:\.\d*)?|\.\d+)(e[+-]?\d+)?|inf(inity)?|nan)$/i;
  return re.test(s) ? {$: "Some", value: f32_round(
    s.replace(/inf\w*/i, "Infinity"))} : {$: "None"};
}

const f32_round = function f32_round(s) {
  const d = Number(s), a = Math.abs(d), f = Math.fround(a), g = 2 * a - Math.min(f, 340282366920938500000000000000000000000);
  if (g === f || Math.fround(g) !== g || g === 1 / 0)
    return Math.sign(d) * f;
  let k = 0;
  while (a * 2 ** k % 1 !== 0)
    k += 1;
  const [, i, r, e] = /(\d*)\.?(\d*)(?:e([+-]?\d+))?$/i.exec(s), n = Number(e ?? 0) - r.length, x = BigInt(i + r) * 2n ** BigInt(k) * 10n ** BigInt(Math.max(n, 0)), y = BigInt(a * 2 ** k) * 10n ** BigInt(Math.max(-n, 0));
  return Math.sign(d) * (x === y || x > y !== g > f ? f : g);
};

const char_new = function char_new(c) {
  return c < 55296 || c >= 57344 && c <= 1114111 ? String.fromCodePoint(c) : String.fromCharCode(56320, c >>> 22, c >>> 11 & 2047, c & 2047);
};

function char_len(s, at = 0) {
  return s[at] === "\uDC00" ? 4 : s.codePointAt(at) > 0xFFFF ? 2 : 1;
}

function char_code(s) {
  return s.length < 4 ? s.codePointAt(0)
    : (s.charCodeAt(1) << 22 | s.charCodeAt(2) << 11 | s.charCodeAt(3)) >>> 0;
}

function string_contains(s, p) {
  // A match starts at a Char, not inside a packed U32 code.
  for (let at = 0; at <= s.length; at += char_len(s, at)) {
    if (s.startsWith(p, at)) {
      return true;
    }
  }
  return false;
}

function str_out(s) {
  return s.replace(/\uDC00[^]{3}/gu, "\uFFFD");
}

function str_in(s) {
  return s.replace(/\p{Cs}/gu, "\uFFFD");
}

// Array
// =====

function array_new(d, v, lgs) {
  if (d > 31 - lgs) {
    throw "bend: an array past the deepest block class 31 (depth + log2 words per cell)";
  }
  return Array(2 ** d).fill(v);
}

function array_node(a, b) {
  if (a.length !== b.length) {
    throw "bend: runtime fail-stop";
  }
  return a.concat(b);
}

function array_rmw(a, i, f) {
  const old = a[i %= a.length];
  a[i] = f(old);
  return tup_new(a, old);
}

// Run
// ===

function run_tail(f, x) {
  return {$: "$JMP", f: f.j?.f === f ? f.j : f, x};
}

function run_clo(j) {
  const f = (x) => run_loop(j(x));
  f.j = j;
  j.f = f;
  return f;
}

function run_loop(r) {
  while (r !== null && typeof r === "object" && r.$ === "$JMP") {
    r = r.f(r.x);
  }
  return r;
}

function run_lib(f, n) {
  return (...a) => a.length < n ? run_lib((...b) => f(...a, ...b), n - a.length)
    : run_loop(f(...a));
}

// Effect
// ======

const $0eff = Object.create(null);
const io_file_append = new Set();

function io_eff(k, run) {
  if (arguments.length > 2) {
    throw new Error("bend: " + k + " takes no need: an effect that waits parks itself");
  }
  if (k in $0eff) {
    throw new Error("bend: two effects register " + k);
  }
  $0eff[k] = run;
}
// Program
// =======

function $lib_num_nan() {
  return Math.fround(0 / 0);
}

function $lib_num_parse_go(_empty_0, _t_0) {
  if (_empty_0) {
    return 0;
  } else {
    return $Maybe_default(f32_read(_t_0), $$lib_num_nan());
  }
}

function $lib_num_parse(_s_0) {
  const _t_0 = $$String_trim(_s_0);
  return $lib_num_parse_go($$String_is_empty(_t_0), _t_0);
}

function $lib_num_is_nan(_x_0) {
  return (_x_0 !== _x_0);
}

function $lib_num_pick(_c_0, _a_0, _b_0) {
  return $Bool_pick(_c_0, _a_0, _b_0);
}

function $lib_num_pick_s(_c_0, _a_0, _b_0) {
  return $Bool_pick(_c_0, _a_0, _b_0);
}

function $lib_num_pow10(_n_0) {
  if (_n_0 == 0) {
    return 1;
  } else {
    const _p_0 = (_n_0 - 1);
    const _x_0 = $$lib_num_pow10(_p_0);
    return Math.fround(10 * _x_0);
  }
}

function $lib_num_round_to(_x_0, _d_0) {
  const _x_1 = $$lib_num_pow10(_d_0);
  const _x_2 = $$F32_round(Math.fround(_x_0 * _x_1));
  const _x_3 = $$lib_num_pow10(_d_0);
  return Math.fround(_x_2 / _x_3);
}

function $lib_num_sharpen(_x_0) {
  const _x_1 = $$F32_round(_x_0);
  return Math.fround(_x_1 + 0.5);
}

function $lib_num_map(_x_0, _in_min_0, _in_max_0, _out_min_0, _out_max_0) {
  const _x_1 = Math.fround(_x_0 - _in_min_0);
  const _x_2 = Math.fround(_out_max_0 - _out_min_0);
  const _x_3 = Math.fround(_x_1 * _x_2);
  const _x_4 = Math.fround(_in_max_0 - _in_min_0);
  const _x_5 = Math.fround(_x_3 / _x_4);
  return Math.fround(_x_5 + _out_min_0);
}

function $lib_num_min(_a_0, _b_0) {
  return $lib_num_pick((_a_0 < _b_0), _a_0, _b_0);
}

function $lib_num_max(_a_0, _b_0) {
  return $lib_num_pick((_a_0 > _b_0), _a_0, _b_0);
}

function $lib_num_show_fin(_nan_0, _s_0) {
  if (_nan_0) {
    return "NaN";
  } else {
    return $lib_num_pick_s($$String_eq(_s_0, "inf"), "Infinity", $$lib_num_pick_s($$String_eq(_s_0, "-inf"), "-Infinity", $$lib_num_pick_s($$String_eq(_s_0, "-0"), "0", _s_0)));
  }
}

function $lib_num_show(_x_0) {
  return $lib_num_show_fin($$lib_num_is_nan(_x_0), f32_show(_x_0));
}

function $lib_num_norm(_s_0) {
  return $lib_num_show($$lib_num_parse(_s_0));
}

function $lib_num_int(_s_0) {
  const _x_0 = $$lib_num_parse(_s_0);
  return Math.fround(Math.trunc(_x_0));
}

function $lib_num_nat_of_go(_neg_0, _x_0) {
  if (_neg_0) {
    return 0;
  } else {
    return $F32_to_nat(_x_0);
  }
}

function $lib_num_nat_of(_x_0) {
  const _x_1 = (_x_0 < 0);
  const _x_2 = $$lib_num_is_nan(_x_0);
  return $lib_num_nat_of_go((_x_1 || _x_2), _x_0);
}

function $lib_num_of_nat(_n_0) {
  return Math.fround(_n_0 );
}

function $lib_num_cdim(_px_0, _num_0, _den_0) {
  const _x_0 = Math.fround(Math.floor(_px_0));
  const _x_1 = Math.fround(_x_0 * _num_0);
  const _x_2 = Math.fround(_x_1 / _den_0);
  return Math.fround(Math.floor(_x_2));
}

function $lib_raw_fix(_f_0) {
  return $Bool_pick($$String_eq(_f_0, "-"), "0", _f_0);
}

function $lib_raw_split_acc(_cut_0, _cur_0, _acc_0) {
  if (_cut_0) {
    return {$: "Con", "head": $$lib_raw_fix($$String_reverse(_cur_0)), "tail": _acc_0};
  } else {
    return _acc_0;
  }
}

function $lib_raw_split_cur(_cut_0, _h_0, _cur_0) {
  if (_cut_0) {
    return "";
  } else {
    return (_h_0 + _cur_0);
  }
}

function $lib_raw_split_go($0, $1, $2) {
  for (;;) {
    {
      const _s_0 = $0;
      const _cur_0 = $1;
      const _acc_0 = $2;
      if (_s_0 === "") {
        return $List_reverse({$: "Con", "head": $$lib_raw_fix($$String_reverse(_cur_0)), "tail": _acc_0});
      } else {
        const _h_0 = _s_0.slice(0, char_len(_s_0));
        const _t_0 = _s_0.slice(char_len(_s_0));
        const _cut_0 = $$Char_is_eq(_h_0, " ");
        $0 = _t_0;
        $1 = $$lib_raw_split_cur(_cut_0, _h_0, _cur_0);
        $2 = $$lib_raw_split_acc(_cut_0, _cur_0, _acc_0);
        continue;
      }
    }
  }
}

function $lib_raw_split(_s_0) {
  return $lib_raw_split_go(_s_0, "", {$: "Nil"});
}

function $lib_raw_at(_xs_0, _i_0) {
  return $Maybe_default($$List_get(_xs_0, _i_0), "undefined");
}

function $lib_raw_length(_xs_0) {
  return $List_length(_xs_0);
}

function $lib_raw_same(_xs_0, _ys_0) {
  if (_xs_0.$ === "Nil") {
    if (_ys_0.$ === "Nil") {
      return true;
    } else {
      return false;
    }
  } else {
    const _x_0 = _xs_0["head"];
    const _xt_0 = _xs_0["tail"];
    if (_ys_0.$ === "Con") {
      const _y_0 = _ys_0["head"];
      const _yt_0 = _ys_0["tail"];
      return $Bool_and($$String_eq(_x_0, _y_0), $$lib_raw_same(_xt_0, _yt_0));
    } else {
      return false;
    }
  }
}

function $lib_units_defaults() {
  return {$: "Units", "pressure": "hPa", "altitude": "m", "wind": "kmh", "rainfall": "mm", "wind_direction": "deg", "humidity": "percent", "solar": "Wm", "uv": "noUnit", "temp": "celsius"};
}

function $lib_units_table(_k_0) {
  if (_k_0.$ === "Pressure") {
    return {$: "Con", "head": {$: "Scale", "key": "hPa", "mult": 1, "display": "hPa", "dec": 1}, "tail": {$: "Con", "head": {$: "Scale", "key": "mmHG", "mult": 0.750061571598053, "display": "mmHG", "dec": 1}, "tail": {$: "Con", "head": {$: "Scale", "key": "kPa", "mult": 0.10000000149011612, "display": "kPa", "dec": 2}, "tail": {$: "Con", "head": {$: "Scale", "key": "inHg", "mult": 0.029529983177781105, "display": "inHg", "dec": 2}, "tail": {$: "Con", "head": {$: "Scale", "key": "mb", "mult": 1, "display": "mb", "dec": 1}, "tail": {$: "Nil"}}}}}};
  } else if (_k_0.$ === "Altitude") {
    return {$: "Con", "head": {$: "Scale", "key": "m", "mult": 0.30480000376701355, "display": "m", "dec": 0}, "tail": {$: "Con", "head": {$: "Scale", "key": "yds", "mult": 0.33333298563957214, "display": "yds", "dec": 0}, "tail": {$: "Con", "head": {$: "Scale", "key": "ft", "mult": 1, "display": "ft", "dec": 0}, "tail": {$: "Nil"}}}};
  } else if (_k_0.$ === "Wind") {
    return {$: "Con", "head": {$: "Scale", "key": "kmh", "mult": 1.8519999980926514, "display": "km/h", "dec": 1}, "tail": {$: "Con", "head": {$: "Scale", "key": "mph", "mult": 1.1507799625396729, "display": "mph", "dec": 1}, "tail": {$: "Con", "head": {$: "Scale", "key": "kts", "mult": 1, "display": "kts", "dec": 1}, "tail": {$: "Con", "head": {$: "Scale", "key": "ms", "mult": 0.5144439935684204, "display": "m/s", "dec": 1}, "tail": {$: "Con", "head": {$: "Scale", "key": "B", "mult": 1, "display": "BFT", "dec": 1}, "tail": {$: "Nil"}}}}}};
  } else if (_k_0.$ === "WindDirection") {
    return {$: "Con", "head": {$: "Scale", "key": "deg", "mult": 1, "display": "°", "dec": 0}, "tail": {$: "Nil"}};
  } else if (_k_0.$ === "Rainfall") {
    return {$: "Con", "head": {$: "Scale", "key": "mm", "mult": 1, "display": "mm", "dec": 1}, "tail": {$: "Con", "head": {$: "Scale", "key": "inch", "mult": 0.0393701009452343, "display": "in", "dec": 2}, "tail": {$: "Nil"}}};
  } else if (_k_0.$ === "Humidity") {
    return {$: "Con", "head": {$: "Scale", "key": "percent", "mult": 1, "display": "%", "dec": 0}, "tail": {$: "Nil"}};
  } else if (_k_0.$ === "Solar") {
    return {$: "Con", "head": {$: "Scale", "key": "Wm", "mult": 1, "display": "W/m²", "dec": 1}, "tail": {$: "Nil"}};
  } else if (_k_0.$ === "UV") {
    return {$: "Con", "head": {$: "Scale", "key": "noUnit", "mult": 1, "display": " ", "dec": 1}, "tail": {$: "Nil"}};
  } else {
    return {$: "Con", "head": {$: "Scale", "key": "celsius", "mult": 1, "display": "°C", "dec": 1}, "tail": {$: "Con", "head": {$: "Scale", "key": "fahrenheit", "mult": 1, "display": "°F", "dec": 1}, "tail": {$: "Nil"}}};
  }
}

function $lib_units_current(_u_0, _k_0) {
  const _p_0 = _u_0["pressure"];
  const _a_0 = _u_0["altitude"];
  const _w_0 = _u_0["wind"];
  const _r_0 = _u_0["rainfall"];
  const _d_0 = _u_0["wind_direction"];
  const _h_0 = _u_0["humidity"];
  const _s_0 = _u_0["solar"];
  const _v_0 = _u_0["uv"];
  const _t_0 = _u_0["temp"];
  if (_k_0.$ === "Pressure") {
    return _p_0;
  } else if (_k_0.$ === "Altitude") {
    return _a_0;
  } else if (_k_0.$ === "Wind") {
    return _w_0;
  } else if (_k_0.$ === "WindDirection") {
    return _d_0;
  } else if (_k_0.$ === "Rainfall") {
    return _r_0;
  } else if (_k_0.$ === "Humidity") {
    return _h_0;
  } else if (_k_0.$ === "Solar") {
    return _s_0;
  } else if (_k_0.$ === "UV") {
    return _v_0;
  } else {
    return _t_0;
  }
}

function $lib_units_key_of(_u_0) {
  const _k_0 = _u_0["key"];
  return _k_0;
}

function $lib_units_find(_key_0, _us_0) {
  if (_us_0.$ === "Nil") {
    return {$: "Scale", "key": _key_0, "mult": 1, "display": "", "dec": 0};
  } else {
    const _u_0 = _us_0["head"];
    const _rest_0 = _us_0["tail"];
    return $Bool_pick($$String_eq($$lib_units_key_of(_u_0), _key_0), _u_0, $$lib_units_find(_key_0, _rest_0));
  }
}

function $lib_units_unit(_u_0, _k_0) {
  return $lib_units_find($$lib_units_current(_u_0, _k_0), $$lib_units_table(_k_0));
}

function $lib_units_display_of(_s_0) {
  const _display_0 = _s_0["display"];
  return _display_0;
}

function $lib_units_label(_u_0, _k_0) {
  return $lib_units_display_of($$lib_units_unit(_u_0, _k_0));
}

function $lib_units_is_temp(_k_0) {
  if (_k_0.$ === "Temp") {
    return true;
  } else {
    return false;
  }
}

function $lib_units_beaufort(_v_0) {
  const _x_0 = Math.fround(_v_0 * 0.5144439935684204);
  const _x_1 = Math.fround(_x_0 / 0.8360000252723694);
  const _x_2 = Math.fround(2 / 3);
  return $F32_min($$F32_round((_x_1 === 1 || _x_1 === -1 && Math.abs(_x_2) === Infinity ? 1 : Math.fround(Math.pow(_x_1, _x_2)))), 12);
}

function $lib_units_nonzero(_fuel_0, _y_0, _dec_0) {
  if (_fuel_0 == 0) {
    return 0;
  } else {
    const _f_0 = (_fuel_0 - 1);
    const _r0_0 = $$lib_num_round_to(_y_0, _dec_0);
    const _r_0 = $$Bool_pick($$lib_num_is_nan(_r0_0), 0, _r0_0);
    const _x_0 = (_r_0 !== 0);
    const _x_1 = $$Nat_is_ge(_dec_0, 5);
    return $Bool_pick((_x_0 || _x_1), _r_0, $$lib_units_nonzero(_f_0, _y_0, nat_chk(_dec_0 + 1)));
  }
}

function $lib_units_value_go(_un_0, _temp_0, _fah_0, _bft_0, _x_0) {
  const _mult_0 = _un_0["mult"];
  const _dec_0 = _un_0["dec"];
  if (_temp_0) {
    const _x_1 = Math.fround(9 / 5);
    const _x_2 = Math.fround(_x_0 * _x_1);
    return $Bool_pick(_fah_0, $$lib_num_round_to(Math.fround(_x_2 + 32), _dec_0), _x_0);
  } else {
    return $Bool_pick(_bft_0, $$lib_units_beaufort(_x_0), $$Bool_pick((_x_0 === 0), $$lib_num_round_to(Math.fround(_x_0 * _mult_0), _dec_0), $$lib_units_nonzero(6, Math.fround(_x_0 * _mult_0), _dec_0)));
  }
}

function $lib_units_value(_u_0, _k_0, _x_0) {
  return $lib_units_value_go($$lib_units_unit(_u_0, _k_0), $$lib_units_is_temp(_k_0), $$String_eq($$lib_units_current(_u_0, _k_0), "fahrenheit"), $$String_eq($$lib_units_current(_u_0, _k_0), "B"), _x_0);
}

function $lib_units_show_raw(_u_0, _k_0, _raw_0) {
  return $Bool_pick($$Bool_and($$lib_units_is_temp(_k_0), $$String_eq($$lib_units_current(_u_0, _k_0), "celsius")), _raw_0, $$lib_num_show($$lib_units_value(_u_0, _k_0, $$lib_num_parse(_raw_0))));
}

function $lib_units_show(_u_0, _k_0, _x_0) {
  return $lib_num_show($$lib_units_value(_u_0, _k_0, _x_0));
}

function $lib_units_with_label(_u_0, _k_0, _raw_0) {
  const _x_0 = $$lib_units_show_raw(_u_0, _k_0, _raw_0);
  const _x_1 = $$lib_units_label(_u_0, _k_0);
  return (_x_0 + _x_1);
}

function $lib_units_next(_us_0, _key_0, _first_0, _hit_0) {
  if (_us_0.$ === "Nil") {
    return _first_0;
  } else {
    const _u_0 = _us_0["head"];
    const _rest_0 = _us_0["tail"];
    return $Bool_pick(_hit_0, $$lib_units_key_of(_u_0), $$lib_units_next(_rest_0, _key_0, _first_0, $$String_eq($$lib_units_key_of(_u_0), _key_0)));
  }
}

function $lib_units_first_key(_us_0) {
  if (_us_0.$ === "Nil") {
    return "";
  } else {
    const _u_0 = _us_0["head"];
    return $lib_units_key_of(_u_0);
  }
}

function $lib_units_set(_u_0, _k_0, _key_0) {
  const _p_0 = _u_0["pressure"];
  const _a_0 = _u_0["altitude"];
  const _w_0 = _u_0["wind"];
  const _r_0 = _u_0["rainfall"];
  const _d_0 = _u_0["wind_direction"];
  const _h_0 = _u_0["humidity"];
  const _s_0 = _u_0["solar"];
  const _v_0 = _u_0["uv"];
  const _t_0 = _u_0["temp"];
  if (_k_0.$ === "Pressure") {
    return {$: "Units", "pressure": _key_0, "altitude": _a_0, "wind": _w_0, "rainfall": _r_0, "wind_direction": _d_0, "humidity": _h_0, "solar": _s_0, "uv": _v_0, "temp": _t_0};
  } else if (_k_0.$ === "Altitude") {
    return {$: "Units", "pressure": _p_0, "altitude": _key_0, "wind": _w_0, "rainfall": _r_0, "wind_direction": _d_0, "humidity": _h_0, "solar": _s_0, "uv": _v_0, "temp": _t_0};
  } else if (_k_0.$ === "Wind") {
    return {$: "Units", "pressure": _p_0, "altitude": _a_0, "wind": _key_0, "rainfall": _r_0, "wind_direction": _d_0, "humidity": _h_0, "solar": _s_0, "uv": _v_0, "temp": _t_0};
  } else if (_k_0.$ === "WindDirection") {
    return {$: "Units", "pressure": _p_0, "altitude": _a_0, "wind": _w_0, "rainfall": _r_0, "wind_direction": _key_0, "humidity": _h_0, "solar": _s_0, "uv": _v_0, "temp": _t_0};
  } else if (_k_0.$ === "Rainfall") {
    return {$: "Units", "pressure": _p_0, "altitude": _a_0, "wind": _w_0, "rainfall": _key_0, "wind_direction": _d_0, "humidity": _h_0, "solar": _s_0, "uv": _v_0, "temp": _t_0};
  } else if (_k_0.$ === "Humidity") {
    return {$: "Units", "pressure": _p_0, "altitude": _a_0, "wind": _w_0, "rainfall": _r_0, "wind_direction": _d_0, "humidity": _key_0, "solar": _s_0, "uv": _v_0, "temp": _t_0};
  } else if (_k_0.$ === "Solar") {
    return {$: "Units", "pressure": _p_0, "altitude": _a_0, "wind": _w_0, "rainfall": _r_0, "wind_direction": _d_0, "humidity": _h_0, "solar": _key_0, "uv": _v_0, "temp": _t_0};
  } else if (_k_0.$ === "UV") {
    return {$: "Units", "pressure": _p_0, "altitude": _a_0, "wind": _w_0, "rainfall": _r_0, "wind_direction": _d_0, "humidity": _h_0, "solar": _s_0, "uv": _key_0, "temp": _t_0};
  } else {
    return {$: "Units", "pressure": _p_0, "altitude": _a_0, "wind": _w_0, "rainfall": _r_0, "wind_direction": _d_0, "humidity": _h_0, "solar": _s_0, "uv": _v_0, "temp": _key_0};
  }
}

function $lib_units_cycle(_u_0, _k_0) {
  return $lib_units_set(_u_0, _k_0, $$lib_units_next($$lib_units_table(_k_0), $$lib_units_current(_u_0, _k_0), $$lib_units_first_key($$lib_units_table(_k_0)), false));
}

function $lib_dict_lang(_code_0) {
  return $Bool_pick($$String_eq(_code_0, "en"), {$: "LEn"}, $$Bool_pick($$String_eq(_code_0, "de"), {$: "LDe"}, $$Bool_pick($$String_eq(_code_0, "nl"), {$: "LNl"}, $$Bool_pick($$String_eq(_code_0, "da"), {$: "LDa"}, $$Bool_pick($$String_eq(_code_0, "ro"), {$: "LRo"}, $$Bool_pick($$String_eq(_code_0, "fr"), {$: "LFr"}, $$Bool_pick($$String_eq(_code_0, "gr"), {$: "LGr"}, $$Bool_pick($$String_eq(_code_0, "it"), {$: "LIt"}, $$Bool_pick($$String_eq(_code_0, "es"), {$: "LEs"}, $$Bool_pick($$String_eq(_code_0, "nb"), {$: "LNb"}, $$Bool_pick($$String_eq(_code_0, "bg"), {$: "LBg"}, $$Bool_pick($$String_eq(_code_0, "cs"), {$: "LCs"}, $$Bool_pick($$String_eq(_code_0, "si"), {$: "LSi"}, $$Bool_pick($$String_eq(_code_0, "fi"), {$: "LFi"}, $$Bool_pick($$String_eq(_code_0, "sv"), {$: "LSv"}, $$Bool_pick($$String_eq(_code_0, "pt"), {$: "LPt"}, $$Bool_pick($$String_eq(_code_0, "ca"), {$: "LCa"}, $$Bool_pick($$String_eq(_code_0, "hr"), {$: "LHr"}, {$: "LOther"}))))))))))))))))));
}

function $lib_dict_get(_w_0, _l_0) {
  if (_w_0.$ === "WApparentTitle") {
    if (_l_0.$ === "LDe") {
      return "Gefühlt";
    } else if (_l_0.$ === "LNl") {
      return "Schijnbare";
    } else if (_l_0.$ === "LDa") {
      return "Føles som";
    } else if (_l_0.$ === "LRo") {
      return "Aparentă";
    } else if (_l_0.$ === "LFr") {
      return "Ressenti";
    } else if (_l_0.$ === "LGr") {
      return "Εμφανής";
    } else if (_l_0.$ === "LIt") {
      return "Apparente";
    } else if (_l_0.$ === "LEs") {
      return "Aparente";
    } else if (_l_0.$ === "LNb") {
      return "Tilsynelatende";
    } else if (_l_0.$ === "LBg") {
      return "Усеща се";
    } else if (_l_0.$ === "LCs") {
      return "Zdánlivá";
    } else if (_l_0.$ === "LSi") {
      return "Naslovnica";
    } else if (_l_0.$ === "LFi") {
      return "Tuntuu kuin";
    } else if (_l_0.$ === "LSv") {
      return "Känns som";
    } else if (_l_0.$ === "LPt") {
      return "Aparente";
    } else if (_l_0.$ === "LCa") {
      return "Aparent";
    } else if (_l_0.$ === "LHr") {
      return "Prividna";
    } else {
      return "Apparent";
    }
  } else if (_w_0.$ === "WApparentDescription") {
    if (_l_0.$ === "LDe") {
      return "Wahrgenommene Temperatur basierend auf Temperatur, Luftfeuchtigkeit, Sonne und Wind.";
    } else if (_l_0.$ === "LNl") {
      return "Waargenomen temperatuur gebaseerd op de temperatuur, vochtigheid, zon en wind.";
    } else if (_l_0.$ === "LDa") {
      return "Opfattet temperatur baseret på temperatur, fugtighed, sol og vind";
    } else if (_l_0.$ === "LRo") {
      return "Temperatura percepută în funcție de temperatură, umiditate, soare şi vânt.";
    } else if (_l_0.$ === "LFr") {
      return "Température perçue en fonction de la température, de l'humidité, du soleil et du vent.";
    } else if (_l_0.$ === "LGr") {
      return "Θεωρημένη θερμοκρασία με βάση τη θερμοκρασία, την υγρασία, τον ήλιο και τον άνεμο.";
    } else if (_l_0.$ === "LIt") {
      return "Temperatura percepita basata su temperatura, umidità, sole e vento.";
    } else if (_l_0.$ === "LEs") {
      return "Temperatura percibida en función de la temperatura, la humedad, el sol y el viento.";
    } else if (_l_0.$ === "LNb") {
      return "Oppfattet temperatur basert på temperatur, fuktighet, sol og vind.";
    } else if (_l_0.$ === "LBg") {
      return "Реално усещана температура, базирана на текущите температура, влажност, слънчева радиация и вятър.";
    } else if (_l_0.$ === "LCs") {
      return "Pocitová teplota na základě teploty, vlhkosti, slunce a větru.";
    } else if (_l_0.$ === "LSi") {
      return "Zaznana temperatura, ki temelji na temperaturi, vlagi, soncu in vetru.";
    } else if (_l_0.$ === "LFi") {
      return "Koettu lämpötila perustuu lämpötilaan, kosteuteen, aurinkoon ja tuuleen.";
    } else if (_l_0.$ === "LSv") {
      return "Upplevd temperatur, baserad på temperatur, fuktighet, sol och vind.";
    } else if (_l_0.$ === "LPt") {
      return "Temperatura aparente baseada na temperatura, humidade, sol e vento.";
    } else if (_l_0.$ === "LCa") {
      return "Temperatura percebuda en funció de la temperatura, l'humitat, el sol i el vent.";
    } else if (_l_0.$ === "LHr") {
      return "Percipirana temperatura na temelju temperature, vlažnosti, sunca i vjetra.";
    } else {
      return "Perceived temperature based on temperature, humidity, sun, and wind.";
    }
  } else if (_w_0.$ === "WTemperatureTitle") {
    if (_l_0.$ === "LDe") {
      return "Temperatur";
    } else if (_l_0.$ === "LNl") {
      return "Temperatuur";
    } else if (_l_0.$ === "LDa") {
      return "Temperatur";
    } else if (_l_0.$ === "LRo") {
      return "Temperatura";
    } else if (_l_0.$ === "LFr") {
      return "Température";
    } else if (_l_0.$ === "LGr") {
      return "Θερμοκρασία";
    } else if (_l_0.$ === "LIt") {
      return "Temperatura";
    } else if (_l_0.$ === "LEs") {
      return "Temperatura";
    } else if (_l_0.$ === "LNb") {
      return "Temperatur";
    } else if (_l_0.$ === "LBg") {
      return "Температура";
    } else if (_l_0.$ === "LCs") {
      return "Teplota";
    } else if (_l_0.$ === "LSi") {
      return "Temperatura";
    } else if (_l_0.$ === "LFi") {
      return "Lämpötila";
    } else if (_l_0.$ === "LSv") {
      return "Temperatur";
    } else if (_l_0.$ === "LPt") {
      return "Temperatura";
    } else if (_l_0.$ === "LCa") {
      return "Temperatura";
    } else if (_l_0.$ === "LHr") {
      return "Temperatura";
    } else {
      return "Temperature";
    }
  } else if (_w_0.$ === "WTemperatureDescription") {
    if (_l_0.$ === "LDe") {
      return "Aktuelle Lufttemperatur.\nBlau: Min. Tagestemperatur.\nRot: Max. Tagestemperatur.";
    } else if (_l_0.$ === "LNl") {
      return "Huidige luchttemperatuur. \nBlauw: Minimum dagelijkse temperatuur. \nRood: Maximum dagelijkse temperatuur.";
    } else if (_l_0.$ === "LDa") {
      return "Aktuel lufttemperatur. \nBlå: Laveste daglige temperatur.\nRød: Højeste daglige temperatur.";
    } else if (_l_0.$ === "LRo") {
      return "Temperatura aerului curent.\nAlbastru: temperatura zilnică minimă.\nRosu: Temperatura zilnică maximă.";
    } else if (_l_0.$ === "LFr") {
      return "Température actuelle de l'air.\nBleu : Température la plus basse du jour.\nRouge : Température la plus haute du jour.";
    } else if (_l_0.$ === "LGr") {
      return "Τρέχουσα θερμοκρασία αέρα.\nΜπλε: Χαμηλή ημερήσια θερμοκρασία.\nκόκκινος: Υψηλή ημερήσια θερμοκρασία.";
    } else if (_l_0.$ === "LIt") {
      return "Temperatura dell'aria attuale.\nBlu: temperatura giornaliera bassa.\nRosso: temperatura giornaliera elevata.";
    } else if (_l_0.$ === "LEs") {
      return "Temperatura del aire actual.\nAzul: temperatura diaria minima.\nRojo: temperatura diaria máxima.";
    } else if (_l_0.$ === "LNb") {
      return "Gjeldene temperatur.\nBlå: Lavest måling i dag.\nRød: Høyest måling i dag.";
    } else if (_l_0.$ === "LBg") {
      return "Текуща температура на въздуха.\nСиньо: Минимална температура за деня.\nЧервено: Максимална температура за деня.";
    } else if (_l_0.$ === "LCs") {
      return "Aktuální teplota vzduchu.\nModrá: Nejnižší denní teplota.\nČervené: Nejvyšší denní teplota.";
    } else if (_l_0.$ === "LSi") {
      return "Trenutna temperatura zraka. \nModra: nizka dnevna temperatura. \nRdeča: visoka dnevna temperatura.";
    } else if (_l_0.$ === "LFi") {
      return "Tämänhetkinen ilman lämpötila.\nSininen: Päivän alin lämpötila.\nPunainen: Päivän ylin lämpötila.";
    } else if (_l_0.$ === "LSv") {
      return "Aktuell temperatur.\nBlå: Lägsta dagliga temperatur. \nRöd: Högsta dagliga temperatur.";
    } else if (_l_0.$ === "LPt") {
      return "Temperatura do ar atual.\nAzul: Temperatura diária mínima.\nVermelho: Temperatura diária máxima.";
    } else if (_l_0.$ === "LCa") {
      return "Temperatura de l'aire actual.\nBlau: temperatura diària mínima.\nVermell: temperatura diària màxima.";
    } else if (_l_0.$ === "LHr") {
      return "Trenutna temperatura zraka.\nPlavo: Niska dnevna temperatura.\nCrveno: Visoka dnevna temperatura.";
    } else {
      return "Current air temperature.\nBlue: Low daily temperature.\nRed: High daily temperature.";
    }
  } else if (_w_0.$ === "WBarometerSteady") {
    if (_l_0.$ === "LDe") {
      return "gleichbleibend";
    } else if (_l_0.$ === "LNl") {
      return "Bestendig";
    } else if (_l_0.$ === "LDa") {
      return "Stabil";
    } else if (_l_0.$ === "LRo") {
      return "Constantă";
    } else if (_l_0.$ === "LFr") {
      return "Stable";
    } else if (_l_0.$ === "LGr") {
      return "Σταθερά";
    } else if (_l_0.$ === "LIt") {
      return "Costante";
    } else if (_l_0.$ === "LEs") {
      return "Estable";
    } else if (_l_0.$ === "LNb") {
      return "Stabil";
    } else if (_l_0.$ === "LBg") {
      return "Застой";
    } else if (_l_0.$ === "LCs") {
      return "Stabilní";
    } else if (_l_0.$ === "LSi") {
      return "Stabilno";
    } else if (_l_0.$ === "LFi") {
      return "Vakaa";
    } else if (_l_0.$ === "LSv") {
      return "Stabil";
    } else if (_l_0.$ === "LPt") {
      return "Estável";
    } else if (_l_0.$ === "LCa") {
      return "Estable";
    } else if (_l_0.$ === "LHr") {
      return "Stabilan";
    } else {
      return "Steady";
    }
  } else if (_w_0.$ === "WBarometerRate") {
    if (_l_0.$ === "LDe") {
      return "Rate";
    } else if (_l_0.$ === "LNl") {
      return "Trend";
    } else if (_l_0.$ === "LDa") {
      return "Hastighed";
    } else if (_l_0.$ === "LRo") {
      return "Rata";
    } else if (_l_0.$ === "LFr") {
      return "Tendance";
    } else if (_l_0.$ === "LGr") {
      return "Τιμή";
    } else if (_l_0.$ === "LIt") {
      return "Vota";
    } else if (_l_0.$ === "LEs") {
      return "Velocidad";
    } else if (_l_0.$ === "LNb") {
      return "Endring";
    } else if (_l_0.$ === "LBg") {
      return "Тренд";
    } else if (_l_0.$ === "LCs") {
      return "Změna";
    } else if (_l_0.$ === "LSi") {
      return "Razmerje";
    } else if (_l_0.$ === "LFi") {
      return "Nopeus";
    } else if (_l_0.$ === "LSv") {
      return "Hastighet";
    } else if (_l_0.$ === "LPt") {
      return "Variação";
    } else if (_l_0.$ === "LCa") {
      return "Velocitat";
    } else if (_l_0.$ === "LHr") {
      return "Trend";
    } else {
      return "Rate";
    }
  } else if (_w_0.$ === "WBarometerTitle") {
    if (_l_0.$ === "LDe") {
      return "Barometer";
    } else if (_l_0.$ === "LNl") {
      return "Barometer";
    } else if (_l_0.$ === "LDa") {
      return "Barometer";
    } else if (_l_0.$ === "LRo") {
      return "Barometrul";
    } else if (_l_0.$ === "LFr") {
      return "Baromètre";
    } else if (_l_0.$ === "LGr") {
      return "Βαρόμετρο";
    } else if (_l_0.$ === "LIt") {
      return "Barometro";
    } else if (_l_0.$ === "LEs") {
      return "Barometro";
    } else if (_l_0.$ === "LNb") {
      return "Barometer";
    } else if (_l_0.$ === "LBg") {
      return "Барометър";
    } else if (_l_0.$ === "LCs") {
      return "Tlakoměr";
    } else if (_l_0.$ === "LSi") {
      return "Barometer";
    } else if (_l_0.$ === "LFi") {
      return "Ilmanpaine";
    } else if (_l_0.$ === "LSv") {
      return "Barometer";
    } else if (_l_0.$ === "LPt") {
      return "Barómetro";
    } else if (_l_0.$ === "LCa") {
      return "Baròmetre";
    } else if (_l_0.$ === "LHr") {
      return "Barometar";
    } else {
      return "Barometer";
    }
  } else if (_w_0.$ === "WBarometerDescription") {
    if (_l_0.$ === "LDe") {
      return "Der Luftdruck,angepasst an die Höhe der Station.";
    } else if (_l_0.$ === "LNl") {
      return "Het gewicht van de lucht, aangepast naar de hoogte van het weerstation.";
    } else if (_l_0.$ === "LDa") {
      return "Luftens vægt, justeret efter vejrstationens højde";
    } else if (_l_0.$ === "LRo") {
      return "Greutatea aerului, ajustată la altitudinea stației.";
    } else if (_l_0.$ === "LFr") {
      return "Le poids de l'air, ajusté pour l'altitude de la station.";
    } else if (_l_0.$ === "LGr") {
      return "Το βάρος του αέρα, προσαρμοσμένο στο υψόμετρο του σταθμού.";
    } else if (_l_0.$ === "LIt") {
      return "Il peso dell'aria, regolato per l'altitudine della stazione.";
    } else if (_l_0.$ === "LEs") {
      return "El peso del aire, ajustado para la altitud de la estación.";
    } else if (_l_0.$ === "LNb") {
      return "Vekten av luften, justert for stasjonens høyde.";
    } else if (_l_0.$ === "LBg") {
      return "Атмосферно налягане, коригирано спрямо височината на станцията (приведено).";
    } else if (_l_0.$ === "LCs") {
      return "Tlak vzduchu, přizpůsobený nadmořské výšce stanice.";
    } else if (_l_0.$ === "LSi") {
      return "Teža zraka, prilagojena višini postaje.";
    } else if (_l_0.$ === "LFi") {
      return "Ilmanpaine perustuen sääaseman korkeuteen merenpinnasta.";
    } else if (_l_0.$ === "LSv") {
      return "Lufttrycket baserat på väderstationens höjd över havet.";
    } else if (_l_0.$ === "LPt") {
      return "O peso do ar, ajustado à altitude da estação.";
    } else if (_l_0.$ === "LCa") {
      return "El pes de l'aire, ajustat per a l'altitud de l'estació.";
    } else if (_l_0.$ === "LHr") {
      return "Tlak zraka, podešen na visinu postaje.";
    } else {
      return "The weight of the air, adjusted for the station's altitude.";
    }
  } else if (_w_0.$ === "WWindchillTitle") {
    if (_l_0.$ === "LDe") {
      return "Windchill";
    } else if (_l_0.$ === "LNl") {
      return "Gevoelstemperatuur";
    } else if (_l_0.$ === "LDa") {
      return "Kuldeindeks";
    } else if (_l_0.$ === "LRo") {
      return "Vânt tăios";
    } else if (_l_0.$ === "LFr") {
      return "Facteur vent";
    } else if (_l_0.$ === "LGr") {
      return "Δείκτης Ψύχρας";
    } else if (_l_0.$ === "LIt") {
      return "Percepita";
    } else if (_l_0.$ === "LEs") {
      return "Escalofríos";
    } else if (_l_0.$ === "LNb") {
      return "Vind faktor";
    } else if (_l_0.$ === "LBg") {
      return "Уиндчил";
    } else if (_l_0.$ === "LCs") {
      return "Faktor větru";
    } else if (_l_0.$ === "LSi") {
      return "Hladen veter";
    } else if (_l_0.$ === "LFi") {
      return "Tuulen hyytävyys";
    } else if (_l_0.$ === "LSv") {
      return "Köldindex";
    } else if (_l_0.$ === "LPt") {
      return "Índice de frio";
    } else if (_l_0.$ === "LCa") {
      return "Sensació";
    } else if (_l_0.$ === "LHr") {
      return "Hladan vjetar";
    } else {
      return "Windchill";
    }
  } else if (_w_0.$ === "WWindchillDescription") {
    if (_l_0.$ === "LDe") {
      return "Gefühlte Kälte. Berechnet durch Kombination von Temperatur und Windgeschwindigkeit.";
    } else if (_l_0.$ === "LNl") {
      return "Hoe koud het daadwerkelijk aanvoelt. Wordt berekend door een combinatie van temperatuur en windsnelheid.";
    } else if (_l_0.$ === "LDa") {
      return "Hvor koldt det føles. Beregnet ved at kombinere temperatur og vindhastighed.";
    } else if (_l_0.$ === "LRo") {
      return "Cât de frig se simte de fapt. Se calculează prin combinarea temperaturii și a vitezei vântului.";
    } else if (_l_0.$ === "LFr") {
      return "C'est la sensation de froid ressentie. Calculée en combinant la température actuelle et la vitesse du vent.";
    } else if (_l_0.$ === "LGr") {
      return "Πόσο κρύο αισθάνεται πραγματικά. Υπολογίζεται συνδυάζοντας τη θερμότητα και την ταχύτητα του ανέμου.";
    } else if (_l_0.$ === "LIt") {
      return "Come fa veramente freddo, calcolato combinando il calore e la velocità del vento.";
    } else if (_l_0.$ === "LEs") {
      return "Qué frío se siente realmente. Calculado combinando el calor y la velocidad del viento.";
    } else if (_l_0.$ === "LNb") {
      return "Hvor kaldt det føles. Beregnet ut fra temperatur og vindhastighet.";
    } else if (_l_0.$ === "LBg") {
      return "Колко студено се усеща реално. Изчислено чрез комбиниране на температурата и скоростта на вятъра.";
    } else if (_l_0.$ === "LCs") {
      return "Jak je teplota skutečně vnímána. Vypočítá se kombinací teploty a rychlosti větru.";
    } else if (_l_0.$ === "LSi") {
      return "Kako hladno se dejansko počuti. Izračunano s kombinacijo toplote in hitrosti vetra.";
    } else if (_l_0.$ === "LFi") {
      return "Koettu lämpötila lasketaan yhdistämällä lämpötila ja tuulen nopeus.";
    } else if (_l_0.$ === "LSv") {
      return "Upplevd temperatur. Baserad på en kombination av temperatur och vindhastighet.";
    } else if (_l_0.$ === "LPt") {
      return "Temperatura percetível. Calculado combinando a temperatura e a velocidade do vento.";
    } else if (_l_0.$ === "LCa") {
      return "Quin fred se sent realment. Calculat combinant el calor y la velocitat del vent.";
    } else if (_l_0.$ === "LHr") {
      return "Koliko je zapravo hladno. Izračunato kombinacijom topline i brzine vjetra.";
    } else {
      return "How cold it actually feels. Calculated by combining heat and wind speed.";
    }
  } else if (_w_0.$ === "WHumidityTitle") {
    if (_l_0.$ === "LDe") {
      return "Luftfeuchtigkeit";
    } else if (_l_0.$ === "LNl") {
      return "Vochtigheid";
    } else if (_l_0.$ === "LDa") {
      return "Luftfugtighed";
    } else if (_l_0.$ === "LRo") {
      return "Umiditatea";
    } else if (_l_0.$ === "LFr") {
      return "Humidité";
    } else if (_l_0.$ === "LGr") {
      return "Υγρασία";
    } else if (_l_0.$ === "LIt") {
      return "Umidità";
    } else if (_l_0.$ === "LEs") {
      return "Humedad";
    } else if (_l_0.$ === "LNb") {
      return "Fuktighet";
    } else if (_l_0.$ === "LBg") {
      return "Отн. влажност";
    } else if (_l_0.$ === "LCs") {
      return "Vlhkost";
    } else if (_l_0.$ === "LSi") {
      return "Vlažnosr";
    } else if (_l_0.$ === "LFi") {
      return "Ilman kosteus";
    } else if (_l_0.$ === "LSv") {
      return "Luftfuktighet";
    } else if (_l_0.$ === "LPt") {
      return "Humidade";
    } else if (_l_0.$ === "LCa") {
      return "Humitat";
    } else if (_l_0.$ === "LHr") {
      return "Vlažnost";
    } else {
      return "Humidity";
    }
  } else if (_w_0.$ === "WHumidityDescription") {
    if (_l_0.$ === "LDe") {
      return "Die Menge an Wasserdampf in der Luft als Prozentsatz der Menge, die die Luft aufnehmen kann.";
    } else if (_l_0.$ === "LNl") {
      return "De hoeveelheid verdampt water in de lucht als een percentage van de hoeveelheid lucht dat in staat is om vocht vast te houden.";
    } else if (_l_0.$ === "LDa") {
      return "Mængden af vanddamp i luften som en procent af den mængde luften er i stand til at indeholde";
    } else if (_l_0.$ === "LRo") {
      return "Cantitatea de vapori de apă din aer ca procent din cantitatea de aer care poate fi menținută.";
    } else if (_l_0.$ === "LFr") {
      return "La quantité de vapeur d'eau dans l'air en pourcentage de la quantité que l'air est capable de contenir.";
    } else if (_l_0.$ === "LGr") {
      return "Η ποσότητα υδρατμών στον αέρα ως ποσοστό της ποσότητας που μπορεί να συγκρατήσει ο αέρας.";
    } else if (_l_0.$ === "LIt") {
      return "La quantità di vapore acqueo nell'aria in percentuale della quantità di aria che è in grado di trattenere.";
    } else if (_l_0.$ === "LEs") {
      return "La cantidad de vapor de agua en el aire como un porcentaje de la cantidad que el aire es capaz de contener.";
    } else if (_l_0.$ === "LNb") {
      return "En prosentandel av mengden vanndamp luften kan holde.";
    } else if (_l_0.$ === "LBg") {
      return "Относителна влажност: Количеството водна пара във въздуха като процент от максимално възможното при тази температура.";
    } else if (_l_0.$ === "LCs") {
      return "Množství vodní páry ve vzduchu jako procento max. množství, které může vzduch obsahovat.";
    } else if (_l_0.$ === "LSi") {
      return "Količina vodne pare v zraku kot odstotek količine, ki jo lahko zadrži zrak.";
    } else if (_l_0.$ === "LFi") {
      return "Ilman kosteus on prosentuaalinen vesihöyryn määrä siitä määrästä, joka ilmassa enintään voi vallitsevassa lämpötilassa olla.";
    } else if (_l_0.$ === "LSv") {
      return "Luftfuktighet är ett mått på mängden eller andelen vattenånga som finns i luften.";
    } else if (_l_0.$ === "LPt") {
      return "A quantidade de vapor de água no ar, como percentagem do total passível de ser retido pelo ar à temperatura atual.";
    } else if (_l_0.$ === "LCa") {
      return "La quantitat de vapor d'aigua en l'aire com a percentatge de la quantitat que l'aire es capaç de contenir.";
    } else if (_l_0.$ === "LHr") {
      return "Količina vodene pare u zraku kao postotak količine koju zrak može zadržati.";
    } else {
      return "The amount of water vapour in the air as a percentage of the amount the air is capable of holding.";
    }
  } else if (_w_0.$ === "WMoonSunRise") {
    if (_l_0.$ === "LDe") {
      return "Aufgang";
    } else if (_l_0.$ === "LNl") {
      return "Opkomst";
    } else if (_l_0.$ === "LDa") {
      return "Opgang";
    } else if (_l_0.$ === "LRo") {
      return "Răsărit de soare";
    } else if (_l_0.$ === "LFr") {
      return "Lever";
    } else if (_l_0.$ === "LGr") {
      return "Ανατολή Ηλίου";
    } else if (_l_0.$ === "LIt") {
      return "Alba";
    } else if (_l_0.$ === "LEs") {
      return "Amanecer";
    } else if (_l_0.$ === "LNb") {
      return "Opp";
    } else if (_l_0.$ === "LBg") {
      return "Изгрев";
    } else if (_l_0.$ === "LCs") {
      return "Východ";
    } else if (_l_0.$ === "LSi") {
      return "Vzhod";
    } else if (_l_0.$ === "LFi") {
      return "Nousu";
    } else if (_l_0.$ === "LSv") {
      return "Uppgång";
    } else if (_l_0.$ === "LPt") {
      return "Nascer";
    } else if (_l_0.$ === "LCa") {
      return "Sortida";
    } else if (_l_0.$ === "LHr") {
      return "Izlazak";
    } else {
      return "Rise";
    }
  } else if (_w_0.$ === "WMoonSunSet") {
    if (_l_0.$ === "LDe") {
      return "Untergang";
    } else if (_l_0.$ === "LNl") {
      return "Ondergang";
    } else if (_l_0.$ === "LDa") {
      return "Nedgang";
    } else if (_l_0.$ === "LRo") {
      return "Apus";
    } else if (_l_0.$ === "LFr") {
      return "Coucher";
    } else if (_l_0.$ === "LGr") {
      return "Δύση Ηλίου";
    } else if (_l_0.$ === "LIt") {
      return "Tramonto";
    } else if (_l_0.$ === "LEs") {
      return "Puesta";
    } else if (_l_0.$ === "LNb") {
      return "Ned";
    } else if (_l_0.$ === "LBg") {
      return "Залез";
    } else if (_l_0.$ === "LCs") {
      return "Západ";
    } else if (_l_0.$ === "LSi") {
      return "Zahod";
    } else if (_l_0.$ === "LFi") {
      return "Lasku";
    } else if (_l_0.$ === "LSv") {
      return "Nedgång";
    } else if (_l_0.$ === "LPt") {
      return "Pôr";
    } else if (_l_0.$ === "LCa") {
      return "Posta";
    } else if (_l_0.$ === "LHr") {
      return "Zalazak";
    } else {
      return "Set";
    }
  } else if (_w_0.$ === "WMoonSunPhase") {
    if (_l_0.$ === "LDe") {
      return "Phase";
    } else if (_l_0.$ === "LNl") {
      return "Fase";
    } else if (_l_0.$ === "LDa") {
      return "Fase";
    } else if (_l_0.$ === "LRo") {
      return "Faza";
    } else if (_l_0.$ === "LFr") {
      return "Phase";
    } else if (_l_0.$ === "LGr") {
      return "Φάση";
    } else if (_l_0.$ === "LIt") {
      return "Fase";
    } else if (_l_0.$ === "LEs") {
      return "Fase";
    } else if (_l_0.$ === "LNb") {
      return "Fase";
    } else if (_l_0.$ === "LBg") {
      return "Фаза";
    } else if (_l_0.$ === "LCs") {
      return "Fáze";
    } else if (_l_0.$ === "LSi") {
      return "Faza";
    } else if (_l_0.$ === "LFi") {
      return "Vaihe";
    } else if (_l_0.$ === "LSv") {
      return "Fas";
    } else if (_l_0.$ === "LPt") {
      return "Fase";
    } else if (_l_0.$ === "LCa") {
      return "Fase";
    } else if (_l_0.$ === "LHr") {
      return "Faza";
    } else {
      return "Phase";
    }
  } else if (_w_0.$ === "WMoonSunAge") {
    if (_l_0.$ === "LDe") {
      return "Alter";
    } else if (_l_0.$ === "LNl") {
      return "Leeftijd";
    } else if (_l_0.$ === "LDa") {
      return "Alder";
    } else if (_l_0.$ === "LRo") {
      return "Vârsta";
    } else if (_l_0.$ === "LFr") {
      return "Age";
    } else if (_l_0.$ === "LGr") {
      return "ηλικία";
    } else if (_l_0.$ === "LIt") {
      return "Età";
    } else if (_l_0.$ === "LEs") {
      return "Edad";
    } else if (_l_0.$ === "LNb") {
      return "Alder";
    } else if (_l_0.$ === "LBg") {
      return "Възраст";
    } else if (_l_0.$ === "LCs") {
      return "Stáří";
    } else if (_l_0.$ === "LSi") {
      return "Starost";
    } else if (_l_0.$ === "LFi") {
      return "Ikä";
    } else if (_l_0.$ === "LSv") {
      return "Ålder";
    } else if (_l_0.$ === "LPt") {
      return "Dias";
    } else if (_l_0.$ === "LCa") {
      return "Edat";
    } else if (_l_0.$ === "LHr") {
      return "Dob";
    } else {
      return "Age";
    }
  } else if (_w_0.$ === "WMoonSunTitleSun") {
    if (_l_0.$ === "LDe") {
      return "Sonne";
    } else if (_l_0.$ === "LNl") {
      return "Zon";
    } else if (_l_0.$ === "LDa") {
      return "Sol";
    } else if (_l_0.$ === "LRo") {
      return "Soarele";
    } else if (_l_0.$ === "LFr") {
      return "Soleil";
    } else if (_l_0.$ === "LGr") {
      return "Ήλιος";
    } else if (_l_0.$ === "LIt") {
      return "Sole";
    } else if (_l_0.$ === "LEs") {
      return "Sol";
    } else if (_l_0.$ === "LNb") {
      return "Sol";
    } else if (_l_0.$ === "LBg") {
      return "Cлънце";
    } else if (_l_0.$ === "LCs") {
      return "Slunce";
    } else if (_l_0.$ === "LSi") {
      return "Sonce";
    } else if (_l_0.$ === "LFi") {
      return "Aurinko";
    } else if (_l_0.$ === "LSv") {
      return "Sol";
    } else if (_l_0.$ === "LPt") {
      return "Sol";
    } else if (_l_0.$ === "LCa") {
      return "Sol";
    } else if (_l_0.$ === "LHr") {
      return "Sunce";
    } else {
      return "Sun";
    }
  } else if (_w_0.$ === "WMoonSunTitleMoon") {
    if (_l_0.$ === "LDe") {
      return "Mond";
    } else if (_l_0.$ === "LNl") {
      return "Maan";
    } else if (_l_0.$ === "LDa") {
      return "Måne";
    } else if (_l_0.$ === "LRo") {
      return "Luna";
    } else if (_l_0.$ === "LFr") {
      return "Lune";
    } else if (_l_0.$ === "LGr") {
      return "Σελήνη";
    } else if (_l_0.$ === "LIt") {
      return "Luna";
    } else if (_l_0.$ === "LEs") {
      return "Luna";
    } else if (_l_0.$ === "LNb") {
      return "Måne";
    } else if (_l_0.$ === "LBg") {
      return "Луна";
    } else if (_l_0.$ === "LCs") {
      return "Měsíc";
    } else if (_l_0.$ === "LSi") {
      return "Luna";
    } else if (_l_0.$ === "LFi") {
      return "Kuu";
    } else if (_l_0.$ === "LSv") {
      return "Måne";
    } else if (_l_0.$ === "LPt") {
      return "Lua";
    } else if (_l_0.$ === "LCa") {
      return "Lluna";
    } else if (_l_0.$ === "LHr") {
      return "Mjesec";
    } else {
      return "Moon";
    }
  } else if (_w_0.$ === "WSolarTitle") {
    if (_l_0.$ === "LDe") {
      return "Solar";
    } else if (_l_0.$ === "LNl") {
      return "Zonkracht";
    } else if (_l_0.$ === "LDa") {
      return "Solindstråling";
    } else if (_l_0.$ === "LRo") {
      return "Solar";
    } else if (_l_0.$ === "LFr") {
      return "Solaire";
    } else if (_l_0.$ === "LGr") {
      return "Ηλιακός";
    } else if (_l_0.$ === "LIt") {
      return "Solare";
    } else if (_l_0.$ === "LEs") {
      return "Solar";
    } else if (_l_0.$ === "LNb") {
      return "Solstråling";
    } else if (_l_0.$ === "LBg") {
      return "Солар";
    } else if (_l_0.$ === "LCs") {
      return "Sluneční svit";
    } else if (_l_0.$ === "LSi") {
      return "Sončna energija";
    } else if (_l_0.$ === "LFi") {
      return "Aurinko";
    } else if (_l_0.$ === "LSv") {
      return "Solstrålning";
    } else if (_l_0.$ === "LPt") {
      return "Solar";
    } else if (_l_0.$ === "LCa") {
      return "Solar";
    } else if (_l_0.$ === "LHr") {
      return "Sunčeva energija";
    } else {
      return "Solar";
    }
  } else if (_w_0.$ === "WSolarSunHours") {
    if (_l_0.$ === "LDe") {
      return "Sonnenstunden";
    } else if (_l_0.$ === "LNl") {
      return "Zonuren";
    } else if (_l_0.$ === "LDa") {
      return "Solskinstimer";
    } else if (_l_0.$ === "LRo") {
      return "Ore însorite";
    } else if (_l_0.$ === "LFr") {
      return "Heures du soleil";
    } else if (_l_0.$ === "LGr") {
      return "Ώρες Κυρ";
    } else if (_l_0.$ === "LIt") {
      return "Ore di sole";
    } else if (_l_0.$ === "LEs") {
      return "Horas de sol";
    } else if (_l_0.$ === "LNb") {
      return "Sol timer";
    } else if (_l_0.$ === "LBg") {
      return "Сл. часове";
    } else if (_l_0.$ === "LCs") {
      return "Doba svitu slunce";
    } else if (_l_0.$ === "LSi") {
      return "Sončev čas";
    } else if (_l_0.$ === "LFi") {
      return "Auringonpaiste";
    } else if (_l_0.$ === "LSv") {
      return "Soltimmar";
    } else if (_l_0.$ === "LPt") {
      return "Horas de sol";
    } else if (_l_0.$ === "LCa") {
      return "Hores de Sol";
    } else if (_l_0.$ === "LHr") {
      return "Sunčani sati";
    } else {
      return "Sun Hours";
    }
  } else if (_w_0.$ === "WSolarDescription") {
    if (_l_0.$ === "LDe") {
      return "Die Intensität der Sonnenstrahlung.";
    } else if (_l_0.$ === "LNl") {
      return "De intensiteit van de straling van de zon.";
    } else if (_l_0.$ === "LDa") {
      return "Intensiteten af solens stråler";
    } else if (_l_0.$ === "LRo") {
      return "Intensitatea radiației solare.";
    } else if (_l_0.$ === "LFr") {
      return "L'intensité du rayonnement solaire";
    } else if (_l_0.$ === "LGr") {
      return "Η ένταση της ακτινοβολίας του ήλιου.";
    } else if (_l_0.$ === "LIt") {
      return "L'intensità della radiazione solare.";
    } else if (_l_0.$ === "LEs") {
      return "La intensidad de la radiación del sol.";
    } else if (_l_0.$ === "LNb") {
      return "Intensiteten av solens stråling.";
    } else if (_l_0.$ === "LBg") {
      return "Интензитет на слънчевата радиация.";
    } else if (_l_0.$ === "LCs") {
      return "Intenzita slunečního záření.";
    } else if (_l_0.$ === "LSi") {
      return "Intenzivnost sončnega sevanja.";
    } else if (_l_0.$ === "LFi") {
      return "Auringon säteilyn voimakkuus.";
    } else if (_l_0.$ === "LSv") {
      return "Solintensitet.";
    } else if (_l_0.$ === "LPt") {
      return "A intensidade da radiação solar.";
    } else if (_l_0.$ === "LCa") {
      return "La intensitat de la radiació del Sol.";
    } else if (_l_0.$ === "LHr") {
      return "Intenzitet sunčevog zračenja.";
    } else {
      return "The intensity of the sun's radiation.";
    }
  } else if (_w_0.$ === "WStatusNoDataSince") {
    if (_l_0.$ === "LDe") {
      return "keine Daten seit";
    } else if (_l_0.$ === "LNl") {
      return "Geen data sinds";
    } else if (_l_0.$ === "LDa") {
      return "Ingen data siden";
    } else if (_l_0.$ === "LRo") {
      return "Nu există date încă";
    } else if (_l_0.$ === "LFr") {
      return "Aucune donnée depuis";
    } else if (_l_0.$ === "LGr") {
      return "Δεν υπάρχουν δεδομένα από τότε";
    } else if (_l_0.$ === "LIt") {
      return "Nessun dato da";
    } else if (_l_0.$ === "LEs") {
      return "Sin datos desde";
    } else if (_l_0.$ === "LNb") {
      return "Ingen data siden";
    } else if (_l_0.$ === "LBg") {
      return "Няма данни от";
    } else if (_l_0.$ === "LCs") {
      return "Žádné údaje od té doby";
    } else if (_l_0.$ === "LSi") {
      return "Ni podatkov od";
    } else if (_l_0.$ === "LFi") {
      return "Ei tietoja sitten";
    } else if (_l_0.$ === "LSv") {
      return "Ingen data sedan";
    } else if (_l_0.$ === "LPt") {
      return "Sem dados desde";
    } else if (_l_0.$ === "LCa") {
      return "Sense dades des de";
    } else if (_l_0.$ === "LHr") {
      return "Nema podataka od";
    } else {
      return "No data since";
    }
  } else if (_w_0.$ === "WStatusDataAt") {
    if (_l_0.$ === "LDe") {
      return "Letzte Daten empfangen am";
    } else if (_l_0.$ === "LNl") {
      return "Laatste data ontvangen op";
    } else if (_l_0.$ === "LDa") {
      return "Sidste opdatering kl.";
    } else if (_l_0.$ === "LRo") {
      return "Ultimele date primite la";
    } else if (_l_0.$ === "LFr") {
      return "Dernières données reçues à";
    } else if (_l_0.$ === "LGr") {
      return "Τα τελευταία δεδομένα που ελήφθησαν στο";
    } else if (_l_0.$ === "LIt") {
      return "Ultimi dati ricevuti a";
    } else if (_l_0.$ === "LEs") {
      return "Últimos datos recibidos en";
    } else if (_l_0.$ === "LNb") {
      return "Sist oppdatert";
    } else if (_l_0.$ === "LBg") {
      return "Последни данни получени в";
    } else if (_l_0.$ === "LCs") {
      return "Nejnovější hodnoty získané ze stanice";
    } else if (_l_0.$ === "LSi") {
      return "Najnovejši podatki, prejeti ob";
    } else if (_l_0.$ === "LFi") {
      return "Viimeisimmät tiedot vastaanotettu";
    } else if (_l_0.$ === "LSv") {
      return "Senaste uppdatering vid kl.";
    } else if (_l_0.$ === "LPt") {
      return "Últimos dados recebidos em";
    } else if (_l_0.$ === "LCa") {
      return "Últimes dades rebudes";
    } else if (_l_0.$ === "LHr") {
      return "Zadnji podaci primljeni u";
    } else {
      return "Latest data received at";
    }
  } else if (_w_0.$ === "WStatusDescription") {
    if (_l_0.$ === "LDe") {
      return "Grün: Neue Daten vom Server.\nGrau: Die Daten auf dem Server haben sich nicht geändert.\nGelb: Einige Fehler bei der Datenerfassung vom Server.\nRot: Es können keine Daten vom Server erfasst werden.";
    } else if (_l_0.$ === "LNl") {
      return "Groen: Nieuwe data ontvangen van server. \nGrijs: Data op server is niet veranderd. \nGeel: Een foutmelding tijdens de ontvangst van de data van de server. \nRood: Geen data beschikbaar om te ontvangen van de server.";
    } else if (_l_0.$ === "LDa") {
      return "Grøn: Friske data fra serveren.\nGrå: Data på serveren har ikke ændret sig.\nGul: Fejl under hentning af data fra serveren.\nRød: Ingen data fra serveren.";
    } else if (_l_0.$ === "LRo") {
      return "Verde: date noi colectate de pe server.\nVerde: datele de pe server nu s-au schimbat. \nGalben: Unele erori în timpul colectării de date de pe server.\nRosu: Nu există date care să poată fi colectate de pe server.";
    } else if (_l_0.$ === "LFr") {
      return "Vert : Nouvelles données collectées sur le serveur.\nGris : Les données sur le serveur n'ont pas changées.\nJaune : Erreur lors de la collecte des données du serveur.\nRouge : Aucune donnée ne peut être collectée sur le serveur.";
    } else if (_l_0.$ === "LGr") {
      return "Πράσινο: Νέα δεδομένα που έχουν συλλεχθεί από το διακομιστή.\nγκρί: Τα δεδομένα στο διακομιστή δεν έχουν αλλάξει.\nκίτρινος: Ορισμένα σφάλματα κατά τη συλλογή δεδομένων από το διακομιστή.\nκόκκινος: Δεν υπάρχουν δεδομένα που μπορούν να συλλεχθούν από το διακομιστή.";
    } else if (_l_0.$ === "LIt") {
      return "Verde: nuovi dati raccolti dal server.\nGrigio: i dati sul server non sono cambiati.\nGlialo: alcuni errori durante la raccolta dei dati dal server.\nRosso: nessun dato può essere raccolto dal server.";
    } else if (_l_0.$ === "LEs") {
      return "Verde: datos nuevos recopilados del servidor.\nGris: los datos en el servidor no han cambiado.\nAmarillo: algunos errores durante la recopilación de datos del servidor.\nRojo: no se pueden recopilar datos del servidor.";
    } else if (_l_0.$ === "LNb") {
      return "Grønn: Ny infomasjon er hentet fra værstasjon.\nGrå: Ingen forandringer.\nGul: Noen feil under datainnsamling fra værstasjon.\nRød: Ikke mulig å samle inn ny data fra værstasjon.";
    } else if (_l_0.$ === "LBg") {
      return "Зелено: Получени са нови данни от сървъра.\nСиво: Данните на сървъра не са се променили.\nЖълто: Грешка при получаването на данни от сървъра.\nЧервено: Невъзможност за получаване на данни от сървъра.";
    } else if (_l_0.$ === "LCs") {
      return "Zelená: Nová data načtená ze serveru.\nŠedá: Údaje na serveru se nezměnily.\nŽlutá: Některé chyby při sběru dat ze serveru.\nČervená: Žádné údaje nemohly být ze serveru načteny.";
    } else if (_l_0.$ === "LSi") {
      return "Zelena: novi podatki, zbrani s strežnika. \nSiva: Podatki na strežniku se niso spremenili. \nRumena: Nekatere napake med zbiranjem podatkov s strežnika. \nRdeča: Ni podatkov, ki bi jih bilo mogoče uporabiti s strežnika.";
    } else if (_l_0.$ === "LFi") {
      return "Vihreä: Viimeisimmät tiedot kerätty palvelimelta.\nHarmaa: Palvelimen tiedot eivät ole muuttuneet.\nKeltainen: Joitain virheitä kerätessä tietoja palvelimelta.\nPunainen: Tietoja ei voitu kerätä palvelimelta.";
    } else if (_l_0.$ === "LSv") {
      return "Grön: Ny data mottagen från servern. \nGrå: Ingen ändring av mottagen data från servern. \nGul: Fel uppstod vid hämtning av data från servern.\nRöd: Ingen data tillgänglig från servern.";
    } else if (_l_0.$ === "LPt") {
      return "Verde: Novos dados recolhidos do servidor.\nCinzento: Dados do servidor não alterados.\nAmarelo: Alguns erros durante a recolha de dados do servidor.\nVermelho: Não foi possível recolher dados do servidor.";
    } else if (_l_0.$ === "LCa") {
      return "Vert: dades noves recopilades del servidor.\nGris: les dades del servidor no han canviat.\nGroc: alguns errors durant la recopilació de dades del servidor.\nVermell: no es poden recopilar dades del servidor.";
    } else if (_l_0.$ === "LHr") {
      return "Zeleno: Novi podaci prikupljeni s poslužitelja.\nSivo: Podaci na poslužitelju nisu promijenjeni.\nŽuto: Neka pogreška tijekom prikupljanja podataka s poslužitelja.\nCrveno: Nema podataka koji se mogu prikupiti s poslužitelja.";
    } else {
      return "Green: New data collected from server.\nGrey: Data on server hasn't changed.\nYellow: Some error during data collection from server.\nRed: No data able to be collected from server.";
    }
  } else if (_w_0.$ === "WRainfallTitle") {
    if (_l_0.$ === "LDe") {
      return "Regen";
    } else if (_l_0.$ === "LNl") {
      return "Regen";
    } else if (_l_0.$ === "LDa") {
      return "Regn";
    } else if (_l_0.$ === "LRo") {
      return "Precipitaţii";
    } else if (_l_0.$ === "LFr") {
      return "Précipitations";
    } else if (_l_0.$ === "LGr") {
      return "Βροχή";
    } else if (_l_0.$ === "LIt") {
      return "Precipitazioni";
    } else if (_l_0.$ === "LEs") {
      return "Lluvia";
    } else if (_l_0.$ === "LNb") {
      return "Nedbør";
    } else if (_l_0.$ === "LBg") {
      return "Валежи";
    } else if (_l_0.$ === "LCs") {
      return "Srážky";
    } else if (_l_0.$ === "LSi") {
      return "Padavine";
    } else if (_l_0.$ === "LFi") {
      return "Sademäärä";
    } else if (_l_0.$ === "LSv") {
      return "Nederbörd";
    } else if (_l_0.$ === "LPt") {
      return "Pluviosidade";
    } else if (_l_0.$ === "LCa") {
      return "Pluja";
    } else if (_l_0.$ === "LHr") {
      return "Oborina";
    } else {
      return "Rainfall";
    }
  } else if (_w_0.$ === "WRainfallDailyTitle") {
    if (_l_0.$ === "LDe") {
      return "Täglicher";
    } else if (_l_0.$ === "LNl") {
      return "Vandaag";
    } else if (_l_0.$ === "LDa") {
      return "Daglig";
    } else if (_l_0.$ === "LRo") {
      return "Ziua";
    } else if (_l_0.$ === "LFr") {
      return "Jour";
    } else if (_l_0.$ === "LGr") {
      return "Καθημερινά";
    } else if (_l_0.$ === "LIt") {
      return "Quotidiano";
    } else if (_l_0.$ === "LEs") {
      return "Día";
    } else if (_l_0.$ === "LNb") {
      return "Dag";
    } else if (_l_0.$ === "LBg") {
      return "За деня";
    } else if (_l_0.$ === "LCs") {
      return "Denní";
    } else if (_l_0.$ === "LSi") {
      return "Dnevno";
    } else if (_l_0.$ === "LFi") {
      return "Päivän";
    } else if (_l_0.$ === "LSv") {
      return "Daglig";
    } else if (_l_0.$ === "LPt") {
      return "Diária";
    } else if (_l_0.$ === "LCa") {
      return "Dia";
    } else if (_l_0.$ === "LHr") {
      return "Današnja";
    } else {
      return "Daily";
    }
  } else if (_w_0.$ === "WRainfallMonthlyTitle") {
    if (_l_0.$ === "LDe") {
      return "Monatlicher";
    } else if (_l_0.$ === "LNl") {
      return "Deze Maand";
    } else if (_l_0.$ === "LDa") {
      return "Månedlig";
    } else if (_l_0.$ === "LRo") {
      return "Lunar";
    } else if (_l_0.$ === "LFr") {
      return "Mois";
    } else if (_l_0.$ === "LGr") {
      return "Μηνιαίος";
    } else if (_l_0.$ === "LIt") {
      return "Mensile";
    } else if (_l_0.$ === "LEs") {
      return "Mensual";
    } else if (_l_0.$ === "LNb") {
      return "Måned";
    } else if (_l_0.$ === "LBg") {
      return "Месечни";
    } else if (_l_0.$ === "LCs") {
      return "Měsíční";
    } else if (_l_0.$ === "LSi") {
      return "Mesečno";
    } else if (_l_0.$ === "LFi") {
      return "Kuukauden";
    } else if (_l_0.$ === "LSv") {
      return "Månatligt";
    } else if (_l_0.$ === "LPt") {
      return "Mensal";
    } else if (_l_0.$ === "LCa") {
      return "Mensual";
    } else if (_l_0.$ === "LHr") {
      return "Mjesečna";
    } else {
      return "Monthly";
    }
  } else if (_w_0.$ === "WRainfallAnnualTitle") {
    if (_l_0.$ === "LDe") {
      return "Jährlicher";
    } else if (_l_0.$ === "LNl") {
      return "Jaar Totaal";
    } else if (_l_0.$ === "LDa") {
      return "Årlig";
    } else if (_l_0.$ === "LRo") {
      return "Anual";
    } else if (_l_0.$ === "LFr") {
      return "Année";
    } else if (_l_0.$ === "LGr") {
      return "Ετήσιος";
    } else if (_l_0.$ === "LIt") {
      return "Annuale";
    } else if (_l_0.$ === "LEs") {
      return "Anual";
    } else if (_l_0.$ === "LNb") {
      return "År";
    } else if (_l_0.$ === "LBg") {
      return "Годишни";
    } else if (_l_0.$ === "LCs") {
      return "Roční";
    } else if (_l_0.$ === "LSi") {
      return "Letno";
    } else if (_l_0.$ === "LFi") {
      return "Vuoden";
    } else if (_l_0.$ === "LSv") {
      return "Årlig";
    } else if (_l_0.$ === "LPt") {
      return "Anual";
    } else if (_l_0.$ === "LCa") {
      return "Anual";
    } else if (_l_0.$ === "LHr") {
      return "Godišnji";
    } else {
      return "Annual";
    }
  } else if (_w_0.$ === "WUvTitle") {
    if (_l_0.$ === "LDe") {
      return "UV";
    } else if (_l_0.$ === "LNl") {
      return "UV";
    } else if (_l_0.$ === "LDa") {
      return "UV";
    } else if (_l_0.$ === "LRo") {
      return "UV";
    } else if (_l_0.$ === "LFr") {
      return "UV";
    } else if (_l_0.$ === "LGr") {
      return "UV";
    } else if (_l_0.$ === "LIt") {
      return "UV";
    } else if (_l_0.$ === "LEs") {
      return "UV";
    } else if (_l_0.$ === "LNb") {
      return "UV";
    } else if (_l_0.$ === "LBg") {
      return "UV";
    } else if (_l_0.$ === "LCs") {
      return "UV";
    } else if (_l_0.$ === "LSi") {
      return "UV";
    } else if (_l_0.$ === "LFi") {
      return "UV";
    } else if (_l_0.$ === "LSv") {
      return "UV";
    } else if (_l_0.$ === "LPt") {
      return "UV";
    } else if (_l_0.$ === "LCa") {
      return "UV";
    } else if (_l_0.$ === "LHr") {
      return "UV";
    } else {
      return "UV";
    }
  } else if (_w_0.$ === "WUvDescription") {
    if (_l_0.$ === "LDe") {
      return "Die Intensität der UV-Strahlung - 0-2 ist ein minimales Risiko für Hautschäden, während 8+ sehr hoch ist.";
    } else if (_l_0.$ === "LNl") {
      return "De intensiteit van de UV straling - 0-2 is een minimaal risico op huidschade terwijl 8+ een hoog risico vormt.";
    } else if (_l_0.$ === "LDa") {
      return "Intensiteten af UV stråling - 0-2 angiver minimal risiko for hudskader mens 8+ angiver meget høj risiko.";
    } else if (_l_0.$ === "LRo") {
      return "Intensitatea radiației UV - 0-2 reprezintă un risc minim de afectare a pielii, în timp ce 8+ este foarte mare.";
    } else if (_l_0.$ === "LFr") {
      return "L'intensité du rayonnement UV - 0 à 2 est un risque minime de dommages cutanés, tandis que 8 et + est très élevé.";
    } else if (_l_0.$ === "LGr") {
      return "Η ένταση της ακτινοβολίας UV - 0-2 είναι ο ελάχιστος κίνδυνος βλάβης του δέρματος ενώ το 8+ είναι πολύ υψηλό.";
    } else if (_l_0.$ === "LIt") {
      return "L'intensità della radiazione UV - 0-2 è il minimo rischio di danni alla pelle mentre 8+ è molto alta.";
    } else if (_l_0.$ === "LEs") {
      return "La intensidad de la radiación UV - 0-2 es un riesgo mínimo de daño a la piel, mientras que 8+ es muy alta.";
    } else if (_l_0.$ === "LNb") {
      return "Intensiteten til UV-stråling - 0-2 er minimal risiko for hudskade, mens 8+ er veldig høy.";
    } else if (_l_0.$ === "LBg") {
      return "Интензитет на UV радиацията - при 0-2 - минимален риск за увреждане на кожата, а при 8+ - много висок риск.";
    } else if (_l_0.$ === "LCs") {
      return "Intenzita UV záření - 0-2 představuje minimální riziko poškození kůže, zatímco 8+ je velmi vysoké riziko.";
    } else if (_l_0.$ === "LSi") {
      return "Intenzivnost UV sevanja - 0-2 je minimalna nevarnost poškodb kože, medtem ko je 8 + zelo visoka.";
    } else if (_l_0.$ === "LFi") {
      return "UV-säteilyn voimakkuus - 0-2 on vähäinen ihon vaurioituminen, kun taas 8+ on erittäin korkea.";
    } else if (_l_0.$ === "LSv") {
      return "Intensiteten av UV-strålningen. 0-2 = minimal risk för hudskador. Medan 8+ betyder hög risk för hudskador.";
    } else if (_l_0.$ === "LPt") {
      return "Intensidade de radiação Ultravioleta - 0 a 2 o risco de danos na pele é mínimo enquanto que mais de 8 é muito alto.";
    } else if (_l_0.$ === "LCa") {
      return "La intensitat de la radiació UV - 0-2 és un risc mínim de dany a la pell, mentre que 8+ és molt alta.";
    } else if (_l_0.$ === "LHr") {
      return "Intenzitet UV zračenja - 0-2 je minimalan rizik od opeklina kože dok je 8+ vrlo visok.";
    } else {
      return "The intensity of UV radiation - 0-2 is minimal risk of skin damage whilst 8+ is very high.";
    }
  } else if (_w_0.$ === "WWindDirectionLabelN") {
    if (_l_0.$ === "LDe") {
      return "N";
    } else if (_l_0.$ === "LNl") {
      return "N";
    } else if (_l_0.$ === "LDa") {
      return "N";
    } else if (_l_0.$ === "LRo") {
      return "N";
    } else if (_l_0.$ === "LFr") {
      return "N";
    } else if (_l_0.$ === "LGr") {
      return "B";
    } else if (_l_0.$ === "LIt") {
      return "N";
    } else if (_l_0.$ === "LEs") {
      return "N";
    } else if (_l_0.$ === "LNb") {
      return "N";
    } else if (_l_0.$ === "LBg") {
      return "С";
    } else if (_l_0.$ === "LCs") {
      return "S";
    } else if (_l_0.$ === "LSi") {
      return "S";
    } else if (_l_0.$ === "LFi") {
      return "Pohjoinen";
    } else if (_l_0.$ === "LSv") {
      return "N";
    } else if (_l_0.$ === "LPt") {
      return "N";
    } else if (_l_0.$ === "LCa") {
      return "N";
    } else if (_l_0.$ === "LHr") {
      return "S";
    } else {
      return "N";
    }
  } else if (_w_0.$ === "WWindDirectionLabelNE") {
    if (_l_0.$ === "LDe") {
      return "NO";
    } else if (_l_0.$ === "LNl") {
      return "NO";
    } else if (_l_0.$ === "LDa") {
      return "NØ";
    } else if (_l_0.$ === "LRo") {
      return "NE";
    } else if (_l_0.$ === "LFr") {
      return "NE";
    } else if (_l_0.$ === "LGr") {
      return "BA";
    } else if (_l_0.$ === "LIt") {
      return "NE";
    } else if (_l_0.$ === "LEs") {
      return "NE";
    } else if (_l_0.$ === "LNb") {
      return "NØ";
    } else if (_l_0.$ === "LBg") {
      return "СИ";
    } else if (_l_0.$ === "LCs") {
      return "SV";
    } else if (_l_0.$ === "LSi") {
      return "SV";
    } else if (_l_0.$ === "LFi") {
      return "Koillinen";
    } else if (_l_0.$ === "LSv") {
      return "NO";
    } else if (_l_0.$ === "LPt") {
      return "NE";
    } else if (_l_0.$ === "LCa") {
      return "NE";
    } else if (_l_0.$ === "LHr") {
      return "SI";
    } else {
      return "NE";
    }
  } else if (_w_0.$ === "WWindDirectionLabelE") {
    if (_l_0.$ === "LDe") {
      return "O";
    } else if (_l_0.$ === "LNl") {
      return "O";
    } else if (_l_0.$ === "LDa") {
      return "Ø";
    } else if (_l_0.$ === "LRo") {
      return "E";
    } else if (_l_0.$ === "LFr") {
      return "E";
    } else if (_l_0.$ === "LGr") {
      return "A";
    } else if (_l_0.$ === "LIt") {
      return "E";
    } else if (_l_0.$ === "LEs") {
      return "E";
    } else if (_l_0.$ === "LNb") {
      return "Ø";
    } else if (_l_0.$ === "LBg") {
      return "И";
    } else if (_l_0.$ === "LCs") {
      return "V";
    } else if (_l_0.$ === "LSi") {
      return "V";
    } else if (_l_0.$ === "LFi") {
      return "Itä";
    } else if (_l_0.$ === "LSv") {
      return "Ö";
    } else if (_l_0.$ === "LPt") {
      return "E";
    } else if (_l_0.$ === "LCa") {
      return "E";
    } else if (_l_0.$ === "LHr") {
      return "I";
    } else {
      return "E";
    }
  } else if (_w_0.$ === "WWindDirectionLabelSE") {
    if (_l_0.$ === "LDe") {
      return "SO";
    } else if (_l_0.$ === "LNl") {
      return "ZO";
    } else if (_l_0.$ === "LDa") {
      return "SØ";
    } else if (_l_0.$ === "LRo") {
      return "SE";
    } else if (_l_0.$ === "LFr") {
      return "SE";
    } else if (_l_0.$ === "LGr") {
      return "NA";
    } else if (_l_0.$ === "LIt") {
      return "SE";
    } else if (_l_0.$ === "LEs") {
      return "SE";
    } else if (_l_0.$ === "LNb") {
      return "SØ";
    } else if (_l_0.$ === "LBg") {
      return "ЮИ";
    } else if (_l_0.$ === "LCs") {
      return "JV";
    } else if (_l_0.$ === "LSi") {
      return "JV";
    } else if (_l_0.$ === "LFi") {
      return "Kaakko";
    } else if (_l_0.$ === "LSv") {
      return "SO";
    } else if (_l_0.$ === "LPt") {
      return "SE";
    } else if (_l_0.$ === "LCa") {
      return "SE";
    } else if (_l_0.$ === "LHr") {
      return "JI";
    } else {
      return "SE";
    }
  } else if (_w_0.$ === "WWindDirectionLabelS") {
    if (_l_0.$ === "LDe") {
      return "S";
    } else if (_l_0.$ === "LNl") {
      return "Z";
    } else if (_l_0.$ === "LDa") {
      return "S";
    } else if (_l_0.$ === "LRo") {
      return "S";
    } else if (_l_0.$ === "LFr") {
      return "S";
    } else if (_l_0.$ === "LGr") {
      return "N";
    } else if (_l_0.$ === "LIt") {
      return "S";
    } else if (_l_0.$ === "LEs") {
      return "S";
    } else if (_l_0.$ === "LNb") {
      return "S";
    } else if (_l_0.$ === "LBg") {
      return "Ю";
    } else if (_l_0.$ === "LCs") {
      return "J";
    } else if (_l_0.$ === "LSi") {
      return "J";
    } else if (_l_0.$ === "LFi") {
      return "Etelä";
    } else if (_l_0.$ === "LSv") {
      return "S";
    } else if (_l_0.$ === "LPt") {
      return "S";
    } else if (_l_0.$ === "LCa") {
      return "S";
    } else if (_l_0.$ === "LHr") {
      return "J";
    } else {
      return "S";
    }
  } else if (_w_0.$ === "WWindDirectionLabelSW") {
    if (_l_0.$ === "LDe") {
      return "SW";
    } else if (_l_0.$ === "LNl") {
      return "ZW";
    } else if (_l_0.$ === "LDa") {
      return "SV";
    } else if (_l_0.$ === "LRo") {
      return "SV";
    } else if (_l_0.$ === "LFr") {
      return "SO";
    } else if (_l_0.$ === "LGr") {
      return "NΔ";
    } else if (_l_0.$ === "LIt") {
      return "SO";
    } else if (_l_0.$ === "LEs") {
      return "SO";
    } else if (_l_0.$ === "LNb") {
      return "SV";
    } else if (_l_0.$ === "LBg") {
      return "ЮЗ";
    } else if (_l_0.$ === "LCs") {
      return "JZ";
    } else if (_l_0.$ === "LSi") {
      return "JZ";
    } else if (_l_0.$ === "LFi") {
      return "Lounas";
    } else if (_l_0.$ === "LSv") {
      return "SV";
    } else if (_l_0.$ === "LPt") {
      return "SO";
    } else if (_l_0.$ === "LCa") {
      return "SO";
    } else if (_l_0.$ === "LHr") {
      return "JZ";
    } else {
      return "SW";
    }
  } else if (_w_0.$ === "WWindDirectionLabelW") {
    if (_l_0.$ === "LDe") {
      return "W";
    } else if (_l_0.$ === "LNl") {
      return "W";
    } else if (_l_0.$ === "LDa") {
      return "V";
    } else if (_l_0.$ === "LRo") {
      return "V";
    } else if (_l_0.$ === "LFr") {
      return "O";
    } else if (_l_0.$ === "LGr") {
      return "Δ";
    } else if (_l_0.$ === "LIt") {
      return "O";
    } else if (_l_0.$ === "LEs") {
      return "O";
    } else if (_l_0.$ === "LNb") {
      return "V";
    } else if (_l_0.$ === "LBg") {
      return "З";
    } else if (_l_0.$ === "LCs") {
      return "Z";
    } else if (_l_0.$ === "LSi") {
      return "Z";
    } else if (_l_0.$ === "LFi") {
      return "Länsi";
    } else if (_l_0.$ === "LSv") {
      return "V";
    } else if (_l_0.$ === "LPt") {
      return "O";
    } else if (_l_0.$ === "LCa") {
      return "O";
    } else if (_l_0.$ === "LHr") {
      return "Z";
    } else {
      return "W";
    }
  } else if (_w_0.$ === "WWindDirectionLabelNW") {
    if (_l_0.$ === "LDe") {
      return "NW";
    } else if (_l_0.$ === "LNl") {
      return "NW";
    } else if (_l_0.$ === "LDa") {
      return "NV";
    } else if (_l_0.$ === "LRo") {
      return "NV";
    } else if (_l_0.$ === "LFr") {
      return "NO";
    } else if (_l_0.$ === "LGr") {
      return "BΔ";
    } else if (_l_0.$ === "LIt") {
      return "NO";
    } else if (_l_0.$ === "LEs") {
      return "NO";
    } else if (_l_0.$ === "LNb") {
      return "NV";
    } else if (_l_0.$ === "LBg") {
      return "СЗ";
    } else if (_l_0.$ === "LCs") {
      return "SZ";
    } else if (_l_0.$ === "LSi") {
      return "SZ";
    } else if (_l_0.$ === "LFi") {
      return "Luode";
    } else if (_l_0.$ === "LSv") {
      return "NV";
    } else if (_l_0.$ === "LPt") {
      return "NO";
    } else if (_l_0.$ === "LCa") {
      return "NO";
    } else if (_l_0.$ === "LHr") {
      return "SZ";
    } else {
      return "NW";
    }
  } else if (_w_0.$ === "WWindDirectionDescription") {
    if (_l_0.$ === "LDe") {
      return "Die Windrichtung. Der grüne Pfeil zeigt die durchschnittliche Windrichtung an.";
    } else if (_l_0.$ === "LNl") {
      return "De windrichting. De groene pijl geeft de gemiddelde windrichting aan.";
    } else if (_l_0.$ === "LDa") {
      return "Vindretning. Grøn pil angiver den gennemsnitlige vindretning.";
    } else if (_l_0.$ === "LRo") {
      return "Direcția vântului. Săgeata verde indică direcția medie a vântului.";
    } else if (_l_0.$ === "LFr") {
      return "La direction du vent. La flêche verte indique la direction moyenne du vent.";
    } else if (_l_0.$ === "LGr") {
      return "Η διεύθυνση του ανέμου. Το πράσινο βέλος δείχνει τη μέση κατεύθυνση του ανέμου.";
    } else if (_l_0.$ === "LIt") {
      return "La direzione del vento: la freccia verde indica la direzione media del vento.";
    } else if (_l_0.$ === "LEs") {
      return "La dirección del viento. La flecha verde indica la dirección promedio del viento.";
    } else if (_l_0.$ === "LNb") {
      return "Vindretningen. Grønn pil indikerer gjennomsnittlig vindretning.";
    } else if (_l_0.$ === "LBg") {
      return "Посока на вятъра. Зелената стрелка показва средната посока на вятъра.";
    } else if (_l_0.$ === "LCs") {
      return "Směr větru. Zelená šipka ukazuje průměrný směr větru.";
    } else if (_l_0.$ === "LSi") {
      return "Smer vetra. Zelena puščica označuje povprečno smer vetra.";
    } else if (_l_0.$ === "LFi") {
      return "Tuulen suunta. Vihreä nuoli osoittaa keskimääräisen tuulen suunnan.";
    } else if (_l_0.$ === "LSv") {
      return "Vindriktning. Grön pil anger genomsnittlig vindrikting.";
    } else if (_l_0.$ === "LPt") {
      return "A direção do vento. A seta verde indica a direção do vento média.";
    } else if (_l_0.$ === "LCa") {
      return "La direcció del vent. La fletxa verda indica la direcció mitjana del vent.";
    } else if (_l_0.$ === "LHr") {
      return "Smjer vjetra. Zelena strelica označava prosječni smjer vjetra.";
    } else {
      return "The wind direction. Green arrow indicates average wind direction.";
    }
  } else if (_w_0.$ === "WWindSpeedMax") {
    if (_l_0.$ === "LDe") {
      return "max";
    } else if (_l_0.$ === "LNl") {
      return "Max";
    } else if (_l_0.$ === "LDa") {
      return "max";
    } else if (_l_0.$ === "LRo") {
      return "max";
    } else if (_l_0.$ === "LFr") {
      return "Max";
    } else if (_l_0.$ === "LGr") {
      return "mέγ";
    } else if (_l_0.$ === "LIt") {
      return "max";
    } else if (_l_0.$ === "LEs") {
      return "máx";
    } else if (_l_0.$ === "LNb") {
      return "max";
    } else if (_l_0.$ === "LBg") {
      return "макс";
    } else if (_l_0.$ === "LCs") {
      return "max";
    } else if (_l_0.$ === "LSi") {
      return "max";
    } else if (_l_0.$ === "LFi") {
      return "Max";
    } else if (_l_0.$ === "LSv") {
      return "Max";
    } else if (_l_0.$ === "LPt") {
      return "max";
    } else if (_l_0.$ === "LCa") {
      return "màx";
    } else if (_l_0.$ === "LHr") {
      return "Maks";
    } else {
      return "max";
    }
  } else if (_w_0.$ === "WWindSpeedTitle") {
    if (_l_0.$ === "LDe") {
      return "Windgeschwindigkeit";
    } else if (_l_0.$ === "LNl") {
      return "Windsnelheid";
    } else if (_l_0.$ === "LDa") {
      return "Vindhastighed";
    } else if (_l_0.$ === "LRo") {
      return "Viteza vântului";
    } else if (_l_0.$ === "LFr") {
      return "Vitesse du vent";
    } else if (_l_0.$ === "LGr") {
      return "Ταχύτητα Ανέμου";
    } else if (_l_0.$ === "LIt") {
      return "Velocità del vento";
    } else if (_l_0.$ === "LEs") {
      return "Velocidad del viento";
    } else if (_l_0.$ === "LNb") {
      return "Vindstyrke";
    } else if (_l_0.$ === "LBg") {
      return "Скорост на вятъра";
    } else if (_l_0.$ === "LCs") {
      return "Rychlost větru";
    } else if (_l_0.$ === "LSi") {
      return "Hitrost vetra";
    } else if (_l_0.$ === "LFi") {
      return "Tuulen nopeus";
    } else if (_l_0.$ === "LSv") {
      return "Vindhastighet";
    } else if (_l_0.$ === "LPt") {
      return "Velocidade Vento";
    } else if (_l_0.$ === "LCa") {
      return "Velocitat del vent";
    } else if (_l_0.$ === "LHr") {
      return "Brzina vjetra";
    } else {
      return "Wind Speed";
    }
  } else if (_w_0.$ === "WWindSpeedWind") {
    if (_l_0.$ === "LDe") {
      return "Wind";
    } else if (_l_0.$ === "LNl") {
      return "Wind";
    } else if (_l_0.$ === "LDa") {
      return "Vind";
    } else if (_l_0.$ === "LRo") {
      return "Vântul";
    } else if (_l_0.$ === "LFr") {
      return "Vent";
    } else if (_l_0.$ === "LGr") {
      return "Ταχύτητα";
    } else if (_l_0.$ === "LIt") {
      return "Vento";
    } else if (_l_0.$ === "LEs") {
      return "Viento";
    } else if (_l_0.$ === "LNb") {
      return "Vind";
    } else if (_l_0.$ === "LBg") {
      return "Вятър";
    } else if (_l_0.$ === "LCs") {
      return "Vítr";
    } else if (_l_0.$ === "LSi") {
      return "Veter";
    } else if (_l_0.$ === "LFi") {
      return "Tuuli";
    } else if (_l_0.$ === "LSv") {
      return "Vind";
    } else if (_l_0.$ === "LPt") {
      return "Vento";
    } else if (_l_0.$ === "LCa") {
      return "Vent";
    } else if (_l_0.$ === "LHr") {
      return "Vjetar";
    } else {
      return "Wind";
    }
  } else if (_w_0.$ === "WWindSpeedGust") {
    if (_l_0.$ === "LDe") {
      return "Böen";
    } else if (_l_0.$ === "LNl") {
      return "Vlaag";
    } else if (_l_0.$ === "LDa") {
      return "Stød";
    } else if (_l_0.$ === "LRo") {
      return "Rafale";
    } else if (_l_0.$ === "LFr") {
      return "Rafale";
    } else if (_l_0.$ === "LGr") {
      return "φύσημα";
    } else if (_l_0.$ === "LIt") {
      return "Raffica";
    } else if (_l_0.$ === "LEs") {
      return "Ráfaga";
    } else if (_l_0.$ === "LNb") {
      return "Kast";
    } else if (_l_0.$ === "LBg") {
      return "Порив";
    } else if (_l_0.$ === "LCs") {
      return "Poryv";
    } else if (_l_0.$ === "LSi") {
      return "Sunek";
    } else if (_l_0.$ === "LFi") {
      return "Puuska";
    } else if (_l_0.$ === "LSv") {
      return "Byighet";
    } else if (_l_0.$ === "LPt") {
      return "Rajada";
    } else if (_l_0.$ === "LCa") {
      return "Cop";
    } else if (_l_0.$ === "LHr") {
      return "Nalet";
    } else {
      return "Gust";
    }
  } else if (_w_0.$ === "WWindSpeedAverage") {
    if (_l_0.$ === "LDe") {
      return "Durchschnitt";
    } else if (_l_0.$ === "LNl") {
      return "Gemiddeld";
    } else if (_l_0.$ === "LDa") {
      return "Gennemsnit";
    } else if (_l_0.$ === "LRo") {
      return "Media";
    } else if (_l_0.$ === "LFr") {
      return "Moyenne";
    } else if (_l_0.$ === "LGr") {
      return "Μέση";
    } else if (_l_0.$ === "LIt") {
      return "Media";
    } else if (_l_0.$ === "LEs") {
      return "Media";
    } else if (_l_0.$ === "LNb") {
      return "Gjennomsnitt";
    } else if (_l_0.$ === "LBg") {
      return "Средна";
    } else if (_l_0.$ === "LCs") {
      return "Průměrná";
    } else if (_l_0.$ === "LSi") {
      return "Povprečno";
    } else if (_l_0.$ === "LFi") {
      return "Keskiarvo";
    } else if (_l_0.$ === "LSv") {
      return "Genomsnittlig";
    } else if (_l_0.$ === "LPt") {
      return "Média";
    } else if (_l_0.$ === "LCa") {
      return "Mitjana";
    } else if (_l_0.$ === "LHr") {
      return "Prosjek";
    } else {
      return "Average";
    }
  } else if (_w_0.$ === "WWindSpeedDescription") {
    if (_l_0.$ === "LDe") {
      return "Grüner Balken zeigt die durchschnittliche Windgeschwindigkeit an.\nvioletter Balken zeigt die Böengeschwindigkeit an.";
    } else if (_l_0.$ === "LNl") {
      return "Groene balk geeft de gemiddelde windsnelheid aan. \nPaarse balk geeft de windsnelheid in vlagen aan.";
    } else if (_l_0.$ === "LDa") {
      return "Grøn bjælke angiver middelvind.\nLilla bjælke angiver vindstød.";
    } else if (_l_0.$ === "LRo") {
      return "Bara verde indică viteza medie a vântului.\nVioleta scurtă indică viteza de rafală.";
    } else if (_l_0.$ === "LFr") {
      return "La barre verte indique la vitesse moyenne du vent.\nLa barre violette indique la vitesse de la rafale du vent.";
    } else if (_l_0.$ === "LGr") {
      return "Η πράσινη ράβδος δείχνει τη μέση ταχύτητα του ανέμου.\nμωβ ράβδος σκουριάς δείχνει την ταχύτητα της ριπής.";
    } else if (_l_0.$ === "LIt") {
      return "La barra verde indica la velocità media del vento.\nPurple barra indica la velocità della raffica.";
    } else if (_l_0.$ === "LEs") {
      return "La barra verde indica la velocidad promedio del viento.\npúrpura color indica la velocidad de ráfaga.";
    } else if (_l_0.$ === "LNb") {
      return "Grønn: Indikerer gjennomsnittlig vindhastighet.\nLilla: indikerer vindhastighet akuratt nå (vindkast).";
    } else if (_l_0.$ === "LBg") {
      return "Зеленото стълбче показва средната скорост на вятъра.\nЛилавото стълбче показва скоростта на поривите на вятъра.";
    } else if (_l_0.$ === "LCs") {
      return "Zelená čára označuje průměrnou rychlost větru.\nSloupec označuje rychlost poryvu.";
    } else if (_l_0.$ === "LSi") {
      return "Zelena vrstica označuje povprečno hitrost vetra. \nVijolična vrstica označuje sunek vetra.";
    } else if (_l_0.$ === "LFi") {
      return "Vihreä palkki ilmaisee keskimääräisen tuulen nopeuden.\nVioletti palkki ilmaisee puuskan nopeuden.";
    } else if (_l_0.$ === "LSv") {
      return "Grön stapel indikerar genomsnittlig vind. \nLila stapel indikerar vindbyar.";
    } else if (_l_0.$ === "LPt") {
      return "A barra verde indica a velocidade do vento média.\nA barra roxa indica a velocidade da rajada.";
    } else if (_l_0.$ === "LCa") {
      return "La barra verda indica la velocitat mitjana del vent.\nporpra indica la velocitat del cop.";
    } else if (_l_0.$ === "LHr") {
      return "Zelena traka označava prosječnu brzinu vjetra.\nLjubičasta traka označava brzinu udara vjetra.";
    } else {
      return "Green bar indicates average wind speed.\nPurple bar indicates gust speed.";
    }
  } else if (_w_0.$ === "WRecordsHighTemp") {
    if (_l_0.$ === "LDe") {
      return "Höchste Temperatur";
    } else if (_l_0.$ === "LNl") {
      return "Hoogste temperatuur";
    } else if (_l_0.$ === "LDa") {
      return "Højeste temperatur";
    } else if (_l_0.$ === "LRo") {
      return "Recordul de temperatură mare";
    } else if (_l_0.$ === "LFr") {
      return "Température la plus haute";
    } else if (_l_0.$ === "LGr") {
      return "Υψηλότερη θερμοκρασία";
    } else if (_l_0.$ === "LIt") {
      return "Temperatura massima";
    } else if (_l_0.$ === "LEs") {
      return "Temperatura más alta";
    } else if (_l_0.$ === "LNb") {
      return "Høyeste temperatur";
    } else if (_l_0.$ === "LBg") {
      return "Най-висока температура";
    } else if (_l_0.$ === "LCs") {
      return "Nejvyšší teplota";
    } else if (_l_0.$ === "LSi") {
      return "Najvišja temperatura";
    } else if (_l_0.$ === "LFi") {
      return "Korkein lämpötila";
    } else if (_l_0.$ === "LSv") {
      return "Högsta temperatur";
    } else if (_l_0.$ === "LPt") {
      return "Temperatura mais alta";
    } else if (_l_0.$ === "LCa") {
      return "Temperatura més alta";
    } else if (_l_0.$ === "LHr") {
      return "Najviša temperatura";
    } else {
      return "Highest temperature";
    }
  } else if (_w_0.$ === "WRecordsLowTemp") {
    if (_l_0.$ === "LDe") {
      return "Niedrigste Temperatur";
    } else if (_l_0.$ === "LNl") {
      return "Laagste temperatuur";
    } else if (_l_0.$ === "LDa") {
      return "Laveste temperatur";
    } else if (_l_0.$ === "LRo") {
      return "Recordul de temperatură mică";
    } else if (_l_0.$ === "LFr") {
      return "Température la plus basse";
    } else if (_l_0.$ === "LGr") {
      return "Χαμηλότερη θερμοκρασία";
    } else if (_l_0.$ === "LIt") {
      return "Temperatura più bassa";
    } else if (_l_0.$ === "LEs") {
      return "Temperatura más baja";
    } else if (_l_0.$ === "LNb") {
      return "Laveste temperatur";
    } else if (_l_0.$ === "LBg") {
      return "Най-ниска температура";
    } else if (_l_0.$ === "LCs") {
      return "Nejnižší teplota";
    } else if (_l_0.$ === "LSi") {
      return "Najnižja temperatura";
    } else if (_l_0.$ === "LFi") {
      return "Matalin lämpötila";
    } else if (_l_0.$ === "LSv") {
      return "Lägsta temperatur";
    } else if (_l_0.$ === "LPt") {
      return "Temperatura mais baixa";
    } else if (_l_0.$ === "LCa") {
      return "Temperatura més baixa";
    } else if (_l_0.$ === "LHr") {
      return "Najniža temperatura";
    } else {
      return "Lowest temperature";
    }
  } else if (_w_0.$ === "WRecordsHighGust") {
    if (_l_0.$ === "LDe") {
      return "höchste Böe";
    } else if (_l_0.$ === "LNl") {
      return "Sterkste vlaag";
    } else if (_l_0.$ === "LDa") {
      return "Kraftigste vindstød";
    } else if (_l_0.$ === "LRo") {
      return "Recordul rafalelor";
    } else if (_l_0.$ === "LFr") {
      return "Rafale de vent maximale";
    } else if (_l_0.$ === "LGr") {
      return "Υψηλότερη φύσημα";
    } else if (_l_0.$ === "LIt") {
      return "Il più alto gusto";
    } else if (_l_0.$ === "LEs") {
      return "Mayor ráfaga";
    } else if (_l_0.$ === "LNb") {
      return "Kraftigste vindkast";
    } else if (_l_0.$ === "LBg") {
      return "Най-силен порив на вятъра";
    } else if (_l_0.$ === "LCs") {
      return "Nejvyšší poryv";
    } else if (_l_0.$ === "LSi") {
      return "Najvišji sunek";
    } else if (_l_0.$ === "LFi") {
      return "Korkein puuska";
    } else if (_l_0.$ === "LSv") {
      return "Högsta byighet";
    } else if (_l_0.$ === "LPt") {
      return "Rajada máxima";
    } else if (_l_0.$ === "LCa") {
      return "Cop màxim";
    } else if (_l_0.$ === "LHr") {
      return "Najjači udar";
    } else {
      return "Highest gust";
    }
  } else if (_w_0.$ === "WRecordsHighRainRate") {
    if (_l_0.$ === "LDe") {
      return "höchste Regenrate";
    } else if (_l_0.$ === "LNl") {
      return "Hoogste hoeveelheid regen";
    } else if (_l_0.$ === "LDa") {
      return "Højeste regnrate";
    } else if (_l_0.$ === "LRo") {
      return "Recordul ratei ploii";
    } else if (_l_0.$ === "LFr") {
      return "Taux de précipitations maximal";
    } else if (_l_0.$ === "LGr") {
      return "Υψηλότερη βροχόπτωση";
    } else if (_l_0.$ === "LIt") {
      return "Tasso di pioggia più alto";
    } else if (_l_0.$ === "LEs") {
      return "Tasa de lluvia más alta";
    } else if (_l_0.$ === "LNb") {
      return "Høyeste endring i nedbør";
    } else if (_l_0.$ === "LBg") {
      return "Максимален валежен интензитет";
    } else if (_l_0.$ === "LCs") {
      return "Největší srážky";
    } else if (_l_0.$ === "LSi") {
      return "Jakost padavin";
    } else if (_l_0.$ === "LFi") {
      return "Korkein sademäärä";
    } else if (_l_0.$ === "LSv") {
      return "Största regnmängden";
    } else if (_l_0.$ === "LPt") {
      return "Pluviosidade máxima";
    } else if (_l_0.$ === "LCa") {
      return "Intensitat de pluja més alta";
    } else if (_l_0.$ === "LHr") {
      return "Največa količina oborine";
    } else {
      return "Highest rain rate";
    }
  } else if (_w_0.$ === "WRecordsLowBaro") {
    if (_l_0.$ === "LDe") {
      return "min. Luftdruck";
    } else if (_l_0.$ === "LNl") {
      return "Laagste stand barometer";
    } else if (_l_0.$ === "LDa") {
      return "Laveste lufttryk";
    } else if (_l_0.$ === "LRo") {
      return "Recordul presiunii scăzute";
    } else if (_l_0.$ === "LFr") {
      return "Pression la plus basse";
    } else if (_l_0.$ === "LGr") {
      return "Χαμηλότερο βαρόμετρο";
    } else if (_l_0.$ === "LIt") {
      return "Barometro più basso";
    } else if (_l_0.$ === "LEs") {
      return "Barómetro más bajo";
    } else if (_l_0.$ === "LNb") {
      return "Lavest barometertrykk";
    } else if (_l_0.$ === "LBg") {
      return "Най-ниско налягане";
    } else if (_l_0.$ === "LCs") {
      return "Nejnižší tlak vzduchu";
    } else if (_l_0.$ === "LSi") {
      return "Najnižji pritisk";
    } else if (_l_0.$ === "LFi") {
      return "Matalin ilmanpaine";
    } else if (_l_0.$ === "LSv") {
      return "Lägsta lufttryck";
    } else if (_l_0.$ === "LPt") {
      return "Pressão atmosférica mínima";
    } else if (_l_0.$ === "LCa") {
      return "Baròmetre más baix";
    } else if (_l_0.$ === "LHr") {
      return "Najniži tlak";
    } else {
      return "Lowest barometer";
    }
  } else if (_w_0.$ === "WRecordsHighBaro") {
    if (_l_0.$ === "LDe") {
      return "max. Luftdruck";
    } else if (_l_0.$ === "LNl") {
      return "Hoogste stand barometer";
    } else if (_l_0.$ === "LDa") {
      return "Højeste lufttryk";
    } else if (_l_0.$ === "LRo") {
      return "Recordul presiunii mari";
    } else if (_l_0.$ === "LFr") {
      return "Pression la plus haute";
    } else if (_l_0.$ === "LGr") {
      return "Υψηλότερο βαρόμετρο";
    } else if (_l_0.$ === "LIt") {
      return "Barometro più alto";
    } else if (_l_0.$ === "LEs") {
      return "Barómetro más alto";
    } else if (_l_0.$ === "LNb") {
      return "Høyest barometertrykk";
    } else if (_l_0.$ === "LBg") {
      return "Най-високо налягане";
    } else if (_l_0.$ === "LCs") {
      return "Nejvyšší tlak vzduchu";
    } else if (_l_0.$ === "LSi") {
      return "Najvišji pritisk";
    } else if (_l_0.$ === "LFi") {
      return "Korkein ilmanpaine";
    } else if (_l_0.$ === "LSv") {
      return "Högsta lufttryck";
    } else if (_l_0.$ === "LPt") {
      return "Pressão atmosférica máxima";
    } else if (_l_0.$ === "LCa") {
      return "Baròmetre més alt";
    } else if (_l_0.$ === "LHr") {
      return "Najviši tlak";
    } else {
      return "Highest barometer";
    }
  } else if (_w_0.$ === "WRecordsHighRainRateDaily") {
    if (_l_0.$ === "LDe") {
      return "Höchster Tagesniederschlag";
    } else if (_l_0.$ === "LNl") {
      return "Hoogste dagelijkse hoeveelheid regen";
    } else if (_l_0.$ === "LDa") {
      return "Højeste daglige regnmængde";
    } else if (_l_0.$ === "LRo") {
      return "Recordul pentru cele mai mari precipitații zilnice";
    } else if (_l_0.$ === "LFr") {
      return "Précipitations maximales en 1 jour";
    } else if (_l_0.$ === "LGr") {
      return "Υψηλότερη ημερήσια βροχόπτωση";
    } else if (_l_0.$ === "LIt") {
      return "Pioggia giornaliera massima";
    } else if (_l_0.$ === "LEs") {
      return "La mayor cantidad de lluvia diaria";
    } else if (_l_0.$ === "LNb") {
      return "Høyeste daglige nedbør";
    } else if (_l_0.$ === "LBg") {
      return "Максимален дневен валеж";
    } else if (_l_0.$ === "LCs") {
      return "Nejvyšší denní srážky";
    } else if (_l_0.$ === "LSi") {
      return "Najvišja dnevna jakost padavin";
    } else if (_l_0.$ === "LFi") {
      return "Korkein päivittäinen sademäärä";
    } else if (_l_0.$ === "LSv") {
      return "Högsta dagliga regnmängd";
    } else if (_l_0.$ === "LPt") {
      return "Pluviosidade máxima diária";
    } else if (_l_0.$ === "LCa") {
      return "Pluja màxima diària";
    } else if (_l_0.$ === "LHr") {
      return "Najveća dnevna količina oborina";
    } else {
      return "Highest daily rainfall";
    }
  } else if (_w_0.$ === "WRecordsHighRainRateHourly") {
    if (_l_0.$ === "LDe") {
      return "Höchster stündlicher Niederschlag";
    } else if (_l_0.$ === "LNl") {
      return "Hoogste hoeveelheid regen per uur";
    } else if (_l_0.$ === "LDa") {
      return "Højeste regnmængde pr. time";
    } else if (_l_0.$ === "LRo") {
      return "Cea mai mare ploaie orară";
    } else if (_l_0.$ === "LFr") {
      return "Précipitations maximales en 1 heure";
    } else if (_l_0.$ === "LGr") {
      return "Υψηλότερη ωριαία βροχόπτωση";
    } else if (_l_0.$ === "LIt") {
      return "Pioggia orario più alta";
    } else if (_l_0.$ === "LEs") {
      return "Mayor precipitación por hora";
    } else if (_l_0.$ === "LNb") {
      return "Høyest nedbør pr.timen";
    } else if (_l_0.$ === "LBg") {
      return "Максимален валеж за 1 час";
    } else if (_l_0.$ === "LCs") {
      return "Nejvyšší hodinové srážky";
    } else if (_l_0.$ === "LSi") {
      return "Najvišja jakost padavin na uro";
    } else if (_l_0.$ === "LFi") {
      return "Korkein sademäärä tunneittain";
    } else if (_l_0.$ === "LSv") {
      return "Högsta regnmängd per timme";
    } else if (_l_0.$ === "LPt") {
      return "Pluviosidade máxima em 1 hora";
    } else if (_l_0.$ === "LCa") {
      return "Màxima precipitació per hora";
    } else if (_l_0.$ === "LHr") {
      return "Najveća količina oborina po satu";
    } else {
      return "Highest hourly rainfall";
    }
  } else if (_w_0.$ === "WRecordsHighAverageWind") {
    if (_l_0.$ === "LDe") {
      return "Höchste durchschnittliche Windgeschwindigkeit";
    } else if (_l_0.$ === "LNl") {
      return "Hoogste gemiddelde windsnelheid";
    } else if (_l_0.$ === "LDa") {
      return "Kraftigste middelvind";
    } else if (_l_0.$ === "LRo") {
      return "Cea mai mare viteză medie a vântului";
    } else if (_l_0.$ === "LFr") {
      return "Vitesse maximale du vent moyen";
    } else if (_l_0.$ === "LGr") {
      return "Μέγιστη μέση ταχύτητα ανέμου";
    } else if (_l_0.$ === "LIt") {
      return "Velocità del vento media più alta";
    } else if (_l_0.$ === "LEs") {
      return "Velocidad promedia del viento más alta";
    } else if (_l_0.$ === "LNb") {
      return "Kraftigste Gj.snitt vindstyrke";
    } else if (_l_0.$ === "LBg") {
      return "Максимална средна скорост на вятъра";
    } else if (_l_0.$ === "LCs") {
      return "Nejvyšší průměrná rychlost větru";
    } else if (_l_0.$ === "LSi") {
      return "Najvišja povprečna hitrost vetra";
    } else if (_l_0.$ === "LFi") {
      return "Suurin keskimääräinen tuulen nopeus";
    } else if (_l_0.$ === "LSv") {
      return "Högsta genomsnittliga vindhastighet";
    } else if (_l_0.$ === "LPt") {
      return "Máxima velocidade do vento média";
    } else if (_l_0.$ === "LCa") {
      return "Velocitat mitjana del vent més alta";
    } else if (_l_0.$ === "LHr") {
      return "Najveća prosječna brzina vjetra";
    } else {
      return "Highest average wind speed";
    }
  } else if (_w_0.$ === "WRecordsLowWindChill") {
    if (_l_0.$ === "LDe") {
      return "min.gefühlte Tmperatur";
    } else if (_l_0.$ === "LNl") {
      return "Laagste gevoelstemperatuur";
    } else if (_l_0.$ === "LDa") {
      return "Laveste kuldeindeks";
    } else if (_l_0.$ === "LRo") {
      return "Cel mai scăzut vânt tăios";
    } else if (_l_0.$ === "LFr") {
      return "Facteur vent le plus froid";
    } else if (_l_0.$ === "LGr") {
      return "Ο ψυχρότερος άνεμος";
    } else if (_l_0.$ === "LIt") {
      return "Vento più freddo";
    } else if (_l_0.$ === "LEs") {
      return "Frío del viento más bajo";
    } else if (_l_0.$ === "LNb") {
      return "Laveste følt tempratur";
    } else if (_l_0.$ === "LBg") {
      return "Най-нисък уиндчил";
    } else if (_l_0.$ === "LCs") {
      return "Nejnižší pocitová teplota";
    } else if (_l_0.$ === "LSi") {
      return "Najnižji občutek temperature";
    } else if (_l_0.$ === "LFi") {
      return "Alin hyytävyys";
    } else if (_l_0.$ === "LSv") {
      return "Lägsta köldindex";
    } else if (_l_0.$ === "LPt") {
      return "Mínimo índice de frio";
    } else if (_l_0.$ === "LCa") {
      return "Sensació mínima";
    } else if (_l_0.$ === "LHr") {
      return "Najniža hladnoća vjetra";
    } else {
      return "Lowest wind chill";
    }
  } else if (_w_0.$ === "WRecordsWarmestDay") {
    if (_l_0.$ === "LDe") {
      return "Wärmster Tag";
    } else if (_l_0.$ === "LNl") {
      return "Warmste dag";
    } else if (_l_0.$ === "LDa") {
      return "Varmeste dag";
    } else if (_l_0.$ === "LRo") {
      return "Ziua cea mai caldă";
    } else if (_l_0.$ === "LFr") {
      return "Jour le plus chaud";
    } else if (_l_0.$ === "LGr") {
      return "Ζεστή ημέρα";
    } else if (_l_0.$ === "LIt") {
      return "Giorno più caldo";
    } else if (_l_0.$ === "LEs") {
      return "El día más cálido";
    } else if (_l_0.$ === "LNb") {
      return "Varmest dag (Snitt 6-18)";
    } else if (_l_0.$ === "LBg") {
      return "Най-топъл ден (6-18ч.)";
    } else if (_l_0.$ === "LCs") {
      return "Nejteplejší den";
    } else if (_l_0.$ === "LSi") {
      return "Najtoplejši dan";
    } else if (_l_0.$ === "LFi") {
      return "Lämpimin päivä";
    } else if (_l_0.$ === "LSv") {
      return "Varmaste dagen";
    } else if (_l_0.$ === "LPt") {
      return "Dia mais quente";
    } else if (_l_0.$ === "LCa") {
      return "Dia més calurós";
    } else if (_l_0.$ === "LHr") {
      return "Najtopliji dan";
    } else {
      return "Warmest day";
    }
  } else if (_w_0.$ === "WRecordsColdestNight") {
    if (_l_0.$ === "LDe") {
      return "kälteste Nacht";
    } else if (_l_0.$ === "LNl") {
      return "Koudste nacht";
    } else if (_l_0.$ === "LDa") {
      return "Koldeste nat";
    } else if (_l_0.$ === "LRo") {
      return "Noaptea cea mai rece";
    } else if (_l_0.$ === "LFr") {
      return "Nuit la plus froide";
    } else if (_l_0.$ === "LGr") {
      return "Η πιο ψυχρή νύχτα";
    } else if (_l_0.$ === "LIt") {
      return "Notte più fredda";
    } else if (_l_0.$ === "LEs") {
      return "La noche más fría";
    } else if (_l_0.$ === "LNb") {
      return "Kaldest natt (Snitt 18-6)";
    } else if (_l_0.$ === "LBg") {
      return "Най-студена нощ (18-6ч.)";
    } else if (_l_0.$ === "LCs") {
      return "Nejchladnější noc";
    } else if (_l_0.$ === "LSi") {
      return "Najtoplejša noč";
    } else if (_l_0.$ === "LFi") {
      return "Kylmin yö";
    } else if (_l_0.$ === "LSv") {
      return "Kallaste natten";
    } else if (_l_0.$ === "LPt") {
      return "Noite mais fria";
    } else if (_l_0.$ === "LCa") {
      return "Nit més freda";
    } else if (_l_0.$ === "LHr") {
      return "Najhladnija noć";
    } else {
      return "Coldest night";
    }
  } else if (_w_0.$ === "WRecordsColdestDay") {
    if (_l_0.$ === "LDe") {
      return "kältester Tag";
    } else if (_l_0.$ === "LNl") {
      return "Koudste dag";
    } else if (_l_0.$ === "LDa") {
      return "Koldeste dag";
    } else if (_l_0.$ === "LRo") {
      return "Ziua cea mai rece";
    } else if (_l_0.$ === "LFr") {
      return "Jour le plus froid";
    } else if (_l_0.$ === "LGr") {
      return "Η πιό ψυχρή ημέρα";
    } else if (_l_0.$ === "LIt") {
      return "Giorno più freddo";
    } else if (_l_0.$ === "LEs") {
      return "Día más frío";
    } else if (_l_0.$ === "LNb") {
      return "Kaldest dag (Snitt 6-18)";
    } else if (_l_0.$ === "LBg") {
      return "Най-студен ден (6-18ч.)";
    } else if (_l_0.$ === "LCs") {
      return "Nejchladnější den";
    } else if (_l_0.$ === "LSi") {
      return "Najbolj mrzel dan";
    } else if (_l_0.$ === "LFi") {
      return "Kylmin päivä";
    } else if (_l_0.$ === "LSv") {
      return "Kallaste dagen";
    } else if (_l_0.$ === "LPt") {
      return "Dia mais frio";
    } else if (_l_0.$ === "LCa") {
      return "Dia més fred";
    } else if (_l_0.$ === "LHr") {
      return "Najhladniji dan";
    } else {
      return "Coldest day";
    }
  } else if (_w_0.$ === "WRecordsWarmestNight") {
    if (_l_0.$ === "LDe") {
      return "wärmste Nacht";
    } else if (_l_0.$ === "LNl") {
      return "Warmste nacht";
    } else if (_l_0.$ === "LDa") {
      return "Varmeste nat";
    } else if (_l_0.$ === "LRo") {
      return "Cea mai caldă noapte";
    } else if (_l_0.$ === "LFr") {
      return "Nuit la plus chaude";
    } else if (_l_0.$ === "LGr") {
      return "Ζεστή νύχτα";
    } else if (_l_0.$ === "LIt") {
      return "Notte più calda";
    } else if (_l_0.$ === "LEs") {
      return "La noche más cálida";
    } else if (_l_0.$ === "LNb") {
      return "Varmest natt (Snitt 18-6)";
    } else if (_l_0.$ === "LBg") {
      return "Най-топла нощ (18-6ч.)";
    } else if (_l_0.$ === "LCs") {
      return "Nejteplejší noc";
    } else if (_l_0.$ === "LSi") {
      return "Najtoplejša noč";
    } else if (_l_0.$ === "LFi") {
      return "Lämpimin yö";
    } else if (_l_0.$ === "LSv") {
      return "Varmaste natten";
    } else if (_l_0.$ === "LPt") {
      return "Noite mais quente";
    } else if (_l_0.$ === "LCa") {
      return "Nit més calurosa";
    } else if (_l_0.$ === "LHr") {
      return "Najtoplija noć";
    } else {
      return "Warmest night";
    }
  } else if (_w_0.$ === "WRecordsHighHeatIndex") {
    if (_l_0.$ === "LDe") {
      return "höchster Hitzeindex";
    } else if (_l_0.$ === "LNl") {
      return "Hoogste warmte index";
    } else if (_l_0.$ === "LDa") {
      return "Højeste varmeindeks";
    } else if (_l_0.$ === "LRo") {
      return "Recordul indicelui de căldură";
    } else if (_l_0.$ === "LFr") {
      return "Indice de chaleur maximal";
    } else if (_l_0.$ === "LGr") {
      return "Υψηλότερος δείκτης θερμότητας";
    } else if (_l_0.$ === "LIt") {
      return "Indice di calore più alto";
    } else if (_l_0.$ === "LEs") {
      return "Índice de calor más alto";
    } else if (_l_0.$ === "LNb") {
      return "Høyeste følt varme";
    } else if (_l_0.$ === "LBg") {
      return "Най-висок топлинен индекс";
    } else if (_l_0.$ === "LCs") {
      return "Nejvyšší teplotní index";
    } else if (_l_0.$ === "LSi") {
      return "Najvišji toplotni indeks";
    } else if (_l_0.$ === "LFi") {
      return "Suurin lämpöindeksi";
    } else if (_l_0.$ === "LSv") {
      return "Högsta värmeindex";
    } else if (_l_0.$ === "LPt") {
      return "Máximo índice de calor";
    } else if (_l_0.$ === "LCa") {
      return "Xafogor màxima";
    } else if (_l_0.$ === "LHr") {
      return "Najviši indeks topline";
    } else {
      return "Highest heat index";
    }
  } else if (_w_0.$ === "WRecordsHighSolar") {
    if (_l_0.$ === "LDe") {
      return "max.Solar";
    } else if (_l_0.$ === "LNl") {
      return "Hoogste zonkracht";
    } else if (_l_0.$ === "LDa") {
      return "Højeste solindstråling";
    } else if (_l_0.$ === "LRo") {
      return "Cel mai înalt nivel solar";
    } else if (_l_0.$ === "LFr") {
      return "Solaire maximal";
    } else if (_l_0.$ === "LGr") {
      return "Υψηλότερο ηλιακό";
    } else if (_l_0.$ === "LIt") {
      return "Il più alto solare";
    } else if (_l_0.$ === "LEs") {
      return "Más alto solar";
    } else if (_l_0.$ === "LNb") {
      return "Høyeste solenergi";
    } else if (_l_0.$ === "LBg") {
      return "Най-висок соларен интензитет";
    } else if (_l_0.$ === "LCs") {
      return "Nejvyšší sluneční svit";
    } else if (_l_0.$ === "LSi") {
      return "Najvišje izžarevanje sonca";
    } else if (_l_0.$ === "LFi") {
      return "Voimakkain auringon säteily";
    } else if (_l_0.$ === "LSv") {
      return "Högsta solinstrålningen";
    } else if (_l_0.$ === "LPt") {
      return "Máximo radiação solar";
    } else if (_l_0.$ === "LCa") {
      return "Radiació solar màxima";
    } else if (_l_0.$ === "LHr") {
      return "Najviše sunčevo zračenje";
    } else {
      return "Highest solar";
    }
  } else if (_w_0.$ === "WRecordsHighUV") {
    if (_l_0.$ === "LDe") {
      return "max.UV Index";
    } else if (_l_0.$ === "LNl") {
      return "Hoogste uv index";
    } else if (_l_0.$ === "LDa") {
      return "Højeste uv indeks";
    } else if (_l_0.$ === "LRo") {
      return "Cel mai înalt nivel UV";
    } else if (_l_0.$ === "LFr") {
      return "Indice UV maximal";
    } else if (_l_0.$ === "LGr") {
      return "Υψηλότερο ευρετήριο UV";
    } else if (_l_0.$ === "LIt") {
      return "Indice UV più alto";
    } else if (_l_0.$ === "LEs") {
      return "Índice UV más alto";
    } else if (_l_0.$ === "LNb") {
      return "Høyeste UV-indeks";
    } else if (_l_0.$ === "LBg") {
      return "Най-висок UV индекс";
    } else if (_l_0.$ === "LCs") {
      return "Nejvyšší index UV";
    } else if (_l_0.$ === "LSi") {
      return " Najvišji UV";
    } else if (_l_0.$ === "LFi") {
      return "Korkein UV-indeksi";
    } else if (_l_0.$ === "LSv") {
      return "Högsta UV-index";
    } else if (_l_0.$ === "LPt") {
      return "Máximo índice UV";
    } else if (_l_0.$ === "LCa") {
      return "Index UV màxim";
    } else if (_l_0.$ === "LHr") {
      return "Najviši UV indeks";
    } else {
      return "Highest uv index";
    }
  } else if (_w_0.$ === "WRecordsHighDewPoint") {
    if (_l_0.$ === "LDe") {
      return "max.Taupunkt";
    } else if (_l_0.$ === "LNl") {
      return "Hoogste dauwpunt";
    } else if (_l_0.$ === "LDa") {
      return "Højeste dugpunkt";
    } else if (_l_0.$ === "LRo") {
      return "Record de punct de rouă ridicat";
    } else if (_l_0.$ === "LFr") {
      return "Point de rosée maximal";
    } else if (_l_0.$ === "LGr") {
      return "Υψηλότερο σημείο δρόσου";
    } else if (_l_0.$ === "LIt") {
      return "Punto di rugiada più alto";
    } else if (_l_0.$ === "LEs") {
      return "Punto de rocío más alto";
    } else if (_l_0.$ === "LNb") {
      return "Høyeste duggpunkt";
    } else if (_l_0.$ === "LBg") {
      return "Най-висока точка на оросяване";
    } else if (_l_0.$ === "LCs") {
      return "Nejvyšší rosný bod";
    } else if (_l_0.$ === "LSi") {
      return "Najvišja točka rosišča";
    } else if (_l_0.$ === "LFi") {
      return "Korkein kastepiste";
    } else if (_l_0.$ === "LSv") {
      return "Högsta daggpunkten";
    } else if (_l_0.$ === "LPt") {
      return "Ponto de Orvalho máximo";
    } else if (_l_0.$ === "LCa") {
      return "Punt de rosada màxim";
    } else if (_l_0.$ === "LHr") {
      return "Najviša točka rosišta";
    } else {
      return "Highest dew point";
    }
  } else if (_w_0.$ === "WRecordsLowDewPoint") {
    if (_l_0.$ === "LDe") {
      return "min.Taupunkt";
    } else if (_l_0.$ === "LNl") {
      return "Laagste dauwpunt";
    } else if (_l_0.$ === "LDa") {
      return "Laveste dugpunkt";
    } else if (_l_0.$ === "LRo") {
      return "Record de punct rouă scazut";
    } else if (_l_0.$ === "LFr") {
      return "Point de rosée minimal";
    } else if (_l_0.$ === "LGr") {
      return "Χαμηλότερο σημείο δρόσου";
    } else if (_l_0.$ === "LIt") {
      return "Punto di rugiada più basso";
    } else if (_l_0.$ === "LEs") {
      return "Punto de rocío más bajo";
    } else if (_l_0.$ === "LNb") {
      return "Laveste duggpunkt";
    } else if (_l_0.$ === "LBg") {
      return "Най-ниска точка на оросяване";
    } else if (_l_0.$ === "LCs") {
      return "Nejnižší rosný bod";
    } else if (_l_0.$ === "LSi") {
      return "Najnižja točka rosišča";
    } else if (_l_0.$ === "LFi") {
      return "Matalin kastepiste";
    } else if (_l_0.$ === "LSv") {
      return "Lägsta daggpunkten";
    } else if (_l_0.$ === "LPt") {
      return "Ponto de orvalho mínimo";
    } else if (_l_0.$ === "LCa") {
      return "Punt de rosada màxim";
    } else if (_l_0.$ === "LHr") {
      return "Najniža točka rosišta";
    } else {
      return "Lowest dew point";
    }
  } else if (_w_0.$ === "WForcastShowMore") {
    if (_l_0.$ === "LDe") {
      return "zeige mehr";
    } else if (_l_0.$ === "LNl") {
      return "Toon meer";
    } else if (_l_0.$ === "LDa") {
      return "Vis mere";
    } else if (_l_0.$ === "LRo") {
      return "Afișați mai multe";
    } else if (_l_0.$ === "LFr") {
      return "Montrer plus";
    } else if (_l_0.$ === "LGr") {
      return "Δείτε περισσότερα";
    } else if (_l_0.$ === "LIt") {
      return "Mostra di più";
    } else if (_l_0.$ === "LEs") {
      return "Mostrar más";
    } else if (_l_0.$ === "LNb") {
      return "Vis mer";
    } else if (_l_0.$ === "LBg") {
      return "Покажи повече";
    } else if (_l_0.$ === "LCs") {
      return "Zobrazit více";
    } else if (_l_0.$ === "LSi") {
      return "Pokaži več";
    } else if (_l_0.$ === "LFi") {
      return "Näytä lisää";
    } else if (_l_0.$ === "LSv") {
      return "Visa mer";
    } else if (_l_0.$ === "LPt") {
      return "Ver mais";
    } else if (_l_0.$ === "LCa") {
      return "Mostrar-ne més";
    } else if (_l_0.$ === "LHr") {
      return "Prikaži više";
    } else {
      return "Show More";
    }
  } else if (_w_0.$ === "WGraphMax") {
    if (_l_0.$ === "LDe") {
      return "Max";
    } else if (_l_0.$ === "LNl") {
      return "Max";
    } else if (_l_0.$ === "LDa") {
      return "Max";
    } else if (_l_0.$ === "LRo") {
      return "Max";
    } else if (_l_0.$ === "LFr") {
      return "Max";
    } else if (_l_0.$ === "LGr") {
      return "Μέγ";
    } else if (_l_0.$ === "LIt") {
      return "Max";
    } else if (_l_0.$ === "LEs") {
      return "Máx";
    } else if (_l_0.$ === "LNb") {
      return "Max";
    } else if (_l_0.$ === "LBg") {
      return "Макс";
    } else if (_l_0.$ === "LCs") {
      return "Max";
    } else if (_l_0.$ === "LSi") {
      return "Max";
    } else if (_l_0.$ === "LFi") {
      return "Max";
    } else if (_l_0.$ === "LSv") {
      return "Max";
    } else if (_l_0.$ === "LPt") {
      return "Max";
    } else if (_l_0.$ === "LCa") {
      return "Màx";
    } else if (_l_0.$ === "LHr") {
      return "Maks";
    } else {
      return "Max";
    }
  } else if (_w_0.$ === "WGraphMin") {
    if (_l_0.$ === "LDe") {
      return "Min";
    } else if (_l_0.$ === "LNl") {
      return "Min";
    } else if (_l_0.$ === "LDa") {
      return "Min";
    } else if (_l_0.$ === "LRo") {
      return "Min";
    } else if (_l_0.$ === "LFr") {
      return "Min";
    } else if (_l_0.$ === "LGr") {
      return "Ελά";
    } else if (_l_0.$ === "LIt") {
      return "Min";
    } else if (_l_0.$ === "LEs") {
      return "Mín";
    } else if (_l_0.$ === "LNb") {
      return "Mín";
    } else if (_l_0.$ === "LBg") {
      return "Мин";
    } else if (_l_0.$ === "LCs") {
      return "Min";
    } else if (_l_0.$ === "LSi") {
      return "Min";
    } else if (_l_0.$ === "LFi") {
      return "Min";
    } else if (_l_0.$ === "LSv") {
      return "Min";
    } else if (_l_0.$ === "LPt") {
      return "Min";
    } else if (_l_0.$ === "LCa") {
      return "Mín";
    } else if (_l_0.$ === "LHr") {
      return "Min";
    } else {
      return "Min";
    }
  } else if (_w_0.$ === "WGraphLast") {
    if (_l_0.$ === "LDe") {
      return "Letzte";
    } else if (_l_0.$ === "LNl") {
      return "Laatste";
    } else if (_l_0.$ === "LDa") {
      return "Sidste";
    } else if (_l_0.$ === "LRo") {
      return "Ultimele";
    } else if (_l_0.$ === "LFr") {
      return "Dernier";
    } else if (_l_0.$ === "LGr") {
      return "τελευταίος";
    } else if (_l_0.$ === "LIt") {
      return "Ultimo";
    } else if (_l_0.$ === "LEs") {
      return "Últimas";
    } else if (_l_0.$ === "LNb") {
      return "Siste";
    } else if (_l_0.$ === "LBg") {
      return "Посл.";
    } else if (_l_0.$ === "LCs") {
      return "Poslední";
    } else if (_l_0.$ === "LSi") {
      return "Zadnjih";
    } else if (_l_0.$ === "LFi") {
      return "viimeisimmät";
    } else if (_l_0.$ === "LSv") {
      return "Sista";
    } else if (_l_0.$ === "LPt") {
      return "Últimos(as)";
    } else if (_l_0.$ === "LCa") {
      return "Últimes";
    } else if (_l_0.$ === "LHr") {
      return "Zadnji";
    } else {
      return "Last";
    }
  } else if (_w_0.$ === "WGraphDays") {
    if (_l_0.$ === "LDe") {
      return "Tage";
    } else if (_l_0.$ === "LNl") {
      return "Dagen";
    } else if (_l_0.$ === "LDa") {
      return "Dage";
    } else if (_l_0.$ === "LRo") {
      return "Zile";
    } else if (_l_0.$ === "LFr") {
      return "Jours";
    } else if (_l_0.$ === "LGr") {
      return "Ημέρες";
    } else if (_l_0.$ === "LIt") {
      return "Giorni";
    } else if (_l_0.$ === "LEs") {
      return "Dias";
    } else if (_l_0.$ === "LNb") {
      return "Dager";
    } else if (_l_0.$ === "LBg") {
      return "Дни";
    } else if (_l_0.$ === "LCs") {
      return "Dny";
    } else if (_l_0.$ === "LSi") {
      return "Dni";
    } else if (_l_0.$ === "LFi") {
      return "päivää";
    } else if (_l_0.$ === "LSv") {
      return "Dagarna";
    } else if (_l_0.$ === "LPt") {
      return "Dias";
    } else if (_l_0.$ === "LCa") {
      return "Dies";
    } else if (_l_0.$ === "LHr") {
      return "Dan";
    } else {
      return "Days";
    }
  } else if (_w_0.$ === "WGraphHours") {
    if (_l_0.$ === "LDe") {
      return "Stunden";
    } else if (_l_0.$ === "LNl") {
      return "Uur";
    } else if (_l_0.$ === "LDa") {
      return "Timer";
    } else if (_l_0.$ === "LRo") {
      return "Ore";
    } else if (_l_0.$ === "LFr") {
      return "Heures";
    } else if (_l_0.$ === "LGr") {
      return "Ωρες";
    } else if (_l_0.$ === "LIt") {
      return "Ore";
    } else if (_l_0.$ === "LEs") {
      return "Horas";
    } else if (_l_0.$ === "LNb") {
      return "Timer";
    } else if (_l_0.$ === "LBg") {
      return "Часа";
    } else if (_l_0.$ === "LCs") {
      return "Hodiny";
    } else if (_l_0.$ === "LSi") {
      return "Ure";
    } else if (_l_0.$ === "LFi") {
      return "tuntia";
    } else if (_l_0.$ === "LSv") {
      return "Timmarna";
    } else if (_l_0.$ === "LPt") {
      return "Horas";
    } else if (_l_0.$ === "LCa") {
      return "Hores";
    } else if (_l_0.$ === "LHr") {
      return "Sati";
    } else {
      return "Hours";
    }
  } else if (_w_0.$ === "WGraphHour") {
    if (_l_0.$ === "LDe") {
      return "Stunde";
    } else if (_l_0.$ === "LNl") {
      return "Uur";
    } else if (_l_0.$ === "LDa") {
      return "Time";
    } else if (_l_0.$ === "LRo") {
      return "Ora";
    } else if (_l_0.$ === "LFr") {
      return "Heure";
    } else if (_l_0.$ === "LGr") {
      return "Ωρα";
    } else if (_l_0.$ === "LIt") {
      return "Ora";
    } else if (_l_0.$ === "LEs") {
      return "Hora";
    } else if (_l_0.$ === "LNb") {
      return "Time";
    } else if (_l_0.$ === "LBg") {
      return "Час";
    } else if (_l_0.$ === "LCs") {
      return "Hodina";
    } else if (_l_0.$ === "LSi") {
      return "Ura";
    } else if (_l_0.$ === "LFi") {
      return "60 minuuttia";
    } else if (_l_0.$ === "LSv") {
      return "Timme";
    } else if (_l_0.$ === "LPt") {
      return "Hora";
    } else if (_l_0.$ === "LCa") {
      return "Hora";
    } else if (_l_0.$ === "LHr") {
      return "Sat";
    } else {
      return "Hour";
    }
  } else if (_w_0.$ === "WGraphMonths") {
    if (_l_0.$ === "LDe") {
      return "Monate";
    } else if (_l_0.$ === "LNl") {
      return "Maanden";
    } else if (_l_0.$ === "LDa") {
      return "Måned";
    } else if (_l_0.$ === "LRo") {
      return "Luna";
    } else if (_l_0.$ === "LFr") {
      return "Mois";
    } else if (_l_0.$ === "LGr") {
      return "Μήνες";
    } else if (_l_0.$ === "LIt") {
      return "Mesi";
    } else if (_l_0.$ === "LEs") {
      return "Meses";
    } else if (_l_0.$ === "LNb") {
      return "Måned";
    } else if (_l_0.$ === "LBg") {
      return "Месеца";
    } else if (_l_0.$ === "LCs") {
      return "Měsíce";
    } else if (_l_0.$ === "LSi") {
      return "Mesecev";
    } else if (_l_0.$ === "LFi") {
      return "Kuukautta";
    } else if (_l_0.$ === "LSv") {
      return "Månader";
    } else if (_l_0.$ === "LPt") {
      return "Meses";
    } else if (_l_0.$ === "LCa") {
      return "Mesos";
    } else if (_l_0.$ === "LHr") {
      return "Mjeseci";
    } else {
      return "Months";
    }
  } else if (_w_0.$ === "WGraphBaroLabel") {
    if (_l_0.$ === "LDe") {
      return "Luftdruck";
    } else if (_l_0.$ === "LNl") {
      return "Luchtdruk";
    } else if (_l_0.$ === "LDa") {
      return "Lufttryk";
    } else if (_l_0.$ === "LRo") {
      return "Presiunea";
    } else if (_l_0.$ === "LFr") {
      return "Pression";
    } else if (_l_0.$ === "LGr") {
      return "Πίεση";
    } else if (_l_0.$ === "LIt") {
      return "Pressione";
    } else if (_l_0.$ === "LEs") {
      return "Presión";
    } else if (_l_0.$ === "LNb") {
      return "Lufttrykk";
    } else if (_l_0.$ === "LBg") {
      return "Налягане";
    } else if (_l_0.$ === "LCs") {
      return "Tlak";
    } else if (_l_0.$ === "LSi") {
      return "Pritisk";
    } else if (_l_0.$ === "LFi") {
      return "Paine";
    } else if (_l_0.$ === "LSv") {
      return "Lufttryck";
    } else if (_l_0.$ === "LPt") {
      return "Pressão";
    } else if (_l_0.$ === "LCa") {
      return "Pressió";
    } else if (_l_0.$ === "LHr") {
      return "Tlak";
    } else {
      return "Pressure";
    }
  } else if (_w_0.$ === "WGraphHumidityLabel") {
    if (_l_0.$ === "LDe") {
      return "Prozent";
    } else if (_l_0.$ === "LNl") {
      return "Procent";
    } else if (_l_0.$ === "LDa") {
      return "Procent";
    } else if (_l_0.$ === "LRo") {
      return "Procentul";
    } else if (_l_0.$ === "LFr") {
      return "Pour cent";
    } else if (_l_0.$ === "LGr") {
      return "Τοις εκατό";
    } else if (_l_0.$ === "LIt") {
      return "Percentuale";
    } else if (_l_0.$ === "LEs") {
      return "Porcentaje";
    } else if (_l_0.$ === "LNb") {
      return "Prosent";
    } else if (_l_0.$ === "LBg") {
      return "Процент";
    } else if (_l_0.$ === "LCs") {
      return "Procent";
    } else if (_l_0.$ === "LSi") {
      return "Procent";
    } else if (_l_0.$ === "LFi") {
      return "Prosentti";
    } else if (_l_0.$ === "LSv") {
      return "Procent";
    } else if (_l_0.$ === "LPt") {
      return "Percentagem";
    } else if (_l_0.$ === "LCa") {
      return "Percentatge";
    } else if (_l_0.$ === "LHr") {
      return "Postotak";
    } else {
      return "Percent";
    }
  } else if (_w_0.$ === "WGraphSolarLabel") {
    if (_l_0.$ === "LDe") {
      return "Solarstrahlung";
    } else if (_l_0.$ === "LNl") {
      return "Instraling";
    } else if (_l_0.$ === "LDa") {
      return "Indstråling";
    } else if (_l_0.$ === "LRo") {
      return "Radiația";
    } else if (_l_0.$ === "LFr") {
      return "Irradiation";
    } else if (_l_0.$ === "LGr") {
      return "Ακτινοβολία";
    } else if (_l_0.$ === "LIt") {
      return "Irradiazione";
    } else if (_l_0.$ === "LEs") {
      return "Radiación";
    } else if (_l_0.$ === "LNb") {
      return "";
    } else if (_l_0.$ === "LBg") {
      return "Интензитет";
    } else if (_l_0.$ === "LCs") {
      return "Záření";
    } else if (_l_0.$ === "LSi") {
      return "Obsevanje";
    } else if (_l_0.$ === "LFi") {
      return "Säteilyvoimakkuus";
    } else if (_l_0.$ === "LSv") {
      return "Solstrålning";
    } else if (_l_0.$ === "LPt") {
      return "Irradiância";
    } else if (_l_0.$ === "LCa") {
      return "Radiació";
    } else if (_l_0.$ === "LHr") {
      return "Ozračenost";
    } else {
      return "Irradiance";
    }
  } else if (_w_0.$ === "WGraphLabelUV") {
    if (_l_0.$ === "LDe") {
      return "Index";
    } else if (_l_0.$ === "LNl") {
      return "Index";
    } else if (_l_0.$ === "LDa") {
      return "Indeks";
    } else if (_l_0.$ === "LRo") {
      return "Index";
    } else if (_l_0.$ === "LFr") {
      return "Index";
    } else if (_l_0.$ === "LGr") {
      return "Δείκτης";
    } else if (_l_0.$ === "LIt") {
      return "Indice";
    } else if (_l_0.$ === "LEs") {
      return "Índice";
    } else if (_l_0.$ === "LNb") {
      return "Index";
    } else if (_l_0.$ === "LBg") {
      return "Индекс";
    } else if (_l_0.$ === "LCs") {
      return "Index";
    } else if (_l_0.$ === "LSi") {
      return "Indeks";
    } else if (_l_0.$ === "LFi") {
      return "Indeksi";
    } else if (_l_0.$ === "LSv") {
      return "Index";
    } else if (_l_0.$ === "LPt") {
      return "Índice";
    } else if (_l_0.$ === "LCa") {
      return "Index";
    } else if (_l_0.$ === "LHr") {
      return "Indeks";
    } else {
      return "Index";
    }
  } else if (_w_0.$ === "WGraphLabelWindDirection") {
    if (_l_0.$ === "LDe") {
      return "Windrichtung";
    } else if (_l_0.$ === "LNl") {
      return "Windrichting";
    } else if (_l_0.$ === "LDa") {
      return "Vindretning";
    } else if (_l_0.$ === "LRo") {
      return "Direcția vântului";
    } else if (_l_0.$ === "LFr") {
      return "Direction du vent";
    } else if (_l_0.$ === "LGr") {
      return "Κατεύθυνση ανέμου";
    } else if (_l_0.$ === "LIt") {
      return "La direzione del vento";
    } else if (_l_0.$ === "LEs") {
      return "Dirección del viento";
    } else if (_l_0.$ === "LNb") {
      return "Vindretning";
    } else if (_l_0.$ === "LBg") {
      return "Посока на вятъра";
    } else if (_l_0.$ === "LCs") {
      return "Směr větru";
    } else if (_l_0.$ === "LSi") {
      return "Smer vetra";
    } else if (_l_0.$ === "LFi") {
      return "Tuulen suunta";
    } else if (_l_0.$ === "LSv") {
      return "Vindriktning";
    } else if (_l_0.$ === "LPt") {
      return "Direção do vento";
    } else if (_l_0.$ === "LCa") {
      return "Direcció del vent";
    } else if (_l_0.$ === "LHr") {
      return "Smjer vjetra";
    } else {
      return "Wind Direction";
    }
  } else if (_w_0.$ === "WButtonLabelGraphs") {
    if (_l_0.$ === "LDe") {
      return "Grafik";
    } else if (_l_0.$ === "LNl") {
      return "Grafieken";
    } else if (_l_0.$ === "LDa") {
      return "Grafer";
    } else if (_l_0.$ === "LRo") {
      return "Grafice";
    } else if (_l_0.$ === "LFr") {
      return "Graphiques";
    } else if (_l_0.$ === "LGr") {
      return "διάγραμμα";
    } else if (_l_0.$ === "LIt") {
      return "Grafici";
    } else if (_l_0.$ === "LEs") {
      return "Gráficos";
    } else if (_l_0.$ === "LNb") {
      return "Grafer";
    } else if (_l_0.$ === "LBg") {
      return "Графики";
    } else if (_l_0.$ === "LCs") {
      return "Grafy";
    } else if (_l_0.$ === "LSi") {
      return "Graf";
    } else if (_l_0.$ === "LFi") {
      return "Käyrät";
    } else if (_l_0.$ === "LSv") {
      return "Grafer";
    } else if (_l_0.$ === "LPt") {
      return "Gráficos";
    } else if (_l_0.$ === "LCa") {
      return "Gràfics";
    } else if (_l_0.$ === "LHr") {
      return "Grafikon";
    } else {
      return "Graphs";
    }
  } else if (_w_0.$ === "WButtonLabelRecords") {
    if (_l_0.$ === "LDe") {
      return "Rekorde";
    } else if (_l_0.$ === "LNl") {
      return "Records";
    } else if (_l_0.$ === "LDa") {
      return "Rekorder";
    } else if (_l_0.$ === "LRo") {
      return "Recorduri";
    } else if (_l_0.$ === "LFr") {
      return "Records";
    } else if (_l_0.$ === "LGr") {
      return "Εγγραφές";
    } else if (_l_0.$ === "LIt") {
      return "Records";
    } else if (_l_0.$ === "LEs") {
      return "Récords";
    } else if (_l_0.$ === "LNb") {
      return "Rekorder";
    } else if (_l_0.$ === "LBg") {
      return "Pекорди";
    } else if (_l_0.$ === "LCs") {
      return "Rekordy";
    } else if (_l_0.$ === "LSi") {
      return "Rekordi";
    } else if (_l_0.$ === "LFi") {
      return "Arkisto";
    } else if (_l_0.$ === "LSv") {
      return "Rekord";
    } else if (_l_0.$ === "LPt") {
      return "Registos";
    } else if (_l_0.$ === "LCa") {
      return "Rècords";
    } else if (_l_0.$ === "LHr") {
      return "Rekordi";
    } else {
      return "Records";
    }
  } else if (_w_0.$ === "WButtonLabelAltitude") {
    if (_l_0.$ === "LDe") {
      return "Höhe";
    } else if (_l_0.$ === "LNl") {
      return "Hoogte";
    } else if (_l_0.$ === "LDa") {
      return "Højde";
    } else if (_l_0.$ === "LRo") {
      return "Altitudinea";
    } else if (_l_0.$ === "LFr") {
      return "Altitude";
    } else if (_l_0.$ === "LGr") {
      return "Υψόμετρο";
    } else if (_l_0.$ === "LIt") {
      return "Altitudine";
    } else if (_l_0.$ === "LEs") {
      return "Altitud";
    } else if (_l_0.$ === "LNb") {
      return "Høyde";
    } else if (_l_0.$ === "LBg") {
      return "Bисочина";
    } else if (_l_0.$ === "LCs") {
      return "Nadmořská výška";
    } else if (_l_0.$ === "LSi") {
      return "Nadmorska višina";
    } else if (_l_0.$ === "LFi") {
      return "Korkeus";
    } else if (_l_0.$ === "LSv") {
      return "Höjd";
    } else if (_l_0.$ === "LPt") {
      return "Altitude";
    } else if (_l_0.$ === "LCa") {
      return "Altitud";
    } else if (_l_0.$ === "LHr") {
      return "Nadmorska visina";
    } else {
      return "Altitude";
    }
  } else if (_w_0.$ === "WRecordsForMonth") {
    if (_l_0.$ === "LDe") {
      return "Monatsrekorde";
    } else if (_l_0.$ === "LNl") {
      return "Records voor deze maand";
    } else if (_l_0.$ === "LDa") {
      return "Rekorder for denne måned";
    } else if (_l_0.$ === "LRo") {
      return "Recordul pentru aceasta lună";
    } else if (_l_0.$ === "LFr") {
      return "Records de ce mois";
    } else if (_l_0.$ === "LGr") {
      return "Εγγραφές για αυτόν τον μήνα";
    } else if (_l_0.$ === "LIt") {
      return "Record per questo mese";
    } else if (_l_0.$ === "LEs") {
      return "Registros para este mes";
    } else if (_l_0.$ === "LNb") {
      return "Rekorder denne måneden";
    } else if (_l_0.$ === "LBg") {
      return "Рекорди за този месец";
    } else if (_l_0.$ === "LCs") {
      return "Záznamy za tento měsíc";
    } else if (_l_0.$ === "LSi") {
      return "Rekordi za ta mesec";
    } else if (_l_0.$ === "LFi") {
      return "Tallenteet tässä kuussa";
    } else if (_l_0.$ === "LSv") {
      return "Rekordet denna månad";
    } else if (_l_0.$ === "LPt") {
      return "Registos deste mês";
    } else if (_l_0.$ === "LCa") {
      return "Registres d'aquest mes";
    } else if (_l_0.$ === "LHr") {
      return "Rekordi za ovaj mjesec";
    } else {
      return "Records for this month";
    }
  } else if (_w_0.$ === "WRecordsForYear") {
    if (_l_0.$ === "LDe") {
      return "Rekorde dieses Jahr";
    } else if (_l_0.$ === "LNl") {
      return "Records voor dit jaar";
    } else if (_l_0.$ === "LDa") {
      return "Rekorder for dette år";
    } else if (_l_0.$ === "LRo") {
      return "Recordul pentru acest an";
    } else if (_l_0.$ === "LFr") {
      return "Records de cette année";
    } else if (_l_0.$ === "LGr") {
      return "Εγγραφές για το τρέχον έτος";
    } else if (_l_0.$ === "LIt") {
      return "Record per quest'anno";
    } else if (_l_0.$ === "LEs") {
      return "Registros para este año";
    } else if (_l_0.$ === "LNb") {
      return "Rekorder i år";
    } else if (_l_0.$ === "LBg") {
      return "Рекорди за тази година";
    } else if (_l_0.$ === "LCs") {
      return "Záznamy za tento rok";
    } else if (_l_0.$ === "LSi") {
      return "Rekordi za to leto";
    } else if (_l_0.$ === "LFi") {
      return "Tallenteet tälle vuodelle";
    } else if (_l_0.$ === "LSv") {
      return " Rekordet för detta år";
    } else if (_l_0.$ === "LPt") {
      return "Registos deste ano";
    } else if (_l_0.$ === "LCa") {
      return "Registres d'aquest any";
    } else if (_l_0.$ === "LHr") {
      return "Rekordi za ovu godinu";
    } else {
      return "Records for this year";
    }
  } else if (_w_0.$ === "WRecordsAllTime") {
    if (_l_0.$ === "LDe") {
      return "Allzeitrekorde";
    } else if (_l_0.$ === "LNl") {
      return "Records aller tijden";
    } else if (_l_0.$ === "LDa") {
      return "Rekorder siden start";
    } else if (_l_0.$ === "LRo") {
      return "Recordul pentru toți anii";
    } else if (_l_0.$ === "LFr") {
      return "Records absolus";
    } else if (_l_0.$ === "LGr") {
      return "Όλες οι εγγραφές χρόνου";
    } else if (_l_0.$ === "LIt") {
      return "Record di tutti i tempi";
    } else if (_l_0.$ === "LEs") {
      return "Registros de todos los tiempos";
    } else if (_l_0.$ === "LNb") {
      return "Rekorder totalt";
    } else if (_l_0.$ === "LBg") {
      return "Рекорди за всичките години";
    } else if (_l_0.$ === "LCs") {
      return "Veškeré záznamy";
    } else if (_l_0.$ === "LSi") {
      return "Rekordi (all time)";
    } else if (_l_0.$ === "LFi") {
      return "Kaikki tallenteet";
    } else if (_l_0.$ === "LSv") {
      return "Högsta rekordet någonsin";
    } else if (_l_0.$ === "LPt") {
      return "Registos históricos";
    } else if (_l_0.$ === "LCa") {
      return "Registres de tots els temps";
    } else if (_l_0.$ === "LHr") {
      return "Svi vremenski rekordi";
    } else {
      return "All time records";
    }
  } else if (_w_0.$ === "WForecastTitle") {
    if (_l_0.$ === "LDe") {
      return "Vorhersage";
    } else if (_l_0.$ === "LNl") {
      return "Voorspelling";
    } else if (_l_0.$ === "LDa") {
      return "Vejrudsigt";
    } else if (_l_0.$ === "LRo") {
      return "Prognoza";
    } else if (_l_0.$ === "LFr") {
      return "Prévisions";
    } else if (_l_0.$ === "LGr") {
      return "Πρόβλεψη";
    } else if (_l_0.$ === "LIt") {
      return "Prevedere";
    } else if (_l_0.$ === "LEs") {
      return "Pronóstico";
    } else if (_l_0.$ === "LNb") {
      return "Værvarsel";
    } else if (_l_0.$ === "LBg") {
      return "Прогноза";
    } else if (_l_0.$ === "LCs") {
      return "Předpověď";
    } else if (_l_0.$ === "LSi") {
      return "Napoved";
    } else if (_l_0.$ === "LFi") {
      return "Ennuste";
    } else if (_l_0.$ === "LSv") {
      return "Prognos";
    } else if (_l_0.$ === "LPt") {
      return "Previsão";
    } else if (_l_0.$ === "LCa") {
      return "Predicció";
    } else if (_l_0.$ === "LHr") {
      return "Prognoza";
    } else {
      return "Forecast";
    }
  } else if (_w_0.$ === "WHeatIndexTitle") {
    if (_l_0.$ === "LDe") {
      return "Hitzeindex";
    } else if (_l_0.$ === "LNl") {
      return "Hitte Index";
    } else if (_l_0.$ === "LDa") {
      return "Varmeindeks";
    } else if (_l_0.$ === "LRo") {
      return "Indicele de caldură";
    } else if (_l_0.$ === "LFr") {
      return "Indice de chaleur";
    } else if (_l_0.$ === "LGr") {
      return "Δείκτης θερμότητας";
    } else if (_l_0.$ === "LIt") {
      return "Indice di calore";
    } else if (_l_0.$ === "LEs") {
      return "Índice de calor";
    } else if (_l_0.$ === "LNb") {
      return "Følt varme";
    } else if (_l_0.$ === "LBg") {
      return "Топл. индекс";
    } else if (_l_0.$ === "LCs") {
      return "Teplotní index";
    } else if (_l_0.$ === "LSi") {
      return "Toplotni indeks";
    } else if (_l_0.$ === "LFi") {
      return "Lämpöindeksi";
    } else if (_l_0.$ === "LSv") {
      return "Värmeindex";
    } else if (_l_0.$ === "LPt") {
      return "Índice de calor";
    } else if (_l_0.$ === "LCa") {
      return "Xafogor";
    } else if (_l_0.$ === "LHr") {
      return "Indeks topline";
    } else {
      return "Heat Index";
    }
  } else if (_w_0.$ === "WHeatIndexDescription") {
    if (_l_0.$ === "LDe") {
      return "Wie es sich wirklich anfühlt, wenn die relative Luftfeuchtigkeit in Relation zur aktuellen Luftfeuchtigkeit steht.";
    } else if (_l_0.$ === "LNl") {
      return "De warmte-index is een getal dat aangeeft hoe een mens gemiddeld een temperatuur in combinatie met een bepaalde vochtigheidsgraad beleeft, hoe hij of zij dit aanvoelt.";
    } else if (_l_0.$ === "LDa") {
      return "Hvor varmt det føles når luftfugtigheden kombineres med luftens temperatur.";
    } else if (_l_0.$ === "LRo") {
      return "Cât de cald se simte cu adevărat atunci când umiditatea relativă este luată în considerare cu temperatura reală a aerului.";
    } else if (_l_0.$ === "LFr") {
      return "Il fait vraiment très chaud lorsque l’humidité relative est prise en compte dans la température réelle de l’air.";
    } else if (_l_0.$ === "LGr") {
      return "Πόσο ζεστό αισθάνεται πραγματικά όταν η σχετική υγρασία υπολογίζεται με την πραγματική θερμοκρασία του αέρα.";
    } else if (_l_0.$ === "LIt") {
      return "Quanto fa veramente caldo quando l'umidità relativa viene calcolata con la temperatura dell'aria effettiva.";
    } else if (_l_0.$ === "LEs") {
      return "Qué calor realmente se siente cuando la humedad relativa se tiene en cuenta con la temperatura real del aire.";
    } else if (_l_0.$ === "LNb") {
      return "Hvor varmt det virkelig føles når den relative luftfuktigheten er tatt med i selve lufttemperaturen..";
    } else if (_l_0.$ === "LBg") {
      return "Топлинен индекс: Колко горещо се усеща в действителност, при текущата комбинация на относителна влажност и температура на въздуха.";
    } else if (_l_0.$ === "LCs") {
      return "Jakou teplotu pociťujeme, když je skutečná teplota zohledněna relativní vlhkostí vzduchu.";
    } else if (_l_0.$ === "LSi") {
      return "Občutek vročine, ko je relativna vlažnost upoštevana z dejansko temperaturo zraka.";
    } else if (_l_0.$ === "LFi") {
      return "Kuinka kuumalta ilma tuntuu, kun suhteellinen kosteus otetaan huomioon todellisen ilman lämpötilan suhteen.";
    } else if (_l_0.$ === "LSv") {
      return "Hur varmt det känns när relativa fuktigheten kombineras med aktuell temperatur.";
    } else if (_l_0.$ === "LPt") {
      return "Temperatura percetível. Calculado combinando a temperatura e humidade relativa.";
    } else if (_l_0.$ === "LCa") {
      return "El calor que realment se sent quan la humitat relativa es relaciona amb la temperatura de l'aire.";
    } else if (_l_0.$ === "LHr") {
      return "Koliko je stvarno vruće kada se relativna vlažnost uračuna u stvarnu temperaturu zraka.";
    } else {
      return "How hot it really feels when relative humidity is factored with the actual air temperature.";
    }
  } else {
    if (_l_0.$ === "LDe") {
      return "Beaufort Skala";
    } else if (_l_0.$ === "LNl") {
      return "Schaal van Beaufort";
    } else if (_l_0.$ === "LNb") {
      return "Beaufort Skala";
    } else if (_l_0.$ === "LBg") {
      return "Скала на Бофорт";
    } else if (_l_0.$ === "LCs") {
      return "Beaufortova stupnice síly větru";
    } else if (_l_0.$ === "LSi") {
      return "Boforjeva lestvica";
    } else if (_l_0.$ === "LFi") {
      return "Boforiasteikko";
    } else if (_l_0.$ === "LSv") {
      return "Beaufort skalan";
    } else if (_l_0.$ === "LPt") {
      return "Escala de Beaufort";
    } else if (_l_0.$ === "LCa") {
      return "Escala de Beaufort";
    } else if (_l_0.$ === "LHr") {
      return "Boforova skala";
    } else {
      return "Beaufort Scale";
    }
  }
}

function $lib_env_kv_key(_kv_0) {
  const _k_0 = _kv_0["k"];
  return _k_0;
}

function $lib_env_kv_val(_kv_0) {
  const _v_0 = _kv_0["v"];
  return _v_0;
}

function $lib_env_kv_after(_s_0) {
  if (_s_0 === "") {
    return "";
  } else {
    const _c_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    return $Bool_pick($$Char_is_eq(_c_0, "="), _t_0, $$lib_env_kv_after(_t_0));
  }
}

function $lib_env_kv_before(_s_0) {
  if (_s_0 === "") {
    return "";
  } else {
    const _c_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    return $Bool_pick($$Char_is_eq(_c_0, "="), "", (_c_0 + $$lib_env_kv_before(_t_0)));
  }
}

function $lib_env_kv_parse(_line_0) {
  return {$: "KV", "k": $$lib_env_kv_before(_line_0), "v": $$lib_env_kv_after(_line_0)};
}

function $lib_env_kv_list(_lines_0) {
  if (_lines_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _l_0 = _lines_0["head"];
    const _rest_0 = _lines_0["tail"];
    const _r_0 = $$lib_env_kv_list(_rest_0);
    return $Bool_pick($$String_is_empty(_l_0), _r_0, {$: "Con", "head": $$lib_env_kv_parse(_l_0), "tail": _r_0});
  }
}

function $lib_env_kv_lines(_text_0) {
  return $lib_env_kv_list($$String_split(_text_0, $$Char_from_u32(10)));
}

function $lib_env_no_clock() {
  return {$: "Clock", "year": 1970, "month": 1, "day": 1, "hour": 0, "minute": 0, "second": 0, "ms": 0};
}

function $lib_env_cr(_e_0, _i_0) {
  const _cr_0 = _e_0["cr"];
  return $lib_raw_at(_cr_0, _i_0);
}

function $lib_env_cre(_e_0, _i_0) {
  const _cre_0 = _e_0["cre"];
  return $lib_raw_at(_cre_0, _i_0);
}

function $lib_env_crh(_e_0, _i_0) {
  const _crh_0 = _e_0["crh"];
  return $lib_raw_at(_crh_0, _i_0);
}

function $lib_env_crd(_e_0, _i_0) {
  const _crd_0 = _e_0["crd"];
  return $lib_raw_at(_crd_0, _i_0);
}

function $lib_env_units(_e_0) {
  const _u_0 = _e_0["units"];
  return _u_0;
}

function $lib_env_lang(_e_0) {
  const _l_0 = _e_0["lang"];
  return _l_0;
}

function $lib_env_clock(_e_0) {
  const _c_0 = _e_0["clock"];
  return _c_0;
}

function $lib_env_word(_e_0, _w_0) {
  return $lib_dict_get(_w_0, $$lib_env_lang(_e_0));
}

function $lib_env_reading(_e_0, _k_0, _raw_0) {
  return $lib_units_with_label($$lib_env_units(_e_0), _k_0, _raw_0);
}

function $lib_env_label(_e_0, _k_0) {
  return $lib_units_label($$lib_env_units(_e_0), _k_0);
}

function $lib_env_find(_key_0, _dflt_0, _kvs_0) {
  if (_kvs_0.$ === "Nil") {
    return _dflt_0;
  } else {
    const _kv_0 = _kvs_0["head"];
    const _rest_0 = _kvs_0["tail"];
    return $Bool_pick($$String_eq($$lib_env_kv_key(_kv_0), _key_0), $$lib_env_kv_val(_kv_0), $$lib_env_find(_key_0, _dflt_0, _rest_0));
  }
}

function $lib_env_opt(_e_0, _key_0, _dflt_0) {
  const _cfg_0 = _e_0["cfg"];
  return $lib_env_find(_key_0, _dflt_0, _cfg_0);
}

function $lib_env_on(_e_0, _key_0) {
  return $String_eq($$lib_env_opt(_e_0, _key_0, "false"), "true");
}

function $lib_env_changed(_fresh_0, _value_0, _old_0) {
  const _x_0 = $$lib_num_parse(_value_0);
  const _x_1 = $$lib_num_parse(_old_0);
  return $Bool_pick(_fresh_0, (_x_0 !== _x_1), $$Bool_not($$String_eq(_value_0, _old_0)));
}

function $lib_env_box_vw(_b_0) {
  const _vw_0 = _b_0["vw"];
  return _vw_0;
}

function $lib_env_box_vh(_b_0) {
  const _vh_0 = _b_0["vh"];
  return _vh_0;
}

function $lib_scene_at(_x_0, _y_0) {
  return {$: "Xf", "x": _x_0, "y": _y_0, "rot": 0, "regx": 0, "regy": 0, "visible": true};
}

function $lib_scene_origin() {
  return $lib_scene_at(0, 0);
}

function $lib_scene_hidden() {
  return {$: "Xf", "x": 0, "y": 0, "rot": 0, "regx": 0, "regy": 0, "visible": false};
}

function $lib_scene_shape(_gfx_0) {
  return {$: "NShape", "xf": $$lib_scene_origin(), "gfx": _gfx_0, "mask": {$: "Nil"}};
}

function $lib_scene_shape_at(_xf_0, _gfx_0) {
  return {$: "NShape", "xf": _xf_0, "gfx": _gfx_0, "mask": {$: "Nil"}};
}

function $lib_scene_masked(_gfx_0, _mask_0) {
  return {$: "NShape", "xf": $$lib_scene_origin(), "gfx": _gfx_0, "mask": _mask_0};
}

function $lib_scene_label(_x_0, _y_0, _text_0, _font_0, _color_0, _align_0, _base_0) {
  return {$: "NLabel", "xf": $$lib_scene_at(_x_0, _y_0), "text": _text_0, "font": _font_0, "color": _color_0, "align": _align_0, "base": _base_0, "maxw": 0};
}

function $lib_scene_label_w(_x_0, _y_0, _text_0, _font_0, _color_0, _align_0, _base_0, _maxw_0) {
  return {$: "NLabel", "xf": $$lib_scene_at(_x_0, _y_0), "text": _text_0, "font": _font_0, "color": _color_0, "align": _align_0, "base": _base_0, "maxw": _maxw_0};
}

function $lib_scene_bold(_px_0, _family_0) {
  const _x_0 = f32_show(_px_0);
  const _x_1 = ("px " + _family_0);
  const _x_2 = (_x_0 + _x_1);
  return ("bold " + _x_2);
}

function $lib_scene_plain(_px_0, _family_0) {
  const _x_0 = f32_show(_px_0);
  const _x_1 = ("px " + _family_0);
  return (_x_0 + _x_1);
}

function $lib_scene_rgb(_c_0) {
  const _x_0 = (_c_0 + ")");
  return ("rgb(" + _x_0);
}

function $lib_scene_rgba(_c_0, _a_0) {
  const _x_0 = (_a_0 + ")");
  const _x_1 = (", " + _x_0);
  const _x_2 = (_c_0 + _x_1);
  return ("rgba(" + _x_2);
}

function $lib_scene_max_centred(_canvas_w_0, _stage_x_0, _x_0) {
  const _x_1 = Math.fround(_canvas_w_0 - _stage_x_0);
  const _m_0 = $$F32_min(Math.fround(_x_1 - _x_0), Math.fround(_x_0 + _stage_x_0));
  const _x_2 = Math.fround(_m_0 * 2);
  return Math.fround(_x_2 * 0.949999988079071);
}

function $lib_scene_max_left(_canvas_w_0, _stage_x_0, _x_0) {
  const _x_1 = Math.fround(_canvas_w_0 - _stage_x_0);
  const _x_2 = Math.fround(_x_1 - _x_0);
  return Math.fround(_x_2 * 0.949999988079071);
}

function $lib_scene_ex(_x_0) {
  return {$: "Ex", "v": _x_0, "s": f32_show(_x_0)};
}

function $lib_scene_ex_mul(_a_0, _b_0) {
  const _x_0 = _a_0["v"];
  const _s_0 = _a_0["s"];
  const _y_0 = _b_0["v"];
  const _t_0 = _b_0["s"];
  const _x_1 = (_t_0 + ")");
  const _x_2 = ("*" + _x_1);
  const _x_3 = (_s_0 + _x_2);
  return {$: "Ex", "v": Math.fround(_x_0 * _y_0), "s": ("(" + _x_3)};
}

function $lib_scene_ex_div(_a_0, _b_0) {
  const _x_0 = _a_0["v"];
  const _s_0 = _a_0["s"];
  const _y_0 = _b_0["v"];
  const _t_0 = _b_0["s"];
  const _x_1 = (_t_0 + ")");
  const _x_2 = ("/" + _x_1);
  const _x_3 = (_s_0 + _x_2);
  return {$: "Ex", "v": Math.fround(_x_0 / _y_0), "s": ("(" + _x_3)};
}

function $lib_scene_ex_add(_a_0, _b_0) {
  const _x_0 = _a_0["v"];
  const _s_0 = _a_0["s"];
  const _y_0 = _b_0["v"];
  const _t_0 = _b_0["s"];
  const _x_1 = (_t_0 + ")");
  const _x_2 = ("+" + _x_1);
  const _x_3 = (_s_0 + _x_2);
  return {$: "Ex", "v": Math.fround(_x_0 + _y_0), "s": ("(" + _x_3)};
}

function $lib_scene_ex_sub(_a_0, _b_0) {
  const _x_0 = _a_0["v"];
  const _s_0 = _a_0["s"];
  const _y_0 = _b_0["v"];
  const _t_0 = _b_0["s"];
  const _x_1 = (_t_0 + ")");
  const _x_2 = ("-" + _x_1);
  const _x_3 = (_s_0 + _x_2);
  return {$: "Ex", "v": Math.fround(_x_0 - _y_0), "s": ("(" + _x_3)};
}

function $lib_scene_ex_v(_a_0) {
  const _x_0 = _a_0["v"];
  return _x_0;
}

function $lib_scene_boldx(_px_0, _family_0) {
  const _s_0 = _px_0["s"];
  const _x_0 = ("}px " + _family_0);
  const _x_1 = (_s_0 + _x_0);
  return ("bold {" + _x_1);
}

function $lib_scene_plainx(_px_0, _family_0) {
  const _s_0 = _px_0["s"];
  const _x_0 = ("}px " + _family_0);
  const _x_1 = (_s_0 + _x_0);
  return ("{" + _x_1);
}

function $lib_chart_defaults() {
  return {$: "Defaults", "tension": 0.10000000149011612, "line_width": 4, "cap": "round", "radius": 2, "hit_radius": 10, "point_border": 10, "hover_radius": 5, "duration": 0, "responsive": false, "keep_aspect": false, "legend": false, "font": "Arial", "fill_w": 1000, "fill_h": 1000};
}

function $lib_markup_upper() {
  return "    <!-- The Records Modal -->    <div id=\"recordsModal\" class=\"modal\">        <!-- Modal content -->        <div class=\"modal-content\">            <div id=\"recordsHeader\" class=\"modal-header\">                <span id=\"recordsClose\" class=\"close\">&#215</span>                <h2 id=\"recordsHeaderText\" class=\"header-text\"></h2>            </div>            <div id=\"modalRecordsDiv\">                <table id=\"recordsTable\">                </table>            </div>            <div id=\"recordsFooter\" class=\"modal-footer\">                <h3 class=\"footer-text\"></h3>                <div class=\"select-style\">                    <select id=\"selectMenuRecords\">                    </select>                </div>            </div>        </div>    </div>    <!-- The Forecast Modal -->    <div id=\"forecastModal\" class=\"modal\">        <!-- Modal content -->        <div class=\"modal-content\">            <div id=\"forecastHeader\" class=\"modal-header\">                <span id=\"forecastClose\" class=\"close\">&#215</span>                <h2 id=\"forecastHeaderText\" class=\"header-text\"></h2>            </div>            <div id=\"modalForecastDiv\">            </div>            <div id=\"forecastFooter\" class=\"modal-footer\">                <h3 class=\"footer-text\"></h3>            </div>        </div>    </div>    <!-- The Graph Modal -->    <div id=\"myModal\" class=\"modal\">        <!-- Modal content -->        <div class=\"modal-content\">            <div id=\"graphHeader\" class=\"modal-header\">                <span id=\"graphClose\" class=\"close\">&#215</span>                <h2 id=\"graphHeaderText\" class=\"header-text\">FreshWDL</h2>            </div>            <div id=\"ModalCanvasDiv\" class=\"OuterCanvasDiv\">                <canvas id=\"ModalCanvas\" style=\"background-color:#FFFFFF\">                Live weather display.                </canvas>            </div>            <div id=\"graphFooter\" class=\"modal-footer\">                <h3 class=\"footer-text\"></h3>                <div class=\"select-style\">                    <select id=\"selectMenu\">                    </select>                </div>            </div>        </div>    </div>";
}

function $lib_markup_inner() {
  return "    <div id=\"FWDLcontainer\">        <div id=\"top\" class=\"widgetContainer\">            <canvas id=\"MoonSun01\"></canvas>            <canvas id=\"Status01\"></canvas>            <div id=\"forecastText\", style=\"overflow: hidden;\"></div>        </div>        <div id=\"left\" class=\"widgetContainer\">            <div id=\"leftTop\" class=\"widgetContainer\">                <canvas id=\"TempBar01\"></canvas>            </div>            <canvas id=\"HumidityGauge01\"></canvas>        </div>        <div id=\"center\" class=\"widgetContainer\">            <div id=\"centerTop\" class=\"widgetContainer\">                <canvas id=\"Windchill01\"></canvas>                <canvas id=\"WindGauge01\"></canvas>                <canvas id=\"WindSpeed01\"></canvas>            </div>            <div id=\"centerBottom\" class=\"widgetContainer\">                <div id=\"leftCenterBottom\" class=\"widgetContainer\">                    <canvas id=\"SolarBar01\"></canvas>                    <canvas id=\"UVBar01\"></canvas>                    <canvas id=\"Barometer01\"></canvas>                    <canvas id=\"Apparent01\"></canvas>                </div>                <div id=\"rightCenterBottom\" class=\"widgetContainer\">                    <canvas id=\"TitleRainfall01\"></canvas>                    <canvas id=\"RainBar1\"></canvas>                    <canvas id=\"RainBar2\"></canvas>                    <canvas id=\"RainBar3\"></canvas>                </div>            </div>        </div>        <div id=\"right\" class=\"widgetContainer\">            <div id=\"rightLeft\" class=\"widgetContainer\">                <div id=\"rainGraphCanvas01CanvasDiv\" class=\"OuterCanvasDiv\">                    <canvas id=\"rainGraphCanvas01\"></canvas>                </div>                <div id=\"windGraphCanvas01CanvasDiv\" class=\"OuterCanvasDiv\">                    <canvas id=\"windGraphCanvas01\"></canvas>                </div>            </div>            <div id=\"rightRight\" class=\"widgetContainer\">                <div id=\"tempGraphCanvas01CanvasDiv\" class=\"OuterCanvasDiv\">                    <canvas id=\"tempGraphCanvas01\"></canvas>                </div>                <div id=\"baroGraphCanvas01CanvasDiv\" class=\"OuterCanvasDiv\">                    <canvas id=\"baroGraphCanvas01\"></canvas>                </div>            </div>        </div>        <div id=\"bottom\" class=\"widgetContainer\">            <button style=\"display: none;\" id=\"AltitudeButton\" class=\"buttons\"></button>            <button id=\"PressureButton\" class=\"buttons\"></button>            <button id=\"WindButton\" class=\"buttons\"></button>            <button id=\"RainfallButton\" class=\"buttons\"></button>            <button id=\"TempButton\" class=\"buttons\"></button>            <button id=\"RecordsButton\" class=\"buttons\"></button>            <button id=\"GraphsButton\" class=\"buttons\"></button>        </div>    </div>    <div id=\"Version\" style=\"float: right; font-size: 0.8em;\"> <p>yerren@renerica.com</p></div>";
}

function $lib_markup_inner_02() {
  return "    <div id=\"FWDLcontainer\">        <div id=\"top\" class=\"widgetContainer\">            <canvas id=\"MoonSun01\"></canvas>            <canvas id=\"Status01\"></canvas>            <div id=\"forecastText\", style=\"overflow: hidden;\"></div>        </div>        <div id=\"left\" class=\"widgetContainer\">            <div id=\"leftTopLeft\" class=\"widgetContainer\">                <canvas id=\"TempBar01\"></canvas>            </div>            <div id=\"leftTopRight\" class=\"widgetContainer\">                <canvas id=\"Windchill01\"></canvas>            </div>            <div id=\"leftBottomLeft\" class=\"widgetContainer\">                <canvas id=\"TempBar02\"></canvas>            </div>            <div id=\"leftBottomRight\" class=\"widgetContainer\">                <canvas id=\"TempBar03\"></canvas>            </div>        </div>        <div id=\"center\" class=\"widgetContainer\">            <div id=\"centerTop\" class=\"widgetContainer\">                <canvas id=\"WindGauge01\"></canvas>                <canvas id=\"WindSpeed01\"></canvas>            </div>            <div id=\"centerBottom\" class=\"widgetContainer\">                <div id=\"leftCenterBottom\" class=\"widgetContainer\">                    <canvas id=\"TitleRainfall01\"></canvas>                    <canvas id=\"RainBar3\"></canvas>                    <canvas id=\"RainBar2\"></canvas>                    <canvas id=\"RainBar1\"></canvas>                </div>                <div id=\"rightCenterBottom\" class=\"widgetContainer\">                    <canvas id=\"HumidityGauge01\"></canvas>                    <canvas id=\"Barometer01\"></canvas>                    <canvas id=\"Apparent01\"></canvas>                </div>            </div>        </div>        <div id=\"right\" class=\"widgetContainer\">            <div id=\"rightLeft\" class=\"widgetContainer\">                <div id=\"rainGraphCanvas01CanvasDiv\" class=\"OuterCanvasDiv\">                    <canvas id=\"rainGraphCanvas01\"></canvas>                </div>                <div id=\"windGraphCanvas01CanvasDiv\" class=\"OuterCanvasDiv\">                    <canvas id=\"windGraphCanvas01\"></canvas>                </div>                <div id=\"rightLeftBottom\" class=\"widgetContainer\">                    <canvas id=\"SolarBar01\"></canvas>                    <canvas id=\"UVBar01\"></canvas>                </div>            </div>            <div id=\"rightRight\" class=\"widgetContainer\">                <div id=\"tempGraphCanvas01CanvasDiv\" class=\"OuterCanvasDiv\">                    <canvas id=\"tempGraphCanvas01\"></canvas>                </div>                <div id=\"baroGraphCanvas01CanvasDiv\" class=\"OuterCanvasDiv\">                    <canvas id=\"baroGraphCanvas01\"></canvas>                </div>            </div>        </div>        <div id=\"bottom\" class=\"widgetContainer\">            <button style=\"display: none;\" id=\"AltitudeButton\" class=\"buttons\"></button>            <button id=\"PressureButton\" class=\"buttons\"></button>            <button id=\"WindButton\" class=\"buttons\"></button>            <button id=\"RainfallButton\" class=\"buttons\"></button>            <button id=\"TempButton\" class=\"buttons\"></button>            <button id=\"RecordsButton\" class=\"buttons\"></button>            <button id=\"GraphsButton\" class=\"buttons\"></button>        </div>    </div>    <div id=\"Version\" style=\"float: right; font-size: 0.8em;\"> <p>yerren@renerica.com</p></div>";
}

function $widgets_apparent_init(_e_0) {
  return {$: "St", "w": 300, "h": 150, "old": "0", "fresh": true, "text": ""};
}

function $widgets_apparent_tip(_e_0) {
  return $lib_env_word(_e_0, {$: "WApparentDescription"});
}

function $widgets_apparent_data(_st_0, _e_0, _force_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _old_0 = _st_0["old"];
  const _fresh_0 = _st_0["fresh"];
  const _text_0 = _st_0["text"];
  const _t_0 = $$lib_env_cr(_e_0, 130);
  const _x_0 = $$lib_env_changed(_fresh_0, _t_0, _old_0);
  return $Bool_pick((_force_0 || _x_0), {$: "St", "w": _w_0, "h": _h_0, "old": _t_0, "fresh": false, "text": $$lib_env_reading(_e_0, {$: "Temp"}, _t_0)}, {$: "St", "w": _w_0, "h": _h_0, "old": _old_0, "fresh": _fresh_0, "text": _text_0});
}

function $widgets_apparent_resize(_st_0, _b_0) {
  const _old_0 = _st_0["old"];
  const _fresh_0 = _st_0["fresh"];
  const _text_0 = _st_0["text"];
  const _ph_0 = _b_0["ph"];
  return {$: "St", "w": $$lib_num_cdim(_ph_0, 30, 100), "h": $$lib_num_cdim(_ph_0, 17, 100), "old": _old_0, "fresh": _fresh_0, "text": _text_0};
}

function $widgets_apparent_width(_st_0) {
  const _w_0 = _st_0["w"];
  return _w_0;
}

function $widgets_apparent_height(_st_0) {
  const _h_0 = _st_0["h"];
  return _h_0;
}

function $widgets_apparent_view(_st_0, _e_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _text_0 = _st_0["text"];
  const _rect_w_0 = Math.fround(_w_0 * 0.8999999761581421);
  const _rect_h_0 = Math.fround(_h_0 * 0.4000000059604645);
  const _corner_0 = Math.fround(_h_0 * 0.10000000149011612);
  const _stroke_0 = Math.fround(_w_0 / 40);
  const _display_px_0 = $$lib_scene_ex_mul($$lib_scene_ex(_w_0), $$lib_scene_ex(0.15000000596046448));
  const _title_px_0 = $$lib_scene_ex_mul($$lib_scene_ex(_w_0), $$lib_scene_ex(0.1899999976158142));
  const _x_0 = Math.fround(_w_0 - _rect_w_0);
  const _gap_0 = Math.fround(_x_0 / 2);
  const _x_1 = Math.fround(1 / 2);
  const _title_x_0 = $$lib_num_sharpen(Math.fround(_w_0 * _x_1));
  const _x_2 = Math.fround(20 / 100);
  const _title_y_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_2));
  const _x_3 = Math.fround(1 / 2);
  const _text_x_0 = $$lib_num_sharpen(Math.fround(_w_0 * _x_3));
  const _x_4 = Math.fround(71 / 100);
  const _text_y_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_4));
  const _x_5 = Math.fround(_h_0 - _rect_h_0);
  return {$: "Scene", "x": 0, "y": 0, "nodes": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GFill", "color": "#F6F6F6"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _stroke_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GRoundRect", "x": _gap_0, "y": Math.fround(_x_5 - _gap_0), "w": _rect_w_0, "h": _rect_h_0, "r": _corner_0}, "tail": {$: "Nil"}}}}}), "tail": {$: "Con", "head": $$lib_scene_label(_text_x_0, _text_y_0, _text_0, $$lib_scene_boldx(_display_px_0, "arial"), "black", "center", "middle"), "tail": {$: "Con", "head": $$lib_scene_label_w(_title_x_0, _title_y_0, $$lib_env_word(_e_0, {$: "WApparentTitle"}), $$lib_scene_boldx(_title_px_0, "arial"), "black", "center", "middle", $$lib_scene_max_centred(_w_0, 0, _title_x_0)), "tail": {$: "Nil"}}}}};
}

function $lib_tween_still(_v_0) {
  return {$: "Tween", "from": _v_0, "to": _v_0, "t0": 0, "dur": 0};
}

function $lib_tween_elapsed(_t0_0, _now_0) {
  const _x_0 = ((_now_0 - _t0_0) >>> 0);
  return $Bool_pick((_now_0 < _t0_0), 0, Math.fround(_x_0 >>>0));
}

function $lib_tween_quart_in_out(_t_0) {
  const _u_0 = Math.fround(_t_0 * 2);
  const _x_0 = (_u_0 === 1 || _u_0 === -1 && Math.abs(4) === Infinity ? 1 : Math.fround(Math.pow(_u_0, 4)));
  const _x_1 = Math.fround(2 - _u_0);
  const _x_2 = (_x_1 === 1 || _x_1 === -1 && Math.abs(4) === Infinity ? 1 : Math.fround(Math.pow(_x_1, 4)));
  const _x_3 = Math.fround(Math.abs(_x_2));
  const _x_4 = Math.fround(0.5 * _x_3);
  return $Bool_pick((_u_0 < 1), Math.fround(0.5 * _x_0), Math.fround(1 - _x_4));
}

function $lib_tween_ratio(_t0_0, _dur_0, _now_0) {
  const _e_0 = $$lib_tween_elapsed(_t0_0, _now_0);
  return $Bool_pick((_e_0 >= _dur_0), 1, Math.fround(_e_0 / _dur_0));
}

function $lib_tween_progress(_tw_0, _now_0) {
  const _t0_0 = _tw_0["t0"];
  const _dur_0 = _tw_0["dur"];
  return $lib_tween_ratio(_t0_0, _dur_0, _now_0);
}

function $lib_tween_value(_tw_0, _now_0) {
  const _from_0 = _tw_0["from"];
  const _to_0 = _tw_0["to"];
  const _t0_0 = _tw_0["t0"];
  const _dur_0 = _tw_0["dur"];
  const _p_0 = $$lib_tween_ratio(_t0_0, _dur_0, _now_0);
  const _x_0 = Math.fround(_to_0 - _from_0);
  const _x_1 = $$lib_tween_quart_in_out(_p_0);
  const _x_2 = Math.fround(_x_0 * _x_1);
  return $Bool_pick((_p_0 >= 1), _to_0, Math.fround(_from_0 + _x_2));
}

function $lib_tween_to(_tw_0, _target_0, _ms_0, _now_0) {
  return {$: "Tween", "from": $$lib_tween_value(_tw_0, _now_0), "to": _target_0, "t0": _now_0, "dur": _ms_0};
}

function $lib_tween_busy(_tw_0, _now_0) {
  const _x_0 = $$lib_tween_progress(_tw_0, _now_0);
  return (_x_0 < 1);
}

function $widgets_tempbar_c_temp() {
  return $lib_scene_rgb("209, 32, 32");
}

function $widgets_tempbar_c_low() {
  return $lib_scene_rgb("0, 50, 200");
}

function $widgets_tempbar_c_fill() {
  return "rgb(255, 221, 37)";
}

function $widgets_tempbar_is01(_v_0) {
  if (_v_0.$ === "V01") {
    return true;
  } else if (_v_0.$ === "V02") {
    return false;
  } else if (_v_0.$ === "V03") {
    return false;
  } else {
    return false;
  }
}

function $widgets_tempbar_is_wc(_v_0) {
  if (_v_0.$ === "V01") {
    return false;
  } else if (_v_0.$ === "V02") {
    return false;
  } else if (_v_0.$ === "V03") {
    return false;
  } else {
    return true;
  }
}

function $widgets_tempbar_arrow(_a_0, _trend_0) {
  const _mid_0 = _a_0["mid"];
  const _ptr_0 = _a_0["ptr"];
  const _p1_0 = $$Bool_pick((_trend_0 === 0), $$widgets_tempbar_c_fill(), _ptr_0);
  return $Bool_pick((_trend_0 > 0), {$: "Arr", "mid": $$widgets_tempbar_c_temp(), "ptr": $$widgets_tempbar_c_temp()}, $$Bool_pick((_trend_0 < 0), {$: "Arr", "mid": $$widgets_tempbar_c_low(), "ptr": $$widgets_tempbar_c_low()}, {$: "Arr", "mid": _mid_0, "ptr": _p1_0}));
}

function $widgets_tempbar_init(_v_0, _e_0) {
  const _m_0 = $$lib_env_opt(_e_0, "windChill.mode", "windchill");
  return {$: "St", "v": _v_0, "w": 300, "h": 150, "old": {$: "Old", "fresh": true, "t": "undefined", "hi": "0", "lo": "0", "tr": "0"}, "vals": {$: "Vals", "t": 0, "hi": 0, "lo": 0, "trend": 0, "mn": (-10), "mx": 30}, "tw": {$: "Tw", "fill": $$lib_tween_still(0), "hi": $$lib_tween_still(1.0399999618530273), "lo": $$lib_tween_still(1.0399999618530273)}, "arr": $$widgets_tempbar_arrow({$: "Arr", "mid": $$widgets_tempbar_c_temp(), "ptr": $$widgets_tempbar_c_temp()}, 0), "md": {$: "Md", "mode": _m_0, "dmode": _m_0, "tmode": _m_0}};
}

function $widgets_tempbar_mode(_st_0) {
  const _t_0 = _st_0["md"];
  const _m_0 = _t_0["mode"];
  return _m_0;
}

function $widgets_tempbar_tip_go(_wc_0, _e_0, _tmode_0) {
  if (!_wc_0) {
    return $lib_env_word(_e_0, {$: "WTemperatureDescription"});
  } else {
    return $Bool_pick($$String_eq(_tmode_0, "windchill"), $$lib_env_word(_e_0, {$: "WWindchillDescription"}), $$lib_env_word(_e_0, {$: "WHeatIndexDescription"}));
  }
}

function $widgets_tempbar_tip(_st_0, _e_0) {
  const _v_0 = _st_0["v"];
  const _t_0 = _st_0["md"];
  const _tm_0 = _t_0["tmode"];
  return $widgets_tempbar_tip_go($$widgets_tempbar_is_wc(_v_0), _e_0, _tm_0);
}

function $widgets_tempbar_ok_index(_x_0) {
  const _x_1 = Math.fround(Math.floor(_x_0));
  return $Bool_and((_x_0 >= 0), (_x_1 === _x_0));
}

function $widgets_tempbar_cr_at(_e_0, _x_0) {
  return $Bool_pick($$widgets_tempbar_ok_index(_x_0), $$lib_env_cr(_e_0, $$lib_num_nat_of(_x_0)), "undefined");
}

function $widgets_tempbar_cre_at(_e_0, _x_0) {
  return $Bool_pick($$widgets_tempbar_ok_index(_x_0), $$lib_env_cre(_e_0, $$lib_num_nat_of(_x_0)), "undefined");
}

function $widgets_tempbar_extra_go(_indoor_0, _e_0, _n_0) {
  if (_indoor_0) {
    return {$: "Inp", "t": $$lib_env_cr(_e_0, 12), "hi": $$lib_env_cr(_e_0, 128), "lo": $$lib_env_cr(_e_0, 129), "tr": "0"};
  } else {
    const _x_0 = Math.fround(2 * _n_0);
    const _hi_0 = $$widgets_tempbar_cre_at(_e_0, Math.fround(_x_0 + 592));
    const _x_1 = Math.fround(2 * _n_0);
    const _lo_0 = $$widgets_tempbar_cre_at(_e_0, Math.fround(_x_1 + 593));
    return $Bool_pick($$Bool_and((_n_0 <= 6), (_n_0 > 0)), {$: "Inp", "t": $$widgets_tempbar_cr_at(_e_0, Math.fround(_n_0 + 19)), "hi": _hi_0, "lo": _lo_0, "tr": "0"}, $$Bool_pick((_n_0 <= 8), {$: "Inp", "t": $$widgets_tempbar_cr_at(_e_0, Math.fround(_n_0 + 113)), "hi": _hi_0, "lo": _lo_0, "tr": "0"}, {$: "Inp", "t": "-1", "hi": "-1", "lo": "-1", "tr": "0"}));
  }
}

function $widgets_tempbar_extra(_e_0, _inp_0) {
  return $widgets_tempbar_extra_go($$String_eq(_inp_0, "indoor"), _e_0, $$lib_num_parse(_inp_0));
}

function $widgets_tempbar_ne(_a_0, _b_0) {
  return $Bool_not($$String_eq(_a_0, _b_0));
}

function $widgets_tempbar_switch(_e_0, _dmode_0) {
  const _rt_0 = $$lib_num_parse($$lib_env_cr(_e_0, 4));
  const _rmin_0 = $$lib_env_cr(_e_0, 47);
  const _rmax_0 = $$lib_env_cr(_e_0, 46);
  const _x_0 = $$widgets_tempbar_ne(_rmin_0, $$lib_env_cr(_e_0, 78));
  const _x_1 = $$widgets_tempbar_ne(_rmax_0, $$lib_env_cr(_e_0, 77));
  const _dc_0 = (_x_0 || _x_1);
  const _x_2 = $$widgets_tempbar_ne(_rmin_0, $$lib_env_cr(_e_0, 111));
  const _x_3 = $$widgets_tempbar_ne(_rmax_0, $$lib_env_cr(_e_0, 110));
  const _dh_0 = (_x_2 || _x_3);
  return $Bool_pick((_rt_0 <= 10), "windchill", $$Bool_pick((_rt_0 >= 18), "heatIndex", $$Bool_pick($$Bool_and(_dc_0, _dh_0), _dmode_0, $$Bool_pick(_dc_0, "windchill", $$Bool_pick(_dh_0, "heatIndex", _dmode_0)))));
}

function $widgets_tempbar_switched_go(_go_0, _e_0, _md_0) {
  if (!_go_0) {
    return _md_0;
  } else {
    const _dm_0 = _md_0["dmode"];
    const _tm_0 = _md_0["tmode"];
    return {$: "Md", "mode": $$widgets_tempbar_switch(_e_0, _dm_0), "dmode": _dm_0, "tmode": _tm_0};
  }
}

function $widgets_tempbar_switched(_v_0, _e_0, _force_0, _md_0) {
  return $widgets_tempbar_switched_go($$Bool_and($$Bool_and($$widgets_tempbar_is_wc(_v_0), $$Bool_not(_force_0)), $$lib_env_on(_e_0, "windChill.autoSwitch")), _e_0, _md_0);
}

function $widgets_tempbar_wc_inp(_e_0, _chill_0) {
  if (_chill_0) {
    return {$: "Inp", "t": $$lib_env_cr(_e_0, 44), "hi": $$lib_env_cr(_e_0, 77), "lo": $$lib_env_cr(_e_0, 78), "tr": "0"};
  } else {
    return {$: "Inp", "t": $$lib_env_cr(_e_0, 112), "hi": $$lib_env_cr(_e_0, 110), "lo": $$lib_env_cr(_e_0, 111), "tr": "0"};
  }
}

function $widgets_tempbar_inputs(_v_0, _e_0, _md_0) {
  if (_v_0.$ === "V01") {
    return {$: "Inp", "t": $$lib_env_cr(_e_0, 4), "hi": $$lib_env_cr(_e_0, 46), "lo": $$lib_env_cr(_e_0, 47), "tr": $$lib_env_cr(_e_0, 143)};
  } else if (_v_0.$ === "V02") {
    return $widgets_tempbar_extra(_e_0, $$lib_env_opt(_e_0, "temperature02.input", "1"));
  } else if (_v_0.$ === "V03") {
    return $widgets_tempbar_extra(_e_0, $$lib_env_opt(_e_0, "temperature03.input", "2"));
  } else {
    const _m_0 = _md_0["mode"];
    return $widgets_tempbar_wc_inp(_e_0, $$String_eq(_m_0, "windchill"));
  }
}

function $widgets_tempbar_changed_t(_fresh_0, _t_0, _old_0) {
  return $Bool_pick(_fresh_0, $$widgets_tempbar_ne(_t_0, "undefined"), $$widgets_tempbar_ne(_t_0, _old_0));
}

function $widgets_tempbar_should(_v_0, _old_0, _inp_0, _force_0) {
  const _fresh_0 = _old_0["fresh"];
  const _ot_0 = _old_0["t"];
  const _oh_0 = _old_0["hi"];
  const _ol_0 = _old_0["lo"];
  const _otr_0 = _old_0["tr"];
  const _t_0 = _inp_0["t"];
  const _hi_0 = _inp_0["hi"];
  const _lo_0 = _inp_0["lo"];
  const _x_0 = $$widgets_tempbar_changed_t(_fresh_0, _t_0, _ot_0);
  const _x_1 = $$lib_env_changed(_fresh_0, _hi_0, _oh_0);
  const _x_2 = (_x_0 || _x_1);
  const _x_3 = $$lib_env_changed(_fresh_0, _lo_0, _ol_0);
  const _x_4 = (_x_2 || _x_3);
  const _x_5 = $$Bool_pick($$widgets_tempbar_is01(_v_0), $$lib_env_changed(_fresh_0, _lo_0, _otr_0), _force_0);
  return (_x_4 || _x_5);
}

function $widgets_tempbar_below(_t_0, _hi_0, _lo_0, _mn_0) {
  const _x_0 = (_t_0 < _mn_0);
  const _x_1 = (_hi_0 < _mn_0);
  const _x_2 = (_x_0 || _x_1);
  const _x_3 = (_lo_0 < _mn_0);
  return (_x_2 || _x_3);
}

function $widgets_tempbar_above(_t_0, _hi_0, _lo_0, _mx_0) {
  const _x_0 = (_t_0 > _mx_0);
  const _x_1 = (_hi_0 > _mx_0);
  const _x_2 = (_x_0 || _x_1);
  const _x_3 = (_lo_0 > _mx_0);
  return (_x_2 || _x_3);
}

function $widgets_tempbar_raise_ok(_t_0, _hi_0, _lo_0, _mn_0) {
  const _m4_0 = Math.fround(_mn_0 + 4);
  const _x_0 = (-10);
  const _under_0 = (_mn_0 < _x_0);
  return $Bool_and($$Bool_and($$Bool_and((_t_0 >= _m4_0), _under_0), $$Bool_and((_hi_0 >= _m4_0), _under_0)), $$Bool_and((_lo_0 >= _m4_0), _under_0));
}

function $widgets_tempbar_lower_ok(_t_0, _hi_0, _lo_0, _mx_0) {
  const _m4_0 = Math.fround(_mx_0 - 4);
  const _over_0 = (_mx_0 > 30);
  return $Bool_and($$Bool_and($$Bool_and((_t_0 <= _m4_0), _over_0), $$Bool_and((_hi_0 <= _m4_0), _over_0)), $$Bool_and((_lo_0 <= _m4_0), _over_0));
}

function $widgets_tempbar_min_down($0, $1, $2, $3, $4, $5) {
  for (;;) {
    {
      const _fuel_0 = $0;
      const _go_0 = $1;
      const _t_0 = $2;
      const _hi_0 = $3;
      const _lo_0 = $4;
      const _mn_0 = $5;
      if (_fuel_0 == 0) {
        return _mn_0;
      } else {
        const _f_0 = (_fuel_0 - 1);
        if (!_go_0) {
          return _mn_0;
        } else {
          const _m_0 = Math.fround(_mn_0 - 4);
          $0 = _f_0;
          $1 = $$widgets_tempbar_below(_t_0, _hi_0, _lo_0, _m_0);
          $2 = _t_0;
          $3 = _hi_0;
          $4 = _lo_0;
          $5 = _m_0;
          continue;
        }
      }
    }
  }
}

function $widgets_tempbar_max_up($0, $1, $2, $3, $4, $5) {
  for (;;) {
    {
      const _fuel_0 = $0;
      const _go_0 = $1;
      const _t_0 = $2;
      const _hi_0 = $3;
      const _lo_0 = $4;
      const _mx_0 = $5;
      if (_fuel_0 == 0) {
        return _mx_0;
      } else {
        const _f_0 = (_fuel_0 - 1);
        if (!_go_0) {
          return _mx_0;
        } else {
          const _m_0 = Math.fround(_mx_0 + 4);
          $0 = _f_0;
          $1 = $$widgets_tempbar_above(_t_0, _hi_0, _lo_0, _m_0);
          $2 = _t_0;
          $3 = _hi_0;
          $4 = _lo_0;
          $5 = _m_0;
          continue;
        }
      }
    }
  }
}

function $widgets_tempbar_min_up($0, $1, $2, $3, $4, $5) {
  for (;;) {
    {
      const _fuel_0 = $0;
      const _go_0 = $1;
      const _t_0 = $2;
      const _hi_0 = $3;
      const _lo_0 = $4;
      const _mn_0 = $5;
      if (_fuel_0 == 0) {
        return _mn_0;
      } else {
        const _f_0 = (_fuel_0 - 1);
        if (!_go_0) {
          return _mn_0;
        } else {
          const _m_0 = Math.fround(_mn_0 + 4);
          $0 = _f_0;
          $1 = $$widgets_tempbar_raise_ok(_t_0, _hi_0, _lo_0, _m_0);
          $2 = _t_0;
          $3 = _hi_0;
          $4 = _lo_0;
          $5 = _m_0;
          continue;
        }
      }
    }
  }
}

function $widgets_tempbar_max_down($0, $1, $2, $3, $4, $5) {
  for (;;) {
    {
      const _fuel_0 = $0;
      const _go_0 = $1;
      const _t_0 = $2;
      const _hi_0 = $3;
      const _lo_0 = $4;
      const _mx_0 = $5;
      if (_fuel_0 == 0) {
        return _mx_0;
      } else {
        const _f_0 = (_fuel_0 - 1);
        if (!_go_0) {
          return _mx_0;
        } else {
          const _m_0 = Math.fround(_mx_0 - 4);
          $0 = _f_0;
          $1 = $$widgets_tempbar_lower_ok(_t_0, _hi_0, _lo_0, _m_0);
          $2 = _t_0;
          $3 = _hi_0;
          $4 = _lo_0;
          $5 = _m_0;
          continue;
        }
      }
    }
  }
}

function $widgets_tempbar_fuel() {
  return (5000 );
}

function $widgets_tempbar_fmt(_mn_0, _mx_0, _t_0, _hi_0, _lo_0, _trend_0) {
  const _m1_0 = $$widgets_tempbar_min_down($$widgets_tempbar_fuel(), $$widgets_tempbar_below(_t_0, _hi_0, _lo_0, _mn_0), _t_0, _hi_0, _lo_0, _mn_0);
  const _x1_0 = $$widgets_tempbar_max_up($$widgets_tempbar_fuel(), $$widgets_tempbar_above(_t_0, _hi_0, _lo_0, _mx_0), _t_0, _hi_0, _lo_0, _mx_0);
  const _m2_0 = $$widgets_tempbar_min_up($$widgets_tempbar_fuel(), $$widgets_tempbar_raise_ok(_t_0, _hi_0, _lo_0, _m1_0), _t_0, _hi_0, _lo_0, _m1_0);
  const _x2_0 = $$widgets_tempbar_max_down($$widgets_tempbar_fuel(), $$widgets_tempbar_lower_ok(_t_0, _hi_0, _lo_0, _x1_0), _t_0, _hi_0, _lo_0, _x1_0);
  return {$: "Vals", "t": _t_0, "hi": _hi_0, "lo": _lo_0, "trend": _trend_0, "mn": _m2_0, "mx": _x2_0};
}

function $widgets_tempbar_retween(_tw_0, _vals_0, _now_0) {
  const _f_0 = _tw_0["fill"];
  const _h_0 = _tw_0["hi"];
  const _l_0 = _tw_0["lo"];
  const _t_0 = _vals_0["t"];
  const _hi_0 = _vals_0["hi"];
  const _lo_0 = _vals_0["lo"];
  const _mn_0 = _vals_0["mn"];
  const _mx_0 = _vals_0["mx"];
  return {$: "Tw", "fill": $$lib_tween_to(_f_0, $$lib_num_map(_t_0, _mn_0, _mx_0, 0.10000000149011612, 0.9800000190734863), 2000, _now_0), "hi": $$lib_tween_to(_h_0, $$lib_num_map(_hi_0, _mn_0, _mx_0, 1.0399999618530273, 0.17000000178813934), 2000, _now_0), "lo": $$lib_tween_to(_l_0, $$lib_num_map(_lo_0, _mn_0, _mx_0, 1.0399999618530273, 0.17000000178813934), 2000, _now_0)};
}

function $widgets_tempbar_vals_range(_vals_0, _u_0, _t_0, _hi_0, _lo_0, _trend_0) {
  const _mn_0 = _vals_0["mn"];
  const _mx_0 = _vals_0["mx"];
  return $widgets_tempbar_fmt(_mn_0, _mx_0, $$lib_units_value(_u_0, {$: "Temp"}, _t_0), $$lib_units_value(_u_0, {$: "Temp"}, _hi_0), $$lib_units_value(_u_0, {$: "Temp"}, _lo_0), _trend_0);
}

function $widgets_tempbar_tmode_set(_md_0) {
  const _m_0 = _md_0["mode"];
  const _dm_0 = _md_0["dmode"];
  return {$: "Md", "mode": _m_0, "dmode": _dm_0, "tmode": _m_0};
}

function $widgets_tempbar_old_trend_changed(_old_0, _tr_0) {
  const _fresh_0 = _old_0["fresh"];
  const _otr_0 = _old_0["tr"];
  return $lib_env_changed(_fresh_0, _tr_0, _otr_0);
}

function $widgets_tempbar_data_go(_go_0, _st_0, _e_0, _inp_0, _now_0) {
  if (!_go_0) {
    return _st_0;
  } else {
    const _v_0 = _st_0["v"];
    const _w_0 = _st_0["w"];
    const _h_0 = _st_0["h"];
    const _old_0 = _st_0["old"];
    const _vals_0 = _st_0["vals"];
    const _tw_0 = _st_0["tw"];
    const _arr_0 = _st_0["arr"];
    const _md_0 = _st_0["md"];
    const _t_0 = _inp_0["t"];
    const _hi_0 = _inp_0["hi"];
    const _lo_0 = _inp_0["lo"];
    const _tr_0 = _inp_0["tr"];
    const _trend_0 = $$lib_num_int(_tr_0);
    const _vals2_0 = $$widgets_tempbar_vals_range(_vals_0, $$lib_env_units(_e_0), $$lib_num_parse(_t_0), $$lib_num_parse(_hi_0), $$lib_num_parse(_lo_0), _trend_0);
    const _arr2_0 = $$Bool_pick($$Bool_and($$widgets_tempbar_is01(_v_0), $$widgets_tempbar_old_trend_changed(_old_0, _tr_0)), $$widgets_tempbar_arrow(_arr_0, _trend_0), _arr_0);
    return {$: "St", "v": _v_0, "w": _w_0, "h": _h_0, "old": {$: "Old", "fresh": false, "t": _t_0, "hi": _hi_0, "lo": _lo_0, "tr": _tr_0}, "vals": _vals2_0, "tw": $$widgets_tempbar_retween(_tw_0, _vals2_0, _now_0), "arr": _arr2_0, "md": $$widgets_tempbar_tmode_set(_md_0)};
  }
}

function $widgets_tempbar_data(_st_0, _e_0, _force_0, _now_0) {
  const _v_0 = _st_0["v"];
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _old_0 = _st_0["old"];
  const _vals_0 = _st_0["vals"];
  const _tw_0 = _st_0["tw"];
  const _arr_0 = _st_0["arr"];
  const _md_0 = _st_0["md"];
  const _md1_0 = $$widgets_tempbar_switched(_v_0, _e_0, _force_0, _md_0);
  const _inp_0 = $$widgets_tempbar_inputs(_v_0, _e_0, _md1_0);
  return $widgets_tempbar_data_go($$widgets_tempbar_should(_v_0, _old_0, _inp_0, _force_0), {$: "St", "v": _v_0, "w": _w_0, "h": _h_0, "old": _old_0, "vals": _vals_0, "tw": _tw_0, "arr": _arr_0, "md": _md1_0}, _e_0, _inp_0, _now_0);
}

function $widgets_tempbar_vals_trend(_vals_0) {
  const _tr_0 = _vals_0["trend"];
  return _tr_0;
}

function $widgets_tempbar_resize(_st_0, _b_0) {
  const _v_0 = _st_0["v"];
  const _old_0 = _st_0["old"];
  const _vals_0 = _st_0["vals"];
  const _tw_0 = _st_0["tw"];
  const _arr_0 = _st_0["arr"];
  const _md_0 = _st_0["md"];
  const _ph_0 = _b_0["ph"];
  const _a_0 = $$widgets_tempbar_arrow(_arr_0, $$widgets_tempbar_vals_trend(_vals_0));
  return {$: "St", "v": _v_0, "w": $$lib_num_cdim(_ph_0, 1, 2), "h": $$lib_num_cdim(_ph_0, 1, 1), "old": _old_0, "vals": _vals_0, "tw": _tw_0, "arr": _a_0, "md": _md_0};
}

function $widgets_tempbar_width(_st_0) {
  const _w_0 = _st_0["w"];
  return _w_0;
}

function $widgets_tempbar_height(_st_0) {
  const _h_0 = _st_0["h"];
  return _h_0;
}

function $widgets_tempbar_gap_at(_fi_0, _py_0, _cut_0) {
  const _x_0 = Math.fround(24 / 25);
  const _x_1 = Math.fround(_cut_0 * _x_0);
  const _a_0 = Math.fround(_x_1 - _py_0);
  const _x_2 = Math.fround(_a_0 % 4);
  const _x_3 = Math.fround(_x_2 / 5);
  const _x_4 = Math.fround(_a_0 / 4);
  const _x_5 = Math.fround(_x_3 - 1);
  const _x_6 = Math.fround(_x_4 - _x_5);
  const _x_7 = Math.fround(_fi_0 / 10);
  const _x_8 = Math.fround(_x_6 * _x_7);
  return $lib_num_sharpen(Math.fround(_py_0 + _x_8));
}

function $widgets_tempbar_dash(_i_0, _px_0, _py_0, _dl_0, _ss_0, _cut_0) {
  const _fi_0 = $$lib_num_of_nat(_i_0);
  const _gap_0 = $$widgets_tempbar_gap_at(_fi_0, _py_0, _cut_0);
  const _x_0 = Math.fround(_fi_0 % 10);
  const _x_1 = Math.fround(_fi_0 % 5);
  const _x_2 = Math.fround(_px_0 + _dl_0);
  const _x_3 = Math.fround(_dl_0 / 2);
  const _x_4 = Math.fround(_px_0 + _dl_0);
  const _x_5 = Math.fround(_dl_0 / 3);
  const _x0_0 = $$Bool_pick((_x_0 === 0), _px_0, $$Bool_pick((_x_1 === 0), Math.fround(_x_2 - _x_3), Math.fround(_x_4 - _x_5)));
  return $Bool_pick((_fi_0 < 41), $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _ss_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GMove", "x": _x0_0, "y": _gap_0}, "tail": {$: "Con", "head": {$: "GLine", "x": Math.fround(_px_0 + _dl_0), "y": _gap_0}, "tail": {$: "Nil"}}}}}), $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GStyle", "width": 0, "caps": ""}, "tail": {$: "Con", "head": {$: "GMove", "x": 0, "y": 0}, "tail": {$: "Con", "head": {$: "GLine", "x": 0, "y": 0}, "tail": {$: "Nil"}}}}}));
}

function $widgets_tempbar_dashes(_n_0, _i_0, _px_0, _py_0, _dl_0, _ss_0, _cut_0) {
  if (_n_0 == 0) {
    return {$: "Nil"};
  } else {
    const _r_0 = (_n_0 - 1);
    return {$: "Con", "head": $$widgets_tempbar_dash(_i_0, _px_0, _py_0, _dl_0, _ss_0, _cut_0), "tail": $$widgets_tempbar_dashes(_r_0, nat_chk(_i_0 + 1), _px_0, _py_0, _dl_0, _ss_0, _cut_0)};
  }
}

function $widgets_tempbar_labels(_n_0, _k_0, _lx_0, _py_0, _cut_0, _mn_0, _mx_0, _font_0) {
  if (_n_0 == 0) {
    return {$: "Nil"};
  } else {
    const _r_0 = (_n_0 - 1);
    const _fk_0 = $$lib_num_of_nat(_k_0);
    const _x_0 = Math.fround(_mx_0 - _mn_0);
    const _x_1 = Math.fround(_x_0 / 4);
    const _x_2 = Math.fround(_x_1 * _fk_0);
    return {$: "Con", "head": $$lib_scene_label(_lx_0, $$widgets_tempbar_gap_at(Math.fround(_fk_0 * 10), _py_0, _cut_0), $$lib_num_show(Math.fround(_mx_0 - _x_2)), _font_0, "", "right", "middle"), "tail": $$widgets_tempbar_labels(_r_0, nat_chk(_k_0 + 1), _lx_0, _py_0, _cut_0, _mn_0, _mx_0, _font_0)};
  }
}

function $widgets_tempbar_spread_go(_ly_0, _hy_0, _h_0) {
  const _x_0 = Math.fround(_ly_0 - _hy_0);
  const _x_1 = Math.fround(_x_0 / _h_0);
  return (_x_1 < 0.03999999910593033);
}

function $widgets_tempbar_spread_loop($0, $1, $2, $3, $4) {
  for (;;) {
    {
      const _fuel_0 = $0;
      const _go_0 = $1;
      const _hy_0 = $2;
      const _ly_0 = $3;
      const _h_0 = $4;
      if (_fuel_0 == 0) {
        return {$: "HL", "hy": _hy_0, "ly": _ly_0};
      } else {
        const _f_0 = (_fuel_0 - 1);
        if (!_go_0) {
          return {$: "HL", "hy": _hy_0, "ly": _ly_0};
        } else {
          const _h2_0 = Math.fround(_hy_0 - 1);
          const _l2_0 = Math.fround(_ly_0 + 1);
          $0 = _f_0;
          $1 = $$widgets_tempbar_spread_go(_l2_0, _h2_0, _h_0);
          $2 = _h2_0;
          $3 = _l2_0;
          $4 = _h_0;
          continue;
        }
      }
    }
  }
}

function $widgets_tempbar_spread(_hy_0, _ly_0, _h_0) {
  const _x_0 = Math.fround(0.03999999910593033 * _h_0);
  const _x_1 = Math.fround(_ly_0 - _hy_0);
  const _x_2 = Math.fround(_x_0 - _x_1);
  const _x_3 = Math.fround(_x_2 / 2);
  const _need_0 = Math.fround(Math.floor(_x_3));
  const _n0_0 = $$lib_num_nat_of(Math.fround(_need_0 - 2));
  const _k_0 = $$lib_num_of_nat(_n0_0);
  const _h0_0 = Math.fround(_hy_0 - _k_0);
  const _l0_0 = Math.fround(_ly_0 + _k_0);
  return $widgets_tempbar_spread_loop(64, $$widgets_tempbar_spread_go(_l0_0, _h0_0, _h_0), _h0_0, _l0_0, _h_0);
}

function $widgets_tempbar_hl_hy(_x_0) {
  const _hy_0 = _x_0["hy"];
  return _hy_0;
}

function $widgets_tempbar_hl_ly(_x_0) {
  const _ly_0 = _x_0["ly"];
  return _ly_0;
}

function $widgets_tempbar_title_go(_v_0, _e_0, _tmode_0) {
  if (_v_0.$ === "V01") {
    const _t_0 = $$lib_env_opt(_e_0, "temperature.title", "default");
    return $Bool_pick($$String_eq(_t_0, "default"), $$lib_env_word(_e_0, {$: "WTemperatureTitle"}), _t_0);
  } else if (_v_0.$ === "V02") {
    const _t_1 = $$lib_env_opt(_e_0, "temperature02.title", "default");
    const _x_0 = $$lib_env_word(_e_0, {$: "WTemperatureTitle"});
    return $Bool_pick($$String_eq(_t_1, "default"), (_x_0 + " 2"), _t_1);
  } else if (_v_0.$ === "V03") {
    const _t_2 = $$lib_env_opt(_e_0, "temperature03.title", "default");
    const _x_1 = $$lib_env_word(_e_0, {$: "WTemperatureTitle"});
    return $Bool_pick($$String_eq(_t_2, "default"), (_x_1 + " 3"), _t_2);
  } else {
    return $Bool_pick($$String_eq(_tmode_0, "windchill"), $$lib_env_word(_e_0, {$: "WWindchillTitle"}), $$lib_env_word(_e_0, {$: "WHeatIndexTitle"}));
  }
}

function $widgets_tempbar_hl_on(_v_0, _e_0) {
  if (_v_0.$ === "V01") {
    return $lib_env_on(_e_0, "temperature.highLowEnabled");
  } else if (_v_0.$ === "V02") {
    return $lib_env_on(_e_0, "temperature02.highLowEnabled");
  } else if (_v_0.$ === "V03") {
    return $lib_env_on(_e_0, "temperature03.highLowEnabled");
  } else {
    return true;
  }
}

function $widgets_tempbar_arrow_nodes(_a_0, _trend_0, _ax_0, _ay_0, _stroke_0) {
  const _mid_0 = _a_0["mid"];
  const _ptr_0 = _a_0["ptr"];
  const _top_0 = Math.fround(1 - 0.03999999910593033);
  const _bot_0 = Math.fround(1 + 0.03999999910593033);
  const _vis_0 = $$Bool_not((_trend_0 === 0));
  const _x_0 = Math.fround(0.03999999910593033 * _trend_0);
  const _x_1 = Math.fround(1 - _x_0);
  return {$: "Con", "head": {$: "NShape", "xf": {$: "Xf", "x": 0, "y": 0, "rot": 0, "regx": 0, "regy": 0, "visible": _vis_0}, "gfx": {$: "Con", "head": {$: "GStroke", "color": _mid_0}, "tail": {$: "Con", "head": {$: "GStyle", "width": _stroke_0, "caps": "round"}, "tail": {$: "Con", "head": {$: "GMove", "x": _ax_0, "y": Math.fround(_ay_0 * _top_0)}, "tail": {$: "Con", "head": {$: "GLine", "x": _ax_0, "y": Math.fround(_ay_0 * _bot_0)}, "tail": {$: "Nil"}}}}}, "mask": {$: "Nil"}}, "tail": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": _ptr_0}, "tail": {$: "Con", "head": {$: "GStyle", "width": _stroke_0, "caps": "round"}, "tail": {$: "Con", "head": {$: "GMove", "x": Math.fround(_ax_0 * _top_0), "y": _ay_0}, "tail": {$: "Con", "head": {$: "GLine", "x": _ax_0, "y": Math.fround(_ay_0 * _x_1)}, "tail": {$: "Con", "head": {$: "GLine", "x": Math.fround(_ax_0 * _bot_0), "y": _ay_0}, "tail": {$: "Nil"}}}}}}), "tail": {$: "Nil"}}};
}

function $widgets_tempbar_hl_nodes(_on_0, _h_0, _bw_0, _ss_0, _hy_0, _ly_0, _lab_0, _lx_0, _font_0, _hi_0, _lo_0) {
  if (!_on_0) {
    return {$: "Nil"};
  } else {
    const _x_0 = Math.fround(_h_0 + _bw_0);
    const _xa_0 = Math.fround(_x_0 / 2);
    const _x_1 = Math.fround(_h_0 - _bw_0);
    const _xb_0 = Math.fround(_x_1 / 2);
    const _mw_0 = Math.fround(_ss_0 * 4);
    return {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": $$widgets_tempbar_c_temp()}, "tail": {$: "Con", "head": {$: "GStyle", "width": _mw_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GMove", "x": _xa_0, "y": _hy_0}, "tail": {$: "Con", "head": {$: "GLine", "x": _xb_0, "y": _hy_0}, "tail": {$: "Nil"}}}}}), "tail": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": $$widgets_tempbar_c_low()}, "tail": {$: "Con", "head": {$: "GStyle", "width": _mw_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GMove", "x": _xa_0, "y": _ly_0}, "tail": {$: "Con", "head": {$: "GLine", "x": _xb_0, "y": _ly_0}, "tail": {$: "Nil"}}}}}), "tail": {$: "Con", "head": $$lib_scene_label(_lx_0, $$widgets_tempbar_hl_hy(_lab_0), _hi_0, _font_0, $$widgets_tempbar_c_temp(), "left", "middle"), "tail": {$: "Con", "head": $$lib_scene_label(_lx_0, $$widgets_tempbar_hl_ly(_lab_0), _lo_0, _font_0, $$widgets_tempbar_c_low(), "left", "middle"), "tail": {$: "Nil"}}}}};
  }
}

function $widgets_tempbar_view(_st_0, _e_0, _now_0) {
  const _v_0 = _st_0["v"];
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _t_0 = _st_0["vals"];
  const _t_1 = _t_0["t"];
  const _hi_0 = _t_0["hi"];
  const _lo_0 = _t_0["lo"];
  const _trend_0 = _t_0["trend"];
  const _mn_0 = _t_0["mn"];
  const _mx_0 = _t_0["mx"];
  const _t_2 = _st_0["tw"];
  const _fill_0 = _t_2["fill"];
  const _thi_0 = _t_2["hi"];
  const _tlo_0 = _t_2["lo"];
  const _arr_0 = _st_0["arr"];
  const _t_3 = _st_0["md"];
  const _tmode_0 = _t_3["tmode"];
  const _x_0 = Math.fround(_h_0 / 4.5);
  const _sx_0 = (-_x_0);
  const _dl_0 = Math.fround(_h_0 * 0.07500000298023224);
  const _dg_0 = Math.fround(_h_0 * 0.02500000037252903);
  const _bw_0 = Math.fround(_h_0 * 0.07500000298023224);
  const _bfw_0 = Math.fround(_bw_0 * 0.6000000238418579);
  const _bh_0 = Math.fround(_h_0 * 0.800000011920929);
  const _cr_0 = Math.fround(_h_0 * 0.10000000149011612);
  const _fcr_0 = Math.fround(_cr_0 * 0.8500000238418579);
  const _corner_0 = Math.fround(_bw_0 / 2);
  const _fcorner_0 = Math.fround(_bfw_0 / 2);
  const _ss_0 = Math.fround(_bw_0 / 40);
  const _text_px_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(17));
  const _disp_px_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(19));
  const _hl_px_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(21));
  const _astroke_0 = Math.fround(_bw_0 / 15);
  const _x_1 = Math.fround(_h_0 / 2);
  const _x_2 = Math.fround(_bw_0 / 2);
  const _bar_x_0 = Math.fround(_x_1 - _x_2);
  const _x_3 = Math.fround(_h_0 / 2);
  const _x_4 = Math.fround(_bh_0 / 2);
  const _bar_y_0 = Math.fround(_x_3 - _x_4);
  const _cx_0 = Math.fround(_h_0 / 2);
  const _x_5 = Math.fround(3 / 4);
  const _x_6 = Math.fround(_h_0 * _x_5);
  const _x_7 = Math.fround(_x_6 + _cr_0);
  const _x_8 = Math.fround(_cr_0 / 10);
  const _cy_0 = Math.fround(_x_7 - _x_8);
  const _title_x_0 = Math.fround(_h_0 / 2);
  const _x_9 = Math.fround(_h_0 - _bh_0);
  const _x_10 = Math.fround(_x_9 / 2);
  const _title_y_0 = Math.fround(_x_10 - _corner_0);
  const _x_11 = Math.fround(_h_0 / 2);
  const _x_12 = Math.fround(_bw_0 / 2);
  const _x_13 = Math.fround(_x_11 - _x_12);
  const _x_14 = Math.fround(_x_13 - _dl_0);
  const _dash_x_0 = Math.fround(_x_14 - _dg_0);
  const _x_15 = Math.fround(_h_0 - _bh_0);
  const _x_16 = Math.fround(_x_15 / 2);
  const _x_17 = Math.fround(_corner_0 / 2);
  const _dash_y_0 = Math.fround(_x_16 + _x_17);
  const _x_18 = Math.fround(_h_0 / 2);
  const _x_19 = Math.fround(_bw_0 / 2);
  const _x_20 = Math.fround(_x_18 + _x_19);
  const _hl_x_0 = Math.fround(_x_20 + _dg_0);
  const _x_21 = Math.fround(_h_0 / 2);
  const _x_22 = Math.fround(_bfw_0 / 2);
  const _fbar_x_0 = Math.fround(_x_21 - _x_22);
  const _ax_0 = Math.fround(_w_0 * 0.699999988079071);
  const _x_23 = Math.fround(299 / 400);
  const _cut_0 = Math.fround(_h_0 * _x_23);
  const _span_0 = Math.fround(_bh_0 - _bar_y_0);
  const _x_24 = $$lib_tween_value(_fill_0, _now_0);
  const _fh_0 = Math.fround(_x_24 * _span_0);
  const _fy_0 = Math.fround(_bh_0 - _fh_0);
  const _x_25 = $$lib_tween_value(_thi_0, _now_0);
  const _hy_0 = Math.fround(_x_25 * _span_0);
  const _x_26 = $$lib_tween_value(_tlo_0, _now_0);
  const _ly_0 = Math.fround(_x_26 * _span_0);
  const _lab_0 = $$widgets_tempbar_spread(_hy_0, _ly_0, _h_0);
  const _unit_0 = $$lib_env_label(_e_0, {$: "Temp"});
  const _title_0 = $$widgets_tempbar_title_go(_v_0, _e_0, _tmode_0);
  const _front_0 = {$: "Con", "head": $$lib_scene_masked({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GFill", "color": "#F6F6F6"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _ss_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GRoundRect", "x": _bar_x_0, "y": _bar_y_0, "w": _bw_0, "h": _bh_0, "r": _corner_0}, "tail": {$: "Nil"}}}}}, {$: "Con", "head": {$: "GRect", "x": 0, "y": 0, "w": _h_0, "h": _cut_0}, "tail": {$: "Nil"}}), "tail": {$: "Con", "head": $$lib_scene_masked({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GFill", "color": "#F6F6F6"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _ss_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GCircle", "x": _cx_0, "y": _cy_0, "r": _cr_0}, "tail": {$: "Nil"}}}}}, {$: "Con", "head": {$: "GRect", "x": 0, "y": _cut_0, "w": _h_0, "h": _h_0}, "tail": {$: "Nil"}}), "tail": {$: "Nil"}}};
  const _fills_0 = {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GFill", "color": $$widgets_tempbar_c_fill()}, "tail": {$: "Con", "head": {$: "GStyle", "width": 0, "caps": ""}, "tail": {$: "Con", "head": {$: "GCircle", "x": _cx_0, "y": _cy_0, "r": _fcr_0}, "tail": {$: "Nil"}}}}), "tail": {$: "Con", "head": $$lib_scene_masked({$: "Con", "head": {$: "GFill", "color": $$widgets_tempbar_c_fill()}, "tail": {$: "Con", "head": {$: "GStyle", "width": 0, "caps": ""}, "tail": {$: "Con", "head": {$: "GRoundRect", "x": _fbar_x_0, "y": _fy_0, "w": _bfw_0, "h": _fh_0, "r": _fcorner_0}, "tail": {$: "Nil"}}}}, {$: "Con", "head": {$: "GRect", "x": 0, "y": 0, "w": _h_0, "h": Math.fround(_cut_0 * 1.100000023841858)}, "tail": {$: "Nil"}}), "tail": {$: "Nil"}}};
  const _x_27 = $$lib_num_show(_t_1);
  const _texts_0 = {$: "Con", "head": $$lib_scene_label(_cx_0, _cy_0, (_x_27 + _unit_0), $$lib_scene_boldx(_disp_px_0, "arial"), "", "center", "middle"), "tail": {$: "Con", "head": $$lib_scene_label_w(_title_x_0, _title_y_0, _title_0, $$lib_scene_boldx(_disp_px_0, "arial"), "black", "center", "middle", $$lib_scene_max_centred(_w_0, _sx_0, _title_x_0)), "tail": {$: "Nil"}}};
  const _x_28 = $$lib_num_show(_hi_0);
  const _x_29 = $$lib_num_show(_lo_0);
  const _hl_0 = $$widgets_tempbar_hl_nodes($$widgets_tempbar_hl_on(_v_0, _e_0), _h_0, _bw_0, _ss_0, _hy_0, _ly_0, _lab_0, _hl_x_0, $$lib_scene_boldx(_hl_px_0, "arial"), (_x_28 + _unit_0), (_x_29 + _unit_0));
  const _arrows_0 = $$Bool_pick($$widgets_tempbar_is01(_v_0), $$widgets_tempbar_arrow_nodes(_arr_0, _trend_0, _ax_0, _cy_0, _astroke_0), {$: "Nil"});
  const _x_30 = Math.fround(_dash_x_0 - _dl_0);
  const _x_31 = Math.fround(6 / 5);
  const _lbls_0 = $$widgets_tempbar_labels(5, 0, Math.fround(_x_30 * _x_31), _dash_y_0, _cut_0, _mn_0, _mx_0, $$lib_scene_plainx(_text_px_0, "arial"));
  return {$: "Scene", "x": _sx_0, "y": 0, "nodes": $$List_append(_front_0, $$List_append($$widgets_tempbar_dashes(50, 0, _dash_x_0, _dash_y_0, _dl_0, _ss_0, _cut_0), $$List_append(_fills_0, $$List_append(_lbls_0, $$List_append(_texts_0, $$List_append(_hl_0, _arrows_0))))))};
}

function $widgets_barometer_init(_e_0) {
  return {$: "St", "w": 300, "h": 150, "fresh": true, "old_p": "0", "old_t": "0", "ptext": "", "ttext": "RATE"};
}

function $widgets_barometer_tip(_e_0) {
  return $lib_env_word(_e_0, {$: "WBarometerDescription"});
}

function $widgets_barometer_trend_text(_e_0, _tv_0) {
  const _lbl_0 = $$lib_env_label(_e_0, {$: "Pressure"});
  const _x_0 = $$lib_num_show(_tv_0);
  const _x_1 = (_lbl_0 + "/hr");
  const _txt_0 = (_x_0 + _x_1);
  return $Bool_pick((_tv_0 !== 0), $$Bool_pick((_tv_0 > 0), ("+" + _txt_0), _txt_0), $$lib_env_word(_e_0, {$: "WBarometerSteady"}));
}

function $widgets_barometer_data(_st_0, _e_0, _force_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _fresh_0 = _st_0["fresh"];
  const _old_p_0 = _st_0["old_p"];
  const _old_t_0 = _st_0["old_t"];
  const _ptext_0 = _st_0["ptext"];
  const _ttext_0 = _st_0["ttext"];
  const _p_0 = $$lib_env_cr(_e_0, 6);
  const _t_0 = $$lib_env_cr(_e_0, 50);
  const _x_0 = $$lib_env_changed(_fresh_0, _p_0, _old_p_0);
  const _x_1 = (_force_0 || _x_0);
  const _x_2 = $$lib_env_changed(_fresh_0, _t_0, _old_t_0);
  const _go_0 = (_x_1 || _x_2);
  const _pv_0 = $$lib_units_value($$lib_env_units(_e_0), {$: "Pressure"}, $$lib_num_parse(_p_0));
  const _tv_0 = $$lib_units_value($$lib_env_units(_e_0), {$: "Pressure"}, $$lib_num_parse(_t_0));
  const _x_3 = $$lib_num_show(_pv_0);
  const _x_4 = $$lib_env_label(_e_0, {$: "Pressure"});
  return $Bool_pick(_go_0, {$: "St", "w": _w_0, "h": _h_0, "fresh": false, "old_p": _p_0, "old_t": _t_0, "ptext": (_x_3 + _x_4), "ttext": $$widgets_barometer_trend_text(_e_0, _tv_0)}, {$: "St", "w": _w_0, "h": _h_0, "fresh": _fresh_0, "old_p": _old_p_0, "old_t": _old_t_0, "ptext": _ptext_0, "ttext": _ttext_0});
}

function $widgets_barometer_resize(_st_0, _b_0) {
  const _fresh_0 = _st_0["fresh"];
  const _old_p_0 = _st_0["old_p"];
  const _old_t_0 = _st_0["old_t"];
  const _ptext_0 = _st_0["ptext"];
  const _ttext_0 = _st_0["ttext"];
  const _ph_0 = _b_0["ph"];
  return {$: "St", "w": $$lib_num_cdim(_ph_0, 30, 100), "h": $$lib_num_cdim(_ph_0, 30, 100), "fresh": _fresh_0, "old_p": _old_p_0, "old_t": _old_t_0, "ptext": _ptext_0, "ttext": _ttext_0};
}

function $widgets_barometer_width(_st_0) {
  const _w_0 = _st_0["w"];
  return _w_0;
}

function $widgets_barometer_height(_st_0) {
  const _h_0 = _st_0["h"];
  return _h_0;
}

function $widgets_barometer_view(_st_0, _e_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _ptext_0 = _st_0["ptext"];
  const _ttext_0 = _st_0["ttext"];
  const _rect_w_0 = Math.fround(_w_0 * 0.8999999761581421);
  const _rect_h_0 = Math.fround(_h_0 * 0.6700000166893005);
  const _corner_0 = Math.fround(_h_0 * 0.10000000149011612);
  const _stroke_0 = Math.fround(_w_0 / 40);
  const _display_px_0 = $$lib_scene_ex_mul($$lib_scene_ex(_w_0), $$lib_scene_ex(0.125));
  const _rate_px_0 = $$lib_scene_ex_mul($$lib_scene_ex(_w_0), $$lib_scene_ex(0.14000000059604645));
  const _title_px_0 = $$lib_scene_ex_mul($$lib_scene_ex(_w_0), $$lib_scene_ex(0.1899999976158142));
  const _x_0 = Math.fround(_w_0 - _rect_w_0);
  const _gap_0 = Math.fround(_x_0 / 2);
  const _x_1 = Math.fround(1 / 2);
  const _cx_0 = $$lib_num_sharpen(Math.fround(_w_0 * _x_1));
  const _x_2 = Math.fround(11 / 100);
  const _title_y_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_2));
  const _x_3 = Math.fround(40 / 100);
  const _p_y_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_3));
  const _x_4 = Math.fround(60 / 100);
  const _rate_y_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_4));
  const _x_5 = Math.fround(75 / 100);
  const _t_y_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_5));
  const _x_6 = Math.fround(_h_0 - _rect_h_0);
  const _x_7 = $$lib_env_word(_e_0, {$: "WBarometerRate"});
  return {$: "Scene", "x": 0, "y": 0, "nodes": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GFill", "color": "#F6F6F6"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _stroke_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GRoundRect", "x": _gap_0, "y": Math.fround(_x_6 - _gap_0), "w": _rect_w_0, "h": _rect_h_0, "r": _corner_0}, "tail": {$: "Nil"}}}}}), "tail": {$: "Con", "head": $$lib_scene_label(_cx_0, _p_y_0, _ptext_0, $$lib_scene_boldx(_display_px_0, "arial"), "black", "center", "middle"), "tail": {$: "Con", "head": $$lib_scene_label_w(_cx_0, _rate_y_0, (_x_7 + ":"), $$lib_scene_boldx(_rate_px_0, "arial"), "black", "center", "middle", $$lib_scene_max_centred(_w_0, 0, _cx_0)), "tail": {$: "Con", "head": $$lib_scene_label_w(_cx_0, _t_y_0, _ttext_0, $$lib_scene_boldx(_display_px_0, "arial"), "black", "center", "middle", Math.fround(_rect_w_0 * 0.9700000286102295)), "tail": {$: "Con", "head": $$lib_scene_label_w(_cx_0, _title_y_0, $$lib_env_word(_e_0, {$: "WBarometerTitle"}), $$lib_scene_boldx(_title_px_0, "arial"), "black", "center", "middle", $$lib_scene_max_centred(_w_0, 0, _cx_0)), "tail": {$: "Nil"}}}}}}};
}

function $widgets_humidity_init(_e_0) {
  return {$: "St", "w": 300, "h": 150, "fresh": true, "old_h": "0", "old_t": "0", "hum": 0, "trend": 0, "atrend": 0, "r": $$lib_tween_still(0)};
}

function $widgets_humidity_tip(_e_0) {
  return $lib_env_word(_e_0, {$: "WHumidityDescription"});
}

function $widgets_humidity_pfloat(_s_0) {
  return $Bool_pick($$String_is_empty($$String_trim(_s_0)), $$lib_num_nan(), $$lib_num_parse(_s_0));
}

function $widgets_humidity_half_angle(_w_0, _h_0) {
  const _rad_0 = Math.fround(_w_0 * 0.4000000059604645);
  const _cut_0 = Math.fround(_rad_0 * 2);
  const _x_0 = Math.fround(_h_0 / 2);
  const _x_1 = Math.fround(_cut_0 - _x_0);
  const _x_2 = Math.fround(_x_1 / _rad_0);
  const _x_3 = $$F32_pi();
  const _x_4 = Math.fround(Math.acos(_x_2));
  return Math.fround(_x_3 - _x_4);
}

function $widgets_humidity_redraw(_st_0, _hraw_0, _traw_0, _tc_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _atrend_0 = _st_0["atrend"];
  const _r_0 = _st_0["r"];
  const _x_0 = $$F32_pi();
  const _x_1 = $$widgets_humidity_half_angle(_w_0, _h_0);
  const _x_2 = Math.fround(180 / _x_0);
  const _half_deg_0 = Math.fround(_x_1 * _x_2);
  const _x_3 = $$widgets_humidity_pfloat(_traw_0);
  const _trend_0 = Math.fround(Math.trunc(_x_3));
  const _hum_0 = $$widgets_humidity_pfloat(_hraw_0);
  const _out_0 = $$lib_num_map(_hum_0, 0, 100, (-_half_deg_0), _half_deg_0);
  return {$: "St", "w": _w_0, "h": _h_0, "fresh": false, "old_h": _hraw_0, "old_t": _traw_0, "hum": _hum_0, "trend": _trend_0, "atrend": $$Bool_pick(_tc_0, _trend_0, _atrend_0), "r": $$lib_tween_to(_r_0, _out_0, 2000, _now_0)};
}

function $widgets_humidity_data(_st_0, _e_0, _force_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _fresh_0 = _st_0["fresh"];
  const _old_h_0 = _st_0["old_h"];
  const _old_t_0 = _st_0["old_t"];
  const _hum_0 = _st_0["hum"];
  const _trend_0 = _st_0["trend"];
  const _atrend_0 = _st_0["atrend"];
  const _r_0 = _st_0["r"];
  const _hraw_0 = $$lib_env_cr(_e_0, 5);
  const _traw_0 = $$lib_env_cr(_e_0, 144);
  const _tc_0 = $$lib_env_changed(_fresh_0, _traw_0, _old_t_0);
  const _x_0 = $$lib_env_changed(_fresh_0, _hraw_0, _old_h_0);
  const _x_1 = (_x_0 || _tc_0);
  const _go_0 = (_x_1 || _force_0);
  const _same_0 = {$: "St", "w": _w_0, "h": _h_0, "fresh": _fresh_0, "old_h": _old_h_0, "old_t": _old_t_0, "hum": _hum_0, "trend": _trend_0, "atrend": _atrend_0, "r": _r_0};
  return $Bool_pick(_go_0, $$widgets_humidity_redraw(_same_0, _hraw_0, _traw_0, _tc_0, _now_0), _same_0);
}

function $widgets_humidity_resize(_st_0, _b_0) {
  const _fresh_0 = _st_0["fresh"];
  const _old_h_0 = _st_0["old_h"];
  const _old_t_0 = _st_0["old_t"];
  const _hum_0 = _st_0["hum"];
  const _trend_0 = _st_0["trend"];
  const _r_0 = _st_0["r"];
  const _pw_0 = _b_0["pw"];
  return {$: "St", "w": $$lib_num_cdim(_pw_0, 1, 1), "h": $$lib_num_cdim(_pw_0, 1, 1), "fresh": _fresh_0, "old_h": _old_h_0, "old_t": _old_t_0, "hum": _hum_0, "trend": _trend_0, "atrend": _trend_0, "r": _r_0};
}

function $widgets_humidity_width(_st_0) {
  const _w_0 = _st_0["w"];
  return _w_0;
}

function $widgets_humidity_height(_st_0) {
  const _h_0 = _st_0["h"];
  return _h_0;
}

function $widgets_humidity_dashes(_n_0, _i_0, _w_0, _h_0, _half_0, _rad_0, _end_rad_0, _stroke_0) {
  if (_n_0 == 0) {
    return {$: "Nil"};
  } else {
    const _k_0 = (_n_0 - 1);
    const _fi_0 = $$lib_num_of_nat(_i_0);
    const _seg_0 = Math.fround(_half_0 / 10);
    const _x_0 = Math.fround(_seg_0 * _fi_0);
    const _x_1 = Math.fround(_half_0 - _x_0);
    const _x_2 = $$F32_pi();
    const _angle_0 = Math.fround(_x_1 + _x_2);
    const _x_3 = Math.fround(_fi_0 % 2);
    const _even_0 = (_x_3 === 0);
    const _x_4 = Math.fround(Math.sin(_angle_0));
    const _x_5 = Math.fround(Math.sin(_angle_0));
    const _x_6 = Math.fround(_end_rad_0 + _rad_0);
    const _x_7 = Math.fround(_x_5 * _x_6);
    const _far_0 = $$Bool_pick(_even_0, Math.fround(_x_4 * _end_rad_0), Math.fround(_x_7 / 2));
    const _x_8 = Math.fround(Math.cos(_angle_0));
    const _x_9 = Math.fround(Math.cos(_angle_0));
    const _x_10 = Math.fround(_end_rad_0 + _rad_0);
    const _x_11 = Math.fround(_x_9 * _x_10);
    const _far_y_0 = $$Bool_pick(_even_0, Math.fround(_x_8 * _end_rad_0), Math.fround(_x_11 / 2));
    const _x_12 = Math.fround(_w_0 / 2);
    const _x_13 = Math.fround(_h_0 / 2);
    const _xf_0 = {$: "Xf", "x": 0, "y": 0, "rot": 0, "regx": (-_x_12), "regy": (-_x_13), "visible": true};
    const _x_14 = Math.fround(Math.sin(_angle_0));
    const _x_15 = Math.fround(Math.cos(_angle_0));
    return {$: "Con", "head": $$lib_scene_shape_at(_xf_0, {$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _stroke_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GMove", "x": Math.fround(_x_14 * _rad_0), "y": Math.fround(_x_15 * _rad_0)}, "tail": {$: "Con", "head": {$: "GLine", "x": _far_0, "y": _far_y_0}, "tail": {$: "Nil"}}}}}), "tail": $$widgets_humidity_dashes(_k_0, nat_chk(_i_0 + 1), _w_0, _h_0, _half_0, _rad_0, _end_rad_0, _stroke_0)};
  }
}

function $widgets_humidity_stray_dash() {
  return $lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GStyle", "width": 110, "caps": ""}, "tail": {$: "Con", "head": {$: "GMove", "x": 0, "y": 0}, "tail": {$: "Con", "head": {$: "GLine", "x": 0, "y": 0}, "tail": {$: "Nil"}}}}});
}

function $widgets_humidity_labels(_n_0, _i_0, _w_0, _h_0, _half_0, _rad_0, _px_0) {
  if (_n_0 == 0) {
    return {$: "Nil"};
  } else {
    const _k_0 = (_n_0 - 1);
    const _fi_0 = $$lib_num_of_nat(_i_0);
    const _seg_0 = Math.fround(_half_0 / 10);
    const _x_0 = Math.fround(_fi_0 * 2);
    const _x_1 = Math.fround(_seg_0 * _x_0);
    const _x_2 = Math.fround(_half_0 - _x_1);
    const _x_3 = $$F32_pi();
    const _angle_0 = Math.fround(_x_2 + _x_3);
    const _x_4 = Math.fround(Math.sin(_angle_0));
    const _x_5 = Math.fround(Math.cos(_angle_0));
    const _x_6 = Math.fround(_w_0 / 2);
    const _x_7 = Math.fround(_h_0 / 2);
    const _xf_0 = {$: "Xf", "x": Math.fround(_x_4 * _rad_0), "y": Math.fround(_x_5 * _rad_0), "rot": 0, "regx": (-_x_6), "regy": (-_x_7), "visible": true};
    const _x_8 = Math.fround(100 * _fi_0);
    return {$: "Con", "head": {$: "NLabel", "xf": _xf_0, "text": $$lib_num_show($$F32_round(Math.fround(_x_8 / 10))), "font": $$lib_scene_plainx(_px_0, "arial"), "color": "", "align": "center", "base": "middle", "maxw": 0}, "tail": $$widgets_humidity_labels(_k_0, nat_chk(_i_0 + 1), _w_0, _h_0, _half_0, _rad_0, _px_0)};
  }
}

function $widgets_humidity_arrow(_w_0, _h_0, _stroke_0, _trend_0) {
  const _ax_0 = Math.fround(_w_0 / 2);
  const _ay_0 = Math.fround(_h_0 * 0.6499999761581421);
  const _col_0 = $$lib_scene_rgb("16, 217, 244");
  const _vis_0 = $$Bool_not((_trend_0 === 0));
  const _x_0 = Math.fround(0.05000000074505806 * _trend_0);
  const _x_1 = Math.fround(1 - _x_0);
  return {$: "Con", "head": $$lib_scene_shape_at({$: "Xf", "x": 0, "y": 0, "rot": 0, "regx": 0, "regy": 0, "visible": _vis_0}, {$: "Con", "head": {$: "GStroke", "color": _col_0}, "tail": {$: "Con", "head": {$: "GStyle", "width": _stroke_0, "caps": "round"}, "tail": {$: "Con", "head": {$: "GMove", "x": _ax_0, "y": Math.fround(_ay_0 * 0.949999988079071)}, "tail": {$: "Con", "head": {$: "GLine", "x": _ax_0, "y": Math.fround(_ay_0 * 1.0499999523162842)}, "tail": {$: "Nil"}}}}}), "tail": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": _col_0}, "tail": {$: "Con", "head": {$: "GStyle", "width": _stroke_0, "caps": "round"}, "tail": {$: "Con", "head": {$: "GMove", "x": Math.fround(_ax_0 * 0.949999988079071), "y": _ay_0}, "tail": {$: "Con", "head": {$: "GLine", "x": _ax_0, "y": Math.fround(_ay_0 * _x_1)}, "tail": {$: "Con", "head": {$: "GLine", "x": Math.fround(_ax_0 * 1.0499999523162842), "y": _ay_0}, "tail": {$: "Nil"}}}}}}), "tail": {$: "Nil"}}};
}

function $widgets_humidity_front(_w_0, _h_0, _now_0, _hum_0, _r_0, _title_0) {
  const _rad_0 = Math.fround(_w_0 * 0.4000000059604645);
  const _inner_0 = Math.fround(_w_0 * 0.05000000074505806);
  const _cut_0 = Math.fround(_rad_0 * 2);
  const _stroke_0 = Math.fround(_w_0 / 80);
  const _cx_0 = Math.fround(_w_0 / 2);
  const _cy_0 = Math.fround(_h_0 / 2);
  const _x_0 = Math.fround(_cut_0 - _cx_0);
  const _x_1 = (_rad_0 === 1 || _rad_0 === -1 && Math.abs(2) === Infinity ? 1 : Math.fround(Math.pow(_rad_0, 2)));
  const _x_2 = (_x_0 === 1 || _x_0 === -1 && Math.abs(2) === Infinity ? 1 : Math.fround(Math.pow(_x_0, 2)));
  const _x_3 = Math.fround(_x_1 - _x_2);
  const _chord_0 = Math.fround(Math.sqrt(_x_3));
  const _x_4 = Math.fround(_stroke_0 / 10);
  const _bot_y_0 = Math.fround(_cut_0 - _x_4);
  const _x_5 = Math.fround(1 / 5);
  const _x_6 = Math.fround(97 / 200);
  const _x_7 = Math.fround(3 / 5);
  const _x_8 = Math.fround(103 / 200);
  const _x_9 = Math.fround(3 / 5);
  const _x_10 = Math.fround(103 / 110);
  const _x_11 = $$lib_num_show(_hum_0);
  const _x_12 = Math.fround(110 / 103);
  return {$: "Con", "head": $$lib_scene_masked({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GFill", "color": "#F6F6F6"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _stroke_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GCircle", "x": _cx_0, "y": _cy_0, "r": _rad_0}, "tail": {$: "Nil"}}}}}, {$: "Con", "head": {$: "GRect", "x": 0, "y": 0, "w": _w_0, "h": _cut_0}, "tail": {$: "Nil"}}), "tail": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _stroke_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GMove", "x": Math.fround(_cx_0 - _chord_0), "y": _bot_y_0}, "tail": {$: "Con", "head": {$: "GLine", "x": Math.fround(_cx_0 + _chord_0), "y": _bot_y_0}, "tail": {$: "Nil"}}}}}), "tail": {$: "Con", "head": $$lib_scene_shape_at({$: "Xf", "x": Math.fround(_w_0 / 2), "y": Math.fround(_h_0 / 2), "rot": $$lib_tween_value(_r_0, _now_0), "regx": Math.fround(_w_0 / 2), "regy": Math.fround(_h_0 / 2), "visible": true}, {$: "Con", "head": {$: "GFill", "color": "black"}, "tail": {$: "Con", "head": {$: "GStyle", "width": 10, "caps": ""}, "tail": {$: "Con", "head": {$: "GMove", "x": Math.fround(_w_0 / 2), "y": Math.fround(_h_0 * _x_5)}, "tail": {$: "Con", "head": {$: "GLine", "x": Math.fround(_w_0 * _x_6), "y": Math.fround(_h_0 * _x_7)}, "tail": {$: "Con", "head": {$: "GLine", "x": Math.fround(_w_0 * _x_8), "y": Math.fround(_h_0 * _x_9)}, "tail": {$: "Con", "head": {$: "GClosePath"}, "tail": {$: "Nil"}}}}}}}), "tail": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GFill", "color": "black"}, "tail": {$: "Con", "head": {$: "GStyle", "width": 0, "caps": ""}, "tail": {$: "Con", "head": {$: "GCircle", "x": _cx_0, "y": _cy_0, "r": _inner_0}, "tail": {$: "Nil"}}}}), "tail": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GFill", "color": $$lib_scene_rgb("16, 217, 244")}, "tail": {$: "Con", "head": {$: "GStyle", "width": 0, "caps": ""}, "tail": {$: "Con", "head": {$: "GCircle", "x": _cx_0, "y": _cy_0, "r": Math.fround(_inner_0 / 4)}, "tail": {$: "Nil"}}}}), "tail": {$: "Con", "head": $$lib_scene_label(_cx_0, Math.fround(_cut_0 * _x_10), (_x_11 + "%"), $$lib_scene_boldx($$lib_scene_ex_div($$lib_scene_ex(_w_0), $$lib_scene_ex(10)), "arial"), "black", "center", "middle"), "tail": {$: "Con", "head": $$lib_scene_label_w(_cx_0, Math.fround(_cut_0 * _x_12), _title_0, $$lib_scene_boldx($$lib_scene_ex_div($$lib_scene_ex(_w_0), $$lib_scene_ex(13)), "arial"), "black", "center", "middle", $$lib_scene_max_centred(_w_0, 0, _cx_0)), "tail": {$: "Nil"}}}}}}}};
}

function $widgets_humidity_view(_st_0, _e_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _hum_0 = _st_0["hum"];
  const _atrend_0 = _st_0["atrend"];
  const _r_0 = _st_0["r"];
  const _rad_0 = Math.fround(_w_0 * 0.4000000059604645);
  const _half_0 = $$widgets_humidity_half_angle(_w_0, _h_0);
  const _stroke_0 = Math.fround(_w_0 / 80);
  const _x_0 = $$lib_env_word(_e_0, {$: "WHumidityTitle"});
  const _title_0 = (_x_0 + " (%)");
  const _x_1 = Math.fround(5 / 8);
  const _ls_0 = $$widgets_humidity_labels(11, 0, _w_0, _h_0, _half_0, Math.fround(_rad_0 * _x_1), $$lib_scene_ex_div($$lib_scene_ex(_w_0), $$lib_scene_ex(15)));
  const _x_2 = Math.fround(3 / 4);
  const _ds_0 = $$widgets_humidity_dashes(21, 0, _w_0, _h_0, _half_0, _rad_0, Math.fround(_rad_0 * _x_2), _stroke_0);
  const _rest_0 = $$List_append(_ds_0, {$: "Con", "head": $$widgets_humidity_stray_dash(), "tail": $$widgets_humidity_arrow(_w_0, _h_0, _stroke_0, _atrend_0)});
  const _x_3 = (-0.09000000357627869);
  return {$: "Scene", "x": 0, "y": Math.fround(_h_0 * _x_3), "nodes": $$List_append($$widgets_humidity_front(_w_0, _h_0, _now_0, _hum_0, _r_0, _title_0), $$List_append(_ls_0, _rest_0))};
}

function $widgets_moonsun_init(_e_0) {
  return {$: "St", "w": 300, "h": 150, "old": {$: "Six", "sr": "undefined", "ss": "undefined", "mr": "undefined", "ms": "undefined", "mp": "undefined", "ma": "undefined"}, "txt": {$: "Six", "sr": "Rise: 24:59", "ss": "Set: 24:59", "mr": "Rise: 24:59", "ms": "Set: 24:59", "mp": "100%", "ma": "33"}};
}

function $widgets_moonsun_tip(_e_0) {
  return "";
}

function $widgets_moonsun_fresh(_e_0) {
  return {$: "Six", "sr": $$lib_env_cre(_e_0, (556 )), "ss": $$lib_env_cre(_e_0, (557 )), "mr": $$lib_env_cre(_e_0, (558 )), "ms": $$lib_env_cre(_e_0, (559 )), "mp": $$lib_env_cre(_e_0, (560 )), "ma": $$lib_env_cre(_e_0, (561 ))};
}

function $widgets_moonsun_differs(_a_0, _b_0) {
  const _a1_0 = _a_0["sr"];
  const _a2_0 = _a_0["ss"];
  const _a3_0 = _a_0["mr"];
  const _a4_0 = _a_0["ms"];
  const _a5_0 = _a_0["mp"];
  const _a6_0 = _a_0["ma"];
  const _b1_0 = _b_0["sr"];
  const _b2_0 = _b_0["ss"];
  const _b3_0 = _b_0["mr"];
  const _b4_0 = _b_0["ms"];
  const _b5_0 = _b_0["mp"];
  const _b6_0 = _b_0["ma"];
  const _x_0 = $$Bool_not($$String_eq(_a1_0, _b1_0));
  const _x_1 = $$Bool_not($$String_eq(_a2_0, _b2_0));
  const _x_2 = (_x_0 || _x_1);
  const _x_3 = $$Bool_not($$String_eq(_a3_0, _b3_0));
  const _x_4 = (_x_2 || _x_3);
  const _x_5 = $$Bool_not($$String_eq(_a4_0, _b4_0));
  const _x_6 = (_x_4 || _x_5);
  const _x_7 = $$Bool_not($$String_eq(_a5_0, _b5_0));
  const _x_8 = (_x_6 || _x_7);
  const _x_9 = $$Bool_not($$String_eq(_a6_0, _b6_0));
  return (_x_8 || _x_9);
}

function $widgets_moonsun_texts(_e_0, _v_0) {
  const _sr_0 = _v_0["sr"];
  const _ss_0 = _v_0["ss"];
  const _mr_0 = _v_0["mr"];
  const _ms_0 = _v_0["ms"];
  const _mp_0 = _v_0["mp"];
  const _ma_0 = _v_0["ma"];
  const _rise_0 = $$lib_env_word(_e_0, {$: "WMoonSunRise"});
  const _set_0 = $$lib_env_word(_e_0, {$: "WMoonSunSet"});
  const _x_0 = (": " + _sr_0);
  const _x_1 = (": " + _ss_0);
  const _x_2 = (": " + _mr_0);
  const _x_3 = (": " + _ms_0);
  const _x_4 = (_mp_0 + "%");
  const _x_5 = $$lib_env_word(_e_0, {$: "WMoonSunPhase"});
  const _x_6 = (": " + _x_4);
  const _x_7 = $$lib_env_word(_e_0, {$: "WMoonSunAge"});
  const _x_8 = (": " + _ma_0);
  return {$: "Six", "sr": (_rise_0 + _x_0), "ss": (_set_0 + _x_1), "mr": (_rise_0 + _x_2), "ms": (_set_0 + _x_3), "mp": (_x_5 + _x_6), "ma": (_x_7 + _x_8)};
}

function $widgets_moonsun_data(_st_0, _e_0, _force_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _old_0 = _st_0["old"];
  const _txt_0 = _st_0["txt"];
  const _v_0 = $$widgets_moonsun_fresh(_e_0);
  const _x_0 = $$widgets_moonsun_differs(_v_0, _old_0);
  return $Bool_pick((_x_0 || _force_0), {$: "St", "w": _w_0, "h": _h_0, "old": _v_0, "txt": $$widgets_moonsun_texts(_e_0, _v_0)}, {$: "St", "w": _w_0, "h": _h_0, "old": _old_0, "txt": _txt_0});
}

function $widgets_moonsun_resize(_st_0, _b_0) {
  const _old_0 = _st_0["old"];
  const _txt_0 = _st_0["txt"];
  const _ph_0 = _b_0["ph"];
  return {$: "St", "w": $$lib_num_cdim(_ph_0, 1, 1), "h": $$lib_num_cdim(_ph_0, 1, 1), "old": _old_0, "txt": _txt_0};
}

function $widgets_moonsun_width(_st_0) {
  const _w_0 = _st_0["w"];
  return _w_0;
}

function $widgets_moonsun_height(_st_0) {
  const _h_0 = _st_0["h"];
  return _h_0;
}

function $widgets_moonsun_line(_x_0, _y_0, _t_0, _px_0, _maxw_0) {
  return $lib_scene_label_w(_x_0, _y_0, _t_0, $$lib_scene_boldx(_px_0, "arial"), "black", "center", "middle", _maxw_0);
}

function $widgets_moonsun_view(_st_0, _e_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _t_0 = _st_0["txt"];
  const _sr_0 = _t_0["sr"];
  const _ss_0 = _t_0["ss"];
  const _mr_0 = _t_0["mr"];
  const _ms_0 = _t_0["ms"];
  const _mp_0 = _t_0["mp"];
  const _ma_0 = _t_0["ma"];
  const _rect_w_0 = Math.fround(_w_0 * 0.8999999761581421);
  const _rect_h_0 = Math.fround(_h_0 * 0.8999999761581421);
  const _corner_0 = Math.fround(_h_0 * 0.10000000149011612);
  const _stroke_0 = Math.fround(_w_0 / 40);
  const _disp_px_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(10));
  const _title_px_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(9));
  const _x_0 = Math.fround(1 / 2);
  const _x_1 = $$lib_num_sharpen(Math.fround(_w_0 * _x_0));
  const _maxw_0 = Math.fround(_rect_w_0 * 0.9700000286102295);
  const _x_2 = Math.fround(13 / 100);
  const _y_sun_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_2));
  const _x_3 = Math.fround(47 / 100);
  const _y_moon_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_3));
  const _x_4 = Math.fround(23 / 100);
  const _y_sr_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_4));
  const _x_5 = Math.fround(33 / 100);
  const _y_ss_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_5));
  const _x_6 = Math.fround(57 / 100);
  const _y_mr_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_6));
  const _x_7 = Math.fround(67 / 100);
  const _y_ms_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_7));
  const _x_8 = Math.fround(77 / 100);
  const _y_mp_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_8));
  const _x_9 = Math.fround(87 / 100);
  const _y_ma_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_9));
  const _x_10 = Math.fround(_w_0 - _rect_w_0);
  const _x_11 = Math.fround(_h_0 - _rect_h_0);
  return {$: "Scene", "x": 0, "y": 0, "nodes": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GFill", "color": "#F6F6F6"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _stroke_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GRoundRect", "x": Math.fround(_x_10 / 2), "y": Math.fround(_x_11 / 2), "w": _rect_w_0, "h": _rect_h_0, "r": _corner_0}, "tail": {$: "Nil"}}}}}), "tail": {$: "Con", "head": $$widgets_moonsun_line(_x_1, _y_sr_0, _sr_0, _disp_px_0, _maxw_0), "tail": {$: "Con", "head": $$widgets_moonsun_line(_x_1, _y_ss_0, _ss_0, _disp_px_0, _maxw_0), "tail": {$: "Con", "head": $$widgets_moonsun_line(_x_1, _y_mr_0, _mr_0, _disp_px_0, _maxw_0), "tail": {$: "Con", "head": $$widgets_moonsun_line(_x_1, _y_ms_0, _ms_0, _disp_px_0, _maxw_0), "tail": {$: "Con", "head": $$widgets_moonsun_line(_x_1, _y_mp_0, _mp_0, _disp_px_0, _maxw_0), "tail": {$: "Con", "head": $$widgets_moonsun_line(_x_1, _y_ma_0, _ma_0, _disp_px_0, _maxw_0), "tail": {$: "Con", "head": $$widgets_moonsun_line(_x_1, _y_sun_0, $$lib_env_word(_e_0, {$: "WMoonSunTitleSun"}), _title_px_0, _maxw_0), "tail": {$: "Con", "head": $$widgets_moonsun_line(_x_1, _y_moon_0, $$lib_env_word(_e_0, {$: "WMoonSunTitleMoon"}), _title_px_0, _maxw_0), "tail": {$: "Nil"}}}}}}}}}}};
}

function $widgets_solar_init(_e_0) {
  return {$: "St", "w": 300, "h": 150, "watt": $$String_eq($$lib_env_opt(_e_0, "solar.mode", "percentage"), "Watt"), "fresh": true, "o_pct": "0", "o_uni": "0", "o_sun": "0", "uni": 0, "pct": 0, "sun": 0, "rng": {$: "Rng", "max": 250, "pos": 2}, "fill": $$lib_tween_still(0)};
}

function $widgets_solar_tip(_e_0) {
  return $lib_env_word(_e_0, {$: "WSolarDescription"});
}

function $widgets_solar_seq(_p_0) {
  return TAB_0[Math.min(_p_0, 2)];
}

function $widgets_solar_next(_p_0) {
  return TAB_1[Math.min(_p_0, 2)];
}

function $widgets_solar_prev(_p_0) {
  return TAB_2[Math.min(_p_0, 2)];
}

function $widgets_solar_up_test(_uni_0, _max_0) {
  const _x_0 = Math.fround(_max_0 * 0.8999999761581421);
  return (_uni_0 > _x_0);
}

function $widgets_solar_up($0, $1, $2, $3, $4) {
  for (;;) {
    {
      const _fuel_0 = $0;
      const _go_0 = $1;
      const _uni_0 = $2;
      const _max_0 = $3;
      const _pos_0 = $4;
      if (_fuel_0 == 0) {
        return {$: "Rng", "max": _max_0, "pos": _pos_0};
      } else {
        const _f_0 = (_fuel_0 - 1);
        if (_go_0) {
          const _x_0 = $$widgets_solar_seq($$widgets_solar_next(_pos_0));
          const _m_0 = Math.fround(_max_0 * _x_0);
          $0 = _f_0;
          $1 = $$widgets_solar_up_test(_uni_0, _m_0);
          $2 = _uni_0;
          $3 = _m_0;
          $4 = $$widgets_solar_next(_pos_0);
          continue;
        } else {
          return {$: "Rng", "max": _max_0, "pos": _pos_0};
        }
      }
    }
  }
}

function $widgets_solar_down_test(_uni_0, _max_0, _pos_0) {
  const _x_0 = $$widgets_solar_seq(_pos_0);
  const _x_1 = Math.fround(_max_0 / _x_0);
  const _x_2 = Math.fround(_x_1 * 0.8999999761581421);
  return $Bool_and((_uni_0 <= _x_2), (_max_0 > 250));
}

function $widgets_solar_down($0, $1, $2, $3, $4) {
  for (;;) {
    {
      const _fuel_0 = $0;
      const _go_0 = $1;
      const _uni_0 = $2;
      const _max_0 = $3;
      const _pos_0 = $4;
      if (_fuel_0 == 0) {
        return {$: "Rng", "max": _max_0, "pos": _pos_0};
      } else {
        const _f_0 = (_fuel_0 - 1);
        if (_go_0) {
          const _x_0 = $$widgets_solar_seq(_pos_0);
          const _m_0 = Math.fround(_max_0 / _x_0);
          $0 = _f_0;
          $1 = $$widgets_solar_down_test(_uni_0, _m_0, $$widgets_solar_prev(_pos_0));
          $2 = _uni_0;
          $3 = _m_0;
          $4 = $$widgets_solar_prev(_pos_0);
          continue;
        } else {
          return {$: "Rng", "max": _max_0, "pos": _pos_0};
        }
      }
    }
  }
}

function $widgets_solar_range_down(_uni_0, _a_0) {
  const _m_0 = _a_0["max"];
  const _p_0 = _a_0["pos"];
  return $widgets_solar_down(100, $$widgets_solar_down_test(_uni_0, _m_0, _p_0), _uni_0, _m_0, _p_0);
}

function $widgets_solar_range(_uni_0, _r_0) {
  const _max_0 = _r_0["max"];
  const _pos_0 = _r_0["pos"];
  return $widgets_solar_range_down(_uni_0, $$widgets_solar_up(100, $$widgets_solar_up_test(_uni_0, _max_0), _uni_0, _max_0, _pos_0));
}

function $widgets_solar_rng_max(_r_0) {
  const _m_0 = _r_0["max"];
  return _m_0;
}

function $widgets_solar_apply(_watt_0, _w_0, _h_0, _e_0, _pct_s_0, _uni_s_0, _sun_s_0, _rng_0, _fill_0, _now_0) {
  if (_watt_0) {
    const _uni_0 = $$lib_units_value($$lib_env_units(_e_0), {$: "Solar"}, $$lib_num_parse(_uni_s_0));
    const _r_0 = $$widgets_solar_range(_uni_0, _rng_0);
    const _out_0 = $$lib_num_map(_uni_0, 0, $$widgets_solar_rng_max(_r_0), 0, 1);
    return {$: "St", "w": _w_0, "h": _h_0, "watt": true, "fresh": false, "o_pct": _pct_s_0, "o_uni": _uni_s_0, "o_sun": _sun_s_0, "uni": _uni_0, "pct": $$lib_num_parse(_pct_s_0), "sun": $$lib_num_parse(_sun_s_0), "rng": _r_0, "fill": $$lib_tween_to(_fill_0, _out_0, 2000, _now_0)};
  } else {
    const _pct_0 = $$lib_units_value($$lib_env_units(_e_0), {$: "Solar"}, $$lib_num_parse(_pct_s_0));
    const _out_1 = $$lib_num_map(_pct_0, 0, 100, 0, 1);
    return {$: "St", "w": _w_0, "h": _h_0, "watt": false, "fresh": false, "o_pct": _pct_s_0, "o_uni": _uni_s_0, "o_sun": _sun_s_0, "uni": $$lib_num_parse(_uni_s_0), "pct": _pct_0, "sun": $$lib_num_parse(_sun_s_0), "rng": _rng_0, "fill": $$lib_tween_to(_fill_0, _out_1, 2000, _now_0)};
  }
}

function $widgets_solar_data(_st_0, _e_0, _force_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _watt_0 = _st_0["watt"];
  const _fresh_0 = _st_0["fresh"];
  const _o_pct_0 = _st_0["o_pct"];
  const _o_uni_0 = _st_0["o_uni"];
  const _o_sun_0 = _st_0["o_sun"];
  const _uni_0 = _st_0["uni"];
  const _pct_0 = _st_0["pct"];
  const _sun_0 = _st_0["sun"];
  const _rng_0 = _st_0["rng"];
  const _fill_0 = _st_0["fill"];
  const _pct_s_0 = $$lib_env_cr(_e_0, 34);
  const _uni_s_0 = $$lib_env_cr(_e_0, 127);
  const _sun_s_0 = $$lib_env_cre(_e_0, (696 ));
  const _x_0 = $$lib_env_changed(_fresh_0, _uni_s_0, _o_uni_0);
  const _x_1 = (_force_0 || _x_0);
  const _x_2 = $$lib_env_changed(_fresh_0, _pct_s_0, _o_pct_0);
  const _x_3 = (_x_1 || _x_2);
  const _x_4 = $$lib_env_changed(_fresh_0, _sun_s_0, _o_sun_0);
  const _ch_0 = (_x_3 || _x_4);
  return $Bool_pick(_ch_0, $$widgets_solar_apply(_watt_0, _w_0, _h_0, _e_0, _pct_s_0, _uni_s_0, _sun_s_0, _rng_0, _fill_0, _now_0), {$: "St", "w": _w_0, "h": _h_0, "watt": _watt_0, "fresh": _fresh_0, "o_pct": _o_pct_0, "o_uni": _o_uni_0, "o_sun": _o_sun_0, "uni": _uni_0, "pct": _pct_0, "sun": _sun_0, "rng": _rng_0, "fill": _fill_0});
}

function $widgets_solar_resize(_st_0, _b_0) {
  const _watt_0 = _st_0["watt"];
  const _fresh_0 = _st_0["fresh"];
  const _o_pct_0 = _st_0["o_pct"];
  const _o_uni_0 = _st_0["o_uni"];
  const _o_sun_0 = _st_0["o_sun"];
  const _uni_0 = _st_0["uni"];
  const _pct_0 = _st_0["pct"];
  const _sun_0 = _st_0["sun"];
  const _rng_0 = _st_0["rng"];
  const _fill_0 = _st_0["fill"];
  const _ph_0 = _b_0["ph"];
  return {$: "St", "w": $$lib_num_cdim(_ph_0, 1, 3), "h": $$lib_num_cdim(_ph_0, 1, 1), "watt": _watt_0, "fresh": _fresh_0, "o_pct": _o_pct_0, "o_uni": _o_uni_0, "o_sun": _o_sun_0, "uni": _uni_0, "pct": _pct_0, "sun": _sun_0, "rng": _rng_0, "fill": _fill_0};
}

function $widgets_solar_width(_st_0) {
  const _w_0 = _st_0["w"];
  return _w_0;
}

function $widgets_solar_height(_st_0) {
  const _h_0 = _st_0["h"];
  return _h_0;
}

function $widgets_solar_modf(_i_0, _n_0) {
  const _x_0 = Math.fround(_i_0 / _n_0);
  const _x_1 = Math.fround(Math.floor(_x_0));
  const _x_2 = Math.fround(_n_0 * _x_1);
  return Math.fround(_i_0 - _x_2);
}

function $widgets_solar_dash(_i_0, _pdx_0, _pdy_0, _dl_0, _sw_0, _gap_0) {
  const _live_0 = (_i_0 < 51);
  const _x_0 = $$widgets_solar_modf(_i_0, 10);
  const _large_0 = $$Bool_and(_live_0, (_x_0 === 0));
  const _x_1 = $$widgets_solar_modf(_i_0, 5);
  const _med_0 = $$Bool_and($$Bool_and(_live_0, $$Bool_not(_large_0)), (_x_1 === 0));
  const _any_0 = (_large_0 || _med_0);
  const _x_2 = Math.fround(_gap_0 * _i_0);
  const _dy_0 = $$lib_num_sharpen(Math.fround(_x_2 + _pdy_0));
  const _x_3 = Math.fround(_pdx_0 + _dl_0);
  const _x_4 = Math.fround(_dl_0 / 2);
  const _x0_0 = $$Bool_pick(_large_0, _pdx_0, $$Bool_pick(_med_0, Math.fround(_x_3 - _x_4), 0));
  const _x1_0 = $$Bool_pick(_any_0, Math.fround(_pdx_0 + _dl_0), 0);
  const _y_0 = $$Bool_pick(_any_0, _dy_0, 0);
  return $lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GStyle", "width": $$Bool_pick(_any_0, _sw_0, 0), "caps": ""}, "tail": {$: "Con", "head": {$: "GMove", "x": _x0_0, "y": _y_0}, "tail": {$: "Con", "head": {$: "GLine", "x": _x1_0, "y": _y_0}, "tail": {$: "Nil"}}}}});
}

function $widgets_solar_label(_i_0, _pdx_0, _pdy_0, _dl_0, _gap_0, _text_px_0, _max_0) {
  const _live_0 = (_i_0 < 6);
  const _x_0 = Math.fround(_i_0 * 10);
  const _x_1 = Math.fround(_gap_0 * _x_0);
  const _dy_0 = $$lib_num_sharpen(Math.fround(_x_1 + _pdy_0));
  const _x_2 = Math.fround(_pdx_0 - _dl_0);
  const _x_3 = Math.fround(12 / 11);
  const _lx_0 = Math.fround(_x_2 * _x_3);
  const _x_4 = Math.fround(_max_0 - 0);
  const _x_5 = Math.fround(6 - 1);
  const _x_6 = Math.fround(_x_4 / _x_5);
  const _x_7 = Math.fround(_x_6 * _i_0);
  const _n_0 = Math.fround(_max_0 - _x_7);
  return $lib_scene_label($$Bool_pick(_live_0, _lx_0, 0), $$Bool_pick(_live_0, _dy_0, 0), $$Bool_pick(_live_0, $$lib_num_show(_n_0), "0px Arial"), $$Bool_pick(_live_0, $$lib_scene_plainx(_text_px_0, "arial"), "black"), "", "right", "middle");
}

function $widgets_solar_scale($0, $1, $2, $3, $4, $5, $6, $7, $8) {
  for (;;) {
    {
      const _k_0 = $0;
      const _acc_0 = $1;
      const _pdx_0 = $2;
      const _pdy_0 = $3;
      const _dl_0 = $4;
      const _sw_0 = $5;
      const _gap_0 = $6;
      const _text_px_0 = $7;
      const _max_0 = $8;
      if (_k_0 == 0) {
        return _acc_0;
      } else {
        const _j_0 = (_k_0 - 1);
        const _i_0 = $$lib_num_of_nat(_j_0);
        $0 = _j_0;
        $1 = {$: "Con", "head": $$widgets_solar_dash(_i_0, _pdx_0, _pdy_0, _dl_0, _sw_0, _gap_0), "tail": {$: "Con", "head": $$widgets_solar_label(_i_0, _pdx_0, _pdy_0, _dl_0, _gap_0, _text_px_0, _max_0), "tail": _acc_0}};
        $2 = _pdx_0;
        $3 = _pdy_0;
        $4 = _dl_0;
        $5 = _sw_0;
        $6 = _gap_0;
        $7 = _text_px_0;
        $8 = _max_0;
        continue;
      }
    }
  }
}

function $widgets_solar_rest(_watt_0, _e_0, _w_0, _h_0, _stage_x_0, _display_0, _pct_0, _sun_t_0, _max_0, _fill_n_0, _title_0) {
  if (_watt_0) {
    const _bar_w_0 = Math.fround(_h_0 * 0.07500000298023224);
    const _bar_h_0 = Math.fround(_h_0 * 0.75);
    const _x_0 = Math.fround(_h_0 / 2);
    const _x_1 = Math.fround(_bar_w_0 / 2);
    const _bar_x_0 = Math.fround(_x_0 - _x_1);
    const _tds_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(21));
    const _x_2 = Math.fround(_bar_w_0 / 2);
    const _mid_x_0 = Math.fround(_bar_x_0 + _x_2);
    const _x_3 = Math.fround(_bar_w_0 / 3);
    const _sun_x_0 = Math.fround(_bar_x_0 + _x_3);
    const _dl_0 = Math.fround(_h_0 * 0.03999999910593033);
    const _dg_0 = Math.fround(_h_0 * 0.02500000037252903);
    const _x_4 = Math.fround(_h_0 / 2);
    const _x_5 = Math.fround(_bar_w_0 / 2);
    const _x_6 = Math.fround(_x_4 - _x_5);
    const _x_7 = Math.fround(_x_6 - _dl_0);
    const _pdx_0 = Math.fround(_x_7 - _dg_0);
    const _x_8 = Math.fround(_h_0 - _bar_h_0);
    const _pdy_0 = Math.fround(_x_8 * 0.4099999964237213);
    const _x_9 = Math.fround(6 * 9);
    const _x_10 = Math.fround(_bar_h_0 - _pdy_0);
    const _x_11 = Math.fround(_x_9 - 10.5);
    const _gap_0 = Math.fround(_x_10 / _x_11);
    const _text_px_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(20));
    const _x_12 = Math.fround(201 / 162);
    const _sun_y_0 = Math.fround(_bar_h_0 * _x_12);
    const _x_13 = Math.fround(201 / 170);
    return $List_append($$widgets_solar_scale(60, {$: "Nil"}, _pdx_0, _pdy_0, _dl_0, Math.fround(_bar_w_0 / 40), _gap_0, _text_px_0, _max_0), {$: "Con", "head": _fill_n_0, "tail": {$: "Con", "head": $$lib_scene_label(_mid_x_0, Math.fround(_bar_h_0 * _x_13), _display_0, $$lib_scene_boldx(_tds_0, "arial"), "", "center", "middle"), "tail": {$: "Con", "head": $$lib_scene_label_w(_sun_x_0, _sun_y_0, _sun_t_0, $$lib_scene_plainx($$lib_scene_ex_mul(_tds_0, $$lib_scene_ex(0.8999999761581421)), "arial"), "", "center", "middle", $$lib_scene_max_centred(_w_0, _stage_x_0, _sun_x_0)), "tail": {$: "Con", "head": _title_0, "tail": {$: "Nil"}}}}});
  } else {
    const _bar_w_1 = Math.fround(_h_0 * 0.07500000298023224);
    const _bar_h_1 = Math.fround(_h_0 * 0.75);
    const _x_14 = Math.fround(_h_0 / 2);
    const _x_15 = Math.fround(_bar_w_1 / 2);
    const _bar_x_1 = Math.fround(_x_14 - _x_15);
    const _tds_1 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(21));
    const _x_16 = Math.fround(_bar_w_1 / 2);
    const _mid_x_1 = Math.fround(_bar_x_1 + _x_16);
    const _x_17 = Math.fround(_bar_w_1 / 3);
    const _sun_x_1 = Math.fround(_bar_x_1 + _x_17);
    const _max_px_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(19));
    const _x_18 = Math.fround(201 / 155);
    const _sun_y_1 = Math.fround(_bar_h_1 * _x_18);
    const _x_19 = Math.fround(201 / 162);
    const _x_20 = Math.fround(201 / 170);
    const _x_21 = $$lib_num_show(_pct_0);
    const _x_22 = Math.fround(1 / 4);
    const _x_23 = Math.fround(_bar_w_1 * _x_22);
    const _x_24 = Math.fround(_h_0 - _bar_h_1);
    return {$: "Con", "head": _fill_n_0, "tail": {$: "Con", "head": $$lib_scene_label(_mid_x_1, Math.fround(_bar_h_1 * _x_19), _display_0, $$lib_scene_boldx(_tds_1, "arial"), "", "center", "middle"), "tail": {$: "Con", "head": $$lib_scene_label(_mid_x_1, Math.fround(_bar_h_1 * _x_20), (_x_21 + "%"), $$lib_scene_boldx(_tds_1, "arial"), "", "center", "middle"), "tail": {$: "Con", "head": $$lib_scene_label_w(_sun_x_1, _sun_y_1, _sun_t_0, $$lib_scene_plainx($$lib_scene_ex_mul(_tds_1, $$lib_scene_ex(0.8999999761581421)), "arial"), "", "center", "middle", $$lib_scene_max_centred(_w_0, _stage_x_0, _sun_x_1)), "tail": {$: "Con", "head": _title_0, "tail": {$: "Con", "head": $$lib_scene_label(Math.fround(_bar_x_1 - _x_23), Math.fround(_x_24 / 2), "100%", $$lib_scene_boldx(_max_px_0, "arial"), "", "right", "middle"), "tail": {$: "Nil"}}}}}}};
  }
}

function $widgets_solar_view(_st_0, _e_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _watt_0 = _st_0["watt"];
  const _uni_0 = _st_0["uni"];
  const _pct_0 = _st_0["pct"];
  const _sun_0 = _st_0["sun"];
  const _rng_0 = _st_0["rng"];
  const _fill_0 = _st_0["fill"];
  const _x_0 = Math.fround(_w_0 / 1.2000000476837158);
  const _stage_x_0 = (-_x_0);
  const _bar_w_0 = Math.fround(_h_0 * 0.07500000298023224);
  const _bar_h_0 = Math.fround(_h_0 * 0.75);
  const _stroke_0 = Math.fround(_bar_w_0 / 40);
  const _x_1 = Math.fround(_h_0 / 2);
  const _x_2 = Math.fround(_bar_w_0 / 2);
  const _bar_x_0 = Math.fround(_x_1 - _x_2);
  const _x_3 = Math.fround(_h_0 * 0.800000011920929);
  const _x_4 = Math.fround(_h_0 / 2);
  const _x_5 = Math.fround(_x_3 / 2);
  const _bar_y_0 = Math.fround(_x_4 - _x_5);
  const _x_6 = $$lib_tween_value(_fill_0, _now_0);
  const _fill_h_0 = Math.fround(_x_6 * _bar_h_0);
  const _x_7 = Math.fround(_bar_h_0 - _fill_h_0);
  const _fill_y_0 = Math.fround(_x_7 + _bar_y_0);
  const _x_8 = Math.fround(_h_0 / 2);
  const _x_9 = Math.fround(_bar_w_0 / 2);
  const _fill_n_0 = $$lib_scene_shape({$: "Con", "head": {$: "GFill", "color": $$lib_scene_rgb("245, 193, 18")}, "tail": {$: "Con", "head": {$: "GStyle", "width": 0, "caps": ""}, "tail": {$: "Con", "head": {$: "GRect", "x": Math.fround(_x_8 - _x_9), "y": _fill_y_0, "w": _bar_w_0, "h": _fill_h_0}, "tail": {$: "Nil"}}}});
  const _title_px_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(17));
  const _x_10 = Math.fround(_bar_w_0 / 2);
  const _mid_x_0 = Math.fround(_bar_x_0 + _x_10);
  const _x_11 = Math.fround(_h_0 * 0.800000011920929);
  const _x_12 = Math.fround(1 / 17);
  const _title_y_0 = Math.fround(_x_11 * _x_12);
  const _x_13 = $$lib_num_show(_uni_0);
  const _x_14 = $$lib_env_label(_e_0, {$: "Solar"});
  const _display_0 = (_x_13 + _x_14);
  const _x_15 = $$lib_num_show(_sun_0);
  const _x_16 = $$lib_env_word(_e_0, {$: "WSolarSunHours"});
  const _x_17 = (": " + _x_15);
  const _sun_t_0 = (_x_16 + _x_17);
  const _title_0 = $$lib_scene_label_w(_mid_x_0, _title_y_0, $$lib_env_word(_e_0, {$: "WSolarTitle"}), $$lib_scene_boldx(_title_px_0, "arial"), "", "center", "middle", $$lib_scene_max_centred(_w_0, _stage_x_0, _mid_x_0));
  return {$: "Scene", "x": _stage_x_0, "y": 0, "nodes": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GFill", "color": "#F6F6F6"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _stroke_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GRect", "x": _bar_x_0, "y": _bar_y_0, "w": _bar_w_0, "h": _bar_h_0}, "tail": {$: "Nil"}}}}}), "tail": $$widgets_solar_rest(_watt_0, _e_0, _w_0, _h_0, _stage_x_0, _display_0, _pct_0, _sun_t_0, $$widgets_solar_rng_max(_rng_0), _fill_n_0, _title_0)}};
}

function $widgets_status_blank() {
  return "rgba(100, 100, 100, 0.9)";
}

function $widgets_status_init(_e_0, _now_0) {
  return {$: "St", "w": 300, "h": 150, "t0": _now_0, "shown": $$widgets_status_blank(), "pending": "", "since": _now_0, "ts": "", "td": ""};
}

function $widgets_status_tip(_e_0) {
  return $lib_env_word(_e_0, {$: "WStatusDescription"});
}

function $widgets_status_phase(_t0_0, _now_0) {
  const _x_0 = ((_now_0 - _t0_0) >>> 0);
  return $Bool_pick((_now_0 < _t0_0), 0, (2500 === 0 ? _x_0 : _x_0 % 2500));
}

function $widgets_status_percent(_t0_0, _now_0) {
  const _x_0 = $$widgets_status_phase(_t0_0, _now_0);
  const _x_1 = Math.fround(_x_0 >>>0);
  const _x_2 = $$lib_tween_quart_in_out(Math.fround(_x_1 / 2500));
  return Math.fround(100 * _x_2);
}

function $widgets_status_hidden_at(_t0_0, _now_0) {
  const _x_0 = $$widgets_status_percent(_t0_0, _now_0);
  return (_x_0 < 0.009999999776482582);
}

function $widgets_status_apply(_t0_0, _since_0) {
  const _x_0 = $$widgets_status_phase(_t0_0, _since_0);
  const _x_1 = ((2500 - _x_0) >>> 0);
  return $Bool_pick($$widgets_status_hidden_at(_t0_0, _since_0), _since_0, ((_since_0 + _x_1) >>> 0));
}

function $widgets_status_colour(_t0_0, _shown_0, _pending_0, _since_0, _now_0) {
  const _x_0 = $$widgets_status_apply(_t0_0, _since_0);
  return $Bool_pick((_now_0 >= _x_0), _pending_0, _shown_0);
}

function $widgets_status_all4(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return true;
  } else {
    const _x_0 = _xs_0["head"];
    const _rest_0 = _xs_0["tail"];
    return $Bool_and(_x_0, $$widgets_status_all4(_rest_0));
  }
}

function $widgets_status_any4(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return false;
  } else {
    const _x_0 = _xs_0["head"];
    const _rest_0 = _xs_0["tail"];
    const _x_1 = $$widgets_status_any4(_rest_0);
    return (_x_0 || _x_1);
  }
}

function $widgets_status_check(_failed_0, _no_change_0) {
  return $Bool_pick($$widgets_status_all4(_failed_0), {$: "SFull"}, $$Bool_pick($$Bool_and($$widgets_status_any4(_failed_0), _no_change_0), {$: "SPartialOld"}, $$Bool_pick($$widgets_status_any4(_failed_0), {$: "SPartialNew"}, $$Bool_pick(_no_change_0, {$: "SNoNew"}, {$: "SNormal"}))));
}

function $widgets_status_unscore(_s_0) {
  if (_s_0 === "") {
    return "";
  } else {
    const _c_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    return ($$Bool_pick($$Char_is_eq(_c_0, "_"), " ", _c_0) + $$widgets_status_unscore(_t_0));
  }
}

function $widgets_status_rev_tail(_r_0) {
  if (_r_0 === "") {
    return "";
  } else {
    const _c_0 = _r_0.slice(0, char_len(_r_0));
    const _t_0 = _r_0.slice(char_len(_r_0));
    return $Bool_pick($$Char_is_eq(_c_0, "-"), "", (_c_0 + $$widgets_status_rev_tail(_t_0)));
  }
}

function $widgets_status_rev_head(_r_0) {
  if (_r_0 === "") {
    return "";
  } else {
    const _c_0 = _r_0.slice(0, char_len(_r_0));
    const _t_0 = _r_0.slice(char_len(_r_0));
    return $Bool_pick($$Char_is_eq(_c_0, "-"), _t_0, $$widgets_status_rev_head(_t_0));
  }
}

function $widgets_status_station(_s_0) {
  return $String_reverse($$widgets_status_rev_head($$String_reverse(_s_0)));
}

function $widgets_status_time(_s_0) {
  return $String_reverse($$widgets_status_rev_tail($$String_reverse(_s_0)));
}

function $widgets_status_is_undef(_s_0) {
  return $String_eq(_s_0, "undefined");
}

function $widgets_status_throws(_e_0) {
  const _x_0 = $$widgets_status_is_undef($$lib_env_cr(_e_0, 32));
  const _x_1 = $$widgets_status_is_undef($$lib_env_cr(_e_0, 49));
  return (_x_0 || _x_1);
}

function $widgets_status_throws_late(_e_0, _s_0) {
  if (_s_0.$ === "SPartialOld") {
    return false;
  } else if (_s_0.$ === "SNoNew") {
    return false;
  } else {
    return $widgets_status_is_undef($$lib_env_cr(_e_0, 74));
  }
}

function $widgets_status_line(_e_0, _w_0) {
  const _st_0 = $$lib_env_cr(_e_0, 32);
  const _x_0 = $$lib_env_cr(_e_0, 74);
  const _x_1 = $$widgets_status_time(_st_0);
  const _x_2 = (" | " + _x_0);
  const _x_3 = (_x_1 + _x_2);
  const _x_4 = $$lib_env_word(_e_0, _w_0);
  const _x_5 = (": " + _x_3);
  const _x_6 = (_x_4 + _x_5);
  const _x_7 = $$widgets_status_unscore($$widgets_status_station(_st_0));
  const _x_8 = (" | " + _x_6);
  return (_x_7 + _x_8);
}

function $widgets_status_status_text(_e_0, _s_0, _td_0) {
  if (_s_0.$ === "SFull") {
    return $widgets_status_line(_e_0, {$: "WStatusNoDataSince"});
  } else if (_s_0.$ === "SPartialNew") {
    return $widgets_status_line(_e_0, {$: "WStatusDataAt"});
  } else if (_s_0.$ === "SNormal") {
    return $widgets_status_line(_e_0, {$: "WStatusDataAt"});
  } else {
    return _td_0;
  }
}

function $widgets_status_blink(_s_0) {
  if (_s_0.$ === "SFull") {
    return "rgba(209, 32, 32, 0.9)";
  } else if (_s_0.$ === "SPartialOld") {
    return "rgba(234, 242, 45, 0.9)";
  } else if (_s_0.$ === "SPartialNew") {
    return "rgba(234, 242, 45, 0.9)";
  } else if (_s_0.$ === "SNoNew") {
    return $widgets_status_blank();
  } else {
    return "rgba(23, 145, 27, 0.9)";
  }
}

function $widgets_status_apply_data(_st_0, _e_0, _s_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _t0_0 = _st_0["t0"];
  const _shown_0 = _st_0["shown"];
  const _pending_0 = _st_0["pending"];
  const _since_0 = _st_0["since"];
  const _td_0 = _st_0["td"];
  return {$: "St", "w": _w_0, "h": _h_0, "t0": _t0_0, "shown": $$widgets_status_colour(_t0_0, _shown_0, _pending_0, _since_0, _now_0), "pending": $$widgets_status_blink(_s_0), "since": _now_0, "ts": $$widgets_status_unscore($$lib_env_cr(_e_0, 49)), "td": $$widgets_status_status_text(_e_0, _s_0, _td_0)};
}

function $widgets_status_data(_st_0, _e_0, _failed_0, _no_change_0, _now_0) {
  const _s_0 = $$widgets_status_check(_failed_0, _no_change_0);
  const _x_0 = $$widgets_status_throws(_e_0);
  const _x_1 = $$widgets_status_throws_late(_e_0, _s_0);
  return $Bool_pick((_x_0 || _x_1), _st_0, $$widgets_status_apply_data(_st_0, _e_0, _s_0, _now_0));
}

function $widgets_status_resize(_st_0, _b_0) {
  const _t0_0 = _st_0["t0"];
  const _shown_0 = _st_0["shown"];
  const _pending_0 = _st_0["pending"];
  const _since_0 = _st_0["since"];
  const _ts_0 = _st_0["ts"];
  const _td_0 = _st_0["td"];
  const _ph_0 = _b_0["ph"];
  return {$: "St", "w": $$lib_num_cdim(_ph_0, 619, 100), "h": $$lib_num_cdim(_ph_0, 40, 100), "t0": _t0_0, "shown": _shown_0, "pending": _pending_0, "since": _since_0, "ts": _ts_0, "td": _td_0};
}

function $widgets_status_width(_st_0) {
  const _w_0 = _st_0["w"];
  return _w_0;
}

function $widgets_status_height(_st_0) {
  const _h_0 = _st_0["h"];
  return _h_0;
}

function $widgets_status_circle(_hid_0, _col_0, _x_0, _y_0, _rad_0, _stroke_0, _p_0) {
  if (_hid_0) {
    return $lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": _col_0}, "tail": {$: "Con", "head": {$: "GStyle", "width": 0, "caps": ""}, "tail": {$: "Con", "head": {$: "GCircle", "x": _x_0, "y": _y_0, "r": 0}, "tail": {$: "Nil"}}}});
  } else {
    const _x_1 = Math.fround(_p_0 / 100);
    const _x_2 = (_x_1 === 1 || _x_1 === -1 && Math.abs(2) === Infinity ? 1 : Math.fround(Math.pow(_x_1, 2)));
    const _x_3 = Math.fround(_p_0 / 100);
    return $lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": _col_0}, "tail": {$: "Con", "head": {$: "GStyle", "width": Math.fround(_stroke_0 * _x_2), "caps": ""}, "tail": {$: "Con", "head": {$: "GCircle", "x": _x_0, "y": _y_0, "r": Math.fround(_rad_0 * _x_3)}, "tail": {$: "Nil"}}}});
  }
}

function $widgets_status_view(_st_0, _e_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _t0_0 = _st_0["t0"];
  const _shown_0 = _st_0["shown"];
  const _pending_0 = _st_0["pending"];
  const _since_0 = _st_0["since"];
  const _ts_0 = _st_0["ts"];
  const _td_0 = _st_0["td"];
  const _rad_0 = Math.fround(_h_0 * 0.20000000298023224);
  const _stroke_0 = Math.fround(_h_0 * 0.20000000298023224);
  const _px_0 = $$lib_scene_ex_mul($$lib_scene_ex(_h_0), $$lib_scene_ex(0.4000000059604645));
  const _x_0 = Math.fround(_h_0 - _rad_0);
  const _edge_0 = Math.fround(_x_0 / 4);
  const _cx_0 = Math.fround(_rad_0 + _edge_0);
  const _cy_0 = Math.fround(_h_0 / 2);
  const _x_1 = Math.fround(_rad_0 + _edge_0);
  const _tx_0 = $$lib_num_sharpen(Math.fround(_x_1 * 2));
  const _x_2 = Math.fround(47 / 100);
  const _yd_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_2));
  const _x_3 = Math.fround(53 / 100);
  const _ys_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_3));
  const _p_0 = $$widgets_status_percent(_t0_0, _now_0);
  return {$: "Scene", "x": 0, "y": 0, "nodes": {$: "Con", "head": $$widgets_status_circle((_p_0 < 0.009999999776482582), $$widgets_status_colour(_t0_0, _shown_0, _pending_0, _since_0, _now_0), _cx_0, _cy_0, _rad_0, _stroke_0, _p_0), "tail": {$: "Con", "head": $$lib_scene_label_w(_tx_0, _ys_0, _ts_0, $$lib_scene_plainx(_px_0, "arial"), "black", "left", "top", $$lib_scene_max_left(_w_0, 0, _tx_0)), "tail": {$: "Con", "head": $$lib_scene_label_w(_tx_0, _yd_0, _td_0, $$lib_scene_plainx(_px_0, "arial"), "black", "left", "bottom", $$lib_scene_max_left(_w_0, 0, _tx_0)), "tail": {$: "Nil"}}}}};
}

function $widgets_status_aborts(_e_0, _failed_0, _no_change_0) {
  const _x_0 = $$widgets_status_throws(_e_0);
  const _x_1 = $$widgets_status_throws_late(_e_0, $$widgets_status_check(_failed_0, _no_change_0));
  return (_x_0 || _x_1);
}

function $widgets_raintitle_init(_e_0) {
  return {$: "St", "w": 300, "h": 150};
}

function $widgets_raintitle_tip(_e_0) {
  return "";
}

function $widgets_raintitle_data(_st_0, _e_0, _force_0, _now_0) {
  return _st_0;
}

function $widgets_raintitle_resize(_st_0, _b_0) {
  const _ph_0 = _b_0["ph"];
  return {$: "St", "w": $$lib_num_cdim(_ph_0, 99, 100), "h": $$lib_num_cdim(_ph_0, 12, 100)};
}

function $widgets_raintitle_width(_st_0) {
  const _w_0 = _st_0["w"];
  return _w_0;
}

function $widgets_raintitle_height(_st_0) {
  const _h_0 = _st_0["h"];
  return _h_0;
}

function $widgets_raintitle_view(_st_0, _e_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _size_0 = $$lib_scene_ex_mul($$lib_scene_ex(_w_0), $$lib_scene_ex(0.10000000149011612));
  const _x_0 = Math.fround(1 / 2);
  const _x_1 = $$lib_num_sharpen(Math.fround(_w_0 * _x_0));
  const _x_2 = Math.fround(1 / 2);
  const _y_0 = $$lib_num_sharpen(Math.fround(_h_0 * _x_2));
  return {$: "Scene", "x": 0, "y": 0, "nodes": {$: "Con", "head": $$lib_scene_label_w(_x_1, _y_0, $$lib_env_word(_e_0, {$: "WRainfallTitle"}), $$lib_scene_boldx(_size_0, "arial"), "black", "center", "middle", $$lib_scene_max_centred(_w_0, 0, _x_1)), "tail": {$: "Nil"}}};
}

function $widgets_rainbar_init(_b_0) {
  return {$: "St", "bar": _b_0, "w": 300, "h": 150, "sx": 0, "old": "0", "fresh": true, "v": 0, "max": 5, "pos": (-1), "fill": $$lib_tween_still(0)};
}

function $widgets_rainbar_canvas_id(_b_0) {
  if (_b_0.$ === "RDay") {
    return "RainBar1";
  } else if (_b_0.$ === "RMonth") {
    return "RainBar2";
  } else {
    return "RainBar3";
  }
}

function $widgets_rainbar_key(_b_0) {
  if (_b_0.$ === "RDay") {
    return "rainfallDay";
  } else if (_b_0.$ === "RMonth") {
    return "rainfallMonth";
  } else {
    return "rainfallYear";
  }
}

function $widgets_rainbar_title(_b_0) {
  if (_b_0.$ === "RDay") {
    return {$: "WRainfallDailyTitle"};
  } else if (_b_0.$ === "RMonth") {
    return {$: "WRainfallMonthlyTitle"};
  } else {
    return {$: "WRainfallAnnualTitle"};
  }
}

function $widgets_rainbar_field(_b_0) {
  if (_b_0.$ === "RDay") {
    return 7;
  } else if (_b_0.$ === "RMonth") {
    return 8;
  } else {
    return 9;
  }
}

function $widgets_rainbar_tip(_e_0) {
  return "";
}

function $widgets_rainbar_seq(_pos_0) {
  return $Bool_pick((_pos_0 === 0), 2, $$Bool_pick((_pos_0 === 1), 2, $$Bool_pick((_pos_0 === 2), 2.5, $$lib_num_nan())));
}

function $widgets_rainbar_grow_go($0, $1, $2, $3, $4) {
  for (;;) {
    {
      const _fuel_0 = $0;
      const _up_0 = $1;
      const _v_0 = $2;
      const _max_0 = $3;
      const _pos_0 = $4;
      if (_fuel_0 == 0) {
        return {$: "Rng", "max": _max_0, "pos": _pos_0};
      } else {
        const _f_0 = (_fuel_0 - 1);
        if (!_up_0) {
          return {$: "Rng", "max": _max_0, "pos": _pos_0};
        } else {
          const _x_0 = Math.fround(_pos_0 + 1);
          const _p_0 = Math.fround(_x_0 % 3);
          const _x_1 = $$widgets_rainbar_seq(_p_0);
          const _m_0 = Math.fround(_max_0 * _x_1);
          const _x_2 = Math.fround(_m_0 * 0.75);
          $0 = _f_0;
          $1 = (_v_0 > _x_2);
          $2 = _v_0;
          $3 = _m_0;
          $4 = _p_0;
          continue;
        }
      }
    }
  }
}

function $widgets_rainbar_grow(_v_0, _max_0, _pos_0) {
  const _x_0 = Math.fround(_max_0 * 0.75);
  return $widgets_rainbar_grow_go(100, (_v_0 > _x_0), _v_0, _max_0, _pos_0);
}

function $widgets_rainbar_shrink_test(_v_0, _max_0, _pos_0) {
  const _x_0 = $$widgets_rainbar_seq(_pos_0);
  const _x_1 = Math.fround(_max_0 / _x_0);
  const _x_2 = Math.fround(_x_1 * 0.75);
  return $Bool_and((_v_0 <= _x_2), (_max_0 > 5));
}

function $widgets_rainbar_shrink_go($0, $1, $2, $3, $4) {
  for (;;) {
    {
      const _fuel_0 = $0;
      const _down_0 = $1;
      const _v_0 = $2;
      const _max_0 = $3;
      const _pos_0 = $4;
      if (_fuel_0 == 0) {
        return {$: "Rng", "max": _max_0, "pos": _pos_0};
      } else {
        const _f_0 = (_fuel_0 - 1);
        if (!_down_0) {
          return {$: "Rng", "max": _max_0, "pos": _pos_0};
        } else {
          const _x_0 = $$widgets_rainbar_seq(_pos_0);
          const _m_0 = Math.fround(_max_0 / _x_0);
          const _x_1 = Math.fround(_pos_0 - 1);
          const _x_2 = Math.fround(_x_1 % 3);
          const _x_3 = Math.fround(_x_2 + 3);
          const _p_0 = Math.fround(_x_3 % 3);
          $0 = _f_0;
          $1 = $$widgets_rainbar_shrink_test(_v_0, _m_0, _p_0);
          $2 = _v_0;
          $3 = _m_0;
          $4 = _p_0;
          continue;
        }
      }
    }
  }
}

function $widgets_rainbar_shrink(_r_0, _v_0) {
  const _max_0 = _r_0["max"];
  const _pos_0 = _r_0["pos"];
  return $widgets_rainbar_shrink_go(100, $$widgets_rainbar_shrink_test(_v_0, _max_0, _pos_0), _v_0, _max_0, _pos_0);
}

function $widgets_rainbar_rng_max(_r_0) {
  const _max_0 = _r_0["max"];
  return _max_0;
}

function $widgets_rainbar_rng_pos(_r_0) {
  const _pos_0 = _r_0["pos"];
  return _pos_0;
}

function $widgets_rainbar_data(_st_0, _e_0, _force_0, _now_0) {
  const _bar_0 = _st_0["bar"];
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _sx_0 = _st_0["sx"];
  const _old_0 = _st_0["old"];
  const _fresh_0 = _st_0["fresh"];
  const _v_0 = _st_0["v"];
  const _max_0 = _st_0["max"];
  const _pos_0 = _st_0["pos"];
  const _fill_0 = _st_0["fill"];
  const _raw_0 = $$lib_env_cr(_e_0, $$widgets_rainbar_field(_bar_0));
  const _nv_0 = $$lib_units_value($$lib_env_units(_e_0), {$: "Rainfall"}, $$lib_num_parse(_raw_0));
  const _r_0 = $$widgets_rainbar_shrink($$widgets_rainbar_grow(_nv_0, _max_0, _pos_0), _nv_0);
  const _out_0 = $$lib_num_map(_nv_0, 0, $$widgets_rainbar_rng_max(_r_0), 0, 1);
  const _x_0 = $$lib_env_changed(_fresh_0, _raw_0, _old_0);
  return $Bool_pick((_force_0 || _x_0), {$: "St", "bar": _bar_0, "w": _w_0, "h": _h_0, "sx": _sx_0, "old": _raw_0, "fresh": false, "v": _nv_0, "max": $$widgets_rainbar_rng_max(_r_0), "pos": $$widgets_rainbar_rng_pos(_r_0), "fill": $$lib_tween_to(_fill_0, _out_0, 2000, _now_0)}, {$: "St", "bar": _bar_0, "w": _w_0, "h": _h_0, "sx": _sx_0, "old": _old_0, "fresh": _fresh_0, "v": _v_0, "max": _max_0, "pos": _pos_0, "fill": _fill_0});
}

function $widgets_rainbar_resize(_st_0, _b_0) {
  const _bar_0 = _st_0["bar"];
  const _old_0 = _st_0["old"];
  const _fresh_0 = _st_0["fresh"];
  const _v_0 = _st_0["v"];
  const _max_0 = _st_0["max"];
  const _pos_0 = _st_0["pos"];
  const _fill_0 = _st_0["fill"];
  const _pw_0 = _b_0["pw"];
  const _w_0 = $$lib_num_cdim(_pw_0, 100, 301);
  const _x_0 = Math.fround(_w_0 / 2);
  return {$: "St", "bar": _bar_0, "w": _w_0, "h": $$lib_num_cdim(_pw_0, 2.5, 3), "sx": (-_x_0), "old": _old_0, "fresh": _fresh_0, "v": _v_0, "max": _max_0, "pos": _pos_0, "fill": _fill_0};
}

function $widgets_rainbar_width(_st_0) {
  const _w_0 = _st_0["w"];
  return _w_0;
}

function $widgets_rainbar_height(_st_0) {
  const _h_0 = _st_0["h"];
  return _h_0;
}

function $widgets_rainbar_dash(_i_0, _x_0, _len_0, _stroke_0, _gap_0, _y0_0) {
  const _x_1 = $$lib_num_of_nat(_i_0);
  const _x_2 = Math.fround(_gap_0 * _x_1);
  const _y_0 = $$lib_num_sharpen(Math.fround(_x_2 + _y0_0));
  const _end_0 = Math.fround(_x_0 + _len_0);
  const _x_3 = Math.fround(_x_0 + _len_0);
  const _x_4 = Math.fround(_len_0 / 2);
  const _x_med_0 = Math.fround(_x_3 - _x_4);
  const _x_5 = Math.fround(_x_0 + _len_0);
  const _x_6 = Math.fround(_len_0 / 3);
  const _x_small_0 = Math.fround(_x_5 - _x_6);
  const _big_0 = $$Nat_is_eq($$Nat_mod(_i_0, 10), 0);
  const _med_0 = $$Nat_is_eq($$Nat_mod(_i_0, 5), 0);
  const _start_0 = $$Bool_pick(_big_0, _x_0, $$Bool_pick(_med_0, _x_med_0, _x_small_0));
  return $lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _stroke_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GMove", "x": _start_0, "y": _y_0}, "tail": {$: "Con", "head": {$: "GLine", "x": _end_0, "y": _y_0}, "tail": {$: "Nil"}}}}});
}

function $widgets_rainbar_dash_unset() {
  return $lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GStyle", "width": 0, "caps": ""}, "tail": {$: "Con", "head": {$: "GMove", "x": 0, "y": 0}, "tail": {$: "Con", "head": {$: "GLine", "x": 0, "y": 0}, "tail": {$: "Nil"}}}}});
}

function $widgets_rainbar_dashes(_n_0, _i_0, _x_0, _len_0, _stroke_0, _gap_0, _y0_0) {
  if (_n_0 == 0) {
    return {$: "Nil"};
  } else {
    const _k_0 = (_n_0 - 1);
    const _d_0 = $$Bool_pick((_i_0 < 51), $$widgets_rainbar_dash(_i_0, _x_0, _len_0, _stroke_0, _gap_0, _y0_0), $$widgets_rainbar_dash_unset());
    return {$: "Con", "head": _d_0, "tail": $$widgets_rainbar_dashes(_k_0, nat_chk(_i_0 + 1), _x_0, _len_0, _stroke_0, _gap_0, _y0_0)};
  }
}

function $widgets_rainbar_labels(_n_0, _j_0, _x_0, _px_0, _gap_0, _y0_0, _max_0) {
  if (_n_0 == 0) {
    return {$: "Nil"};
  } else {
    const _k_0 = (_n_0 - 1);
    const _x_1 = $$lib_num_of_nat(nat_chk(_j_0 * 10));
    const _x_2 = Math.fround(_gap_0 * _x_1);
    const _y_0 = $$lib_num_sharpen(Math.fround(_x_2 + _y0_0));
    const _x_3 = Math.fround(_max_0 - 0);
    const _x_4 = Math.fround(6 - 1);
    const _x_5 = Math.fround(_x_3 / _x_4);
    const _x_6 = $$lib_num_of_nat(_j_0);
    const _x_7 = Math.fround(_x_5 * _x_6);
    const _t_0 = $$lib_num_show(Math.fround(_max_0 - _x_7));
    return {$: "Con", "head": $$lib_scene_label(_x_0, _y_0, _t_0, $$lib_scene_plainx(_px_0, "arial"), "", "right", "middle"), "tail": $$widgets_rainbar_labels(_k_0, nat_chk(_j_0 + 1), _x_0, _px_0, _gap_0, _y0_0, _max_0)};
  }
}

function $widgets_rainbar_view(_st_0, _e_0, _now_0) {
  const _bar_0 = _st_0["bar"];
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _sx_0 = _st_0["sx"];
  const _v_0 = _st_0["v"];
  const _max_0 = _st_0["max"];
  const _fill_0 = _st_0["fill"];
  const _dash_len_0 = Math.fround(_h_0 * 0.07500000298023224);
  const _dash_gap_0 = Math.fround(_h_0 * 0.02500000037252903);
  const _bar_w_0 = Math.fround(_h_0 * 0.07500000298023224);
  const _bar_h_0 = Math.fround(_h_0 * 0.800000011920929);
  const _stroke_0 = Math.fround(_bar_w_0 / 40);
  const _text_px_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(17));
  const _display_px_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(19));
  const _title_px_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(17));
  const _x_0 = Math.fround(_h_0 / 2);
  const _x_1 = Math.fround(_bar_w_0 / 2);
  const _bar_x_0 = Math.fround(_x_0 - _x_1);
  const _x_2 = Math.fround(_h_0 / 2);
  const _x_3 = Math.fround(_bar_h_0 / 2);
  const _bar_y_0 = Math.fround(_x_2 - _x_3);
  const _x_4 = Math.fround(_h_0 / 2);
  const _x_5 = Math.fround(_bar_w_0 / 2);
  const _x_6 = Math.fround(_x_4 - _x_5);
  const _x_7 = Math.fround(_x_6 - _dash_len_0);
  const _dash_x_0 = Math.fround(_x_7 - _dash_gap_0);
  const _x_8 = Math.fround(_h_0 - _bar_h_0);
  const _dash_y_0 = Math.fround(_x_8 / 2);
  const _x_9 = Math.fround(201 / 170);
  const _text_y_0 = Math.fround(_bar_h_0 * _x_9);
  const _x_10 = Math.fround(9 / 10);
  const _title_x_0 = Math.fround(_bar_x_0 * _x_10);
  const _x_11 = Math.fround(1 / 17);
  const _title_y_0 = Math.fround(_bar_h_0 * _x_11);
  const _x_12 = Math.fround(6 * 9);
  const _x_13 = Math.fround(_bar_h_0 - _dash_y_0);
  const _x_14 = Math.fround(_x_12 - 10);
  const _gap_0 = Math.fround(_x_13 / _x_14);
  const _x_15 = $$lib_tween_value(_fill_0, _now_0);
  const _fill_h_0 = Math.fround(_x_15 * _bar_h_0);
  const _x_16 = Math.fround(_bar_h_0 - _fill_h_0);
  const _fill_y_0 = Math.fround(_x_16 + _bar_y_0);
  const _x_17 = Math.fround(_dash_x_0 - _dash_len_0);
  const _x_18 = Math.fround(6 / 5);
  const _label_x_0 = Math.fround(_x_17 * _x_18);
  const _top_0 = $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GFill", "color": "#F6F6F6"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _stroke_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GRect", "x": _bar_x_0, "y": _bar_y_0, "w": _bar_w_0, "h": _bar_h_0}, "tail": {$: "Nil"}}}}});
  const _fill_shape_0 = $$lib_scene_shape({$: "Con", "head": {$: "GFill", "color": $$lib_scene_rgba("0, 71, 183", "0.6")}, "tail": {$: "Con", "head": {$: "GStyle", "width": 0, "caps": ""}, "tail": {$: "Con", "head": {$: "GRect", "x": _bar_x_0, "y": _fill_y_0, "w": _bar_w_0, "h": _fill_h_0}, "tail": {$: "Nil"}}}});
  const _x_19 = $$lib_num_show(_v_0);
  const _x_20 = $$lib_env_label(_e_0, {$: "Rainfall"});
  const _display_0 = $$lib_scene_label(_bar_x_0, _text_y_0, (_x_19 + _x_20), $$lib_scene_boldx(_display_px_0, "arial"), "", "center", "middle");
  const _title_n_0 = $$lib_scene_label_w(_title_x_0, _title_y_0, $$lib_env_word(_e_0, $$widgets_rainbar_title(_bar_0)), $$lib_scene_boldx(_title_px_0, "arial"), "", "center", "middle", $$lib_scene_max_centred(_w_0, _sx_0, _title_x_0));
  const _tail_0 = $$List_append({$: "Con", "head": _fill_shape_0, "tail": $$widgets_rainbar_labels(6, 0, _label_x_0, _text_px_0, _gap_0, _dash_y_0, _max_0)}, {$: "Con", "head": _display_0, "tail": {$: "Con", "head": _title_n_0, "tail": {$: "Nil"}}});
  return {$: "Scene", "x": _sx_0, "y": 0, "nodes": {$: "Con", "head": _top_0, "tail": $$List_append($$widgets_rainbar_dashes(60, 0, _dash_x_0, _dash_len_0, _stroke_0, _gap_0, _dash_y_0), _tail_0)}};
}

function $widgets_uv_init(_e_0) {
  return {$: "St", "w": 300, "h": 150, "uni": 0, "fill": $$lib_tween_still(0)};
}

function $widgets_uv_tip(_e_0) {
  return $lib_env_word(_e_0, {$: "WUvDescription"});
}

function $widgets_uv_data(_st_0, _e_0, _force_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _fill_0 = _st_0["fill"];
  const _x_0 = $$lib_units_value($$lib_env_units(_e_0), {$: "UV"}, $$lib_num_parse($$lib_env_cr(_e_0, 79)));
  return {$: "St", "w": _w_0, "h": _h_0, "uni": _x_0, "fill": $$lib_tween_to(_fill_0, $$lib_num_map(_x_0, 0, 16, 0, 1), 2000, _now_0)};
}

function $widgets_uv_resize(_st_0, _b_0) {
  const _uni_0 = _st_0["uni"];
  const _fill_0 = _st_0["fill"];
  const _ph_0 = _b_0["ph"];
  return {$: "St", "w": $$lib_num_cdim(_ph_0, 1, 3), "h": $$lib_num_cdim(_ph_0, 1, 1), "uni": _uni_0, "fill": _fill_0};
}

function $widgets_uv_width(_st_0) {
  const _w_0 = _st_0["w"];
  return _w_0;
}

function $widgets_uv_height(_st_0) {
  const _h_0 = _st_0["h"];
  return _h_0;
}

function $widgets_uv_view(_st_0, _e_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _uni_0 = _st_0["uni"];
  const _fill_0 = _st_0["fill"];
  const _x_0 = Math.fround(_w_0 / 1.2000000476837158);
  const _stage_x_0 = (-_x_0);
  const _bar_w_0 = Math.fround(_h_0 * 0.07500000298023224);
  const _bar_h_0 = Math.fround(_h_0 * 0.75);
  const _stroke_0 = Math.fround(_bar_w_0 / 40);
  const _display_px_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(19));
  const _title_px_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(17));
  const _max_px_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(19));
  const _x_1 = Math.fround(_h_0 / 2);
  const _x_2 = Math.fround(_bar_w_0 / 2);
  const _bar_x_0 = Math.fround(_x_1 - _x_2);
  const _x_3 = Math.fround(_h_0 * 0.800000011920929);
  const _x_4 = Math.fround(_h_0 / 2);
  const _x_5 = Math.fround(_x_3 / 2);
  const _bar_y_0 = Math.fround(_x_4 - _x_5);
  const _x_6 = Math.fround(_bar_w_0 / 2);
  const _text_x_0 = Math.fround(_bar_x_0 + _x_6);
  const _x_7 = Math.fround(201 / 170);
  const _text_y_0 = Math.fround(_bar_h_0 * _x_7);
  const _x_8 = Math.fround(_bar_w_0 / 2);
  const _title_x_0 = Math.fround(_bar_x_0 + _x_8);
  const _x_9 = Math.fround(1 / 17);
  const _title_y_0 = Math.fround(_bar_h_0 * _x_9);
  const _x_10 = Math.fround(1 / 4);
  const _x_11 = Math.fround(_bar_w_0 * _x_10);
  const _max_x_0 = Math.fround(_bar_x_0 - _x_11);
  const _x_12 = Math.fround(_h_0 - _bar_h_0);
  const _max_y_0 = Math.fround(_x_12 / 2);
  const _x_13 = Math.fround(_h_0 / 2);
  const _x_14 = Math.fround(_bar_w_0 / 2);
  const _fill_x_0 = Math.fround(_x_13 - _x_14);
  const _x_15 = $$lib_tween_value(_fill_0, _now_0);
  const _fill_h_0 = Math.fround(_x_15 * _bar_h_0);
  const _x_16 = Math.fround(_bar_h_0 - _fill_h_0);
  const _fill_y_0 = Math.fround(_x_16 + _bar_y_0);
  const _x_17 = $$lib_num_show(_uni_0);
  const _x_18 = $$lib_env_label(_e_0, {$: "UV"});
  return {$: "Scene", "x": _stage_x_0, "y": 0, "nodes": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GFill", "color": "#F6F6F6"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _stroke_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GRect", "x": _bar_x_0, "y": _bar_y_0, "w": _bar_w_0, "h": _bar_h_0}, "tail": {$: "Nil"}}}}}), "tail": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GFill", "color": $$lib_scene_rgb("234, 242, 45")}, "tail": {$: "Con", "head": {$: "GStyle", "width": 0, "caps": ""}, "tail": {$: "Con", "head": {$: "GRect", "x": _fill_x_0, "y": _fill_y_0, "w": _bar_w_0, "h": _fill_h_0}, "tail": {$: "Nil"}}}}), "tail": {$: "Con", "head": $$lib_scene_label(_text_x_0, _text_y_0, (_x_17 + _x_18), $$lib_scene_boldx(_display_px_0, "arial"), "", "center", "middle"), "tail": {$: "Con", "head": $$lib_scene_label_w(_title_x_0, _title_y_0, $$lib_env_word(_e_0, {$: "WUvTitle"}), $$lib_scene_boldx(_title_px_0, "arial"), "", "center", "middle", $$lib_scene_max_centred(_w_0, _stage_x_0, _title_x_0)), "tail": {$: "Con", "head": $$lib_scene_label(_max_x_0, _max_y_0, "16", $$lib_scene_boldx(_max_px_0, "arial"), "", "right", "middle"), "tail": {$: "Nil"}}}}}}};
}

function $widgets_winddir_init(_e_0) {
  return {$: "St", "w": 300, "h": 150, "old_w": 0, "old_a": 0, "wold": 0, "aold": 0, "r": $$lib_tween_still(0), "ar": $$lib_tween_still(0), "wtext": "0°", "atext": "0°"};
}

function $widgets_winddir_tip(_e_0) {
  return $lib_env_word(_e_0, {$: "WWindDirectionDescription"});
}

function $widgets_winddir_pfloat(_s_0) {
  return $Bool_pick($$String_is_empty($$String_trim(_s_0)), $$lib_num_nan(), $$lib_num_parse(_s_0));
}

function $widgets_winddir_unwrap(_old_0, _x_0) {
  const _x_1 = Math.fround(_old_0 % 360);
  const _d_0 = Math.fround(_x_0 - _x_1);
  const _x_2 = Math.fround(Math.abs(_d_0));
  const _x_3 = Math.fround(_old_0 + _d_0);
  const _x_4 = Math.fround(_old_0 + _d_0);
  return $Bool_pick((_x_2 < 180), Math.fround(_old_0 + _d_0), $$Bool_pick((_old_0 > _x_0), Math.fround(_x_3 + 360), $$Bool_pick((_old_0 < _x_0), Math.fround(_x_4 - 360), _old_0)));
}

function $widgets_winddir_redraw(_st_0, _wv_0, _av_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _wold_0 = _st_0["wold"];
  const _aold_0 = _st_0["aold"];
  const _r_0 = _st_0["r"];
  const _ar_0 = _st_0["ar"];
  const _wout_0 = $$widgets_winddir_unwrap(_wold_0, _wv_0);
  const _aout_0 = $$widgets_winddir_unwrap(_aold_0, _av_0);
  const _x_0 = $$lib_num_show(_wv_0);
  const _x_1 = $$lib_num_show(_av_0);
  return {$: "St", "w": _w_0, "h": _h_0, "old_w": _wv_0, "old_a": _av_0, "wold": _wout_0, "aold": _aout_0, "r": $$lib_tween_to(_r_0, _wout_0, 2000, _now_0), "ar": $$lib_tween_to(_ar_0, _aout_0, 2000, _now_0), "wtext": (_x_0 + "°"), "atext": (_x_1 + "°")};
}

function $widgets_winddir_data(_st_0, _e_0, _force_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _old_w_0 = _st_0["old_w"];
  const _old_a_0 = _st_0["old_a"];
  const _wold_0 = _st_0["wold"];
  const _aold_0 = _st_0["aold"];
  const _r_0 = _st_0["r"];
  const _ar_0 = _st_0["ar"];
  const _wtext_0 = _st_0["wtext"];
  const _atext_0 = _st_0["atext"];
  const _wr_0 = $$lib_env_cr(_e_0, 3);
  const _ar_raw_0 = $$lib_env_cr(_e_0, 117);
  const _x_0 = $$lib_num_parse(_wr_0);
  const _x_1 = $$lib_num_parse(_ar_raw_0);
  const _x_2 = (_old_w_0 !== _x_0);
  const _x_3 = (_old_a_0 !== _x_1);
  const _x_4 = (_x_2 || _x_3);
  const _go_0 = (_x_4 || _force_0);
  const _same_0 = {$: "St", "w": _w_0, "h": _h_0, "old_w": _old_w_0, "old_a": _old_a_0, "wold": _wold_0, "aold": _aold_0, "r": _r_0, "ar": _ar_0, "wtext": _wtext_0, "atext": _atext_0};
  return $Bool_pick(_go_0, $$widgets_winddir_redraw(_same_0, $$widgets_winddir_pfloat(_wr_0), $$widgets_winddir_pfloat(_ar_raw_0), _now_0), _same_0);
}

function $widgets_winddir_resize(_st_0, _b_0) {
  const _old_w_0 = _st_0["old_w"];
  const _old_a_0 = _st_0["old_a"];
  const _wold_0 = _st_0["wold"];
  const _aold_0 = _st_0["aold"];
  const _r_0 = _st_0["r"];
  const _ar_0 = _st_0["ar"];
  const _wtext_0 = _st_0["wtext"];
  const _atext_0 = _st_0["atext"];
  const _ph_0 = _b_0["ph"];
  return {$: "St", "w": $$lib_num_cdim(_ph_0, 1, 1), "h": $$lib_num_cdim(_ph_0, 1, 1), "old_w": _old_w_0, "old_a": _old_a_0, "wold": _wold_0, "aold": _aold_0, "r": _r_0, "ar": _ar_0, "wtext": _wtext_0, "atext": _atext_0};
}

function $widgets_winddir_width(_st_0) {
  const _w_0 = _st_0["w"];
  return _w_0;
}

function $widgets_winddir_height(_st_0) {
  const _h_0 = _st_0["h"];
  return _h_0;
}

function $widgets_winddir_dashes(_n_0, _i_0, _w_0, _h_0, _rad_0, _end_rad_0, _stroke_0) {
  if (_n_0 == 0) {
    return {$: "Nil"};
  } else {
    const _k_0 = (_n_0 - 1);
    const _fi_0 = $$lib_num_of_nat(_i_0);
    const _x_0 = $$F32_pi();
    const _seg_0 = Math.fround(_x_0 / 8);
    const _x_1 = $$F32_pi();
    const _x_2 = Math.fround(_seg_0 * _fi_0);
    const _x_3 = Math.fround(_x_1 - _x_2);
    const _x_4 = $$F32_pi();
    const _angle_0 = Math.fround(_x_3 + _x_4);
    const _x_5 = Math.fround(_fi_0 % 2);
    const _even_0 = (_x_5 === 0);
    const _x_6 = Math.fround(Math.sin(_angle_0));
    const _x_7 = Math.fround(Math.sin(_angle_0));
    const _x_8 = Math.fround(_end_rad_0 + _rad_0);
    const _x_9 = Math.fround(_x_7 * _x_8);
    const _far_0 = $$Bool_pick(_even_0, Math.fround(_x_6 * _end_rad_0), Math.fround(_x_9 / 2));
    const _x_10 = Math.fround(Math.cos(_angle_0));
    const _x_11 = Math.fround(Math.cos(_angle_0));
    const _x_12 = Math.fround(_end_rad_0 + _rad_0);
    const _x_13 = Math.fround(_x_11 * _x_12);
    const _far_y_0 = $$Bool_pick(_even_0, Math.fround(_x_10 * _end_rad_0), Math.fround(_x_13 / 2));
    const _x_14 = Math.fround(_w_0 / 2);
    const _x_15 = Math.fround(_h_0 / 2);
    const _xf_0 = {$: "Xf", "x": 0, "y": 0, "rot": 0, "regx": (-_x_14), "regy": (-_x_15), "visible": true};
    const _x_16 = Math.fround(Math.sin(_angle_0));
    const _x_17 = Math.fround(Math.cos(_angle_0));
    return {$: "Con", "head": $$lib_scene_shape_at(_xf_0, {$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _stroke_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GMove", "x": Math.fround(_x_16 * _rad_0), "y": Math.fround(_x_17 * _rad_0)}, "tail": {$: "Con", "head": {$: "GLine", "x": _far_0, "y": _far_y_0}, "tail": {$: "Nil"}}}}}), "tail": $$widgets_winddir_dashes(_k_0, nat_chk(_i_0 + 1), _w_0, _h_0, _rad_0, _end_rad_0, _stroke_0)};
  }
}

function $widgets_winddir_compass(_i_0, _text_0, _w_0, _h_0, _rad_0, _px_0) {
  const _x_0 = $$F32_pi();
  const _seg_0 = Math.fround(_x_0 / 8);
  const _x_1 = Math.fround(_i_0 * 2);
  const _x_2 = $$F32_pi();
  const _x_3 = Math.fround(_seg_0 * _x_1);
  const _x_4 = Math.fround(_x_2 - _x_3);
  const _x_5 = $$F32_pi();
  const _angle_0 = Math.fround(_x_4 + _x_5);
  const _x_6 = Math.fround(Math.sin(_angle_0));
  const _x_7 = Math.fround(Math.cos(_angle_0));
  const _x_8 = Math.fround(_w_0 / 2);
  const _x_9 = Math.fround(_h_0 / 2);
  const _xf_0 = {$: "Xf", "x": Math.fround(_x_6 * _rad_0), "y": Math.fround(_x_7 * _rad_0), "rot": 0, "regx": (-_x_8), "regy": (-_x_9), "visible": true};
  return {$: "NLabel", "xf": _xf_0, "text": _text_0, "font": $$lib_scene_plainx(_px_0, "arial"), "color": "", "align": "center", "base": "middle", "maxw": 0};
}

function $widgets_winddir_pointer(_w_0, _h_0, _rot_0, _fill_0, _tx_0, _ty_0, _lx_0, _ly_0, _rx_0, _ry_0) {
  return $lib_scene_shape_at({$: "Xf", "x": Math.fround(_w_0 / 2), "y": Math.fround(_h_0 / 2), "rot": _rot_0, "regx": Math.fround(_w_0 / 2), "regy": Math.fround(_h_0 / 2), "visible": true}, {$: "Con", "head": {$: "GFill", "color": _fill_0}, "tail": {$: "Con", "head": {$: "GStyle", "width": 10, "caps": ""}, "tail": {$: "Con", "head": {$: "GMove", "x": _tx_0, "y": _ty_0}, "tail": {$: "Con", "head": {$: "GLine", "x": _lx_0, "y": _ly_0}, "tail": {$: "Con", "head": {$: "GLine", "x": _rx_0, "y": _ry_0}, "tail": {$: "Con", "head": {$: "GClosePath"}, "tail": {$: "Nil"}}}}}}});
}

function $widgets_winddir_front(_w_0, _h_0, _now_0, _r_0, _ar_0, _wtext_0, _atext_0) {
  const _rad_0 = Math.fround(_w_0 * 0.30000001192092896);
  const _inner_0 = Math.fround(_w_0 * 0.05000000074505806);
  const _stroke_0 = Math.fround(_w_0 / 80);
  const _cx_0 = Math.fround(_w_0 / 2);
  const _cy_0 = Math.fround(_h_0 / 2);
  const _wind_0 = $$lib_scene_rgb("23, 145, 27");
  const _x_0 = Math.fround(33 / 50);
  const _x_1 = Math.fround(90 / 200);
  const _x_2 = Math.fround(4 / 5);
  const _x_3 = Math.fround(110 / 200);
  const _x_4 = Math.fround(4 / 5);
  const _x_5 = Math.fround(1 / 5);
  const _x_6 = Math.fround(97 / 200);
  const _x_7 = Math.fround(3 / 5);
  const _x_8 = Math.fround(103 / 200);
  const _x_9 = Math.fround(3 / 5);
  const _x_10 = Math.fround(74 / 30);
  const _x_11 = Math.fround(65 / 30);
  return {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GFill", "color": "#F6F6F6"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _stroke_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GCircle", "x": _cx_0, "y": _cy_0, "r": _rad_0}, "tail": {$: "Nil"}}}}}), "tail": {$: "Con", "head": $$widgets_winddir_pointer(_w_0, _h_0, $$lib_tween_value(_ar_0, _now_0), _wind_0, Math.fround(_w_0 / 2), Math.fround(_rad_0 * _x_0), Math.fround(_w_0 * _x_1), Math.fround(_rad_0 * _x_2), Math.fround(_w_0 * _x_3), Math.fround(_rad_0 * _x_4)), "tail": {$: "Con", "head": $$widgets_winddir_pointer(_w_0, _h_0, $$lib_tween_value(_r_0, _now_0), "black", Math.fround(_w_0 / 2), Math.fround(_h_0 * _x_5), Math.fround(_w_0 * _x_6), Math.fround(_h_0 * _x_7), Math.fround(_w_0 * _x_8), Math.fround(_h_0 * _x_9)), "tail": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GFill", "color": "black"}, "tail": {$: "Con", "head": {$: "GStyle", "width": 0, "caps": ""}, "tail": {$: "Con", "head": {$: "GCircle", "x": _cx_0, "y": _cy_0, "r": _inner_0}, "tail": {$: "Nil"}}}}), "tail": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GFill", "color": _wind_0}, "tail": {$: "Con", "head": {$: "GStyle", "width": 0, "caps": ""}, "tail": {$: "Con", "head": {$: "GCircle", "x": _cx_0, "y": _cy_0, "r": Math.fround(_inner_0 / 4)}, "tail": {$: "Nil"}}}}), "tail": {$: "Con", "head": $$lib_scene_label(_cx_0, Math.fround(_rad_0 * _x_10), _wtext_0, $$lib_scene_boldx($$lib_scene_ex_div($$lib_scene_ex(_w_0), $$lib_scene_ex(10)), "arial"), "black", "center", "middle"), "tail": {$: "Con", "head": $$lib_scene_label(_cx_0, Math.fround(_rad_0 * _x_11), _atext_0, $$lib_scene_boldx($$lib_scene_ex_div($$lib_scene_ex(_w_0), $$lib_scene_ex(12)), "arial"), _wind_0, "center", "middle"), "tail": {$: "Nil"}}}}}}}};
}

function $widgets_winddir_view(_st_0, _e_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _r_0 = _st_0["r"];
  const _ar_0 = _st_0["ar"];
  const _wtext_0 = _st_0["wtext"];
  const _atext_0 = _st_0["atext"];
  const _rad_0 = Math.fround(_w_0 * 0.30000001192092896);
  const _x_0 = Math.fround(68 / 50);
  const _label_rad_0 = Math.fround(_rad_0 * _x_0);
  const _px_0 = $$lib_scene_ex_div($$lib_scene_ex(_w_0), $$lib_scene_ex(15));
  const _labels_0 = {$: "Con", "head": $$widgets_winddir_compass(0, $$lib_env_word(_e_0, {$: "WWindDirectionLabelS"}), _w_0, _h_0, _label_rad_0, _px_0), "tail": {$: "Con", "head": $$widgets_winddir_compass(1, $$lib_env_word(_e_0, {$: "WWindDirectionLabelSW"}), _w_0, _h_0, _label_rad_0, _px_0), "tail": {$: "Con", "head": $$widgets_winddir_compass(2, $$lib_env_word(_e_0, {$: "WWindDirectionLabelW"}), _w_0, _h_0, _label_rad_0, _px_0), "tail": {$: "Con", "head": $$widgets_winddir_compass(3, $$lib_env_word(_e_0, {$: "WWindDirectionLabelNW"}), _w_0, _h_0, _label_rad_0, _px_0), "tail": {$: "Con", "head": $$widgets_winddir_compass(4, $$lib_env_word(_e_0, {$: "WWindDirectionLabelN"}), _w_0, _h_0, _label_rad_0, _px_0), "tail": {$: "Con", "head": $$widgets_winddir_compass(5, $$lib_env_word(_e_0, {$: "WWindDirectionLabelNE"}), _w_0, _h_0, _label_rad_0, _px_0), "tail": {$: "Con", "head": $$widgets_winddir_compass(6, $$lib_env_word(_e_0, {$: "WWindDirectionLabelE"}), _w_0, _h_0, _label_rad_0, _px_0), "tail": {$: "Con", "head": $$widgets_winddir_compass(7, $$lib_env_word(_e_0, {$: "WWindDirectionLabelSE"}), _w_0, _h_0, _label_rad_0, _px_0), "tail": {$: "Nil"}}}}}}}}};
  const _x_1 = Math.fround(48 / 40);
  const _ds_0 = $$widgets_winddir_dashes(16, 0, _w_0, _h_0, _rad_0, Math.fround(_rad_0 * _x_1), Math.fround(_w_0 / 80));
  return {$: "Scene", "x": 0, "y": 0, "nodes": $$List_append($$widgets_winddir_front(_w_0, _h_0, _now_0, _r_0, _ar_0, _wtext_0, _atext_0), $$List_append(_labels_0, _ds_0))};
}

function $widgets_windspeed_init(_e_0) {
  return {$: "St", "w": 300, "h": 150, "fresh": true, "o_spd": "0", "o_gust": "0", "o_wh": "0", "o_gh": "0", "spd": 0, "gust": 0, "wh": 0, "gh": 0, "orig": 0, "max": 10, "t_l": $$lib_tween_still(0), "t_r": $$lib_tween_still(0), "t_wh": $$lib_tween_still(1.0399999618530273), "t_gh": $$lib_tween_still(1.0399999618530273)};
}

function $widgets_windspeed_tip(_e_0) {
  return $lib_env_word(_e_0, {$: "WWindSpeedDescription"});
}

function $widgets_windspeed_up_test(_s_0, _g_0, _wh_0, _gh_0, _max_0) {
  const _x_0 = (_s_0 > _max_0);
  const _x_1 = (_g_0 > _max_0);
  const _x_2 = (_x_0 || _x_1);
  const _x_3 = (_wh_0 > _max_0);
  const _x_4 = (_x_2 || _x_3);
  const _x_5 = (_gh_0 > _max_0);
  return (_x_4 || _x_5);
}

function $widgets_windspeed_up($0, $1, $2, $3, $4, $5, $6) {
  for (;;) {
    {
      const _fuel_0 = $0;
      const _go_0 = $1;
      const _s_0 = $2;
      const _g_0 = $3;
      const _wh_0 = $4;
      const _gh_0 = $5;
      const _max_0 = $6;
      if (_fuel_0 == 0) {
        return _max_0;
      } else {
        const _f_0 = (_fuel_0 - 1);
        if (_go_0) {
          const _x_0 = Math.fround(6 - 1);
          const _m_0 = Math.fround(_max_0 + _x_0);
          $0 = _f_0;
          $1 = $$widgets_windspeed_up_test(_s_0, _g_0, _wh_0, _gh_0, _m_0);
          $2 = _s_0;
          $3 = _g_0;
          $4 = _wh_0;
          $5 = _gh_0;
          $6 = _m_0;
          continue;
        } else {
          return _max_0;
        }
      }
    }
  }
}

function $widgets_windspeed_down_test(_s_0, _g_0, _wh_0, _gh_0, _max_0) {
  const _x_0 = Math.fround(6 - 1);
  const _lim_0 = Math.fround(_max_0 - _x_0);
  return $Bool_and($$Bool_and($$Bool_and($$Bool_and((_s_0 <= _lim_0), (_g_0 <= _lim_0)), (_wh_0 <= _lim_0)), (_gh_0 <= _lim_0)), (_max_0 > 10));
}

function $widgets_windspeed_down($0, $1, $2, $3, $4, $5, $6) {
  for (;;) {
    {
      const _fuel_0 = $0;
      const _go_0 = $1;
      const _s_0 = $2;
      const _g_0 = $3;
      const _wh_0 = $4;
      const _gh_0 = $5;
      const _max_0 = $6;
      if (_fuel_0 == 0) {
        return _max_0;
      } else {
        const _f_0 = (_fuel_0 - 1);
        if (_go_0) {
          const _x_0 = Math.fround(6 - 1);
          const _m_0 = Math.fround(_max_0 - _x_0);
          $0 = _f_0;
          $1 = $$widgets_windspeed_down_test(_s_0, _g_0, _wh_0, _gh_0, _m_0);
          $2 = _s_0;
          $3 = _g_0;
          $4 = _wh_0;
          $5 = _gh_0;
          $6 = _m_0;
          continue;
        } else {
          return _max_0;
        }
      }
    }
  }
}

function $widgets_windspeed_range(_s_0, _g_0, _wh_0, _gh_0, _max_0) {
  const _m_0 = $$widgets_windspeed_up((2000 ), $$widgets_windspeed_up_test(_s_0, _g_0, _wh_0, _gh_0, _max_0), _s_0, _g_0, _wh_0, _gh_0, _max_0);
  return $widgets_windspeed_down((2000 ), $$widgets_windspeed_down_test(_s_0, _g_0, _wh_0, _gh_0, _m_0), _s_0, _g_0, _wh_0, _gh_0, _m_0);
}

function $widgets_windspeed_apply(_w_0, _h_0, _e_0, _s_s_0, _g_s_0, _wh_s_0, _gh_s_0, _max_0, _t_l_0, _t_r_0, _t_wh_0, _t_gh_0, _now_0) {
  const _u_0 = $$lib_env_units(_e_0);
  const _s_0 = $$lib_units_value(_u_0, {$: "Wind"}, $$lib_num_parse(_s_s_0));
  const _g_0 = $$lib_units_value(_u_0, {$: "Wind"}, $$lib_num_parse(_g_s_0));
  const _wh_0 = $$lib_units_value(_u_0, {$: "Wind"}, $$lib_num_parse(_wh_s_0));
  const _gh_0 = $$lib_units_value(_u_0, {$: "Wind"}, $$lib_num_parse(_gh_s_0));
  const _m_0 = $$widgets_windspeed_range(_s_0, _g_0, _wh_0, _gh_0, _max_0);
  return {$: "St", "w": _w_0, "h": _h_0, "fresh": false, "o_spd": _s_s_0, "o_gust": _g_s_0, "o_wh": _wh_s_0, "o_gh": _gh_s_0, "spd": _s_0, "gust": _g_0, "wh": _wh_0, "gh": _gh_0, "orig": $$lib_num_parse(_s_s_0), "max": _m_0, "t_l": $$lib_tween_to(_t_l_0, $$lib_num_map(_s_0, 0, _m_0, 0, 1), 2000, _now_0), "t_r": $$lib_tween_to(_t_r_0, $$lib_num_map(_g_0, 0, _m_0, 0, 1), 2000, _now_0), "t_wh": $$lib_tween_to(_t_wh_0, $$lib_num_map(_wh_0, 0, _m_0, 1, 0), 2000, _now_0), "t_gh": $$lib_tween_to(_t_gh_0, $$lib_num_map(_gh_0, 0, _m_0, 1, 0), 2000, _now_0)};
}

function $widgets_windspeed_data(_st_0, _e_0, _force_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _fresh_0 = _st_0["fresh"];
  const _o_spd_0 = _st_0["o_spd"];
  const _o_gust_0 = _st_0["o_gust"];
  const _o_wh_0 = _st_0["o_wh"];
  const _o_gh_0 = _st_0["o_gh"];
  const _spd_0 = _st_0["spd"];
  const _gust_0 = _st_0["gust"];
  const _wh_0 = _st_0["wh"];
  const _gh_0 = _st_0["gh"];
  const _orig_0 = _st_0["orig"];
  const _max_0 = _st_0["max"];
  const _t_l_0 = _st_0["t_l"];
  const _t_r_0 = _st_0["t_r"];
  const _t_wh_0 = _st_0["t_wh"];
  const _t_gh_0 = _st_0["t_gh"];
  const _s_s_0 = $$lib_env_cr(_e_0, 1);
  const _g_s_0 = $$lib_env_cr(_e_0, 140);
  const _wh_s_0 = $$lib_env_cr(_e_0, 113);
  const _gh_s_0 = $$lib_env_cr(_e_0, 71);
  const _x_0 = (_force_0 || _fresh_0);
  const _x_1 = $$Bool_not($$String_eq(_s_s_0, _o_spd_0));
  const _x_2 = (_x_0 || _x_1);
  const _x_3 = $$Bool_not($$String_eq(_g_s_0, _o_gust_0));
  const _x_4 = (_x_2 || _x_3);
  const _x_5 = $$Bool_not($$String_eq(_wh_s_0, _o_wh_0));
  const _x_6 = (_x_4 || _x_5);
  const _x_7 = $$Bool_not($$String_eq(_gh_s_0, _o_gh_0));
  const _ch_0 = (_x_6 || _x_7);
  return $Bool_pick(_ch_0, $$widgets_windspeed_apply(_w_0, _h_0, _e_0, _s_s_0, _g_s_0, _wh_s_0, _gh_s_0, _max_0, _t_l_0, _t_r_0, _t_wh_0, _t_gh_0, _now_0), {$: "St", "w": _w_0, "h": _h_0, "fresh": _fresh_0, "o_spd": _o_spd_0, "o_gust": _o_gust_0, "o_wh": _o_wh_0, "o_gh": _o_gh_0, "spd": _spd_0, "gust": _gust_0, "wh": _wh_0, "gh": _gh_0, "orig": _orig_0, "max": _max_0, "t_l": _t_l_0, "t_r": _t_r_0, "t_wh": _t_wh_0, "t_gh": _t_gh_0});
}

function $widgets_windspeed_resize(_st_0, _b_0) {
  const _fresh_0 = _st_0["fresh"];
  const _o_spd_0 = _st_0["o_spd"];
  const _o_gust_0 = _st_0["o_gust"];
  const _o_wh_0 = _st_0["o_wh"];
  const _o_gh_0 = _st_0["o_gh"];
  const _spd_0 = _st_0["spd"];
  const _gust_0 = _st_0["gust"];
  const _wh_0 = _st_0["wh"];
  const _gh_0 = _st_0["gh"];
  const _orig_0 = _st_0["orig"];
  const _max_0 = _st_0["max"];
  const _t_l_0 = _st_0["t_l"];
  const _t_r_0 = _st_0["t_r"];
  const _t_wh_0 = _st_0["t_wh"];
  const _t_gh_0 = _st_0["t_gh"];
  const _ph_0 = _b_0["ph"];
  return {$: "St", "w": $$lib_num_cdim(_ph_0, 2, 3), "h": $$lib_num_cdim(_ph_0, 1, 1), "fresh": _fresh_0, "o_spd": _o_spd_0, "o_gust": _o_gust_0, "o_wh": _o_wh_0, "o_gh": _o_gh_0, "spd": _spd_0, "gust": _gust_0, "wh": _wh_0, "gh": _gh_0, "orig": _orig_0, "max": _max_0, "t_l": _t_l_0, "t_r": _t_r_0, "t_wh": _t_wh_0, "t_gh": _t_gh_0};
}

function $widgets_windspeed_width(_st_0) {
  const _w_0 = _st_0["w"];
  return _w_0;
}

function $widgets_windspeed_height(_st_0) {
  const _h_0 = _st_0["h"];
  return _h_0;
}

function $widgets_windspeed_beaufort(_v_0) {
  const _x_0 = Math.fround(_v_0 * 0.5144439935684204);
  const _x_1 = Math.fround(_x_0 / 0.8360000252723694);
  const _x_2 = Math.fround(2 / 3);
  const _r_0 = $$F32_round((_x_1 === 1 || _x_1 === -1 && Math.abs(_x_2) === Infinity ? 1 : Math.fround(Math.pow(_x_1, _x_2))));
  return $Bool_pick($$lib_num_is_nan(_r_0), $$lib_num_nan(), $$F32_min(_r_0, 12));
}

function $widgets_windspeed_colour(_b_0) {
  return $lib_num_pick_s((_b_0 === 0), "rgb(17.309876903474304,117.44764584217796,247.47278069833118)", $$lib_num_pick_s((_b_0 === 1), "rgb(1.5416330210948388,169.97127016007448,219.52594437294414)", $$lib_num_pick_s((_b_0 === 2), "rgb(7.754650499738659,215.19935934587008,175.66987441881878)", $$lib_num_pick_s((_b_0 === 3), "rgb(34.86896947355163,245.2702710819909,123.52772586285558)", $$lib_num_pick_s((_b_0 === 4), "rgb(78.17152155308537,254.95701575891434,72.16295747583894)", $$lib_num_pick_s((_b_0 === 5), "rgb(130.1353653615124,242.57582288704924,30.50390216002502)", $$lib_num_pick_s((_b_0 === 6), "rgb(181.7280354371606,210.27881765177892,5.791825201585567)", $$lib_num_pick_s((_b_0 === 7), "rgb(223.98158452324583,163.6799339525753,2.3222321916037174)", $$lib_num_pick_s((_b_0 === 8), "rgb(249.55141116649295,110.8790885145618,20.69821514044456)", $$lib_num_pick_s((_b_0 === 9), "rgb(253.99291390771165,61.05423619658508,57.725621746334994)", $$lib_num_pick_s((_b_0 === 10), "rgb(236.53406132721165,22.866038426121975,106.9682697180647)", $$lib_num_pick_s((_b_0 === 11), "rgb(200.20958818239785,2.9524486747604897,159.86669762153184)", $$lib_num_pick_s((_b_0 === 12), "rgb(151.33349138049604,4.774889317454154,207.22598860692983)", "rgb(NaN,NaN,NaN)")))))))))))));
}

function $widgets_windspeed_modf(_i_0, _n_0) {
  const _x_0 = Math.fround(_i_0 / _n_0);
  const _x_1 = Math.fround(Math.floor(_x_0));
  const _x_2 = Math.fround(_n_0 * _x_1);
  return Math.fround(_i_0 - _x_2);
}

function $widgets_windspeed_dash(_i_0, _pdx_0, _pdy_0, _dl_0, _sw_0, _gap_0) {
  const _live_0 = (_i_0 < 11);
  const _x_0 = $$widgets_windspeed_modf(_i_0, 2);
  const _large_0 = (_x_0 === 0);
  const _x_1 = Math.fround(_gap_0 * _i_0);
  const _dy_0 = $$lib_num_sharpen(Math.fround(_x_1 + _pdy_0));
  const _x_2 = Math.fround(_pdx_0 + _dl_0);
  const _x_3 = Math.fround(_dl_0 / 2);
  const _x0_0 = $$Bool_pick(_large_0, _pdx_0, Math.fround(_x_2 - _x_3));
  return $lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GStyle", "width": $$Bool_pick(_live_0, _sw_0, 0), "caps": ""}, "tail": {$: "Con", "head": {$: "GMove", "x": $$Bool_pick(_live_0, _x0_0, 0), "y": $$Bool_pick(_live_0, _dy_0, 0)}, "tail": {$: "Con", "head": {$: "GLine", "x": $$Bool_pick(_live_0, Math.fround(_pdx_0 + _dl_0), 0), "y": $$Bool_pick(_live_0, _dy_0, 0)}, "tail": {$: "Nil"}}}}});
}

function $widgets_windspeed_dashes($0, $1, $2, $3, $4, $5, $6) {
  for (;;) {
    {
      const _k_0 = $0;
      const _acc_0 = $1;
      const _pdx_0 = $2;
      const _pdy_0 = $3;
      const _dl_0 = $4;
      const _sw_0 = $5;
      const _gap_0 = $6;
      if (_k_0 == 0) {
        return _acc_0;
      } else {
        const _j_0 = (_k_0 - 1);
        $0 = _j_0;
        $1 = {$: "Con", "head": $$widgets_windspeed_dash($$lib_num_of_nat(_j_0), _pdx_0, _pdy_0, _dl_0, _sw_0, _gap_0), "tail": _acc_0};
        $2 = _pdx_0;
        $3 = _pdy_0;
        $4 = _dl_0;
        $5 = _sw_0;
        $6 = _gap_0;
        continue;
      }
    }
  }
}

function $widgets_windspeed_label(_i_0, _lx_0, _pdy_0, _gap_0, _text_px_0, _max_0) {
  const _x_0 = Math.fround(_i_0 * 2);
  const _x_1 = Math.fround(_gap_0 * _x_0);
  const _dy_0 = $$lib_num_sharpen(Math.fround(_x_1 + _pdy_0));
  const _x_2 = Math.fround(_max_0 - 0);
  const _x_3 = Math.fround(6 - 1);
  const _x_4 = Math.fround(_x_2 / _x_3);
  const _x_5 = Math.fround(_x_4 * _i_0);
  return $lib_scene_label(_lx_0, _dy_0, $$lib_num_show(Math.fround(_max_0 - _x_5)), $$lib_scene_plainx(_text_px_0, "arial"), "black", "right", "middle");
}

function $widgets_windspeed_labels($0, $1, $2, $3, $4, $5, $6) {
  for (;;) {
    {
      const _k_0 = $0;
      const _acc_0 = $1;
      const _lx_0 = $2;
      const _pdy_0 = $3;
      const _gap_0 = $4;
      const _text_px_0 = $5;
      const _max_0 = $6;
      if (_k_0 == 0) {
        return _acc_0;
      } else {
        const _j_0 = (_k_0 - 1);
        $0 = _j_0;
        $1 = {$: "Con", "head": $$widgets_windspeed_label($$lib_num_of_nat(_j_0), _lx_0, _pdy_0, _gap_0, _text_px_0, _max_0), "tail": _acc_0};
        $2 = _lx_0;
        $3 = _pdy_0;
        $4 = _gap_0;
        $5 = _text_px_0;
        $6 = _max_0;
        continue;
      }
    }
  }
}

function $widgets_windspeed_view(_st_0, _e_0, _now_0) {
  const _w_0 = _st_0["w"];
  const _h_0 = _st_0["h"];
  const _spd_0 = _st_0["spd"];
  const _gust_0 = _st_0["gust"];
  const _wh_0 = _st_0["wh"];
  const _gh_0 = _st_0["gh"];
  const _orig_0 = _st_0["orig"];
  const _max_0 = _st_0["max"];
  const _t_l_0 = _st_0["t_l"];
  const _t_r_0 = _st_0["t_r"];
  const _t_wh_0 = _st_0["t_wh"];
  const _t_gh_0 = _st_0["t_gh"];
  const _x_0 = Math.fround(33 / 10);
  const _x_1 = Math.fround(1.5 * _x_0);
  const _x_2 = Math.fround(_h_0 / _x_1);
  const _stage_x_0 = (-_x_2);
  const _dl_0 = Math.fround(_h_0 * 0.07500000298023224);
  const _dg_0 = Math.fround(_h_0 * 0.02500000037252903);
  const _bw_0 = Math.fround(_h_0 * 0.15000000596046448);
  const _bh_0 = Math.fround(_h_0 * 0.6399999856948853);
  const _sw_0 = Math.fround(_bw_0 / 40);
  const _text_px_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(17));
  const _tds_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(20));
  const _bf_px_0 = $$lib_scene_ex_div($$lib_scene_ex(_h_0), $$lib_scene_ex(18));
  const _x_3 = Math.fround(_h_0 / 2);
  const _x_4 = Math.fround(_bw_0 / 2);
  const _lx_0 = Math.fround(_x_3 - _x_4);
  const _x_5 = Math.fround(_h_0 / 2);
  const _x_6 = Math.fround(_bw_0 / 2);
  const _rx_0 = Math.fround(_x_5 + _x_6);
  const _x_7 = Math.fround(_h_0 / 2);
  const _x_8 = Math.fround(_bh_0 / 2);
  const _by_0 = Math.fround(_x_7 - _x_8);
  const _x_9 = Math.fround(_h_0 - _bh_0);
  const _x_10 = Math.fround(_x_9 / 2);
  const _x_11 = Math.fround(_bh_0 + _x_10);
  const _x_12 = Math.fround(_h_0 * 0.05999999865889549);
  const _lab_y_0 = Math.fround(_x_11 - _x_12);
  const _x_13 = Math.fround(_bw_0 / 2);
  const _lmid_0 = Math.fround(_lx_0 + _x_13);
  const _x_14 = Math.fround(_bw_0 / 2);
  const _rmid_0 = Math.fround(_rx_0 + _x_14);
  const _x_15 = Math.fround(_h_0 - _bh_0);
  const _x_16 = Math.fround(4 / 9);
  const _title_y_0 = Math.fround(_x_15 * _x_16);
  const _x_17 = Math.fround(_h_0 / 2);
  const _x_18 = Math.fround(_bw_0 / 2);
  const _x_19 = Math.fround(_x_17 - _x_18);
  const _x_20 = Math.fround(_x_19 - _dl_0);
  const _pdx_0 = Math.fround(_x_20 - _dg_0);
  const _x_21 = Math.fround(_h_0 - _bh_0);
  const _pdy_0 = Math.fround(_x_21 / 2);
  const _x_22 = Math.fround(_bw_0 / 2);
  const _hi_wx_0 = $$lib_num_sharpen(Math.fround(_lx_0 + _x_22));
  const _x_23 = Math.fround(_h_0 - _bh_0);
  const _x_24 = Math.fround(_x_23 / 2);
  const _hi_y_0 = $$lib_num_sharpen(Math.fround(_bh_0 + _x_24));
  const _x_25 = Math.fround(_bw_0 / 2);
  const _hi_gx_0 = $$lib_num_sharpen(Math.fround(_rx_0 + _x_25));
  const _x_26 = Math.fround(_h_0 - _bh_0);
  const _x_27 = Math.fround(5 / 9);
  const _sub_y_0 = Math.fround(_x_26 * _x_27);
  const _x_28 = Math.fround(37 / 40);
  const _bf_y_0 = Math.fround(_h_0 * _x_28);
  const _x_29 = Math.fround(6 - 1);
  const _x_30 = Math.fround(_x_29 * 2);
  const _gap_0 = Math.fround(_bh_0 / _x_30);
  const _x_31 = $$lib_tween_value(_t_l_0, _now_0);
  const _fl_h_0 = Math.fround(_x_31 * _bh_0);
  const _x_32 = $$lib_tween_value(_t_r_0, _now_0);
  const _fr_h_0 = Math.fround(_x_32 * _bh_0);
  const _x_33 = $$lib_tween_value(_t_wh_0, _now_0);
  const _x_34 = Math.fround(_x_33 * _bh_0);
  const _wh_y_0 = Math.fround(_x_34 + _by_0);
  const _x_35 = $$lib_tween_value(_t_gh_0, _now_0);
  const _x_36 = Math.fround(_x_35 * _bh_0);
  const _gh_y_0 = Math.fround(_x_36 + _by_0);
  const _unit_0 = $$lib_env_label(_e_0, {$: "Wind"});
  const _max_w_0 = Math.fround(_bw_0 * 0.9700000286102295);
  const _bft_0 = $$widgets_windspeed_beaufort(_orig_0);
  const _top_0 = {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GFill", "color": "#F6F6F6"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _sw_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GRect", "x": _lx_0, "y": _by_0, "w": _bw_0, "h": _bh_0}, "tail": {$: "Nil"}}}}}), "tail": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": "black"}, "tail": {$: "Con", "head": {$: "GFill", "color": "#F6F6F6"}, "tail": {$: "Con", "head": {$: "GStyle", "width": _sw_0, "caps": ""}, "tail": {$: "Con", "head": {$: "GRect", "x": _rx_0, "y": _by_0, "w": _bw_0, "h": _bh_0}, "tail": {$: "Nil"}}}}}), "tail": {$: "Nil"}}};
  const _x_37 = Math.fround(_bh_0 - _fl_h_0);
  const _x_38 = Math.fround(_bh_0 - _fr_h_0);
  const _mid_0 = {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GFill", "color": $$lib_scene_rgb("23, 145, 27")}, "tail": {$: "Con", "head": {$: "GStyle", "width": 0, "caps": ""}, "tail": {$: "Con", "head": {$: "GRect", "x": _lx_0, "y": Math.fround(_x_37 + _by_0), "w": _bw_0, "h": _fl_h_0}, "tail": {$: "Nil"}}}}), "tail": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GFill", "color": $$lib_scene_rgb("188, 0, 255")}, "tail": {$: "Con", "head": {$: "GStyle", "width": 0, "caps": ""}, "tail": {$: "Con", "head": {$: "GRect", "x": _rx_0, "y": Math.fround(_x_38 + _by_0), "w": _bw_0, "h": _fr_h_0}, "tail": {$: "Nil"}}}}), "tail": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": $$lib_scene_rgb("23, 145, 27")}, "tail": {$: "Con", "head": {$: "GStyle", "width": Math.fround(_sw_0 * 4), "caps": ""}, "tail": {$: "Con", "head": {$: "GMove", "x": _lx_0, "y": _wh_y_0}, "tail": {$: "Con", "head": {$: "GLine", "x": Math.fround(_lx_0 + _bw_0), "y": _wh_y_0}, "tail": {$: "Nil"}}}}}), "tail": {$: "Con", "head": $$lib_scene_shape({$: "Con", "head": {$: "GStroke", "color": $$lib_scene_rgb("188, 0, 255")}, "tail": {$: "Con", "head": {$: "GStyle", "width": Math.fround(_sw_0 * 4), "caps": ""}, "tail": {$: "Con", "head": {$: "GMove", "x": _rx_0, "y": _gh_y_0}, "tail": {$: "Con", "head": {$: "GLine", "x": Math.fround(_rx_0 + _bw_0), "y": _gh_y_0}, "tail": {$: "Nil"}}}}}), "tail": {$: "Nil"}}}}};
  const _x_39 = $$lib_num_show(_spd_0);
  const _x_40 = ("\n" + _unit_0);
  const _x_41 = $$lib_num_show(_gust_0);
  const _x_42 = ("\n" + _unit_0);
  const _x_43 = $$lib_num_show(_bft_0);
  const _x_44 = $$lib_env_word(_e_0, {$: "WBeaufortScaleTitle"});
  const _x_45 = (": " + _x_43);
  const _x_46 = $$lib_num_show(_wh_0);
  const _x_47 = $$lib_env_word(_e_0, {$: "WWindSpeedMax"});
  const _x_48 = (":\n" + _x_46);
  const _x_49 = $$lib_num_show(_gh_0);
  const _x_50 = $$lib_env_word(_e_0, {$: "WWindSpeedMax"});
  const _x_51 = (":\n" + _x_49);
  const _texts_0 = {$: "Con", "head": $$lib_scene_label_w(_rx_0, _title_y_0, $$lib_env_word(_e_0, {$: "WWindSpeedTitle"}), $$lib_scene_boldx($$lib_scene_ex_mul(_tds_0, $$lib_scene_ex(1.5)), "arial"), "black", "center", "bottom", $$lib_scene_max_centred(_w_0, _stage_x_0, _rx_0)), "tail": {$: "Con", "head": $$lib_scene_label_w(_lmid_0, _sub_y_0, $$lib_env_word(_e_0, {$: "WWindSpeedWind"}), $$lib_scene_plainx(_tds_0, "arial"), "black", "center", "top", _max_w_0), "tail": {$: "Con", "head": $$lib_scene_label_w(_rmid_0, _sub_y_0, $$lib_env_word(_e_0, {$: "WWindSpeedGust"}), $$lib_scene_plainx(_tds_0, "arial"), "black", "center", "top", _max_w_0), "tail": {$: "Con", "head": $$lib_scene_label(_lmid_0, _lab_y_0, (_x_39 + _x_40), $$lib_scene_boldx(_tds_0, "arial"), "black", "center", "bottom"), "tail": {$: "Con", "head": $$lib_scene_label(_rmid_0, _lab_y_0, (_x_41 + _x_42), $$lib_scene_boldx(_tds_0, "arial"), "black", "center", "bottom"), "tail": {$: "Con", "head": $$lib_scene_label_w(_rx_0, _bf_y_0, (_x_44 + _x_45), $$lib_scene_boldx(_bf_px_0, "arial"), $$widgets_windspeed_colour(_bft_0), "center", "top", $$lib_scene_max_centred(_w_0, _stage_x_0, _rx_0)), "tail": {$: "Con", "head": $$lib_scene_label_w(_hi_wx_0, _hi_y_0, (_x_47 + _x_48), $$lib_scene_plainx(_tds_0, "arial"), "black", "center", "top", _max_w_0), "tail": {$: "Con", "head": $$lib_scene_label_w(_hi_gx_0, _hi_y_0, (_x_50 + _x_51), $$lib_scene_plainx(_tds_0, "arial"), "black", "center", "top", _max_w_0), "tail": {$: "Nil"}}}}}}}}};
  const _scale_0 = $$widgets_windspeed_dashes(12, {$: "Nil"}, _pdx_0, _pdy_0, _dl_0, _sw_0, _gap_0);
  const _x_52 = Math.fround(_pdx_0 - _dl_0);
  const _x_53 = Math.fround(125 / 100);
  const _labs_0 = $$widgets_windspeed_labels(6, _texts_0, Math.fround(_x_52 * _x_53), _pdy_0, _gap_0, _text_px_0, _max_0);
  return {$: "Scene", "x": _stage_x_0, "y": 0, "nodes": $$List_append(_top_0, $$List_append(_scale_0, $$List_append(_mid_0, _labs_0)))};
}

function $lib_dates_fdiv(_a_0, _b_0) {
  const _x_0 = Math.fround(_a_0 / _b_0);
  return Math.fround(Math.floor(_x_0));
}

function $lib_dates_fmod(_a_0, _b_0) {
  const _x_0 = $$lib_dates_fdiv(_a_0, _b_0);
  const _x_1 = Math.fround(_b_0 * _x_0);
  return Math.fround(_a_0 - _x_1);
}

function $lib_dates_leap(_y_0) {
  const _x_0 = $$lib_dates_fmod(_y_0, 4);
  const _x_1 = $$lib_dates_fmod(_y_0, 100);
  const _x_2 = $$lib_dates_fmod(_y_0, 400);
  const _x_3 = $$Bool_and((_x_0 === 0), (_x_1 !== 0));
  const _x_4 = (_x_2 === 0);
  return (_x_3 || _x_4);
}

function $lib_dates_dim(_y_0, _m_0) {
  const _x_0 = $$lib_dates_fmod($$lib_dates_fmod(Math.fround(_m_0 - 1), 7), 2);
  return $Bool_pick((_m_0 === 2), $$Bool_pick($$lib_dates_leap(_y_0), 29, 28), Math.fround(31 - _x_0));
}

function $lib_dates_days(_y_0, _m_0, _d_0) {
  const _yy_0 = $$Bool_pick((_m_0 <= 2), Math.fround(_y_0 - 1), _y_0);
  const _era_0 = $$lib_dates_fdiv(_yy_0, 400);
  const _x_0 = Math.fround(_era_0 * 400);
  const _yoe_0 = Math.fround(_yy_0 - _x_0);
  const _mp_0 = $$Bool_pick((_m_0 > 2), Math.fround(_m_0 - 3), Math.fround(_m_0 + 9));
  const _x_1 = Math.fround(153 * _mp_0);
  const _x_2 = $$lib_dates_fdiv(Math.fround(_x_1 + 2), 5);
  const _x_3 = Math.fround(_x_2 + _d_0);
  const _doy_0 = Math.fround(_x_3 - 1);
  const _x_4 = Math.fround(_yoe_0 * 365);
  const _x_5 = $$lib_dates_fdiv(_yoe_0, 4);
  const _x_6 = Math.fround(_x_4 + _x_5);
  const _x_7 = $$lib_dates_fdiv(_yoe_0, 100);
  const _x_8 = Math.fround(_x_6 - _x_7);
  const _doe_0 = Math.fround(_x_8 + _doy_0);
  const _x_9 = Math.fround(_era_0 * 146097);
  const _x_10 = Math.fround(_x_9 + _doe_0);
  return Math.fround(_x_10 - 719468);
}

function $lib_dates_civil(_z0_0) {
  const _z_0 = Math.fround(_z0_0 + 719468);
  const _era_0 = $$lib_dates_fdiv(_z_0, 146097);
  const _x_0 = Math.fround(_era_0 * 146097);
  const _doe_0 = Math.fround(_z_0 - _x_0);
  const _x_1 = $$lib_dates_fdiv(_doe_0, 1460);
  const _x_2 = Math.fround(_doe_0 - _x_1);
  const _x_3 = $$lib_dates_fdiv(_doe_0, 36524);
  const _x_4 = Math.fround(_x_2 + _x_3);
  const _x_5 = $$lib_dates_fdiv(_doe_0, 146096);
  const _yoe_0 = $$lib_dates_fdiv(Math.fround(_x_4 - _x_5), 365);
  const _x_6 = Math.fround(365 * _yoe_0);
  const _x_7 = $$lib_dates_fdiv(_yoe_0, 4);
  const _x_8 = Math.fround(_x_6 + _x_7);
  const _x_9 = $$lib_dates_fdiv(_yoe_0, 100);
  const _x_10 = Math.fround(_x_8 - _x_9);
  const _doy_0 = Math.fround(_doe_0 - _x_10);
  const _x_11 = Math.fround(5 * _doy_0);
  const _mp_0 = $$lib_dates_fdiv(Math.fround(_x_11 + 2), 153);
  const _x_12 = Math.fround(153 * _mp_0);
  const _x_13 = $$lib_dates_fdiv(Math.fround(_x_12 + 2), 5);
  const _x_14 = Math.fround(_doy_0 - _x_13);
  const _d_0 = Math.fround(_x_14 + 1);
  const _m_0 = $$Bool_pick((_mp_0 < 10), Math.fround(_mp_0 + 3), Math.fround(_mp_0 - 9));
  const _x_15 = Math.fround(_era_0 * 400);
  const _y_0 = Math.fround(_yoe_0 + _x_15);
  return {$: "Ymd", "y": $$Bool_pick((_m_0 <= 2), Math.fround(_y_0 + 1), _y_0), "m": _m_0, "d": _d_0};
}

function $lib_dates_ymd_y(_c_0) {
  const _y_0 = _c_0["y"];
  return _y_0;
}

function $lib_dates_ymd_m(_c_0) {
  const _m_0 = _c_0["m"];
  return _m_0;
}

function $lib_dates_ymd_d(_c_0) {
  const _d_0 = _c_0["d"];
  return _d_0;
}

function $lib_dates_ok(_mo_0) {
  const _ok_0 = _mo_0["ok"];
  return _ok_0;
}

function $lib_dates_add_days(_mo_0, _n_0) {
  const _ok_0 = _mo_0["ok"];
  const _day_0 = _mo_0["day"];
  const _min_0 = _mo_0["min"];
  return {$: "Mo", "ok": _ok_0, "day": Math.fround(_day_0 + _n_0), "min": _min_0};
}

function $lib_dates_add_minutes(_mo_0, _n_0) {
  const _ok_0 = _mo_0["ok"];
  const _day_0 = _mo_0["day"];
  const _min_0 = _mo_0["min"];
  const _t_0 = Math.fround(_min_0 + _n_0);
  const _dd_0 = $$lib_dates_fdiv(_t_0, 1440);
  const _x_0 = Math.fround(_dd_0 * 1440);
  return {$: "Mo", "ok": _ok_0, "day": Math.fround(_day_0 + _dd_0), "min": Math.fround(_t_0 - _x_0)};
}

function $lib_dates_weekday(_mo_0) {
  const _day_0 = _mo_0["day"];
  return $lib_dates_fmod(Math.fround(_day_0 + 4), 7);
}

function $lib_dates_iso_weekday(_mo_0) {
  const _w_0 = $$lib_dates_weekday(_mo_0);
  return $Bool_pick($$lib_dates_ok(_mo_0), $$Bool_pick((_w_0 === 0), 7, _w_0), $$lib_num_nan());
}

function $lib_dates_set_iso_weekday(_mo_0, _input_0) {
  const _x_0 = $$lib_dates_iso_weekday(_mo_0);
  return $Bool_pick($$lib_dates_ok(_mo_0), $$lib_dates_add_days(_mo_0, Math.fround(_input_0 - _x_0)), _mo_0);
}

function $lib_dates_month(_mo_0) {
  const _ok_0 = _mo_0["ok"];
  const _day_0 = _mo_0["day"];
  const _x_0 = $$lib_dates_ymd_m($$lib_dates_civil(_day_0));
  return $Bool_pick(_ok_0, Math.fround(_x_0 - 1), $$lib_num_nan());
}

function $lib_dates_set_month_go(_ok_0, _c_0, _min_0, _value_0) {
  const _y_0 = _c_0["y"];
  const _d_0 = _c_0["d"];
  const _x_0 = Math.fround(_y_0 * 12);
  const _total_0 = Math.fround(_x_0 + _value_0);
  const _ny_0 = $$lib_dates_fdiv(_total_0, 12);
  const _x_1 = Math.fround(_ny_0 * 12);
  const _x_2 = Math.fround(_total_0 - _x_1);
  const _nm_0 = Math.fround(_x_2 + 1);
  return {$: "Mo", "ok": _ok_0, "day": $$lib_dates_days(_ny_0, _nm_0, $$F32_min(_d_0, $$lib_dates_dim(_ny_0, _nm_0))), "min": _min_0};
}

function $lib_dates_set_month(_mo_0, _value_0) {
  const _ok_0 = _mo_0["ok"];
  const _day_0 = _mo_0["day"];
  const _min_0 = _mo_0["min"];
  return $Bool_pick(_ok_0, $$lib_dates_set_month_go(_ok_0, $$lib_dates_civil(_day_0), _min_0, _value_0), {$: "Mo", "ok": _ok_0, "day": _day_0, "min": _min_0});
}

function $lib_dates_add_months(_mo_0, _n_0) {
  const _x_0 = $$lib_dates_month(_mo_0);
  return $lib_dates_set_month(_mo_0, Math.fround(_x_0 + _n_0));
}

function $lib_dates_lt(_a_0, _b_0) {
  const _ao_0 = _a_0["ok"];
  const _ad_0 = _a_0["day"];
  const _am_0 = _a_0["min"];
  const _bo_0 = _b_0["ok"];
  const _bd_0 = _b_0["day"];
  const _bm_0 = _b_0["min"];
  const _x_0 = (_ad_0 < _bd_0);
  const _x_1 = $$Bool_and((_ad_0 === _bd_0), (_am_0 < _bm_0));
  return $Bool_and($$Bool_and(_ao_0, _bo_0), (_x_0 || _x_1));
}

function $lib_dates_stamp_go(_ok_0, _c_0, _min_0) {
  const _y_0 = _c_0["y"];
  const _m_0 = _c_0["m"];
  const _d_0 = _c_0["d"];
  const _h_0 = $$lib_dates_fdiv(_min_0, 60);
  const _x_0 = Math.fround(_h_0 * 60);
  const _x_1 = Math.fround(_min_0 - _x_0);
  return {$: "Stamp", "ok": _ok_0, "y": (_y_0 >= 1 && _y_0 < 4294967296 ? Math.floor(_y_0) : 0), "mo": (_m_0 >= 1 && _m_0 < 4294967296 ? Math.floor(_m_0) : 0), "d": (_d_0 >= 1 && _d_0 < 4294967296 ? Math.floor(_d_0) : 0), "h": (_h_0 >= 1 && _h_0 < 4294967296 ? Math.floor(_h_0) : 0), "mi": (_x_1 >= 1 && _x_1 < 4294967296 ? Math.floor(_x_1) : 0), "s": 0};
}

function $lib_dates_stamp(_mo_0) {
  const _ok_0 = _mo_0["ok"];
  const _day_0 = _mo_0["day"];
  const _min_0 = _mo_0["min"];
  return $lib_dates_stamp_go(_ok_0, $$lib_dates_civil(_day_0), _min_0);
}

function $lib_dates_stamps(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _x_0 = _xs_0["head"];
    const _rest_0 = _xs_0["tail"];
    return {$: "Con", "head": $$lib_dates_stamp(_x_0), "tail": $$lib_dates_stamps(_rest_0)};
  }
}

function $lib_dates_digit(_c_0) {
  const _x_0 = $$Char_to_u32(_c_0);
  const _x_1 = Math.fround(_x_0 >>>0);
  return Math.fround(_x_1 - 48);
}

function $lib_dates_scan_two(_d1_0, _s_0) {
  if (_s_0 === "") {
    return {$: "Scan", "found": true, "v": _d1_0, "rest": ""};
  } else {
    const _c_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    const _x_0 = Math.fround(_d1_0 * 10);
    const _x_1 = $$lib_dates_digit(_c_0);
    return $Bool_pick($$Char_is_digit(_c_0), {$: "Scan", "found": true, "v": Math.fround(_x_0 + _x_1), "rest": _t_0}, {$: "Scan", "found": true, "v": _d1_0, "rest": (_c_0 + _t_0)});
  }
}

function $lib_dates_scan_num(_s_0) {
  if (_s_0 === "") {
    return {$: "Scan", "found": false, "v": 0, "rest": ""};
  } else {
    const _c_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    return $Bool_pick($$Char_is_digit(_c_0), $$lib_dates_scan_two($$lib_dates_digit(_c_0), _t_0), $$lib_dates_scan_num(_t_0));
  }
}

function $lib_dates_scan_colon(_s_0) {
  if (_s_0 === "") {
    return {$: "Scan", "found": false, "v": 0, "rest": ""};
  } else {
    const _c_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    return $Bool_pick($$Char_is_eq(_c_0, ":"), {$: "Scan", "found": true, "v": 0, "rest": _t_0}, $$lib_dates_scan_colon(_t_0));
  }
}

function $lib_dates_scan_of(_k_0, _s_0) {
  if (_k_0.$ === "KColon") {
    return $lib_dates_scan_colon(_s_0);
  } else {
    return $lib_dates_scan_num(_s_0);
  }
}

function $lib_dates_scan_found(_sc_0) {
  const _f_0 = _sc_0["found"];
  return _f_0;
}

function $lib_dates_scan_v(_sc_0) {
  const _v_0 = _sc_0["v"];
  return _v_0;
}

function $lib_dates_scan_rest(_sc_0) {
  const _r_0 = _sc_0["rest"];
  return _r_0;
}

function $lib_dates_put(_g_0, _k_0, _f_0, _v_0) {
  const _hd_0 = _g_0["hd"];
  const _d_0 = _g_0["d"];
  const _hm_0 = _g_0["hm"];
  const _m_0 = _g_0["m"];
  const _hh_0 = _g_0["hh"];
  const _h_0 = _g_0["h"];
  const _hn_0 = _g_0["hn"];
  const _n_0 = _g_0["n"];
  if (_k_0.$ === "KDate") {
    return {$: "Got", "hd": (_hd_0 || _f_0), "d": $$Bool_pick(_f_0, _v_0, _d_0), "hm": _hm_0, "m": _m_0, "hh": _hh_0, "h": _h_0, "hn": _hn_0, "n": _n_0};
  } else if (_k_0.$ === "KMonth") {
    return {$: "Got", "hd": _hd_0, "d": _d_0, "hm": (_hm_0 || _f_0), "m": $$Bool_pick(_f_0, Math.fround(_v_0 - 1), _m_0), "hh": _hh_0, "h": _h_0, "hn": _hn_0, "n": _n_0};
  } else if (_k_0.$ === "KHour") {
    return {$: "Got", "hd": _hd_0, "d": _d_0, "hm": _hm_0, "m": _m_0, "hh": (_hh_0 || _f_0), "h": $$Bool_pick(_f_0, _v_0, _h_0), "hn": _hn_0, "n": _n_0};
  } else if (_k_0.$ === "KMinute") {
    return {$: "Got", "hd": _hd_0, "d": _d_0, "hm": _hm_0, "m": _m_0, "hh": _hh_0, "h": _h_0, "hn": (_hn_0 || _f_0), "n": $$Bool_pick(_f_0, _v_0, _n_0)};
  } else {
    return {$: "Got", "hd": _hd_0, "d": _d_0, "hm": _hm_0, "m": _m_0, "hh": _hh_0, "h": _h_0, "hn": _hn_0, "n": _n_0};
  }
}

function $lib_dates_run($0, $1, $2) {
  for (;;) {
    {
      const _toks_0 = $0;
      const _s_0 = $1;
      const _g_0 = $2;
      if (_toks_0.$ === "Nil") {
        return _g_0;
      } else {
        const _k_0 = _toks_0["head"];
        const _rest_0 = _toks_0["tail"];
        const _sc_0 = $$lib_dates_scan_of(_k_0, _s_0);
        const _f_0 = $$lib_dates_scan_found(_sc_0);
        $0 = _rest_0;
        $1 = $$Bool_pick(_f_0, $$lib_dates_scan_rest(_sc_0), _s_0);
        $2 = $$lib_dates_put(_g_0, _k_0, _f_0, $$lib_dates_scan_v(_sc_0));
        continue;
      }
    }
  }
}

function $lib_dates_build(_c_0, _g_0) {
  const _cy_0 = _c_0["year"];
  const _cm_0 = _c_0["month"];
  const _cd_0 = _c_0["day"];
  const _hd_0 = _g_0["hd"];
  const _d_0 = _g_0["d"];
  const _hm_0 = _g_0["hm"];
  const _m_0 = _g_0["m"];
  const _hh_0 = _g_0["hh"];
  const _h_0 = _g_0["h"];
  const _hn_0 = _g_0["hn"];
  const _n_0 = _g_0["n"];
  const _y_0 = Math.fround(_cy_0 >>>0);
  const _x_0 = Math.fround(_cm_0 >>>0);
  const _mon_0 = $$Bool_pick(_hm_0, _m_0, Math.fround(_x_0 - 1));
  const _date_0 = $$Bool_pick(_hd_0, _d_0, $$Bool_pick(_hm_0, 1, Math.fround(_cd_0 >>>0)));
  const _hour_0 = $$Bool_pick(_hh_0, _h_0, 0);
  const _minute_0 = $$Bool_pick(_hn_0, _n_0, 0);
  const _big_0 = (_hour_0 === 24);
  const _x_1 = (_hd_0 || _hm_0);
  const _x_2 = (_x_1 || _hh_0);
  const _x_3 = $$lib_dates_dim(_y_0, Math.fround(_mon_0 + 1));
  const _x_4 = $$Bool_not(_big_0);
  const _x_5 = (_minute_0 === 0);
  const _valid_0 = $$Bool_and($$Bool_and($$Bool_and($$Bool_and($$Bool_and($$Bool_and($$Bool_and((_x_2 || _hn_0), (_mon_0 >= 0)), (_mon_0 <= 11)), (_date_0 >= 1)), (_date_0 <= _x_3)), (_hour_0 <= 24)), (_x_4 || _x_5)), (_minute_0 <= 59));
  const _x_6 = $$lib_dates_days(_y_0, Math.fround(_mon_0 + 1), _date_0);
  const _x_7 = $$Bool_pick(_big_0, 1, 0);
  const _x_8 = $$Bool_pick(_big_0, 0, _hour_0);
  const _x_9 = Math.fround(_x_8 * 60);
  return {$: "Mo", "ok": _valid_0, "day": Math.fround(_x_6 + _x_7), "min": Math.fround(_x_9 + _minute_0)};
}

function $lib_dates_no_got() {
  return {$: "Got", "hd": false, "d": 0, "hm": false, "m": 0, "hh": false, "h": 0, "hn": false, "n": 0};
}

function $lib_dates_parse(_c_0, _text_0, _toks_0) {
  return $lib_dates_build(_c_0, $$lib_dates_run(_toks_0, _text_0, $$lib_dates_no_got()));
}

function $lib_dates_fmt_dd_hh_mm() {
  return {$: "Con", "head": {$: "KDate"}, "tail": {$: "Con", "head": {$: "KColon"}, "tail": {$: "Con", "head": {$: "KHour"}, "tail": {$: "Con", "head": {$: "KColon"}, "tail": {$: "Con", "head": {$: "KMinute"}, "tail": {$: "Nil"}}}}}};
}

function $lib_dates_fmt_dd() {
  return {$: "Con", "head": {$: "KDate"}, "tail": {$: "Nil"}};
}

function $lib_dates_fmt_mm() {
  return {$: "Con", "head": {$: "KMonth"}, "tail": {$: "Nil"}};
}

function $lib_dates_today_dd(_c_0) {
  const _d_0 = _c_0["day"];
  const _x_0 = $$U32_show(_d_0);
  return $Bool_pick((_d_0 < 10), ("0" + _x_0), $$U32_show(_d_0));
}

function $widgets_graphs_cat(_xs_0, _ys_0) {
  return $List_append(_xs_0, _ys_0);
}

function $widgets_graphs_bases() {
  return {$: "Con", "head": {$: "GBaro"}, "tail": {$: "Con", "head": {$: "GHum"}, "tail": {$: "Con", "head": {$: "GSolar"}, "tail": {$: "Con", "head": {$: "GTemp"}, "tail": {$: "Con", "head": {$: "GUv"}, "tail": {$: "Con", "head": {$: "GWindDir"}, "tail": {$: "Con", "head": {$: "GWindSpeed"}, "tail": {$: "Con", "head": {$: "GRainLine"}, "tail": {$: "Con", "head": {$: "GRainBar"}, "tail": {$: "Nil"}}}}}}}}}};
}

function $widgets_graphs_base_key(_b_0) {
  if (_b_0.$ === "GBaro") {
    return "barometer";
  } else if (_b_0.$ === "GHum") {
    return "humidity";
  } else if (_b_0.$ === "GSolar") {
    return "solar";
  } else if (_b_0.$ === "GTemp") {
    return "temp";
  } else if (_b_0.$ === "GUv") {
    return "uv";
  } else if (_b_0.$ === "GWindDir") {
    return "windDir";
  } else if (_b_0.$ === "GWindSpeed") {
    return "windSpeed";
  } else if (_b_0.$ === "GRainLine") {
    return "rainfallLine";
  } else {
    return "rainfallBar";
  }
}

function $widgets_graphs_list_key(_b_0) {
  if (_b_0.$ === "GRainLine") {
    return "rainfall";
  } else if (_b_0.$ === "GRainBar") {
    return "rainfall";
  } else {
    return $widgets_graphs_base_key(_b_0);
  }
}

function $widgets_graphs_base_on(_e_0, _b_0) {
  const _x_0 = $$widgets_graphs_list_key(_b_0);
  const _x_1 = (_x_0 + ".enabled");
  return $Bool_not($$String_eq($$lib_env_opt(_e_0, ("graph." + _x_1), "true"), "false"));
}

function $widgets_graphs_enabled_go(_e_0, _bs_0) {
  if (_bs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _b_0 = _bs_0["head"];
    const _rest_0 = _bs_0["tail"];
    const _r_0 = $$widgets_graphs_enabled_go(_e_0, _rest_0);
    return $Bool_pick($$widgets_graphs_base_on(_e_0, _b_0), {$: "Con", "head": _b_0, "tail": _r_0}, _r_0);
  }
}

function $widgets_graphs_enabled(_e_0) {
  return $widgets_graphs_enabled_go(_e_0, $$widgets_graphs_bases());
}

function $widgets_graphs_spans(_b_0) {
  if (_b_0.$ === "GSolar") {
    return {$: "Con", "head": {$: "SpHourlyDay"}, "tail": {$: "Con", "head": {$: "SpQuarterWeek"}, "tail": {$: "Con", "head": {$: "SpMinuteHour"}, "tail": {$: "Nil"}}}};
  } else if (_b_0.$ === "GUv") {
    return {$: "Con", "head": {$: "SpHourlyDay"}, "tail": {$: "Con", "head": {$: "SpQuarterWeek"}, "tail": {$: "Nil"}}};
  } else if (_b_0.$ === "GRainLine") {
    return {$: "Con", "head": {$: "SpHourlyDay"}, "tail": {$: "Con", "head": {$: "SpMinuteHour"}, "tail": {$: "Nil"}}};
  } else if (_b_0.$ === "GRainBar") {
    return {$: "Con", "head": {$: "SpDailyMonth"}, "tail": {$: "Con", "head": {$: "SpMonthlyYear"}, "tail": {$: "Con", "head": {$: "SpQuarterWeek"}, "tail": {$: "Nil"}}}};
  } else {
    return {$: "Con", "head": {$: "SpDailyMonth"}, "tail": {$: "Con", "head": {$: "SpHourlyDay"}, "tail": {$: "Con", "head": {$: "SpQuarterWeek"}, "tail": {$: "Con", "head": {$: "SpMinuteHour"}, "tail": {$: "Nil"}}}}};
  }
}

function $widgets_graphs_first_span(_b_0) {
  return $Maybe_default($$List_head($$widgets_graphs_spans(_b_0)), {$: "SpHourlyDay"});
}

function $widgets_graphs_span_key(_s_0) {
  if (_s_0.$ === "SpDailyMonth") {
    return "dailyMonth";
  } else if (_s_0.$ === "SpHourlyDay") {
    return "hourlyDay";
  } else if (_s_0.$ === "SpQuarterWeek") {
    return "quarterDailyWeek";
  } else if (_s_0.$ === "SpMinuteHour") {
    return "minutlyHour";
  } else {
    return "monthlyYear";
  }
}

function $widgets_graphs_is_bar(_b_0) {
  if (_b_0.$ === "GRainBar") {
    return true;
  } else {
    return false;
  }
}

function $widgets_graphs_unit(_b_0) {
  if (_b_0.$ === "GBaro") {
    return {$: "Pressure"};
  } else if (_b_0.$ === "GHum") {
    return {$: "Humidity"};
  } else if (_b_0.$ === "GSolar") {
    return {$: "Solar"};
  } else if (_b_0.$ === "GTemp") {
    return {$: "Temp"};
  } else if (_b_0.$ === "GUv") {
    return {$: "UV"};
  } else if (_b_0.$ === "GWindDir") {
    return {$: "WindDirection"};
  } else if (_b_0.$ === "GWindSpeed") {
    return {$: "Wind"};
  } else if (_b_0.$ === "GRainLine") {
    return {$: "Rainfall"};
  } else {
    return {$: "Rainfall"};
  }
}

function $widgets_graphs_label_word(_b_0) {
  if (_b_0.$ === "GBaro") {
    return {$: "WGraphBaroLabel"};
  } else if (_b_0.$ === "GHum") {
    return {$: "WGraphHumidityLabel"};
  } else if (_b_0.$ === "GSolar") {
    return {$: "WGraphSolarLabel"};
  } else if (_b_0.$ === "GTemp") {
    return {$: "WTemperatureTitle"};
  } else if (_b_0.$ === "GUv") {
    return {$: "WGraphLabelUV"};
  } else if (_b_0.$ === "GWindDir") {
    return {$: "WGraphLabelWindDirection"};
  } else if (_b_0.$ === "GWindSpeed") {
    return {$: "WWindSpeedTitle"};
  } else if (_b_0.$ === "GRainLine") {
    return {$: "WRainfallTitle"};
  } else {
    return {$: "WRainfallTitle"};
  }
}

function $widgets_graphs_title_word(_b_0) {
  if (_b_0.$ === "GBaro") {
    return {$: "WBarometerTitle"};
  } else if (_b_0.$ === "GHum") {
    return {$: "WHumidityTitle"};
  } else if (_b_0.$ === "GSolar") {
    return {$: "WSolarTitle"};
  } else if (_b_0.$ === "GTemp") {
    return {$: "WTemperatureTitle"};
  } else if (_b_0.$ === "GUv") {
    return {$: "WUvTitle"};
  } else if (_b_0.$ === "GWindDir") {
    return {$: "WGraphLabelWindDirection"};
  } else if (_b_0.$ === "GWindSpeed") {
    return {$: "WWindSpeedTitle"};
  } else if (_b_0.$ === "GRainLine") {
    return {$: "WRainfallTitle"};
  } else {
    return {$: "WRainfallTitle"};
  }
}

function $widgets_graphs_title_tail(_e_0, _s_0) {
  if (_s_0.$ === "SpDailyMonth") {
    const _x_0 = $$lib_env_word(_e_0, {$: "WGraphDays"});
    const _x_1 = (" " + _x_0);
    return ("31" + _x_1);
  } else if (_s_0.$ === "SpHourlyDay") {
    const _x_2 = $$lib_env_word(_e_0, {$: "WGraphHours"});
    const _x_3 = (" " + _x_2);
    return ("24" + _x_3);
  } else if (_s_0.$ === "SpQuarterWeek") {
    const _x_4 = $$lib_env_word(_e_0, {$: "WGraphDays"});
    const _x_5 = (" " + _x_4);
    return ("7" + _x_5);
  } else if (_s_0.$ === "SpMinuteHour") {
    return $lib_env_word(_e_0, {$: "WGraphHour"});
  } else {
    const _x_6 = $$lib_env_word(_e_0, {$: "WGraphMonths"});
    const _x_7 = (" " + _x_6);
    return ("12" + _x_7);
  }
}

function $widgets_graphs_title(_e_0, _b_0, _s_0) {
  const _x_0 = $$widgets_graphs_title_tail(_e_0, _s_0);
  const _x_1 = $$lib_env_word(_e_0, {$: "WGraphLast"});
  const _x_2 = (" " + _x_0);
  const _x_3 = (_x_1 + _x_2);
  const _x_4 = $$lib_env_word(_e_0, $$widgets_graphs_title_word(_b_0));
  const _x_5 = (" " + _x_3);
  return (_x_4 + _x_5);
}

function $widgets_graphs_ticks(_b_0) {
  if (_b_0.$ === "GBaro") {
    return {$: "Con", "head": {$: "TBeginAtZero", "on": false}, "tail": {$: "Nil"}};
  } else if (_b_0.$ === "GHum") {
    return {$: "Con", "head": {$: "TBeginAtZero", "on": true}, "tail": {$: "Con", "head": {$: "TMin", "v": 0}, "tail": {$: "Con", "head": {$: "TMax", "v": 100}, "tail": {$: "Nil"}}}};
  } else if (_b_0.$ === "GSolar") {
    return {$: "Con", "head": {$: "TBeginAtZero", "on": true}, "tail": {$: "Nil"}};
  } else if (_b_0.$ === "GTemp") {
    return {$: "Con", "head": {$: "TBeginAtZero", "on": false}, "tail": {$: "Nil"}};
  } else if (_b_0.$ === "GUv") {
    return {$: "Con", "head": {$: "TBeginAtZero", "on": true}, "tail": {$: "Nil"}};
  } else if (_b_0.$ === "GWindDir") {
    return {$: "Con", "head": {$: "TBeginAtZero", "on": true}, "tail": {$: "Con", "head": {$: "TMin", "v": 0}, "tail": {$: "Con", "head": {$: "TMax", "v": 360}, "tail": {$: "Con", "head": {$: "TStep", "v": 90}, "tail": {$: "Nil"}}}}};
  } else if (_b_0.$ === "GWindSpeed") {
    return {$: "Con", "head": {$: "TBeginAtZero", "on": true}, "tail": {$: "Nil"}};
  } else if (_b_0.$ === "GRainLine") {
    return {$: "Con", "head": {$: "TBeginAtZero", "on": false}, "tail": {$: "Nil"}};
  } else {
    return {$: "Con", "head": {$: "TBeginAtZero", "on": true}, "tail": {$: "Nil"}};
  }
}

function $widgets_graphs_time_display(_b_0, _s_0) {
  if (_b_0.$ === "GRainBar") {
    if (_s_0.$ === "SpDailyMonth") {
      return "MMM D";
    } else if (_s_0.$ === "SpMonthlyYear") {
      return "MMM YYYY";
    } else if (_s_0.$ === "SpQuarterWeek") {
      return "ddd";
    } else if (_s_0.$ === "SpHourlyDay") {
      return "hour";
    } else {
      return "minute";
    }
  } else {
    if (_s_0.$ === "SpHourlyDay") {
      return "hour";
    } else if (_s_0.$ === "SpMinuteHour") {
      return "minute";
    } else {
      return "day";
    }
  }
}

function $widgets_graphs_two(_b_0, _s_0) {
  if (_b_0.$ === "GTemp") {
    if (_s_0.$ === "SpDailyMonth") {
      return true;
    } else {
      return false;
    }
  } else if (_b_0.$ === "GWindSpeed") {
    if (_s_0.$ === "SpMinuteHour") {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

function $widgets_graphs_rgba(_c_0, _a_0) {
  const _x_0 = (_a_0 + ")");
  const _x_1 = (", " + _x_0);
  const _x_2 = (_c_0 + _x_1);
  return ("rgba(" + _x_2);
}

function $widgets_graphs_line_style(_c_0, _fill_0) {
  return {$: "SLine", "fill": _fill_0, "background": $$widgets_graphs_rgba(_c_0, "0.4"), "border": $$widgets_graphs_rgba(_c_0, "0.8"), "point_border": $$widgets_graphs_rgba(_c_0, "0.6"), "point_background": $$widgets_graphs_rgba(_c_0, "0.6"), "point_hover_background": $$widgets_graphs_rgba(_c_0, "0.6"), "point_hover_border": $$widgets_graphs_rgba(_c_0, "0.6")};
}

function $widgets_graphs_style(_b_0) {
  if (_b_0.$ === "GBaro") {
    return $widgets_graphs_line_style("40, 104, 206", false);
  } else if (_b_0.$ === "GHum") {
    return $widgets_graphs_line_style("16, 217, 244", false);
  } else if (_b_0.$ === "GSolar") {
    return $widgets_graphs_line_style("245, 193, 18", true);
  } else if (_b_0.$ === "GTemp") {
    return $widgets_graphs_line_style("209, 32, 32", false);
  } else if (_b_0.$ === "GUv") {
    return $widgets_graphs_line_style("234, 242, 45", true);
  } else if (_b_0.$ === "GWindDir") {
    return $widgets_graphs_line_style("23, 145, 27", false);
  } else if (_b_0.$ === "GWindSpeed") {
    return $widgets_graphs_line_style("23, 145, 27", false);
  } else if (_b_0.$ === "GRainLine") {
    return $widgets_graphs_line_style("0, 71, 183", false);
  } else {
    return {$: "SBar", "background": $$widgets_graphs_rgba("0, 71, 183", "0.4"), "border": $$widgets_graphs_rgba("0, 71, 183", "0.8"), "border_width": 2};
  }
}

function $widgets_graphs_style2(_b_0) {
  if (_b_0.$ === "GTemp") {
    return $widgets_graphs_line_style("0, 50, 200", false);
  } else {
    return $widgets_graphs_line_style("188, 0, 255", false);
  }
}

function $widgets_graphs_border(_st_0) {
  if (_st_0.$ === "SLine") {
    const _b_0 = _st_0["border"];
    return _b_0;
  } else {
    const _b_1 = _st_0["border"];
    return _b_1;
  }
}

function $widgets_graphs_raw(_e_0, _file_0, _i_0) {
  if (_file_0 == 0) {
    return $lib_env_cr(_e_0, _i_0);
  } else if (_file_0 == 1) {
    return $lib_env_cre(_e_0, _i_0);
  } else if (_file_0 == 2) {
    return $lib_env_crh(_e_0, _i_0);
  } else {
    return $lib_env_crd(_e_0, _i_0);
  }
}

function $widgets_graphs_range_raw(_n_0, _e_0, _file_0, _a_0) {
  if (_n_0 == 0) {
    return {$: "Nil"};
  } else {
    const _p_0 = (_n_0 - 1);
    return {$: "Con", "head": $$widgets_graphs_raw(_e_0, _file_0, _a_0), "tail": $$widgets_graphs_range_raw(_p_0, _e_0, _file_0, nat_chk(_a_0 + 1))};
  }
}

function $widgets_graphs_vals(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _x_0 = _xs_0["head"];
    const _rest_0 = _xs_0["tail"];
    return {$: "Con", "head": {$: "VRaw", "s": _x_0}, "tail": $$widgets_graphs_vals(_rest_0)};
  }
}

function $widgets_graphs_rot_val(_xs_0, _k_0) {
  return $List_append($$List_drop(_xs_0, _k_0), $$List_take(_xs_0, _k_0));
}

function $widgets_graphs_rot_mo(_xs_0, _k_0) {
  return $List_append($$List_drop(_xs_0, _k_0), $$List_take(_xs_0, _k_0));
}

function $widgets_graphs_week_base(_e_0) {
  return $lib_dates_parse($$lib_env_clock(_e_0), $$lib_env_cre(_e_0, (700 )), $$lib_dates_fmt_dd());
}

function $widgets_graphs_month_base(_e_0) {
  return $lib_dates_parse($$lib_env_clock(_e_0), $$lib_env_cr(_e_0, 36), $$lib_dates_fmt_mm());
}

function $widgets_graphs_week_shift(_e_0) {
  const _x_0 = $$lib_dates_iso_weekday($$widgets_graphs_week_base(_e_0));
  return $lib_num_nat_of(Math.fround(_x_0 - 1));
}

function $widgets_graphs_month_shift(_e_0) {
  return $lib_num_nat_of($$lib_dates_month($$widgets_graphs_month_base(_e_0)));
}

function $widgets_graphs_rain7_go(_n_0, _e_0, _i_0) {
  if (_n_0 == 0) {
    return {$: "Nil"};
  } else {
    const _p_0 = (_n_0 - 1);
    const _x_0 = (484 );
    const _x_1 = $$lib_num_parse($$lib_env_cre(_e_0, nat_chk(_x_0 + _i_0)));
    return {$: "Con", "head": {$: "VNum", "x": Math.fround(_x_1 / 10)}, "tail": $$widgets_graphs_rain7_go(_p_0, _e_0, nat_chk(_i_0 + 1))};
  }
}

function $widgets_graphs_series_of(_e_0, _src_0) {
  if (_src_0.$ === "SrcR") {
    const _file_0 = _src_0["file"];
    const _a_0 = _src_0["a"];
    const _n_0 = _src_0["n"];
    const _b_0 = _src_0["b"];
    const _m_0 = _src_0["m"];
    return $widgets_graphs_vals($$List_append($$widgets_graphs_range_raw(_n_0, _e_0, _file_0, _a_0), $$widgets_graphs_range_raw(_m_0, _e_0, _file_0, _b_0)));
  } else if (_src_0.$ === "SrcRain7") {
    return $widgets_graphs_rot_val($$widgets_graphs_rain7_go(7, _e_0, 0), $$widgets_graphs_week_shift(_e_0));
  } else {
    return $widgets_graphs_rot_val($$widgets_graphs_vals($$widgets_graphs_range_raw(12, _e_0, 3, 187)), $$widgets_graphs_month_shift(_e_0));
  }
}

function $widgets_graphs_hours(_a_0, _b_0) {
  return {$: "SrcR", "file": 1, "a": _a_0, "n": 20, "b": _b_0, "m": 4};
}

function $widgets_graphs_daily(_a_0) {
  return {$: "SrcR", "file": 3, "a": _a_0, "n": 31, "b": 0, "m": 0};
}

function $widgets_graphs_minutes(_a_0) {
  return {$: "SrcR", "file": 2, "a": _a_0, "n": 60, "b": 0, "m": 0};
}

function $widgets_graphs_quarters(_a_0) {
  return {$: "SrcR", "file": 3, "a": _a_0, "n": 28, "b": 0, "m": 0};
}

function $widgets_graphs_src(_b_0, _s_0) {
  if (_b_0.$ === "GBaro") {
    if (_s_0.$ === "SpDailyMonth") {
      return $widgets_graphs_daily(94);
    } else if (_s_0.$ === "SpHourlyDay") {
      return $widgets_graphs_hours((439 ), (574 ));
    } else if (_s_0.$ === "SpQuarterWeek") {
      return $widgets_graphs_quarters((261 ));
    } else {
      return $widgets_graphs_minutes((301 ));
    }
  } else if (_b_0.$ === "GHum") {
    if (_s_0.$ === "SpDailyMonth") {
      return $widgets_graphs_daily(199);
    } else if (_s_0.$ === "SpHourlyDay") {
      return $widgets_graphs_hours((611 ), (630 ));
    } else if (_s_0.$ === "SpQuarterWeek") {
      return $widgets_graphs_quarters((289 ));
    } else {
      return $widgets_graphs_minutes(241);
    }
  } else if (_b_0.$ === "GSolar") {
    if (_s_0.$ === "SpHourlyDay") {
      return $widgets_graphs_hours((491 ), (582 ));
    } else if (_s_0.$ === "SpQuarterWeek") {
      return $widgets_graphs_quarters((373 ));
    } else {
      return $widgets_graphs_minutes((421 ));
    }
  } else if (_b_0.$ === "GTemp") {
    if (_s_0.$ === "SpDailyMonth") {
      return $widgets_graphs_daily(1);
    } else if (_s_0.$ === "SpHourlyDay") {
      return $widgets_graphs_hours(21, (566 ));
    } else if (_s_0.$ === "SpQuarterWeek") {
      return $widgets_graphs_quarters(233);
    } else {
      return $widgets_graphs_minutes(181);
    }
  } else if (_b_0.$ === "GUv") {
    if (_s_0.$ === "SpHourlyDay") {
      return $widgets_graphs_hours((511 ), (586 ));
    } else {
      return $widgets_graphs_quarters((401 ));
    }
  } else if (_b_0.$ === "GWindDir") {
    if (_s_0.$ === "SpDailyMonth") {
      return $widgets_graphs_daily(156);
    } else if (_s_0.$ === "SpHourlyDay") {
      return $widgets_graphs_hours((536 ), (590 ));
    } else if (_s_0.$ === "SpQuarterWeek") {
      return $widgets_graphs_quarters((317 ));
    } else {
      return $widgets_graphs_minutes(121);
    }
  } else if (_b_0.$ === "GWindSpeed") {
    if (_s_0.$ === "SpDailyMonth") {
      return $widgets_graphs_daily(125);
    } else if (_s_0.$ === "SpHourlyDay") {
      return $widgets_graphs_hours(1, (562 ));
    } else if (_s_0.$ === "SpQuarterWeek") {
      return $widgets_graphs_quarters((345 ));
    } else {
      return $widgets_graphs_minutes(1);
    }
  } else if (_b_0.$ === "GRainLine") {
    if (_s_0.$ === "SpHourlyDay") {
      return $widgets_graphs_hours(41, (570 ));
    } else {
      return $widgets_graphs_minutes((361 ));
    }
  } else {
    if (_s_0.$ === "SpDailyMonth") {
      return $widgets_graphs_daily(63);
    } else if (_s_0.$ === "SpMonthlyYear") {
      return {$: "SrcRain12"};
    } else {
      return {$: "SrcRain7"};
    }
  }
}

function $widgets_graphs_src2(_b_0) {
  if (_b_0.$ === "GTemp") {
    return $widgets_graphs_daily(32);
  } else {
    return $widgets_graphs_minutes(61);
  }
}

function $widgets_graphs_js_int_digits(_s_0, _acc_0, _any_0) {
  if (_s_0 === "") {
    return $Bool_pick(_any_0, _acc_0, $$lib_num_nan());
  } else {
    const _c_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    const _x_0 = Math.fround(_acc_0 * 10);
    const _x_1 = $$lib_dates_digit(_c_0);
    return $Bool_pick($$Char_is_digit(_c_0), $$widgets_graphs_js_int_digits(_t_0, Math.fround(_x_0 + _x_1), true), $$Bool_pick(_any_0, _acc_0, $$lib_num_nan()));
  }
}

function $widgets_graphs_js_int_sign(_s_0) {
  if (_s_0 === "") {
    return $lib_num_nan();
  } else {
    const _c_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    const _x_0 = $$widgets_graphs_js_int_digits(_t_0, 0, false);
    return $Bool_pick($$Char_is_eq(_c_0, "-"), (-_x_0), $$Bool_pick($$Char_is_eq(_c_0, "+"), $$widgets_graphs_js_int_digits(_t_0, 0, false), $$widgets_graphs_js_int_digits((_c_0 + _t_0), 0, false)));
  }
}

function $widgets_graphs_js_int(_s_0) {
  return $widgets_graphs_js_int_sign($$String_trim_start(_s_0));
}

function $widgets_graphs_nth(_xs_0, _i_0) {
  return $Maybe_default($$List_get(_xs_0, _i_0), "undefined");
}

function $widgets_graphs_hour_of(_s_0) {
  return $widgets_graphs_js_int($$widgets_graphs_nth($$String_split(_s_0, ":"), 0));
}

function $widgets_graphs_max_hour($0, $1) {
  for (;;) {
    {
      const _xs_0 = $0;
      const _mx_0 = $1;
      if (_xs_0.$ === "Nil") {
        return _mx_0;
      } else {
        const _x_0 = _xs_0["head"];
        const _rest_0 = _xs_0["tail"];
        const _hr_0 = $$widgets_graphs_hour_of(_x_0);
        $0 = _rest_0;
        $1 = $$Bool_pick((_hr_0 > _mx_0), _hr_0, _mx_0);
        continue;
      }
    }
  }
}

function $widgets_graphs_js_mod(_a_0, _b_0) {
  const _x_0 = Math.fround(_a_0 / _b_0);
  const _x_1 = Math.fround(Math.trunc(_x_0));
  const _x_2 = Math.fround(_b_0 * _x_1);
  return Math.fround(_a_0 - _x_2);
}

function $widgets_graphs_to24(_xs_0, _add_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _x_0 = _xs_0["head"];
    const _rest_0 = _xs_0["tail"];
    const _parts_0 = $$String_split(_x_0, ":");
    const _jh_0 = $$widgets_graphs_js_int($$widgets_graphs_nth(_parts_0, 0));
    const _x_1 = $$Bool_pick(_add_0, 12, 0);
    const _h_0 = $$widgets_graphs_js_mod(Math.fround(_jh_0 + _x_1), 24);
    const _x_2 = $$widgets_graphs_nth(_parts_0, 1);
    const _x_3 = $$lib_num_show(_h_0);
    const _x_4 = (":" + _x_2);
    return {$: "Con", "head": (_x_3 + _x_4), "tail": $$widgets_graphs_to24(_rest_0, $$Bool_pick((_jh_0 === 12), $$Bool_not(_add_0), _add_0))};
  }
}

function $widgets_graphs_last(_xs_0) {
  return $Maybe_default($$List_last(_xs_0), "");
}

function $widgets_graphs_hour_moments(_xs_0, _c_0, _day_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _x_0 = _xs_0["head"];
    const _rest_0 = _xs_0["tail"];
    const _x_1 = (":" + _x_0);
    return {$: "Con", "head": $$lib_dates_parse(_c_0, (_day_0 + _x_1), $$lib_dates_fmt_dd_hh_mm()), "tail": $$widgets_graphs_hour_moments(_rest_0, _c_0, _day_0)};
  }
}

function $widgets_graphs_back_day(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _x_0 = _xs_0["head"];
    const _rest_0 = _xs_0["tail"];
    return {$: "Con", "head": $$lib_dates_add_days(_x_0, (-1)), "tail": $$widgets_graphs_back_day(_rest_0)};
  }
}

function $widgets_graphs_before(_x_0, _acc_0) {
  if (_acc_0.$ === "Nil") {
    return false;
  } else {
    const _p_0 = _acc_0["head"];
    return $lib_dates_lt(_x_0, _p_0);
  }
}

function $widgets_graphs_day_fix($0, $1) {
  for (;;) {
    {
      const _xs_0 = $0;
      const _acc_0 = $1;
      if (_xs_0.$ === "Nil") {
        return $List_reverse(_acc_0);
      } else {
        const _x_0 = _xs_0["head"];
        const _rest_0 = _xs_0["tail"];
        $0 = _rest_0;
        $1 = {$: "Con", "head": _x_0, "tail": $$Bool_pick($$widgets_graphs_before(_x_0, _acc_0), $$widgets_graphs_back_day(_acc_0), _acc_0)};
        continue;
      }
    }
  }
}

function $widgets_graphs_stamp_hour(_e_0) {
  const _xs_0 = $$List_append($$widgets_graphs_range_raw(20, _e_0, 1, (459 )), $$widgets_graphs_range_raw(4, _e_0, 1, (578 )));
  const _x_0 = $$widgets_graphs_last($$String_split($$lib_env_cr(_e_0, 32), ":"));
  const _pm_0 = string_contains(_x_0, "PM");
  const _x_1 = $$widgets_graphs_max_hour(_xs_0, (-1));
  const _conv_0 = $$Bool_pick((_x_1 === 12), $$widgets_graphs_to24(_xs_0, _pm_0), _xs_0);
  const _d_0 = $$lib_env_cre(_e_0, (700 ));
  const _day_0 = $$Bool_pick($$String_eq(_d_0, "0"), $$lib_dates_today_dd($$lib_env_clock(_e_0)), _d_0);
  return $widgets_graphs_day_fix($$widgets_graphs_hour_moments(_conv_0, $$lib_env_clock(_e_0), _day_0), {$: "Nil"});
}

function $widgets_graphs_days31(_n_0, _base_0, _i_0) {
  if (_n_0 == 0) {
    return {$: "Nil"};
  } else {
    const _p_0 = (_n_0 - 1);
    return {$: "Con", "head": $$lib_dates_add_days(_base_0, Math.fround(_i_0 - 31)), "tail": $$widgets_graphs_days31(_p_0, _base_0, Math.fround(_i_0 + 1))};
  }
}

function $widgets_graphs_stamp_day(_e_0) {
  const _x_0 = $$lib_env_crd(_e_0, 231);
  const _x_1 = $$lib_env_crd(_e_0, 230);
  const _x_2 = (":" + _x_0);
  const _x_3 = (_x_1 + _x_2);
  const _x_4 = $$lib_env_crd(_e_0, 232);
  const _x_5 = (":" + _x_3);
  const _base_0 = $$lib_dates_parse($$lib_env_clock(_e_0), (_x_4 + _x_5), $$lib_dates_fmt_dd_hh_mm());
  return $widgets_graphs_days31(31, _base_0, 0);
}

function $widgets_graphs_mins60(_n_0, _base_0, _i_0) {
  if (_n_0 == 0) {
    return {$: "Nil"};
  } else {
    const _p_0 = (_n_0 - 1);
    return {$: "Con", "head": $$lib_dates_add_minutes(_base_0, Math.fround(_i_0 - 60)), "tail": $$widgets_graphs_mins60(_p_0, _base_0, Math.fround(_i_0 + 1))};
  }
}

function $widgets_graphs_stamp_minute(_e_0) {
  const _x_0 = $$lib_env_cr(_e_0, 29);
  const _x_1 = (_x_0 + ":01");
  const _x_2 = $$lib_env_cr(_e_0, 35);
  const _x_3 = (":" + _x_1);
  const _base_0 = $$lib_dates_parse($$lib_env_clock(_e_0), (_x_2 + _x_3), $$lib_dates_fmt_dd_hh_mm());
  return $widgets_graphs_mins60(60, _base_0, 0);
}

function $widgets_graphs_quarters28(_n_0, _base_0, _i_0) {
  if (_n_0 == 0) {
    return {$: "Nil"};
  } else {
    const _p_0 = (_n_0 - 1);
    const _x_0 = Math.fround(_i_0 * 6);
    const _x_1 = Math.fround(_x_0 - 168);
    return {$: "Con", "head": $$lib_dates_add_minutes(_base_0, Math.fround(_x_1 * 60)), "tail": $$widgets_graphs_quarters28(_p_0, _base_0, Math.fround(_i_0 + 1))};
  }
}

function $widgets_graphs_stamp_quarter(_e_0) {
  const _x_0 = $$lib_env_crd(_e_0, 232);
  const _base_0 = $$lib_dates_parse($$lib_env_clock(_e_0), (_x_0 + ":00:00"), $$lib_dates_fmt_dd_hh_mm());
  return $widgets_graphs_quarters28(28, _base_0, 0);
}

function $widgets_graphs_week7(_n_0, _base_0, _i_0, _k_0) {
  if (_n_0 == 0) {
    return {$: "Nil"};
  } else {
    const _p_0 = (_n_0 - 1);
    const _x_0 = $$lib_dates_set_iso_weekday(_base_0, Math.fround(_i_0 - 6));
    return {$: "Con", "head": $$Bool_pick((_i_0 < _k_0), $$lib_dates_add_days(_x_0, 7), _x_0), "tail": $$widgets_graphs_week7(_p_0, _base_0, Math.fround(_i_0 + 1), _k_0)};
  }
}

function $widgets_graphs_stamp_week(_e_0) {
  const _k_0 = $$widgets_graphs_week_shift(_e_0);
  return $widgets_graphs_rot_mo($$widgets_graphs_week7(7, $$widgets_graphs_week_base(_e_0), 0, $$lib_num_of_nat(_k_0)), _k_0);
}

function $widgets_graphs_month12(_n_0, _base_0, _i_0, _k_0) {
  if (_n_0 == 0) {
    return {$: "Nil"};
  } else {
    const _p_0 = (_n_0 - 1);
    const _x_0 = $$lib_dates_set_month(_base_0, Math.fround(_i_0 - 12));
    return {$: "Con", "head": $$Bool_pick((_i_0 < _k_0), $$lib_dates_add_months(_x_0, 12), _x_0), "tail": $$widgets_graphs_month12(_p_0, _base_0, Math.fround(_i_0 + 1), _k_0)};
  }
}

function $widgets_graphs_stamp_month(_e_0) {
  const _k_0 = $$widgets_graphs_month_shift(_e_0);
  return $widgets_graphs_rot_mo($$widgets_graphs_month12(12, $$widgets_graphs_month_base(_e_0), 0, $$lib_num_of_nat(_k_0)), _k_0);
}

function $widgets_graphs_stamps(_e_0, _b_0, _s_0) {
  if (_b_0.$ === "GRainBar") {
    if (_s_0.$ === "SpMonthlyYear") {
      return $lib_dates_stamps($$widgets_graphs_stamp_month(_e_0));
    } else if (_s_0.$ === "SpQuarterWeek") {
      return $lib_dates_stamps($$widgets_graphs_stamp_week(_e_0));
    } else if (_s_0.$ === "SpDailyMonth") {
      return $lib_dates_stamps($$widgets_graphs_stamp_day(_e_0));
    } else if (_s_0.$ === "SpHourlyDay") {
      return $lib_dates_stamps($$widgets_graphs_stamp_hour(_e_0));
    } else {
      return $lib_dates_stamps($$widgets_graphs_stamp_minute(_e_0));
    }
  } else {
    if (_s_0.$ === "SpDailyMonth") {
      return $lib_dates_stamps($$widgets_graphs_stamp_day(_e_0));
    } else if (_s_0.$ === "SpHourlyDay") {
      return $lib_dates_stamps($$widgets_graphs_stamp_hour(_e_0));
    } else if (_s_0.$ === "SpQuarterWeek") {
      return $lib_dates_stamps($$widgets_graphs_stamp_quarter(_e_0));
    } else {
      return $lib_dates_stamps($$widgets_graphs_stamp_minute(_e_0));
    }
  }
}

function $widgets_graphs_fmt_val(_e_0, _k_0, _v_0) {
  if (_v_0.$ === "VRaw") {
    const _s_0 = _v_0["s"];
    return $lib_units_show_raw($$lib_env_units(_e_0), _k_0, _s_0);
  } else {
    const _x_0 = _v_0["x"];
    return $lib_units_show($$lib_env_units(_e_0), _k_0, _x_0);
  }
}

function $widgets_graphs_points(_ts_0, _vs_0, _e_0, _k_0) {
  if (_ts_0.$ === "Con") {
    const _t_0 = _ts_0["head"];
    const _tr_0 = _ts_0["tail"];
    if (_vs_0.$ === "Con") {
      const _v_0 = _vs_0["head"];
      const _vr_0 = _vs_0["tail"];
      return {$: "Con", "head": {$: "Point", "x": _t_0, "y": $$widgets_graphs_fmt_val(_e_0, _k_0, _v_0)}, "tail": $$widgets_graphs_points(_tr_0, _vr_0, _e_0, _k_0)};
    } else {
      return {$: "Nil"};
    }
  } else {
    return {$: "Nil"};
  }
}

function $widgets_graphs_values(_vs_0, _e_0, _k_0) {
  if (_vs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _v_0 = _vs_0["head"];
    const _rest_0 = _vs_0["tail"];
    return {$: "Con", "head": $$widgets_graphs_fmt_val(_e_0, _k_0, _v_0), "tail": $$widgets_graphs_values(_rest_0, _e_0, _k_0)};
  }
}

function $widgets_graphs_labels(_ts_0, _f_0) {
  if (_ts_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _t_0 = _ts_0["head"];
    const _rest_0 = _ts_0["tail"];
    return {$: "Con", "head": {$: "Label", "at": _t_0, "format": _f_0}, "tail": $$widgets_graphs_labels(_rest_0, _f_0)};
  }
}

function $widgets_graphs_unit_tag(_e_0, _b_0) {
  const _x_0 = $$lib_env_label(_e_0, $$widgets_graphs_unit(_b_0));
  const _x_1 = (_x_0 + ")");
  return (" (" + _x_1);
}

function $widgets_graphs_axis_label(_e_0, _b_0) {
  const _x_0 = $$lib_env_word(_e_0, $$widgets_graphs_label_word(_b_0));
  const _x_1 = $$widgets_graphs_unit_tag(_e_0, _b_0);
  return (_x_0 + _x_1);
}

function $widgets_graphs_legend_word(_b_0, _second_0) {
  if (_b_0.$ === "GTemp") {
    return $Bool_pick(_second_0, {$: "WGraphMin"}, {$: "WGraphMax"});
  } else {
    return $Bool_pick(_second_0, {$: "WWindSpeedGust"}, {$: "WWindSpeedAverage"});
  }
}

function $widgets_graphs_line_sets(_e_0, _snap_0, _b_0, _s_0) {
  const _ts_0 = $$widgets_graphs_stamps(_snap_0, _b_0, _s_0);
  const _k_0 = $$widgets_graphs_unit(_b_0);
  const _d0_0 = {$: "SPoints", "points": $$widgets_graphs_points(_ts_0, $$widgets_graphs_series_of(_snap_0, $$widgets_graphs_src(_b_0, _s_0)), _e_0, _k_0)};
  const _both_0 = $$widgets_graphs_two(_b_0, _s_0);
  const _x_0 = $$lib_env_word(_e_0, $$widgets_graphs_legend_word(_b_0, false));
  const _x_1 = $$widgets_graphs_unit_tag(_e_0, _b_0);
  const _l0_0 = $$Bool_pick(_both_0, (_x_0 + _x_1), $$widgets_graphs_axis_label(_e_0, _b_0));
  const _first_0 = {$: "Dataset", "label": _l0_0, "style": $$widgets_graphs_style(_b_0), "data": _d0_0};
  const _x_2 = $$lib_env_word(_e_0, $$widgets_graphs_legend_word(_b_0, true));
  const _x_3 = $$widgets_graphs_unit_tag(_e_0, _b_0);
  const _second_0 = {$: "Dataset", "label": (_x_2 + _x_3), "style": $$widgets_graphs_style2(_b_0), "data": {$: "SPoints", "points": $$widgets_graphs_points(_ts_0, $$widgets_graphs_series_of(_snap_0, $$widgets_graphs_src2(_b_0)), _e_0, _k_0)}};
  return $Bool_pick(_both_0, {$: "Con", "head": _first_0, "tail": {$: "Con", "head": _second_0, "tail": {$: "Nil"}}}, {$: "Con", "head": _first_0, "tail": {$: "Nil"}});
}

function $widgets_graphs_bar_set(_e_0, _snap_0, _b_0, _s_0) {
  return {$: "Dataset", "label": $$widgets_graphs_axis_label(_e_0, _b_0), "style": $$widgets_graphs_style(_b_0), "data": {$: "SValues", "values": $$widgets_graphs_values($$widgets_graphs_series_of(_snap_0, $$widgets_graphs_src(_b_0, _s_0)), _e_0, $$widgets_graphs_unit(_b_0))}};
}

function $widgets_graphs_bar_labels(_snap_0, _b_0, _s_0) {
  return $widgets_graphs_labels($$widgets_graphs_stamps(_snap_0, _b_0, _s_0), $$widgets_graphs_time_display(_b_0, _s_0));
}

function $widgets_graphs_white() {
  return "rgba(255, 255, 255, 1)";
}

function $widgets_graphs_px(_w_0, _pct_0) {
  const _x_0 = Math.fround(_w_0 * _pct_0);
  return {$: "SizePx", "px": Math.fround(_x_0 / 100)};
}

function $widgets_graphs_formats(_day_0) {
  return {$: "Con", "head": {$: "Fmt", "unit": "day", "format": _day_0}, "tail": {$: "Con", "head": {$: "Fmt", "unit": "hour", "format": "HH:mm"}, "tail": {$: "Con", "head": {$: "Fmt", "unit": "millisecond", "format": "h:mm:ss.SSS a"}, "tail": {$: "Con", "head": {$: "Fmt", "unit": "minute", "format": "HH:mm"}, "tail": {$: "Con", "head": {$: "Fmt", "unit": "month", "format": "MMM YYYY"}, "tail": {$: "Con", "head": {$: "Fmt", "unit": "quarter", "format": "[Q]Q - YYYY"}, "tail": {$: "Con", "head": {$: "Fmt", "unit": "second", "format": "h:mm:ss a"}, "tail": {$: "Con", "head": {$: "Fmt", "unit": "week", "format": "ll"}, "tail": {$: "Con", "head": {$: "Fmt", "unit": "year", "format": "YYYY"}, "tail": {$: "Nil"}}}}}}}}}};
}

function $widgets_graphs_small_x(_bar_0, _unit_s_0, _w_0) {
  return $Bool_pick(_bar_0, {$: "XCategory", "size": $$widgets_graphs_px(_w_0, 4)}, {$: "XTime", "unit": _unit_s_0, "step": 1, "formats": {$: "Con", "head": {$: "Fmt", "unit": "hour", "format": "HH:mm"}, "tail": {$: "Nil"}}, "skip": true, "skip_pad": 0, "size": $$widgets_graphs_px(_w_0, 4)});
}

function $widgets_graphs_small_empty(_bar_0, _w_0) {
  return {$: "Chart", "kind": $$Bool_pick(_bar_0, "bar", "line"), "labels": {$: "Nil"}, "datasets": {$: "Nil"}, "background": $$widgets_graphs_white(), "title": {$: "TShow", "text": "Custom Chart Title", "size": $$widgets_graphs_px(_w_0, 5)}, "x": $$widgets_graphs_small_x(_bar_0, "hour", _w_0), "y": {$: "YAxis", "label_display": true, "label": {$: "LNull"}, "label_size": $$widgets_graphs_px(_w_0, 5), "ticks": {$: "Nil"}, "tick_size": $$widgets_graphs_px(_w_0, 5)}, "legend": {$: "LegendAuto"}};
}

function $widgets_graphs_small_unsized(_bar_0) {
  return {$: "Chart", "kind": $$Bool_pick(_bar_0, "bar", "line"), "labels": {$: "Nil"}, "datasets": {$: "Nil"}, "background": $$widgets_graphs_white(), "title": {$: "TShow", "text": "Custom Chart Title", "size": {$: "SizeAuto"}}, "x": $$Bool_pick(_bar_0, {$: "XCategory", "size": {$: "SizeAuto"}}, {$: "XTime", "unit": "hour", "step": 1, "formats": {$: "Con", "head": {$: "Fmt", "unit": "hour", "format": "HH:mm"}, "tail": {$: "Nil"}}, "skip": true, "skip_pad": 0, "size": {$: "SizeAuto"}}), "y": {$: "YAxis", "label_display": true, "label": {$: "LNull"}, "label_size": {$: "SizeAuto"}, "ticks": {$: "Nil"}, "tick_size": {$: "SizeAuto"}}, "legend": {$: "LegendAuto"}};
}

function $widgets_graphs_chart_labels(_bar_0, _snap_0, _b_0, _s_0) {
  if (_bar_0) {
    return $widgets_graphs_bar_labels(_snap_0, _b_0, _s_0);
  } else {
    return {$: "Nil"};
  }
}

function $widgets_graphs_chart_sets(_bar_0, _e_0, _snap_0, _b_0, _s_0) {
  if (_bar_0) {
    return {$: "Con", "head": $$widgets_graphs_bar_set(_e_0, _snap_0, _b_0, _s_0), "tail": {$: "Nil"}};
  } else {
    return $widgets_graphs_line_sets(_e_0, _snap_0, _b_0, _s_0);
  }
}

function $widgets_graphs_small_chart(_e_0, _snap_0, _b_0, _s_0, _w_0) {
  const _bar_0 = $$widgets_graphs_is_bar(_b_0);
  return {$: "Chart", "kind": $$Bool_pick(_bar_0, "bar", "line"), "labels": $$widgets_graphs_chart_labels(_bar_0, _snap_0, _b_0, _s_0), "datasets": $$widgets_graphs_chart_sets(_bar_0, _e_0, _snap_0, _b_0, _s_0), "background": $$widgets_graphs_white(), "title": {$: "TShow", "text": $$widgets_graphs_title(_e_0, _b_0, _s_0), "size": $$widgets_graphs_px(_w_0, 5)}, "x": $$widgets_graphs_small_x(_bar_0, $$widgets_graphs_time_display(_b_0, _s_0), _w_0), "y": {$: "YAxis", "label_display": true, "label": {$: "LText", "text": $$widgets_graphs_axis_label(_e_0, _b_0)}, "label_size": $$widgets_graphs_px(_w_0, 5), "ticks": $$widgets_graphs_ticks(_b_0), "tick_size": $$widgets_graphs_px(_w_0, 5)}, "legend": {$: "LegendAuto"}};
}

function $widgets_graphs_modal_empty() {
  return {$: "Chart", "kind": "line", "labels": {$: "Nil"}, "datasets": {$: "Nil"}, "background": $$widgets_graphs_white(), "title": {$: "TNone"}, "x": {$: "XTime", "unit": "hour", "step": 1, "formats": $$widgets_graphs_formats("MMM D"), "skip": true, "skip_pad": 0, "size": {$: "SizeAuto"}}, "y": {$: "YAxis", "label_display": true, "label": {$: "LNull"}, "label_size": {$: "SizePx", "px": 20}, "ticks": {$: "Nil"}, "tick_size": {$: "SizeAuto"}}, "legend": {$: "LegendShow", "display": false}};
}

function $widgets_graphs_modal_y(_e_0, _b_0) {
  return {$: "YAxis", "label_display": true, "label": {$: "LText", "text": $$widgets_graphs_axis_label(_e_0, _b_0)}, "label_size": {$: "SizePx", "px": 20}, "ticks": $$widgets_graphs_ticks(_b_0), "tick_size": {$: "SizeAuto"}};
}

function $widgets_graphs_modal_chart_go(_bar_0, _e_0, _snap_0, _b_0, _s_0) {
  if (_bar_0) {
    return {$: "Chart", "kind": "bar", "labels": $$widgets_graphs_bar_labels(_snap_0, _b_0, _s_0), "datasets": {$: "Con", "head": $$widgets_graphs_bar_set(_e_0, _snap_0, _b_0, _s_0), "tail": {$: "Nil"}}, "background": $$widgets_graphs_white(), "title": {$: "TNone"}, "x": {$: "XCategory", "size": {$: "SizeAuto"}}, "y": $$widgets_graphs_modal_y(_e_0, _b_0), "legend": {$: "LegendAuto"}};
  } else {
    const _week_0 = $$String_eq($$widgets_graphs_span_key(_s_0), "quarterDailyWeek");
    return {$: "Chart", "kind": "line", "labels": {$: "Nil"}, "datasets": $$widgets_graphs_line_sets(_e_0, _snap_0, _b_0, _s_0), "background": $$widgets_graphs_white(), "title": {$: "TNone"}, "x": {$: "XTime", "unit": $$widgets_graphs_time_display(_b_0, _s_0), "step": 1, "formats": $$widgets_graphs_formats($$Bool_pick(_week_0, "ddd", "MMM D")), "skip": true, "skip_pad": 0, "size": {$: "SizeAuto"}}, "y": $$widgets_graphs_modal_y(_e_0, _b_0), "legend": {$: "LegendShow", "display": $$widgets_graphs_two(_b_0, _s_0)}};
  }
}

function $widgets_graphs_modal_chart(_e_0, _snap_0, _b_0, _s_0) {
  return $widgets_graphs_modal_chart_go($$widgets_graphs_is_bar(_b_0), _e_0, _snap_0, _b_0, _s_0);
}

function $widgets_graphs_hit(_id_0) {
  const _x_0 = $$String_eq(_id_0, "graphClose");
  const _x_1 = $$String_eq(_id_0, "myModal");
  return $Bool_pick($$String_eq(_id_0, "baroGraphCanvas01"), {$: "HSmall", "g": {$: "GsBaro"}}, $$Bool_pick($$String_eq(_id_0, "rainGraphCanvas01"), {$: "HSmall", "g": {$: "GsRain"}}, $$Bool_pick($$String_eq(_id_0, "tempGraphCanvas01"), {$: "HSmall", "g": {$: "GsTemp"}}, $$Bool_pick($$String_eq(_id_0, "windGraphCanvas01"), {$: "HSmall", "g": {$: "GsWind"}}, $$Bool_pick($$String_eq(_id_0, "ModalCanvas"), {$: "HModal"}, $$Bool_pick($$String_eq(_id_0, "GraphsButton"), {$: "HButton"}, $$Bool_pick((_x_0 || _x_1), {$: "HClose"}, {$: "HNone"})))))));
}

function $widgets_graphs_small_on(_s_0) {
  const _on_0 = _s_0["on"];
  return _on_0;
}

function $widgets_graphs_small_w(_s_0) {
  const _w_0 = _s_0["w"];
  return _w_0;
}

function $widgets_graphs_gs_canvas(_g_0) {
  if (_g_0.$ === "GsBaro") {
    return "baroGraphCanvas01";
  } else if (_g_0.$ === "GsRain") {
    return "rainGraphCanvas01";
  } else if (_g_0.$ === "GsTemp") {
    return "tempGraphCanvas01";
  } else {
    return "windGraphCanvas01";
  }
}

function $widgets_graphs_gs_base(_g_0) {
  if (_g_0.$ === "GsBaro") {
    return {$: "GBaro"};
  } else if (_g_0.$ === "GsRain") {
    return {$: "GRainBar"};
  } else if (_g_0.$ === "GsTemp") {
    return {$: "GTemp"};
  } else {
    return {$: "GWindSpeed"};
  }
}

function $widgets_graphs_gs_span(_g_0) {
  if (_g_0.$ === "GsRain") {
    return {$: "SpDailyMonth"};
  } else {
    return {$: "SpHourlyDay"};
  }
}

function $widgets_graphs_small_of(_st_0, _g_0) {
  const _baro_0 = _st_0["baro"];
  const _rain_0 = _st_0["rain"];
  const _temp_0 = _st_0["temp"];
  const _wind_0 = _st_0["wind"];
  if (_g_0.$ === "GsBaro") {
    return _baro_0;
  } else if (_g_0.$ === "GsRain") {
    return _rain_0;
  } else if (_g_0.$ === "GsTemp") {
    return _temp_0;
  } else {
    return _wind_0;
  }
}

function $widgets_graphs_with_small(_st_0, _g_0, _s_0) {
  const _snap_0 = _st_0["snap"];
  const _ready_0 = _st_0["ready"];
  const _modal_0 = _st_0["modal"];
  const _handler_0 = _st_0["handler"];
  const _has_cur_0 = _st_0["has_cur"];
  const _cb_0 = _st_0["cur_b"];
  const _cs_0 = _st_0["cur_s"];
  const _baro_0 = _st_0["baro"];
  const _rain_0 = _st_0["rain"];
  const _temp_0 = _st_0["temp"];
  const _wind_0 = _st_0["wind"];
  const _vw_0 = _st_0["vw"];
  const _vh_0 = _st_0["vh"];
  if (_g_0.$ === "GsBaro") {
    return {$: "St", "snap": _snap_0, "ready": _ready_0, "modal": _modal_0, "handler": _handler_0, "has_cur": _has_cur_0, "cur_b": _cb_0, "cur_s": _cs_0, "baro": _s_0, "rain": _rain_0, "temp": _temp_0, "wind": _wind_0, "vw": _vw_0, "vh": _vh_0};
  } else if (_g_0.$ === "GsRain") {
    return {$: "St", "snap": _snap_0, "ready": _ready_0, "modal": _modal_0, "handler": _handler_0, "has_cur": _has_cur_0, "cur_b": _cb_0, "cur_s": _cs_0, "baro": _baro_0, "rain": _s_0, "temp": _temp_0, "wind": _wind_0, "vw": _vw_0, "vh": _vh_0};
  } else if (_g_0.$ === "GsTemp") {
    return {$: "St", "snap": _snap_0, "ready": _ready_0, "modal": _modal_0, "handler": _handler_0, "has_cur": _has_cur_0, "cur_b": _cb_0, "cur_s": _cs_0, "baro": _baro_0, "rain": _rain_0, "temp": _s_0, "wind": _wind_0, "vw": _vw_0, "vh": _vh_0};
  } else {
    return {$: "St", "snap": _snap_0, "ready": _ready_0, "modal": _modal_0, "handler": _handler_0, "has_cur": _has_cur_0, "cur_b": _cb_0, "cur_s": _cs_0, "baro": _baro_0, "rain": _rain_0, "temp": _temp_0, "wind": _s_0, "vw": _vw_0, "vh": _vh_0};
  }
}

function $widgets_graphs_snap_of(_st_0) {
  const _snap_0 = _st_0["snap"];
  return _snap_0;
}

function $widgets_graphs_ready_of(_st_0) {
  const _ready_0 = _st_0["ready"];
  return _ready_0;
}

function $widgets_graphs_modal_of(_st_0) {
  const _modal_0 = _st_0["modal"];
  return _modal_0;
}

function $widgets_graphs_handler_of(_st_0) {
  const _handler_0 = _st_0["handler"];
  return _handler_0;
}

function $widgets_graphs_with_cur(_st_0, _b_0, _s_0) {
  const _snap_0 = _st_0["snap"];
  const _ready_0 = _st_0["ready"];
  const _modal_0 = _st_0["modal"];
  const _handler_0 = _st_0["handler"];
  const _baro_0 = _st_0["baro"];
  const _rain_0 = _st_0["rain"];
  const _temp_0 = _st_0["temp"];
  const _wind_0 = _st_0["wind"];
  const _vw_0 = _st_0["vw"];
  const _vh_0 = _st_0["vh"];
  return {$: "St", "snap": _snap_0, "ready": _ready_0, "modal": _modal_0, "handler": _handler_0, "has_cur": true, "cur_b": _b_0, "cur_s": _s_0, "baro": _baro_0, "rain": _rain_0, "temp": _temp_0, "wind": _wind_0, "vw": _vw_0, "vh": _vh_0};
}

function $widgets_graphs_with_view(_st_0, _vw_0, _vh_0) {
  const _snap_0 = _st_0["snap"];
  const _ready_0 = _st_0["ready"];
  const _modal_0 = _st_0["modal"];
  const _handler_0 = _st_0["handler"];
  const _has_cur_0 = _st_0["has_cur"];
  const _cb_0 = _st_0["cur_b"];
  const _cs_0 = _st_0["cur_s"];
  const _baro_0 = _st_0["baro"];
  const _rain_0 = _st_0["rain"];
  const _temp_0 = _st_0["temp"];
  const _wind_0 = _st_0["wind"];
  return {$: "St", "snap": _snap_0, "ready": _ready_0, "modal": _modal_0, "handler": _handler_0, "has_cur": _has_cur_0, "cur_b": _cb_0, "cur_s": _cs_0, "baro": _baro_0, "rain": _rain_0, "temp": _temp_0, "wind": _wind_0, "vw": _vw_0, "vh": _vh_0};
}

function $widgets_graphs_with_snap(_st_0, _e_0) {
  const _modal_0 = _st_0["modal"];
  const _handler_0 = _st_0["handler"];
  const _has_cur_0 = _st_0["has_cur"];
  const _cb_0 = _st_0["cur_b"];
  const _cs_0 = _st_0["cur_s"];
  const _baro_0 = _st_0["baro"];
  const _rain_0 = _st_0["rain"];
  const _temp_0 = _st_0["temp"];
  const _wind_0 = _st_0["wind"];
  const _vw_0 = _st_0["vw"];
  const _vh_0 = _st_0["vh"];
  return {$: "St", "snap": _e_0, "ready": true, "modal": _modal_0, "handler": _handler_0, "has_cur": _has_cur_0, "cur_b": _cb_0, "cur_s": _cs_0, "baro": _baro_0, "rain": _rain_0, "temp": _temp_0, "wind": _wind_0, "vw": _vw_0, "vh": _vh_0};
}

function $widgets_graphs_first_base(_e_0) {
  return $Maybe_default($$List_head($$widgets_graphs_enabled(_e_0)), {$: "GBaro"});
}

function $widgets_graphs_init(_e_0) {
  const _b_0 = $$lib_env_on(_e_0, "graphHandlerBarometer.enabled");
  const _r_0 = $$Bool_and(_b_0, $$lib_env_on(_e_0, "graphHandlerRainfall.enabled"));
  const _t_0 = $$Bool_and(_r_0, $$lib_env_on(_e_0, "graphHandlerTemperature.enabled"));
  const _w_0 = $$Bool_and(_t_0, $$lib_env_on(_e_0, "graphHandlerWindSpeed.enabled"));
  const _any_0 = $$Bool_not($$List_is_empty($$widgets_graphs_enabled(_e_0)));
  const _modal_0 = $$Bool_and($$Bool_and(_w_0, $$lib_env_on(_e_0, "graphHandler.enabled")), _any_0);
  const _fb_0 = $$widgets_graphs_first_base(_e_0);
  const _x_0 = $$Bool_not($$lib_env_on(_e_0, "graphHandler.enabled"));
  return {$: "St", "snap": _e_0, "ready": false, "modal": _modal_0, "handler": $$Bool_and($$Bool_and(_w_0, $$lib_env_on(_e_0, "modalHandler.enabled")), (_any_0 || _x_0)), "has_cur": _modal_0, "cur_b": _fb_0, "cur_s": $$widgets_graphs_first_span(_fb_0), "baro": {$: "Small", "on": _b_0, "shown": false, "w": 0}, "rain": {$: "Small", "on": _r_0, "shown": false, "w": 0}, "temp": {$: "Small", "on": _t_0, "shown": false, "w": 0}, "wind": {$: "Small", "on": _w_0, "shown": false, "w": 0}, "vw": 0, "vh": 0};
}

function $widgets_graphs_small_w_css(_w_0) {
  const _x_0 = $$lib_num_show(_w_0);
  return (_x_0 + "px");
}

function $widgets_graphs_small_h_css(_w_0) {
  const _x_0 = Math.fround(_w_0 * 665);
  const _x_1 = $$lib_num_show(Math.fround(_x_0 / 1000));
  return (_x_1 + "px");
}

function $widgets_graphs_small_size(_g_0, _w_0) {
  return {$: "CChartSize", "id": $$widgets_graphs_gs_canvas(_g_0), "w": $$widgets_graphs_small_w_css(_w_0), "h": $$widgets_graphs_small_h_css(_w_0)};
}

function $widgets_graphs_modal_dim(_vw_0, _vh_0) {
  return $Bool_pick((_vh_0 <= _vw_0), _vh_0, _vw_0);
}

function $widgets_graphs_modal_size(_st_0) {
  const _vw_0 = _st_0["vw"];
  const _vh_0 = _st_0["vh"];
  const _d_0 = $$widgets_graphs_modal_dim(_vw_0, _vh_0);
  const _x_0 = Math.fround(_d_0 * 8);
  const _x_1 = $$lib_num_show(Math.fround(_x_0 / 10));
  const _x_2 = Math.fround(_d_0 * 4);
  const _x_3 = $$lib_num_show(Math.fround(_x_2 / 10));
  return {$: "CChartSize", "id": "ModalCanvas", "w": (_x_1 + "px"), "h": (_x_3 + "px")};
}

function $widgets_graphs_small_shown(_s_0) {
  const _shown_0 = _s_0["shown"];
  return _shown_0;
}

function $widgets_graphs_small_view_go(_shown_0, _snap_0, _e_0, _g_0, _w_0) {
  if (_shown_0) {
    return $widgets_graphs_small_chart(_e_0, _snap_0, $$widgets_graphs_gs_base(_g_0), $$widgets_graphs_gs_span(_g_0), _w_0);
  } else {
    return $widgets_graphs_small_empty($$widgets_graphs_is_bar($$widgets_graphs_gs_base(_g_0)), _w_0);
  }
}

function $widgets_graphs_small_view(_st_0, _e_0, _g_0, _w_0) {
  return $widgets_graphs_small_view_go($$widgets_graphs_small_shown($$widgets_graphs_small_of(_st_0, _g_0)), $$widgets_graphs_snap_of(_st_0), _e_0, _g_0, _w_0);
}

function $widgets_graphs_configure_small_go(_inited_0, _st_0, _e_0, _g_0) {
  if (!_inited_0) {
    return {$: "Out", "st": _st_0, "cmds": {$: "Nil"}, "ok": false};
  } else {
    const _w_0 = $$widgets_graphs_small_w($$widgets_graphs_small_of(_st_0, _g_0));
    const _st2_0 = $$widgets_graphs_with_small(_st_0, _g_0, {$: "Small", "on": true, "shown": true, "w": _w_0});
    return {$: "Out", "st": _st2_0, "cmds": {$: "Con", "head": {$: "CChart", "id": $$widgets_graphs_gs_canvas(_g_0), "chart": $$widgets_graphs_small_view(_st2_0, _e_0, _g_0, _w_0)}, "tail": {$: "Con", "head": $$widgets_graphs_small_size(_g_0, _w_0), "tail": {$: "Nil"}}}, "ok": true};
  }
}

function $widgets_graphs_configure_small_ready(_ready_0, _st_0, _e_0, _g_0) {
  if (!_ready_0) {
    return {$: "Out", "st": _st_0, "cmds": {$: "Nil"}, "ok": false};
  } else {
    return $widgets_graphs_configure_small_go($$widgets_graphs_small_on($$widgets_graphs_small_of(_st_0, _g_0)), _st_0, _e_0, _g_0);
  }
}

function $widgets_graphs_configure_small_on(_on_0, _st_0, _e_0, _g_0) {
  if (!_on_0) {
    return {$: "Out", "st": _st_0, "cmds": {$: "Con", "head": {$: "CLog", "text": "Graph not enabled."}, "tail": {$: "Nil"}}, "ok": true};
  } else {
    return $widgets_graphs_configure_small_ready($$widgets_graphs_ready_of(_st_0), _st_0, _e_0, _g_0);
  }
}

function $widgets_graphs_configure_small(_st_0, _e_0, _g_0) {
  return $widgets_graphs_configure_small_on($$widgets_graphs_base_on(_e_0, $$widgets_graphs_gs_base(_g_0)), _st_0, _e_0, _g_0);
}

function $widgets_graphs_configure_modal_go(_inited_0, _st_0, _e_0, _b_0, _s_0) {
  if (!_inited_0) {
    return {$: "Out", "st": _st_0, "cmds": {$: "Nil"}, "ok": false};
  } else {
    const _bd_0 = $$widgets_graphs_border($$widgets_graphs_style(_b_0));
    return {$: "Out", "st": _st_0, "cmds": {$: "Con", "head": {$: "CChart", "id": "ModalCanvas", "chart": $$widgets_graphs_modal_chart(_e_0, $$widgets_graphs_snap_of(_st_0), _b_0, _s_0)}, "tail": {$: "Con", "head": {$: "CHtml", "id": "graphHeaderText", "html": $$widgets_graphs_title(_e_0, _b_0, _s_0)}, "tail": {$: "Con", "head": {$: "CStyle", "id": "graphHeader", "prop": "backgroundColor", "value": _bd_0}, "tail": {$: "Con", "head": {$: "CStyle", "id": "graphFooter", "prop": "backgroundColor", "value": _bd_0}, "tail": {$: "Con", "head": $$widgets_graphs_modal_size(_st_0), "tail": {$: "Nil"}}}}}}, "ok": true};
  }
}

function $widgets_graphs_configure_modal_ready(_ready_0, _st_0, _e_0, _b_0, _s_0) {
  if (!_ready_0) {
    return {$: "Out", "st": _st_0, "cmds": {$: "Nil"}, "ok": false};
  } else {
    return $widgets_graphs_configure_modal_go($$widgets_graphs_modal_of(_st_0), _st_0, _e_0, _b_0, _s_0);
  }
}

function $widgets_graphs_configure_modal_on(_on_0, _st_0, _e_0, _b_0, _s_0) {
  if (!_on_0) {
    return {$: "Out", "st": _st_0, "cmds": {$: "Nil"}, "ok": false};
  } else {
    return $widgets_graphs_configure_modal_ready($$widgets_graphs_ready_of(_st_0), $$widgets_graphs_with_cur(_st_0, _b_0, _s_0), _e_0, _b_0, _s_0);
  }
}

function $widgets_graphs_configure_modal(_st_0, _e_0, _b_0, _s_0) {
  return $widgets_graphs_configure_modal_on($$widgets_graphs_base_on(_e_0, _b_0), _st_0, _e_0, _b_0, _s_0);
}

function $widgets_graphs_configure_current_go(_has_cur_0, _st_0, _e_0, _cb_0, _cs_0) {
  if (_has_cur_0) {
    return $widgets_graphs_configure_modal(_st_0, _e_0, _cb_0, _cs_0);
  } else {
    return {$: "Out", "st": _st_0, "cmds": {$: "Nil"}, "ok": false};
  }
}

function $widgets_graphs_configure_current(_st_0, _e_0) {
  const __0 = _st_0["snap"];
  const __1 = _st_0["ready"];
  const __2 = _st_0["modal"];
  const __3 = _st_0["handler"];
  const _has_cur_0 = _st_0["has_cur"];
  const _cb_0 = _st_0["cur_b"];
  const _cs_0 = _st_0["cur_s"];
  const __4 = _st_0["baro"];
  const __5 = _st_0["rain"];
  const __6 = _st_0["temp"];
  const __7 = _st_0["wind"];
  const __8 = _st_0["vw"];
  const __9 = _st_0["vh"];
  return $widgets_graphs_configure_current_go(_has_cur_0, {$: "St", "snap": __0, "ready": __1, "modal": __2, "handler": __3, "has_cur": _has_cur_0, "cur_b": _cb_0, "cur_s": _cs_0, "baro": __4, "rain": __5, "temp": __6, "wind": __7, "vw": __8, "vh": __9}, _e_0, _cb_0, _cs_0);
}

function $widgets_graphs_after(_cmds_0, _o_0) {
  const _st2_0 = _o_0["st"];
  const _cmds2_0 = _o_0["cmds"];
  const _ok2_0 = _o_0["ok"];
  return {$: "Out", "st": _st2_0, "cmds": $$widgets_graphs_cat(_cmds_0, _cmds2_0), "ok": _ok2_0};
}

function $widgets_graphs_then_small(_o_0, _e_0, _g_0) {
  const _st_0 = _o_0["st"];
  const _cmds_0 = _o_0["cmds"];
  const _t_0 = _o_0["ok"];
  if (!_t_0) {
    return {$: "Out", "st": _st_0, "cmds": _cmds_0, "ok": false};
  } else {
    return $widgets_graphs_after(_cmds_0, $$widgets_graphs_configure_small(_st_0, _e_0, _g_0));
  }
}

function $widgets_graphs_then_current(_o_0, _e_0) {
  const _st_0 = _o_0["st"];
  const _cmds_0 = _o_0["cmds"];
  const _t_0 = _o_0["ok"];
  if (!_t_0) {
    return {$: "Out", "st": _st_0, "cmds": _cmds_0, "ok": false};
  } else {
    return $widgets_graphs_after(_cmds_0, $$widgets_graphs_configure_current(_st_0, _e_0));
  }
}

function $widgets_graphs_chart_defaults() {
  return $lib_chart_defaults();
}

function $widgets_graphs_start_small_go(_gs_0, _st_0) {
  if (_gs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _g_0 = _gs_0["head"];
    const _rest_0 = _gs_0["tail"];
    const _r_0 = $$widgets_graphs_start_small_go(_rest_0, _st_0);
    return $Bool_pick($$widgets_graphs_small_on($$widgets_graphs_small_of(_st_0, _g_0)), {$: "Con", "head": {$: "CChart", "id": $$widgets_graphs_gs_canvas(_g_0), "chart": $$widgets_graphs_small_unsized($$widgets_graphs_is_bar($$widgets_graphs_gs_base(_g_0)))}, "tail": _r_0}, _r_0);
  }
}

function $widgets_graphs_start_small(_st_0, _e_0) {
  const _gs_0 = {$: "Con", "head": {$: "GsBaro"}, "tail": {$: "Con", "head": {$: "GsRain"}, "tail": {$: "Con", "head": {$: "GsTemp"}, "tail": {$: "Con", "head": {$: "GsWind"}, "tail": {$: "Nil"}}}}};
  return {$: "Out", "st": _st_0, "cmds": $$widgets_graphs_start_small_go(_gs_0, _st_0), "ok": $$widgets_graphs_small_on($$widgets_graphs_small_of(_st_0, {$: "GsWind"}))};
}

function $widgets_graphs_hide(_on_0, _id_0) {
  return $Bool_pick(_on_0, {$: "Nil"}, {$: "Con", "head": {$: "CStyle", "id": _id_0, "prop": "display", "value": "none"}, "tail": {$: "Nil"}});
}

function $widgets_graphs_start_lists(_e_0) {
  return $widgets_graphs_cat($$widgets_graphs_hide($$widgets_graphs_base_on(_e_0, {$: "GBaro"}), "baroGraphCanvas01"), $$widgets_graphs_cat($$widgets_graphs_hide($$widgets_graphs_base_on(_e_0, {$: "GTemp"}), "tempGraphCanvas01"), $$widgets_graphs_cat($$widgets_graphs_hide($$widgets_graphs_base_on(_e_0, {$: "GWindSpeed"}), "windGraphCanvas01"), $$widgets_graphs_hide($$widgets_graphs_base_on(_e_0, {$: "GRainBar"}), "rainGraphCanvas01"))));
}

function $widgets_graphs_options_spans(_ss_0, _e_0, _b_0) {
  if (_ss_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _s_0 = _ss_0["head"];
    const _rest_0 = _ss_0["tail"];
    const _x_0 = $$widgets_graphs_base_key(_b_0);
    const _x_1 = $$widgets_graphs_span_key(_s_0);
    return {$: "Con", "head": {$: "COption", "id": "selectMenu", "value": (_x_0 + _x_1), "text": $$widgets_graphs_title(_e_0, _b_0, _s_0)}, "tail": $$widgets_graphs_options_spans(_rest_0, _e_0, _b_0)};
  }
}

function $widgets_graphs_options_go(_bs_0, _e_0) {
  if (_bs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _b_0 = _bs_0["head"];
    const _rest_0 = _bs_0["tail"];
    return $widgets_graphs_cat($$widgets_graphs_options_spans($$widgets_graphs_spans(_b_0), _e_0, _b_0), $$widgets_graphs_options_go(_rest_0, _e_0));
  }
}

function $widgets_graphs_start_modal(_st_0, _e_0) {
  const _m_0 = $$Bool_pick($$widgets_graphs_modal_of(_st_0), {$: "Con", "head": {$: "CChart", "id": "ModalCanvas", "chart": $$widgets_graphs_modal_empty()}, "tail": {$: "Nil"}}, {$: "Nil"});
  const _h_0 = $$Bool_pick($$widgets_graphs_handler_of(_st_0), $$widgets_graphs_cat({$: "Con", "head": {$: "CStyle", "id": "myModal", "prop": "display", "value": "none"}, "tail": {$: "Nil"}}, $$widgets_graphs_cat($$widgets_graphs_options_go($$widgets_graphs_enabled(_e_0), _e_0), {$: "Con", "head": {$: "CHtml", "id": "GraphsButton", "html": $$lib_env_word(_e_0, {$: "WButtonLabelGraphs"})}, "tail": {$: "Nil"}})), {$: "Nil"});
  const _crash_0 = $$Bool_and($$Bool_and($$lib_env_on(_e_0, "graphHandler.enabled"), $$widgets_graphs_small_on($$widgets_graphs_small_of(_st_0, {$: "GsWind"}))), $$List_is_empty($$widgets_graphs_enabled(_e_0)));
  return {$: "Out", "st": _st_0, "cmds": $$widgets_graphs_cat(_m_0, _h_0), "ok": $$Bool_not(_crash_0)};
}

function $widgets_graphs_canvases_go(_gs_0, _st_0) {
  if (_gs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _g_0 = _gs_0["head"];
    const _rest_0 = _gs_0["tail"];
    const _r_0 = $$widgets_graphs_canvases_go(_rest_0, _st_0);
    return $Bool_pick($$widgets_graphs_small_on($$widgets_graphs_small_of(_st_0, _g_0)), {$: "Con", "head": $$widgets_graphs_gs_canvas(_g_0), "tail": _r_0}, _r_0);
  }
}

function $widgets_graphs_small_canvases(_st_0) {
  const _gs_0 = {$: "Con", "head": {$: "GsBaro"}, "tail": {$: "Con", "head": {$: "GsRain"}, "tail": {$: "Con", "head": {$: "GsTemp"}, "tail": {$: "Con", "head": {$: "GsWind"}, "tail": {$: "Nil"}}}}};
  return $widgets_graphs_canvases_go(_gs_0, _st_0);
}

function $widgets_graphs_modal_canvases(_st_0) {
  return $Bool_pick($$widgets_graphs_modal_of(_st_0), {$: "Con", "head": "ModalCanvas", "tail": {$: "Nil"}}, {$: "Nil"});
}

function $widgets_graphs_resize_small_go(_on_0, _shown_0, _st_0, _e_0, _g_0, _w_0) {
  if (_on_0) {
    const _st2_0 = $$widgets_graphs_with_small(_st_0, _g_0, {$: "Small", "on": true, "shown": _shown_0, "w": _w_0});
    return {$: "Out", "st": _st2_0, "cmds": {$: "Con", "head": {$: "CChart", "id": $$widgets_graphs_gs_canvas(_g_0), "chart": $$widgets_graphs_small_view(_st2_0, _e_0, _g_0, _w_0)}, "tail": {$: "Con", "head": $$widgets_graphs_small_size(_g_0, _w_0), "tail": {$: "Nil"}}}, "ok": true};
  } else {
    return {$: "Out", "st": _st_0, "cmds": {$: "Nil"}, "ok": true};
  }
}

function $widgets_graphs_resize_small(_st_0, _e_0, _g_0, _w_0) {
  return $widgets_graphs_resize_small_go($$widgets_graphs_small_on($$widgets_graphs_small_of(_st_0, _g_0)), $$widgets_graphs_small_shown($$widgets_graphs_small_of(_st_0, _g_0)), _st_0, _e_0, _g_0, _w_0);
}

function $widgets_graphs_resize_modal_go(_on_0, _st_0, _vw_0, _vh_0) {
  if (_on_0) {
    const _st2_0 = $$widgets_graphs_with_view(_st_0, _vw_0, _vh_0);
    return {$: "Out", "st": _st2_0, "cmds": {$: "Con", "head": $$widgets_graphs_modal_size(_st2_0), "tail": {$: "Nil"}}, "ok": true};
  } else {
    return {$: "Out", "st": _st_0, "cmds": {$: "Nil"}, "ok": true};
  }
}

function $widgets_graphs_resize_modal(_st_0, _vw_0, _vh_0) {
  return $widgets_graphs_resize_modal_go($$widgets_graphs_modal_of(_st_0), _st_0, _vw_0, _vh_0);
}

function $widgets_graphs_resize_go(_h_0, _st_0, _e_0, _b_0) {
  if (_h_0.$ === "HSmall") {
    const _g_0 = _h_0["g"];
    const _gw_0 = _b_0["gw"];
    return $widgets_graphs_resize_small(_st_0, _e_0, _g_0, _gw_0);
  } else if (_h_0.$ === "HModal") {
    const _vw_0 = _b_0["vw"];
    const _vh_0 = _b_0["vh"];
    return $widgets_graphs_resize_modal(_st_0, _vw_0, _vh_0);
  } else {
    return {$: "Out", "st": _st_0, "cmds": {$: "Nil"}, "ok": true};
  }
}

function $widgets_graphs_resize(_st_0, _e_0, _id_0, _b_0) {
  return $widgets_graphs_resize_go($$widgets_graphs_hit(_id_0), _st_0, _e_0, _b_0);
}

function $widgets_graphs_data(_st_0, _e_0) {
  const _o_0 = {$: "Out", "st": $$widgets_graphs_with_snap(_st_0, _e_0), "cmds": {$: "Nil"}, "ok": true};
  return $widgets_graphs_then_current($$widgets_graphs_then_small($$widgets_graphs_then_small($$widgets_graphs_then_small($$widgets_graphs_then_small(_o_0, _e_0, {$: "GsRain"}), _e_0, {$: "GsTemp"}), _e_0, {$: "GsWind"}), _e_0, {$: "GsBaro"}), _e_0);
}

function $widgets_graphs_units(_st_0, _e_0, _k_0) {
  if (_k_0.$ === "Pressure") {
    return $widgets_graphs_configure_small(_st_0, _e_0, {$: "GsBaro"});
  } else if (_k_0.$ === "Wind") {
    return $widgets_graphs_configure_small(_st_0, _e_0, {$: "GsWind"});
  } else if (_k_0.$ === "Rainfall") {
    return $widgets_graphs_configure_small(_st_0, _e_0, {$: "GsRain"});
  } else if (_k_0.$ === "Temp") {
    return $widgets_graphs_configure_small(_st_0, _e_0, {$: "GsTemp"});
  } else {
    return {$: "Out", "st": _st_0, "cmds": {$: "Nil"}, "ok": true};
  }
}

function $widgets_graphs_open_go(_st_0, _e_0, _b_0, _s_0) {
  const _x_0 = $$widgets_graphs_base_key(_b_0);
  const _x_1 = $$widgets_graphs_span_key(_s_0);
  return $widgets_graphs_after({$: "Con", "head": {$: "CValue", "id": "selectMenu", "value": (_x_0 + _x_1)}, "tail": {$: "Con", "head": {$: "CStyle", "id": "myModal", "prop": "display", "value": "block"}, "tail": {$: "Nil"}}}, $$widgets_graphs_configure_modal(_st_0, _e_0, _b_0, _s_0));
}

function $widgets_graphs_open_if(_handler_0, _st_0, _e_0, _b_0, _s_0) {
  if (_handler_0) {
    return $widgets_graphs_open_go(_st_0, _e_0, _b_0, _s_0);
  } else {
    return {$: "Out", "st": _st_0, "cmds": {$: "Nil"}, "ok": true};
  }
}

function $widgets_graphs_open(_st_0, _e_0, _b_0, _s_0) {
  return $widgets_graphs_open_if($$widgets_graphs_handler_of(_st_0), _st_0, _e_0, _b_0, _s_0);
}

function $widgets_graphs_open_current_go(_go_0, _handler_0, _st_0, _e_0, _cb_0, _cs_0) {
  if (_go_0) {
    return $widgets_graphs_open_go(_st_0, _e_0, _cb_0, _cs_0);
  } else {
    return {$: "Out", "st": _st_0, "cmds": {$: "Nil"}, "ok": $$Bool_not(_handler_0)};
  }
}

function $widgets_graphs_open_current(_st_0, _e_0) {
  const __0 = _st_0["snap"];
  const __1 = _st_0["ready"];
  const __2 = _st_0["modal"];
  const _handler_0 = _st_0["handler"];
  const _has_cur_0 = _st_0["has_cur"];
  const _cb_0 = _st_0["cur_b"];
  const _cs_0 = _st_0["cur_s"];
  const __3 = _st_0["baro"];
  const __4 = _st_0["rain"];
  const __5 = _st_0["temp"];
  const __6 = _st_0["wind"];
  const __7 = _st_0["vw"];
  const __8 = _st_0["vh"];
  return $widgets_graphs_open_current_go($$Bool_and(_handler_0, _has_cur_0), _handler_0, {$: "St", "snap": __0, "ready": __1, "modal": __2, "handler": _handler_0, "has_cur": _has_cur_0, "cur_b": _cb_0, "cur_s": _cs_0, "baro": __3, "rain": __4, "temp": __5, "wind": __6, "vw": __7, "vh": __8}, _e_0, _cb_0, _cs_0);
}

function $widgets_graphs_close(_st_0) {
  return {$: "Out", "st": _st_0, "cmds": $$Bool_pick($$widgets_graphs_handler_of(_st_0), {$: "Con", "head": {$: "CStyle", "id": "myModal", "prop": "display", "value": "none"}, "tail": {$: "Nil"}}, {$: "Nil"}), "ok": true};
}

function $widgets_graphs_click_go(_h_0, _st_0, _e_0) {
  if (_h_0.$ === "HSmall") {
    const _g_0 = _h_0["g"];
    return $widgets_graphs_open(_st_0, _e_0, $$widgets_graphs_gs_base(_g_0), $$widgets_graphs_gs_span(_g_0));
  } else if (_h_0.$ === "HButton") {
    return $widgets_graphs_open_current(_st_0, _e_0);
  } else if (_h_0.$ === "HClose") {
    return $widgets_graphs_close(_st_0);
  } else {
    return {$: "Out", "st": _st_0, "cmds": {$: "Nil"}, "ok": true};
  }
}

function $widgets_graphs_click(_st_0, _e_0, _id_0) {
  return $widgets_graphs_click_go($$widgets_graphs_hit(_id_0), _st_0, _e_0);
}

function $widgets_graphs_pick_spans(_ss_0, _b_0, _v_0) {
  if (_ss_0.$ === "Nil") {
    return {$: "Pick", "found": false, "b": _b_0, "s": {$: "SpHourlyDay"}};
  } else {
    const _s_0 = _ss_0["head"];
    const _rest_0 = _ss_0["tail"];
    const _x_0 = $$widgets_graphs_base_key(_b_0);
    const _x_1 = $$widgets_graphs_span_key(_s_0);
    return $Bool_pick($$String_eq((_x_0 + _x_1), _v_0), {$: "Pick", "found": true, "b": _b_0, "s": _s_0}, $$widgets_graphs_pick_spans(_rest_0, _b_0, _v_0));
  }
}

function $widgets_graphs_pick_found(_p_0) {
  const _f_0 = _p_0["found"];
  return _f_0;
}

function $widgets_graphs_pick_go(_bs_0, _v_0) {
  if (_bs_0.$ === "Nil") {
    return {$: "Pick", "found": false, "b": {$: "GBaro"}, "s": {$: "SpHourlyDay"}};
  } else {
    const _b_0 = _bs_0["head"];
    const _rest_0 = _bs_0["tail"];
    const _p_0 = $$widgets_graphs_pick_spans($$widgets_graphs_spans(_b_0), _b_0, _v_0);
    return $Bool_pick($$widgets_graphs_pick_found(_p_0), _p_0, $$widgets_graphs_pick_go(_rest_0, _v_0));
  }
}

function $widgets_graphs_change_if(_found_0, _st_0, _e_0, _b_0, _s_0) {
  if (_found_0) {
    return $widgets_graphs_configure_modal(_st_0, _e_0, _b_0, _s_0);
  } else {
    return {$: "Out", "st": _st_0, "cmds": {$: "Nil"}, "ok": false};
  }
}

function $widgets_graphs_change_go(_p_0, _st_0, _e_0) {
  const _found_0 = _p_0["found"];
  const _b_0 = _p_0["b"];
  const _s_0 = _p_0["s"];
  return $widgets_graphs_change_if(_found_0, _st_0, _e_0, _b_0, _s_0);
}

function $widgets_graphs_select_go(_go_0, _st_0, _e_0, _value_0) {
  if (_go_0) {
    return $widgets_graphs_change_go($$widgets_graphs_pick_go($$widgets_graphs_enabled(_e_0), _value_0), _st_0, _e_0);
  } else {
    return {$: "Out", "st": _st_0, "cmds": {$: "Nil"}, "ok": true};
  }
}

function $widgets_graphs_select(_st_0, _e_0, _id_0, _value_0) {
  return $widgets_graphs_select_go($$Bool_and($$String_eq(_id_0, "selectMenu"), $$widgets_graphs_handler_of(_st_0)), _st_0, _e_0, _value_0);
}

function $widgets_forecast_init(_e_0) {
  return {$: "St", "stored": "Waiting for data...", "broken": false};
}

function $widgets_forecast_enabled(_e_0) {
  return $lib_env_on(_e_0, "forecastHandler.enabled");
}

function $widgets_forecast_spaces(_s_0) {
  if (_s_0 === "") {
    return "";
  } else {
    const _c_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    return ($$Bool_pick($$Char_is_eq(_c_0, "_"), " ", _c_0) + $$widgets_forecast_spaces(_t_0));
  }
}

function $widgets_forecast_cut(_s_0, _n_0) {
  const _x_0 = [...str_out(_s_0)].length;
  return $String_take(_s_0, (_x_0 < _n_0 ? 0 : _x_0 - _n_0));
}

function $widgets_forecast_cands(_ws_0, _edited_0, _more_0) {
  if (_ws_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _w_0 = _ws_0["head"];
    const _rest_0 = _ws_0["tail"];
    const _x_0 = [...str_out(_w_0)].length;
    const _e2_0 = $$widgets_forecast_cut(_edited_0, nat_chk(_x_0 + 1));
    return {$: "Con", "head": (_e2_0 + _more_0), "tail": $$widgets_forecast_cands(_rest_0, _e2_0, _more_0)};
  }
}

function $widgets_forecast_show(_e_0, _text_0) {
  const _orig_0 = $$widgets_forecast_spaces(_text_0);
  const _x_0 = $$lib_env_word(_e_0, {$: "WForcastShowMore"});
  const _x_1 = (_x_0 + " </a>");
  const _more_0 = ("... <a id=\"showMoreLink\", href=\"#\"> " + _x_1);
  const _ws_0 = $$List_reverse($$String_split(_orig_0, " "));
  return {$: "Con", "head": {$: "CHtml", "id": "modalForecastDiv", "html": _orig_0}, "tail": {$: "Con", "head": {$: "CFit", "id": "forecastText", "prop": "innerHTML", "values": {$: "Con", "head": _orig_0, "tail": $$widgets_forecast_cands(_ws_0, _orig_0, _more_0)}, "test": {$: "FitsInside"}}, "tail": {$: "Nil"}}};
}

function $widgets_forecast_start(_e_0) {
  return $Bool_pick($$widgets_forecast_enabled(_e_0), {$: "Con", "head": {$: "CHtml", "id": "forecastHeaderText", "html": $$lib_env_word(_e_0, {$: "WForecastTitle"})}, "tail": {$: "Con", "head": {$: "CStyle", "id": "forecastModal", "prop": "display", "value": "none"}, "tail": {$: "Nil"}}}, {$: "Nil"});
}

function $widgets_forecast_has_go(_missing_0, _st_0, _e_0, _t_0) {
  if (_missing_0) {
    return {$: "FOut", "st": {$: "St", "stored": _t_0, "broken": true}, "cmds": {$: "Nil"}};
  } else {
    const _t2_0 = $$Bool_pick($$String_eq(_t_0, "---"), "", _t_0);
    return {$: "FOut", "st": {$: "St", "stored": _t2_0, "broken": false}, "cmds": $$widgets_forecast_show(_e_0, _t2_0)};
  }
}

function $widgets_forecast_cre_length(_e_0) {
  const _cre_0 = _e_0["cre"];
  return $List_length(_cre_0);
}

function $widgets_forecast_data_go(_on_0, _st_0, _e_0) {
  if (!_on_0) {
    return {$: "FOut", "st": _st_0, "cmds": {$: "Nil"}};
  } else {
    return $widgets_forecast_has_go($$Nat_is_le($$widgets_forecast_cre_length(_e_0), (531 )), _st_0, _e_0, $$lib_env_cre(_e_0, (531 )));
  }
}

function $widgets_forecast_data(_st_0, _e_0) {
  return $widgets_forecast_data_go($$widgets_forecast_enabled(_e_0), _st_0, _e_0);
}

function $widgets_forecast_size(_id_0, _w_0, _h_0) {
  const _x_0 = $$lib_num_show(_w_0);
  const _ws_0 = (_x_0 + "px");
  const _x_1 = $$lib_num_show(_h_0);
  const _hs_0 = (_x_1 + "px");
  const _x_2 = (";height:" + _hs_0);
  const _x_3 = (_ws_0 + _x_2);
  return {$: "Con", "head": {$: "CAttr", "id": _id_0, "name": "style", "value": ("width:" + _x_3)}, "tail": {$: "Con", "head": {$: "CStyle", "id": _id_0, "prop": "width", "value": _ws_0}, "tail": {$: "Con", "head": {$: "CStyle", "id": _id_0, "prop": "height", "value": _hs_0}, "tail": {$: "Nil"}}}};
}

function $widgets_forecast_redo(_st_0, _e_0) {
  const _stored_0 = _st_0["stored"];
  const _broken_0 = _st_0["broken"];
  return $Bool_pick(_broken_0, {$: "Nil"}, $$widgets_forecast_show(_e_0, _stored_0));
}

function $widgets_forecast_resize_go(_on_0, _st_0, _e_0, _b_0) {
  if (!_on_0) {
    return {$: "Nil"};
  } else {
    const _ph_0 = _b_0["ph"];
    const _vw_0 = _b_0["vw"];
    const _vh_0 = _b_0["vh"];
    const _side_0 = $$Bool_pick((_vh_0 <= _vw_0), _vh_0, _vw_0);
    const _x_0 = Math.fround(_ph_0 * 1);
    const _x_1 = Math.fround(_ph_0 * 1);
    const _x_2 = Math.fround(_side_0 * 0.4000000059604645);
    return $List_append($$widgets_forecast_size("forecastText", Math.fround(_x_0 * 6.190000057220459), Math.fround(_x_1 * 0.5899999737739563)), $$List_append($$widgets_forecast_size("modalForecastDiv", Math.fround(_x_2 * 2), Math.fround(_side_0 * 0.4000000059604645)), $$widgets_forecast_redo(_st_0, _e_0)));
  }
}

function $widgets_forecast_resize(_st_0, _e_0, _b_0) {
  return $widgets_forecast_resize_go($$widgets_forecast_enabled(_e_0), _st_0, _e_0, _b_0);
}

function $widgets_forecast_click(_e_0, _id_0) {
  return $Bool_pick($$Bool_and($$widgets_forecast_enabled(_e_0), $$String_eq(_id_0, "showMoreLink")), {$: "Con", "head": {$: "CStyle", "id": "forecastModal", "prop": "display", "value": "block"}, "tail": {$: "Nil"}}, $$Bool_pick($$Bool_and($$widgets_forecast_enabled(_e_0), $$String_eq(_id_0, "forecastClose")), {$: "Con", "head": {$: "CStyle", "id": "forecastModal", "prop": "display", "value": "none"}, "tail": {$: "Nil"}}, {$: "Nil"}));
}

function $widgets_records_scan_ok(_sc_0) {
  const _ok_0 = _sc_0["ok"];
  return _ok_0;
}

function $widgets_records_scan_v(_sc_0) {
  const _v_0 = _sc_0["v"];
  return _v_0;
}

function $widgets_records_scan_len(_sc_0) {
  const _n_0 = _sc_0["len"];
  return _n_0;
}

function $widgets_records_scan_rest(_sc_0) {
  const _r_0 = _sc_0["rest"];
  return _r_0;
}

function $widgets_records_skip_nd(_s_0) {
  if (_s_0 === "") {
    return "";
  } else {
    const _c_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    return $Bool_pick($$Char_is_digit(_c_0), (_c_0 + _t_0), $$widgets_records_skip_nd(_t_0));
  }
}

function $widgets_records_lead_d(_s_0) {
  if (_s_0 === "") {
    return "";
  } else {
    const _c_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    return $Bool_pick($$Char_is_digit(_c_0), (_c_0 + $$widgets_records_lead_d(_t_0)), "");
  }
}

function $widgets_records_dval($0, $1) {
  for (;;) {
    {
      const _s_0 = $0;
      const _acc_0 = $1;
      if (_s_0 === "") {
        return _acc_0;
      } else {
        const _c_0 = _s_0.slice(0, char_len(_s_0));
        const _t_0 = _s_0.slice(char_len(_s_0));
        const _x_0 = $$Char_to_u32(_c_0);
        const _x_1 = (Math.imul(_acc_0, 10) >>> 0);
        const _x_2 = ((_x_0 - 48) >>> 0);
        $0 = _t_0;
        $1 = ((_x_1 + _x_2) >>> 0);
        continue;
      }
    }
  }
}

function $widgets_records_num(_s_0, _max_0) {
  const _t_0 = $$widgets_records_skip_nd(_s_0);
  const _ds_0 = $$String_take($$widgets_records_lead_d(_t_0), _max_0);
  const _n_0 = [...str_out(_ds_0)].length;
  return {$: "Scan", "ok": $$Nat_is_gt(_n_0, 0), "v": $$widgets_records_dval(_ds_0, 0), "len": _n_0, "rest": $$String_drop(_t_0, _n_0)};
}

function $widgets_records_after_c(_s_0, _c_0, _orig_0) {
  if (_s_0 === "") {
    return _orig_0;
  } else {
    const _h_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    return $Bool_pick($$Char_is_eq(_h_0, _c_0), _t_0, $$widgets_records_after_c(_t_0, _c_0, _orig_0));
  }
}

function $widgets_records_lit(_s_0, _c_0) {
  return $widgets_records_after_c(_s_0, _c_0, _s_0);
}

function $widgets_records_in_range(_x_0, _lo_0, _hi_0) {
  return $Bool_and((_x_0 >= _lo_0), (_x_0 <= _hi_0));
}

function $widgets_records_word_char(_c_0) {
  const _x_0 = $$Char_to_u32(_c_0);
  const _x_1 = $$Char_is_alpha(_c_0);
  const _x_2 = (_x_0 === 39);
  const _x_3 = (_x_1 || _x_2);
  const _x_4 = $$widgets_records_in_range(_x_0, 160, 1791);
  const _x_5 = (_x_3 || _x_4);
  const _x_6 = $$widgets_records_in_range(_x_0, 1792, 55295);
  const _x_7 = (_x_5 || _x_6);
  const _x_8 = $$widgets_records_in_range(_x_0, 63744, 64975);
  const _x_9 = (_x_7 || _x_8);
  const _x_10 = $$widgets_records_in_range(_x_0, 65008, 65287);
  const _x_11 = (_x_9 || _x_10);
  const _x_12 = $$widgets_records_in_range(_x_0, 65296, 65519);
  return (_x_11 || _x_12);
}

function $widgets_records_wordy(_s_0) {
  if (_s_0 === "") {
    return false;
  } else {
    const _c_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    const _x_0 = $$widgets_records_word_char(_c_0);
    const _x_1 = $$widgets_records_wordy(_t_0);
    return (_x_0 || _x_1);
  }
}

function $widgets_records_is_leap(_y_0) {
  const _x_0 = (4 === 0 ? _y_0 : _y_0 % 4);
  const _x_1 = (100 === 0 ? _y_0 : _y_0 % 100);
  const _x_2 = (400 === 0 ? _y_0 : _y_0 % 400);
  const _x_3 = $$Bool_and((_x_0 === 0), (_x_1 !== 0));
  const _x_4 = (_x_2 === 0);
  return (_x_3 || _x_4);
}

function $widgets_records_dim(_y_0, _m_0) {
  const _x_0 = ((_m_0 - 1) >>> 0);
  const _x_1 = (7 === 0 ? _x_0 : _x_0 % 7);
  const _x_2 = (2 === 0 ? _x_1 : _x_1 % 2);
  return $Bool_pick((_m_0 === 2), $$Bool_pick($$widgets_records_is_leap(_y_0), 29, 28), ((31 - _x_2) >>> 0));
}

function $widgets_records_civil(_y_0, _m_0, _d_0) {
  const _x_0 = ((_y_0 + 400) >>> 0);
  const _x_1 = $$Bool_pick((_m_0 <= 2), 1, 0);
  const _yy_0 = ((_x_0 - _x_1) >>> 0);
  const _era_0 = (400 === 0 ? 0 : (_yy_0 / 400) >>> 0);
  const _x_2 = (Math.imul(_era_0, 400) >>> 0);
  const _yoe_0 = ((_yy_0 - _x_2) >>> 0);
  const _mp_0 = $$Bool_pick((_m_0 > 2), ((_m_0 - 3) >>> 0), ((_m_0 + 9) >>> 0));
  const _x_3 = (Math.imul(153, _mp_0) >>> 0);
  const _x_4 = ((_x_3 + 2) >>> 0);
  const _x_5 = (5 === 0 ? 0 : (_x_4 / 5) >>> 0);
  const _x_6 = ((_x_5 + _d_0) >>> 0);
  const _doy_0 = ((_x_6 - 1) >>> 0);
  const _x_7 = (Math.imul(_yoe_0, 365) >>> 0);
  const _x_8 = (4 === 0 ? 0 : (_yoe_0 / 4) >>> 0);
  const _x_9 = ((_x_7 + _x_8) >>> 0);
  const _x_10 = (100 === 0 ? 0 : (_yoe_0 / 100) >>> 0);
  const _x_11 = ((_x_9 - _x_10) >>> 0);
  const _doe_0 = ((_x_11 + _doy_0) >>> 0);
  const _x_12 = (Math.imul(_era_0, 146097) >>> 0);
  return ((_x_12 + _doe_0) >>> 0);
}

function $widgets_records_clock_year(_c_0) {
  const _y_0 = _c_0["year"];
  return _y_0;
}

function $widgets_records_clock_month(_c_0) {
  const _m_0 = _c_0["month"];
  return _m_0;
}

function $widgets_records_clock_day(_c_0) {
  const _d_0 = _c_0["day"];
  return _d_0;
}

function $widgets_records_make(_hy_0, _y_0, _hmo_0, _mo_0, _hd_0, _d_0, _hh_0, _h_0, _hmi_0, _mi_0, _hs_0, _s_0, _any_0, _bad_0, _c_0) {
  const _y2_0 = $$Bool_pick(_hy_0, _y_0, $$widgets_records_clock_year(_c_0));
  const _mo2_0 = $$Bool_pick(_hmo_0, _mo_0, $$Bool_pick(_hy_0, 1, $$widgets_records_clock_month(_c_0)));
  const _d2_0 = $$Bool_pick(_hd_0, _d_0, $$Bool_pick((_hy_0 || _hmo_0), 1, $$widgets_records_clock_day(_c_0)));
  const _h2_0 = $$Bool_pick(_hh_0, _h_0, 0);
  const _mi2_0 = $$Bool_pick(_hmi_0, _mi_0, 0);
  const _s2_0 = $$Bool_pick(_hs_0, _s_0, 0);
  const _h24_0 = (_h2_0 === 24);
  const _x_0 = $$Bool_not($$widgets_records_in_range(_mo2_0, 1, 12));
  const _x_1 = $$Bool_not($$widgets_records_in_range(_d2_0, 1, $$widgets_records_dim(_y2_0, _mo2_0)));
  const _x_2 = (_x_0 || _x_1);
  const _x_3 = (_h2_0 > 24);
  const _x_4 = (_mi2_0 !== 0);
  const _x_5 = (_s2_0 !== 0);
  const _x_6 = (_x_2 || _x_3);
  const _x_7 = $$Bool_and(_h24_0, (_x_4 || _x_5));
  const _x_8 = (_x_6 || _x_7);
  const _x_9 = (_mi2_0 > 59);
  const _x_10 = (_x_8 || _x_9);
  const _x_11 = (_s2_0 > 59);
  const _over_0 = (_x_10 || _x_11);
  const _feb0_0 = $$Bool_and($$Bool_and((_y2_0 === 0), (_mo2_0 === 2)), (_d2_0 === 29));
  const _x_12 = $$widgets_records_civil(_y2_0, _mo2_0, _d2_0);
  const _x_13 = $$Bool_pick(_feb0_0, 1, 0);
  const _x_14 = ((_x_12 + _x_13) >>> 0);
  const _x_15 = $$Bool_pick(_h24_0, 1, 0);
  const _days_0 = ((_x_14 + _x_15) >>> 0);
  const _x_16 = $$Bool_pick(_h24_0, 0, _h2_0);
  const _x_17 = (Math.imul(_x_16, 3600) >>> 0);
  const _x_18 = (Math.imul(_mi2_0, 60) >>> 0);
  const _x_19 = ((_x_17 + _x_18) >>> 0);
  return {$: "Mom", "ok": $$Bool_and($$Bool_and(_any_0, $$Bool_not(_bad_0)), $$Bool_not(_over_0)), "days": _days_0, "tod": ((_x_19 + _s2_0) >>> 0)};
}

function $widgets_records_year_of(_sc_0) {
  const _v_0 = $$widgets_records_scan_v(_sc_0);
  const _x_0 = $$Bool_pick((_v_0 > 68), 1900, 2000);
  return $Bool_pick($$Nat_is_eq($$widgets_records_scan_len(_sc_0), 2), ((_v_0 + _x_0) >>> 0), _v_0);
}

function $widgets_records_parse_rec(_s_0, _c_0) {
  const _h_0 = $$widgets_records_num(_s_0, 2);
  const _mi_0 = $$widgets_records_num($$widgets_records_lit($$widgets_records_scan_rest(_h_0), ":"), 2);
  const _d_0 = $$widgets_records_num($$widgets_records_lit($$widgets_records_scan_rest(_mi_0), " "), 2);
  const _mo_0 = $$widgets_records_num($$widgets_records_scan_rest(_d_0), 2);
  const _y_0 = $$widgets_records_num($$widgets_records_scan_rest(_mo_0), 4);
  const _x_0 = $$widgets_records_scan_ok(_h_0);
  const _x_1 = $$widgets_records_scan_ok(_mi_0);
  const _x_2 = (_x_0 || _x_1);
  const _x_3 = $$widgets_records_scan_ok(_d_0);
  const _x_4 = (_x_2 || _x_3);
  const _x_5 = $$widgets_records_scan_ok(_mo_0);
  const _x_6 = (_x_4 || _x_5);
  const _x_7 = $$widgets_records_scan_ok(_y_0);
  return $widgets_records_make($$widgets_records_scan_ok(_y_0), $$widgets_records_year_of(_y_0), $$widgets_records_scan_ok(_mo_0), $$widgets_records_scan_v(_mo_0), $$widgets_records_scan_ok(_d_0), $$widgets_records_scan_v(_d_0), $$widgets_records_scan_ok(_h_0), $$widgets_records_scan_v(_h_0), $$widgets_records_scan_ok(_mi_0), $$widgets_records_scan_v(_mi_0), false, 0, (_x_6 || _x_7), false, _c_0);
}

function $widgets_records_parse_now(_e_0) {
  const _x_0 = $$lib_env_cr(_e_0, 31);
  const _x_1 = $$lib_env_cr(_e_0, 74);
  const _x_2 = $$lib_env_cr(_e_0, 30);
  const _x_3 = (_x_0 + _x_1);
  const _x_4 = $$lib_env_cr(_e_0, 29);
  const _x_5 = (_x_2 + _x_3);
  const _s_0 = (_x_4 + _x_5);
  const _h_0 = $$widgets_records_num(_s_0, 2);
  const _m1_0 = $$widgets_records_num($$widgets_records_scan_rest(_h_0), 2);
  const _sec_0 = $$widgets_records_num($$widgets_records_scan_rest(_m1_0), 2);
  const _m2_0 = $$widgets_records_num($$widgets_records_lit($$widgets_records_scan_rest(_sec_0), "/"), 2);
  const _x_6 = $$widgets_records_scan_ok(_m1_0);
  const _x_7 = $$widgets_records_scan_ok(_m2_0);
  const _x_8 = $$widgets_records_scan_ok(_h_0);
  const _x_9 = $$widgets_records_scan_ok(_m1_0);
  const _x_10 = (_x_8 || _x_9);
  const _x_11 = $$widgets_records_scan_ok(_sec_0);
  const _x_12 = (_x_10 || _x_11);
  const _x_13 = $$widgets_records_scan_ok(_m2_0);
  return $widgets_records_make(false, 0, false, 0, false, 0, $$widgets_records_scan_ok(_h_0), $$widgets_records_scan_v(_h_0), (_x_6 || _x_7), $$Bool_pick($$widgets_records_scan_ok(_m2_0), $$widgets_records_scan_v(_m2_0), $$widgets_records_scan_v(_m1_0)), $$widgets_records_scan_ok(_sec_0), $$widgets_records_scan_v(_sec_0), (_x_12 || _x_13), $$widgets_records_wordy($$widgets_records_scan_rest(_sec_0)), $$lib_env_clock(_e_0));
}

function $widgets_records_mom_ok(_m_0) {
  const _ok_0 = _m_0["ok"];
  return _ok_0;
}

function $widgets_records_mom_days(_m_0) {
  const _d_0 = _m_0["days"];
  return _d_0;
}

function $widgets_records_mom_tod(_m_0) {
  const _t_0 = _m_0["tod"];
  return _t_0;
}

function $widgets_records_colour(_now_0, _rec_0) {
  const _a_0 = $$widgets_records_mom_days(_now_0);
  const _b_0 = $$widgets_records_mom_days(_rec_0);
  const _x_0 = $$widgets_records_mom_tod(_now_0);
  const _x_1 = $$widgets_records_mom_tod(_rec_0);
  const _back_0 = $$Bool_pick((_x_0 < _x_1), 1, 0);
  const _x_2 = ((_a_0 - _b_0) >>> 0);
  const _diff_0 = ((_x_2 - _back_0) >>> 0);
  const _x_3 = (_a_0 <= _b_0);
  const _x_4 = (_diff_0 < 2);
  const _red_0 = (_x_3 || _x_4);
  const _yellow_0 = (_diff_0 <= 7);
  return $Bool_pick($$Bool_and($$widgets_records_mom_ok(_now_0), $$widgets_records_mom_ok(_rec_0)), $$Bool_pick(_red_0, "rgb(245, 141, 122)", $$Bool_pick(_yellow_0, "rgb(236, 242, 98)", "rgb(157, 235, 99)")), "rgb(157, 235, 99)");
}

function $widgets_records_rec_set(_r_0) {
  const _s_0 = _r_0["set"];
  return _s_0;
}

function $widgets_records_rec_need(_r_0) {
  const _n_0 = _r_0["need"];
  return _n_0;
}

function $widgets_records_rec_key(_r_0) {
  const _k_0 = _r_0["key"];
  return _k_0;
}

function $widgets_records_rec(_e_0, _set_0, _w_0, _i_0, _kind_0, _suffix_0, _extra_0) {
  const _x_0 = $$lib_env_cre(_e_0, nat_chk(_i_0 + 4));
  const _x_1 = $$lib_env_cre(_e_0, nat_chk(_i_0 + 5));
  const _x_2 = $$lib_env_cre(_e_0, nat_chk(_i_0 + 3));
  const _x_3 = (_x_0 + _x_1);
  const _x_4 = (_x_2 + _x_3);
  const _x_5 = $$lib_env_cre(_e_0, nat_chk(_i_0 + 2));
  const _x_6 = (" " + _x_4);
  const _x_7 = (_x_5 + _x_6);
  const _x_8 = $$lib_env_cre(_e_0, nat_chk(_i_0 + 1));
  const _x_9 = (":" + _x_7);
  const _input_0 = (_x_8 + _x_9);
  const _x_10 = nat_chk(_i_0 + 5);
  return {$: "Rec", "set": _set_0, "need": (_x_10 > _extra_0 ? _x_10 : _extra_0), "key": $$lib_env_word(_e_0, _w_0), "value": $$lib_env_cre(_e_0, _i_0), "input": _input_0, "mom": $$widgets_records_parse_rec(_input_0, $$lib_env_clock(_e_0)), "kind": _kind_0, "suffix": _suffix_0};
}

function $widgets_records_plain(_e_0, _set_0, _w_0, _i_0, _kind_0) {
  return $widgets_records_rec(_e_0, _set_0, _w_0, _i_0, _kind_0, "", 0);
}

function $widgets_records_dir(_e_0, _set_0, _w_0, _i_0, _j_0) {
  const _x_0 = $$lib_env_cre(_e_0, _j_0);
  const _x_1 = (_x_0 + "°");
  return $widgets_records_rec(_e_0, _set_0, _w_0, _i_0, {$: "Wind"}, (", " + _x_1), _j_0);
}

function $widgets_records_entries(_e_0, _set_0, _s_0, _s2_0) {
  return {$: "Con", "head": $$widgets_records_plain(_e_0, _set_0, {$: "WRecordsHighTemp"}, _s_0, {$: "Temp"}), "tail": {$: "Con", "head": $$widgets_records_plain(_e_0, _set_0, {$: "WRecordsLowTemp"}, nat_chk(_s_0 + 6), {$: "Temp"}), "tail": {$: "Con", "head": $$widgets_records_dir(_e_0, _set_0, {$: "WRecordsHighGust"}, nat_chk(_s_0 + 12), nat_chk(_s_0 + 78)), "tail": {$: "Con", "head": $$widgets_records_rec(_e_0, _set_0, {$: "WRecordsHighRainRate"}, nat_chk(_s_0 + 18), {$: "Rainfall"}, "/min", 0), "tail": {$: "Con", "head": $$widgets_records_plain(_e_0, _set_0, {$: "WRecordsLowBaro"}, nat_chk(_s_0 + 24), {$: "Pressure"}), "tail": {$: "Con", "head": $$widgets_records_plain(_e_0, _set_0, {$: "WRecordsHighBaro"}, nat_chk(_s_0 + 30), {$: "Pressure"}), "tail": {$: "Con", "head": $$widgets_records_plain(_e_0, _set_0, {$: "WRecordsHighRainRateDaily"}, nat_chk(_s_0 + 36), {$: "Rainfall"}), "tail": {$: "Con", "head": $$widgets_records_plain(_e_0, _set_0, {$: "WRecordsHighRainRateHourly"}, nat_chk(_s_0 + 42), {$: "Rainfall"}), "tail": {$: "Con", "head": $$widgets_records_dir(_e_0, _set_0, {$: "WRecordsHighAverageWind"}, nat_chk(_s_0 + 48), nat_chk(_s_0 + 84)), "tail": {$: "Con", "head": $$widgets_records_plain(_e_0, _set_0, {$: "WRecordsLowWindChill"}, nat_chk(_s_0 + 72), {$: "Temp"}), "tail": {$: "Con", "head": $$widgets_records_plain(_e_0, _set_0, {$: "WRecordsWarmestDay"}, nat_chk(_s_0 + 90), {$: "Temp"}), "tail": {$: "Con", "head": $$widgets_records_plain(_e_0, _set_0, {$: "WRecordsColdestNight"}, nat_chk(_s_0 + 96), {$: "Temp"}), "tail": {$: "Con", "head": $$widgets_records_plain(_e_0, _set_0, {$: "WRecordsColdestDay"}, nat_chk(_s_0 + 102), {$: "Temp"}), "tail": {$: "Con", "head": $$widgets_records_plain(_e_0, _set_0, {$: "WRecordsWarmestNight"}, nat_chk(_s_0 + 108), {$: "Temp"}), "tail": {$: "Con", "head": $$widgets_records_plain(_e_0, _set_0, {$: "WRecordsHighHeatIndex"}, nat_chk(_s_0 + 114), {$: "Temp"}), "tail": {$: "Con", "head": $$widgets_records_plain(_e_0, _set_0, {$: "WRecordsHighSolar"}, _s2_0, {$: "Solar"}), "tail": {$: "Con", "head": $$widgets_records_plain(_e_0, _set_0, {$: "WRecordsHighUV"}, nat_chk(_s2_0 + 6), {$: "UV"}), "tail": {$: "Con", "head": $$widgets_records_plain(_e_0, _set_0, {$: "WRecordsHighDewPoint"}, nat_chk(_s2_0 + 69), {$: "Temp"}), "tail": {$: "Con", "head": $$widgets_records_plain(_e_0, _set_0, {$: "WRecordsLowDewPoint"}, nat_chk(_s2_0 + 75), {$: "Temp"}), "tail": {$: "Nil"}}}}}}}}}}}}}}}}}}}};
}

function $widgets_records_all_ok(_xs_0, _len_0) {
  if (_xs_0.$ === "Nil") {
    return true;
  } else {
    const _r_0 = _xs_0["head"];
    const _rest_0 = _xs_0["tail"];
    const _x_0 = $$widgets_records_rec_need(_r_0);
    return $Bool_and((_x_0 < _len_0), $$widgets_records_all_ok(_rest_0, _len_0));
  }
}

function $widgets_records_apply(_fresh_0, _old_0, _len_0, _go_0) {
  if (_fresh_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _f_0 = _fresh_0["head"];
    const _rest_0 = _fresh_0["tail"];
    const _x_0 = $$widgets_records_rec_need(_f_0);
    const _ok_0 = $$Bool_and(_go_0, (_x_0 < _len_0));
    return {$: "Con", "head": $$Bool_pick(_ok_0, _f_0, $$Maybe_default($$List_head(_old_0), _f_0)), "tail": $$widgets_records_apply(_rest_0, $$List_tail(_old_0), _len_0, _ok_0)};
  }
}

function $widgets_records_init(_e_0) {
  return {$: "St", "cur": 0, "month": $$widgets_records_entries(_e_0, false, 61, (660 )), "year": $$widgets_records_entries(_e_0, false, 187, (672 )), "all": $$widgets_records_entries(_e_0, false, (313 ), (684 )), "sized": false};
}

function $widgets_records_enabled(_e_0) {
  return $lib_env_on(_e_0, "recordHandler.enabled");
}

function $widgets_records_attr(_s_0) {
  if (_s_0 === "") {
    return "";
  } else {
    const _c_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    const _x_0 = $$Bool_pick($$Char_is_eq(_c_0, "&"), "&amp;", $$Bool_pick($$Char_is_eq(_c_0, "\""), "&quot;", (_c_0 + "")));
    const _x_1 = $$widgets_records_attr(_t_0);
    return (_x_0 + _x_1);
  }
}

function $widgets_records_row(_e_0, _r_0, _now_0) {
  const _key_0 = _r_0["key"];
  const _value_0 = _r_0["value"];
  const _input_0 = _r_0["input"];
  const _mom_0 = _r_0["mom"];
  const _kind_0 = _r_0["kind"];
  const _suffix_0 = _r_0["suffix"];
  const _x_0 = $$widgets_records_attr(_input_0);
  const _x_1 = (_x_0 + "\"></td></tr>");
  const _x_2 = ("</td><td data-date=\"" + _x_1);
  const _x_3 = $$lib_env_reading(_e_0, _kind_0, _value_0);
  const _x_4 = (_suffix_0 + _x_2);
  const _x_5 = (_x_3 + _x_4);
  const _x_6 = ("</td><td>" + _x_5);
  const _x_7 = (_key_0 + _x_6);
  const _x_8 = $$widgets_records_colour(_now_0, _mom_0);
  const _x_9 = (";\"><td>" + _x_7);
  const _x_10 = (_x_8 + _x_9);
  return ("<tr style=\"background-color: " + _x_10);
}

function $widgets_records_has(_xs_0, _k_0) {
  if (_xs_0.$ === "Nil") {
    return false;
  } else {
    const _x_0 = _xs_0["head"];
    const _rest_0 = _xs_0["tail"];
    const _x_1 = $$String_eq(_x_0, _k_0);
    const _x_2 = $$widgets_records_has(_rest_0, _k_0);
    return (_x_1 || _x_2);
  }
}

function $widgets_records_last_with($0, $1, $2) {
  for (;;) {
    {
      const _xs_0 = $0;
      const _k_0 = $1;
      const _dflt_0 = $2;
      if (_xs_0.$ === "Nil") {
        return _dflt_0;
      } else {
        const _r_0 = _xs_0["head"];
        const _rest_0 = _xs_0["tail"];
        $0 = _rest_0;
        $1 = _k_0;
        $2 = $$Bool_pick($$Bool_and($$widgets_records_rec_set(_r_0), $$String_eq($$widgets_records_rec_key(_r_0), _k_0)), _r_0, _dflt_0);
        continue;
      }
    }
  }
}

function $widgets_records_rows(_xs_0, _every_0, _seen_0, _e_0, _now_0) {
  if (_xs_0.$ === "Nil") {
    return "";
  } else {
    const _r_0 = _xs_0["head"];
    const _rest_0 = _xs_0["tail"];
    const _k_0 = $$widgets_records_rec_key(_r_0);
    const _first_0 = $$Bool_and($$widgets_records_rec_set(_r_0), $$Bool_not($$widgets_records_has(_seen_0, _k_0)));
    const _x_0 = $$Bool_pick(_first_0, $$widgets_records_row(_e_0, $$widgets_records_last_with(_every_0, _k_0, _r_0), _now_0), "");
    const _x_1 = $$widgets_records_rows(_rest_0, _every_0, $$Bool_pick(_first_0, {$: "Con", "head": _k_0, "tail": _seen_0}, _seen_0), _e_0, _now_0);
    return (_x_0 + _x_1);
  }
}

function $widgets_records_current(_st_0) {
  const _t_0 = _st_0["cur"];
  if (_t_0 == 0) {
    const _month_0 = _st_0["month"];
    return _month_0;
  } else if (_t_0 == 1) {
    const _year_1 = _st_0["year"];
    return _year_1;
  } else {
    const _all_2 = _st_0["all"];
    return _all_2;
  }
}

function $widgets_records_dates(_id_0) {
  return {$: "Con", "head": {$: "CDates", "id": _id_0, "parse": "HH:mm DDMMYYYY", "format": "HH:mm, MMM D YYYY"}, "tail": {$: "Nil"}};
}

function $widgets_records_table(_st_0, _e_0) {
  const _xs_0 = $$widgets_records_current(_st_0);
  return {$: "Con", "head": {$: "CHtml", "id": "recordsTable", "html": $$widgets_records_rows(_xs_0, _xs_0, {$: "Nil"}, _e_0, $$widgets_records_parse_now(_e_0))}, "tail": $$widgets_records_dates("recordsTable")};
}

function $widgets_records_start(_e_0) {
  return $Bool_pick($$widgets_records_enabled(_e_0), {$: "Con", "head": {$: "CHtml", "id": "recordsHeaderText", "html": $$lib_env_word(_e_0, {$: "WButtonLabelRecords"})}, "tail": {$: "Con", "head": {$: "COption", "id": "selectMenuRecords", "value": "0", "text": $$lib_env_word(_e_0, {$: "WRecordsForMonth"})}, "tail": {$: "Con", "head": {$: "COption", "id": "selectMenuRecords", "value": "1", "text": $$lib_env_word(_e_0, {$: "WRecordsForYear"})}, "tail": {$: "Con", "head": {$: "COption", "id": "selectMenuRecords", "value": "2", "text": $$lib_env_word(_e_0, {$: "WRecordsAllTime"})}, "tail": {$: "Con", "head": {$: "CStyle", "id": "recordsModal", "prop": "display", "value": "none"}, "tail": {$: "Nil"}}}}}}, {$: "Nil"});
}

function $widgets_records_cre_length(_e_0) {
  const _cre_0 = _e_0["cre"];
  return $List_length(_cre_0);
}

function $widgets_records_refresh(_st_0, _e_0) {
  return {$: "ROut", "st": _st_0, "cmds": $$widgets_records_table(_st_0, _e_0)};
}

function $widgets_records_data_go(_done_0, _st_0, _e_0, _fresh_0, _len_0) {
  if (_done_0) {
    const _cur_0 = _st_0["cur"];
    const _sized_0 = _st_0["sized"];
    return $widgets_records_refresh({$: "St", "cur": _cur_0, "month": $$widgets_records_entries(_e_0, true, 61, (660 )), "year": $$widgets_records_entries(_e_0, true, 187, (672 )), "all": _fresh_0, "sized": _sized_0}, _e_0);
  } else {
    const _cur_1 = _st_0["cur"];
    const _month_0 = _st_0["month"];
    const _year_0 = _st_0["year"];
    const _all_0 = _st_0["all"];
    const _sized_1 = _st_0["sized"];
    return {$: "ROut", "st": {$: "St", "cur": _cur_1, "month": _month_0, "year": _year_0, "all": $$widgets_records_apply(_fresh_0, _all_0, _len_0, true), "sized": _sized_1}, "cmds": {$: "Nil"}};
  }
}

function $widgets_records_data(_st_0, _e_0) {
  const _len_0 = $$widgets_records_cre_length(_e_0);
  const _fresh_0 = $$widgets_records_entries(_e_0, true, (313 ), (684 ));
  return $Bool_pick($$widgets_records_enabled(_e_0), $$widgets_records_data_go($$widgets_records_all_ok(_fresh_0, _len_0), _st_0, _e_0, _fresh_0, _len_0), {$: "ROut", "st": _st_0, "cmds": {$: "Nil"}});
}

function $widgets_records_fonts($0, $1, $2, $3, $4) {
  for (;;) {
    {
      const _fuel_0 = $0;
      const _h2_0 = $1;
      const _k_0 = $2;
      const _done_0 = $3;
      const _acc_0 = $4;
      if (_fuel_0 == 0) {
        return _acc_0;
      } else {
        const _f_0 = (_fuel_0 - 1);
        const _x_0 = Math.fround(1000 * _k_0);
        const _x_1 = Math.fround(10000 + _x_0);
        const _v_0 = $$lib_num_sharpen(Math.fround(_h2_0 / _x_1));
        const _x_2 = (_v_0 <= 0.5);
        const _x_3 = $$lib_num_show(_v_0);
        $0 = _f_0;
        $1 = _h2_0;
        $2 = Math.fround(_k_0 + 1);
        $3 = (_done_0 || _x_2);
        $4 = $$Bool_pick(_done_0, _acc_0, {$: "Con", "head": (_x_3 + "px"), "tail": _acc_0});
        continue;
      }
    }
  }
}

function $widgets_records_size(_id_0, _w_0, _h_0) {
  const _x_0 = $$lib_num_show(_w_0);
  const _ws_0 = (_x_0 + "px");
  const _x_1 = $$lib_num_show(_h_0);
  const _hs_0 = (_x_1 + "px");
  const _x_2 = (";height:" + _hs_0);
  const _x_3 = (_ws_0 + _x_2);
  return {$: "Con", "head": {$: "CAttr", "id": _id_0, "name": "style", "value": ("width:" + _x_3)}, "tail": {$: "Con", "head": {$: "CStyle", "id": _id_0, "prop": "width", "value": _ws_0}, "tail": {$: "Con", "head": {$: "CStyle", "id": _id_0, "prop": "height", "value": _hs_0}, "tail": {$: "Nil"}}}};
}

function $widgets_records_sized(_st_0) {
  const _cur_0 = _st_0["cur"];
  const _month_0 = _st_0["month"];
  const _year_0 = _st_0["year"];
  const _all_0 = _st_0["all"];
  return {$: "St", "cur": _cur_0, "month": _month_0, "year": _year_0, "all": _all_0, "sized": true};
}

function $widgets_records_was_sized(_st_0) {
  const _s_0 = _st_0["sized"];
  return _s_0;
}

function $widgets_records_resize_go(_on_0, _st_0, _e_0, _vw_0, _vh_0) {
  if (!_on_0) {
    return {$: "ROut", "st": _st_0, "cmds": {$: "Nil"}};
  } else {
    const _side_0 = $$Bool_pick((_vh_0 <= _vw_0), _vh_0, _vw_0);
    const _h_0 = Math.fround(_side_0 * 0.6000000238418579);
    const _h2_0 = Math.fround(_h_0 * _h_0);
    const _x_0 = $$lib_num_show($$lib_num_sharpen(Math.fround(_h2_0 / 10000)));
    const _f0_0 = (_x_0 + "px");
    const _x_1 = $$lib_num_nat_of(Math.fround(_h2_0 / 500));
    const _sizes_0 = {$: "Con", "head": _f0_0, "tail": $$List_reverse($$widgets_records_fonts(nat_chk(_x_1 + 3), _h2_0, 0, false, {$: "Nil"}))};
    const _st2_0 = $$widgets_records_sized(_st_0);
    const _x_2 = Math.fround(_side_0 * 0.6000000238418579);
    return {$: "ROut", "st": _st2_0, "cmds": {$: "Con", "head": {$: "CFit", "id": "recordsTable", "prop": "style.fontSize", "values": _sizes_0, "test": {$: "FitsUnder", "container": "modalRecordsDiv"}}, "tail": $$List_append($$widgets_records_size("modalRecordsDiv", Math.fround(_x_2 * 1.5), _h_0), $$Bool_pick($$widgets_records_was_sized(_st_0), {$: "Nil"}, $$widgets_records_table(_st2_0, _e_0)))}};
  }
}

function $widgets_records_resize(_st_0, _e_0, _vw_0, _vh_0) {
  return $widgets_records_resize_go($$widgets_records_enabled(_e_0), _st_0, _e_0, _vw_0, _vh_0);
}

function $widgets_records_open(_r_0) {
  const _st_0 = _r_0["st"];
  const _cmds_0 = _r_0["cmds"];
  return {$: "ROut", "st": _st_0, "cmds": {$: "Con", "head": {$: "CStyle", "id": "recordsModal", "prop": "display", "value": "block"}, "tail": _cmds_0}};
}

function $widgets_records_click_go(_button_0, _st_0, _e_0, _id_0, _vw_0, _vh_0) {
  if (_button_0) {
    return $widgets_records_open($$widgets_records_resize(_st_0, _e_0, _vw_0, _vh_0));
  } else {
    return {$: "ROut", "st": _st_0, "cmds": $$Bool_pick($$Bool_and($$widgets_records_enabled(_e_0), $$String_eq(_id_0, "recordsClose")), {$: "Con", "head": {$: "CStyle", "id": "recordsModal", "prop": "display", "value": "none"}, "tail": {$: "Nil"}}, {$: "Nil"})};
  }
}

function $widgets_records_click(_st_0, _e_0, _id_0, _vw_0, _vh_0) {
  return $widgets_records_click_go($$Bool_and($$widgets_records_enabled(_e_0), $$String_eq(_id_0, "RecordsButton")), _st_0, _e_0, _id_0, _vw_0, _vh_0);
}

function $widgets_records_with_cur(_st_0, _cur_0) {
  const _month_0 = _st_0["month"];
  const _year_0 = _st_0["year"];
  const _all_0 = _st_0["all"];
  const _sized_0 = _st_0["sized"];
  return {$: "St", "cur": _cur_0, "month": _month_0, "year": _year_0, "all": _all_0, "sized": _sized_0};
}

function $widgets_records_select_go(_known_0, _st_0, _e_0, _value_0) {
  if (!_known_0) {
    return {$: "ROut", "st": _st_0, "cmds": {$: "Nil"}};
  } else {
    const _st2_0 = $$widgets_records_with_cur(_st_0, $$Bool_pick($$String_eq(_value_0, "0"), 0, $$Bool_pick($$String_eq(_value_0, "1"), 1, 2)));
    return {$: "ROut", "st": _st2_0, "cmds": $$widgets_records_table(_st2_0, _e_0)};
  }
}

function $widgets_records_select(_st_0, _e_0, _id_0, _value_0) {
  const _x_0 = $$String_eq(_value_0, "0");
  const _x_1 = $$String_eq(_value_0, "1");
  const _x_2 = (_x_0 || _x_1);
  const _x_3 = $$String_eq(_value_0, "2");
  return $widgets_records_select_go($$Bool_and($$Bool_and($$widgets_records_enabled(_e_0), $$String_eq(_id_0, "selectMenuRecords")), (_x_2 || _x_3)), _st_0, _e_0, _value_0);
}

function $widgets_records_units(_st_0, _e_0) {
  return $Bool_pick($$widgets_records_enabled(_e_0), $$widgets_records_table(_st_0, _e_0), {$: "Nil"});
}

function $wiring_cat(_xs_0, _ys_0) {
  return $List_append(_xs_0, _ys_0);
}

function $wiring_init(_e_0, _now_0) {
  return {$: "Widgets", "apparent": $$widgets_apparent_init(_e_0), "temp1": $$widgets_tempbar_init({$: "V01"}, _e_0), "temp2": $$widgets_tempbar_init({$: "V02"}, _e_0), "temp3": $$widgets_tempbar_init({$: "V03"}, _e_0), "barometer": $$widgets_barometer_init(_e_0), "windchill": $$widgets_tempbar_init({$: "VWC"}, _e_0), "humidity": $$widgets_humidity_init(_e_0), "moonsun": $$widgets_moonsun_init(_e_0), "solar": $$widgets_solar_init(_e_0), "status": $$widgets_status_init(_e_0, _now_0), "raintitle": $$widgets_raintitle_init(_e_0), "rain1": $$widgets_rainbar_init({$: "RDay"}), "rain2": $$widgets_rainbar_init({$: "RMonth"}), "rain3": $$widgets_rainbar_init({$: "RYear"}), "uv": $$widgets_uv_init(_e_0), "winddir": $$widgets_winddir_init(_e_0), "windspeed": $$widgets_windspeed_init(_e_0), "graphs": $$widgets_graphs_init(_e_0), "forecast": $$widgets_forecast_init(_e_0), "records": $$widgets_records_init(_e_0)};
}

function $wiring_start_one(_on_0, _tips_0, _canvas_0, _tip_0) {
  if (_on_0) {
    return $Bool_pick(_tips_0, {$: "Con", "head": {$: "CTip", "id": _canvas_0, "text": _tip_0}, "tail": {$: "Nil"}}, {$: "Nil"});
  } else {
    return {$: "Con", "head": {$: "CStyle", "id": _canvas_0, "prop": "display", "value": "none"}, "tail": {$: "Nil"}};
  }
}

function $wiring_start(_w_0, _e_0) {
  const _temp1_0 = _w_0["temp1"];
  const _temp2_0 = _w_0["temp2"];
  const _temp3_0 = _w_0["temp3"];
  const _windchill_0 = _w_0["windchill"];
  const _tips_0 = $$lib_env_on(_e_0, "general.tooltipsEnabled");
  return $wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "apparent.enabled"), _tips_0, "Apparent01", $$widgets_apparent_tip(_e_0)), $$wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "temperature.enabled"), _tips_0, "TempBar01", $$widgets_tempbar_tip(_temp1_0, _e_0)), $$wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "temperature02.enabled"), _tips_0, "TempBar02", $$widgets_tempbar_tip(_temp2_0, _e_0)), $$wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "temperature03.enabled"), _tips_0, "TempBar03", $$widgets_tempbar_tip(_temp3_0, _e_0)), $$wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "barometer.enabled"), _tips_0, "Barometer01", $$widgets_barometer_tip(_e_0)), $$wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "windChill.enabled"), _tips_0, "Windchill01", $$widgets_tempbar_tip(_windchill_0, _e_0)), $$wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "humidity.enabled"), _tips_0, "HumidityGauge01", $$widgets_humidity_tip(_e_0)), $$wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "moonSun.enabled"), false, "MoonSun01", ""), $$wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "solar.enabled"), _tips_0, "SolarBar01", $$widgets_solar_tip(_e_0)), $$wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "status.enabled"), _tips_0, "Status01", $$widgets_status_tip(_e_0)), $$wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "rainfallTitle.enabled"), false, "TitleRainfall01", ""), $$wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "rainfallDay.enabled"), false, "RainBar1", ""), $$wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "rainfallMonth.enabled"), false, "RainBar2", ""), $$wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "rainfallYear.enabled"), false, "RainBar3", ""), $$wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "UV.enabled"), _tips_0, "UVBar01", $$widgets_uv_tip(_e_0)), $$wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "windDirection.enabled"), _tips_0, "WindGauge01", $$widgets_winddir_tip(_e_0)), $$wiring_cat($$wiring_start_one($$lib_env_on(_e_0, "windSpeed.enabled"), _tips_0, "WindSpeed01", $$widgets_windspeed_tip(_e_0)), {$: "Nil"})))))))))))))))));
}

function $wiring_canvas_one(_on_0, _id_0) {
  return $Bool_pick(_on_0, {$: "Con", "head": _id_0, "tail": {$: "Nil"}}, {$: "Nil"});
}

function $wiring_canvases(_e_0, _after_wc_0, _after_ms_0, _modal_0) {
  return $List_append($$wiring_canvas_one($$lib_env_on(_e_0, "apparent.enabled"), "Apparent01"), $$List_append($$wiring_canvas_one($$lib_env_on(_e_0, "temperature.enabled"), "TempBar01"), $$List_append($$wiring_canvas_one($$lib_env_on(_e_0, "temperature02.enabled"), "TempBar02"), $$List_append($$wiring_canvas_one($$lib_env_on(_e_0, "temperature03.enabled"), "TempBar03"), $$List_append($$wiring_canvas_one($$lib_env_on(_e_0, "barometer.enabled"), "Barometer01"), $$List_append($$wiring_canvas_one($$lib_env_on(_e_0, "windChill.enabled"), "Windchill01"), $$List_append(_after_wc_0, $$List_append($$wiring_canvas_one($$lib_env_on(_e_0, "humidity.enabled"), "HumidityGauge01"), $$List_append($$wiring_canvas_one($$lib_env_on(_e_0, "moonSun.enabled"), "MoonSun01"), $$List_append(_after_ms_0, $$List_append($$wiring_canvas_one($$lib_env_on(_e_0, "solar.enabled"), "SolarBar01"), $$List_append($$wiring_canvas_one($$lib_env_on(_e_0, "status.enabled"), "Status01"), $$List_append($$wiring_canvas_one($$lib_env_on(_e_0, "rainfallTitle.enabled"), "TitleRainfall01"), $$List_append($$wiring_canvas_one($$lib_env_on(_e_0, "rainfallDay.enabled"), "RainBar1"), $$List_append($$wiring_canvas_one($$lib_env_on(_e_0, "rainfallMonth.enabled"), "RainBar2"), $$List_append($$wiring_canvas_one($$lib_env_on(_e_0, "rainfallYear.enabled"), "RainBar3"), $$List_append($$wiring_canvas_one($$lib_env_on(_e_0, "UV.enabled"), "UVBar01"), $$List_append($$wiring_canvas_one($$lib_env_on(_e_0, "windDirection.enabled"), "WindGauge01"), $$List_append($$wiring_canvas_one($$lib_env_on(_e_0, "windSpeed.enabled"), "WindSpeed01"), _modal_0)))))))))))))))))));
}

function $wiring_resize_apparent(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_apparent_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_apparent(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "Apparent01", "w": $$widgets_apparent_width(_st_0), "h": $$widgets_apparent_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_apparent(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "Apparent01", "scene": $$widgets_apparent_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_data_apparent(_go_0, _st_0, _e_0, _force_0, _now_0) {
  if (_go_0) {
    return $widgets_apparent_data(_st_0, _e_0, _force_0, _now_0);
  } else {
    return _st_0;
  }
}

function $wiring_resize_temp1(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_tempbar_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_temp1(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "TempBar01", "w": $$widgets_tempbar_width(_st_0), "h": $$widgets_tempbar_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_temp1(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "TempBar01", "scene": $$widgets_tempbar_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_data_temp1(_go_0, _st_0, _e_0, _force_0, _now_0) {
  if (_go_0) {
    return $widgets_tempbar_data(_st_0, _e_0, _force_0, _now_0);
  } else {
    return _st_0;
  }
}

function $wiring_resize_temp2(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_tempbar_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_temp2(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "TempBar02", "w": $$widgets_tempbar_width(_st_0), "h": $$widgets_tempbar_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_temp2(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "TempBar02", "scene": $$widgets_tempbar_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_data_temp2(_go_0, _st_0, _e_0, _force_0, _now_0) {
  if (_go_0) {
    return $widgets_tempbar_data(_st_0, _e_0, _force_0, _now_0);
  } else {
    return _st_0;
  }
}

function $wiring_resize_temp3(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_tempbar_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_temp3(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "TempBar03", "w": $$widgets_tempbar_width(_st_0), "h": $$widgets_tempbar_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_temp3(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "TempBar03", "scene": $$widgets_tempbar_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_data_temp3(_go_0, _st_0, _e_0, _force_0, _now_0) {
  if (_go_0) {
    return $widgets_tempbar_data(_st_0, _e_0, _force_0, _now_0);
  } else {
    return _st_0;
  }
}

function $wiring_resize_barometer(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_barometer_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_barometer(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "Barometer01", "w": $$widgets_barometer_width(_st_0), "h": $$widgets_barometer_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_barometer(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "Barometer01", "scene": $$widgets_barometer_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_data_barometer(_go_0, _st_0, _e_0, _force_0, _now_0) {
  if (_go_0) {
    return $widgets_barometer_data(_st_0, _e_0, _force_0, _now_0);
  } else {
    return _st_0;
  }
}

function $wiring_resize_windchill(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_tempbar_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_windchill(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "Windchill01", "w": $$widgets_tempbar_width(_st_0), "h": $$widgets_tempbar_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_windchill(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "Windchill01", "scene": $$widgets_tempbar_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_data_windchill(_go_0, _st_0, _e_0, _force_0, _now_0) {
  if (_go_0) {
    return $widgets_tempbar_data(_st_0, _e_0, _force_0, _now_0);
  } else {
    return _st_0;
  }
}

function $wiring_resize_humidity(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_humidity_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_humidity(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "HumidityGauge01", "w": $$widgets_humidity_width(_st_0), "h": $$widgets_humidity_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_humidity(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "HumidityGauge01", "scene": $$widgets_humidity_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_data_humidity(_go_0, _st_0, _e_0, _force_0, _now_0) {
  if (_go_0) {
    return $widgets_humidity_data(_st_0, _e_0, _force_0, _now_0);
  } else {
    return _st_0;
  }
}

function $wiring_resize_moonsun(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_moonsun_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_moonsun(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "MoonSun01", "w": $$widgets_moonsun_width(_st_0), "h": $$widgets_moonsun_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_moonsun(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "MoonSun01", "scene": $$widgets_moonsun_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_data_moonsun(_go_0, _st_0, _e_0, _force_0, _now_0) {
  if (_go_0) {
    return $widgets_moonsun_data(_st_0, _e_0, _force_0, _now_0);
  } else {
    return _st_0;
  }
}

function $wiring_resize_solar(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_solar_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_solar(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "SolarBar01", "w": $$widgets_solar_width(_st_0), "h": $$widgets_solar_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_solar(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "SolarBar01", "scene": $$widgets_solar_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_data_solar(_go_0, _st_0, _e_0, _force_0, _now_0) {
  if (_go_0) {
    return $widgets_solar_data(_st_0, _e_0, _force_0, _now_0);
  } else {
    return _st_0;
  }
}

function $wiring_resize_status(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_status_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_status(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "Status01", "w": $$widgets_status_width(_st_0), "h": $$widgets_status_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_status(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "Status01", "scene": $$widgets_status_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_resize_raintitle(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_raintitle_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_raintitle(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "TitleRainfall01", "w": $$widgets_raintitle_width(_st_0), "h": $$widgets_raintitle_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_raintitle(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "TitleRainfall01", "scene": $$widgets_raintitle_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_resize_rain1(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_rainbar_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_rain1(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "RainBar1", "w": $$widgets_rainbar_width(_st_0), "h": $$widgets_rainbar_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_rain1(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "RainBar1", "scene": $$widgets_rainbar_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_data_rain1(_go_0, _st_0, _e_0, _force_0, _now_0) {
  if (_go_0) {
    return $widgets_rainbar_data(_st_0, _e_0, _force_0, _now_0);
  } else {
    return _st_0;
  }
}

function $wiring_resize_rain2(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_rainbar_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_rain2(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "RainBar2", "w": $$widgets_rainbar_width(_st_0), "h": $$widgets_rainbar_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_rain2(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "RainBar2", "scene": $$widgets_rainbar_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_data_rain2(_go_0, _st_0, _e_0, _force_0, _now_0) {
  if (_go_0) {
    return $widgets_rainbar_data(_st_0, _e_0, _force_0, _now_0);
  } else {
    return _st_0;
  }
}

function $wiring_resize_rain3(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_rainbar_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_rain3(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "RainBar3", "w": $$widgets_rainbar_width(_st_0), "h": $$widgets_rainbar_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_rain3(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "RainBar3", "scene": $$widgets_rainbar_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_data_rain3(_go_0, _st_0, _e_0, _force_0, _now_0) {
  if (_go_0) {
    return $widgets_rainbar_data(_st_0, _e_0, _force_0, _now_0);
  } else {
    return _st_0;
  }
}

function $wiring_resize_uv(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_uv_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_uv(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "UVBar01", "w": $$widgets_uv_width(_st_0), "h": $$widgets_uv_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_uv(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "UVBar01", "scene": $$widgets_uv_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_data_uv(_go_0, _st_0, _e_0, _force_0, _now_0) {
  if (_go_0) {
    return $widgets_uv_data(_st_0, _e_0, _force_0, _now_0);
  } else {
    return _st_0;
  }
}

function $wiring_resize_winddir(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_winddir_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_winddir(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "WindGauge01", "w": $$widgets_winddir_width(_st_0), "h": $$widgets_winddir_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_winddir(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "WindGauge01", "scene": $$widgets_winddir_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_data_winddir(_go_0, _st_0, _e_0, _force_0, _now_0) {
  if (_go_0) {
    return $widgets_winddir_data(_st_0, _e_0, _force_0, _now_0);
  } else {
    return _st_0;
  }
}

function $wiring_resize_windspeed(_hit_0, _st_0, _b_0) {
  if (_hit_0) {
    return $widgets_windspeed_resize(_st_0, _b_0);
  } else {
    return _st_0;
  }
}

function $wiring_size_windspeed(_hit_0, _st_0) {
  if (_hit_0) {
    return {$: "Con", "head": {$: "CSize", "id": "WindSpeed01", "w": $$widgets_windspeed_width(_st_0), "h": $$widgets_windspeed_height(_st_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_draw_windspeed(_on_0, _st_0, _e_0, _now_0) {
  if (_on_0) {
    return {$: "Con", "head": {$: "CDraw", "id": "WindSpeed01", "scene": $$widgets_windspeed_view(_st_0, _e_0, _now_0)}, "tail": {$: "Nil"}};
  } else {
    return {$: "Nil"};
  }
}

function $wiring_data_windspeed(_go_0, _st_0, _e_0, _force_0, _now_0) {
  if (_go_0) {
    return $widgets_windspeed_data(_st_0, _e_0, _force_0, _now_0);
  } else {
    return _st_0;
  }
}

function $wiring_resize(_w_0, _id_0, _b_0) {
  const _apparent_0 = _w_0["apparent"];
  const _temp1_0 = _w_0["temp1"];
  const _temp2_0 = _w_0["temp2"];
  const _temp3_0 = _w_0["temp3"];
  const _barometer_0 = _w_0["barometer"];
  const _windchill_0 = _w_0["windchill"];
  const _humidity_0 = _w_0["humidity"];
  const _moonsun_0 = _w_0["moonsun"];
  const _solar_0 = _w_0["solar"];
  const _status_0 = _w_0["status"];
  const _raintitle_0 = _w_0["raintitle"];
  const _rain1_0 = _w_0["rain1"];
  const _rain2_0 = _w_0["rain2"];
  const _rain3_0 = _w_0["rain3"];
  const _uv_0 = _w_0["uv"];
  const _winddir_0 = _w_0["winddir"];
  const _windspeed_0 = _w_0["windspeed"];
  const _graphs_0 = _w_0["graphs"];
  const _forecast_0 = _w_0["forecast"];
  const _records_0 = _w_0["records"];
  return {$: "Widgets", "apparent": $$wiring_resize_apparent($$String_eq(_id_0, "Apparent01"), _apparent_0, _b_0), "temp1": $$wiring_resize_temp1($$String_eq(_id_0, "TempBar01"), _temp1_0, _b_0), "temp2": $$wiring_resize_temp2($$String_eq(_id_0, "TempBar02"), _temp2_0, _b_0), "temp3": $$wiring_resize_temp3($$String_eq(_id_0, "TempBar03"), _temp3_0, _b_0), "barometer": $$wiring_resize_barometer($$String_eq(_id_0, "Barometer01"), _barometer_0, _b_0), "windchill": $$wiring_resize_windchill($$String_eq(_id_0, "Windchill01"), _windchill_0, _b_0), "humidity": $$wiring_resize_humidity($$String_eq(_id_0, "HumidityGauge01"), _humidity_0, _b_0), "moonsun": $$wiring_resize_moonsun($$String_eq(_id_0, "MoonSun01"), _moonsun_0, _b_0), "solar": $$wiring_resize_solar($$String_eq(_id_0, "SolarBar01"), _solar_0, _b_0), "status": $$wiring_resize_status($$String_eq(_id_0, "Status01"), _status_0, _b_0), "raintitle": $$wiring_resize_raintitle($$String_eq(_id_0, "TitleRainfall01"), _raintitle_0, _b_0), "rain1": $$wiring_resize_rain1($$String_eq(_id_0, "RainBar1"), _rain1_0, _b_0), "rain2": $$wiring_resize_rain2($$String_eq(_id_0, "RainBar2"), _rain2_0, _b_0), "rain3": $$wiring_resize_rain3($$String_eq(_id_0, "RainBar3"), _rain3_0, _b_0), "uv": $$wiring_resize_uv($$String_eq(_id_0, "UVBar01"), _uv_0, _b_0), "winddir": $$wiring_resize_winddir($$String_eq(_id_0, "WindGauge01"), _winddir_0, _b_0), "windspeed": $$wiring_resize_windspeed($$String_eq(_id_0, "WindSpeed01"), _windspeed_0, _b_0), "graphs": _graphs_0, "forecast": _forecast_0, "records": _records_0};
}

function $wiring_size(_w_0, _id_0) {
  const _apparent_0 = _w_0["apparent"];
  const _temp1_0 = _w_0["temp1"];
  const _temp2_0 = _w_0["temp2"];
  const _temp3_0 = _w_0["temp3"];
  const _barometer_0 = _w_0["barometer"];
  const _windchill_0 = _w_0["windchill"];
  const _humidity_0 = _w_0["humidity"];
  const _moonsun_0 = _w_0["moonsun"];
  const _solar_0 = _w_0["solar"];
  const _status_0 = _w_0["status"];
  const _raintitle_0 = _w_0["raintitle"];
  const _rain1_0 = _w_0["rain1"];
  const _rain2_0 = _w_0["rain2"];
  const _rain3_0 = _w_0["rain3"];
  const _uv_0 = _w_0["uv"];
  const _winddir_0 = _w_0["winddir"];
  const _windspeed_0 = _w_0["windspeed"];
  return $wiring_cat($$wiring_size_apparent($$String_eq(_id_0, "Apparent01"), _apparent_0), $$wiring_cat($$wiring_size_temp1($$String_eq(_id_0, "TempBar01"), _temp1_0), $$wiring_cat($$wiring_size_temp2($$String_eq(_id_0, "TempBar02"), _temp2_0), $$wiring_cat($$wiring_size_temp3($$String_eq(_id_0, "TempBar03"), _temp3_0), $$wiring_cat($$wiring_size_barometer($$String_eq(_id_0, "Barometer01"), _barometer_0), $$wiring_cat($$wiring_size_windchill($$String_eq(_id_0, "Windchill01"), _windchill_0), $$wiring_cat($$wiring_size_humidity($$String_eq(_id_0, "HumidityGauge01"), _humidity_0), $$wiring_cat($$wiring_size_moonsun($$String_eq(_id_0, "MoonSun01"), _moonsun_0), $$wiring_cat($$wiring_size_solar($$String_eq(_id_0, "SolarBar01"), _solar_0), $$wiring_cat($$wiring_size_status($$String_eq(_id_0, "Status01"), _status_0), $$wiring_cat($$wiring_size_raintitle($$String_eq(_id_0, "TitleRainfall01"), _raintitle_0), $$wiring_cat($$wiring_size_rain1($$String_eq(_id_0, "RainBar1"), _rain1_0), $$wiring_cat($$wiring_size_rain2($$String_eq(_id_0, "RainBar2"), _rain2_0), $$wiring_cat($$wiring_size_rain3($$String_eq(_id_0, "RainBar3"), _rain3_0), $$wiring_cat($$wiring_size_uv($$String_eq(_id_0, "UVBar01"), _uv_0), $$wiring_cat($$wiring_size_winddir($$String_eq(_id_0, "WindGauge01"), _winddir_0), $$wiring_cat($$wiring_size_windspeed($$String_eq(_id_0, "WindSpeed01"), _windspeed_0), {$: "Nil"})))))))))))))))));
}

function $wiring_frame(_w_0, _e_0, _now_0) {
  const _apparent_0 = _w_0["apparent"];
  const _temp1_0 = _w_0["temp1"];
  const _temp2_0 = _w_0["temp2"];
  const _temp3_0 = _w_0["temp3"];
  const _barometer_0 = _w_0["barometer"];
  const _windchill_0 = _w_0["windchill"];
  const _humidity_0 = _w_0["humidity"];
  const _moonsun_0 = _w_0["moonsun"];
  const _solar_0 = _w_0["solar"];
  const _status_0 = _w_0["status"];
  const _raintitle_0 = _w_0["raintitle"];
  const _rain1_0 = _w_0["rain1"];
  const _rain2_0 = _w_0["rain2"];
  const _rain3_0 = _w_0["rain3"];
  const _uv_0 = _w_0["uv"];
  const _winddir_0 = _w_0["winddir"];
  const _windspeed_0 = _w_0["windspeed"];
  return $wiring_cat($$wiring_draw_apparent($$lib_env_on(_e_0, "apparent.enabled"), _apparent_0, _e_0, _now_0), $$wiring_cat($$wiring_draw_temp1($$lib_env_on(_e_0, "temperature.enabled"), _temp1_0, _e_0, _now_0), $$wiring_cat($$wiring_draw_temp2($$lib_env_on(_e_0, "temperature02.enabled"), _temp2_0, _e_0, _now_0), $$wiring_cat($$wiring_draw_temp3($$lib_env_on(_e_0, "temperature03.enabled"), _temp3_0, _e_0, _now_0), $$wiring_cat($$wiring_draw_barometer($$lib_env_on(_e_0, "barometer.enabled"), _barometer_0, _e_0, _now_0), $$wiring_cat($$wiring_draw_windchill($$lib_env_on(_e_0, "windChill.enabled"), _windchill_0, _e_0, _now_0), $$wiring_cat($$wiring_draw_humidity($$lib_env_on(_e_0, "humidity.enabled"), _humidity_0, _e_0, _now_0), $$wiring_cat($$wiring_draw_moonsun($$lib_env_on(_e_0, "moonSun.enabled"), _moonsun_0, _e_0, _now_0), $$wiring_cat($$wiring_draw_solar($$lib_env_on(_e_0, "solar.enabled"), _solar_0, _e_0, _now_0), $$wiring_cat($$wiring_draw_status($$lib_env_on(_e_0, "status.enabled"), _status_0, _e_0, _now_0), $$wiring_cat($$wiring_draw_raintitle($$lib_env_on(_e_0, "rainfallTitle.enabled"), _raintitle_0, _e_0, _now_0), $$wiring_cat($$wiring_draw_rain1($$lib_env_on(_e_0, "rainfallDay.enabled"), _rain1_0, _e_0, _now_0), $$wiring_cat($$wiring_draw_rain2($$lib_env_on(_e_0, "rainfallMonth.enabled"), _rain2_0, _e_0, _now_0), $$wiring_cat($$wiring_draw_rain3($$lib_env_on(_e_0, "rainfallYear.enabled"), _rain3_0, _e_0, _now_0), $$wiring_cat($$wiring_draw_uv($$lib_env_on(_e_0, "UV.enabled"), _uv_0, _e_0, _now_0), $$wiring_cat($$wiring_draw_winddir($$lib_env_on(_e_0, "windDirection.enabled"), _winddir_0, _e_0, _now_0), $$wiring_cat($$wiring_draw_windspeed($$lib_env_on(_e_0, "windSpeed.enabled"), _windspeed_0, _e_0, _now_0), {$: "Nil"})))))))))))))))));
}

function $wiring_data(_w_0, _e_0, _cr_0, _cre_0, _now_0) {
  const _apparent_0 = _w_0["apparent"];
  const _temp1_0 = _w_0["temp1"];
  const _temp2_0 = _w_0["temp2"];
  const _temp3_0 = _w_0["temp3"];
  const _barometer_0 = _w_0["barometer"];
  const _windchill_0 = _w_0["windchill"];
  const _humidity_0 = _w_0["humidity"];
  const _moonsun_0 = _w_0["moonsun"];
  const _solar_0 = _w_0["solar"];
  const _status_0 = _w_0["status"];
  const _raintitle_0 = _w_0["raintitle"];
  const _rain1_0 = _w_0["rain1"];
  const _rain2_0 = _w_0["rain2"];
  const _rain3_0 = _w_0["rain3"];
  const _uv_0 = _w_0["uv"];
  const _winddir_0 = _w_0["winddir"];
  const _windspeed_0 = _w_0["windspeed"];
  const _graphs_0 = _w_0["graphs"];
  const _forecast_0 = _w_0["forecast"];
  const _records_0 = _w_0["records"];
  return {$: "Widgets", "apparent": $$wiring_data_apparent($$Bool_and($$lib_env_on(_e_0, "apparent.enabled"), _cr_0), _apparent_0, _e_0, false, _now_0), "temp1": $$wiring_data_temp1($$Bool_and($$lib_env_on(_e_0, "temperature.enabled"), _cr_0), _temp1_0, _e_0, false, _now_0), "temp2": $$wiring_data_temp2($$Bool_and($$lib_env_on(_e_0, "temperature02.enabled"), (_cr_0 || _cre_0)), _temp2_0, _e_0, false, _now_0), "temp3": $$wiring_data_temp3($$Bool_and($$lib_env_on(_e_0, "temperature03.enabled"), (_cr_0 || _cre_0)), _temp3_0, _e_0, false, _now_0), "barometer": $$wiring_data_barometer($$Bool_and($$lib_env_on(_e_0, "barometer.enabled"), _cr_0), _barometer_0, _e_0, false, _now_0), "windchill": $$wiring_data_windchill($$Bool_and($$lib_env_on(_e_0, "windChill.enabled"), _cr_0), _windchill_0, _e_0, false, _now_0), "humidity": $$wiring_data_humidity($$Bool_and($$lib_env_on(_e_0, "humidity.enabled"), _cr_0), _humidity_0, _e_0, false, _now_0), "moonsun": $$wiring_data_moonsun($$Bool_and($$lib_env_on(_e_0, "moonSun.enabled"), _cre_0), _moonsun_0, _e_0, false, _now_0), "solar": $$wiring_data_solar($$Bool_and($$lib_env_on(_e_0, "solar.enabled"), (_cr_0 || _cre_0)), _solar_0, _e_0, false, _now_0), "status": _status_0, "raintitle": _raintitle_0, "rain1": $$wiring_data_rain1($$Bool_and($$lib_env_on(_e_0, "rainfallDay.enabled"), _cr_0), _rain1_0, _e_0, false, _now_0), "rain2": $$wiring_data_rain2($$Bool_and($$lib_env_on(_e_0, "rainfallMonth.enabled"), _cr_0), _rain2_0, _e_0, false, _now_0), "rain3": $$wiring_data_rain3($$Bool_and($$lib_env_on(_e_0, "rainfallYear.enabled"), _cr_0), _rain3_0, _e_0, false, _now_0), "uv": $$wiring_data_uv($$Bool_and($$lib_env_on(_e_0, "UV.enabled"), _cr_0), _uv_0, _e_0, false, _now_0), "winddir": $$wiring_data_winddir($$Bool_and($$lib_env_on(_e_0, "windDirection.enabled"), _cr_0), _winddir_0, _e_0, false, _now_0), "windspeed": $$wiring_data_windspeed($$Bool_and($$lib_env_on(_e_0, "windSpeed.enabled"), _cr_0), _windspeed_0, _e_0, false, _now_0), "graphs": _graphs_0, "forecast": _forecast_0, "records": _records_0};
}

function $wiring_retip(_w_0, _e_0) {
  const _windchill_0 = _w_0["windchill"];
  const _tips_0 = $$lib_env_on(_e_0, "general.tooltipsEnabled");
  return $wiring_cat($$Bool_pick($$Bool_and(_tips_0, $$lib_env_on(_e_0, "windChill.enabled")), {$: "Con", "head": {$: "CTip", "id": "Windchill01", "text": $$widgets_tempbar_tip(_windchill_0, _e_0)}, "tail": {$: "Nil"}}, {$: "Nil"}), {$: "Nil"});
}

function $wiring_status(_w_0, _e_0, _failed_0, _no_change_0, _now_0) {
  const _apparent_0 = _w_0["apparent"];
  const _temp1_0 = _w_0["temp1"];
  const _temp2_0 = _w_0["temp2"];
  const _temp3_0 = _w_0["temp3"];
  const _barometer_0 = _w_0["barometer"];
  const _windchill_0 = _w_0["windchill"];
  const _humidity_0 = _w_0["humidity"];
  const _moonsun_0 = _w_0["moonsun"];
  const _solar_0 = _w_0["solar"];
  const _status_0 = _w_0["status"];
  const _raintitle_0 = _w_0["raintitle"];
  const _rain1_0 = _w_0["rain1"];
  const _rain2_0 = _w_0["rain2"];
  const _rain3_0 = _w_0["rain3"];
  const _uv_0 = _w_0["uv"];
  const _winddir_0 = _w_0["winddir"];
  const _windspeed_0 = _w_0["windspeed"];
  const _graphs_0 = _w_0["graphs"];
  const _forecast_0 = _w_0["forecast"];
  const _records_0 = _w_0["records"];
  return {$: "Widgets", "apparent": _apparent_0, "temp1": _temp1_0, "temp2": _temp2_0, "temp3": _temp3_0, "barometer": _barometer_0, "windchill": _windchill_0, "humidity": _humidity_0, "moonsun": _moonsun_0, "solar": _solar_0, "status": $$widgets_status_data(_status_0, _e_0, _failed_0, _no_change_0, _now_0), "raintitle": _raintitle_0, "rain1": _rain1_0, "rain2": _rain2_0, "rain3": _rain3_0, "uv": _uv_0, "winddir": _winddir_0, "windspeed": _windspeed_0, "graphs": _graphs_0, "forecast": _forecast_0, "records": _records_0};
}

function $wiring_units(_w_0, _e_0, _k_0, _now_0) {
  const _apparent_0 = _w_0["apparent"];
  const _temp1_0 = _w_0["temp1"];
  const _temp2_0 = _w_0["temp2"];
  const _temp3_0 = _w_0["temp3"];
  const _barometer_0 = _w_0["barometer"];
  const _windchill_0 = _w_0["windchill"];
  const _humidity_0 = _w_0["humidity"];
  const _moonsun_0 = _w_0["moonsun"];
  const _solar_0 = _w_0["solar"];
  const _status_0 = _w_0["status"];
  const _raintitle_0 = _w_0["raintitle"];
  const _rain1_0 = _w_0["rain1"];
  const _rain2_0 = _w_0["rain2"];
  const _rain3_0 = _w_0["rain3"];
  const _uv_0 = _w_0["uv"];
  const _winddir_0 = _w_0["winddir"];
  const _windspeed_0 = _w_0["windspeed"];
  const _graphs_0 = _w_0["graphs"];
  const _forecast_0 = _w_0["forecast"];
  const _records_0 = _w_0["records"];
  return {$: "Widgets", "apparent": $$wiring_data_apparent($$Bool_and($$lib_env_on(_e_0, "apparent.enabled"), $$String_eq(_k_0, "Temp")), _apparent_0, _e_0, true, _now_0), "temp1": $$wiring_data_temp1($$Bool_and($$lib_env_on(_e_0, "temperature.enabled"), $$String_eq(_k_0, "Temp")), _temp1_0, _e_0, true, _now_0), "temp2": $$wiring_data_temp2($$Bool_and($$lib_env_on(_e_0, "temperature02.enabled"), $$String_eq(_k_0, "Temp")), _temp2_0, _e_0, true, _now_0), "temp3": $$wiring_data_temp3($$Bool_and($$lib_env_on(_e_0, "temperature03.enabled"), $$String_eq(_k_0, "Temp")), _temp3_0, _e_0, true, _now_0), "barometer": $$wiring_data_barometer($$Bool_and($$lib_env_on(_e_0, "barometer.enabled"), $$String_eq(_k_0, "Pressure")), _barometer_0, _e_0, true, _now_0), "windchill": $$wiring_data_windchill($$Bool_and($$lib_env_on(_e_0, "windChill.enabled"), $$String_eq(_k_0, "Temp")), _windchill_0, _e_0, true, _now_0), "humidity": _humidity_0, "moonsun": _moonsun_0, "solar": _solar_0, "status": _status_0, "raintitle": _raintitle_0, "rain1": $$wiring_data_rain1($$Bool_and($$lib_env_on(_e_0, "rainfallDay.enabled"), $$String_eq(_k_0, "Rainfall")), _rain1_0, _e_0, true, _now_0), "rain2": $$wiring_data_rain2($$Bool_and($$lib_env_on(_e_0, "rainfallMonth.enabled"), $$String_eq(_k_0, "Rainfall")), _rain2_0, _e_0, true, _now_0), "rain3": $$wiring_data_rain3($$Bool_and($$lib_env_on(_e_0, "rainfallYear.enabled"), $$String_eq(_k_0, "Rainfall")), _rain3_0, _e_0, true, _now_0), "uv": _uv_0, "winddir": _winddir_0, "windspeed": $$wiring_data_windspeed($$Bool_and($$lib_env_on(_e_0, "windSpeed.enabled"), $$String_eq(_k_0, "Wind")), _windspeed_0, _e_0, true, _now_0), "graphs": _graphs_0, "forecast": _forecast_0, "records": _records_0};
}

function $wiring_graphs_of(_w_0) {
  const _graphs_0 = _w_0["graphs"];
  return _graphs_0;
}

function $wiring_with_graphs(_w_0, _v_0) {
  const _apparent_0 = _w_0["apparent"];
  const _temp1_0 = _w_0["temp1"];
  const _temp2_0 = _w_0["temp2"];
  const _temp3_0 = _w_0["temp3"];
  const _barometer_0 = _w_0["barometer"];
  const _windchill_0 = _w_0["windchill"];
  const _humidity_0 = _w_0["humidity"];
  const _moonsun_0 = _w_0["moonsun"];
  const _solar_0 = _w_0["solar"];
  const _status_0 = _w_0["status"];
  const _raintitle_0 = _w_0["raintitle"];
  const _rain1_0 = _w_0["rain1"];
  const _rain2_0 = _w_0["rain2"];
  const _rain3_0 = _w_0["rain3"];
  const _uv_0 = _w_0["uv"];
  const _winddir_0 = _w_0["winddir"];
  const _windspeed_0 = _w_0["windspeed"];
  const _forecast_0 = _w_0["forecast"];
  const _records_0 = _w_0["records"];
  return {$: "Widgets", "apparent": _apparent_0, "temp1": _temp1_0, "temp2": _temp2_0, "temp3": _temp3_0, "barometer": _barometer_0, "windchill": _windchill_0, "humidity": _humidity_0, "moonsun": _moonsun_0, "solar": _solar_0, "status": _status_0, "raintitle": _raintitle_0, "rain1": _rain1_0, "rain2": _rain2_0, "rain3": _rain3_0, "uv": _uv_0, "winddir": _winddir_0, "windspeed": _windspeed_0, "graphs": _v_0, "forecast": _forecast_0, "records": _records_0};
}

function $wiring_forecast_of(_w_0) {
  const _forecast_0 = _w_0["forecast"];
  return _forecast_0;
}

function $wiring_with_forecast(_w_0, _v_0) {
  const _apparent_0 = _w_0["apparent"];
  const _temp1_0 = _w_0["temp1"];
  const _temp2_0 = _w_0["temp2"];
  const _temp3_0 = _w_0["temp3"];
  const _barometer_0 = _w_0["barometer"];
  const _windchill_0 = _w_0["windchill"];
  const _humidity_0 = _w_0["humidity"];
  const _moonsun_0 = _w_0["moonsun"];
  const _solar_0 = _w_0["solar"];
  const _status_0 = _w_0["status"];
  const _raintitle_0 = _w_0["raintitle"];
  const _rain1_0 = _w_0["rain1"];
  const _rain2_0 = _w_0["rain2"];
  const _rain3_0 = _w_0["rain3"];
  const _uv_0 = _w_0["uv"];
  const _winddir_0 = _w_0["winddir"];
  const _windspeed_0 = _w_0["windspeed"];
  const _graphs_0 = _w_0["graphs"];
  const _records_0 = _w_0["records"];
  return {$: "Widgets", "apparent": _apparent_0, "temp1": _temp1_0, "temp2": _temp2_0, "temp3": _temp3_0, "barometer": _barometer_0, "windchill": _windchill_0, "humidity": _humidity_0, "moonsun": _moonsun_0, "solar": _solar_0, "status": _status_0, "raintitle": _raintitle_0, "rain1": _rain1_0, "rain2": _rain2_0, "rain3": _rain3_0, "uv": _uv_0, "winddir": _winddir_0, "windspeed": _windspeed_0, "graphs": _graphs_0, "forecast": _v_0, "records": _records_0};
}

function $wiring_records_of(_w_0) {
  const _records_0 = _w_0["records"];
  return _records_0;
}

function $wiring_with_records(_w_0, _v_0) {
  const _apparent_0 = _w_0["apparent"];
  const _temp1_0 = _w_0["temp1"];
  const _temp2_0 = _w_0["temp2"];
  const _temp3_0 = _w_0["temp3"];
  const _barometer_0 = _w_0["barometer"];
  const _windchill_0 = _w_0["windchill"];
  const _humidity_0 = _w_0["humidity"];
  const _moonsun_0 = _w_0["moonsun"];
  const _solar_0 = _w_0["solar"];
  const _status_0 = _w_0["status"];
  const _raintitle_0 = _w_0["raintitle"];
  const _rain1_0 = _w_0["rain1"];
  const _rain2_0 = _w_0["rain2"];
  const _rain3_0 = _w_0["rain3"];
  const _uv_0 = _w_0["uv"];
  const _winddir_0 = _w_0["winddir"];
  const _windspeed_0 = _w_0["windspeed"];
  const _graphs_0 = _w_0["graphs"];
  const _forecast_0 = _w_0["forecast"];
  return {$: "Widgets", "apparent": _apparent_0, "temp1": _temp1_0, "temp2": _temp2_0, "temp3": _temp3_0, "barometer": _barometer_0, "windchill": _windchill_0, "humidity": _humidity_0, "moonsun": _moonsun_0, "solar": _solar_0, "status": _status_0, "raintitle": _raintitle_0, "rain1": _rain1_0, "rain2": _rain2_0, "rain3": _rain3_0, "uv": _uv_0, "winddir": _winddir_0, "windspeed": _windspeed_0, "graphs": _graphs_0, "forecast": _forecast_0, "records": _v_0};
}

function $cat(_xs_0, _ys_0) {
  return $List_append(_xs_0, _ys_0);
}

function $flags(_b_0) {
  return {$: "Con", "head": _b_0, "tail": {$: "Con", "head": _b_0, "tail": {$: "Con", "head": _b_0, "tail": {$: "Con", "head": _b_0, "tail": {$: "Nil"}}}}};
}

function $flag(_xs_0, _i_0) {
  return $Maybe_default($$List_get(_xs_0, _i_0), false);
}

function $set_flag(_xs_0, _i_0, _b_0) {
  return $List_set(_xs_0, _i_0, _b_0);
}

function $all(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return true;
  } else {
    const _x_0 = _xs_0["head"];
    const _rest_0 = _xs_0["tail"];
    return $Bool_and(_x_0, $$all(_rest_0));
  }
}

function $any(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return false;
  } else {
    const _x_0 = _xs_0["head"];
    const _rest_0 = _xs_0["tail"];
    const _x_1 = $$any(_rest_0);
    return (_x_0 || _x_1);
  }
}

function $nth(_xs_0, _i_0) {
  return $Maybe_default($$List_get(_xs_0, _i_0), "");
}

function $fields(_xs_0, _i_0) {
  return $Maybe_default($$List_get(_xs_0, _i_0), {$: "Nil"});
}

function $defaults() {
  return {$: "Con", "head": {$: "KV", "k": "apparent.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "temperature.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "temperature.title", "v": "default"}, "tail": {$: "Con", "head": {$: "KV", "k": "temperature.highLowEnabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "temperature02.enabled", "v": "false"}, "tail": {$: "Con", "head": {$: "KV", "k": "temperature02.title", "v": "default"}, "tail": {$: "Con", "head": {$: "KV", "k": "temperature02.highLowEnabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "temperature02.input", "v": "1"}, "tail": {$: "Con", "head": {$: "KV", "k": "temperature03.enabled", "v": "false"}, "tail": {$: "Con", "head": {$: "KV", "k": "temperature03.title", "v": "default"}, "tail": {$: "Con", "head": {$: "KV", "k": "temperature03.highLowEnabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "temperature03.input", "v": "2"}, "tail": {$: "Con", "head": {$: "KV", "k": "barometer.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "windChill.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "windChill.mode", "v": "windchill"}, "tail": {$: "Con", "head": {$: "KV", "k": "windChill.autoSwitch", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "forecastHandler.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "graphHandler.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "graphHandlerBarometer.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "graphHandlerRainfall.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "graphHandlerTemperature.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "graphHandlerWindSpeed.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "humidity.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "modalHandler.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "moonSun.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "recordHandler.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "solar.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "solar.mode", "v": "percentage"}, "tail": {$: "Con", "head": {$: "KV", "k": "status.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "rainfallTitle.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "rainfallDay.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "rainfallMonth.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "rainfallYear.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "UV.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "windDirection.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "windSpeed.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "windSpeed.gustMode", "v": "current"}, "tail": {$: "Con", "head": {$: "KV", "k": "buttons.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "graph.barometer.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "graph.humidity.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "graph.solar.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "graph.temp.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "graph.uv.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "graph.windDir.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "graph.windSpeed.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "graph.rainfall.enabled", "v": "true"}, "tail": {$: "Con", "head": {$: "KV", "k": "general.tooltipsEnabled", "v": "true"}, "tail": {$: "Nil"}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}};
}

function $has_key(_key_0, _kvs_0) {
  if (_kvs_0.$ === "Nil") {
    return false;
  } else {
    const _kv_0 = _kvs_0["head"];
    const _rest_0 = _kvs_0["tail"];
    const _x_0 = $$String_eq($$lib_env_kv_key(_kv_0), _key_0);
    const _x_1 = $$has_key(_key_0, _rest_0);
    return (_x_0 || _x_1);
  }
}

function $widget_of(_key_0) {
  return $Maybe_default($$List_head($$String_split(_key_0, ".")), "");
}

function $accept(_kv_0, _known_0) {
  const _key_0 = $$lib_env_kv_key(_kv_0);
  const _w_0 = $$widget_of($$String_drop(_key_0, 6));
  const _g_0 = $$widget_of($$String_drop(_key_0, 6));
  const _n_0 = $$widget_of($$String_drop(_key_0, 8));
  const _x_0 = (_g_0 + ".enabled");
  const _x_1 = $$Bool_and($$String_starts_with(_key_0, "gauge."), $$has_key((_w_0 + ".enabled"), _known_0));
  const _x_2 = $$Bool_and($$String_starts_with(_key_0, "graph."), $$has_key(("graph." + _x_0), _known_0));
  const _x_3 = (_x_1 || _x_2);
  const _x_4 = $$Bool_and($$String_starts_with(_key_0, "general."), $$has_key(("general." + _n_0), _known_0));
  return (_x_3 || _x_4);
}

function $rename(_kv_0) {
  const _key_0 = $$lib_env_kv_key(_kv_0);
  return {$: "KV", "k": $$Bool_pick($$String_starts_with(_key_0, "gauge."), $$String_drop(_key_0, 6), _key_0), "v": $$lib_env_kv_val(_kv_0)};
}

function $merge($0, $1, $2) {
  for (;;) {
    {
      const _sets_0 = $0;
      const _known_0 = $1;
      const _acc_0 = $2;
      if (_sets_0.$ === "Nil") {
        return _acc_0;
      } else {
        const _kv_0 = _sets_0["head"];
        const _rest_0 = _sets_0["tail"];
        $0 = _rest_0;
        $1 = _known_0;
        $2 = $$Bool_pick($$accept(_kv_0, _known_0), {$: "Con", "head": $$rename(_kv_0), "tail": _acc_0}, _acc_0);
        continue;
      }
    }
  }
}

function $setting(_key_0, _dflt_0, _kvs_0) {
  return $lib_env_find(_key_0, _dflt_0, _kvs_0);
}

function $base_strip(_s_0) {
  if (_s_0 === "") {
    return "";
  } else {
    const _c_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    return $Bool_pick($$Char_is_eq(_c_0, "/"), (_c_0 + _t_0), $$base_strip(_t_0));
  }
}

function $base_cut(_slash_0, _href_0) {
  if (_slash_0) {
    return $String_reverse($$base_strip($$String_reverse(_href_0)));
  } else {
    return _href_0;
  }
}

function $base_url(_href_0, _custom_0) {
  const _x_0 = $$String_eq(_custom_0, "false");
  const _x_1 = $$String_eq(_custom_0, "");
  return $Bool_pick((_x_0 || _x_1), $$base_cut(string_contains(_href_0, "/"), _href_0), _custom_0);
}

function $fetch_all(_n_0) {
  const _names_0 = _n_0["names"];
  const _base_0 = _n_0["base"];
  const _x_0 = $$nth(_names_0, 0);
  const _x_1 = $$nth(_names_0, 1);
  const _x_2 = $$nth(_names_0, 2);
  const _x_3 = $$nth(_names_0, 3);
  return {$: "Con", "head": {$: "CFetch", "file": "0", "url": (_base_0 + _x_0)}, "tail": {$: "Con", "head": {$: "CFetch", "file": "1", "url": (_base_0 + _x_1)}, "tail": {$: "Con", "head": {$: "CFetch", "file": "2", "url": (_base_0 + _x_2)}, "tail": {$: "Con", "head": {$: "CFetch", "file": "3", "url": (_base_0 + _x_3)}, "tail": {$: "Nil"}}}}};
}

function $buttons(_e_0) {
  return $Bool_pick($$lib_env_on(_e_0, "buttons.enabled"), {$: "Con", "head": {$: "CHtml", "id": "AltitudeButton", "html": $$lib_env_word(_e_0, {$: "WButtonLabelAltitude"})}, "tail": {$: "Con", "head": {$: "CHtml", "id": "PressureButton", "html": $$lib_env_word(_e_0, {$: "WGraphBaroLabel"})}, "tail": {$: "Con", "head": {$: "CHtml", "id": "WindButton", "html": $$lib_env_word(_e_0, {$: "WWindSpeedWind"})}, "tail": {$: "Con", "head": {$: "CHtml", "id": "RainfallButton", "html": $$lib_env_word(_e_0, {$: "WRainfallTitle"})}, "tail": {$: "Con", "head": {$: "CHtml", "id": "TempButton", "html": $$lib_env_word(_e_0, {$: "WTemperatureTitle"})}, "tail": {$: "Con", "head": {$: "CHtml", "id": "RecordsButton", "html": $$lib_env_word(_e_0, {$: "WButtonLabelRecords"})}, "tail": {$: "Nil"}}}}}}}, {$: "Con", "head": {$: "CStyle", "id": "bottom", "prop": "display", "value": "none"}, "tail": {$: "Nil"}});
}

function $init_cmds(_w_0, _e_0) {
  return $cat({$: "Con", "head": {$: "CHtml", "id": "Version", "html": "FreshWDL - Version: 1.1.8.15 Alpha."}, "tail": {$: "Nil"}}, $$cat($$wiring_start(_w_0, _e_0), $$buttons(_e_0)));
}

function $start_units(_kvs_0) {
  const _d_0 = $$lib_units_defaults();
  return {$: "Units", "pressure": $$setting("pressure", $$lib_units_current(_d_0, {$: "Pressure"}), _kvs_0), "altitude": $$setting("altitude", $$lib_units_current(_d_0, {$: "Altitude"}), _kvs_0), "wind": $$setting("wind", $$lib_units_current(_d_0, {$: "Wind"}), _kvs_0), "rainfall": $$setting("rainfall", $$lib_units_current(_d_0, {$: "Rainfall"}), _kvs_0), "wind_direction": $$setting("windDirection", $$lib_units_current(_d_0, {$: "WindDirection"}), _kvs_0), "humidity": $$setting("humidity", $$lib_units_current(_d_0, {$: "Humidity"}), _kvs_0), "solar": $$setting("solar", $$lib_units_current(_d_0, {$: "Solar"}), _kvs_0), "uv": $$setting("uv", $$lib_units_current(_d_0, {$: "UV"}), _kvs_0), "temp": $$setting("temp", $$lib_units_current(_d_0, {$: "Temp"}), _kvs_0)};
}

function $f_st(_o_0) {
  const _st_0 = _o_0["st"];
  return _st_0;
}

function $f_cmds(_o_0) {
  const _cmds_0 = _o_0["cmds"];
  return _cmds_0;
}

function $r_st(_o_0) {
  const _st_0 = _o_0["st"];
  return _st_0;
}

function $r_cmds(_o_0) {
  const _cmds_0 = _o_0["cmds"];
  return _cmds_0;
}

function $g_st(_o_0) {
  const _st_0 = _o_0["st"];
  return _st_0;
}

function $g_cmds(_o_0) {
  const _cmds_0 = _o_0["cmds"];
  return _cmds_0;
}

function $boot(_settings_0, _names_0, _href_0, _custom_0, _code_0, _units_0, _now_0) {
  const _known_0 = $$defaults();
  const _cfg_0 = $$merge($$lib_env_kv_lines(_settings_0), _known_0, _known_0);
  const _env_0 = {$: "Env", "cr": {$: "Nil"}, "cre": {$: "Nil"}, "crh": {$: "Nil"}, "crd": {$: "Nil"}, "units": $$start_units($$lib_env_kv_lines(_units_0)), "lang": $$lib_dict_lang(_code_0), "cfg": _cfg_0, "clock": $$lib_env_no_clock()};
  const _net_0 = {$: "Net", "names": $$String_split(_names_0, $$Char_from_u32(10)), "base": $$base_url(_href_0, _custom_0), "done": $$flags(false), "tried": $$flags(true), "failed": $$flags(false), "old": {$: "Con", "head": {$: "Nil"}, "tail": {$: "Con", "head": {$: "Nil"}, "tail": {$: "Con", "head": {$: "Nil"}, "tail": {$: "Con", "head": {$: "Nil"}, "tail": {$: "Nil"}}}}}, "first": true};
  const _w0_0 = $$wiring_init(_env_0, _now_0);
  const _small_0 = $$widgets_graphs_start_small($$wiring_graphs_of(_w0_0), _env_0);
  const _modal_0 = $$widgets_graphs_start_modal($$g_st(_small_0), _env_0);
  const _w_0 = $$wiring_with_graphs(_w0_0, $$g_st(_modal_0));
  const _app_0 = {$: "Fwdl", "env": _env_0, "net": _net_0, "loading": {$: "Loading", "message": "Collecting Data.", "count": 1, "op": 1, "gone": false}, "w": _w_0};
  return {$: "Out", "app": _app_0, "cmds": $$cat($$fetch_all(_net_0), $$cat({$: "Con", "head": {$: "CEvery", "key": "poll", "ms": 5000}, "tail": {$: "Con", "head": {$: "CEvery", "key": "dots", "ms": 500}, "tail": {$: "Nil"}}}, $$cat($$init_cmds(_w_0, _env_0), $$cat($$widgets_forecast_start(_env_0), $$cat($$g_cmds(_small_0), $$cat($$widgets_records_start(_env_0), $$cat($$widgets_graphs_start_lists(_env_0), $$g_cmds(_modal_0))))))))};
}

function $chart_defaults() {
  return $widgets_graphs_chart_defaults();
}

function $g_ok(_o_0) {
  const _ok_0 = _o_0["ok"];
  return _ok_0;
}

function $canvases(_app_0) {
  const _env_0 = _app_0["env"];
  const _w_0 = _app_0["w"];
  const _g_0 = $$wiring_graphs_of(_w_0);
  return $wiring_canvases(_env_0, $$List_append({$: "Con", "head": "forecastText", "tail": {$: "Nil"}}, $$widgets_graphs_small_canvases(_g_0)), {$: "Con", "head": "modalRecordsDiv", "tail": {$: "Nil"}}, $$widgets_graphs_modal_canvases(_g_0));
}

function $viewport(_app_0, _vw_0, _vh_0) {
  const _ratio_0 = 0.5625;
  const _x_0 = Math.fround(_vh_0 / _ratio_0);
  const _wide_0 = (_x_0 <= _vw_0);
  const _x_1 = Math.fround(_vw_0 * _ratio_0);
  const _w_0 = $$Bool_pick(_wide_0, Math.fround(_vh_0 * 1.7000000476837158), Math.fround(_x_1 * 1.7000000476837158));
  const _x_2 = Math.fround(_vh_0 * 1.7000000476837158);
  const _x_3 = Math.fround(_vw_0 * _ratio_0);
  const _x_4 = Math.fround(_x_3 * 1.7000000476837158);
  const _h_0 = $$Bool_pick(_wide_0, Math.fround(_x_2 * _ratio_0), Math.fround(_x_4 * _ratio_0));
  const _x_5 = $$lib_num_show(_h_0);
  const _x_6 = (_x_5 + "px");
  const _x_7 = $$lib_num_show(_w_0);
  const _x_8 = ("px;height:" + _x_6);
  const _x_9 = (_x_7 + _x_8);
  return {$: "Out", "app": _app_0, "cmds": {$: "Con", "head": {$: "CAttr", "id": "FWDLcontainer", "name": "style", "value": ("width:" + _x_9)}, "tail": {$: "Nil"}}};
}

function $measure(_app_0, _id_0, _b_0) {
  const _env_0 = _app_0["env"];
  const _net_0 = _app_0["net"];
  const _loading_0 = _app_0["loading"];
  const _w_0 = _app_0["w"];
  const _w1_0 = $$wiring_resize(_w_0, _id_0, _b_0);
  const _g_0 = $$widgets_graphs_resize($$wiring_graphs_of(_w1_0), _env_0, _id_0, _b_0);
  const _w2_0 = $$wiring_with_graphs(_w1_0, $$g_st(_g_0));
  const _fc_0 = $$Bool_pick($$String_eq(_id_0, "forecastText"), $$widgets_forecast_resize($$wiring_forecast_of(_w2_0), _env_0, _b_0), {$: "Nil"});
  const _ro_0 = $$Bool_pick($$String_eq(_id_0, "modalRecordsDiv"), $$widgets_records_resize($$wiring_records_of(_w2_0), _env_0, $$lib_env_box_vw(_b_0), $$lib_env_box_vh(_b_0)), {$: "ROut", "st": $$wiring_records_of(_w2_0), "cmds": {$: "Nil"}});
  const _w3_0 = $$wiring_with_records(_w2_0, $$r_st(_ro_0));
  return {$: "Out", "app": {$: "Fwdl", "env": _env_0, "net": _net_0, "loading": _loading_0, "w": _w3_0}, "cmds": $$cat($$wiring_size(_w3_0, _id_0), $$cat($$g_cmds(_g_0), $$cat(_fc_0, $$r_cmds(_ro_0))))};
}

function $frame(_app_0, _now_0) {
  const _env_0 = _app_0["env"];
  const __0 = _app_0["net"];
  const __1 = _app_0["loading"];
  const _w_0 = _app_0["w"];
  return {$: "Out", "app": {$: "Fwdl", "env": _env_0, "net": __0, "loading": __1, "w": _w_0}, "cmds": $$wiring_frame(_w_0, _env_0, _now_0)};
}

function $with_fields(_e_0, _i_0, _xs_0) {
  const _cr_0 = _e_0["cr"];
  const _cre_0 = _e_0["cre"];
  const _crh_0 = _e_0["crh"];
  const _crd_0 = _e_0["crd"];
  const _u_0 = _e_0["units"];
  const _l_0 = _e_0["lang"];
  const _cfg_0 = _e_0["cfg"];
  const _c_0 = _e_0["clock"];
  if (_i_0 == 0) {
    return {$: "Env", "cr": _xs_0, "cre": _cre_0, "crh": _crh_0, "crd": _crd_0, "units": _u_0, "lang": _l_0, "cfg": _cfg_0, "clock": _c_0};
  } else if (_i_0 == 1) {
    return {$: "Env", "cr": _cr_0, "cre": _xs_0, "crh": _crh_0, "crd": _crd_0, "units": _u_0, "lang": _l_0, "cfg": _cfg_0, "clock": _c_0};
  } else if (_i_0 == 2) {
    return {$: "Env", "cr": _cr_0, "cre": _cre_0, "crh": _xs_0, "crd": _crd_0, "units": _u_0, "lang": _l_0, "cfg": _cfg_0, "clock": _c_0};
  } else {
    return {$: "Env", "cr": _cr_0, "cre": _cre_0, "crh": _crh_0, "crd": _xs_0, "units": _u_0, "lang": _l_0, "cfg": _cfg_0, "clock": _c_0};
  }
}

function $env_fields(_e_0, _i_0) {
  const _cr_0 = _e_0["cr"];
  const _cre_0 = _e_0["cre"];
  const _crh_0 = _e_0["crh"];
  const _crd_0 = _e_0["crd"];
  return $fields({$: "Con", "head": _cr_0, "tail": {$: "Con", "head": _cre_0, "tail": {$: "Con", "head": _crh_0, "tail": {$: "Con", "head": _crd_0, "tail": {$: "Nil"}}}}}, _i_0);
}

function $with_clock(_e_0, _c_0) {
  const _cr_0 = _e_0["cr"];
  const _cre_0 = _e_0["cre"];
  const _crh_0 = _e_0["crh"];
  const _crd_0 = _e_0["crd"];
  const _u_0 = _e_0["units"];
  const _l_0 = _e_0["lang"];
  const _cfg_0 = _e_0["cfg"];
  return {$: "Env", "cr": _cr_0, "cre": _cre_0, "crh": _crh_0, "crd": _crd_0, "units": _u_0, "lang": _l_0, "cfg": _cfg_0, "clock": _c_0};
}

function $file_index(_file_0) {
  return $Bool_pick($$String_eq(_file_0, "0"), 0, $$Bool_pick($$String_eq(_file_0, "1"), 1, $$Bool_pick($$String_eq(_file_0, "2"), 2, 3)));
}

function $start_fade(_lo_0) {
  return _lo_0;
}

function $update_events(_app_0, _changed_0, _now_0) {
  const _env_0 = _app_0["env"];
  const _t_0 = _app_0["net"];
  const _names_0 = _t_0["names"];
  const _base_0 = _t_0["base"];
  const _done_0 = _t_0["done"];
  const _tried_0 = _t_0["tried"];
  const _failed_0 = _t_0["failed"];
  const _first_0 = _t_0["first"];
  const _loading_0 = _app_0["loading"];
  const _w_0 = _app_0["w"];
  const _old2_0 = {$: "Con", "head": $$env_fields(_env_0, 0), "tail": {$: "Con", "head": $$env_fields(_env_0, 1), "tail": {$: "Con", "head": $$env_fields(_env_0, 2), "tail": {$: "Con", "head": $$env_fields(_env_0, 3), "tail": {$: "Nil"}}}}};
  const _w1_0 = $$wiring_data(_w_0, _env_0, $$flag(_changed_0, 0), $$flag(_changed_0, 1), _now_0);
  const _g_0 = $$Bool_pick($$any(_changed_0), $$widgets_graphs_data($$wiring_graphs_of(_w1_0), _env_0), {$: "Out", "st": $$wiring_graphs_of(_w1_0), "cmds": {$: "Nil"}, "ok": true});
  const _cre_0 = $$flag(_changed_0, 1);
  const _fo_0 = $$Bool_pick(_cre_0, $$widgets_forecast_data($$wiring_forecast_of(_w1_0), _env_0), {$: "FOut", "st": $$wiring_forecast_of(_w1_0), "cmds": {$: "Nil"}});
  const _ro_0 = $$Bool_pick(_cre_0, $$widgets_records_data($$wiring_records_of(_w1_0), _env_0), {$: "ROut", "st": $$wiring_records_of(_w1_0), "cmds": {$: "Nil"}});
  const _w2_0 = $$wiring_with_graphs($$wiring_with_records($$wiring_with_forecast(_w1_0, $$f_st(_fo_0)), $$r_st(_ro_0)), $$g_st(_g_0));
  const _fin_0 = $$Bool_and(_first_0, $$g_ok(_g_0));
  const _lo_0 = $$Bool_pick(_fin_0, $$start_fade(_loading_0), _loading_0);
  return {$: "Out", "app": {$: "Fwdl", "env": _env_0, "net": {$: "Net", "names": _names_0, "base": _base_0, "done": _done_0, "tried": _tried_0, "failed": _failed_0, "old": _old2_0, "first": $$Bool_pick($$g_ok(_g_0), false, _first_0)}, "loading": _lo_0, "w": _w2_0}, "cmds": $$cat($$wiring_retip(_w2_0, _env_0), $$cat($$f_cmds(_fo_0), $$cat($$r_cmds(_ro_0), $$cat($$g_cmds(_g_0), $$Bool_pick(_fin_0, {$: "Con", "head": {$: "CEvery", "key": "fade", "ms": 50}, "tail": {$: "Nil"}}, {$: "Nil"})))))};
}

function $update_ok(_abort_0, _app_0, _changed_0, _now_0) {
  if (_abort_0) {
    return {$: "Out", "app": _app_0, "cmds": {$: "Nil"}};
  } else {
    return $update_events(_app_0, _changed_0, _now_0);
  }
}

function $update_run(_app_0, _now_0) {
  const _env_0 = _app_0["env"];
  const _t_0 = _app_0["net"];
  const _names_0 = _t_0["names"];
  const _base_0 = _t_0["base"];
  const _failed_0 = _t_0["failed"];
  const _old_0 = _t_0["old"];
  const _first_0 = _t_0["first"];
  const _loading_0 = _app_0["loading"];
  const _w_0 = _app_0["w"];
  const _changed_0 = {$: "Con", "head": $$Bool_not($$lib_raw_same($$env_fields(_env_0, 0), $$fields(_old_0, 0))), "tail": {$: "Con", "head": $$Bool_not($$lib_raw_same($$env_fields(_env_0, 1), $$fields(_old_0, 1))), "tail": {$: "Con", "head": $$Bool_not($$lib_raw_same($$env_fields(_env_0, 2), $$fields(_old_0, 2))), "tail": {$: "Con", "head": $$Bool_not($$lib_raw_same($$env_fields(_env_0, 3), $$fields(_old_0, 3))), "tail": {$: "Nil"}}}}};
  const _no_change_0 = $$Bool_not($$any(_changed_0));
  const _on_0 = $$lib_env_on(_env_0, "status.enabled");
  const _w1_0 = $$Bool_pick(_on_0, $$wiring_status(_w_0, _env_0, _failed_0, _no_change_0, _now_0), _w_0);
  const _x_0 = $$Bool_not(_on_0);
  const _x_1 = $$widgets_status_aborts(_env_0, _failed_0, _no_change_0);
  return $update_ok((_x_0 || _x_1), {$: "Fwdl", "env": _env_0, "net": {$: "Net", "names": _names_0, "base": _base_0, "done": $$flags(false), "tried": $$flags(false), "failed": _failed_0, "old": _old_0, "first": _first_0}, "loading": _loading_0, "w": _w1_0}, _changed_0, _now_0);
}

function $update_go(_ready_0, _app_0, _now_0) {
  if (!_ready_0) {
    return {$: "Out", "app": _app_0, "cmds": {$: "Nil"}};
  } else {
    return $update_run(_app_0, _now_0);
  }
}

function $try_update(_app_0, _now_0) {
  const _env_0 = _app_0["env"];
  const _t_0 = _app_0["net"];
  const _names_0 = _t_0["names"];
  const _base_0 = _t_0["base"];
  const _done_0 = _t_0["done"];
  const _tried_0 = _t_0["tried"];
  const _failed_0 = _t_0["failed"];
  const _old_0 = _t_0["old"];
  const _first_0 = _t_0["first"];
  const _loading_0 = _app_0["loading"];
  const _w_0 = _app_0["w"];
  const _x_0 = $$all(_done_0);
  const _x_1 = $$Bool_and($$all(_tried_0), $$Bool_not(_first_0));
  const _ready_0 = (_x_0 || _x_1);
  return $update_go(_ready_0, {$: "Fwdl", "env": _env_0, "net": {$: "Net", "names": _names_0, "base": _base_0, "done": _done_0, "tried": _tried_0, "failed": _failed_0, "old": _old_0, "first": _first_0}, "loading": _loading_0, "w": _w_0}, _now_0);
}

function $fetched(_app_0, _file_0, _ok_0, _text_0, _now_0, _c_0) {
  const _env_0 = _app_0["env"];
  const _t_0 = _app_0["net"];
  const _names_0 = _t_0["names"];
  const _base_0 = _t_0["base"];
  const _done_0 = _t_0["done"];
  const _tried_0 = _t_0["tried"];
  const _failed_0 = _t_0["failed"];
  const _old_0 = _t_0["old"];
  const _first_0 = _t_0["first"];
  const _loading_0 = _app_0["loading"];
  const _w_0 = _app_0["w"];
  const _i_0 = $$file_index(_file_0);
  const _env2_0 = $$with_clock($$Bool_pick(_ok_0, $$with_fields(_env_0, _i_0, $$lib_raw_split(_text_0)), _env_0), _c_0);
  return $try_update({$: "Fwdl", "env": _env2_0, "net": {$: "Net", "names": _names_0, "base": _base_0, "done": $$Bool_pick(_ok_0, $$set_flag(_done_0, _i_0, true), _done_0), "tried": _tried_0, "failed": $$set_flag(_failed_0, _i_0, $$Bool_not(_ok_0)), "old": _old_0, "first": _first_0}, "loading": _loading_0, "w": _w_0}, _now_0);
}

function $failed_of(_n_0) {
  const _failed_0 = _n_0["failed"];
  return _failed_0;
}

function $message_of(_lo_0) {
  const _m_0 = _lo_0["message"];
  return _m_0;
}

function $timer_poll(_app_0) {
  const _env_0 = _app_0["env"];
  const _t_0 = _app_0["net"];
  const _names_0 = _t_0["names"];
  const _base_0 = _t_0["base"];
  const _done_0 = _t_0["done"];
  const _tried_0 = _t_0["tried"];
  const _failed_0 = _t_0["failed"];
  const _old_0 = _t_0["old"];
  const _first_0 = _t_0["first"];
  const _loading_0 = _app_0["loading"];
  const _w_0 = _app_0["w"];
  return {$: "Out", "app": {$: "Fwdl", "env": _env_0, "net": {$: "Net", "names": _names_0, "base": _base_0, "done": _done_0, "tried": $$flags(true), "failed": _failed_0, "old": _old_0, "first": _first_0}, "loading": _loading_0, "w": _w_0}, "cmds": $$fetch_all({$: "Net", "names": _names_0, "base": _base_0, "done": _done_0, "tried": _tried_0, "failed": _failed_0, "old": _old_0, "first": _first_0})};
}

function $before_dot(_s_0) {
  if (_s_0 === "") {
    return "";
  } else {
    const _c_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    return $Bool_pick($$Char_is_eq(_c_0, "."), "", (_c_0 + $$before_dot(_t_0)));
  }
}

function $stem(_s_0) {
  return $Bool_pick(string_contains(_s_0, "."), $$before_dot(_s_0), "");
}

function $add_dots(_lo_0, _failed_0) {
  const _message_0 = _lo_0["message"];
  const _count_0 = _lo_0["count"];
  const _op_0 = _lo_0["op"];
  const _gone_0 = _lo_0["gone"];
  const _st_0 = $$Bool_pick(_failed_0, "Data Currently Unavailable", $$stem(_message_0));
  const _x_0 = ((_count_0 + 1) >>> 0);
  const _c_0 = $$Bool_pick((_x_0 > 3), 1, ((_count_0 + 1) >>> 0));
  const _s_0 = (_st_0 + "...");
  const _x_1 = [...str_out(_s_0)].length;
  const _x_2 = (_c_0 );
  const _x_3 = nat_chk(_x_1 + _x_2);
  return {$: "Loading", "message": $$String_take(_s_0, (_x_3 < 3 ? 0 : _x_3 - 3)), "count": _c_0, "op": _op_0, "gone": _gone_0};
}

function $timer_dots(_app_0) {
  const _env_0 = _app_0["env"];
  const _net_0 = _app_0["net"];
  const _loading_0 = _app_0["loading"];
  const _w_0 = _app_0["w"];
  const _lo_0 = $$add_dots(_loading_0, $$any($$failed_of(_net_0)));
  return {$: "Out", "app": {$: "Fwdl", "env": _env_0, "net": _net_0, "loading": _lo_0, "w": _w_0}, "cmds": {$: "Con", "head": {$: "CHtml", "id": "loadingMessage", "html": $$message_of(_lo_0)}, "tail": {$: "Nil"}}};
}

function $fade_step(_lo_0) {
  const _message_0 = _lo_0["message"];
  const _count_0 = _lo_0["count"];
  const _op_0 = _lo_0["op"];
  const _gone_0 = _lo_0["gone"];
  const _x_0 = Math.fround(_op_0 * 0.10000000149011612);
  const _x_1 = (_op_0 <= 0.10000000149011612);
  return {$: "Loading", "message": _message_0, "count": _count_0, "op": Math.fround(_op_0 - _x_0), "gone": (_gone_0 || _x_1)};
}

function $fade_cmds(_lo_0) {
  const _op_0 = _lo_0["op"];
  const _x_0 = $$lib_num_show(Math.fround(_op_0 * 100));
  const _x_1 = (_x_0 + ")");
  const _shown_0 = {$: "Con", "head": {$: "CStyle", "id": "loadingScreen", "prop": "opacity", "value": $$lib_num_show(_op_0)}, "tail": {$: "Con", "head": {$: "CStyle", "id": "loadingScreen", "prop": "filter", "value": ("alpha(opacity=" + _x_1)}, "tail": {$: "Nil"}}};
  return $Bool_pick((_op_0 <= 0.10000000149011612), $$cat({$: "Con", "head": {$: "CStop", "key": "fade"}, "tail": {$: "Con", "head": {$: "CStyle", "id": "loadingScreen", "prop": "display", "value": "none"}, "tail": {$: "Con", "head": {$: "CStop", "key": "dots"}, "tail": {$: "Nil"}}}}, _shown_0), _shown_0);
}

function $timer_fade(_app_0) {
  const _env_0 = _app_0["env"];
  const _net_0 = _app_0["net"];
  const _loading_0 = _app_0["loading"];
  const _w_0 = _app_0["w"];
  return {$: "Out", "app": {$: "Fwdl", "env": _env_0, "net": _net_0, "loading": $$fade_step(_loading_0), "w": _w_0}, "cmds": $$fade_cmds(_loading_0)};
}

function $timer_screen(_dots_0, _app_0) {
  if (_dots_0) {
    return $timer_dots(_app_0);
  } else {
    return $timer_fade(_app_0);
  }
}

function $timer_go(_poll_0, _dots_0, _app_0) {
  if (_poll_0) {
    return $timer_poll(_app_0);
  } else {
    return $timer_screen(_dots_0, _app_0);
  }
}

function $timer(_app_0, _key_0, _now_0, _c_0) {
  const _env_0 = _app_0["env"];
  const _net_0 = _app_0["net"];
  const _loading_0 = _app_0["loading"];
  const _w_0 = _app_0["w"];
  return $timer_go($$String_eq(_key_0, "poll"), $$String_eq(_key_0, "dots"), {$: "Fwdl", "env": $$with_clock(_env_0, _c_0), "net": _net_0, "loading": _loading_0, "w": _w_0});
}

function $markup(_layout_0) {
  const _x_0 = $$lib_markup_upper();
  const _x_1 = $$Bool_pick($$String_eq(_layout_0, "02"), $$lib_markup_inner_02(), $$lib_markup_inner());
  return (_x_0 + _x_1);
}

function $button_kind(_id_0) {
  return $Bool_pick($$String_eq(_id_0, "PressureButton"), "Pressure", $$Bool_pick($$String_eq(_id_0, "WindButton"), "Wind", $$Bool_pick($$String_eq(_id_0, "RainfallButton"), "Rainfall", $$Bool_pick($$String_eq(_id_0, "TempButton"), "Temp", $$Bool_pick($$String_eq(_id_0, "AltitudeButton"), "Altitude", "")))));
}

function $measure_of(_k_0) {
  return $Bool_pick($$String_eq(_k_0, "Pressure"), {$: "Pressure"}, $$Bool_pick($$String_eq(_k_0, "Wind"), {$: "Wind"}, $$Bool_pick($$String_eq(_k_0, "Rainfall"), {$: "Rainfall"}, $$Bool_pick($$String_eq(_k_0, "Temp"), {$: "Temp"}, {$: "Altitude"}))));
}

function $with_units(_e_0, _u_0) {
  const _cr_0 = _e_0["cr"];
  const _cre_0 = _e_0["cre"];
  const _crh_0 = _e_0["crh"];
  const _crd_0 = _e_0["crd"];
  const _l_0 = _e_0["lang"];
  const _cfg_0 = _e_0["cfg"];
  const _c_0 = _e_0["clock"];
  return {$: "Env", "cr": _cr_0, "cre": _cre_0, "crh": _crh_0, "crd": _crd_0, "units": _u_0, "lang": _l_0, "cfg": _cfg_0, "clock": _c_0};
}

function $change_unit(_app_0, _k_0, _now_0) {
  const _env_0 = _app_0["env"];
  const _net_0 = _app_0["net"];
  const _loading_0 = _app_0["loading"];
  const _w_0 = _app_0["w"];
  const _env2_0 = $$with_units(_env_0, $$lib_units_cycle($$lib_env_units(_env_0), $$measure_of(_k_0)));
  const _w1_0 = $$wiring_units(_w_0, _env2_0, _k_0, _now_0);
  const _g_0 = $$widgets_graphs_units($$wiring_graphs_of(_w1_0), _env2_0, $$measure_of(_k_0));
  const _w2_0 = $$wiring_with_graphs(_w1_0, $$g_st(_g_0));
  const _rec_0 = $$Bool_pick($$g_ok(_g_0), $$widgets_records_units($$wiring_records_of(_w2_0), _env2_0), {$: "Nil"});
  return {$: "Out", "app": {$: "Fwdl", "env": _env2_0, "net": _net_0, "loading": _loading_0, "w": _w2_0}, "cmds": $$cat($$wiring_retip(_w2_0, _env2_0), $$cat($$g_cmds(_g_0), _rec_0))};
}

function $click_unit(_hit_0, _app_0, _k_0, _now_0) {
  if (_hit_0) {
    return $change_unit(_app_0, _k_0, _now_0);
  } else {
    return {$: "Out", "app": _app_0, "cmds": {$: "Nil"}};
  }
}

function $click_graphs(_o_0, _id_0) {
  const _t_0 = _o_0["app"];
  const _env_0 = _t_0["env"];
  const _net_0 = _t_0["net"];
  const _loading_0 = _t_0["loading"];
  const _w_0 = _t_0["w"];
  const _cmds_0 = _o_0["cmds"];
  const _g_0 = $$widgets_graphs_click($$wiring_graphs_of(_w_0), _env_0, _id_0);
  return {$: "Out", "app": {$: "Fwdl", "env": _env_0, "net": _net_0, "loading": _loading_0, "w": $$wiring_with_graphs(_w_0, $$g_st(_g_0))}, "cmds": $$cat(_cmds_0, $$g_cmds(_g_0))};
}

function $click_modals(_o_0, _id_0, _vw_0, _vh_0) {
  const _t_0 = _o_0["app"];
  const _env_0 = _t_0["env"];
  const _net_0 = _t_0["net"];
  const _loading_0 = _t_0["loading"];
  const _w_0 = _t_0["w"];
  const _cmds_0 = _o_0["cmds"];
  const _ro_0 = $$widgets_records_click($$wiring_records_of(_w_0), _env_0, _id_0, _vw_0, _vh_0);
  return {$: "Out", "app": {$: "Fwdl", "env": _env_0, "net": _net_0, "loading": _loading_0, "w": $$wiring_with_records(_w_0, $$r_st(_ro_0))}, "cmds": $$cat(_cmds_0, $$cat($$widgets_forecast_click(_env_0, _id_0), $$r_cmds(_ro_0)))};
}

function $click(_app_0, _id_0, _now_0, _vw_0, _vh_0) {
  const _env_0 = _app_0["env"];
  const __0 = _app_0["net"];
  const __1 = _app_0["loading"];
  const __2 = _app_0["w"];
  const _k_0 = $$button_kind(_id_0);
  return $click_modals($$click_graphs($$click_unit($$Bool_and($$lib_env_on(_env_0, "buttons.enabled"), $$Bool_not($$String_is_empty(_k_0))), {$: "Fwdl", "env": _env_0, "net": __0, "loading": __1, "w": __2}, _k_0, _now_0), _id_0), _id_0, _vw_0, _vh_0);
}

function $select(_app_0, _id_0, _value_0) {
  const _env_0 = _app_0["env"];
  const _net_0 = _app_0["net"];
  const _loading_0 = _app_0["loading"];
  const _w_0 = _app_0["w"];
  const _g_0 = $$widgets_graphs_select($$wiring_graphs_of(_w_0), _env_0, _id_0, _value_0);
  const _ro_0 = $$widgets_records_select($$wiring_records_of(_w_0), _env_0, _id_0, _value_0);
  return {$: "Out", "app": {$: "Fwdl", "env": _env_0, "net": _net_0, "loading": _loading_0, "w": $$wiring_with_records($$wiring_with_graphs(_w_0, $$g_st(_g_0)), $$r_st(_ro_0))}, "cmds": $$cat($$g_cmds(_g_0), $$r_cmds(_ro_0))};
}

function $Maybe_default(_m_0, _d_0) {
  if (_m_0.$ === "None") {
    return _d_0;
  } else {
    const _x_0 = _m_0["value"];
    return _x_0;
  }
}

function $String_trim(_s_0) {
  return $String_trim_end($$String_trim_start(_s_0));
}

function $String_is_empty(_s_0) {
  if (_s_0 === "") {
    return true;
  } else {
    return false;
  }
}

function $Bool_pick(_c_0, _a_0, _b_0) {
  if (!_c_0) {
    return _b_0;
  } else {
    return _a_0;
  }
}

function $F32_round(_a_0) {
  const _f_0 = Math.fround(Math.floor(_a_0));
  const _x_0 = Math.fround(_a_0 - _f_0);
  const _x_1 = $$Bool_pick((_x_0 >= 0.5), 1, 0);
  const _r_0 = Math.fround(_f_0 + _x_1);
  return $F32_round_zero(_a_0, _r_0, (_r_0 === 0));
}

function $String_eq(_a_0, _b_0) {
  return $Cmp_is_eq($$String_order(_a_0, _b_0));
}

function $F32_to_nat(_a_0) {
  const _wide_0 = $$Bool_and((_a_0 >= 4294967296), (_a_0 < 281474976710656));
  return $F32_to_nat_wide(_a_0, _wide_0);
}

function $String_reverse(_s_0) {
  return $String_reverse_go(_s_0, "");
}

function $List_reverse(_xs_0) {
  return $List_reverse_go(_xs_0, {$: "Nil"});
}

function $Char_is_eq(_a_0, _b_0) {
  const _x_0 = char_code(_a_0);
  const _y_0 = char_code(_b_0);
  return (_x_0 === _y_0);
}

function $List_get($0, $1) {
  for (;;) {
    {
      const _xs_0 = $0;
      const _n_0 = $1;
      if (_xs_0.$ === "Nil") {
        return {$: "None"};
      } else {
        const _h_0 = _xs_0["head"];
        const _t_0 = _xs_0["tail"];
        if (_n_0 == 0) {
          return {$: "Some", "value": _h_0};
        } else {
          const _p_0 = (_n_0 - 1);
          $0 = _t_0;
          $1 = _p_0;
          continue;
        }
      }
    }
  }
}

function $List_length(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return 0;
  } else {
    const _t_0 = _xs_0["tail"];
    return nat_chk($$List_length(_t_0) + 1);
  }
}

function $Bool_and(_a_0, _b_0) {
  if (!_a_0) {
    return false;
  } else {
    return _b_0;
  }
}

function $F32_min(_a_0, _b_0) {
  return $Bool_pick((_a_0 < _b_0), _a_0, _b_0);
}

function $Nat_is_ge(_a_0, _b_0) {
  return $Cmp_is_ge(cmp_new(_a_0, _b_0));
}

function $String_split(_s_0, _sep_0) {
  if (_s_0 === "") {
    return {$: "Con", "head": "", "tail": {$: "Nil"}};
  } else {
    const _h_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    return $String_split_fin(_h_0, $$String_split(_t_0, _sep_0), $$Char_is_eq(_h_0, _sep_0));
  }
}

function $Char_from_u32(_x_0) {
  return char_new(_x_0);
}

function $Bool_not(_b_0) {
  if (!_b_0) {
    return true;
  } else {
    return false;
  }
}

function $List_append(_xs_0, _ys_0) {
  if (_xs_0.$ === "Nil") {
    return _ys_0;
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    return {$: "Con", "head": _h_0, "tail": $$List_append(_t_0, _ys_0)};
  }
}

function $F32_pi() {
  return 3.1415927410125732;
}

function $Nat_is_eq(_a_0, _b_0) {
  return $Cmp_is_eq(cmp_new(_a_0, _b_0));
}

function $Nat_mod(_a_0, _b_0) {
  return $Pair_snd(nat_divmod(_a_0, _b_0));
}

function $Char_to_u32(_c_0) {
  const _x_0 = char_code(_c_0);
  return _x_0;
}

function $Char_is_digit(_c_0) {
  const _x_0 = char_code(_c_0);
  return $Bool_and((_x_0 >= 48), (_x_0 <= 57));
}

function $U32_show(_a_0) {
  const _b_0 = _a_0;
  return $U32_show_if(_b_0, (_b_0 === 0));
}

function $List_head(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "None"};
  } else {
    const _h_0 = _xs_0["head"];
    return {$: "Some", "value": _h_0};
  }
}

function $List_drop($0, $1) {
  for (;;) {
    {
      const _xs_0 = $0;
      const _n_0 = $1;
      if (_xs_0.$ === "Nil") {
        return {$: "Nil"};
      } else {
        const _h_0 = _xs_0["head"];
        const _t_0 = _xs_0["tail"];
        if (_n_0 == 0) {
          return {$: "Con", "head": _h_0, "tail": _t_0};
        } else {
          const _p_0 = (_n_0 - 1);
          $0 = _t_0;
          $1 = _p_0;
          continue;
        }
      }
    }
  }
}

function $List_take(_xs_0, _n_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    if (_n_0 == 0) {
      return {$: "Nil"};
    } else {
      const _p_0 = (_n_0 - 1);
      return {$: "Con", "head": _h_0, "tail": $$List_take(_t_0, _p_0)};
    }
  }
}

function $String_trim_start($0, $1, $2) {
  let $pc = 0;
  for (;;) switch ($pc) {
    case 0: {
      const _s_0 = $0;
      if (_s_0 === "") {
        return "";
      } else {
        const _h_0 = _s_0.slice(0, char_len(_s_0));
        const _t_0 = _s_0.slice(char_len(_s_0));
        $0 = _t_0;
        $1 = _h_0;
        $2 = $$Char_is_space(_h_0);
        $pc = 1; continue;
      }
    }
    case 1: {
      const _t_0 = $0;
      const _h_0 = $1;
      const _space_0 = $2;
      if (!_space_0) {
        return (_h_0 + _t_0);
      } else {
        $0 = _t_0;
        $pc = 0; continue;
      }
    }
  }
}

function $List_last(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "None"};
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    return {$: "Some", "value": $$List_last_go(_t_0, _h_0)};
  }
}

function $List_is_empty(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return true;
  } else {
    return false;
  }
}

function $String_take(_s_0, _n_0) {
  if (_s_0 === "") {
    return "";
  } else {
    const _h_0 = _s_0.slice(0, char_len(_s_0));
    const _t_0 = _s_0.slice(char_len(_s_0));
    if (_n_0 == 0) {
      return "";
    } else {
      const _p_0 = (_n_0 - 1);
      return (_h_0 + $$String_take(_t_0, _p_0));
    }
  }
}

function $Nat_is_le(_a_0, _b_0) {
  return $Cmp_is_le(cmp_new(_a_0, _b_0));
}

function $Nat_is_gt(_a_0, _b_0) {
  return $Cmp_is_gt(cmp_new(_a_0, _b_0));
}

function $String_drop($0, $1) {
  for (;;) {
    {
      const _s_0 = $0;
      const _n_0 = $1;
      if (_s_0 === "") {
        return "";
      } else {
        const _h_0 = _s_0.slice(0, char_len(_s_0));
        const _t_0 = _s_0.slice(char_len(_s_0));
        if (_n_0 == 0) {
          return (_h_0 + _t_0);
        } else {
          const _p_0 = (_n_0 - 1);
          $0 = _t_0;
          $1 = _p_0;
          continue;
        }
      }
    }
  }
}

function $Char_is_alpha(_c_0) {
  const _x_0 = $$Char_is_upper(_c_0);
  const _x_1 = $$Char_is_lower(_c_0);
  return (_x_0 || _x_1);
}

function $List_tail(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _t_0 = _xs_0["tail"];
    return _t_0;
  }
}

function $List_set(_xs_0, _n_0, _x_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    if (_n_0 == 0) {
      return {$: "Con", "head": _x_0, "tail": _t_0};
    } else {
      const _p_0 = (_n_0 - 1);
      return {$: "Con", "head": _h_0, "tail": $$List_set(_t_0, _p_0, _x_0)};
    }
  }
}

function $String_starts_with(_s_0, _p_0) {
  return $String_starts_with_go(_p_0, _s_0);
}

function $String_trim_end(_s_0) {
  return $String_reverse($$String_trim_start($$String_reverse(_s_0)));
}

function $F32_round_zero(_a_0, _r_0, _zero_0) {
  if (_zero_0) {
    return Math.fround(_a_0 * 0);
  } else {
    return _r_0;
  }
}

function $Cmp_is_eq(_c_0) {
  if (_c_0.$ === "EQ") {
    return true;
  } else {
    return false;
  }
}

function $String_order(_a_0, _b_0) {
  return $String_order_go(_a_0, _b_0, {$: "EQ"});
}

function $F32_to_nat_wide(_a_0, _wide_0) {
  if (!_wide_0) {
    const _x_0 = (_a_0 >= 1 && _a_0 < 4294967296 ? Math.floor(_a_0) : 0);
    return (_x_0 );
  } else {
    const _x_1 = Math.fround(_a_0 / 4294967296);
    const _x_2 = (_x_1 >= 1 && _x_1 < 4294967296 ? Math.floor(_x_1) : 0);
    const _hi_0 = (_x_2 );
    const _x_3 = Math.fround(_a_0 % 4294967296);
    const _x_4 = (_x_3 >= 1 && _x_3 < 4294967296 ? Math.floor(_x_3) : 0);
    const _lo_0 = (_x_4 );
    const _x_5 = (65536 );
    const _x_6 = (65536 );
    const _x_7 = nat_chk(_x_5 * _x_6);
    const _x_8 = nat_chk(_hi_0 * _x_7);
    return nat_chk(_x_8 + _lo_0);
  }
}

function $String_reverse_go($0, $1) {
  for (;;) {
    {
      const _s_0 = $0;
      const _acc_0 = $1;
      if (_s_0 === "") {
        return _acc_0;
      } else {
        const _h_0 = _s_0.slice(0, char_len(_s_0));
        const _t_0 = _s_0.slice(char_len(_s_0));
        $0 = _t_0;
        $1 = (_h_0 + _acc_0);
        continue;
      }
    }
  }
}

function $List_reverse_go($0, $1) {
  for (;;) {
    {
      const _xs_0 = $0;
      const _acc_0 = $1;
      if (_xs_0.$ === "Nil") {
        return _acc_0;
      } else {
        const _h_0 = _xs_0["head"];
        const _t_0 = _xs_0["tail"];
        $0 = _t_0;
        $1 = {$: "Con", "head": _h_0, "tail": _acc_0};
        continue;
      }
    }
  }
}

function $Cmp_is_ge(_c_0) {
  if (_c_0.$ === "LT") {
    return false;
  } else {
    return true;
  }
}

function $String_split_fin(_c_0, _r_0, _cut_0) {
  if (!_cut_0) {
    return $String_split_push(_c_0, _r_0);
  } else {
    return {$: "Con", "head": "", "tail": _r_0};
  }
}

function $Pair_snd(_p_0) {
  const _b_0 = _p_0["snd"];
  return _b_0;
}

function $U32_show_if(_a_0, _z_0) {
  if (_z_0) {
    return "0";
  } else {
    return $U32_show_go(10, _a_0, "");
  }
}

function $String_trim_start_if($0, $1, $2) {
  let $pc = 1;
  for (;;) switch ($pc) {
    case 0: {
      const _s_0 = $0;
      if (_s_0 === "") {
        return "";
      } else {
        const _h_0 = _s_0.slice(0, char_len(_s_0));
        const _t_0 = _s_0.slice(char_len(_s_0));
        $0 = _t_0;
        $1 = _h_0;
        $2 = $$Char_is_space(_h_0);
        $pc = 1; continue;
      }
    }
    case 1: {
      const _t_0 = $0;
      const _h_0 = $1;
      const _space_0 = $2;
      if (!_space_0) {
        return (_h_0 + _t_0);
      } else {
        $0 = _t_0;
        $pc = 0; continue;
      }
    }
  }
}

function $Char_is_space(_c_0) {
  const _x_0 = char_code(_c_0);
  const _x_1 = (_x_0 === 32);
  const _x_2 = $$Bool_and((_x_0 >= 9), (_x_0 <= 13));
  return (_x_1 || _x_2);
}

function $List_last_go($0, $1) {
  for (;;) {
    {
      const _xs_0 = $0;
      const _last_0 = $1;
      if (_xs_0.$ === "Nil") {
        return _last_0;
      } else {
        const _h_0 = _xs_0["head"];
        const _t_0 = _xs_0["tail"];
        $0 = _t_0;
        $1 = _h_0;
        continue;
      }
    }
  }
}

function $String_contains_if($0, $1, $2) {
  let $pc = 0;
  for (;;) switch ($pc) {
    case 0: {
      const _t_0 = $0;
      const _p_0 = $1;
      const _here_0 = $2;
      if (!_here_0) {
        $0 = _t_0;
        $1 = _p_0;
        $pc = 1; continue;
      } else {
        return true;
      }
    }
    case 1: {
      const _s_0 = $0;
      const _p_0 = $1;
      if (_s_0 === "") {
        return $String_is_empty(_p_0);
      } else {
        const _h_0 = _s_0.slice(0, char_len(_s_0));
        const _t_0 = _s_0.slice(char_len(_s_0));
        $0 = _t_0;
        $1 = _p_0;
        $2 = $$String_starts_with((_h_0 + _t_0), _p_0);
        $pc = 0; continue;
      }
    }
  }
}

function $Cmp_is_le(_c_0) {
  if (_c_0.$ === "GT") {
    return false;
  } else {
    return true;
  }
}

function $Cmp_is_gt(_c_0) {
  if (_c_0.$ === "GT") {
    return true;
  } else {
    return false;
  }
}

function $Char_is_upper(_c_0) {
  const _x_0 = char_code(_c_0);
  return $Bool_and((_x_0 >= 65), (_x_0 <= 90));
}

function $Char_is_lower(_c_0) {
  const _x_0 = char_code(_c_0);
  return $Bool_and((_x_0 >= 97), (_x_0 <= 122));
}

function $String_starts_with_go($0, $1, $2) {
  let $pc = 0;
  for (;;) switch ($pc) {
    case 0: {
      const _p_0 = $0;
      const _s_0 = $1;
      if (_p_0 === "") {
        return true;
      } else {
        const _y_0 = _p_0.slice(0, char_len(_p_0));
        const _yt_0 = _p_0.slice(char_len(_p_0));
        if (_s_0 === "") {
          return false;
        } else {
          const _x_0 = _s_0.slice(0, char_len(_s_0));
          const _xt_0 = _s_0.slice(char_len(_s_0));
          $0 = _yt_0;
          $1 = _xt_0;
          $2 = $$Char_is_eq(_x_0, _y_0);
          $pc = 1; continue;
        }
      }
    }
    case 1: {
      const _pt_0 = $0;
      const _t_0 = $1;
      const _same_0 = $2;
      if (!_same_0) {
        return false;
      } else {
        $0 = _pt_0;
        $1 = _t_0;
        $pc = 0; continue;
      }
    }
  }
}

function $String_order_go($0, $1, $2) {
  for (;;) {
    {
      const _a_0 = $0;
      const _b_0 = $1;
      const _c_0 = $2;
      if (_a_0 === "") {
        if (_b_0 !== "") {
          if (_c_0.$ === "EQ") {
            return {$: "LT"};
          } else {
            return _c_0;
          }
        } else {
          return _c_0;
        }
      } else {
        const _t_1 = _a_0.slice(0, char_len(_a_0));
        const _x_0 = char_code(_t_1);
        const _t_2 = _a_0.slice(char_len(_a_0));
        if (_b_0 === "") {
          if (_c_0.$ === "EQ") {
            return {$: "GT"};
          } else {
            return _c_0;
          }
        } else {
          const _t_3 = _b_0.slice(0, char_len(_b_0));
          const _y_0 = char_code(_t_3);
          const _t2_0 = _b_0.slice(char_len(_b_0));
          if (_c_0.$ === "EQ") {
            $0 = _t_2;
            $1 = _t2_0;
            $2 = cmp_new(_x_0, _y_0);
            continue;
          } else {
            return _c_0;
          }
        }
      }
    }
  }
}

function $String_split_push(_c_0, _ps_0) {
  if (_ps_0.$ === "Nil") {
    return {$: "Con", "head": (_c_0 + ""), "tail": {$: "Nil"}};
  } else {
    const _h_0 = _ps_0["head"];
    const _t_0 = _ps_0["tail"];
    return {$: "Con", "head": (_c_0 + _h_0), "tail": _t_0};
  }
}

function $U32_show_go($0, $1, $2, $3) {
  let $pc = 0;
  for (;;) switch ($pc) {
    case 0: {
      const _f_0 = $0;
      const _n_0 = $1;
      const _acc_0 = $2;
      if (_f_0 == 0) {
        return _acc_0;
      } else {
        const _g_0 = (_f_0 - 1);
        $0 = _g_0;
        $1 = _acc_0;
        $2 = _n_0;
        $3 = (_n_0 === 0);
        $pc = 1; continue;
      }
    }
    case 1: {
      const _g_0 = $0;
      const _acc_0 = $1;
      const _n_0 = $2;
      const _z_0 = $3;
      if (_z_0) {
        return _acc_0;
      } else {
        const _x_0 = (10 === 0 ? _n_0 : _n_0 % 10);
        $0 = _g_0;
        $1 = (10 === 0 ? 0 : (_n_0 / 10) >>> 0);
        $2 = (char_new(((48 + _x_0) >>> 0)) + _acc_0);
        $pc = 0; continue;
      }
    }
  }
}

function $String_starts_with_go_if($0, $1, $2) {
  let $pc = 1;
  for (;;) switch ($pc) {
    case 0: {
      const _p_0 = $0;
      const _s_0 = $1;
      if (_p_0 === "") {
        return true;
      } else {
        const _y_0 = _p_0.slice(0, char_len(_p_0));
        const _yt_0 = _p_0.slice(char_len(_p_0));
        if (_s_0 === "") {
          return false;
        } else {
          const _x_0 = _s_0.slice(0, char_len(_s_0));
          const _xt_0 = _s_0.slice(char_len(_s_0));
          $0 = _yt_0;
          $1 = _xt_0;
          $2 = $$Char_is_eq(_x_0, _y_0);
          $pc = 1; continue;
        }
      }
    }
    case 1: {
      const _pt_0 = $0;
      const _t_0 = $1;
      const _same_0 = $2;
      if (!_same_0) {
        return false;
      } else {
        $0 = _pt_0;
        $1 = _t_0;
        $pc = 0; continue;
      }
    }
  }
}

function $U32_show_fin($0, $1, $2, $3) {
  let $pc = 1;
  for (;;) switch ($pc) {
    case 0: {
      const _f_0 = $0;
      const _n_0 = $1;
      const _acc_0 = $2;
      if (_f_0 == 0) {
        return _acc_0;
      } else {
        const _g_0 = (_f_0 - 1);
        $0 = _g_0;
        $1 = _acc_0;
        $2 = _n_0;
        $3 = (_n_0 === 0);
        $pc = 1; continue;
      }
    }
    case 1: {
      const _g_0 = $0;
      const _acc_0 = $1;
      const _n_0 = $2;
      const _z_0 = $3;
      if (_z_0) {
        return _acc_0;
      } else {
        const _x_0 = (10 === 0 ? _n_0 : _n_0 % 10);
        $0 = _g_0;
        $1 = (10 === 0 ? 0 : (_n_0 / 10) >>> 0);
        $2 = (char_new(((48 + _x_0) >>> 0)) + _acc_0);
        $pc = 0; continue;
      }
    }
  }
}

const $$lib_num_nan = $lib_num_nan;
const $$String_trim = $String_trim;
const $$String_is_empty = $String_is_empty;
const $$lib_num_pow10 = $lib_num_pow10;
const $$F32_round = $F32_round;
const $$String_eq = $String_eq;
const $$lib_num_pick_s = $lib_num_pick_s;
const $$lib_num_is_nan = $lib_num_is_nan;
const $$lib_num_parse = $lib_num_parse;
const $$String_reverse = $String_reverse;
const $$lib_raw_fix = $lib_raw_fix;
const $$Char_is_eq = $Char_is_eq;
const $$lib_raw_split_cur = $lib_raw_split_cur;
const $$lib_raw_split_acc = $lib_raw_split_acc;
const $$List_get = $List_get;
const $$lib_raw_same = $lib_raw_same;
const $$lib_units_key_of = $lib_units_key_of;
const $$lib_units_find = $lib_units_find;
const $$lib_units_current = $lib_units_current;
const $$lib_units_table = $lib_units_table;
const $$lib_units_unit = $lib_units_unit;
const $$lib_num_round_to = $lib_num_round_to;
const $$Bool_pick = $Bool_pick;
const $$Nat_is_ge = $Nat_is_ge;
const $$lib_units_nonzero = $lib_units_nonzero;
const $$lib_units_beaufort = $lib_units_beaufort;
const $$lib_units_is_temp = $lib_units_is_temp;
const $$Bool_and = $Bool_and;
const $$lib_units_value = $lib_units_value;
const $$lib_num_show = $lib_num_show;
const $$lib_units_show_raw = $lib_units_show_raw;
const $$lib_units_label = $lib_units_label;
const $$lib_units_next = $lib_units_next;
const $$lib_units_first_key = $lib_units_first_key;
const $$lib_env_kv_after = $lib_env_kv_after;
const $$lib_env_kv_before = $lib_env_kv_before;
const $$lib_env_kv_list = $lib_env_kv_list;
const $$lib_env_kv_parse = $lib_env_kv_parse;
const $$Char_from_u32 = $Char_from_u32;
const $$String_split = $String_split;
const $$lib_env_lang = $lib_env_lang;
const $$lib_env_units = $lib_env_units;
const $$lib_env_kv_key = $lib_env_kv_key;
const $$lib_env_kv_val = $lib_env_kv_val;
const $$lib_env_find = $lib_env_find;
const $$lib_env_opt = $lib_env_opt;
const $$Bool_not = $Bool_not;
const $$lib_scene_origin = $lib_scene_origin;
const $$lib_scene_at = $lib_scene_at;
const $$F32_min = $F32_min;
const $$lib_env_cr = $lib_env_cr;
const $$lib_env_changed = $lib_env_changed;
const $$lib_env_reading = $lib_env_reading;
const $$lib_num_cdim = $lib_num_cdim;
const $$lib_scene_ex = $lib_scene_ex;
const $$lib_scene_ex_mul = $lib_scene_ex_mul;
const $$lib_num_sharpen = $lib_num_sharpen;
const $$lib_scene_shape = $lib_scene_shape;
const $$lib_scene_boldx = $lib_scene_boldx;
const $$lib_scene_label = $lib_scene_label;
const $$lib_env_word = $lib_env_word;
const $$lib_scene_max_centred = $lib_scene_max_centred;
const $$lib_scene_label_w = $lib_scene_label_w;
const $$lib_tween_elapsed = $lib_tween_elapsed;
const $$lib_tween_ratio = $lib_tween_ratio;
const $$lib_tween_quart_in_out = $lib_tween_quart_in_out;
const $$lib_tween_value = $lib_tween_value;
const $$lib_tween_progress = $lib_tween_progress;
const $$widgets_tempbar_c_fill = $widgets_tempbar_c_fill;
const $$widgets_tempbar_c_temp = $widgets_tempbar_c_temp;
const $$widgets_tempbar_c_low = $widgets_tempbar_c_low;
const $$lib_tween_still = $lib_tween_still;
const $$widgets_tempbar_arrow = $widgets_tempbar_arrow;
const $$widgets_tempbar_is_wc = $widgets_tempbar_is_wc;
const $$widgets_tempbar_ok_index = $widgets_tempbar_ok_index;
const $$lib_num_nat_of = $lib_num_nat_of;
const $$lib_env_cre = $lib_env_cre;
const $$widgets_tempbar_cre_at = $widgets_tempbar_cre_at;
const $$widgets_tempbar_cr_at = $widgets_tempbar_cr_at;
const $$widgets_tempbar_ne = $widgets_tempbar_ne;
const $$widgets_tempbar_switch = $widgets_tempbar_switch;
const $$lib_env_on = $lib_env_on;
const $$widgets_tempbar_changed_t = $widgets_tempbar_changed_t;
const $$widgets_tempbar_is01 = $widgets_tempbar_is01;
const $$widgets_tempbar_below = $widgets_tempbar_below;
const $$widgets_tempbar_above = $widgets_tempbar_above;
const $$widgets_tempbar_raise_ok = $widgets_tempbar_raise_ok;
const $$widgets_tempbar_lower_ok = $widgets_tempbar_lower_ok;
const $$widgets_tempbar_fuel = $widgets_tempbar_fuel;
const $$widgets_tempbar_min_down = $widgets_tempbar_min_down;
const $$widgets_tempbar_max_up = $widgets_tempbar_max_up;
const $$widgets_tempbar_min_up = $widgets_tempbar_min_up;
const $$widgets_tempbar_max_down = $widgets_tempbar_max_down;
const $$lib_num_map = $lib_num_map;
const $$lib_tween_to = $lib_tween_to;
const $$lib_num_int = $lib_num_int;
const $$widgets_tempbar_vals_range = $widgets_tempbar_vals_range;
const $$widgets_tempbar_old_trend_changed = $widgets_tempbar_old_trend_changed;
const $$widgets_tempbar_retween = $widgets_tempbar_retween;
const $$widgets_tempbar_tmode_set = $widgets_tempbar_tmode_set;
const $$widgets_tempbar_switched = $widgets_tempbar_switched;
const $$widgets_tempbar_inputs = $widgets_tempbar_inputs;
const $$widgets_tempbar_should = $widgets_tempbar_should;
const $$widgets_tempbar_vals_trend = $widgets_tempbar_vals_trend;
const $$lib_num_of_nat = $lib_num_of_nat;
const $$widgets_tempbar_gap_at = $widgets_tempbar_gap_at;
const $$widgets_tempbar_dash = $widgets_tempbar_dash;
const $$widgets_tempbar_dashes = $widgets_tempbar_dashes;
const $$widgets_tempbar_labels = $widgets_tempbar_labels;
const $$widgets_tempbar_spread_go = $widgets_tempbar_spread_go;
const $$widgets_tempbar_hl_hy = $widgets_tempbar_hl_hy;
const $$widgets_tempbar_hl_ly = $widgets_tempbar_hl_ly;
const $$lib_scene_ex_div = $lib_scene_ex_div;
const $$widgets_tempbar_spread = $widgets_tempbar_spread;
const $$lib_env_label = $lib_env_label;
const $$widgets_tempbar_title_go = $widgets_tempbar_title_go;
const $$lib_scene_masked = $lib_scene_masked;
const $$widgets_tempbar_hl_on = $widgets_tempbar_hl_on;
const $$widgets_tempbar_hl_nodes = $widgets_tempbar_hl_nodes;
const $$widgets_tempbar_arrow_nodes = $widgets_tempbar_arrow_nodes;
const $$lib_scene_plainx = $lib_scene_plainx;
const $$List_append = $List_append;
const $$widgets_barometer_trend_text = $widgets_barometer_trend_text;
const $$F32_pi = $F32_pi;
const $$widgets_humidity_half_angle = $widgets_humidity_half_angle;
const $$widgets_humidity_pfloat = $widgets_humidity_pfloat;
const $$widgets_humidity_redraw = $widgets_humidity_redraw;
const $$lib_scene_shape_at = $lib_scene_shape_at;
const $$widgets_humidity_dashes = $widgets_humidity_dashes;
const $$widgets_humidity_labels = $widgets_humidity_labels;
const $$lib_scene_rgb = $lib_scene_rgb;
const $$widgets_humidity_stray_dash = $widgets_humidity_stray_dash;
const $$widgets_humidity_arrow = $widgets_humidity_arrow;
const $$widgets_humidity_front = $widgets_humidity_front;
const $$widgets_moonsun_fresh = $widgets_moonsun_fresh;
const $$widgets_moonsun_differs = $widgets_moonsun_differs;
const $$widgets_moonsun_texts = $widgets_moonsun_texts;
const $$widgets_moonsun_line = $widgets_moonsun_line;
const $$widgets_solar_next = $widgets_solar_next;
const $$widgets_solar_seq = $widgets_solar_seq;
const $$widgets_solar_up_test = $widgets_solar_up_test;
const $$widgets_solar_prev = $widgets_solar_prev;
const $$widgets_solar_down_test = $widgets_solar_down_test;
const $$widgets_solar_up = $widgets_solar_up;
const $$widgets_solar_range = $widgets_solar_range;
const $$widgets_solar_rng_max = $widgets_solar_rng_max;
const $$widgets_solar_apply = $widgets_solar_apply;
const $$widgets_solar_modf = $widgets_solar_modf;
const $$widgets_solar_dash = $widgets_solar_dash;
const $$widgets_solar_label = $widgets_solar_label;
const $$widgets_solar_scale = $widgets_solar_scale;
const $$widgets_solar_rest = $widgets_solar_rest;
const $$widgets_status_blank = $widgets_status_blank;
const $$widgets_status_phase = $widgets_status_phase;
const $$widgets_status_percent = $widgets_status_percent;
const $$widgets_status_hidden_at = $widgets_status_hidden_at;
const $$widgets_status_apply = $widgets_status_apply;
const $$widgets_status_all4 = $widgets_status_all4;
const $$widgets_status_any4 = $widgets_status_any4;
const $$widgets_status_unscore = $widgets_status_unscore;
const $$widgets_status_rev_tail = $widgets_status_rev_tail;
const $$widgets_status_rev_head = $widgets_status_rev_head;
const $$widgets_status_is_undef = $widgets_status_is_undef;
const $$widgets_status_station = $widgets_status_station;
const $$widgets_status_time = $widgets_status_time;
const $$widgets_status_colour = $widgets_status_colour;
const $$widgets_status_blink = $widgets_status_blink;
const $$widgets_status_status_text = $widgets_status_status_text;
const $$widgets_status_check = $widgets_status_check;
const $$widgets_status_throws = $widgets_status_throws;
const $$widgets_status_throws_late = $widgets_status_throws_late;
const $$widgets_status_apply_data = $widgets_status_apply_data;
const $$widgets_status_circle = $widgets_status_circle;
const $$lib_scene_max_left = $lib_scene_max_left;
const $$widgets_rainbar_seq = $widgets_rainbar_seq;
const $$widgets_rainbar_shrink_test = $widgets_rainbar_shrink_test;
const $$widgets_rainbar_field = $widgets_rainbar_field;
const $$widgets_rainbar_grow = $widgets_rainbar_grow;
const $$widgets_rainbar_shrink = $widgets_rainbar_shrink;
const $$widgets_rainbar_rng_max = $widgets_rainbar_rng_max;
const $$widgets_rainbar_rng_pos = $widgets_rainbar_rng_pos;
const $$Nat_mod = $Nat_mod;
const $$Nat_is_eq = $Nat_is_eq;
const $$widgets_rainbar_dash = $widgets_rainbar_dash;
const $$widgets_rainbar_dash_unset = $widgets_rainbar_dash_unset;
const $$widgets_rainbar_dashes = $widgets_rainbar_dashes;
const $$widgets_rainbar_labels = $widgets_rainbar_labels;
const $$lib_scene_rgba = $lib_scene_rgba;
const $$widgets_rainbar_title = $widgets_rainbar_title;
const $$widgets_winddir_unwrap = $widgets_winddir_unwrap;
const $$widgets_winddir_pfloat = $widgets_winddir_pfloat;
const $$widgets_winddir_redraw = $widgets_winddir_redraw;
const $$widgets_winddir_dashes = $widgets_winddir_dashes;
const $$widgets_winddir_pointer = $widgets_winddir_pointer;
const $$widgets_winddir_compass = $widgets_winddir_compass;
const $$widgets_winddir_front = $widgets_winddir_front;
const $$widgets_windspeed_up_test = $widgets_windspeed_up_test;
const $$widgets_windspeed_down_test = $widgets_windspeed_down_test;
const $$widgets_windspeed_up = $widgets_windspeed_up;
const $$widgets_windspeed_range = $widgets_windspeed_range;
const $$widgets_windspeed_apply = $widgets_windspeed_apply;
const $$widgets_windspeed_modf = $widgets_windspeed_modf;
const $$widgets_windspeed_dash = $widgets_windspeed_dash;
const $$widgets_windspeed_label = $widgets_windspeed_label;
const $$widgets_windspeed_beaufort = $widgets_windspeed_beaufort;
const $$widgets_windspeed_colour = $widgets_windspeed_colour;
const $$widgets_windspeed_dashes = $widgets_windspeed_dashes;
const $$widgets_windspeed_labels = $widgets_windspeed_labels;
const $$lib_dates_fdiv = $lib_dates_fdiv;
const $$lib_dates_fmod = $lib_dates_fmod;
const $$lib_dates_leap = $lib_dates_leap;
const $$lib_dates_weekday = $lib_dates_weekday;
const $$lib_dates_ok = $lib_dates_ok;
const $$lib_dates_iso_weekday = $lib_dates_iso_weekday;
const $$lib_dates_add_days = $lib_dates_add_days;
const $$lib_dates_civil = $lib_dates_civil;
const $$lib_dates_ymd_m = $lib_dates_ymd_m;
const $$lib_dates_dim = $lib_dates_dim;
const $$lib_dates_days = $lib_dates_days;
const $$lib_dates_set_month_go = $lib_dates_set_month_go;
const $$lib_dates_month = $lib_dates_month;
const $$lib_dates_stamp = $lib_dates_stamp;
const $$lib_dates_stamps = $lib_dates_stamps;
const $$Char_to_u32 = $Char_to_u32;
const $$Char_is_digit = $Char_is_digit;
const $$lib_dates_digit = $lib_dates_digit;
const $$lib_dates_scan_two = $lib_dates_scan_two;
const $$lib_dates_scan_num = $lib_dates_scan_num;
const $$lib_dates_scan_colon = $lib_dates_scan_colon;
const $$lib_dates_scan_of = $lib_dates_scan_of;
const $$lib_dates_scan_found = $lib_dates_scan_found;
const $$lib_dates_scan_rest = $lib_dates_scan_rest;
const $$lib_dates_scan_v = $lib_dates_scan_v;
const $$lib_dates_put = $lib_dates_put;
const $$lib_dates_no_got = $lib_dates_no_got;
const $$lib_dates_run = $lib_dates_run;
const $$U32_show = $U32_show;
const $$widgets_graphs_list_key = $widgets_graphs_list_key;
const $$widgets_graphs_enabled_go = $widgets_graphs_enabled_go;
const $$widgets_graphs_base_on = $widgets_graphs_base_on;
const $$widgets_graphs_bases = $widgets_graphs_bases;
const $$widgets_graphs_spans = $widgets_graphs_spans;
const $$List_head = $List_head;
const $$widgets_graphs_title_word = $widgets_graphs_title_word;
const $$widgets_graphs_title_tail = $widgets_graphs_title_tail;
const $$widgets_graphs_rgba = $widgets_graphs_rgba;
const $$widgets_graphs_raw = $widgets_graphs_raw;
const $$widgets_graphs_range_raw = $widgets_graphs_range_raw;
const $$widgets_graphs_vals = $widgets_graphs_vals;
const $$List_drop = $List_drop;
const $$List_take = $List_take;
const $$lib_env_clock = $lib_env_clock;
const $$lib_dates_fmt_dd = $lib_dates_fmt_dd;
const $$lib_dates_fmt_mm = $lib_dates_fmt_mm;
const $$widgets_graphs_week_base = $widgets_graphs_week_base;
const $$widgets_graphs_month_base = $widgets_graphs_month_base;
const $$widgets_graphs_rain7_go = $widgets_graphs_rain7_go;
const $$widgets_graphs_week_shift = $widgets_graphs_week_shift;
const $$widgets_graphs_month_shift = $widgets_graphs_month_shift;
const $$widgets_graphs_js_int_digits = $widgets_graphs_js_int_digits;
const $$String_trim_start = $String_trim_start;
const $$widgets_graphs_nth = $widgets_graphs_nth;
const $$widgets_graphs_hour_of = $widgets_graphs_hour_of;
const $$widgets_graphs_js_int = $widgets_graphs_js_int;
const $$widgets_graphs_js_mod = $widgets_graphs_js_mod;
const $$widgets_graphs_to24 = $widgets_graphs_to24;
const $$List_last = $List_last;
const $$lib_dates_fmt_dd_hh_mm = $lib_dates_fmt_dd_hh_mm;
const $$lib_dates_parse = $lib_dates_parse;
const $$widgets_graphs_hour_moments = $widgets_graphs_hour_moments;
const $$widgets_graphs_back_day = $widgets_graphs_back_day;
const $$widgets_graphs_before = $widgets_graphs_before;
const $$widgets_graphs_last = $widgets_graphs_last;
const $$widgets_graphs_max_hour = $widgets_graphs_max_hour;
const $$lib_dates_today_dd = $lib_dates_today_dd;
const $$widgets_graphs_days31 = $widgets_graphs_days31;
const $$lib_env_crd = $lib_env_crd;
const $$lib_dates_add_minutes = $lib_dates_add_minutes;
const $$widgets_graphs_mins60 = $widgets_graphs_mins60;
const $$widgets_graphs_quarters28 = $widgets_graphs_quarters28;
const $$lib_dates_set_iso_weekday = $lib_dates_set_iso_weekday;
const $$widgets_graphs_week7 = $widgets_graphs_week7;
const $$lib_dates_set_month = $lib_dates_set_month;
const $$lib_dates_add_months = $lib_dates_add_months;
const $$widgets_graphs_month12 = $widgets_graphs_month12;
const $$widgets_graphs_stamp_month = $widgets_graphs_stamp_month;
const $$widgets_graphs_stamp_week = $widgets_graphs_stamp_week;
const $$widgets_graphs_stamp_day = $widgets_graphs_stamp_day;
const $$widgets_graphs_stamp_hour = $widgets_graphs_stamp_hour;
const $$widgets_graphs_stamp_minute = $widgets_graphs_stamp_minute;
const $$widgets_graphs_stamp_quarter = $widgets_graphs_stamp_quarter;
const $$widgets_graphs_fmt_val = $widgets_graphs_fmt_val;
const $$widgets_graphs_points = $widgets_graphs_points;
const $$widgets_graphs_values = $widgets_graphs_values;
const $$widgets_graphs_labels = $widgets_graphs_labels;
const $$widgets_graphs_unit = $widgets_graphs_unit;
const $$widgets_graphs_label_word = $widgets_graphs_label_word;
const $$widgets_graphs_unit_tag = $widgets_graphs_unit_tag;
const $$widgets_graphs_stamps = $widgets_graphs_stamps;
const $$widgets_graphs_src = $widgets_graphs_src;
const $$widgets_graphs_series_of = $widgets_graphs_series_of;
const $$widgets_graphs_two = $widgets_graphs_two;
const $$widgets_graphs_legend_word = $widgets_graphs_legend_word;
const $$widgets_graphs_axis_label = $widgets_graphs_axis_label;
const $$widgets_graphs_style = $widgets_graphs_style;
const $$widgets_graphs_style2 = $widgets_graphs_style2;
const $$widgets_graphs_src2 = $widgets_graphs_src2;
const $$widgets_graphs_time_display = $widgets_graphs_time_display;
const $$widgets_graphs_px = $widgets_graphs_px;
const $$widgets_graphs_white = $widgets_graphs_white;
const $$widgets_graphs_small_x = $widgets_graphs_small_x;
const $$widgets_graphs_bar_set = $widgets_graphs_bar_set;
const $$widgets_graphs_is_bar = $widgets_graphs_is_bar;
const $$widgets_graphs_chart_labels = $widgets_graphs_chart_labels;
const $$widgets_graphs_chart_sets = $widgets_graphs_chart_sets;
const $$widgets_graphs_title = $widgets_graphs_title;
const $$widgets_graphs_ticks = $widgets_graphs_ticks;
const $$widgets_graphs_formats = $widgets_graphs_formats;
const $$widgets_graphs_bar_labels = $widgets_graphs_bar_labels;
const $$widgets_graphs_modal_y = $widgets_graphs_modal_y;
const $$widgets_graphs_span_key = $widgets_graphs_span_key;
const $$widgets_graphs_line_sets = $widgets_graphs_line_sets;
const $$widgets_graphs_enabled = $widgets_graphs_enabled;
const $$List_is_empty = $List_is_empty;
const $$widgets_graphs_first_base = $widgets_graphs_first_base;
const $$widgets_graphs_first_span = $widgets_graphs_first_span;
const $$widgets_graphs_gs_canvas = $widgets_graphs_gs_canvas;
const $$widgets_graphs_small_w_css = $widgets_graphs_small_w_css;
const $$widgets_graphs_small_h_css = $widgets_graphs_small_h_css;
const $$widgets_graphs_modal_dim = $widgets_graphs_modal_dim;
const $$widgets_graphs_gs_base = $widgets_graphs_gs_base;
const $$widgets_graphs_gs_span = $widgets_graphs_gs_span;
const $$widgets_graphs_small_of = $widgets_graphs_small_of;
const $$widgets_graphs_small_shown = $widgets_graphs_small_shown;
const $$widgets_graphs_snap_of = $widgets_graphs_snap_of;
const $$widgets_graphs_small_w = $widgets_graphs_small_w;
const $$widgets_graphs_with_small = $widgets_graphs_with_small;
const $$widgets_graphs_small_view = $widgets_graphs_small_view;
const $$widgets_graphs_small_size = $widgets_graphs_small_size;
const $$widgets_graphs_small_on = $widgets_graphs_small_on;
const $$widgets_graphs_ready_of = $widgets_graphs_ready_of;
const $$widgets_graphs_border = $widgets_graphs_border;
const $$widgets_graphs_modal_chart = $widgets_graphs_modal_chart;
const $$widgets_graphs_modal_size = $widgets_graphs_modal_size;
const $$widgets_graphs_modal_of = $widgets_graphs_modal_of;
const $$widgets_graphs_with_cur = $widgets_graphs_with_cur;
const $$widgets_graphs_cat = $widgets_graphs_cat;
const $$widgets_graphs_configure_small = $widgets_graphs_configure_small;
const $$widgets_graphs_configure_current = $widgets_graphs_configure_current;
const $$widgets_graphs_start_small_go = $widgets_graphs_start_small_go;
const $$widgets_graphs_small_unsized = $widgets_graphs_small_unsized;
const $$widgets_graphs_hide = $widgets_graphs_hide;
const $$widgets_graphs_base_key = $widgets_graphs_base_key;
const $$widgets_graphs_options_spans = $widgets_graphs_options_spans;
const $$widgets_graphs_options_go = $widgets_graphs_options_go;
const $$widgets_graphs_modal_empty = $widgets_graphs_modal_empty;
const $$widgets_graphs_handler_of = $widgets_graphs_handler_of;
const $$widgets_graphs_canvases_go = $widgets_graphs_canvases_go;
const $$widgets_graphs_with_view = $widgets_graphs_with_view;
const $$widgets_graphs_hit = $widgets_graphs_hit;
const $$widgets_graphs_with_snap = $widgets_graphs_with_snap;
const $$widgets_graphs_then_small = $widgets_graphs_then_small;
const $$widgets_graphs_configure_modal = $widgets_graphs_configure_modal;
const $$widgets_graphs_pick_spans = $widgets_graphs_pick_spans;
const $$widgets_graphs_pick_found = $widgets_graphs_pick_found;
const $$widgets_graphs_pick_go = $widgets_graphs_pick_go;
const $$widgets_forecast_spaces = $widgets_forecast_spaces;
const $$widgets_forecast_cut = $widgets_forecast_cut;
const $$widgets_forecast_cands = $widgets_forecast_cands;
const $$List_reverse = $List_reverse;
const $$widgets_forecast_enabled = $widgets_forecast_enabled;
const $$widgets_forecast_show = $widgets_forecast_show;
const $$widgets_forecast_cre_length = $widgets_forecast_cre_length;
const $$Nat_is_le = $Nat_is_le;
const $$widgets_forecast_size = $widgets_forecast_size;
const $$widgets_forecast_redo = $widgets_forecast_redo;
const $$widgets_records_skip_nd = $widgets_records_skip_nd;
const $$widgets_records_lead_d = $widgets_records_lead_d;
const $$String_take = $String_take;
const $$Nat_is_gt = $Nat_is_gt;
const $$widgets_records_dval = $widgets_records_dval;
const $$String_drop = $String_drop;
const $$widgets_records_after_c = $widgets_records_after_c;
const $$Char_is_alpha = $Char_is_alpha;
const $$widgets_records_in_range = $widgets_records_in_range;
const $$widgets_records_word_char = $widgets_records_word_char;
const $$widgets_records_wordy = $widgets_records_wordy;
const $$widgets_records_is_leap = $widgets_records_is_leap;
const $$widgets_records_clock_year = $widgets_records_clock_year;
const $$widgets_records_clock_month = $widgets_records_clock_month;
const $$widgets_records_clock_day = $widgets_records_clock_day;
const $$widgets_records_dim = $widgets_records_dim;
const $$widgets_records_civil = $widgets_records_civil;
const $$widgets_records_scan_v = $widgets_records_scan_v;
const $$widgets_records_scan_len = $widgets_records_scan_len;
const $$widgets_records_num = $widgets_records_num;
const $$widgets_records_scan_rest = $widgets_records_scan_rest;
const $$widgets_records_lit = $widgets_records_lit;
const $$widgets_records_scan_ok = $widgets_records_scan_ok;
const $$widgets_records_year_of = $widgets_records_year_of;
const $$widgets_records_mom_days = $widgets_records_mom_days;
const $$widgets_records_mom_tod = $widgets_records_mom_tod;
const $$widgets_records_mom_ok = $widgets_records_mom_ok;
const $$widgets_records_parse_rec = $widgets_records_parse_rec;
const $$widgets_records_plain = $widgets_records_plain;
const $$widgets_records_dir = $widgets_records_dir;
const $$widgets_records_rec = $widgets_records_rec;
const $$widgets_records_rec_need = $widgets_records_rec_need;
const $$widgets_records_all_ok = $widgets_records_all_ok;
const $$Maybe_default = $Maybe_default;
const $$List_tail = $List_tail;
const $$widgets_records_apply = $widgets_records_apply;
const $$widgets_records_entries = $widgets_records_entries;
const $$widgets_records_attr = $widgets_records_attr;
const $$widgets_records_colour = $widgets_records_colour;
const $$widgets_records_has = $widgets_records_has;
const $$widgets_records_rec_set = $widgets_records_rec_set;
const $$widgets_records_rec_key = $widgets_records_rec_key;
const $$widgets_records_last_with = $widgets_records_last_with;
const $$widgets_records_row = $widgets_records_row;
const $$widgets_records_rows = $widgets_records_rows;
const $$widgets_records_current = $widgets_records_current;
const $$widgets_records_parse_now = $widgets_records_parse_now;
const $$widgets_records_dates = $widgets_records_dates;
const $$widgets_records_enabled = $widgets_records_enabled;
const $$widgets_records_table = $widgets_records_table;
const $$widgets_records_cre_length = $widgets_records_cre_length;
const $$widgets_records_data_go = $widgets_records_data_go;
const $$widgets_records_fonts = $widgets_records_fonts;
const $$widgets_records_sized = $widgets_records_sized;
const $$widgets_records_size = $widgets_records_size;
const $$widgets_records_was_sized = $widgets_records_was_sized;
const $$widgets_records_resize = $widgets_records_resize;
const $$widgets_records_with_cur = $widgets_records_with_cur;
const $$widgets_apparent_init = $widgets_apparent_init;
const $$widgets_tempbar_init = $widgets_tempbar_init;
const $$widgets_barometer_init = $widgets_barometer_init;
const $$widgets_humidity_init = $widgets_humidity_init;
const $$widgets_moonsun_init = $widgets_moonsun_init;
const $$widgets_solar_init = $widgets_solar_init;
const $$widgets_status_init = $widgets_status_init;
const $$widgets_raintitle_init = $widgets_raintitle_init;
const $$widgets_rainbar_init = $widgets_rainbar_init;
const $$widgets_uv_init = $widgets_uv_init;
const $$widgets_winddir_init = $widgets_winddir_init;
const $$widgets_windspeed_init = $widgets_windspeed_init;
const $$widgets_graphs_init = $widgets_graphs_init;
const $$widgets_forecast_init = $widgets_forecast_init;
const $$widgets_records_init = $widgets_records_init;
const $$widgets_apparent_tip = $widgets_apparent_tip;
const $$wiring_start_one = $wiring_start_one;
const $$widgets_tempbar_tip = $widgets_tempbar_tip;
const $$widgets_barometer_tip = $widgets_barometer_tip;
const $$widgets_humidity_tip = $widgets_humidity_tip;
const $$widgets_solar_tip = $widgets_solar_tip;
const $$widgets_status_tip = $widgets_status_tip;
const $$widgets_uv_tip = $widgets_uv_tip;
const $$widgets_winddir_tip = $widgets_winddir_tip;
const $$widgets_windspeed_tip = $widgets_windspeed_tip;
const $$wiring_cat = $wiring_cat;
const $$wiring_canvas_one = $wiring_canvas_one;
const $$widgets_apparent_width = $widgets_apparent_width;
const $$widgets_apparent_height = $widgets_apparent_height;
const $$widgets_apparent_view = $widgets_apparent_view;
const $$widgets_tempbar_width = $widgets_tempbar_width;
const $$widgets_tempbar_height = $widgets_tempbar_height;
const $$widgets_tempbar_view = $widgets_tempbar_view;
const $$widgets_barometer_width = $widgets_barometer_width;
const $$widgets_barometer_height = $widgets_barometer_height;
const $$widgets_barometer_view = $widgets_barometer_view;
const $$widgets_humidity_width = $widgets_humidity_width;
const $$widgets_humidity_height = $widgets_humidity_height;
const $$widgets_humidity_view = $widgets_humidity_view;
const $$widgets_moonsun_width = $widgets_moonsun_width;
const $$widgets_moonsun_height = $widgets_moonsun_height;
const $$widgets_moonsun_view = $widgets_moonsun_view;
const $$widgets_solar_width = $widgets_solar_width;
const $$widgets_solar_height = $widgets_solar_height;
const $$widgets_solar_view = $widgets_solar_view;
const $$widgets_status_width = $widgets_status_width;
const $$widgets_status_height = $widgets_status_height;
const $$widgets_status_view = $widgets_status_view;
const $$widgets_raintitle_width = $widgets_raintitle_width;
const $$widgets_raintitle_height = $widgets_raintitle_height;
const $$widgets_raintitle_view = $widgets_raintitle_view;
const $$widgets_rainbar_width = $widgets_rainbar_width;
const $$widgets_rainbar_height = $widgets_rainbar_height;
const $$widgets_rainbar_view = $widgets_rainbar_view;
const $$widgets_uv_width = $widgets_uv_width;
const $$widgets_uv_height = $widgets_uv_height;
const $$widgets_uv_view = $widgets_uv_view;
const $$widgets_winddir_width = $widgets_winddir_width;
const $$widgets_winddir_height = $widgets_winddir_height;
const $$widgets_winddir_view = $widgets_winddir_view;
const $$widgets_windspeed_width = $widgets_windspeed_width;
const $$widgets_windspeed_height = $widgets_windspeed_height;
const $$widgets_windspeed_view = $widgets_windspeed_view;
const $$wiring_resize_apparent = $wiring_resize_apparent;
const $$wiring_resize_temp1 = $wiring_resize_temp1;
const $$wiring_resize_temp2 = $wiring_resize_temp2;
const $$wiring_resize_temp3 = $wiring_resize_temp3;
const $$wiring_resize_barometer = $wiring_resize_barometer;
const $$wiring_resize_windchill = $wiring_resize_windchill;
const $$wiring_resize_humidity = $wiring_resize_humidity;
const $$wiring_resize_moonsun = $wiring_resize_moonsun;
const $$wiring_resize_solar = $wiring_resize_solar;
const $$wiring_resize_status = $wiring_resize_status;
const $$wiring_resize_raintitle = $wiring_resize_raintitle;
const $$wiring_resize_rain1 = $wiring_resize_rain1;
const $$wiring_resize_rain2 = $wiring_resize_rain2;
const $$wiring_resize_rain3 = $wiring_resize_rain3;
const $$wiring_resize_uv = $wiring_resize_uv;
const $$wiring_resize_winddir = $wiring_resize_winddir;
const $$wiring_resize_windspeed = $wiring_resize_windspeed;
const $$wiring_size_apparent = $wiring_size_apparent;
const $$wiring_size_temp1 = $wiring_size_temp1;
const $$wiring_size_temp2 = $wiring_size_temp2;
const $$wiring_size_temp3 = $wiring_size_temp3;
const $$wiring_size_barometer = $wiring_size_barometer;
const $$wiring_size_windchill = $wiring_size_windchill;
const $$wiring_size_humidity = $wiring_size_humidity;
const $$wiring_size_moonsun = $wiring_size_moonsun;
const $$wiring_size_solar = $wiring_size_solar;
const $$wiring_size_status = $wiring_size_status;
const $$wiring_size_raintitle = $wiring_size_raintitle;
const $$wiring_size_rain1 = $wiring_size_rain1;
const $$wiring_size_rain2 = $wiring_size_rain2;
const $$wiring_size_rain3 = $wiring_size_rain3;
const $$wiring_size_uv = $wiring_size_uv;
const $$wiring_size_winddir = $wiring_size_winddir;
const $$wiring_size_windspeed = $wiring_size_windspeed;
const $$wiring_draw_apparent = $wiring_draw_apparent;
const $$wiring_draw_temp1 = $wiring_draw_temp1;
const $$wiring_draw_temp2 = $wiring_draw_temp2;
const $$wiring_draw_temp3 = $wiring_draw_temp3;
const $$wiring_draw_barometer = $wiring_draw_barometer;
const $$wiring_draw_windchill = $wiring_draw_windchill;
const $$wiring_draw_humidity = $wiring_draw_humidity;
const $$wiring_draw_moonsun = $wiring_draw_moonsun;
const $$wiring_draw_solar = $wiring_draw_solar;
const $$wiring_draw_status = $wiring_draw_status;
const $$wiring_draw_raintitle = $wiring_draw_raintitle;
const $$wiring_draw_rain1 = $wiring_draw_rain1;
const $$wiring_draw_rain2 = $wiring_draw_rain2;
const $$wiring_draw_rain3 = $wiring_draw_rain3;
const $$wiring_draw_uv = $wiring_draw_uv;
const $$wiring_draw_winddir = $wiring_draw_winddir;
const $$wiring_draw_windspeed = $wiring_draw_windspeed;
const $$wiring_data_apparent = $wiring_data_apparent;
const $$wiring_data_temp1 = $wiring_data_temp1;
const $$wiring_data_temp2 = $wiring_data_temp2;
const $$wiring_data_temp3 = $wiring_data_temp3;
const $$wiring_data_barometer = $wiring_data_barometer;
const $$wiring_data_windchill = $wiring_data_windchill;
const $$wiring_data_humidity = $wiring_data_humidity;
const $$wiring_data_moonsun = $wiring_data_moonsun;
const $$wiring_data_solar = $wiring_data_solar;
const $$wiring_data_rain1 = $wiring_data_rain1;
const $$wiring_data_rain2 = $wiring_data_rain2;
const $$wiring_data_rain3 = $wiring_data_rain3;
const $$wiring_data_uv = $wiring_data_uv;
const $$wiring_data_winddir = $wiring_data_winddir;
const $$wiring_data_windspeed = $wiring_data_windspeed;
const $$widgets_status_data = $widgets_status_data;
const $$all = $all;
const $$any = $any;
const $$has_key = $has_key;
const $$widget_of = $widget_of;
const $$String_starts_with = $String_starts_with;
const $$accept = $accept;
const $$rename = $rename;
const $$base_strip = $base_strip;
const $$base_cut = $base_cut;
const $$nth = $nth;
const $$wiring_start = $wiring_start;
const $$buttons = $buttons;
const $$cat = $cat;
const $$lib_units_defaults = $lib_units_defaults;
const $$setting = $setting;
const $$defaults = $defaults;
const $$lib_env_kv_lines = $lib_env_kv_lines;
const $$merge = $merge;
const $$start_units = $start_units;
const $$lib_dict_lang = $lib_dict_lang;
const $$lib_env_no_clock = $lib_env_no_clock;
const $$base_url = $base_url;
const $$flags = $flags;
const $$wiring_init = $wiring_init;
const $$wiring_graphs_of = $wiring_graphs_of;
const $$widgets_graphs_start_small = $widgets_graphs_start_small;
const $$g_st = $g_st;
const $$widgets_graphs_start_modal = $widgets_graphs_start_modal;
const $$wiring_with_graphs = $wiring_with_graphs;
const $$fetch_all = $fetch_all;
const $$init_cmds = $init_cmds;
const $$widgets_forecast_start = $widgets_forecast_start;
const $$g_cmds = $g_cmds;
const $$widgets_records_start = $widgets_records_start;
const $$widgets_graphs_start_lists = $widgets_graphs_start_lists;
const $$widgets_graphs_small_canvases = $widgets_graphs_small_canvases;
const $$widgets_graphs_modal_canvases = $widgets_graphs_modal_canvases;
const $$wiring_resize = $wiring_resize;
const $$widgets_graphs_resize = $widgets_graphs_resize;
const $$wiring_forecast_of = $wiring_forecast_of;
const $$widgets_forecast_resize = $widgets_forecast_resize;
const $$wiring_records_of = $wiring_records_of;
const $$lib_env_box_vw = $lib_env_box_vw;
const $$lib_env_box_vh = $lib_env_box_vh;
const $$r_st = $r_st;
const $$wiring_with_records = $wiring_with_records;
const $$wiring_size = $wiring_size;
const $$r_cmds = $r_cmds;
const $$wiring_frame = $wiring_frame;
const $$env_fields = $env_fields;
const $$flag = $flag;
const $$wiring_data = $wiring_data;
const $$widgets_graphs_data = $widgets_graphs_data;
const $$widgets_forecast_data = $widgets_forecast_data;
const $$widgets_records_data = $widgets_records_data;
const $$f_st = $f_st;
const $$wiring_with_forecast = $wiring_with_forecast;
const $$g_ok = $g_ok;
const $$start_fade = $start_fade;
const $$wiring_retip = $wiring_retip;
const $$f_cmds = $f_cmds;
const $$fields = $fields;
const $$wiring_status = $wiring_status;
const $$widgets_status_aborts = $widgets_status_aborts;
const $$file_index = $file_index;
const $$lib_raw_split = $lib_raw_split;
const $$with_fields = $with_fields;
const $$with_clock = $with_clock;
const $$set_flag = $set_flag;
const $$before_dot = $before_dot;
const $$stem = $stem;
const $$failed_of = $failed_of;
const $$add_dots = $add_dots;
const $$message_of = $message_of;
const $$fade_step = $fade_step;
const $$fade_cmds = $fade_cmds;
const $$lib_markup_upper = $lib_markup_upper;
const $$lib_markup_inner_02 = $lib_markup_inner_02;
const $$lib_markup_inner = $lib_markup_inner;
const $$measure_of = $measure_of;
const $$lib_units_cycle = $lib_units_cycle;
const $$with_units = $with_units;
const $$wiring_units = $wiring_units;
const $$widgets_graphs_units = $widgets_graphs_units;
const $$widgets_records_units = $widgets_records_units;
const $$widgets_graphs_click = $widgets_graphs_click;
const $$widgets_records_click = $widgets_records_click;
const $$widgets_forecast_click = $widgets_forecast_click;
const $$button_kind = $button_kind;
const $$click_unit = $click_unit;
const $$click_graphs = $click_graphs;
const $$widgets_graphs_select = $widgets_graphs_select;
const $$widgets_records_select = $widgets_records_select;
const $$String_order = $String_order;
const $$List_length = $List_length;
const $$Char_is_space = $Char_is_space;
const $$List_last_go = $List_last_go;
const $$Char_is_upper = $Char_is_upper;
const $$Char_is_lower = $Char_is_lower;
const $$List_set = $List_set;
const TAB_0 = [2, 2, 2.5];
const TAB_1 = [1, 2, 0];
const TAB_2 = [2, 0, 1];export default {
  "lib/num:nan": run_lib(() => run_loop($lib_num_nan()), 0),
  "lib/num:parse.go": run_lib((a0,a1) => run_loop($lib_num_parse_go(a0,str_in(a1))), 2),
  "lib/num:parse": run_lib((a0) => run_loop($lib_num_parse(str_in(a0))), 1),
  "lib/num:is_nan": run_lib((a0) => run_loop($lib_num_is_nan(Math.fround(a0))), 1),
  "lib/num:pick": run_lib((a0,a1,a2) => run_loop($lib_num_pick(a0,Math.fround(a1),Math.fround(a2))), 3),
  "lib/num:pick_s": run_lib((a0,a1,a2) => str_out(run_loop($lib_num_pick_s(a0,str_in(a1),str_in(a2)))), 3),
  "lib/num:pow10": run_lib((a0) => run_loop($lib_num_pow10(nat_in(a0))), 1),
  "lib/num:round_to": run_lib((a0,a1) => run_loop($lib_num_round_to(Math.fround(a0),nat_in(a1))), 2),
  "lib/num:sharpen": run_lib((a0) => run_loop($lib_num_sharpen(Math.fround(a0))), 1),
  "lib/num:map": run_lib((a0,a1,a2,a3,a4) => run_loop($lib_num_map(Math.fround(a0),Math.fround(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4))), 5),
  "lib/num:min": run_lib((a0,a1) => run_loop($lib_num_min(Math.fround(a0),Math.fround(a1))), 2),
  "lib/num:max": run_lib((a0,a1) => run_loop($lib_num_max(Math.fround(a0),Math.fround(a1))), 2),
  "lib/num:show.fin": run_lib((a0,a1) => str_out(run_loop($lib_num_show_fin(a0,str_in(a1)))), 2),
  "lib/num:show": run_lib((a0) => str_out(run_loop($lib_num_show(Math.fround(a0)))), 1),
  "lib/num:norm": run_lib((a0) => str_out(run_loop($lib_num_norm(str_in(a0)))), 1),
  "lib/num:int": run_lib((a0) => run_loop($lib_num_int(str_in(a0))), 1),
  "lib/num:nat_of.go": run_lib((a0,a1) => run_loop($lib_num_nat_of_go(a0,Math.fround(a1))), 2),
  "lib/num:nat_of": run_lib((a0) => run_loop($lib_num_nat_of(Math.fround(a0))), 1),
  "lib/num:of_nat": run_lib((a0) => run_loop($lib_num_of_nat(nat_in(a0))), 1),
  "lib/num:cdim": run_lib((a0,a1,a2) => run_loop($lib_num_cdim(Math.fround(a0),Math.fround(a1),Math.fround(a2))), 3),
  "lib/raw:fix": run_lib((a0) => str_out(run_loop($lib_raw_fix(str_in(a0)))), 1),
  "lib/raw:split.acc": run_lib((a0,a1,a2) => run_loop($lib_raw_split_acc(a0,str_in(a1),a2)), 3),
  "lib/raw:split.cur": run_lib((a0,a1,a2) => str_out(run_loop($lib_raw_split_cur(a0,str_in(a1),str_in(a2)))), 3),
  "lib/raw:split.go": run_lib((a0,a1,a2) => run_loop($lib_raw_split_go(str_in(a0),str_in(a1),a2)), 3),
  "lib/raw:split": run_lib((a0) => run_loop($lib_raw_split(str_in(a0))), 1),
  "lib/raw:at": run_lib((a0,a1) => str_out(run_loop($lib_raw_at(a0,nat_in(a1)))), 2),
  "lib/raw:length": run_lib((a0) => run_loop($lib_raw_length(a0)), 1),
  "lib/raw:same": run_lib((a0,a1) => run_loop($lib_raw_same(a0,a1)), 2),
  "lib/units:defaults": run_lib(() => run_loop($lib_units_defaults()), 0),
  "lib/units:table": run_lib((a0) => run_loop($lib_units_table(a0)), 1),
  "lib/units:current": run_lib((a0,a1) => str_out(run_loop($lib_units_current(a0,a1))), 2),
  "lib/units:key_of": run_lib((a0) => str_out(run_loop($lib_units_key_of(a0))), 1),
  "lib/units:find": run_lib((a0,a1) => run_loop($lib_units_find(str_in(a0),a1)), 2),
  "lib/units:unit": run_lib((a0,a1) => run_loop($lib_units_unit(a0,a1)), 2),
  "lib/units:display_of": run_lib((a0) => str_out(run_loop($lib_units_display_of(a0))), 1),
  "lib/units:label": run_lib((a0,a1) => str_out(run_loop($lib_units_label(a0,a1))), 2),
  "lib/units:is_temp": run_lib((a0) => run_loop($lib_units_is_temp(a0)), 1),
  "lib/units:beaufort": run_lib((a0) => run_loop($lib_units_beaufort(Math.fround(a0))), 1),
  "lib/units:nonzero": run_lib((a0,a1,a2) => run_loop($lib_units_nonzero(nat_in(a0),Math.fround(a1),nat_in(a2))), 3),
  "lib/units:value.go": run_lib((a0,a1,a2,a3,a4) => run_loop($lib_units_value_go(a0,a1,a2,a3,Math.fround(a4))), 5),
  "lib/units:value": run_lib((a0,a1,a2) => run_loop($lib_units_value(a0,a1,Math.fround(a2))), 3),
  "lib/units:show_raw": run_lib((a0,a1,a2) => str_out(run_loop($lib_units_show_raw(a0,a1,str_in(a2)))), 3),
  "lib/units:show": run_lib((a0,a1,a2) => str_out(run_loop($lib_units_show(a0,a1,Math.fround(a2)))), 3),
  "lib/units:with_label": run_lib((a0,a1,a2) => str_out(run_loop($lib_units_with_label(a0,a1,str_in(a2)))), 3),
  "lib/units:next": run_lib((a0,a1,a2,a3) => str_out(run_loop($lib_units_next(a0,str_in(a1),str_in(a2),a3))), 4),
  "lib/units:first_key": run_lib((a0) => str_out(run_loop($lib_units_first_key(a0))), 1),
  "lib/units:set": run_lib((a0,a1,a2) => run_loop($lib_units_set(a0,a1,str_in(a2))), 3),
  "lib/units:cycle": run_lib((a0,a1) => run_loop($lib_units_cycle(a0,a1)), 2),
  "lib/dict:lang": run_lib((a0) => run_loop($lib_dict_lang(str_in(a0))), 1),
  "lib/dict:get": run_lib((a0,a1) => str_out(run_loop($lib_dict_get(a0,a1))), 2),
  "lib/env:kv_key": run_lib((a0) => str_out(run_loop($lib_env_kv_key(a0))), 1),
  "lib/env:kv_val": run_lib((a0) => str_out(run_loop($lib_env_kv_val(a0))), 1),
  "lib/env:kv.after": run_lib((a0) => str_out(run_loop($lib_env_kv_after(str_in(a0)))), 1),
  "lib/env:kv.before": run_lib((a0) => str_out(run_loop($lib_env_kv_before(str_in(a0)))), 1),
  "lib/env:kv_parse": run_lib((a0) => run_loop($lib_env_kv_parse(str_in(a0))), 1),
  "lib/env:kv_list": run_lib((a0) => run_loop($lib_env_kv_list(a0)), 1),
  "lib/env:kv_lines": run_lib((a0) => run_loop($lib_env_kv_lines(str_in(a0))), 1),
  "lib/env:no_clock": run_lib(() => run_loop($lib_env_no_clock()), 0),
  "lib/env:cr": run_lib((a0,a1) => str_out(run_loop($lib_env_cr(a0,nat_in(a1)))), 2),
  "lib/env:cre": run_lib((a0,a1) => str_out(run_loop($lib_env_cre(a0,nat_in(a1)))), 2),
  "lib/env:crh": run_lib((a0,a1) => str_out(run_loop($lib_env_crh(a0,nat_in(a1)))), 2),
  "lib/env:crd": run_lib((a0,a1) => str_out(run_loop($lib_env_crd(a0,nat_in(a1)))), 2),
  "lib/env:units": run_lib((a0) => run_loop($lib_env_units(a0)), 1),
  "lib/env:lang": run_lib((a0) => run_loop($lib_env_lang(a0)), 1),
  "lib/env:clock": run_lib((a0) => run_loop($lib_env_clock(a0)), 1),
  "lib/env:word": run_lib((a0,a1) => str_out(run_loop($lib_env_word(a0,a1))), 2),
  "lib/env:reading": run_lib((a0,a1,a2) => str_out(run_loop($lib_env_reading(a0,a1,str_in(a2)))), 3),
  "lib/env:label": run_lib((a0,a1) => str_out(run_loop($lib_env_label(a0,a1))), 2),
  "lib/env:find": run_lib((a0,a1,a2) => str_out(run_loop($lib_env_find(str_in(a0),str_in(a1),a2))), 3),
  "lib/env:opt": run_lib((a0,a1,a2) => str_out(run_loop($lib_env_opt(a0,str_in(a1),str_in(a2)))), 3),
  "lib/env:on": run_lib((a0,a1) => run_loop($lib_env_on(a0,str_in(a1))), 2),
  "lib/env:changed": run_lib((a0,a1,a2) => run_loop($lib_env_changed(a0,str_in(a1),str_in(a2))), 3),
  "lib/env:box_vw": run_lib((a0) => run_loop($lib_env_box_vw(a0)), 1),
  "lib/env:box_vh": run_lib((a0) => run_loop($lib_env_box_vh(a0)), 1),
  "lib/scene:at": run_lib((a0,a1) => run_loop($lib_scene_at(Math.fround(a0),Math.fround(a1))), 2),
  "lib/scene:origin": run_lib(() => run_loop($lib_scene_origin()), 0),
  "lib/scene:hidden": run_lib(() => run_loop($lib_scene_hidden()), 0),
  "lib/scene:shape": run_lib((a0) => run_loop($lib_scene_shape(a0)), 1),
  "lib/scene:shape_at": run_lib((a0,a1) => run_loop($lib_scene_shape_at(a0,a1)), 2),
  "lib/scene:masked": run_lib((a0,a1) => run_loop($lib_scene_masked(a0,a1)), 2),
  "lib/scene:label": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($lib_scene_label(Math.fround(a0),Math.fround(a1),str_in(a2),str_in(a3),str_in(a4),str_in(a5),str_in(a6))), 7),
  "lib/scene:label_w": run_lib((a0,a1,a2,a3,a4,a5,a6,a7) => run_loop($lib_scene_label_w(Math.fround(a0),Math.fround(a1),str_in(a2),str_in(a3),str_in(a4),str_in(a5),str_in(a6),Math.fround(a7))), 8),
  "lib/scene:bold": run_lib((a0,a1) => str_out(run_loop($lib_scene_bold(Math.fround(a0),str_in(a1)))), 2),
  "lib/scene:plain": run_lib((a0,a1) => str_out(run_loop($lib_scene_plain(Math.fround(a0),str_in(a1)))), 2),
  "lib/scene:rgb": run_lib((a0) => str_out(run_loop($lib_scene_rgb(str_in(a0)))), 1),
  "lib/scene:rgba": run_lib((a0,a1) => str_out(run_loop($lib_scene_rgba(str_in(a0),str_in(a1)))), 2),
  "lib/scene:max_centred": run_lib((a0,a1,a2) => run_loop($lib_scene_max_centred(Math.fround(a0),Math.fround(a1),Math.fround(a2))), 3),
  "lib/scene:max_left": run_lib((a0,a1,a2) => run_loop($lib_scene_max_left(Math.fround(a0),Math.fround(a1),Math.fround(a2))), 3),
  "lib/scene:ex": run_lib((a0) => run_loop($lib_scene_ex(Math.fround(a0))), 1),
  "lib/scene:ex_mul": run_lib((a0,a1) => run_loop($lib_scene_ex_mul(a0,a1)), 2),
  "lib/scene:ex_div": run_lib((a0,a1) => run_loop($lib_scene_ex_div(a0,a1)), 2),
  "lib/scene:ex_add": run_lib((a0,a1) => run_loop($lib_scene_ex_add(a0,a1)), 2),
  "lib/scene:ex_sub": run_lib((a0,a1) => run_loop($lib_scene_ex_sub(a0,a1)), 2),
  "lib/scene:ex_v": run_lib((a0) => run_loop($lib_scene_ex_v(a0)), 1),
  "lib/scene:boldx": run_lib((a0,a1) => str_out(run_loop($lib_scene_boldx(a0,str_in(a1)))), 2),
  "lib/scene:plainx": run_lib((a0,a1) => str_out(run_loop($lib_scene_plainx(a0,str_in(a1)))), 2),
  "lib/chart:defaults": run_lib(() => run_loop($lib_chart_defaults()), 0),
  "lib/markup:upper": run_lib(() => str_out(run_loop($lib_markup_upper())), 0),
  "lib/markup:inner": run_lib(() => str_out(run_loop($lib_markup_inner())), 0),
  "lib/markup:inner_02": run_lib(() => str_out(run_loop($lib_markup_inner_02())), 0),
  "widgets/apparent:init": run_lib((a0) => run_loop($widgets_apparent_init(a0)), 1),
  "widgets/apparent:tip": run_lib((a0) => str_out(run_loop($widgets_apparent_tip(a0))), 1),
  "widgets/apparent:data": run_lib((a0,a1,a2,a3) => run_loop($widgets_apparent_data(a0,a1,a2,a3)), 4),
  "widgets/apparent:resize": run_lib((a0,a1) => run_loop($widgets_apparent_resize(a0,a1)), 2),
  "widgets/apparent:width": run_lib((a0) => run_loop($widgets_apparent_width(a0)), 1),
  "widgets/apparent:height": run_lib((a0) => run_loop($widgets_apparent_height(a0)), 1),
  "widgets/apparent:view": run_lib((a0,a1,a2) => run_loop($widgets_apparent_view(a0,a1,a2)), 3),
  "lib/tween:still": run_lib((a0) => run_loop($lib_tween_still(Math.fround(a0))), 1),
  "lib/tween:elapsed": run_lib((a0,a1) => run_loop($lib_tween_elapsed(a0,a1)), 2),
  "lib/tween:quart_in_out": run_lib((a0) => run_loop($lib_tween_quart_in_out(Math.fround(a0))), 1),
  "lib/tween:ratio": run_lib((a0,a1,a2) => run_loop($lib_tween_ratio(a0,Math.fround(a1),a2)), 3),
  "lib/tween:progress": run_lib((a0,a1) => run_loop($lib_tween_progress(a0,a1)), 2),
  "lib/tween:value": run_lib((a0,a1) => run_loop($lib_tween_value(a0,a1)), 2),
  "lib/tween:to": run_lib((a0,a1,a2,a3) => run_loop($lib_tween_to(a0,Math.fround(a1),Math.fround(a2),a3)), 4),
  "lib/tween:busy": run_lib((a0,a1) => run_loop($lib_tween_busy(a0,a1)), 2),
  "widgets/tempbar:c_temp": run_lib(() => str_out(run_loop($widgets_tempbar_c_temp())), 0),
  "widgets/tempbar:c_low": run_lib(() => str_out(run_loop($widgets_tempbar_c_low())), 0),
  "widgets/tempbar:c_fill": run_lib(() => str_out(run_loop($widgets_tempbar_c_fill())), 0),
  "widgets/tempbar:is01": run_lib((a0) => run_loop($widgets_tempbar_is01(a0)), 1),
  "widgets/tempbar:is_wc": run_lib((a0) => run_loop($widgets_tempbar_is_wc(a0)), 1),
  "widgets/tempbar:arrow": run_lib((a0,a1) => run_loop($widgets_tempbar_arrow(a0,Math.fround(a1))), 2),
  "widgets/tempbar:init": run_lib((a0,a1) => run_loop($widgets_tempbar_init(a0,a1)), 2),
  "widgets/tempbar:mode": run_lib((a0) => str_out(run_loop($widgets_tempbar_mode(a0))), 1),
  "widgets/tempbar:tip.go": run_lib((a0,a1,a2) => str_out(run_loop($widgets_tempbar_tip_go(a0,a1,str_in(a2)))), 3),
  "widgets/tempbar:tip": run_lib((a0,a1) => str_out(run_loop($widgets_tempbar_tip(a0,a1))), 2),
  "widgets/tempbar:ok_index": run_lib((a0) => run_loop($widgets_tempbar_ok_index(Math.fround(a0))), 1),
  "widgets/tempbar:cr_at": run_lib((a0,a1) => str_out(run_loop($widgets_tempbar_cr_at(a0,Math.fround(a1)))), 2),
  "widgets/tempbar:cre_at": run_lib((a0,a1) => str_out(run_loop($widgets_tempbar_cre_at(a0,Math.fround(a1)))), 2),
  "widgets/tempbar:extra.go": run_lib((a0,a1,a2) => run_loop($widgets_tempbar_extra_go(a0,a1,Math.fround(a2))), 3),
  "widgets/tempbar:extra": run_lib((a0,a1) => run_loop($widgets_tempbar_extra(a0,str_in(a1))), 2),
  "widgets/tempbar:ne": run_lib((a0,a1) => run_loop($widgets_tempbar_ne(str_in(a0),str_in(a1))), 2),
  "widgets/tempbar:switch": run_lib((a0,a1) => str_out(run_loop($widgets_tempbar_switch(a0,str_in(a1)))), 2),
  "widgets/tempbar:switched.go": run_lib((a0,a1,a2) => run_loop($widgets_tempbar_switched_go(a0,a1,a2)), 3),
  "widgets/tempbar:switched": run_lib((a0,a1,a2,a3) => run_loop($widgets_tempbar_switched(a0,a1,a2,a3)), 4),
  "widgets/tempbar:wc_inp": run_lib((a0,a1) => run_loop($widgets_tempbar_wc_inp(a0,a1)), 2),
  "widgets/tempbar:inputs": run_lib((a0,a1,a2) => run_loop($widgets_tempbar_inputs(a0,a1,a2)), 3),
  "widgets/tempbar:changed_t": run_lib((a0,a1,a2) => run_loop($widgets_tempbar_changed_t(a0,str_in(a1),str_in(a2))), 3),
  "widgets/tempbar:should": run_lib((a0,a1,a2,a3) => run_loop($widgets_tempbar_should(a0,a1,a2,a3)), 4),
  "widgets/tempbar:below": run_lib((a0,a1,a2,a3) => run_loop($widgets_tempbar_below(Math.fround(a0),Math.fround(a1),Math.fround(a2),Math.fround(a3))), 4),
  "widgets/tempbar:above": run_lib((a0,a1,a2,a3) => run_loop($widgets_tempbar_above(Math.fround(a0),Math.fround(a1),Math.fround(a2),Math.fround(a3))), 4),
  "widgets/tempbar:raise_ok": run_lib((a0,a1,a2,a3) => run_loop($widgets_tempbar_raise_ok(Math.fround(a0),Math.fround(a1),Math.fround(a2),Math.fround(a3))), 4),
  "widgets/tempbar:lower_ok": run_lib((a0,a1,a2,a3) => run_loop($widgets_tempbar_lower_ok(Math.fround(a0),Math.fround(a1),Math.fround(a2),Math.fround(a3))), 4),
  "widgets/tempbar:min_down": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($widgets_tempbar_min_down(nat_in(a0),a1,Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5))), 6),
  "widgets/tempbar:max_up": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($widgets_tempbar_max_up(nat_in(a0),a1,Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5))), 6),
  "widgets/tempbar:min_up": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($widgets_tempbar_min_up(nat_in(a0),a1,Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5))), 6),
  "widgets/tempbar:max_down": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($widgets_tempbar_max_down(nat_in(a0),a1,Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5))), 6),
  "widgets/tempbar:fuel": run_lib(() => run_loop($widgets_tempbar_fuel()), 0),
  "widgets/tempbar:fmt": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($widgets_tempbar_fmt(Math.fround(a0),Math.fround(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5))), 6),
  "widgets/tempbar:retween": run_lib((a0,a1,a2) => run_loop($widgets_tempbar_retween(a0,a1,a2)), 3),
  "widgets/tempbar:vals_range": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($widgets_tempbar_vals_range(a0,a1,Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5))), 6),
  "widgets/tempbar:tmode_set": run_lib((a0) => run_loop($widgets_tempbar_tmode_set(a0)), 1),
  "widgets/tempbar:old_trend_changed": run_lib((a0,a1) => run_loop($widgets_tempbar_old_trend_changed(a0,str_in(a1))), 2),
  "widgets/tempbar:data.go": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_tempbar_data_go(a0,a1,a2,a3,a4)), 5),
  "widgets/tempbar:data": run_lib((a0,a1,a2,a3) => run_loop($widgets_tempbar_data(a0,a1,a2,a3)), 4),
  "widgets/tempbar:vals_trend": run_lib((a0) => run_loop($widgets_tempbar_vals_trend(a0)), 1),
  "widgets/tempbar:resize": run_lib((a0,a1) => run_loop($widgets_tempbar_resize(a0,a1)), 2),
  "widgets/tempbar:width": run_lib((a0) => run_loop($widgets_tempbar_width(a0)), 1),
  "widgets/tempbar:height": run_lib((a0) => run_loop($widgets_tempbar_height(a0)), 1),
  "widgets/tempbar:gap_at": run_lib((a0,a1,a2) => run_loop($widgets_tempbar_gap_at(Math.fround(a0),Math.fround(a1),Math.fround(a2))), 3),
  "widgets/tempbar:dash": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($widgets_tempbar_dash(nat_in(a0),Math.fround(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5))), 6),
  "widgets/tempbar:dashes": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($widgets_tempbar_dashes(nat_in(a0),nat_in(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5),Math.fround(a6))), 7),
  "widgets/tempbar:labels": run_lib((a0,a1,a2,a3,a4,a5,a6,a7) => run_loop($widgets_tempbar_labels(nat_in(a0),nat_in(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5),Math.fround(a6),str_in(a7))), 8),
  "widgets/tempbar:spread_go": run_lib((a0,a1,a2) => run_loop($widgets_tempbar_spread_go(Math.fround(a0),Math.fround(a1),Math.fround(a2))), 3),
  "widgets/tempbar:spread.loop": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_tempbar_spread_loop(nat_in(a0),a1,Math.fround(a2),Math.fround(a3),Math.fround(a4))), 5),
  "widgets/tempbar:spread": run_lib((a0,a1,a2) => run_loop($widgets_tempbar_spread(Math.fround(a0),Math.fround(a1),Math.fround(a2))), 3),
  "widgets/tempbar:hl_hy": run_lib((a0) => run_loop($widgets_tempbar_hl_hy(a0)), 1),
  "widgets/tempbar:hl_ly": run_lib((a0) => run_loop($widgets_tempbar_hl_ly(a0)), 1),
  "widgets/tempbar:title.go": run_lib((a0,a1,a2) => str_out(run_loop($widgets_tempbar_title_go(a0,a1,str_in(a2)))), 3),
  "widgets/tempbar:hl_on": run_lib((a0,a1) => run_loop($widgets_tempbar_hl_on(a0,a1)), 2),
  "widgets/tempbar:arrow_nodes": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_tempbar_arrow_nodes(a0,Math.fround(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4))), 5),
  "widgets/tempbar:hl_nodes": run_lib((a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) => run_loop($widgets_tempbar_hl_nodes(a0,Math.fround(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5),a6,Math.fround(a7),str_in(a8),str_in(a9),str_in(a10))), 11),
  "widgets/tempbar:view": run_lib((a0,a1,a2) => run_loop($widgets_tempbar_view(a0,a1,a2)), 3),
  "widgets/barometer:init": run_lib((a0) => run_loop($widgets_barometer_init(a0)), 1),
  "widgets/barometer:tip": run_lib((a0) => str_out(run_loop($widgets_barometer_tip(a0))), 1),
  "widgets/barometer:trend_text": run_lib((a0,a1) => str_out(run_loop($widgets_barometer_trend_text(a0,Math.fround(a1)))), 2),
  "widgets/barometer:data": run_lib((a0,a1,a2,a3) => run_loop($widgets_barometer_data(a0,a1,a2,a3)), 4),
  "widgets/barometer:resize": run_lib((a0,a1) => run_loop($widgets_barometer_resize(a0,a1)), 2),
  "widgets/barometer:width": run_lib((a0) => run_loop($widgets_barometer_width(a0)), 1),
  "widgets/barometer:height": run_lib((a0) => run_loop($widgets_barometer_height(a0)), 1),
  "widgets/barometer:view": run_lib((a0,a1,a2) => run_loop($widgets_barometer_view(a0,a1,a2)), 3),
  "widgets/humidity:init": run_lib((a0) => run_loop($widgets_humidity_init(a0)), 1),
  "widgets/humidity:tip": run_lib((a0) => str_out(run_loop($widgets_humidity_tip(a0))), 1),
  "widgets/humidity:pfloat": run_lib((a0) => run_loop($widgets_humidity_pfloat(str_in(a0))), 1),
  "widgets/humidity:half_angle": run_lib((a0,a1) => run_loop($widgets_humidity_half_angle(Math.fround(a0),Math.fround(a1))), 2),
  "widgets/humidity:redraw": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_humidity_redraw(a0,str_in(a1),str_in(a2),a3,a4)), 5),
  "widgets/humidity:data": run_lib((a0,a1,a2,a3) => run_loop($widgets_humidity_data(a0,a1,a2,a3)), 4),
  "widgets/humidity:resize": run_lib((a0,a1) => run_loop($widgets_humidity_resize(a0,a1)), 2),
  "widgets/humidity:width": run_lib((a0) => run_loop($widgets_humidity_width(a0)), 1),
  "widgets/humidity:height": run_lib((a0) => run_loop($widgets_humidity_height(a0)), 1),
  "widgets/humidity:dashes": run_lib((a0,a1,a2,a3,a4,a5,a6,a7) => run_loop($widgets_humidity_dashes(nat_in(a0),nat_in(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5),Math.fround(a6),Math.fround(a7))), 8),
  "widgets/humidity:stray_dash": run_lib(() => run_loop($widgets_humidity_stray_dash()), 0),
  "widgets/humidity:labels": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($widgets_humidity_labels(nat_in(a0),nat_in(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5),a6)), 7),
  "widgets/humidity:arrow": run_lib((a0,a1,a2,a3) => run_loop($widgets_humidity_arrow(Math.fround(a0),Math.fround(a1),Math.fround(a2),Math.fround(a3))), 4),
  "widgets/humidity:front": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($widgets_humidity_front(Math.fround(a0),Math.fround(a1),a2,Math.fround(a3),a4,str_in(a5))), 6),
  "widgets/humidity:view": run_lib((a0,a1,a2) => run_loop($widgets_humidity_view(a0,a1,a2)), 3),
  "widgets/moonsun:init": run_lib((a0) => run_loop($widgets_moonsun_init(a0)), 1),
  "widgets/moonsun:tip": run_lib((a0) => str_out(run_loop($widgets_moonsun_tip(a0))), 1),
  "widgets/moonsun:fresh": run_lib((a0) => run_loop($widgets_moonsun_fresh(a0)), 1),
  "widgets/moonsun:differs": run_lib((a0,a1) => run_loop($widgets_moonsun_differs(a0,a1)), 2),
  "widgets/moonsun:texts": run_lib((a0,a1) => run_loop($widgets_moonsun_texts(a0,a1)), 2),
  "widgets/moonsun:data": run_lib((a0,a1,a2,a3) => run_loop($widgets_moonsun_data(a0,a1,a2,a3)), 4),
  "widgets/moonsun:resize": run_lib((a0,a1) => run_loop($widgets_moonsun_resize(a0,a1)), 2),
  "widgets/moonsun:width": run_lib((a0) => run_loop($widgets_moonsun_width(a0)), 1),
  "widgets/moonsun:height": run_lib((a0) => run_loop($widgets_moonsun_height(a0)), 1),
  "widgets/moonsun:line": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_moonsun_line(Math.fround(a0),Math.fround(a1),str_in(a2),a3,Math.fround(a4))), 5),
  "widgets/moonsun:view": run_lib((a0,a1,a2) => run_loop($widgets_moonsun_view(a0,a1,a2)), 3),
  "widgets/solar:init": run_lib((a0) => run_loop($widgets_solar_init(a0)), 1),
  "widgets/solar:tip": run_lib((a0) => str_out(run_loop($widgets_solar_tip(a0))), 1),
  "widgets/solar:seq": run_lib((a0) => run_loop($widgets_solar_seq(nat_in(a0))), 1),
  "widgets/solar:next": run_lib((a0) => run_loop($widgets_solar_next(nat_in(a0))), 1),
  "widgets/solar:prev": run_lib((a0) => run_loop($widgets_solar_prev(nat_in(a0))), 1),
  "widgets/solar:up.test": run_lib((a0,a1) => run_loop($widgets_solar_up_test(Math.fround(a0),Math.fround(a1))), 2),
  "widgets/solar:up": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_solar_up(nat_in(a0),a1,Math.fround(a2),Math.fround(a3),nat_in(a4))), 5),
  "widgets/solar:down.test": run_lib((a0,a1,a2) => run_loop($widgets_solar_down_test(Math.fround(a0),Math.fround(a1),nat_in(a2))), 3),
  "widgets/solar:down": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_solar_down(nat_in(a0),a1,Math.fround(a2),Math.fround(a3),nat_in(a4))), 5),
  "widgets/solar:range.down": run_lib((a0,a1) => run_loop($widgets_solar_range_down(Math.fround(a0),a1)), 2),
  "widgets/solar:range": run_lib((a0,a1) => run_loop($widgets_solar_range(Math.fround(a0),a1)), 2),
  "widgets/solar:rng_max": run_lib((a0) => run_loop($widgets_solar_rng_max(a0)), 1),
  "widgets/solar:apply": run_lib((a0,a1,a2,a3,a4,a5,a6,a7,a8,a9) => run_loop($widgets_solar_apply(a0,Math.fround(a1),Math.fround(a2),a3,str_in(a4),str_in(a5),str_in(a6),a7,a8,a9)), 10),
  "widgets/solar:data": run_lib((a0,a1,a2,a3) => run_loop($widgets_solar_data(a0,a1,a2,a3)), 4),
  "widgets/solar:resize": run_lib((a0,a1) => run_loop($widgets_solar_resize(a0,a1)), 2),
  "widgets/solar:width": run_lib((a0) => run_loop($widgets_solar_width(a0)), 1),
  "widgets/solar:height": run_lib((a0) => run_loop($widgets_solar_height(a0)), 1),
  "widgets/solar:modf": run_lib((a0,a1) => run_loop($widgets_solar_modf(Math.fround(a0),Math.fround(a1))), 2),
  "widgets/solar:dash": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($widgets_solar_dash(Math.fround(a0),Math.fround(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5))), 6),
  "widgets/solar:label": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($widgets_solar_label(Math.fround(a0),Math.fround(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4),a5,Math.fround(a6))), 7),
  "widgets/solar:scale": run_lib((a0,a1,a2,a3,a4,a5,a6,a7,a8) => run_loop($widgets_solar_scale(nat_in(a0),a1,Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5),Math.fround(a6),a7,Math.fround(a8))), 9),
  "widgets/solar:rest": run_lib((a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) => run_loop($widgets_solar_rest(a0,a1,Math.fround(a2),Math.fround(a3),Math.fround(a4),str_in(a5),Math.fround(a6),str_in(a7),Math.fround(a8),a9,a10)), 11),
  "widgets/solar:view": run_lib((a0,a1,a2) => run_loop($widgets_solar_view(a0,a1,a2)), 3),
  "widgets/status:blank": run_lib(() => str_out(run_loop($widgets_status_blank())), 0),
  "widgets/status:init": run_lib((a0,a1) => run_loop($widgets_status_init(a0,a1)), 2),
  "widgets/status:tip": run_lib((a0) => str_out(run_loop($widgets_status_tip(a0))), 1),
  "widgets/status:phase": run_lib((a0,a1) => run_loop($widgets_status_phase(a0,a1)), 2),
  "widgets/status:percent": run_lib((a0,a1) => run_loop($widgets_status_percent(a0,a1)), 2),
  "widgets/status:hidden_at": run_lib((a0,a1) => run_loop($widgets_status_hidden_at(a0,a1)), 2),
  "widgets/status:apply": run_lib((a0,a1) => run_loop($widgets_status_apply(a0,a1)), 2),
  "widgets/status:colour": run_lib((a0,a1,a2,a3,a4) => str_out(run_loop($widgets_status_colour(a0,str_in(a1),str_in(a2),a3,a4))), 5),
  "widgets/status:all4": run_lib((a0) => run_loop($widgets_status_all4(a0)), 1),
  "widgets/status:any4": run_lib((a0) => run_loop($widgets_status_any4(a0)), 1),
  "widgets/status:check": run_lib((a0,a1) => run_loop($widgets_status_check(a0,a1)), 2),
  "widgets/status:unscore": run_lib((a0) => str_out(run_loop($widgets_status_unscore(str_in(a0)))), 1),
  "widgets/status:rev_tail": run_lib((a0) => str_out(run_loop($widgets_status_rev_tail(str_in(a0)))), 1),
  "widgets/status:rev_head": run_lib((a0) => str_out(run_loop($widgets_status_rev_head(str_in(a0)))), 1),
  "widgets/status:station": run_lib((a0) => str_out(run_loop($widgets_status_station(str_in(a0)))), 1),
  "widgets/status:time": run_lib((a0) => str_out(run_loop($widgets_status_time(str_in(a0)))), 1),
  "widgets/status:is_undef": run_lib((a0) => run_loop($widgets_status_is_undef(str_in(a0))), 1),
  "widgets/status:throws": run_lib((a0) => run_loop($widgets_status_throws(a0)), 1),
  "widgets/status:throws_late": run_lib((a0,a1) => run_loop($widgets_status_throws_late(a0,a1)), 2),
  "widgets/status:line": run_lib((a0,a1) => str_out(run_loop($widgets_status_line(a0,a1))), 2),
  "widgets/status:status_text": run_lib((a0,a1,a2) => str_out(run_loop($widgets_status_status_text(a0,a1,str_in(a2)))), 3),
  "widgets/status:blink": run_lib((a0) => str_out(run_loop($widgets_status_blink(a0))), 1),
  "widgets/status:apply_data": run_lib((a0,a1,a2,a3) => run_loop($widgets_status_apply_data(a0,a1,a2,a3)), 4),
  "widgets/status:data": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_status_data(a0,a1,a2,a3,a4)), 5),
  "widgets/status:resize": run_lib((a0,a1) => run_loop($widgets_status_resize(a0,a1)), 2),
  "widgets/status:width": run_lib((a0) => run_loop($widgets_status_width(a0)), 1),
  "widgets/status:height": run_lib((a0) => run_loop($widgets_status_height(a0)), 1),
  "widgets/status:circle": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($widgets_status_circle(a0,str_in(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5),Math.fround(a6))), 7),
  "widgets/status:view": run_lib((a0,a1,a2) => run_loop($widgets_status_view(a0,a1,a2)), 3),
  "widgets/status:aborts": run_lib((a0,a1,a2) => run_loop($widgets_status_aborts(a0,a1,a2)), 3),
  "widgets/raintitle:init": run_lib((a0) => run_loop($widgets_raintitle_init(a0)), 1),
  "widgets/raintitle:tip": run_lib((a0) => str_out(run_loop($widgets_raintitle_tip(a0))), 1),
  "widgets/raintitle:data": run_lib((a0,a1,a2,a3) => run_loop($widgets_raintitle_data(a0,a1,a2,a3)), 4),
  "widgets/raintitle:resize": run_lib((a0,a1) => run_loop($widgets_raintitle_resize(a0,a1)), 2),
  "widgets/raintitle:width": run_lib((a0) => run_loop($widgets_raintitle_width(a0)), 1),
  "widgets/raintitle:height": run_lib((a0) => run_loop($widgets_raintitle_height(a0)), 1),
  "widgets/raintitle:view": run_lib((a0,a1,a2) => run_loop($widgets_raintitle_view(a0,a1,a2)), 3),
  "widgets/rainbar:init": run_lib((a0) => run_loop($widgets_rainbar_init(a0)), 1),
  "widgets/rainbar:canvas_id": run_lib((a0) => str_out(run_loop($widgets_rainbar_canvas_id(a0))), 1),
  "widgets/rainbar:key": run_lib((a0) => str_out(run_loop($widgets_rainbar_key(a0))), 1),
  "widgets/rainbar:title": run_lib((a0) => run_loop($widgets_rainbar_title(a0)), 1),
  "widgets/rainbar:field": run_lib((a0) => run_loop($widgets_rainbar_field(a0)), 1),
  "widgets/rainbar:tip": run_lib((a0) => str_out(run_loop($widgets_rainbar_tip(a0))), 1),
  "widgets/rainbar:seq": run_lib((a0) => run_loop($widgets_rainbar_seq(Math.fround(a0))), 1),
  "widgets/rainbar:grow.go": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_rainbar_grow_go(nat_in(a0),a1,Math.fround(a2),Math.fround(a3),Math.fround(a4))), 5),
  "widgets/rainbar:grow": run_lib((a0,a1,a2) => run_loop($widgets_rainbar_grow(Math.fround(a0),Math.fround(a1),Math.fround(a2))), 3),
  "widgets/rainbar:shrink.test": run_lib((a0,a1,a2) => run_loop($widgets_rainbar_shrink_test(Math.fround(a0),Math.fround(a1),Math.fround(a2))), 3),
  "widgets/rainbar:shrink.go": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_rainbar_shrink_go(nat_in(a0),a1,Math.fround(a2),Math.fround(a3),Math.fround(a4))), 5),
  "widgets/rainbar:shrink": run_lib((a0,a1) => run_loop($widgets_rainbar_shrink(a0,Math.fround(a1))), 2),
  "widgets/rainbar:rng_max": run_lib((a0) => run_loop($widgets_rainbar_rng_max(a0)), 1),
  "widgets/rainbar:rng_pos": run_lib((a0) => run_loop($widgets_rainbar_rng_pos(a0)), 1),
  "widgets/rainbar:data": run_lib((a0,a1,a2,a3) => run_loop($widgets_rainbar_data(a0,a1,a2,a3)), 4),
  "widgets/rainbar:resize": run_lib((a0,a1) => run_loop($widgets_rainbar_resize(a0,a1)), 2),
  "widgets/rainbar:width": run_lib((a0) => run_loop($widgets_rainbar_width(a0)), 1),
  "widgets/rainbar:height": run_lib((a0) => run_loop($widgets_rainbar_height(a0)), 1),
  "widgets/rainbar:dash": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($widgets_rainbar_dash(nat_in(a0),Math.fround(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5))), 6),
  "widgets/rainbar:dash_unset": run_lib(() => run_loop($widgets_rainbar_dash_unset()), 0),
  "widgets/rainbar:dashes": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($widgets_rainbar_dashes(nat_in(a0),nat_in(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5),Math.fround(a6))), 7),
  "widgets/rainbar:labels": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($widgets_rainbar_labels(nat_in(a0),nat_in(a1),Math.fround(a2),a3,Math.fround(a4),Math.fround(a5),Math.fround(a6))), 7),
  "widgets/rainbar:view": run_lib((a0,a1,a2) => run_loop($widgets_rainbar_view(a0,a1,a2)), 3),
  "widgets/uv:init": run_lib((a0) => run_loop($widgets_uv_init(a0)), 1),
  "widgets/uv:tip": run_lib((a0) => str_out(run_loop($widgets_uv_tip(a0))), 1),
  "widgets/uv:data": run_lib((a0,a1,a2,a3) => run_loop($widgets_uv_data(a0,a1,a2,a3)), 4),
  "widgets/uv:resize": run_lib((a0,a1) => run_loop($widgets_uv_resize(a0,a1)), 2),
  "widgets/uv:width": run_lib((a0) => run_loop($widgets_uv_width(a0)), 1),
  "widgets/uv:height": run_lib((a0) => run_loop($widgets_uv_height(a0)), 1),
  "widgets/uv:view": run_lib((a0,a1,a2) => run_loop($widgets_uv_view(a0,a1,a2)), 3),
  "widgets/winddir:init": run_lib((a0) => run_loop($widgets_winddir_init(a0)), 1),
  "widgets/winddir:tip": run_lib((a0) => str_out(run_loop($widgets_winddir_tip(a0))), 1),
  "widgets/winddir:pfloat": run_lib((a0) => run_loop($widgets_winddir_pfloat(str_in(a0))), 1),
  "widgets/winddir:unwrap": run_lib((a0,a1) => run_loop($widgets_winddir_unwrap(Math.fround(a0),Math.fround(a1))), 2),
  "widgets/winddir:redraw": run_lib((a0,a1,a2,a3) => run_loop($widgets_winddir_redraw(a0,Math.fround(a1),Math.fround(a2),a3)), 4),
  "widgets/winddir:data": run_lib((a0,a1,a2,a3) => run_loop($widgets_winddir_data(a0,a1,a2,a3)), 4),
  "widgets/winddir:resize": run_lib((a0,a1) => run_loop($widgets_winddir_resize(a0,a1)), 2),
  "widgets/winddir:width": run_lib((a0) => run_loop($widgets_winddir_width(a0)), 1),
  "widgets/winddir:height": run_lib((a0) => run_loop($widgets_winddir_height(a0)), 1),
  "widgets/winddir:dashes": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($widgets_winddir_dashes(nat_in(a0),nat_in(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5),Math.fround(a6))), 7),
  "widgets/winddir:compass": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($widgets_winddir_compass(Math.fround(a0),str_in(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4),a5)), 6),
  "widgets/winddir:pointer": run_lib((a0,a1,a2,a3,a4,a5,a6,a7,a8,a9) => run_loop($widgets_winddir_pointer(Math.fround(a0),Math.fround(a1),Math.fround(a2),str_in(a3),Math.fround(a4),Math.fround(a5),Math.fround(a6),Math.fround(a7),Math.fround(a8),Math.fround(a9))), 10),
  "widgets/winddir:front": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($widgets_winddir_front(Math.fround(a0),Math.fround(a1),a2,a3,a4,str_in(a5),str_in(a6))), 7),
  "widgets/winddir:view": run_lib((a0,a1,a2) => run_loop($widgets_winddir_view(a0,a1,a2)), 3),
  "widgets/windspeed:init": run_lib((a0) => run_loop($widgets_windspeed_init(a0)), 1),
  "widgets/windspeed:tip": run_lib((a0) => str_out(run_loop($widgets_windspeed_tip(a0))), 1),
  "widgets/windspeed:up.test": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_windspeed_up_test(Math.fround(a0),Math.fround(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4))), 5),
  "widgets/windspeed:up": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($widgets_windspeed_up(nat_in(a0),a1,Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5),Math.fround(a6))), 7),
  "widgets/windspeed:down.test": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_windspeed_down_test(Math.fround(a0),Math.fround(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4))), 5),
  "widgets/windspeed:down": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($widgets_windspeed_down(nat_in(a0),a1,Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5),Math.fround(a6))), 7),
  "widgets/windspeed:range": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_windspeed_range(Math.fround(a0),Math.fround(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4))), 5),
  "widgets/windspeed:apply": run_lib((a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) => run_loop($widgets_windspeed_apply(Math.fround(a0),Math.fround(a1),a2,str_in(a3),str_in(a4),str_in(a5),str_in(a6),Math.fround(a7),a8,a9,a10,a11,a12)), 13),
  "widgets/windspeed:data": run_lib((a0,a1,a2,a3) => run_loop($widgets_windspeed_data(a0,a1,a2,a3)), 4),
  "widgets/windspeed:resize": run_lib((a0,a1) => run_loop($widgets_windspeed_resize(a0,a1)), 2),
  "widgets/windspeed:width": run_lib((a0) => run_loop($widgets_windspeed_width(a0)), 1),
  "widgets/windspeed:height": run_lib((a0) => run_loop($widgets_windspeed_height(a0)), 1),
  "widgets/windspeed:beaufort": run_lib((a0) => run_loop($widgets_windspeed_beaufort(Math.fround(a0))), 1),
  "widgets/windspeed:colour": run_lib((a0) => str_out(run_loop($widgets_windspeed_colour(Math.fround(a0)))), 1),
  "widgets/windspeed:modf": run_lib((a0,a1) => run_loop($widgets_windspeed_modf(Math.fround(a0),Math.fround(a1))), 2),
  "widgets/windspeed:dash": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($widgets_windspeed_dash(Math.fround(a0),Math.fround(a1),Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5))), 6),
  "widgets/windspeed:dashes": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($widgets_windspeed_dashes(nat_in(a0),a1,Math.fround(a2),Math.fround(a3),Math.fround(a4),Math.fround(a5),Math.fround(a6))), 7),
  "widgets/windspeed:label": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($widgets_windspeed_label(Math.fround(a0),Math.fround(a1),Math.fround(a2),Math.fround(a3),a4,Math.fround(a5))), 6),
  "widgets/windspeed:labels": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($widgets_windspeed_labels(nat_in(a0),a1,Math.fround(a2),Math.fround(a3),Math.fround(a4),a5,Math.fround(a6))), 7),
  "widgets/windspeed:view": run_lib((a0,a1,a2) => run_loop($widgets_windspeed_view(a0,a1,a2)), 3),
  "lib/dates:fdiv": run_lib((a0,a1) => run_loop($lib_dates_fdiv(Math.fround(a0),Math.fround(a1))), 2),
  "lib/dates:fmod": run_lib((a0,a1) => run_loop($lib_dates_fmod(Math.fround(a0),Math.fround(a1))), 2),
  "lib/dates:leap": run_lib((a0) => run_loop($lib_dates_leap(Math.fround(a0))), 1),
  "lib/dates:dim": run_lib((a0,a1) => run_loop($lib_dates_dim(Math.fround(a0),Math.fround(a1))), 2),
  "lib/dates:days": run_lib((a0,a1,a2) => run_loop($lib_dates_days(Math.fround(a0),Math.fround(a1),Math.fround(a2))), 3),
  "lib/dates:civil": run_lib((a0) => run_loop($lib_dates_civil(Math.fround(a0))), 1),
  "lib/dates:ymd_y": run_lib((a0) => run_loop($lib_dates_ymd_y(a0)), 1),
  "lib/dates:ymd_m": run_lib((a0) => run_loop($lib_dates_ymd_m(a0)), 1),
  "lib/dates:ymd_d": run_lib((a0) => run_loop($lib_dates_ymd_d(a0)), 1),
  "lib/dates:ok": run_lib((a0) => run_loop($lib_dates_ok(a0)), 1),
  "lib/dates:add_days": run_lib((a0,a1) => run_loop($lib_dates_add_days(a0,Math.fround(a1))), 2),
  "lib/dates:add_minutes": run_lib((a0,a1) => run_loop($lib_dates_add_minutes(a0,Math.fround(a1))), 2),
  "lib/dates:weekday": run_lib((a0) => run_loop($lib_dates_weekday(a0)), 1),
  "lib/dates:iso_weekday": run_lib((a0) => run_loop($lib_dates_iso_weekday(a0)), 1),
  "lib/dates:set_iso_weekday": run_lib((a0,a1) => run_loop($lib_dates_set_iso_weekday(a0,Math.fround(a1))), 2),
  "lib/dates:month": run_lib((a0) => run_loop($lib_dates_month(a0)), 1),
  "lib/dates:set_month.go": run_lib((a0,a1,a2,a3) => run_loop($lib_dates_set_month_go(a0,a1,Math.fround(a2),Math.fround(a3))), 4),
  "lib/dates:set_month": run_lib((a0,a1) => run_loop($lib_dates_set_month(a0,Math.fround(a1))), 2),
  "lib/dates:add_months": run_lib((a0,a1) => run_loop($lib_dates_add_months(a0,Math.fround(a1))), 2),
  "lib/dates:lt": run_lib((a0,a1) => run_loop($lib_dates_lt(a0,a1)), 2),
  "lib/dates:stamp.go": run_lib((a0,a1,a2) => run_loop($lib_dates_stamp_go(a0,a1,Math.fround(a2))), 3),
  "lib/dates:stamp": run_lib((a0) => run_loop($lib_dates_stamp(a0)), 1),
  "lib/dates:stamps": run_lib((a0) => run_loop($lib_dates_stamps(a0)), 1),
  "lib/dates:digit": run_lib((a0) => run_loop($lib_dates_digit(str_in(a0))), 1),
  "lib/dates:scan.two": run_lib((a0,a1) => run_loop($lib_dates_scan_two(Math.fround(a0),str_in(a1))), 2),
  "lib/dates:scan.num": run_lib((a0) => run_loop($lib_dates_scan_num(str_in(a0))), 1),
  "lib/dates:scan.colon": run_lib((a0) => run_loop($lib_dates_scan_colon(str_in(a0))), 1),
  "lib/dates:scan.of": run_lib((a0,a1) => run_loop($lib_dates_scan_of(a0,str_in(a1))), 2),
  "lib/dates:scan_found": run_lib((a0) => run_loop($lib_dates_scan_found(a0)), 1),
  "lib/dates:scan_v": run_lib((a0) => run_loop($lib_dates_scan_v(a0)), 1),
  "lib/dates:scan_rest": run_lib((a0) => str_out(run_loop($lib_dates_scan_rest(a0))), 1),
  "lib/dates:put": run_lib((a0,a1,a2,a3) => run_loop($lib_dates_put(a0,a1,a2,Math.fround(a3))), 4),
  "lib/dates:run": run_lib((a0,a1,a2) => run_loop($lib_dates_run(a0,str_in(a1),a2)), 3),
  "lib/dates:build": run_lib((a0,a1) => run_loop($lib_dates_build(a0,a1)), 2),
  "lib/dates:no_got": run_lib(() => run_loop($lib_dates_no_got()), 0),
  "lib/dates:parse": run_lib((a0,a1,a2) => run_loop($lib_dates_parse(a0,str_in(a1),a2)), 3),
  "lib/dates:fmt_dd_hh_mm": run_lib(() => run_loop($lib_dates_fmt_dd_hh_mm()), 0),
  "lib/dates:fmt_dd": run_lib(() => run_loop($lib_dates_fmt_dd()), 0),
  "lib/dates:fmt_mm": run_lib(() => run_loop($lib_dates_fmt_mm()), 0),
  "lib/dates:today_dd": run_lib((a0) => str_out(run_loop($lib_dates_today_dd(a0))), 1),
  "widgets/graphs:cat": run_lib((a0,a1) => run_loop($widgets_graphs_cat(a0,a1)), 2),
  "widgets/graphs:bases": run_lib(() => run_loop($widgets_graphs_bases()), 0),
  "widgets/graphs:base_key": run_lib((a0) => str_out(run_loop($widgets_graphs_base_key(a0))), 1),
  "widgets/graphs:list_key": run_lib((a0) => str_out(run_loop($widgets_graphs_list_key(a0))), 1),
  "widgets/graphs:base_on": run_lib((a0,a1) => run_loop($widgets_graphs_base_on(a0,a1)), 2),
  "widgets/graphs:enabled.go": run_lib((a0,a1) => run_loop($widgets_graphs_enabled_go(a0,a1)), 2),
  "widgets/graphs:enabled": run_lib((a0) => run_loop($widgets_graphs_enabled(a0)), 1),
  "widgets/graphs:spans": run_lib((a0) => run_loop($widgets_graphs_spans(a0)), 1),
  "widgets/graphs:first_span": run_lib((a0) => run_loop($widgets_graphs_first_span(a0)), 1),
  "widgets/graphs:span_key": run_lib((a0) => str_out(run_loop($widgets_graphs_span_key(a0))), 1),
  "widgets/graphs:is_bar": run_lib((a0) => run_loop($widgets_graphs_is_bar(a0)), 1),
  "widgets/graphs:unit": run_lib((a0) => run_loop($widgets_graphs_unit(a0)), 1),
  "widgets/graphs:label_word": run_lib((a0) => run_loop($widgets_graphs_label_word(a0)), 1),
  "widgets/graphs:title_word": run_lib((a0) => run_loop($widgets_graphs_title_word(a0)), 1),
  "widgets/graphs:title.tail": run_lib((a0,a1) => str_out(run_loop($widgets_graphs_title_tail(a0,a1))), 2),
  "widgets/graphs:title": run_lib((a0,a1,a2) => str_out(run_loop($widgets_graphs_title(a0,a1,a2))), 3),
  "widgets/graphs:ticks": run_lib((a0) => run_loop($widgets_graphs_ticks(a0)), 1),
  "widgets/graphs:time_display": run_lib((a0,a1) => str_out(run_loop($widgets_graphs_time_display(a0,a1))), 2),
  "widgets/graphs:two": run_lib((a0,a1) => run_loop($widgets_graphs_two(a0,a1)), 2),
  "widgets/graphs:rgba": run_lib((a0,a1) => str_out(run_loop($widgets_graphs_rgba(str_in(a0),str_in(a1)))), 2),
  "widgets/graphs:line_style": run_lib((a0,a1) => run_loop($widgets_graphs_line_style(str_in(a0),a1)), 2),
  "widgets/graphs:style": run_lib((a0) => run_loop($widgets_graphs_style(a0)), 1),
  "widgets/graphs:style2": run_lib((a0) => run_loop($widgets_graphs_style2(a0)), 1),
  "widgets/graphs:border": run_lib((a0) => str_out(run_loop($widgets_graphs_border(a0))), 1),
  "widgets/graphs:raw": run_lib((a0,a1,a2) => str_out(run_loop($widgets_graphs_raw(a0,nat_in(a1),nat_in(a2)))), 3),
  "widgets/graphs:range_raw": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_range_raw(nat_in(a0),a1,nat_in(a2),nat_in(a3))), 4),
  "widgets/graphs:vals": run_lib((a0) => run_loop($widgets_graphs_vals(a0)), 1),
  "widgets/graphs:rot_val": run_lib((a0,a1) => run_loop($widgets_graphs_rot_val(a0,nat_in(a1))), 2),
  "widgets/graphs:rot_mo": run_lib((a0,a1) => run_loop($widgets_graphs_rot_mo(a0,nat_in(a1))), 2),
  "widgets/graphs:week_base": run_lib((a0) => run_loop($widgets_graphs_week_base(a0)), 1),
  "widgets/graphs:month_base": run_lib((a0) => run_loop($widgets_graphs_month_base(a0)), 1),
  "widgets/graphs:week_shift": run_lib((a0) => run_loop($widgets_graphs_week_shift(a0)), 1),
  "widgets/graphs:month_shift": run_lib((a0) => run_loop($widgets_graphs_month_shift(a0)), 1),
  "widgets/graphs:rain7.go": run_lib((a0,a1,a2) => run_loop($widgets_graphs_rain7_go(nat_in(a0),a1,nat_in(a2))), 3),
  "widgets/graphs:series.of": run_lib((a0,a1) => run_loop($widgets_graphs_series_of(a0,a1)), 2),
  "widgets/graphs:hours": run_lib((a0,a1) => run_loop($widgets_graphs_hours(nat_in(a0),nat_in(a1))), 2),
  "widgets/graphs:daily": run_lib((a0) => run_loop($widgets_graphs_daily(nat_in(a0))), 1),
  "widgets/graphs:minutes": run_lib((a0) => run_loop($widgets_graphs_minutes(nat_in(a0))), 1),
  "widgets/graphs:quarters": run_lib((a0) => run_loop($widgets_graphs_quarters(nat_in(a0))), 1),
  "widgets/graphs:src": run_lib((a0,a1) => run_loop($widgets_graphs_src(a0,a1)), 2),
  "widgets/graphs:src2": run_lib((a0) => run_loop($widgets_graphs_src2(a0)), 1),
  "widgets/graphs:js_int.digits": run_lib((a0,a1,a2) => run_loop($widgets_graphs_js_int_digits(str_in(a0),Math.fround(a1),a2)), 3),
  "widgets/graphs:js_int.sign": run_lib((a0) => run_loop($widgets_graphs_js_int_sign(str_in(a0))), 1),
  "widgets/graphs:js_int": run_lib((a0) => run_loop($widgets_graphs_js_int(str_in(a0))), 1),
  "widgets/graphs:nth": run_lib((a0,a1) => str_out(run_loop($widgets_graphs_nth(a0,nat_in(a1)))), 2),
  "widgets/graphs:hour_of": run_lib((a0) => run_loop($widgets_graphs_hour_of(str_in(a0))), 1),
  "widgets/graphs:max_hour": run_lib((a0,a1) => run_loop($widgets_graphs_max_hour(a0,Math.fround(a1))), 2),
  "widgets/graphs:js_mod": run_lib((a0,a1) => run_loop($widgets_graphs_js_mod(Math.fround(a0),Math.fround(a1))), 2),
  "widgets/graphs:to24": run_lib((a0,a1) => run_loop($widgets_graphs_to24(a0,a1)), 2),
  "widgets/graphs:last": run_lib((a0) => str_out(run_loop($widgets_graphs_last(a0))), 1),
  "widgets/graphs:hour_moments": run_lib((a0,a1,a2) => run_loop($widgets_graphs_hour_moments(a0,a1,str_in(a2))), 3),
  "widgets/graphs:back_day": run_lib((a0) => run_loop($widgets_graphs_back_day(a0)), 1),
  "widgets/graphs:before": run_lib((a0,a1) => run_loop($widgets_graphs_before(a0,a1)), 2),
  "widgets/graphs:day_fix": run_lib((a0,a1) => run_loop($widgets_graphs_day_fix(a0,a1)), 2),
  "widgets/graphs:stamp_hour": run_lib((a0) => run_loop($widgets_graphs_stamp_hour(a0)), 1),
  "widgets/graphs:days31": run_lib((a0,a1,a2) => run_loop($widgets_graphs_days31(nat_in(a0),a1,Math.fround(a2))), 3),
  "widgets/graphs:stamp_day": run_lib((a0) => run_loop($widgets_graphs_stamp_day(a0)), 1),
  "widgets/graphs:mins60": run_lib((a0,a1,a2) => run_loop($widgets_graphs_mins60(nat_in(a0),a1,Math.fround(a2))), 3),
  "widgets/graphs:stamp_minute": run_lib((a0) => run_loop($widgets_graphs_stamp_minute(a0)), 1),
  "widgets/graphs:quarters28": run_lib((a0,a1,a2) => run_loop($widgets_graphs_quarters28(nat_in(a0),a1,Math.fround(a2))), 3),
  "widgets/graphs:stamp_quarter": run_lib((a0) => run_loop($widgets_graphs_stamp_quarter(a0)), 1),
  "widgets/graphs:week7": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_week7(nat_in(a0),a1,Math.fround(a2),Math.fround(a3))), 4),
  "widgets/graphs:stamp_week": run_lib((a0) => run_loop($widgets_graphs_stamp_week(a0)), 1),
  "widgets/graphs:month12": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_month12(nat_in(a0),a1,Math.fround(a2),Math.fround(a3))), 4),
  "widgets/graphs:stamp_month": run_lib((a0) => run_loop($widgets_graphs_stamp_month(a0)), 1),
  "widgets/graphs:stamps": run_lib((a0,a1,a2) => run_loop($widgets_graphs_stamps(a0,a1,a2)), 3),
  "widgets/graphs:fmt_val": run_lib((a0,a1,a2) => str_out(run_loop($widgets_graphs_fmt_val(a0,a1,a2))), 3),
  "widgets/graphs:points": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_points(a0,a1,a2,a3)), 4),
  "widgets/graphs:values": run_lib((a0,a1,a2) => run_loop($widgets_graphs_values(a0,a1,a2)), 3),
  "widgets/graphs:labels": run_lib((a0,a1) => run_loop($widgets_graphs_labels(a0,str_in(a1))), 2),
  "widgets/graphs:unit_tag": run_lib((a0,a1) => str_out(run_loop($widgets_graphs_unit_tag(a0,a1))), 2),
  "widgets/graphs:axis_label": run_lib((a0,a1) => str_out(run_loop($widgets_graphs_axis_label(a0,a1))), 2),
  "widgets/graphs:legend_word": run_lib((a0,a1) => run_loop($widgets_graphs_legend_word(a0,a1)), 2),
  "widgets/graphs:line_sets": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_line_sets(a0,a1,a2,a3)), 4),
  "widgets/graphs:bar_set": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_bar_set(a0,a1,a2,a3)), 4),
  "widgets/graphs:bar_labels": run_lib((a0,a1,a2) => run_loop($widgets_graphs_bar_labels(a0,a1,a2)), 3),
  "widgets/graphs:white": run_lib(() => str_out(run_loop($widgets_graphs_white())), 0),
  "widgets/graphs:px": run_lib((a0,a1) => run_loop($widgets_graphs_px(Math.fround(a0),Math.fround(a1))), 2),
  "widgets/graphs:formats": run_lib((a0) => run_loop($widgets_graphs_formats(str_in(a0))), 1),
  "widgets/graphs:small_x": run_lib((a0,a1,a2) => run_loop($widgets_graphs_small_x(a0,str_in(a1),Math.fround(a2))), 3),
  "widgets/graphs:small_empty": run_lib((a0,a1) => run_loop($widgets_graphs_small_empty(a0,Math.fround(a1))), 2),
  "widgets/graphs:small_unsized": run_lib((a0) => run_loop($widgets_graphs_small_unsized(a0)), 1),
  "widgets/graphs:chart_labels": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_chart_labels(a0,a1,a2,a3)), 4),
  "widgets/graphs:chart_sets": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_graphs_chart_sets(a0,a1,a2,a3,a4)), 5),
  "widgets/graphs:small_chart": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_graphs_small_chart(a0,a1,a2,a3,Math.fround(a4))), 5),
  "widgets/graphs:modal_empty": run_lib(() => run_loop($widgets_graphs_modal_empty()), 0),
  "widgets/graphs:modal_y": run_lib((a0,a1) => run_loop($widgets_graphs_modal_y(a0,a1)), 2),
  "widgets/graphs:modal_chart.go": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_graphs_modal_chart_go(a0,a1,a2,a3,a4)), 5),
  "widgets/graphs:modal_chart": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_modal_chart(a0,a1,a2,a3)), 4),
  "widgets/graphs:hit": run_lib((a0) => run_loop($widgets_graphs_hit(str_in(a0))), 1),
  "widgets/graphs:small_on": run_lib((a0) => run_loop($widgets_graphs_small_on(a0)), 1),
  "widgets/graphs:small_w": run_lib((a0) => run_loop($widgets_graphs_small_w(a0)), 1),
  "widgets/graphs:gs_canvas": run_lib((a0) => str_out(run_loop($widgets_graphs_gs_canvas(a0))), 1),
  "widgets/graphs:gs_base": run_lib((a0) => run_loop($widgets_graphs_gs_base(a0)), 1),
  "widgets/graphs:gs_span": run_lib((a0) => run_loop($widgets_graphs_gs_span(a0)), 1),
  "widgets/graphs:small_of": run_lib((a0,a1) => run_loop($widgets_graphs_small_of(a0,a1)), 2),
  "widgets/graphs:with_small": run_lib((a0,a1,a2) => run_loop($widgets_graphs_with_small(a0,a1,a2)), 3),
  "widgets/graphs:snap_of": run_lib((a0) => run_loop($widgets_graphs_snap_of(a0)), 1),
  "widgets/graphs:ready_of": run_lib((a0) => run_loop($widgets_graphs_ready_of(a0)), 1),
  "widgets/graphs:modal_of": run_lib((a0) => run_loop($widgets_graphs_modal_of(a0)), 1),
  "widgets/graphs:handler_of": run_lib((a0) => run_loop($widgets_graphs_handler_of(a0)), 1),
  "widgets/graphs:with_cur": run_lib((a0,a1,a2) => run_loop($widgets_graphs_with_cur(a0,a1,a2)), 3),
  "widgets/graphs:with_view": run_lib((a0,a1,a2) => run_loop($widgets_graphs_with_view(a0,Math.fround(a1),Math.fround(a2))), 3),
  "widgets/graphs:with_snap": run_lib((a0,a1) => run_loop($widgets_graphs_with_snap(a0,a1)), 2),
  "widgets/graphs:first_base": run_lib((a0) => run_loop($widgets_graphs_first_base(a0)), 1),
  "widgets/graphs:init": run_lib((a0) => run_loop($widgets_graphs_init(a0)), 1),
  "widgets/graphs:small_w_css": run_lib((a0) => str_out(run_loop($widgets_graphs_small_w_css(Math.fround(a0)))), 1),
  "widgets/graphs:small_h_css": run_lib((a0) => str_out(run_loop($widgets_graphs_small_h_css(Math.fround(a0)))), 1),
  "widgets/graphs:small_size": run_lib((a0,a1) => run_loop($widgets_graphs_small_size(a0,Math.fround(a1))), 2),
  "widgets/graphs:modal_dim": run_lib((a0,a1) => run_loop($widgets_graphs_modal_dim(Math.fround(a0),Math.fround(a1))), 2),
  "widgets/graphs:modal_size": run_lib((a0) => run_loop($widgets_graphs_modal_size(a0)), 1),
  "widgets/graphs:small_shown": run_lib((a0) => run_loop($widgets_graphs_small_shown(a0)), 1),
  "widgets/graphs:small_view.go": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_graphs_small_view_go(a0,a1,a2,a3,Math.fround(a4))), 5),
  "widgets/graphs:small_view": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_small_view(a0,a1,a2,Math.fround(a3))), 4),
  "widgets/graphs:configure_small.go": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_configure_small_go(a0,a1,a2,a3)), 4),
  "widgets/graphs:configure_small.ready": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_configure_small_ready(a0,a1,a2,a3)), 4),
  "widgets/graphs:configure_small.on": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_configure_small_on(a0,a1,a2,a3)), 4),
  "widgets/graphs:configure_small": run_lib((a0,a1,a2) => run_loop($widgets_graphs_configure_small(a0,a1,a2)), 3),
  "widgets/graphs:configure_modal.go": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_graphs_configure_modal_go(a0,a1,a2,a3,a4)), 5),
  "widgets/graphs:configure_modal.ready": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_graphs_configure_modal_ready(a0,a1,a2,a3,a4)), 5),
  "widgets/graphs:configure_modal.on": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_graphs_configure_modal_on(a0,a1,a2,a3,a4)), 5),
  "widgets/graphs:configure_modal": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_configure_modal(a0,a1,a2,a3)), 4),
  "widgets/graphs:configure_current.go": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_graphs_configure_current_go(a0,a1,a2,a3,a4)), 5),
  "widgets/graphs:configure_current": run_lib((a0,a1) => run_loop($widgets_graphs_configure_current(a0,a1)), 2),
  "widgets/graphs:after": run_lib((a0,a1) => run_loop($widgets_graphs_after(a0,a1)), 2),
  "widgets/graphs:then_small": run_lib((a0,a1,a2) => run_loop($widgets_graphs_then_small(a0,a1,a2)), 3),
  "widgets/graphs:then_current": run_lib((a0,a1) => run_loop($widgets_graphs_then_current(a0,a1)), 2),
  "widgets/graphs:chart_defaults": run_lib(() => run_loop($widgets_graphs_chart_defaults()), 0),
  "widgets/graphs:start_small.go": run_lib((a0,a1) => run_loop($widgets_graphs_start_small_go(a0,a1)), 2),
  "widgets/graphs:start_small": run_lib((a0,a1) => run_loop($widgets_graphs_start_small(a0,a1)), 2),
  "widgets/graphs:hide": run_lib((a0,a1) => run_loop($widgets_graphs_hide(a0,str_in(a1))), 2),
  "widgets/graphs:start_lists": run_lib((a0) => run_loop($widgets_graphs_start_lists(a0)), 1),
  "widgets/graphs:options.spans": run_lib((a0,a1,a2) => run_loop($widgets_graphs_options_spans(a0,a1,a2)), 3),
  "widgets/graphs:options.go": run_lib((a0,a1) => run_loop($widgets_graphs_options_go(a0,a1)), 2),
  "widgets/graphs:start_modal": run_lib((a0,a1) => run_loop($widgets_graphs_start_modal(a0,a1)), 2),
  "widgets/graphs:canvases.go": run_lib((a0,a1) => run_loop($widgets_graphs_canvases_go(a0,a1)), 2),
  "widgets/graphs:small_canvases": run_lib((a0) => run_loop($widgets_graphs_small_canvases(a0)), 1),
  "widgets/graphs:modal_canvases": run_lib((a0) => run_loop($widgets_graphs_modal_canvases(a0)), 1),
  "widgets/graphs:resize_small.go": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($widgets_graphs_resize_small_go(a0,a1,a2,a3,a4,Math.fround(a5))), 6),
  "widgets/graphs:resize_small": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_resize_small(a0,a1,a2,Math.fround(a3))), 4),
  "widgets/graphs:resize_modal.go": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_resize_modal_go(a0,a1,Math.fround(a2),Math.fround(a3))), 4),
  "widgets/graphs:resize_modal": run_lib((a0,a1,a2) => run_loop($widgets_graphs_resize_modal(a0,Math.fround(a1),Math.fround(a2))), 3),
  "widgets/graphs:resize.go": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_resize_go(a0,a1,a2,a3)), 4),
  "widgets/graphs:resize": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_resize(a0,a1,str_in(a2),a3)), 4),
  "widgets/graphs:data": run_lib((a0,a1) => run_loop($widgets_graphs_data(a0,a1)), 2),
  "widgets/graphs:units": run_lib((a0,a1,a2) => run_loop($widgets_graphs_units(a0,a1,a2)), 3),
  "widgets/graphs:open.go": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_open_go(a0,a1,a2,a3)), 4),
  "widgets/graphs:open.if": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_graphs_open_if(a0,a1,a2,a3,a4)), 5),
  "widgets/graphs:open": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_open(a0,a1,a2,a3)), 4),
  "widgets/graphs:open_current.go": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($widgets_graphs_open_current_go(a0,a1,a2,a3,a4,a5)), 6),
  "widgets/graphs:open_current": run_lib((a0,a1) => run_loop($widgets_graphs_open_current(a0,a1)), 2),
  "widgets/graphs:close": run_lib((a0) => run_loop($widgets_graphs_close(a0)), 1),
  "widgets/graphs:click.go": run_lib((a0,a1,a2) => run_loop($widgets_graphs_click_go(a0,a1,a2)), 3),
  "widgets/graphs:click": run_lib((a0,a1,a2) => run_loop($widgets_graphs_click(a0,a1,str_in(a2))), 3),
  "widgets/graphs:pick.spans": run_lib((a0,a1,a2) => run_loop($widgets_graphs_pick_spans(a0,a1,str_in(a2))), 3),
  "widgets/graphs:pick.found": run_lib((a0) => run_loop($widgets_graphs_pick_found(a0)), 1),
  "widgets/graphs:pick.go": run_lib((a0,a1) => run_loop($widgets_graphs_pick_go(a0,str_in(a1))), 2),
  "widgets/graphs:change.if": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_graphs_change_if(a0,a1,a2,a3,a4)), 5),
  "widgets/graphs:change.go": run_lib((a0,a1,a2) => run_loop($widgets_graphs_change_go(a0,a1,a2)), 3),
  "widgets/graphs:select.go": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_select_go(a0,a1,a2,str_in(a3))), 4),
  "widgets/graphs:select": run_lib((a0,a1,a2,a3) => run_loop($widgets_graphs_select(a0,a1,str_in(a2),str_in(a3))), 4),
  "widgets/forecast:init": run_lib((a0) => run_loop($widgets_forecast_init(a0)), 1),
  "widgets/forecast:enabled": run_lib((a0) => run_loop($widgets_forecast_enabled(a0)), 1),
  "widgets/forecast:spaces": run_lib((a0) => str_out(run_loop($widgets_forecast_spaces(str_in(a0)))), 1),
  "widgets/forecast:cut": run_lib((a0,a1) => str_out(run_loop($widgets_forecast_cut(str_in(a0),nat_in(a1)))), 2),
  "widgets/forecast:cands": run_lib((a0,a1,a2) => run_loop($widgets_forecast_cands(a0,str_in(a1),str_in(a2))), 3),
  "widgets/forecast:show": run_lib((a0,a1) => run_loop($widgets_forecast_show(a0,str_in(a1))), 2),
  "widgets/forecast:start": run_lib((a0) => run_loop($widgets_forecast_start(a0)), 1),
  "widgets/forecast:has.go": run_lib((a0,a1,a2,a3) => run_loop($widgets_forecast_has_go(a0,a1,a2,str_in(a3))), 4),
  "widgets/forecast:cre_length": run_lib((a0) => run_loop($widgets_forecast_cre_length(a0)), 1),
  "widgets/forecast:data.go": run_lib((a0,a1,a2) => run_loop($widgets_forecast_data_go(a0,a1,a2)), 3),
  "widgets/forecast:data": run_lib((a0,a1) => run_loop($widgets_forecast_data(a0,a1)), 2),
  "widgets/forecast:size": run_lib((a0,a1,a2) => run_loop($widgets_forecast_size(str_in(a0),Math.fround(a1),Math.fround(a2))), 3),
  "widgets/forecast:redo": run_lib((a0,a1) => run_loop($widgets_forecast_redo(a0,a1)), 2),
  "widgets/forecast:resize.go": run_lib((a0,a1,a2,a3) => run_loop($widgets_forecast_resize_go(a0,a1,a2,a3)), 4),
  "widgets/forecast:resize": run_lib((a0,a1,a2) => run_loop($widgets_forecast_resize(a0,a1,a2)), 3),
  "widgets/forecast:click": run_lib((a0,a1) => run_loop($widgets_forecast_click(a0,str_in(a1))), 2),
  "widgets/records:scan_ok": run_lib((a0) => run_loop($widgets_records_scan_ok(a0)), 1),
  "widgets/records:scan_v": run_lib((a0) => run_loop($widgets_records_scan_v(a0)), 1),
  "widgets/records:scan_len": run_lib((a0) => run_loop($widgets_records_scan_len(a0)), 1),
  "widgets/records:scan_rest": run_lib((a0) => str_out(run_loop($widgets_records_scan_rest(a0))), 1),
  "widgets/records:skip_nd": run_lib((a0) => str_out(run_loop($widgets_records_skip_nd(str_in(a0)))), 1),
  "widgets/records:lead_d": run_lib((a0) => str_out(run_loop($widgets_records_lead_d(str_in(a0)))), 1),
  "widgets/records:dval": run_lib((a0,a1) => run_loop($widgets_records_dval(str_in(a0),a1)), 2),
  "widgets/records:num": run_lib((a0,a1) => run_loop($widgets_records_num(str_in(a0),nat_in(a1))), 2),
  "widgets/records:after_c": run_lib((a0,a1,a2) => str_out(run_loop($widgets_records_after_c(str_in(a0),str_in(a1),str_in(a2)))), 3),
  "widgets/records:lit": run_lib((a0,a1) => str_out(run_loop($widgets_records_lit(str_in(a0),str_in(a1)))), 2),
  "widgets/records:in_range": run_lib((a0,a1,a2) => run_loop($widgets_records_in_range(a0,a1,a2)), 3),
  "widgets/records:word_char": run_lib((a0) => run_loop($widgets_records_word_char(str_in(a0))), 1),
  "widgets/records:wordy": run_lib((a0) => run_loop($widgets_records_wordy(str_in(a0))), 1),
  "widgets/records:is_leap": run_lib((a0) => run_loop($widgets_records_is_leap(a0)), 1),
  "widgets/records:dim": run_lib((a0,a1) => run_loop($widgets_records_dim(a0,a1)), 2),
  "widgets/records:civil": run_lib((a0,a1,a2) => run_loop($widgets_records_civil(a0,a1,a2)), 3),
  "widgets/records:clock_year": run_lib((a0) => run_loop($widgets_records_clock_year(a0)), 1),
  "widgets/records:clock_month": run_lib((a0) => run_loop($widgets_records_clock_month(a0)), 1),
  "widgets/records:clock_day": run_lib((a0) => run_loop($widgets_records_clock_day(a0)), 1),
  "widgets/records:make": run_lib((a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14) => run_loop($widgets_records_make(a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14)), 15),
  "widgets/records:year_of": run_lib((a0) => run_loop($widgets_records_year_of(a0)), 1),
  "widgets/records:parse_rec": run_lib((a0,a1) => run_loop($widgets_records_parse_rec(str_in(a0),a1)), 2),
  "widgets/records:parse_now": run_lib((a0) => run_loop($widgets_records_parse_now(a0)), 1),
  "widgets/records:mom_ok": run_lib((a0) => run_loop($widgets_records_mom_ok(a0)), 1),
  "widgets/records:mom_days": run_lib((a0) => run_loop($widgets_records_mom_days(a0)), 1),
  "widgets/records:mom_tod": run_lib((a0) => run_loop($widgets_records_mom_tod(a0)), 1),
  "widgets/records:colour": run_lib((a0,a1) => str_out(run_loop($widgets_records_colour(a0,a1))), 2),
  "widgets/records:rec_set": run_lib((a0) => run_loop($widgets_records_rec_set(a0)), 1),
  "widgets/records:rec_need": run_lib((a0) => run_loop($widgets_records_rec_need(a0)), 1),
  "widgets/records:rec_key": run_lib((a0) => str_out(run_loop($widgets_records_rec_key(a0))), 1),
  "widgets/records:rec": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($widgets_records_rec(a0,a1,a2,nat_in(a3),a4,str_in(a5),nat_in(a6))), 7),
  "widgets/records:plain": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_records_plain(a0,a1,a2,nat_in(a3),a4)), 5),
  "widgets/records:dir": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_records_dir(a0,a1,a2,nat_in(a3),nat_in(a4))), 5),
  "widgets/records:entries": run_lib((a0,a1,a2,a3) => run_loop($widgets_records_entries(a0,a1,nat_in(a2),nat_in(a3))), 4),
  "widgets/records:all_ok": run_lib((a0,a1) => run_loop($widgets_records_all_ok(a0,nat_in(a1))), 2),
  "widgets/records:apply": run_lib((a0,a1,a2,a3) => run_loop($widgets_records_apply(a0,a1,nat_in(a2),a3)), 4),
  "widgets/records:init": run_lib((a0) => run_loop($widgets_records_init(a0)), 1),
  "widgets/records:enabled": run_lib((a0) => run_loop($widgets_records_enabled(a0)), 1),
  "widgets/records:attr": run_lib((a0) => str_out(run_loop($widgets_records_attr(str_in(a0)))), 1),
  "widgets/records:row": run_lib((a0,a1,a2) => str_out(run_loop($widgets_records_row(a0,a1,a2))), 3),
  "widgets/records:has": run_lib((a0,a1) => run_loop($widgets_records_has(a0,str_in(a1))), 2),
  "widgets/records:last_with": run_lib((a0,a1,a2) => run_loop($widgets_records_last_with(a0,str_in(a1),a2)), 3),
  "widgets/records:rows": run_lib((a0,a1,a2,a3,a4) => str_out(run_loop($widgets_records_rows(a0,a1,a2,a3,a4))), 5),
  "widgets/records:current": run_lib((a0) => run_loop($widgets_records_current(a0)), 1),
  "widgets/records:dates": run_lib((a0) => run_loop($widgets_records_dates(str_in(a0))), 1),
  "widgets/records:table": run_lib((a0,a1) => run_loop($widgets_records_table(a0,a1)), 2),
  "widgets/records:start": run_lib((a0) => run_loop($widgets_records_start(a0)), 1),
  "widgets/records:cre_length": run_lib((a0) => run_loop($widgets_records_cre_length(a0)), 1),
  "widgets/records:refresh": run_lib((a0,a1) => run_loop($widgets_records_refresh(a0,a1)), 2),
  "widgets/records:data.go": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_records_data_go(a0,a1,a2,a3,nat_in(a4))), 5),
  "widgets/records:data": run_lib((a0,a1) => run_loop($widgets_records_data(a0,a1)), 2),
  "widgets/records:fonts": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_records_fonts(nat_in(a0),Math.fround(a1),Math.fround(a2),a3,a4)), 5),
  "widgets/records:size": run_lib((a0,a1,a2) => run_loop($widgets_records_size(str_in(a0),Math.fround(a1),Math.fround(a2))), 3),
  "widgets/records:sized": run_lib((a0) => run_loop($widgets_records_sized(a0)), 1),
  "widgets/records:was_sized": run_lib((a0) => run_loop($widgets_records_was_sized(a0)), 1),
  "widgets/records:resize.go": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_records_resize_go(a0,a1,a2,Math.fround(a3),Math.fround(a4))), 5),
  "widgets/records:resize": run_lib((a0,a1,a2,a3) => run_loop($widgets_records_resize(a0,a1,Math.fround(a2),Math.fround(a3))), 4),
  "widgets/records:open": run_lib((a0) => run_loop($widgets_records_open(a0)), 1),
  "widgets/records:click.go": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($widgets_records_click_go(a0,a1,a2,str_in(a3),Math.fround(a4),Math.fround(a5))), 6),
  "widgets/records:click": run_lib((a0,a1,a2,a3,a4) => run_loop($widgets_records_click(a0,a1,str_in(a2),Math.fround(a3),Math.fround(a4))), 5),
  "widgets/records:with_cur": run_lib((a0,a1) => run_loop($widgets_records_with_cur(a0,nat_in(a1))), 2),
  "widgets/records:select.go": run_lib((a0,a1,a2,a3) => run_loop($widgets_records_select_go(a0,a1,a2,str_in(a3))), 4),
  "widgets/records:select": run_lib((a0,a1,a2,a3) => run_loop($widgets_records_select(a0,a1,str_in(a2),str_in(a3))), 4),
  "widgets/records:units": run_lib((a0,a1) => run_loop($widgets_records_units(a0,a1)), 2),
  "wiring:cat": run_lib((a0,a1) => run_loop($wiring_cat(a0,a1)), 2),
  "wiring:init": run_lib((a0,a1) => run_loop($wiring_init(a0,a1)), 2),
  "wiring:start.one": run_lib((a0,a1,a2,a3) => run_loop($wiring_start_one(a0,a1,str_in(a2),str_in(a3))), 4),
  "wiring:start": run_lib((a0,a1) => run_loop($wiring_start(a0,a1)), 2),
  "wiring:canvas.one": run_lib((a0,a1) => run_loop($wiring_canvas_one(a0,str_in(a1))), 2),
  "wiring:canvases": run_lib((a0,a1,a2,a3) => run_loop($wiring_canvases(a0,a1,a2,a3)), 4),
  "wiring:resize.apparent": run_lib((a0,a1,a2) => run_loop($wiring_resize_apparent(a0,a1,a2)), 3),
  "wiring:size.apparent": run_lib((a0,a1) => run_loop($wiring_size_apparent(a0,a1)), 2),
  "wiring:draw.apparent": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_apparent(a0,a1,a2,a3)), 4),
  "wiring:data.apparent": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_data_apparent(a0,a1,a2,a3,a4)), 5),
  "wiring:resize.temp1": run_lib((a0,a1,a2) => run_loop($wiring_resize_temp1(a0,a1,a2)), 3),
  "wiring:size.temp1": run_lib((a0,a1) => run_loop($wiring_size_temp1(a0,a1)), 2),
  "wiring:draw.temp1": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_temp1(a0,a1,a2,a3)), 4),
  "wiring:data.temp1": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_data_temp1(a0,a1,a2,a3,a4)), 5),
  "wiring:resize.temp2": run_lib((a0,a1,a2) => run_loop($wiring_resize_temp2(a0,a1,a2)), 3),
  "wiring:size.temp2": run_lib((a0,a1) => run_loop($wiring_size_temp2(a0,a1)), 2),
  "wiring:draw.temp2": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_temp2(a0,a1,a2,a3)), 4),
  "wiring:data.temp2": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_data_temp2(a0,a1,a2,a3,a4)), 5),
  "wiring:resize.temp3": run_lib((a0,a1,a2) => run_loop($wiring_resize_temp3(a0,a1,a2)), 3),
  "wiring:size.temp3": run_lib((a0,a1) => run_loop($wiring_size_temp3(a0,a1)), 2),
  "wiring:draw.temp3": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_temp3(a0,a1,a2,a3)), 4),
  "wiring:data.temp3": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_data_temp3(a0,a1,a2,a3,a4)), 5),
  "wiring:resize.barometer": run_lib((a0,a1,a2) => run_loop($wiring_resize_barometer(a0,a1,a2)), 3),
  "wiring:size.barometer": run_lib((a0,a1) => run_loop($wiring_size_barometer(a0,a1)), 2),
  "wiring:draw.barometer": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_barometer(a0,a1,a2,a3)), 4),
  "wiring:data.barometer": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_data_barometer(a0,a1,a2,a3,a4)), 5),
  "wiring:resize.windchill": run_lib((a0,a1,a2) => run_loop($wiring_resize_windchill(a0,a1,a2)), 3),
  "wiring:size.windchill": run_lib((a0,a1) => run_loop($wiring_size_windchill(a0,a1)), 2),
  "wiring:draw.windchill": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_windchill(a0,a1,a2,a3)), 4),
  "wiring:data.windchill": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_data_windchill(a0,a1,a2,a3,a4)), 5),
  "wiring:resize.humidity": run_lib((a0,a1,a2) => run_loop($wiring_resize_humidity(a0,a1,a2)), 3),
  "wiring:size.humidity": run_lib((a0,a1) => run_loop($wiring_size_humidity(a0,a1)), 2),
  "wiring:draw.humidity": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_humidity(a0,a1,a2,a3)), 4),
  "wiring:data.humidity": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_data_humidity(a0,a1,a2,a3,a4)), 5),
  "wiring:resize.moonsun": run_lib((a0,a1,a2) => run_loop($wiring_resize_moonsun(a0,a1,a2)), 3),
  "wiring:size.moonsun": run_lib((a0,a1) => run_loop($wiring_size_moonsun(a0,a1)), 2),
  "wiring:draw.moonsun": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_moonsun(a0,a1,a2,a3)), 4),
  "wiring:data.moonsun": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_data_moonsun(a0,a1,a2,a3,a4)), 5),
  "wiring:resize.solar": run_lib((a0,a1,a2) => run_loop($wiring_resize_solar(a0,a1,a2)), 3),
  "wiring:size.solar": run_lib((a0,a1) => run_loop($wiring_size_solar(a0,a1)), 2),
  "wiring:draw.solar": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_solar(a0,a1,a2,a3)), 4),
  "wiring:data.solar": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_data_solar(a0,a1,a2,a3,a4)), 5),
  "wiring:resize.status": run_lib((a0,a1,a2) => run_loop($wiring_resize_status(a0,a1,a2)), 3),
  "wiring:size.status": run_lib((a0,a1) => run_loop($wiring_size_status(a0,a1)), 2),
  "wiring:draw.status": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_status(a0,a1,a2,a3)), 4),
  "wiring:resize.raintitle": run_lib((a0,a1,a2) => run_loop($wiring_resize_raintitle(a0,a1,a2)), 3),
  "wiring:size.raintitle": run_lib((a0,a1) => run_loop($wiring_size_raintitle(a0,a1)), 2),
  "wiring:draw.raintitle": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_raintitle(a0,a1,a2,a3)), 4),
  "wiring:resize.rain1": run_lib((a0,a1,a2) => run_loop($wiring_resize_rain1(a0,a1,a2)), 3),
  "wiring:size.rain1": run_lib((a0,a1) => run_loop($wiring_size_rain1(a0,a1)), 2),
  "wiring:draw.rain1": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_rain1(a0,a1,a2,a3)), 4),
  "wiring:data.rain1": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_data_rain1(a0,a1,a2,a3,a4)), 5),
  "wiring:resize.rain2": run_lib((a0,a1,a2) => run_loop($wiring_resize_rain2(a0,a1,a2)), 3),
  "wiring:size.rain2": run_lib((a0,a1) => run_loop($wiring_size_rain2(a0,a1)), 2),
  "wiring:draw.rain2": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_rain2(a0,a1,a2,a3)), 4),
  "wiring:data.rain2": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_data_rain2(a0,a1,a2,a3,a4)), 5),
  "wiring:resize.rain3": run_lib((a0,a1,a2) => run_loop($wiring_resize_rain3(a0,a1,a2)), 3),
  "wiring:size.rain3": run_lib((a0,a1) => run_loop($wiring_size_rain3(a0,a1)), 2),
  "wiring:draw.rain3": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_rain3(a0,a1,a2,a3)), 4),
  "wiring:data.rain3": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_data_rain3(a0,a1,a2,a3,a4)), 5),
  "wiring:resize.uv": run_lib((a0,a1,a2) => run_loop($wiring_resize_uv(a0,a1,a2)), 3),
  "wiring:size.uv": run_lib((a0,a1) => run_loop($wiring_size_uv(a0,a1)), 2),
  "wiring:draw.uv": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_uv(a0,a1,a2,a3)), 4),
  "wiring:data.uv": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_data_uv(a0,a1,a2,a3,a4)), 5),
  "wiring:resize.winddir": run_lib((a0,a1,a2) => run_loop($wiring_resize_winddir(a0,a1,a2)), 3),
  "wiring:size.winddir": run_lib((a0,a1) => run_loop($wiring_size_winddir(a0,a1)), 2),
  "wiring:draw.winddir": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_winddir(a0,a1,a2,a3)), 4),
  "wiring:data.winddir": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_data_winddir(a0,a1,a2,a3,a4)), 5),
  "wiring:resize.windspeed": run_lib((a0,a1,a2) => run_loop($wiring_resize_windspeed(a0,a1,a2)), 3),
  "wiring:size.windspeed": run_lib((a0,a1) => run_loop($wiring_size_windspeed(a0,a1)), 2),
  "wiring:draw.windspeed": run_lib((a0,a1,a2,a3) => run_loop($wiring_draw_windspeed(a0,a1,a2,a3)), 4),
  "wiring:data.windspeed": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_data_windspeed(a0,a1,a2,a3,a4)), 5),
  "wiring:resize": run_lib((a0,a1,a2) => run_loop($wiring_resize(a0,str_in(a1),a2)), 3),
  "wiring:size": run_lib((a0,a1) => run_loop($wiring_size(a0,str_in(a1))), 2),
  "wiring:frame": run_lib((a0,a1,a2) => run_loop($wiring_frame(a0,a1,a2)), 3),
  "wiring:data": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_data(a0,a1,a2,a3,a4)), 5),
  "wiring:retip": run_lib((a0,a1) => run_loop($wiring_retip(a0,a1)), 2),
  "wiring:status": run_lib((a0,a1,a2,a3,a4) => run_loop($wiring_status(a0,a1,a2,a3,a4)), 5),
  "wiring:units": run_lib((a0,a1,a2,a3) => run_loop($wiring_units(a0,a1,str_in(a2),a3)), 4),
  "wiring:graphs_of": run_lib((a0) => run_loop($wiring_graphs_of(a0)), 1),
  "wiring:with_graphs": run_lib((a0,a1) => run_loop($wiring_with_graphs(a0,a1)), 2),
  "wiring:forecast_of": run_lib((a0) => run_loop($wiring_forecast_of(a0)), 1),
  "wiring:with_forecast": run_lib((a0,a1) => run_loop($wiring_with_forecast(a0,a1)), 2),
  "wiring:records_of": run_lib((a0) => run_loop($wiring_records_of(a0)), 1),
  "wiring:with_records": run_lib((a0,a1) => run_loop($wiring_with_records(a0,a1)), 2),
  "cat": run_lib((a0,a1) => run_loop($cat(a0,a1)), 2),
  "flags": run_lib((a0) => run_loop($flags(a0)), 1),
  "flag": run_lib((a0,a1) => run_loop($flag(a0,nat_in(a1))), 2),
  "set_flag": run_lib((a0,a1,a2) => run_loop($set_flag(a0,nat_in(a1),a2)), 3),
  "all": run_lib((a0) => run_loop($all(a0)), 1),
  "any": run_lib((a0) => run_loop($any(a0)), 1),
  "nth": run_lib((a0,a1) => str_out(run_loop($nth(a0,nat_in(a1)))), 2),
  "fields": run_lib((a0,a1) => run_loop($fields(a0,nat_in(a1))), 2),
  "defaults": run_lib(() => run_loop($defaults()), 0),
  "has_key": run_lib((a0,a1) => run_loop($has_key(str_in(a0),a1)), 2),
  "widget_of": run_lib((a0) => str_out(run_loop($widget_of(str_in(a0)))), 1),
  "accept": run_lib((a0,a1) => run_loop($accept(a0,a1)), 2),
  "rename": run_lib((a0) => run_loop($rename(a0)), 1),
  "merge": run_lib((a0,a1,a2) => run_loop($merge(a0,a1,a2)), 3),
  "setting": run_lib((a0,a1,a2) => str_out(run_loop($setting(str_in(a0),str_in(a1),a2))), 3),
  "base.strip": run_lib((a0) => str_out(run_loop($base_strip(str_in(a0)))), 1),
  "base.cut": run_lib((a0,a1) => str_out(run_loop($base_cut(a0,str_in(a1)))), 2),
  "base_url": run_lib((a0,a1) => str_out(run_loop($base_url(str_in(a0),str_in(a1)))), 2),
  "fetch_all": run_lib((a0) => run_loop($fetch_all(a0)), 1),
  "buttons": run_lib((a0) => run_loop($buttons(a0)), 1),
  "init_cmds": run_lib((a0,a1) => run_loop($init_cmds(a0,a1)), 2),
  "start_units": run_lib((a0) => run_loop($start_units(a0)), 1),
  "f_st": run_lib((a0) => run_loop($f_st(a0)), 1),
  "f_cmds": run_lib((a0) => run_loop($f_cmds(a0)), 1),
  "r_st": run_lib((a0) => run_loop($r_st(a0)), 1),
  "r_cmds": run_lib((a0) => run_loop($r_cmds(a0)), 1),
  "g_st": run_lib((a0) => run_loop($g_st(a0)), 1),
  "g_cmds": run_lib((a0) => run_loop($g_cmds(a0)), 1),
  "boot": run_lib((a0,a1,a2,a3,a4,a5,a6) => run_loop($boot(str_in(a0),str_in(a1),str_in(a2),str_in(a3),str_in(a4),str_in(a5),a6)), 7),
  "chart_defaults": run_lib(() => run_loop($chart_defaults()), 0),
  "g_ok": run_lib((a0) => run_loop($g_ok(a0)), 1),
  "canvases": run_lib((a0) => run_loop($canvases(a0)), 1),
  "viewport": run_lib((a0,a1,a2) => run_loop($viewport(a0,Math.fround(a1),Math.fround(a2))), 3),
  "measure": run_lib((a0,a1,a2) => run_loop($measure(a0,str_in(a1),a2)), 3),
  "frame": run_lib((a0,a1) => run_loop($frame(a0,a1)), 2),
  "with_fields": run_lib((a0,a1,a2) => run_loop($with_fields(a0,nat_in(a1),a2)), 3),
  "env_fields": run_lib((a0,a1) => run_loop($env_fields(a0,nat_in(a1))), 2),
  "with_clock": run_lib((a0,a1) => run_loop($with_clock(a0,a1)), 2),
  "file_index": run_lib((a0) => run_loop($file_index(str_in(a0))), 1),
  "start_fade": run_lib((a0) => run_loop($start_fade(a0)), 1),
  "update.events": run_lib((a0,a1,a2) => run_loop($update_events(a0,a1,a2)), 3),
  "update.ok": run_lib((a0,a1,a2,a3) => run_loop($update_ok(a0,a1,a2,a3)), 4),
  "update.run": run_lib((a0,a1) => run_loop($update_run(a0,a1)), 2),
  "update.go": run_lib((a0,a1,a2) => run_loop($update_go(a0,a1,a2)), 3),
  "try_update": run_lib((a0,a1) => run_loop($try_update(a0,a1)), 2),
  "fetched": run_lib((a0,a1,a2,a3,a4,a5) => run_loop($fetched(a0,str_in(a1),a2,str_in(a3),a4,a5)), 6),
  "failed_of": run_lib((a0) => run_loop($failed_of(a0)), 1),
  "message_of": run_lib((a0) => str_out(run_loop($message_of(a0))), 1),
  "timer.poll": run_lib((a0) => run_loop($timer_poll(a0)), 1),
  "before_dot": run_lib((a0) => str_out(run_loop($before_dot(str_in(a0)))), 1),
  "stem": run_lib((a0) => str_out(run_loop($stem(str_in(a0)))), 1),
  "add_dots": run_lib((a0,a1) => run_loop($add_dots(a0,a1)), 2),
  "timer.dots": run_lib((a0) => run_loop($timer_dots(a0)), 1),
  "fade_step": run_lib((a0) => run_loop($fade_step(a0)), 1),
  "fade_cmds": run_lib((a0) => run_loop($fade_cmds(a0)), 1),
  "timer.fade": run_lib((a0) => run_loop($timer_fade(a0)), 1),
  "timer.screen": run_lib((a0,a1) => run_loop($timer_screen(a0,a1)), 2),
  "timer.go": run_lib((a0,a1,a2) => run_loop($timer_go(a0,a1,a2)), 3),
  "timer": run_lib((a0,a1,a2,a3) => run_loop($timer(a0,str_in(a1),a2,a3)), 4),
  "markup": run_lib((a0) => str_out(run_loop($markup(str_in(a0)))), 1),
  "button_kind": run_lib((a0) => str_out(run_loop($button_kind(str_in(a0)))), 1),
  "measure_of": run_lib((a0) => run_loop($measure_of(str_in(a0))), 1),
  "with_units": run_lib((a0,a1) => run_loop($with_units(a0,a1)), 2),
  "change_unit": run_lib((a0,a1,a2) => run_loop($change_unit(a0,str_in(a1),a2)), 3),
  "click.unit": run_lib((a0,a1,a2,a3) => run_loop($click_unit(a0,a1,str_in(a2),a3)), 4),
  "click.graphs": run_lib((a0,a1) => run_loop($click_graphs(a0,str_in(a1))), 2),
  "click.modals": run_lib((a0,a1,a2,a3) => run_loop($click_modals(a0,str_in(a1),Math.fround(a2),Math.fround(a3))), 4),
  "click": run_lib((a0,a1,a2,a3,a4) => run_loop($click(a0,str_in(a1),a2,Math.fround(a3),Math.fround(a4))), 5),
  "select": run_lib((a0,a1,a2) => run_loop($select(a0,str_in(a1),str_in(a2))), 3),
};
