/******************************************************************************
 * Copyright (c) 2019 Robert Nilsson (robert.nilsson@callclue.com)            *
 * All rights reserved.                                                       *
 *                                                                            *
 * This source code is licensed under the MIT license found in the README.md  *
 * file in the root directory of this source tree.                            *
 *****************************************************************************/
/******************************************************************************
 * Minimal sprintf, modeled after c sprintf
 *
 * Written by Robert.Nilsson@callclue.com 2019
 *
 * %<flags><width><.precision><specifier>
 *
 * <flags>
 *
 *   -     Left-justify within the given field width. (default is right)
 *
 *   +     Always add sign, even for positive numbers. By default a sign
 *         is only added for negative numbers.
 *
 *   0     Left-pads a number with 0 instead of spaces.
 *
 * space   Add a space if no sign is going to be written.
 *
 * <width>
 *         Minimum number of characters to be printed. If the value to be
 *         printed is shorter than this number, the result is padded with
 *         blank spaces. The value is not truncated even if the result is
 *         longer.
 *
 * <precision>
 *         For b, d, o, x and X this specifies the minimum number of digits
 *         to be written. If the value to be written is shorter than this
 *         number, the result is padded with leading zeros. The value is
 *         not truncated even if the result is longer.
 *
 *         For f this is the number of digits to be printed after the decimal
 *         point.
 *
 *         For s this is the maximum number of characters to be printed. By
 *         default all characters are printed.
 *
 * <specifier>
 *
 *   %     Prints a % character
 *
 *   d     Print number as decimal
 *
 *   f     Print number as float
 *
 *   o     Print number as octal
 *
 *   s     Print string
 *
 *   x     Print number as hex (lower case)
 *
 *   X     Print number as HEX (upper case)
 *
 ******************************************************************************/
const
  reFormat = /%([-+0 ]*)(\d*)?(?:\.(\d+)?)?([dfosxX%])/g,
  reFlagSpace =  / /,
  reSignAlways = /\+/,
  rePadZero = /0/,
  rePadLeft = /-/;

function replace (skip, flags, width, precision, specifier) 
  {
    if ( this.idx >= this.args.length)
      throw Error('Not enough arguments');

    let
      globalSign = '',
      pad = ' ',
      out = '';

    const
      value = this.args[ this.idx ++ ],
      signSpace = reFlagSpace.test(flags),
      signAlways = reSignAlways.test(flags),
      padZero = rePadZero.test(flags),
      left =  rePadLeft.test(flags);

    switch (specifier)
      {
        case '%':
          return '%';

        case 's':
          out = value.toString();
          if ( precision !== undefined ) out = out.slice( 0, precision );
         break;

        case 'f':
          out = Math.abs(value).toFixed( precision === undefined  ? 6 : precision);
          if (padZero && width && !left) pad = '0'; 

          if ( value < 0 || signAlways || signSpace )
            {
              const sign = value < 0 ? '-' : signAlways ? '+' : ' ';
              if ( (width && pad === '0') )
                globalSign = sign;
              else
                out = sign + out;
            }
          break;

        case 'd':
          out = Math.abs(value).toString();
          if (precision !== undefined)
            {
              out = out.padStart( precision, '0');
            }
          if (padZero && width && !left && precision===undefined) pad = '0'; 
          if ( value < 0 || signAlways || signSpace )
            {
              const sign = value < 0 ? '-' : signAlways ? '+' : ' ';

              if ( (width && pad == '0') && precision === undefined )
                globalSign = sign;
              else
                out = sign + out;
            }
          break;

        case 'b':
        case 'o':
        case 'x':
        case 'X':
          out = (
            value < 0 ?
            (((value&0xffffffff) + 0x100000000) % 0x100000000 ) :
            value
          ).toString( specifier === 'b' ? 2 : specifier === 'o' ? 8 : 16 )

          if (padZero && width && !left && precision === undefined) pad = '0'; 
          if ( precision !== undefined )
            out = out.padStart( precision, '0');

          if ( specifier === 'X' ) out = out.toUpperCase();

          break;

        default:  
          throw Error(`Unknown specifier ${specifier}`);
      }

    if ( width !== undefined )
      out = globalSign + out[ left ? 'padEnd' : 'padStart'](
        width - globalSign.length, pad
      );

    return out;
  }

function sprintf(format, ...args)
  {
    return format.replace( reFormat, replace.bind({args:args, idx:0}) );
  }

module.exports = sprintf;
