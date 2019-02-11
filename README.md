# HD44780

This is a generic HD44780 driver for node. It knows the "language" of the
display, but you have to provide the functions that communicates with the
hardware. Both 8 and 4 bit interfaces are supported.

Both read and write operations are requied. It reads the BUSY flag and
address-counter from the display.

## Hardware access funtions
You have to provide the functions that communicates with the hardware.

* **async pin_enable(state)**

  This function should set the ENABLE line to high if sate is true, and
  to low if it is false.

* **async port_raw_write(rs, data)**

  This function should
  - set the hardware to OUTPUT D0-D7 (D4-D7 in 4-bit-mode)
  - set the R/W pin to WRITE (LOW)
  - set the RS pin to HIGH or LOW according to rs variable
  - output data to data-pins. (in 4-bit-mode data is in D4-D7)

* **async port_raw_read(rs)**

  This function should
  - set the hardware to INPUT D0-D7 (D4-D7 in 4-bit-mode)
  - set the R/W pin to READ (HIGH)
  - set the RS pin to HIGH or LOW according to rs variable
  - read data from data-pins. (in 4-bit-mode data is in D4-D7)
  - 

High level functions
====================

## async write(text,...args)
 
Write text to display memory from current position.

A sprintf-like behaviour is supported:

**%(flags)(width)(.precision)(specifier)**

**flags**

* "-" Left-justify
* "+" Always add sign
* "0" Left-pads a number with 0 instead of spaces.

**width**

Minimum number of characters to be printed.

**precision**

* For b, d, o, x and X this specifies the minimum number of digits
to be written. Will be zero-padded if shorter.

* For f this is the number of digits to be printed after the decimal
point.

* For s this is the maximum number of characters to be printed.

**specifier**

* % Prints a % character
* d Print number as decimal
* f Print number as float
* o Print number as octal
* s Print string
* x Print number as hex (lower case)
* X Print number as HEX (upper case)

**Supported control-characters**

| Character  |    | Description   |
| ----------| --- |-------------|
| **0x07** | BEL  | Calls the bell function. By default it doses not do anything, but you can override it. |
| **0x08** |  DEL | Moves cursor back one step and replaces the character there with a space. | 
| **0x0A** |  NEW LINE | Moves cursor to the next line. If it is at the bottom line, it moves to the first line. |
| **0x0C** | FROM FEED | Clears the display.|
| **0x0D** | CARRIAGE RETURN | Moves the cursor to the start of the current line.| 
| **0x0E** | SHIFT OUT | Shifts out the normal characters and allow you to use the custom chacters. The custom characters are mapped from 0x30 - 0x37 (digits 0 - 7). Example: "\0x0E0" | 
| **0x0F** | SHIFT IN | Shift in the normal characters.| 

## async write_xy(x,y,text,...args)

Almost the same as write, but sets the position before writing.

## async set_display_control(display, cursor, blink)
## async display_visible(state)
## async cursor_blink(state)
## async cursor_visible(state)
## async set_entry_mode(leftOrRight, cursorOrDisplay)
## async set_move(displayOrCursor, leftOrRight)
## async cursor_move( moveRightOrLeft )
## masync display_shift( moveRightOrLeft )
## async display_shift_left()
## async display_shift_right()
## async display_clear()
## async display_home()
## async bell()


## async set_address(addr)
## async set_address_xy(x,y)
## async store_custom_bitmap( pos, bitmap )

Low level functions
===================

## microsleep(µs)
## async busy_wait()
## async pin_enable_pulse()
## sync port_cooked_write(rs, data)
## async port_cooked_read(rs)
## async send_command( command )
## async set_function(datalink8bit, multiline, font5x10)
## async init()
## calc_address(x, y)
## calc_xy(addr)








