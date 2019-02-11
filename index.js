/******************************************************************************
 * Copyright (c) 2019 Robert Nilsson (robert.nilsson@callclue.com)            *
 * All rights reserved.                                                       *
 *                                                                            *
 * This source code is licensed under the MIT license found in the README.md  *
 * file in the root directory of this source tree.                            *
 *****************************************************************************/
const sprintf = require('./sprintf.js');

class HD44780
  {
    // --- Virtual functions that must be overridden --------------------------
    async pin_enable(state) { throw Error('Virtual function'); }
    async pin_backlight(state) { throw Error('Virtual function'); }
    async port_raw_write(rs, data) { throw Error('Virtual function'); }
    async port_raw_read(rs) { throw Error('Virtual function'); }
    // ------------------------------------------------------------------------
    constructor(arg)
      {
        this.interface_width = arg.interface_width;
        if ( !( this.interface_width === 4 || this.interface_width === 8 ))
          throw Error(`Unknown interface_width: ${this.interface_width}`);

        this.addressCounter = null;

        this.dim = 
          {
            rows : 2,
            columns : 40
          }
        this.state =
          {
            function_set :
              {
                datalink8bit : true,
                multiline : false,
                font5x10 : false
              },
            display_control:
              { 
                display : false,
                cursor : false,
                blink : false
              },
            entry_mode:
              {
                leftOrRight : true,
                cursorOrDisplay : false
              }
          }
      }
    microsleep(µs)
      {
        if (!µs) return;
        return new Promise(
          (resolve, reject) => setTimeout( resolve, Math.ceil( µs / 1000 ) )
        )
      }
    async busy_wait()
      {
        let value, waited;
        const ts = Date.now();
        do {
          waited = (Date.now() - ts) * 1000;
          if ( waited > this.delay.MAX_WAIT_µs )
            throw Error('Timeout!');
          value = await this.port_cooked_read(false);
          this.addressCounter = value &0x7f;
        } while ( (value & 0x80) );
      }
    async pin_enable_pulse()
      {
        await this.pin_enable(true);
        await this.microsleep(this.delay.PULSE_µs);
        await this.pin_enable(false);
        await this.microsleep(this.delay.PULSE_µs);
      }
    async port_cooked_write(rs, data)
      {
        if ( this.interface_width === 4)
          {
            await this.port_raw_write(rs, (data & 0xf0));
            await this.port_raw_write(rs, (data & 0x0f) << 4);
          }
        else
          {
            await this.port_raw_write(rs, data);
          }
        await this.busy_wait();
      }
    async port_cooked_read(rs)
      {
        let value = null;
        if ( this.interface_width === 4)
          {
            value = 
              (await this.port_raw_read(rs) & 0xf0) +
              (await this.port_raw_read(rs) >> 4 );
          }
        else
          {
            value = await this.port_raw_read(rs);
          }
        return value;
      }
    async send_command( command )
      {
        await this.port_cooked_write(false, command );
      }
    async set_function(datalink8bit, multiline, font5x10)
      {
        const
          length = arguments.length,
          state = this.state.function_set,
          bit = this.function_set;
        if (length > 0) state.datalink8bit = datalink8bit && true;
        if (length > 1) state.multiline = multiline && true;
        if (length > 2) state.font5x10 = font5x10 && true;

        const value =
          (state.datalink8bit << bit.datalink8bit) |
          (state.multiline << bit.multiline) |
          (state.font5x10 << bit.font5x10);

        await this.send_command( this.command.FUNCTIONSET | value );
      }
    async backlight(state)
      {
        await this.pin_backlight(state);
      }
    async set_display_control(display, cursor, blink)
      {
        const
          length = arguments.length,
          state = this.state.display_control,
          bit = this.display_control;

        if (length > 0) state.display = display && true;
        if (length > 1) state.cursor = cursor && true;
        if (length > 2) state.blink = blink && true;

        const value =
          (state.display << bit.display) |
          (state.cursor << bit.cursor) |
          (state.blink << bit.blink);
        await this.send_command( this.command.DISPLAYCONTROL | value );
      }
    async display_visible(state)
      {
        this.state.display_control.display = state && true;
        await this.set_display_control();
      }
    async cursor_blink(state)
      {
        this.state.display_control.blink = state && true;
        await this.set_display_control();
      }
    async cursor_visible(state)
      {
        this.state.display_control.cursor = state && true;
        await this.set_display_control();
      }
    async set_entry_mode(leftOrRight, cursorOrDisplay)
      {
        const
          length = arguments.length,
          state = this.state.entry_mode,
          bit = this.entry_mode;

        if (length > 0) state.leftOrRight = leftOrRight && true;
        if (length > 1) state.cursorOrDisplay = cursorOrDisplay && true;
        
        const value =
          (state.leftOrRight << bit.leftOrRight) |
          (state.cursorOrDisplay << bit.cursorOrDisplay);
        await this.send_command( this.command.ENTRYMODESET | value );
      }
    async set_move(displayOrCursor, leftOrRight)
      {
        const 
          bit = this.move;
        let value =
          ((displayOrCursor && true) <<  bit.displayOrCursor) |
          ((leftOrRight && true ) << bit.leftOrRight);
        await this.send_command( this.command.CURSORSHIFT | value );
      }
    async cursor_move( moveRightOrLeft )
      {
        await this.set_move( false, moveRightOrLeft );
      }
    async display_shift( moveRightOrLeft )
      {
        await this.set_move( true, moveRightOrLeft );
      }
    async display_shift_left()
      {
        await this.set_move( true, false );
      }
    async display_shift_right()
      {
        await this.set_move( true, true );
      }
    async display_clear()
      {
        await this.send_command( this.command.CLEARDISPLAY );
      }
    async display_home()
      {
        await this.send_command( this.command.RETURNHOME );
      }
    async bell()
      {
        // Can be overriden for bell function
      }
    async write(text,...args)
      {
        let shift_mode = 0;
        if ( args ) text = this.sprintf(text, ...args);
        for(let idx = 0, len = text.length; idx < len; idx+=1)
          {
            let xy;
            let charCode = text.charCodeAt(idx);
            switch (charCode)
              {
                case 0x07:
                  await this.bell();
                  continue;
                case 0x08: // DEL
                  await this.cursor_move( !this.state.entry_mode.leftOrRight )
                  continue;
                case 0x0A: // New Line
                  xy = this.calc_xy( this.addressCounter );
                  await this.set_address_xy(0, (xy.y + 1) % this.dim.rows);
                  continue;
                case 0x0C: // Form feed
                  await this.display_clear();
                  continue;
                case 0x0D: // CR
                  xy = this.calc_xy( this.addressCounter );
                  await this.set_address_xy( 0, xy.y );
                  continue;
                case 0x0E:// SHIFT OUT normal, using custom
                  shift_mode = 1;
                  continue;
                case 0x0F:// SHIFT IN ormal, using normal
                  shift_mode = 0;
                  continue;
              }
            if ( charCode < 0x20 ) continue;

            if ( shift_mode === 1)
              {
                // if shift_mode, use custom character set
                if (charCode >= 0x30 && charCode <= 0x37)
                  charCode = charCode - 0x30;
                else continue;
              }

            await this.port_cooked_write(true, charCode & 0xff );
          }
      }
    async write_xy(x,y,text,...args)
      {
        await this.set_address_xy( x, y );
        await this.write(text,...args);
      }
    calc_address(x, y)
      {
        return (
          Math.max(0, Math.min(x, this.dim.columns) ) +
          Math.max(0, Math.min(y, this.dim.rows) ) * this.dim.columns
        );
      }
    calc_xy(addr)
      {
        addr = Math.max(0, Math.min( Math.floor(addr) || 0, 0));
        return {
          x : addr % this.dim.columns,
          y : Math.min( Math.floor( addr / this.dim.columns ), this.dim.rows )
        };
      }
    async set_address(addr)
      {
        await this.send_command( this.command.SETDDRAMADDR | (addr & 0x7f ) );
      }
    async set_address_xy(x,y)
      {
        await this.set_address( this.calc_address(x, y) );
      }
    async store_custom_bitmap( pos, bitmap )
      {
        if ( ( pos & 7 ) !== pos )
          throw Error('pos should be a number between 0 to 7');
        if (!Array.isArray(bitmap))
          throw TypeError('bitmap should be an array');
        if ( !(bitmap.length === 8 || bitmap.length === 10))
          throw RangeError('bitmap shuld have 8 or 10 elements');
        for(const item of bitmap) {
          if ( ( item & 0xff ) !== item )
            throw Error('bitmap elements should be number between 0 to 255');
        }
        const cgramaddr = pos * (
          this.state.function_set.font5x10 ? 10 : 8
        )
        await this.send_command( this.command.SETCGRAMADDR | cgramaddr );
        for(const item of bitmap) {
          await this.port_cooked_write(true, item );
        }
      }
    async init()
      {
        const
          fs = this.function_set,
          em = this.entry;
        const
          if8bit = this.command.FUNCTIONSET | ( 1 << fs.datalink8bit),
          if4bit = this.command.FUNCTIONSET;

        await this.microsleep( this.delay.SETUP_0_µs );
        await this.port_raw_write( false, if8bit );
        await this.microsleep( this.delay.SETUP_1_µs );
        await this.port_raw_write( false, if8bit );
        await this.microsleep( this.delay.SETUP_2_µs );
        await this.port_raw_write( false, if8bit );
        await this.microsleep( this.delay.SETUP_2_µs );

        if ( this.interface_width === 4)
          {
            await this.port_raw_write( false, if4bit );
            await this.set_function( false, true, false )
          }
        else
          {
            await this.set_function( true, true, false );
          }
        await this.set_display_control(false,false,false);
        await this.display_clear();
        await this.set_entry_mode(true,false);
        await this.set_display_control(true, false, false);
      }
  }
Object.assign(
  HD44780.prototype,
  {
    sprintf : sprintf,
    delay:
      {
        PULSE_µs        :     0, // 450 ns
        SETUP_0_µs      : 15000,
        SETUP_1_µs      :  4100,
        SETUP_2_µs      :   100,
        MAX_WAIT_µs     : 25000
      },
    function_set:
      {
        datalink8bit    : 4,
        multiline       : 3,
        font5x10          : 2
      },
    command:
      {
        CLEARDISPLAY    : 0x01,
        RETURNHOME      : 0x02,
        ENTRYMODESET    : 0x04,
        DISPLAYCONTROL  : 0x08,
        CURSORSHIFT     : 0x10,
        FUNCTIONSET     : 0x20,
        SETCGRAMADDR    : 0x40,
        SETDDRAMADDR    : 0x80,
      },
    entry_mode:
      {
        leftOrRight     : 1,
        cursorOrDisplay : 0
      },
    display_control:
      {
        display         : 2,
        cursor          : 1,
        blink           : 0
      },
    move:
      {
        displayOrCursor : 3,
        leftOrRight     : 2
      }
  }
);

module.exports = HD44780;
