

function waitkey()
  {
    return new Promise(
      (resolve, reject) => process.stdin.once('data', resolve)
    );
  }

function lz(value)
  {
    return value.toString().padStart(2,'0');
  }

async function HD44780Test( lcd )
  {
    console.log('Test of HD44780');
    let answer;

    await lcd.backlight(true);

    await lcd.display_clear();
    console.log('Test line feed');
    await lcd.write_xy(0,0,'ROW1\nROW2');

    await lcd.backlight(false);

    console.log('Clear display');
    await waitkey();
    await lcd.display_clear();

    await lcd.backlight(true);

    console.log('cursor underline on');
    await waitkey();
    await lcd.cursor_visible(true);

    console.log('cursor underline off');
    await waitkey();
    await lcd.cursor_visible(false);

    console.log('cursor blink on');
    await waitkey();
    await lcd.cursor_blink(true);

    console.log('cursor blink off');
    await waitkey();
    await lcd.cursor_blink(false);

    console.log('Write test x,y');
    await waitkey();
    await lcd.write_xy(5,0,'R1C5');
    await lcd.write_xy(10,1,'R2C10');

    await waitkey();
    await lcd.display_clear();
    await lcd.write_xy(0,0,'ROW1\nROW2');

    console.log('Display off');
    await waitkey();
    await lcd.display_visible(false)

    console.log('Display on');
    await waitkey();
    await lcd.display_visible(true)

    console.log('cursor blink on (should be on row 2 col 5)');
    await waitkey();
    await lcd.cursor_blink(true);

    console.log('home. cursor blink (should be on row 1 col 1)');
    await waitkey();
    await lcd.display_home();

    console.log('cursor blink off');
    await waitkey();
    await lcd.cursor_blink(false);

    console.log('shift left');
    await waitkey();
    await lcd.display_shift_left();

    console.log('shift right');
    await waitkey();
    await lcd.display_shift_right();

    console.log('shift right');
    await waitkey();
    await lcd.display_shift( true );

    console.log('shift left');
    await waitkey();
    await lcd.display_shift( false );

    console.log('cursor right');
    await waitkey();
    await lcd.cursor_blink(true);
    await lcd.cursor_move( true )

    console.log('cursor left');
    await waitkey();
    await lcd.cursor_move( false )


    console.log('custom bitmap');
    await waitkey();

    await lcd.store_custom_bitmap( 0, [ 0x04, 0x04, 0x04, 0x1F, 0x1F, 0x04, 0x04, 0x04 ] );
    await lcd.write("\x0CCUSTOM: \x0E0");


    async function time()
      {
        let now = new Date();
        await lcd.write(`\r${lz(now.getHours())}:${lz(now.getMinutes())}:${lz(now.getSeconds())}`);
      }

    let th = setInterval( time, 1000 );
    await waitkey();
    clearInterval(th);
    

    await lcd.backlight(false);
    process.exit(0);
  }

module.exports = HD44780Test;
