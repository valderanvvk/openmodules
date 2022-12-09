function HD44780(e) { return e(51, 1), e(50, 1), e(40, 1), e(12, 1), e(6, 1), e(1, 1), { write: e, clear: function () { e(1, 1) }, print: function (t) { for (var i = 0; i < t.length; i++)e(t.charCodeAt(i)) }, cursor: function (t) { e(t ? 15 : 14, 1) }, setCursor: function (t, i) { e(128 | [0, 64, 20, 84][i] + t, 1) }, createChar: function (t, i) { e(64 | (7 & t) << 3, 1); for (var r = 0; r < 8; r++)e(i[r]); e(128, 1) } } } HD44780_connectI2C = function (e, n) { return new HD44780(function (t, i) { var r = 240 & t | 8 | (void 0 === i ? 1 : 0), t = t << 4 & 240 | 8 | (void 0 === i ? 1 : 0); e.writeTo(n || 39, [r, r, 4 | r, 4 | r, r, r, t, t, 4 | t, 4 | t, t, t]) }) }, HD44780_connect = function (r, e, t, i, n, o) { var s = [o, n, i, t], h = digitalWrite; return h(r, 1), h([r, e], 0), new HD44780(function (t, i) { h(r, !i), h(s, t >> 4), h(e, 1), h(e, 0), h(s, t), h(e, 1), h(e, 0) }) }; const bignumber = function (o) { var s = ["415 431151153 3311411115415415", "3 3  3223223323315315  3323723", "3 3  33    3  3  33 3  33 3  3", "726  3322226  3226726  3726226"]; return o.createChar(1, [31, 31, 31, 31, 0, 0, 0, 0]), o.createChar(2, [0, 0, 0, 0, 0, 31, 31, 31, 31]), o.createChar(3, [31, 31, 31, 31, 31, 31, 31, 31]), o.createChar(4, [1, 3, 7, 15, 31, 31, 31, 31]), o.createChar(5, [16, 24, 28, 30, 31, 31, 31, 31]), o.createChar(6, [31, 31, 31, 31, 30, 28, 24, 16]), o.createChar(7, [31, 31, 31, 31, 15, 7, 3, 1]), { showDigit: function (t, i) { for (var r = 0; r < 4; r++) { o.setCursor(t, r); for (var e = 0; e < 3; e++) { var n = s[r].charAt(3 * i + e); o.write(" " == n ? 32 : parseInt(n, 10)) } } }, showNumber: function (t) { o.clear(), this.showDigit(17, t % 10), 9 < t && this.showDigit(14, t / 10 % 10), 99 < t && this.showDigit(11, t / 100 % 10), 999 < t && this.showDigit(8, t / 1e3 % 10), 9999 < t && this.showDigit(5, t / 1e4 % 10) } } }; function _HD44780() { this.lcd = void 0, this.bignumber = void 0, this.connectionType = void 0, this.addr = void 0, this.range = { row: 4, col: 20 }, this.position = "l" } _HD44780.prototype.init = function (t) { return this.range.row = (t && void 0 !== t.row ? t : this.range).row, this.range.col = (t && void 0 !== t.col ? t : this.range).col, this.position = (t && void 0 !== t.position ? t : this).position, this._clearstr = new Array(this.range.col).fill(" ").join(""), this }, _HD44780.prototype.pinConnect = function (t) { var i = { PIN_RS: P8, PIN_EN: P9, PIN_DB4: P10, PIN_DB5: P11, PIN_DB6: P12, PIN_DB7: P13 }, i = Object.assign({}, i); return "object" == typeof t && (Array.isArray(t) && 6 <= t.length ? (i.PIN_RS = t[0], i.PIN_EN = t[1], i.PIN_DB4 = t[2], i.PIN_DB5 = t[3], i.PIN_DB6 = t[4], i.PIN_DB7 = t[5]) : (i.PIN_RS = t.RS || i.PIN_RS, i.PIN_EN = t.EN || i.PIN_EN, i.PIN_DB4 = t.DB4 || i.PIN_DB4, i.PIN_DB5 = t.DB5 || i.PIN_DB5, i.PIN_DB6 = t.DB6 || i.PIN_DB6, i.PIN_DB7 = t.DB7 || i.PIN_DB7)), this.lcd = HD44780_connect(i.PIN_RS, i.PIN_EN, i.PIN_DB4, i.PIN_DB5, i.PIN_DB6, i.PIN_DB7), this.write = this.lcd.write, this.connectionType = "pin", this }, _HD44780.prototype.i2cConnect = function (t, i) { return this.addr = i || 56, this.lcd = HD44780_connectI2C(t, this.addr), this.write = this.lcd.write, this.connectionType = "i2c", this }, _HD44780.prototype.bigNumberInit = function () { return !this.bignumber && this.lcd && 20 == this.range.col && 4 == this.range.row && (this.bignumber = bignumber(this.lcd)), this }, _HD44780.prototype.light = function (t) { return this.addr && (t ? PrimaryI2C.writeTo(this.addr, 8) : PrimaryI2C.writeTo(this.addr, 0)), this }, _HD44780.prototype.lightOn = function () { return this.light(!0), this }, _HD44780.prototype.lightOff = function () { return this.light(), this }, _HD44780.prototype.createChar = function (t, i) { return this.lcd.createChar(t, i), this }, _HD44780.prototype.cursor = function (t) { return this.lcd.cursor(t), this }, _HD44780.prototype.setCursor = function (t, i) { return this.lcd.setCursor(t, i), this }, _HD44780.prototype.print = function (t) { return this.lcd.print(t), this }, _HD44780.prototype.clear = function () { return this.lcd.clear(), this }, _HD44780.prototype.bigNumberShowDigit = function (t, i) { return this.bignumber && this.bignumber.showDigit(t, i), this }, _HD44780.prototype.length = function (t, i) { t = t.split(""); let r = t.length; return r = i ? t.length > this.range.col ? this.range.col : t.length : r }, _HD44780.prototype.prepare = function (t, i) { let r = t.split(""); return (r = r.length > this.range.col ? r.slice(0, i || this.range.col) : r).join("") }, _HD44780.prototype.setCursorLineDefault = function (t, i) { switch (i || this.position) { case "r": this.setCursor(this.range.col - 1, t); break; case "c": this.setCursor(this.range.col / 2 - 1, t); break; default: this.setCursor(0, t) }return this }, _HD44780.prototype.setPositionLeft = function (t) { return this.position = "l", t ? this.setCursorLineDefault(t) : this }, _HD44780.prototype.setPositionRight = function (t) { return this.position = "r", t ? this.setCursorLineDefault(t) : this }, _HD44780.prototype.setPositionCenter = function (t) { return this.position = "c", t ? this.setCursorLineDefault(t) : this }, _HD44780.prototype.clearL = function (t) { return this.setCursor(0, t), this.print(this._clearstr), this.setCursorLineDefault(t) }, _HD44780.prototype.printL = function (t, i, r) { switch (r ? this.clearL(t) : this.setCursorLineDefault(t), this.position) { case "r": 1 < this.length(i) ? (this.setCursor(this.range.col - this.length(i, !0), t), this.print(this.prepare(i))) : this.print(i); break; case "c": var e; 1 < this.length(i) ? (e = Math.ceil(this.range.col / 2 - this.length(i, !0) / 2), console.log("startX: ", e), this.setCursor(e, t), this.print(this.prepare(i))) : (this.setPositionCenter(t), this.print(i)); break; default: this.print(i) }return this }, _HD44780.prototype.clearB = function (t, i, r) { r = new Array(r).fill(" ").join(""); return this.setCursor(i, t), this.print(r), this }, _HD44780.prototype.printB = function (t, i, r, e, n) { const r = this.prepare(r, n); return e && this.clearB(t, i, this.length(r)), this.setCursor(i, t), this.print(r), this };