const p5Module= require('p5');
const Common = require('./common.js');

// create a new p5-Vector and subtract another one fropm it on the fly
function vectorSub( x, y, v ) {
  return new p5Module.Vector( x-v.x, y-v.y, v.z );
}

function DebugScreen( e, spd, col ) {
  this.editor= e;
  this.skipFrames= spd;
  this.color= col;

  this.frameRate= -1;

  // load values to display
  this.update= function() {
    if( (this.editor.p5.frameCount % this.skipFrames) == 0 ) {  // only update every couple frames to prevent flickering
      this.frameRate= this.editor.p5.frameRate();
    }
  }

  this.getRenderPosition= function() {
    return { x: -this.editor.positionOffset.x -this.editor.originOffset.x +3,
             y: -this.editor.positionOffset.y -this.editor.originOffset.y +20 };
  }

  this.render= function() {
    let p5= this.editor.p5;

    p5.push();
    p5.textAlign( p5.LEFT );
    p5.fill( this.color );

    let {x,y}= this.getRenderPosition();
    p5.text( "Frame Rate: "+ this.frameRate, x, y  );
    p5.pop();
  }
}

function Grid( e ) {
  this.editor= e;



}

function Map() {

  this.update= function() {

  }

  this.draw= function() {

  }

}

/*
*   Editor Class that interfaces with the controls and UI,
*   and holds the actual rendering framework
*/
function Editor( cnf ) {

  this.updateCanvas= function( up ) {
    let x= this.canvasDiv.clientWidth;
    let y= this.canvasDiv.clientHeight;

    if( (typeof up === 'undefined') || ( up === true ) ) {
      this.originOffset.add((x-this.canvasWidth), 0);       // compensate for the movement of the x-origin
    }

    this.canvasWidth= x;
    this.canvasHeight= y;
    this.p5.resizeCanvas( x, y, false );
  }

  this.getRelativePos= function( x, y ) {
    return this.p5.createVector( x* this.scale, y* this.scale );
  }

  this.mouseInCanvas= function() {
    if( (this.p5.mouseX>0) && (this.p5.mouseY>0) ) {    // negative position check
      if( (this.p5.mouseX< this.canvasWidth) && (this.p5.mouseY< this.canvasHeight) ) { // out of bounds check
        return true;
      }
    }
    return false;
  }

  // check if a certain key is currently held down
  this.isPressed= function( key ) {
    return (this.p5.keyCode === key ) && (this.p5.keyIsPressed === true);
  }

  // translate the canvas for the origin and position offset
  this.translateOffset= function() {
    this.p5.translate( p5Module.Vector.add( this.originOffset, this.positionOffset ) );
  }

  /* Render Callbacks to P5.js */
  this.p5Renderer= function(p5) {
    let self= this;

    p5.setup= function() {
      self.canvas = p5.createCanvas( 400, 400 );
      self.updateCanvas( false );
    }

    p5.draw= function() {
      p5.background( self.backColor );

      self.translateOffset();

      p5.fill('#fae');
      let pos= self.getRelativePos(500, 500)
      p5.ellipse(pos.x, pos.y, 90* self.scale );

      // draw the origin cross at (0,0)
      p5.push();
      p5.stroke(self.complementCol);
      p5.strokeWeight(1);
      p5.line(-10, 0, 10, 0);
      p5.line(0, -10, 0, 10);
      p5.pop();

      if( self.debugScreen !== null ) {   // update and show the debug screen if one is currently attached
        self.debugScreen.update();
        self.debugScreen.render();
      }
    }

    p5.windowResized= function() {
      self.updateCanvas();
    }

    p5.mousePressed= function() {
      if( p5.mouseButton === p5.RIGHT ) {
        if( self.mouseInCanvas() ) {
          self.clickPosition= p5.createVector(p5.mouseX, p5.mouseY);  // save clicking position to track cursor movement
          self.lastPositionOffset= self.positionOffset.copy();        // save old position to calculate offset from it
        }
      }
    }

    p5.mouseDragged= function() {
      if( p5.mouseButton === p5.RIGHT ) {
        if( self.clickPosition !== null ) { // calculate new position as offset from old position with curosr movement
          self.positionOffset= p5Module.Vector.add( self.lastPositionOffset, vectorSub(p5.mouseX, p5.mouseY, self.clickPosition) );
          p5.cursor( p5.HAND );
        }
      }
    }

    p5.mouseReleased= function() {
      self.clickPosition= null;     // reset click position to stop dragging calculation
      p5.cursor( p5.ARROW );
    }

    p5.mouseWheel= function( event ) {
      if( self.mouseInCanvas() ) {      // only respond if the cursor is in the canvas

        if( self.isPressed( p5.CONTROL ) ){       // zoom if control is pressed
          self.scale*= (1+(event.delta/-2000));

        } else if( self.isPressed( p5.SHIFT ) ) { // pan left/right if shift is pressed
          self.positionOffset.x+= (event.delta *0.75);

        } else {                                  // pan up/down as default
          self.positionOffset.y+= (event.delta *0.75);
        }
      }
    }
  }

  /* Commands  */

  // Enable or disable the debug screen
  this.toggleDebugScreen= function() {
    if( this.debugScreen !== null ) {
      this.debugScreen= null;
    } else {
      this.debugScreen= new DebugScreen( this, 12, this.complementCol );
    }
  }

  this.autoPanOrigin= function() {
    this.positionOffset= this.p5.createVector( 20, 20 );
    this.scale= 1;
  }

  /* Constructor */
  this.config= new Common.DefaultConfig( cnf,
                                          { ankorName: '', backColor: '', compColor: '' },
                                          function( prop, val ) { throw new Error("Editor Constructor Configuration misses property: "+ prop ); } );

  this.canvas= null;
  this.canvasDiv= document.getElementById( this.config.ankorName );
  this.canvasWidth= this.canvasDiv.clientWidth;
  this.canvasHeight= this.canvasDiv.clientHeight;
  this.scale= 1;

  this.debugScreen= null;

  let self= this;
  this.p5= new p5Module( function(p5) { self.p5Renderer(p5); }, this.config.ankorName );

  this.originOffset= this.p5.createVector(0, 0);
  this.positionOffset= this.p5.createVector(0, 0);
  this.lastPositionOffset= this.p5.createVector(0, 0);
  this.backColor= this.p5.color( this.config.backColor );
  this.complementCol= this.p5.color( this.config.compColor );
  this.clickPosition= null;
}

module.exports.Editor= Editor;
