'use strict'
self.importScripts('./common.js');

/*
* Frame Data Structure
* For solid image:
*   Single rgb pixel that is copied -> 3 bytes
*   [r, g, b]
*
* For entire image:
*   Pixel values for every pixel of the image -> 48*48*3 bytes
*   [r, g, b][r, g, b][r, g, b]...
*
* For difference image:
*   Pixel values that are different to the previous image including
*   their coordinates -> n*5 bytes
*   [x, y, r, g, b][x, y, r, g, b][x, y, r, g, b]...
*
* Actual p5-Image:
*   RGBA values for every pixel of the image -> 48*48*4 bytes
*   [r, g, b, a][r, g, b, a][r, g, b, a]...
*
*/

const panelBytes= 48*48*4;

function FrameSaver() {
  this.arr= [];

  this.at= function( index ) {
    while( index >= this.arr.length ) {
      this.arr.push( null );
    }

    if( this.arr[index] === null ) {
      this.arr[index]= new ArrayBuffer( panelBytes );
    }

    return this.arr[index];
  }
}

let thisInstance= new function() {

  this.eventMessage= function( e ) {
    let m= e.data;

    switch( m.message ) {
      case 'init':
        this.id= m.id;
        break;

      case 'frame':
        this.frames.push( m.frame );
        break;

      case 'start':
        this.run();
        break;

      default:
        console.error("Received invalid WW message @"+ this.id+ ": "+ m.message );
        break;
    }
  }

  // Post frame and its rendered image buffer back
  this.postImage= function( frame, img ) {
    self.postMessage( {message: 'done', id: this.id, frame: frame, imgData: img}, [frame.data, img] );
  }

  // write pixel data to current and previous image
  this.writePixel= function( img, old, pos, col ) {
    img.setUint32(pos, col);
    old.setUint32(pos, col);
  }

  // main render loop
  this.run= function() {
    while( this.frames.isEmpty() === false ) {
      let frame= this.frames.get();
      let img= new ArrayBuffer( panelBytes );

      let frview=  new DataView( frame.data );
      let prview=  new DataView( this.previous.at( frame.panelId ) );
      let imgview= new DataView( img );



      if( frame.type === 'd' ) {          // difference
        // render diff

      } else if( frame.type === 'e' ) {   // entire
        this.renderEntire(frview, prview, imgview, frame);

      } else if( frame.type === 'l' ) {   // line
        // render lines

      } else {                            // solid
        this.renderSolid(frview, prview, imgview, frame);
      }

      this.postImage(frame, img);         // return frame buffer and image
    }
  }

  // Render a solid image in a single color
  this.renderSolid= function( frview, prview, imgview, frame ) {
    if( frview.byteLength != 3 ) { //
      console.error( "Render Function 'Solid' received wrong buffer length: "+ view.byteLength );
    }

    // get pixel colors
    col= frview.getUint8(0);              // byte 0: r (msB)
    col= (col << 8) | frview.getUint8(1); // byte 1: g
    col= (col << 8) | frview.getUint8(2); // byte 2: b
    col= (col << 8) | 0xFF;               // byte 3: a (lsB)

    for( let i= 0; i!= panelBytes; i+= 4 ) {
      this.writePixel( imgview, prview, i, col );
    }
  }

  // Render an entire image from provided pixel values
  this.renderEntire= function( frview, prview, imgview, frame ) {
    if( frview.byteLength != 6912 ) { //
      console.error( "Render Function 'Entire' received wrong buffer length: "+ frview.byteLength );
    }

    let pos= 0, col;
    for( let i= 0; i < frview.byteLength; i+= 3 ) {       // frame only has 3 bytes per pixel

      // get pixel colors
      if( i < (frview.byteLength-3) ) { // load as 4 byte value and replace the lsB with the a-value
        col= frview.getUint32(i);
        col|= 0xFF;

      } else {                          // the last value needs to be loaded byte by byte as only 3 bytes to load remain ...
        col= frview.getUint8(i);        // ... and loading 4 bytes would throw out-of-bounds
        col= (col << 8) | frview.getUint8(i+1);
        col= (col << 8) | frview.getUint8(i+2);
        col= (col << 8) | 0xFF;
      }

      this.writePixel( imgview, prview, pos, col );
      pos+= 4;                                            // image has 4 bytes per pixel
    }
  }

  /* Constructor */
  this.id= -1;
  this.frames= new ObjPipe();
  this.previous= new FrameSaver();
};

self.onmessage= function( e ) {

  thisInstance.eventMessage( e );
}
