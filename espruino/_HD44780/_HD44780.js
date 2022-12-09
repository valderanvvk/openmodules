
/* 
		*Copyright (c) 2013 Gordon Williams
		http://www.espruino.com/modules/HD44780.js
		Module for the HD44780 controller in text-based LCDs (pretty much all 16x2 and 20x4 LCDs)
**/
function HD44780(write) {
	// initialise
	write(0x33, 1);
	write(0x32, 1);
	write(0x28, 1);
	write(0x0C, 1);
	write(0x06, 1);
	write(0x01, 1);
	// add functions
	return {
		write: write,
		// clear screen
		clear: function () { write(0x01, 1); },
		// print text
		print: function (str) {
			for (var i = 0; i < str.length; i++)
				write(str.charCodeAt(i));
		},
		// flashing block for the current cursor, or underline
		cursor: function (block) { write(block ? 0x0F : 0x0E, 1); },
		// set cursor pos, top left = 0,0
		setCursor: function (x, y) { var l = [0x00, 0x40, 0x14, 0x54]; write(0x80 | (l[y] + x), 1); },
		// set special character 0..7, data is an array(8) of bytes, and then return to home addr
		createChar: function (ch, data) {
			write(0x40 | ((ch & 7) << 3), 1);
			for (var i = 0; i < 8; i++) write(data[i]);
			write(0x80, 1);
		}
	};
};

HD44780_connectI2C = function (/*=I2C*/i2c, _addr) {
	return new HD44780(function (x, c) {
		var a = (x & 0xF0) | 8 | ((c === undefined) ? 1 : 0);
		var b = ((x << 4) & 0xF0) | 8 | ((c === undefined) ? 1 : 0);
		i2c.writeTo(_addr || 0x27, [a, a, a | 4, a | 4, a, a, b, b, b | 4, b | 4, b, b]);
	});
};

HD44780_connect = function (/*=PIN*/rs,/*=PIN*/en,/*=PIN*/_d4,/*=PIN*/_d5,/*=PIN*/_d6,/*=PIN*/_d7) {
	var data = [_d7, _d6, _d5, _d4];
	var d = digitalWrite;
	d(rs, 1);
	d([rs, en], 0);
	return new HD44780(function (x, c) {
		d(rs, !c);
		d(data, x >> 4);
		d(en, 1);
		d(en, 0);
		d(data, x);
		d(en, 1);
		d(en, 0);
	});
};

const bignumber = function (lcd) {
	var bigChars =
		["415 431151153 3311411115415415",
			"3 3  3223223323315315  3323723",
			"3 3  33    3  3  33 3  33 3  3",
			"726  3322226  3226726  3726226"];
	// create the chars
	lcd.createChar(1, [31, 31, 31, 31, 0, 0, 0, 0]);
	lcd.createChar(2, [0, 0, 0, 0, 0, 31, 31, 31, 31]);
	lcd.createChar(3, [31, 31, 31, 31, 31, 31, 31, 31]);
	lcd.createChar(4, [1, 3, 7, 15, 31, 31, 31, 31]);
	lcd.createChar(5, [16, 24, 28, 30, 31, 31, 31, 31]);
	lcd.createChar(6, [31, 31, 31, 31, 30, 28, 24, 16]);
	lcd.createChar(7, [31, 31, 31, 31, 15, 7, 3, 1]);
	return {
		// write a big number num at column number x
		showDigit: function (x, num) {
			for (var y = 0; y < 4; y++) {
				lcd.setCursor(x, y);
				for (var n = 0; n < 3; n++) {
					var c = bigChars[y].charAt(num * 3 + n);
					lcd.write(c == " " ? 32 : parseInt(c, 10));
				}
			}
		},
		// write the given 5 digit decimal on the LCD screen
		showNumber: function (num) {
			lcd.clear(); this.showDigit(17, num % 10);
			if (num > 9) this.showDigit(14, (num / 10) % 10);
			if (num > 99) this.showDigit(11, (num / 100) % 10);
			if (num > 999) this.showDigit(8, (num / 1000) % 10);
			if (num > 9999) this.showDigit(5, (num / 10000) % 10);
		}
	};
};

/* 
	* Copyright (c) 2022 Vladimir Kundryukov
	* Expanding the functionality of the library HD44780
**/
function _HD44780() {
	// HD44780 base object
	this.lcd = undefined;
	this.bignumber = undefined;

	// 'pin' | 'i2c'
	this.connectionType = undefined;

	// i2C Addr
	this.addr = undefined;

	// display type row - lines, col - count of symbols
	// default 20x4
	this.range = { row: 4, col: 20 };

	// side for printing 'l' | 'r' | 'c' (left | right | center)
	this.position = 'l';

};

// init base configuration
_HD44780.prototype.init = function (opt) {
	this.range.row = (opt && opt.row !== undefined) ? opt.row : this.range.row;
	this.range.col = (opt && opt.col !== undefined) ? opt.col : this.range.col;
	this.position = (opt && opt.position !== undefined) ? opt.position : this.position;
	this._clearstr = new Array(this.range.col).fill(' ').join('');
	return this;
};

/* 
	Pin type connection.
	the type of the parameter is array and object
		Array: [P8, P9, P10, P11, P12, P13];
		Object: { PIN_RS: P8, PIN_EN: P9, PIN_DB4: P10, PIN_DB5: P11, PIN_DB6: P12, PIN_DB7: P13 };

	default connection PINS: 
		PIN_RS: P8, 
		PIN_EN: P9, 
		PIN_DB4: P10, 
		PIN_DB5: P11, 
		PIN_DB6: P12, 
		PIN_DB7: P13
**/
_HD44780.prototype.pinConnect = function (options) {
	const baseConfig = { PIN_RS: P8, PIN_EN: P9, PIN_DB4: P10, PIN_DB5: P11, PIN_DB6: P12, PIN_DB7: P13 };
	const init = Object.assign({}, baseConfig);
	if (typeof options == 'object') {
		if (Array.isArray(options) && options.length >= 6) {
			init.PIN_RS = options[0];
			init.PIN_EN = options[1];
			init.PIN_DB4 = options[2];
			init.PIN_DB5 = options[3];
			init.PIN_DB6 = options[4];
			init.PIN_DB7 = options[5];
		} else {
			init.PIN_RS = options.RS ? options.RS : init.PIN_RS;
			init.PIN_EN = options.EN ? options.EN : init.PIN_EN;
			init.PIN_DB4 = options.DB4 ? options.DB4 : init.PIN_DB4;
			init.PIN_DB5 = options.DB5 ? options.DB5 : init.PIN_DB5;
			init.PIN_DB6 = options.DB6 ? options.DB6 : init.PIN_DB6;
			init.PIN_DB7 = options.DB7 ? options.DB7 : init.PIN_DB7;
		}
	}
	this.lcd = HD44780_connect(init.PIN_RS, init.PIN_EN, init.PIN_DB4, init.PIN_DB5, init.PIN_DB6, init.PIN_DB7);
	this.write = this.lcd.write;
	this.connectionType = 'pin';
	return this;
};

// I2C type connection
// PrimaryI2C.setup({ sda: SDA, scl: SCL })
// 0x38
_HD44780.prototype.i2cConnect = function (_i2c, _addr) {
	this.addr = _addr ? _addr : 0x38;
	this.lcd = HD44780_connectI2C(_i2c, this.addr);
	this.write = this.lcd.write;
	this.connectionType = 'i2c';
	return this;
};

// Init BigNumber support work only 20x4 displays
// initialize only after i2cConnect or pinConnect
_HD44780.prototype.bigNumberInit = function () {
	if (!this.bignumber && this.lcd) {
		if (this.range.col == 20 && this.range.row == 4) {
			this.bignumber = bignumber(this.lcd);
		}
	}
	return this;
};

// screen backlight for i2c
_HD44780.prototype.light = function (status) {
	if (this.addr) {
		if (status) {
			PrimaryI2C.writeTo(this.addr, 0x08);
		} else {
			PrimaryI2C.writeTo(this.addr, 0x00);
		}
	}
	return this;
};

// Turn ON the screen backlight for i2c
_HD44780.prototype.lightOn = function () {
	this.light(true);
	return this;
};

// Turn OFF the screen backlight for i2c
_HD44780.prototype.lightOff = function () {
	this.light();
	return this;
};

// ************ Basic Functionality

// set special character 0..7, data is an array(8) of bytes, and then return to home addr
_HD44780.prototype.createChar = function (ch, data) {
	this.lcd.createChar(ch, data);
	return this;
};

// Flashing block for the current cursor, or underline
_HD44780.prototype.cursor = function (block) {
	this.lcd.cursor(block);
	return this;
};

// Setting the cursor to the specified value
_HD44780.prototype.setCursor = function (x, y) {
	this.lcd.setCursor(x, y);
	return this;
};

// Printing text to the cursor-set location
_HD44780.prototype.print = function (str) {
	this.lcd.print(str);
	return this;
};

// Clear screen
_HD44780.prototype.clear = function () {
	this.lcd.clear();
	return this;
};

// ************ Advanced Functionality

_HD44780.prototype.bigNumberShowDigit = function (startx, num) {
	if (this.bignumber) {
		this.bignumber.showDigit(startx, num);
	}
	return this;
};

_HD44780.prototype.length = function (text, trim) {
	const data = text.split('');
	let result = data.length;
	if (trim) {
		result = data.length > this.range.col ? this.range.col : data.length;
	}
	return result;
};

_HD44780.prototype.prepare = function (text, maxcount) {
	let data = text.split('');
	data = data.length > this.range.col ? data.slice(0, maxcount ? maxcount : this.range.col) : data;
	return data.join('');
};

// side for printing 'l' | 'r' | 'c' (left | right | center)
_HD44780.prototype.setCursorLineDefault = function (line, _position) {
	const position = _position ? _position : this.position;
	switch (position) {
		case 'r':
			this.setCursor(this.range.col - 1, line);
			break;

		case 'c':
			this.setCursor((this.range.col / 2) - 1, line);
			break;

		default:
			this.setCursor(0, line);
			break;
	}
	return this;
};

_HD44780.prototype.setPositionLeft = function (line) {
	this.position = 'l';
	return line ? this.setCursorLineDefault(line) : this;
};

_HD44780.prototype.setPositionRight = function (line) {
	this.position = 'r';
	return line ? this.setCursorLineDefault(line) : this;
};

_HD44780.prototype.setPositionCenter = function (line) {
	this.position = 'c';
	return line ? this.setCursorLineDefault(line) : this;
};

_HD44780.prototype.clearL = function (line) {
	this.setCursor(0, line);
	this.print(this._clearstr);
	return this.setCursorLineDefault(line);
};

_HD44780.prototype.printL = function (line, text, clear) {
	if (clear) {
		this.clearL(line);
	} else {
		this.setCursorLineDefault(line)
	}
	switch (this.position) {
		case 'r':
			if (this.length(text) > 1) {
				this.setCursor(this.range.col - this.length(text, true), line);
				this.print(this.prepare(text));
			} else {
				this.print(text)
			}
			break;

		case 'c':
			if (this.length(text) > 1) {
				let startX = Math.ceil((this.range.col / 2) - (this.length(text, true) / 2));
				console.log('startX: ', startX);
				this.setCursor(startX, line);
				this.print(this.prepare(text));
			} else {
				this.setPositionCenter(line);
				this.print(text);
			}
			break;

		default:
			this.print(text);
			break;
	}
	return this;
};

_HD44780.prototype.clearB = function (line, startx, length) {
	const clearBlock = new Array(length).fill(' ').join('');
	this.setCursor(startx, line);
	this.print(clearBlock);
	return this;
};

_HD44780.prototype.printB = function (line, startx, text, clear, maxcount) {
	const text = this.prepare(text, maxcount);
	if (clear) this.clearB(line, startx, this.length(text));
	this.setCursor(startx, line);
	this.print(text);
	return this;
};

exports._HD44780 = new _HD44780();
