const p5Module= require('p5');
const Common = require('./common.js');

// create a new p5-Vector and subtract another one from it on the fly
function vectorSub( x, y, v ) {
  return new p5Module.Vector( x-v.x, y-v.y, -v.z );
}

// create a new p5-Vector and add another one to it on the fly
function vectorAdd( x, y, v ) {
  return new p5Module.Vector( x+v.x, y+v.y, v.z );
}

// return new p5-Vector with inverted values
function vectorInvert( v ) {
  return p5Module.Vector.mult(v, -1);
}


/*
*   Debug Screen Class rendering debug information as
*   text to the screen when enabled
*/

function DebugScreen( e, spd, col ) {
  this.editor= e;
  this.skipFrames= spd;
  this.color= col;

  this.frameRate= -1;
  this.scale= -1;
  this.position= new p5Module.Vector(-1, -1);

  // load values to display
  this.update= function() {
    if( (this.editor.p5.frameCount % this.skipFrames) == 0 ) {  // only update every couple frames to prevent flickering
      this.frameRate= this.editor.p5.frameRate();
      this.scale= this.editor.scale;
      this.position= this.editor.positionOffset.copy();
    }
  }

  this.getRenderPosition= function() {
    return { x: -this.editor.positionOffset.x -this.editor.originOffset.x +3,
             y: -this.editor.positionOffset.y -this.editor.originOffset.y +20 };
  }

  // render debug information as text to the screen
  this.show= function() {
    let p5= this.editor.p5;

    p5.push();
    p5.textAlign( p5.LEFT );
    p5.fill( this.color );

    let {x,y}= this.getRenderPosition();
    p5.text( "Frame Rate: "+ this.frameRate.toFixed(3), x, y  );
    p5.text( "Position X: "+ this.position.x + " Y: " + this.position.y, x, y+12  );
    p5.text( "Scale:      "+ this.scale.toFixed(5)*100 + "%", x, y+24  );
    p5.pop();
  }
}


/*
*   Grid Class doing all needed grid calculations
*   and redering the grid to the screen
*/

function Grid( e, gridcol ) {
  this.editor= e;
  this.enable= true;
  this.resolution= 50;
  this.color= gridcol;

  this.getMousePosition= function() {
    let p5= this.editor.p5;
    let res= this.resolution* this.editor.scale;  // actual grid resolution on the canvas
    let delta= p5.mouseX % res;                   // offset to the next grid point
    let x= p5.mouseX -delta + ( ( delta < (res/2) )? 0: res ); // go to the next point if the offset is greater than half the resolution

    delta= p5.mouseY % res;
    let y= p5.mouseY -delta + ( ( delta < (res/2) )? 0: res );

    return p5.createVector( x, y );
  }

  this.toggleGrid= function() {
    this.enable= !this.enable;
  }

  this.render= function() {
    if(this.enable === true) {
      let p5= this.editor.p5;
      let res= this.resolution* this.editor.scale;  // actual grid resolution on the canvas

      if( res > 10 ) {
        let cnvOrg= this.editor.getCanvasOrigin();
        let linecnt= this.editor.canvasHeight / res;  // lines to draw with resolution
        let collcnt= this.editor.canvasWidth / res;   // collumns to draw with resolution

        let x= cnvOrg.x- (cnvOrg.x % res)+ (cnvOrg.x >0 ? res : 0 );  // x offset to canvas (0,0)
        let y= cnvOrg.y- (cnvOrg.y % res)+ (cnvOrg.y >0 ? res : 0 );  // y offset to canvas (0,0)

        p5.ellipse( x, y, 20)

        p5.push();
        p5.stroke( this.color );
        p5.strokeWeight( 1 );

        let pos= y;
        for( let i= 0; i< linecnt; i++ ) {
          p5.line( x- res, pos, x+ this.editor.canvasWidth, pos );
          pos+= res;
        }

        pos= x;
        for( let i= 0; i< collcnt; i++ ) {
          p5.line( pos, y- res, pos, y+ this.editor.canvasHeight );
          pos+= res;
        }

        p5.pop();
      }
    }
  }


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

  this.getScaledPos= function( x, y ) {
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

  this.getCanvasOrigin= function() {
    return vectorInvert( p5Module.Vector.add( this.originOffset, this.positionOffset ) );
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

      self.grid.render();

      p5.fill('#fae');
      let pos= self.getScaledPos(500, 500);
      p5.ellipse(pos.x, pos.y, 90* self.scale );

      // Rendering additional elements
      // draw the origin cross at (0,0)
      p5.push();
      p5.stroke(self.complementCol);
      p5.strokeWeight(3);
      p5.line(-10, 0, 10, 0);
      p5.line(0, -10, 0, 10);

      // show the mouse cursor on the canvas grid as little circle
      if( self.config.showCursor === true ) {
        p5.noFill();
        p5.stroke('#31bff7');
        let {x,y} = self.grid.getMousePosition();
        p5.ellipse( x, y, 8);
      }

      p5.pop();

      if( self.debugScreen !== null ) {   // update and show the debug screen if one is currently attached
        self.debugScreen.update();
        self.debugScreen.show();
      }

      // Done Rendering
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

  // Move map back to the origin and set scale to 1
  this.autoPanOrigin= function() {
    this.positionOffset= vectorSub( 20, 20, this.originOffset );
    this.scale= 1;
  }

  /* Constructor */
  this.config= new Common.DefaultConfig(  cnf,
                                          { ankorName: null, backColor: 'white', compColor: 'black', gridColor: 'red', friendlyErrors: false, showCursor: true },
                                          function( prop, val, fatal ) {
                                            if( fatal === true ) {
                                              throw new Error("Editor Constructor Configuration misses property: "+ prop );
                                            }
                                          } );

  this.canvas= null;
  this.canvasDiv= document.getElementById( this.config.ankorName );
  this.canvasWidth= this.canvasDiv.clientWidth;
  this.canvasHeight= this.canvasDiv.clientHeight;
  this.scale= 1;

  this.debugScreen= null;
  this.grid= new Grid( this, this.config.gridColor );

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
