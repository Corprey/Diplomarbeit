'use strict'
const p5Module= require('p5');
const Common = require('./common.js');
const Render = require('./frameRenderer.js');
const Tools  = require('./editorTools.js');
const {Compiler}  = require('./Compiler.js');
const {AnimationFile} = require('./applicationInterface.js');

// create a new p5-Vector and subtract another one from it on the fly
function vectorSub( x, y, v ) {
  return new p5Module.Vector( x-v.x, y-v.y, -v.z );
}

// create a new p5-Vector and add another one to it on the fly
function vectorAdd( x, y, v ) {
  return new p5Module.Vector( x+v.x, y+v.y, v.z );
}

// return same p5-Vector with inverted values
function vectorInvert( v ) {
  return v.mult( -1 );
}

// truncate x and y component of provided vector
function roundVector( v ) {
  return v.set( Math.round( v.x ), Math.round( v.y ), 0 );
}

// create a new p5-Vector from x and y, if they are floats, they are truncated
function crTruncVector( x, y ) {
  return new p5Module.Vector( Math.trunc(x), Math.trunc(y), 0 );
}

// Check whether a point is inside a specified rectengular area
function boxSelect( pos, pt, width, height ) {
  return ( (pt.x >= pos.x) && (pt.x < pos.x+ width ) &&
           (pt.y >= pos.y) && (pt.y < pos.y+ height)   );
}

// Check whether a box 'b' is inside a specified rectengular area 'ar'
function boxCapture( arPos, arSize, bPos, width, height ) {
  return ( (bPos.x - arPos.x) >= 0 ) && ( (bPos.y - arPos.y) >= 0 ) &&
				 ( (arPos.x + arSize.x) >= (bPos.x + width ) ) &&
				 ( (arPos.y + arSize.y) >= (bPos.y + height) );
}

// Takes a boxes values per referece and normalizs them to a box with
// the origin in the upper left corner and onyl positive size values
function normalizeBox( pos, sz ) {
  pos.x+= ( sz.x < 0 ) ? sz.x : 0;
  pos.y+= ( sz.y < 0 ) ? sz.y : 0;

  sz.x= Math.abs( sz.x );
  sz.y= Math.abs( sz.y );
}

// Returns v2 with the sign of v1
function copySign( v1, v2 ) {
  if( v1 < 0 ) {
    return (v2 < 0) ?  v2 : -v2;
  } else {
    return (v2 < 0) ? -v2 :  v2;
  }
}

// Linear map of 'v' which is in range 'a' to 'b'
// to a return value which is in range 'x' to 'y'
function linearMap( v, a, b, x, y ) {
  return ( ( v / (b-a) ) * (y-x) ) + x;
}

// Create a random pastel color
function randomPastelColor( p5 ) {
  let r= linearMap( Math.random(), 0, 1, 30, 190 );
  let g= linearMap( Math.random(), 0, 1, 30, 190 );
  let b= linearMap( Math.random(), 0, 1, 30, 190 );

  return p5.color( r, g, b );
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
  this.mousePosition= new p5Module.Vector(-1, -1);
  this.mouseGridPosition= new p5Module.Vector(-1, -1);
  this.canvasSize= new p5Module.Vector(-1, -1);

  // load values to display
  this.update= function() {
    if( (this.editor.p5.frameCount % this.skipFrames) == 0 ) {  // only update every couple frames to prevent flickering
      this.frameRate= this.editor.p5.frameRate();
      this.scale= this.editor.scale;
      this.position= this.editor.positionOffset.copy();
      this.mousePosition= crTruncVector( this.editor.p5.mouseX, this.editor.p5.mouseY );
      this.mouseGridPosition= crTruncVector( this.editor.grid.mouseMapPos.x, this.editor.grid.mouseMapPos.y );
      this.canvasSize= new p5Module.Vector( this.editor.canvasWidth, this.editor.canvasHeight );
    }
  }

  // render debug information as text to the screen
  this.show= function() {
    let p5= this.editor.p5;

    p5.push();
    p5.textAlign( p5.LEFT );
    p5.fill( this.color );

    let {x,y}= this.editor.getCanvasOrigin();
    x+= 3; y+= 20;
    p5.text( "Frame Rate: "+ this.frameRate.toFixed(3), x, y );
    p5.text( "Position X: "+ this.position.x + " Y: " + this.position.y, x, y+12 );
    p5.text( "Mouse X: "   + this.mousePosition.x + " Y: " + this.mousePosition.y
                           + " | X: " + this.mouseGridPosition.x + " Y: " + this.mouseGridPosition.y, x, y+24 );
    p5.text( "Scale: "     + this.scale.toFixed(5)*100 + "%", x, y+36 );
    p5.text( "Canvas: "    + this.canvasSize.x + " x " + this.canvasSize.y, x, y+48 );
    p5.pop();
  }
}

/*
* Convert distances with unit to map pixel values
*
*/
function UnitConversion() {
  this.names= {
    mm:  100/240,
    cm:  100/24,
    pl:  100/1,
    m:   100/0.24,
    mil: 100/9448.82,
    in:  100/9.44882,
    ft:  100/0.78740167
  };

  this.unit= 'cm';

  this.mkFromText= function( v, u ) {
    if( this.has( u ) === false ) {
      this.unit= Object.keys(this.names)[1];
    } else {
      this.unit= u;
    }

    return v* this.factor();
  }

  this.has= function( u ) {
    return this.names.hasOwnProperty(u);
  }

  this.factor= function() {
    return this.names[ this.unit ];
  }

  this.getFactor= function( u ) {
    if( this.has( u ) === false ) {
      console.error( "Unit does not exist." );
      return;
    }

    return this.names[ u ];
  }

}


/**
* Class holding dimension as 2D vector with unit
**/
function Dimension( x, y, u, c ) {


  this.get= function() {
    return this.val;
  }

  this.toPixelSpace= function() {
    return this.pix;
  }

  this.set= function( x, y, u, c ) {
    this.val= new p5Module.Vector(x, y);
    this.unit= u;

    let factor= c.getFactor( u );
    this.pix= new p5Module.Vector( x * factor, y * factor );
  }

  this.copy = function() {

    return new Dimension( this );
  }

  this.val= null;
  this.pix= null;
  this.unit= null;

  if( typeof x === "object" ) {
    if( x.__proto__.constructor.name === "Dimension" ) {
      this.val= x.val.copy();
      this.pix= x.pix.copy();
      this.unit= x.unit;
    } else {
        throw "Type Error: Dimension can only be copy-constructed from another Dimension-object.";
      }

  } else {
    this.set( x, y, u, c );
  }
}


/*
*   Grid Class doing all needed grid calculations
*   and redering the grid to the screen
*/
function Grid( e, gridcol, mouseCb, gridCb ) {
  this.editor= e;
  this.enable= true;
  this.resolution= 50;
  this.color= gridcol;
  this.mouseMapPos= null;
  this.mousePixelPos= null;
  this.conversion= new UnitConversion();
  this.mouseCallback= mouseCb;
  this.gridCallback= gridCb;

  this.updateMousePosition= function() {
    let p5= this.editor.p5;

    let mouse= this.editor.getCanvasOrigin().add( p5.mouseX, p5.mouseY );   // get mouse position on the map
    this.getNearestSnapPos( mouse, this.editor.scale );

    // recycle the vector object of mousePixelPos if it is not null
    this.mouseMapPos= ( this.mousePixelPos !== null ) ? roundVector( this.mousePixelPos.set( mouse ).div( this.editor.scale ) )
                                                      : roundVector( p5.createVector( mouse ).div( this.editor.scale )        );
    this.mousePixelPos= mouse;  // save new mousePixelPos

    // Update toolbar mouse position
    let fc= this.conversion.factor();
    this.mouseCallback( Math.round(this.mouseMapPos.x / fc), Math.round( this.mouseMapPos.y / fc ), this.conversion.unit );
  }

  // Replaces the position in the provided vector with the nearest grid snapping position
  this.getNearestSnapPos= function( vec, scl= 1 ) {
    let res= this.resolution* scl;    // actual grid resolution on the canvas
    let delta= vec.x % res;           // offset to the next grid point
    vec.x= vec.x -delta + ( ( Math.abs(delta) < (res/2) )? 0: copySign( delta, res ) ); // go to the next point if the offset is greater than half the resolution

    delta= vec.y % res;
    vec.y= vec.y -delta + ( ( Math.abs(delta) < (res/2) )? 0: copySign( delta, res ) );

    return vec;
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

        p5.push();
        p5.stroke( this.color );
        p5.strokeWeight( 1 );

        // draw lines
        let pos= y;
        for( let i= 0; i< linecnt; i++ ) {
          p5.line( x- res, pos, x+ this.editor.canvasWidth, pos );
          pos+= res;
        }

        // draw collumns
        pos= x;
        for( let i= 0; i< collcnt; i++ ) {
          p5.line( pos, y- res, pos, y+ this.editor.canvasHeight );
          pos+= res;
        }

        p5.pop();
      }
    }
  }

  // Set grid width
  this.setGridWithUnit= function( v, u ) {
    this.resolution= this.conversion.mkFromText( v, u );
    this.gridCallback( v, u );
  }

}


/*
*   Panel Class holding information for single
*   LED Panel on the map
*/
const LEDPANELPIXELDIM= 100;
function LedPanel( pos, id, e, getScreen= true ) {
  this.editor= e;
  this.position= new p5Module.Vector( pos.x, pos.y, 0 );
  this.panelId= id;
  this.size= 1;
  this.selected= false;
  this.panelLegId= -1; //id for leg in LegArray
  this.panelLegIndex= -1; //id for panel in Leg
  this.fanpower= 100;
  this.colorCorr= {red: 100, green: 100, blue:100};

  if( getScreen === true ) {
    this.requestScreen();
  }
}

// get screen
LedPanel.prototype.requestScreen= function() {
  this.screen= this.editor.frenderer.screens.at( this.panelId );
}

LedPanel.prototype.destroy= function() {
  this.editor.frenderer.screens.remove( this.panelId );
  this.selected= false;

  if( this.panelLegId >= 0 ) {
    this.editor.map.legs.detachPanel( this.panelLegId, this.panelId);
  }
}

// Tests whether a point on the map is inside of the panels area
LedPanel.prototype.canSelect= function( pt ) {
  return boxSelect( this.position, pt, LEDPANELPIXELDIM, LEDPANELPIXELDIM );
}

// Test whether the panel is inside a specified area
LedPanel.prototype.isInArea= function( pt, sz ) {
  return boxCapture( pt, sz, this.position, LEDPANELPIXELDIM, LEDPANELPIXELDIM );
}

// Select or unselect a panel
LedPanel.prototype.select= function( v = true ) {
  this.selected= v;
}

// Offset position by vector
LedPanel.prototype.moveBy = function( v ) {
  this.position.add( v );
};

// Detach the panel from its leg
LedPanel.prototype.detachFromLeg= function() {
  if( this.panelLegId >= 0 ) {
    this.editor.map.legs.detachPanel( this.panelLegId, this.panelId);
    this.panelLegId = -1;
  }
}

// Draw the panel to the screen if it is currently in view
LedPanel.prototype.draw= function( def= true ) {
  let p5 =this.editor.p5;
  let pos= this.editor.getScaledPos( this.position.x, this.position.y );
  this.size= this.editor.scale * LEDPANELPIXELDIM;

  if( def === true ) {
    p5.image( this.defaultImage, pos.x, pos.y, this.size, this.size );
  } else {
    // use screen img
  }

  // draw colored frame when selected
  if( this.selected === true ) {
    p5.strokeWeight( 2 );
    p5.stroke('#2693F2');
    p5.noFill();

    p5.rect( pos.x, pos.y, this.size, this.size );
  }
}


// Create and load static default image
LedPanel.prototype.defaultImage= null;
LedPanel.init= function( p5 ) {
    LedPanel.prototype.defaultImage= p5.loadImage('./icons/panel.png');
}



/*
*   Panel-Leg Class holding information for
*   single thread of Led Panels
*/
function PanelLeg( i, p5 ) {
  this.arr=[];
  this.id= i;
  this.p5= p5;
  this.color= randomPastelColor( this.p5 );

  }

  PanelLeg.prototype.getHexColor= function() {
    return this.color.toString('#rrggbb');
  }

  PanelLeg.prototype.setHexColor= function(str) {
    this.color= this.p5.color(str);
  }

  // Remove panel by id
  PanelLeg.prototype.removePanel= function( map, pid ) {
    let panel= map.get( pid );
    let index = this.arr.indexOf( panel.panelId );
    if (index > -1) {
      this.arr.splice(index, 1);
      panel.panelLegId= -1;
      panel.panelLegIndex= -1;
      // Update all index values of the panels in the leg
      for(let i= index; i < this.arr.length; i++ ) {
        let p= map.get( this.arr[i] );
        if( p !== null ) {
          p.panelLegIndex--;
        }
      }
    }
  }

  // Attach new panel
  PanelLeg.prototype.attachPanel= function( map, panel, index = -1 ) {
    if( index < 0 ) {
      index = this.arr.length;
    }
    this.arr.splice( index, 0, panel.panelId );
    panel.panelLegId= this.id;
    panel.panelLegIndex= index;
    // Update all index values of the panels in the leg
    for(let i= index +1; i < this.arr.length; i++ ) {
      let p= map.get( this.arr[i] );
      if( p !== null ) {
        p.panelLegIndex++;
      }
    }
  }


  // Clean up all the legs data
  PanelLeg.prototype.destroy= function( map ) {
    for( let i= 0; i!= this.arr.length; i++ ) {

      let panel= map.get( this.arr[i] );
      if( panel !== null ) {
        panel.detachFromLeg();
      }
    }
  }

  // Get the previous panel on the leg
  PanelLeg.prototype.previous= function( pid ) {
    let index= this.arr.indexOf( pid );
    if( index > -1 ) {
      if( index === 0 ) {
        return -1;
      }

      return this.arr[ index-1 ];
    }
    return -1;
  }

  // Get the next panel on the leg
  PanelLeg.prototype.next= function( pid ) {
    let index= this.arr.indexOf( pid );
    if( index > -1 ) {
      if( index === this.arr.length -1 ) {
        return -1;
      }

      return this.arr[ index+1 ];
    }
    return -1;
  }

  PanelLeg.prototype.calcOffset= function( editor, pos, neg= false ) {

    let scl= editor.scale;
    let middle= 50* scl;
    let offset= 10* scl;

    let o= neg ? -offset : offset;
    return { x: scl * pos.x + middle + o,  y: scl * pos.y + middle };
  }

  // Draw connections between the panels to canvas
  PanelLeg.prototype.draw= function( editor, map ) {
    let p5= editor.p5;

    p5.stroke( this.color );
    p5.strokeWeight( 5 );

    // Go through all panels (except the last one) and draw the connection
    // between the current and the next one
    for( let i= 0; i< this.arr.length-1; i++ ) {
      let pb= map.get( this.arr[i] );
      let pe= map.get( this.arr[i+1] );

      if( (pb !== null) && (pe !== null) ) {

        let drb= this.calcOffset(editor, pb.position);
        let dre= this.calcOffset(editor, pe.position, true);

        p5.line( drb.x, drb.y, dre.x, dre.y );

      }
    }
  }


function PanelLegArray( m ) {
  this.arr=[];
  this.map= m;

  this.cbAddLeg= null;
  this.cbDeleteLeg= null;
  this.cbAddPanel= null;
  this.cbDeletePanel= null;


  this.addLeg= function( id= -1 ) {
    // expand the array if the id is greater than the length
    if( this.arr.length <= id ) {
      while( this.arr.length <= id ) {
        this.arr.push( null );
      }

    } else {
      // search for smallest available slot if no id was provided
      if( id < 0 ) {
        for( let i= 0; i!= this.arr.length; i++ ) {
          if( this.arr[i] === null ) {
            id= i;
            break;
          }
        }

        // create new element if no empty slot is found
        if( id < 0 ) {
          id= this.arr.length;
          this.arr.push( null );
        }

      // check if leg id already exists if an id was provided
      } else {
        if(this.arr[id] !== null ) {
          return false;
        }
      }
    }

    this.arr[id]= new PanelLeg( id, this.map.editor.p5 );


      if( this.cbAddLeg !== null) {
          this.cbAddLeg( id );
      }

    return id;
  }

  this.deleteLeg= function( lid ) {
    let leg= this.get( lid );
    leg.destroy( this.map );

    if(this.cbDeleteLeg !== null) {
        this.cbDeleteLeg( lid );
    }

    this.arr[lid]= null;
  }

  this.get= function( lid ) {
    return ((this.arr.length > lid) && (lid >= 0)) ? this.arr[lid] : null;
  }

  this.detachPanel= function( lid, pid ) {
    let leg= this.get( lid );
    let panel= this.map.get( pid );
    let index= panel.panelLegIndex;

    if( (leg !== null) && (panel !== null) ) {
      if( this.cbDeletePanel !== null) {
          this.cbDeletePanel( lid, index );
      }
      leg.removePanel( this.map, pid );

      if( leg.arr.length === 0) {
        this.deleteLeg( leg.id );
      }

    }
  }

  this.attachPanel= function( lid, pid, index= -1 ) {
    let leg= this.get( lid );
    let panel= this.map.get( pid );

    if( (leg === null) || (panel === null) ) {
      ui.uiConsole.printError("no leg or panel found!");
      return false;
    }
    if(panel.panelLegIndex > (-1)) {
      ui.uiConsole.printWarning("panel already attached to leg!");
      return false;
    }

    leg.attachPanel( this.map, panel, index );
    if( this.cbAddPanel !== null) {
        let newindex= panel.panelLegIndex;
        this.cbAddPanel( lid, pid, newindex );
    }
    return true;
  }

  this.render= function() {

    for( let i= 0; i!= this.arr.length; i++ ) {
      if( this.arr[i] !== null ) {
        this.arr[i].draw( this.map.editor, this.map );
      }
    }
  }

}


/*
*   Panel selection class drawing and managing
*   all selected panels, does all click tracing and
*   movements
*/
function PanelSelection( e, m ) {
  this.editor= e;
  this.map= m;

  this.selection= [];
  this.selectionBegin= null;      // Selection Area
  this.selectionDimension= null;

  // Check if currently a selection area is active
  this.hasSelectionArea= function() {
    return (this.selectionBegin !== null) && (this.selectionDimension !== null);
  }

  // Begin new selection area
  this.mkSelection= function( begin, dim ) {
    this.selectionBegin=      p5Module.Vector.mult( begin, this.editor.scale );
    this.selectionDimension=  p5Module.Vector.mult( dim,   this.editor.scale );
  }

  // Finalize Selection area and reset area variables
  this.endSelection= function() {
    if( this.hasSelectionArea() ) {
      normalizeBox( this.selectionBegin.div( this.editor.scale ), this.selectionDimension.div( this.editor.scale ) );

      for( let i= 0; i!= this.map.panels.length; i++ ) {
        let p= this.map.panels[i];

        if( p !== null ) {
          if( p.isInArea( this.selectionBegin, this.selectionDimension ) ) {
            this.invertSelectPanel( p );
          }
        }
      }
    }
    this.resetSelectionArea();
  }

  // Reset the selction area
  this.resetSelectionArea= function() {
    this.selectionBegin= null;
    this.selectionDimension= null;
  }

  // Select or unselect a panel that is pointed at
  this.pointSelection= function( pos ) {
    let p= this.tracePoint( pos );

    if( p !== null ) {
      this.invertSelectPanel( p ); // If a panel was found and is not selected yet put into Array
    }

    return p;
  }

  // Create selection from panel ids
  this.fromIds= function( ids ) {
    this.flush();                       // remove current selection

    for( let i= 0; i!= ids.length; i++ ) {
      let p= this.editor.map.get( ids[i] ); // iterate through all ids and add panels
      if( p !== null ) {
        this.selection.push( p );
        p.select();
      }
    }
  }

  // Get the panel that is pointed at by 'pos' or return null
  this.tracePoint= function( pos ) {

    // find first panel that can be selected by the pointing coords
    for( let i= 0; i!= this.map.panels.length; i++ ) {
      let p= this.map.panels[i];

      if( p !== null ) {
        if( p.canSelect( pos ) ) {
          return p;
        }
      }
    }

    return null;
  }

  // Invert selection mode of a panel
  this.invertSelectPanel= function( p ) {
    let index= this.selection.indexOf( p ); // check if already part of array

    if( p.selected === false ) {    // Select if not slected yet
      if( index === -1 ) {
        this.selection.push( p );
      }
      p.select();

    } else {                        // Unselect and remove from array
      if( index > -1 ) {
        this.selection.splice( index, 1 );
      }

      p.select( false );
    }
  }

  // Remove all elements from the selection array
  this.flush= function() {
    for( let i= 0; i!= this.selection.length; i++ ) { // Unselect all panels
      this.selection[i].select( false );
    }

    this.selection= [];
  }

  // Move all selected panels by specified vector
  this.moveBy= function( v ) {
    for( let i= 0; i!= this.selection.length; i++ ) {
      this.selection[i].moveBy( v );
    }
  }


  // Get Ids of all selected panels
  this.getIds= function() {
    let arr= new Array( this.selection.length );
    for( let i= 0; i!= arr.length; i++ ) {
      arr[i]= this.selection[i].panelId;
    }

    return arr;
  }

  // Draw a selection area if one is currently active
  this.show= function() {
    let p5= this.editor.p5;

    if( this.hasSelectionArea() ) {
      p5.strokeWeight( 2 );
      p5.stroke('#2693F2');
      p5.fill( '#31bff772' );   // set with alpha ~0.45

      p5.rect( this.selectionBegin.x, this.selectionBegin.y, this.selectionDimension.x, this.selectionDimension.y );
    }
  }

}


function ProjectionCanvas( p, d, e ) {

  this.position= p;
  this.dimensions= d;
  this.isEnabled= false;
  this.editor= e;


  this.draw= function( e, p5 ) {
    if( this.isEnabled ) {
      let pos= e.getScaledPos( this.position.toPixelSpace().x, this.position.toPixelSpace().y );

      p5.strokeWeight( 4 );
      p5.stroke('#1dd396');
      p5.fill( '#1dd39630' );

      p5.rect( pos.x, pos.y, this.dimensions.toPixelSpace().x * e.scale, this.dimensions.toPixelSpace().y * e.scale );
    }
  }

  this.enable= function( e= true ) {
    this.isEnabled= e;
  }

  this.resize= function( xp, yp, up, xd, yd, ud ) {
    let dat= {pos: this.position.copy(), dim: this.dimensions.copy()};

    this.position.set( xp, yp, up, this.editor.grid.conversion );
    this.dimensions.set( xd, yd, ud, this.editor.grid.conversion );

    this.editor.actions.setToolTip('screen-resize', dat);
  }

  this.tracePanels= function(  ) {
    // TODO
    let map= this.editor.map;
    let errorPanel= null;

    for( let i=0; i<map.panels.length; i++ ) {

      let panel= map.get(i);
      if( panel !== null) {
        if( boxCapture( this.position.toPixelSpace(), this.dimensions.toPixelSpace(),
                        panel.position, LEDPANELPIXELDIM, LEDPANELPIXELDIM ) ) {

          /**/



        } else {
          errorPanel= panel;
        }
      }
    }
    return errorPanel;
  }
}


/*
*   EditorMap Class holding all dynamic objects to draw
*
*/
function EditorMap( e ) {

  this.editor= e;
  this.rederDisabled= true;
  this.mouseMapPos= null;

  this.panels= [];
  this.legs= new PanelLegArray( this );

  this.selection= new PanelSelection( this.editor, this );

  this.projection= new ProjectionCanvas(  new Dimension( 0, 0, "pl", e.grid.conversion ),
                                          new Dimension( 4, 4, "pl", e.grid.conversion ),
                                          this.editor);

  // calculate the mouse position on the map
  this.updateMousePosition= function() {
    let p5= this.editor.p5;
    this.mouseMapPos= this.editor.getCanvasOrigin().add( p5.mouseX, p5.mouseY ).div( this.editor.scale );
  }

  // Create new LED-Panel
  this.createPanel= function( pos, id= null ) {

    // if no id is provided, find the firs slot that is free
    if( id === null ) {
      for( id= 0; id!= this.panels.length; id++ ) {
        if( this.panels[id] === null ) {
          break;
        }
      }
    }

    return new LedPanel( pos, id, this.editor, false );  // create new led panel obj
                                                        // ...don't request screen yet
  }

  // Attach panel to panel rendering list
  this.attachPanel= function( p ) {
    let id= p.panelId;

    // fill array with empty slots if id is greater than the length of the array
    while( this.panels.length <= id ) {
      this.panels.push( null );
    }

    // expect to find an empty slot to write to
    if( this.panels[id] !== null ) {
      throw Error( "Led Panel slot is already occupied on the map array: "+ id );
    }

    this.panels[id]= p;

    if( p.panelLegId >= 0 ) {
      // save panelLegIndex in temporal variable
      // and set it to zero for panel
      // if not done attachPanel to leg would throw error "already attached"
      let index= p.panelLegIndex;
      p.panelLegIndex= -1;
      this.legs.attachPanel( p.panelLegId, p.panelId, index );
    }
  }

  // remove panel from map by id
  this.removePanel= function( pid ) {
    if( pid < this.panels.length ) {
      if( this.panels[pid] !== null ) {
        this.panels[pid].destroy();
        this.panels[pid]= null;
      }
    }
  }

  this.get= function( id ) {
    return (this.panels.length > id) ? this.panels[id] : null;
  }

  this.update= function() {

  }

  this.draw= function( showLegs= false ) {
    let p5= this.editor.p5;
    p5.push();

    // Draw panels to the screen
    for( let i= 0; i!= this.panels.length; i++ ) {
      if( this.panels[i] !== null ) {
        this.panels[i].draw( this.rederDisabled );
      }
    }

    // Projection
    this.projection.draw( this.editor, p5 );

    // Selection
    this.selection.show();

    if( showLegs === true ) {
      this.legs.render();
    }

    p5.pop();
  }

}


/*
* ActionStack Class that keeps track which tool is active and intracts
* with it by sending events
*/
function ActionStack( e ) {

  // Push a new action on to the action stack
  this.pushAction= function( type, data ) {
    if( this.actionIndex !== this.actions.length-1 ) {
      this.actions.length= ( this.actionIndex < 0 ) ? 0 : this.actionIndex+1;
    }
    this.actions.push( { tip: this.curTip, action: type, info: data } );
    this.actionIndex++;
  }

  // Go down in the action stack once and request an 'Undo' from the tool-tip
  this.eventUndo= function() {
    if( this.actionIndex !== -1 ) {
      let action= this.actions[this.actionIndex];
      action.tip.intf.eventUndo( this, action.type, action.info );

      this.actionIndex--;
    }
  }

  // Go up in the action stack once and request a 'Redo' from the tool-tip
  this.eventRedo= function() {
    if( this.actionIndex <= this.actions.length-2 ) {
      this.actionIndex++;

      let action= this.actions[this.actionIndex];
      action.tip.intf.eventRedo( this, action.type, action.info );
    }
  }

  this.eventDraw=         function( p5 ) { this.curTip.intf.eventDraw( this, p5 ); }
  this.eventDoubleClick=  function( p )  { this.curTip.intf.eventDoubleClick( this, p.copy() );                                        }
  this.eventMousePress=   function( p )  { this.mouseDragBegin= p.copy(); this.curTip.intf.eventMousePress( this, p.copy() );          }

  this.eventMouseRelease= function( p ) {
    this.curTip.intf.eventMouseRelease( this, this.mouseDragBegin, p.copy(), this.hasDragged );
    this.mouseDragBegin= null;
  }

  this.eventClick= function( p ) {
    if( !this.hasDragged ) {                          // only register click, if no dragging happend
      this.curTip.intf.eventClick( this, p.copy() );
    }

    this.hasDragged= false;
  }

  this.eventMouseDrag= function( p ) {
    this.hasDragged= true;

    if( this.mouseDragBegin !== null ) {
      this.curTip.intf.eventMouseDrag( this, this.mouseDragBegin, p );
    }
  }

  this.addToolTip= function( t ) {
    this.toolTips.set( t.intf.name, t );
  }

  this.setToolTip= function( nm, dt= null ) {
    if( this.curTip !== null ) {          // deactivate current tool
      this.curTip.intf.eventDeactivate( this );
    }

    if( typeof nm !== 'undefined' ) {     // if no tool name is specified, use the first one
      this.curTip= this.toolTips.get( nm ) || this.toolTips.values().next().value || null;
    } else {
      this.curTip= this.toolTips.values().next().value || null;
    }

    if( this.curTip === null ) {
      throw Error( 'Unable to find tool tip: '+ nm + ' or the default tip ' );
    }

    this.curTip.intf.eventActivate( this, dt ); // activate new tool

  }


  this.createMessageBox= function( win ) {
    if( this.msgBox === null ) {
      this.msgBox= win;
      ui.interface.createMessageBox( win );

    } else {
      console.error( 'Cannot open another message box.' );
    }
  }

  this.eventChildClosed= function() {
    if( this.msgBox !== null ) {
      this.curTip.intf.eventChildClosed( this, this.msgBox );
    }
    this.msgBox= null;
  }

  this.eventChildSubmit= function( ev ) {
    switch( ev.desc ) {

      case 'grid-event':
        this.editor.setGridResolution(ev.gridValue, ev.gridUnit);
        break;

      case 'panel-config-event':
        this.curTip.intf.eventChildSubmit( this, this.msgBox, ev );
        break;

      default:
        console.error( "Unknown event descriptor on Action Stack: "+ ev.desc );
        break;
    }
  }

  this.hasDragged= false;
  this.editor= e;
  this.actions= [];
  this.toolTips= new Map();

  this.msgBox= null;

  this.actionIndex= -1;
  this.curTip= null;

  this.addToolTip( new Tools.CursorTip() );
  this.addToolTip( new Tools.PanelMoveTip() );
  this.addToolTip( new Tools.PanelDeleteTip() );
  this.addToolTip( new Tools.PanelPlaceTip() );
  this.addToolTip( new Tools.LegConnectTip() );
  this.addToolTip( new Tools.PanelDetachTip() );
  this.addToolTip( new Tools.ScreenResizeTip() );
  this.setToolTip();                        // enable cursor tip as default tooltip

  this.mouseDragBegin= null;

}



/*
*   Editor Class that interfaces with the controls and UI,
*   and holds the actual rendering framework
*/
function Editor( i, cnf ) {

  this.updateCanvas= function( up ) {
    let x= this.canvasDiv.clientWidth;
    let y= this.canvasDiv.clientHeight;

    if( (typeof up === 'undefined') || ( up === true ) ) {
      this.originOffset.add((x-this.canvasWidth), 0);       // compensate for the movement of the x-origin
    }

    this.canvasWidth= x;
    this.canvasHeight= y;
    this.p5.resizeCanvas( x, y, true );
  }

  this.getScaledPos= function( x, y ) {
    return this.p5.createVector( x* this.scale, y* this.scale );
  }

  // check if the mouse courser hovers over the canvas
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

  // get canvas (0,0) cordinates on the map
  this.getCanvasOrigin= function() {
    return vectorInvert( p5Module.Vector.add( this.originOffset, this.positionOffset ) );
  }

  // update rendering gscale
  this.setScale= function( s ) {
    this.scale= s;
    this.grid.updateMousePosition();
    this.map.updateMousePosition();
  }

  // Draw the cursor ring on the grid
  this.drawGridCursor= function() {
    let p5= this.p5;

    p5.push();
    p5.stroke(this.complementCol);
    p5.strokeWeight(3);
    p5.line(-10, 0, 10, 0);
    p5.line(0, -10, 0, 10);

    // show the mouse cursor on the canvas grid as a little circle
    if( this.config.showCursor === true ) {
      if( this.clickPosition === null ) {
        if( this.mouseInCanvas() ) {
          p5.noFill();
          p5.stroke('#31bff7');
          let {x,y} = this.grid.mousePixelPos;
          p5.ellipse( x, y, 8);
        }
      }
    }

    p5.pop();
  }

  /* Render Callbacks to P5.js */
  this.p5Renderer= function(p5) {
    let self= this;

    p5.setup= function() {
      LedPanel.init( p5 );

      self.canvas = p5.createCanvas( 400, 400, p5.P2D );
      self.updateCanvas( false );

      self.grid.updateMousePosition();        // get inital value for mouse position
      self.map.updateMousePosition();

      self.canvas.mouseMoved( function() {    // add listener for mouse movement on the canvas
          self.grid.updateMousePosition();
          self.map.updateMousePosition();
        } );
    }

    p5.draw= function() {
      p5.background( self.backColor );

      self.translateOffset();   // set map offset

      self.grid.render();       // render the grid

      /*p5.fill('#fae');          // test circle
      let pos= self.getScaledPos(500, 500);
      p5.ellipse(pos.x, pos.y, 90* self.scale );*/

      // if( self.frenderer.screens.arr.length !== 0 ) {
      //   p5.image( self.frenderer.screens.arr[0].curImage ,0,0 ); // <- Just testing if the renderer did it right
      //   p5.image( self.frenderer.screens.arr[1].curImage ,50,0 ); // <- Just testing if the renderer did it right
      // }
      // self.frenderer.loadFrames([0, 1]);
      // self.frenderer.begin();   // run the renderer

      // Rendering additional elements
      // draw the origin cross at (0,0)
      if( self.allowGridCursor === true ) {
        self.drawGridCursor();
      }

      self.map.draw( true );                // draw elements on the map
      self.actions.eventDraw( p5 );   // let the tooltip draw if it needs to


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
      if( self.mouseInCanvas() ) {
        if( p5.mouseButton === p5.RIGHT ) {
            self.clickPosition= p5.createVector(p5.mouseX, p5.mouseY);  // save clicking position to track cursor movement
            self.lastPositionOffset= self.positionOffset.copy();        // save old position to calculate offset from it

        } else if( p5.mouseButton === p5.LEFT ) {                       // left click controls the tooltip
          self.actions.eventMousePress( self.map.mouseMapPos );
        }
      }
    }

    p5.mouseDragged= function() {
      if( p5.mouseButton === p5.RIGHT ) {
        if( self.clickPosition !== null ) { // calculate new position as offset from old position with curosr movement
          self.positionOffset= p5Module.Vector.add( self.lastPositionOffset, vectorSub(p5.mouseX, p5.mouseY, self.clickPosition) );
          document.body.style.cursor= '-webkit-grabbing'; //grabbing-hand cursor
          //p5.cursor( p5.HAND );
        }

      } else if( p5.mouseButton === p5.LEFT ) {               // left click controls the tooltip
        self.actions.eventMouseDrag( self.map.mouseMapPos );
      }
    }

    p5.mouseReleased= function() {
      self.clickPosition= null;     // reset click position to stop dragging calculation
      document.body.style.cursor= 'auto'; //default cursor

      self.actions.eventMouseRelease( self.map.mouseMapPos );
    }

    p5.doubleClicked= function() {
      if( self.mouseInCanvas() ) {
        self.actions.eventDoubleClick( self.map.mouseMapPos );
      }
    }

    p5.mouseClicked= function() {
      if( self.mouseInCanvas() ) {
        self.actions.eventClick( self.map.mouseMapPos );
      }
    }

    p5.mouseWheel= function( event ) {
      if( self.mouseInCanvas() ) {      // only respond if the cursor is in the canvas

        if( self.isPressed( p5.CONTROL ) ){       // zoom if control is pressed
          self.setScale( self.scale* (1+(event.delta/-2000)) );

        } else if( self.isPressed( p5.SHIFT ) ) { // pan left/right if shift is pressed
          self.positionOffset.x+= (event.delta *0.75);

        } else {                                  // pan up/down as default
          self.positionOffset.y-= (event.delta *0.75);
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
    this.setScale( 1 );
  }

  // Load anmiation
  this.loadAnimation= function( path ) {
    if( this.anmFile !== null ) {
      this.unloadAnmiation();
    }
    this.anmFile= new AnimationFile( this.appInterface, path, this.timeline );
  }

  // Unload anmiation
  this.unloadAnmiation= function() {
    this.anmFile.close();
    this.anmFile= null;
  }

  // Set grid resolution
  this.setGridResolution= function( v, u ) {
    this.grid.setGridWithUnit( v, u );
  }

  /* Constructor */
  this.appInterface= i;
  this.config= new Common.DefaultConfig(  cnf,
                                          { ankorName: null, backColor: 'white', compColor: 'black', gridColor: 'red', friendlyErrors: false, showCursor: true,
                                            mouseCb: function(){}, gridCb: function() {} },
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
  this.grid= new Grid( this, this.config.gridColor, this.config.mouseCb, this.config.gridCb );
  this.map= new EditorMap( this );
  this.actions= new ActionStack( this );

  this.timeline= new Render.TimeLine();
  this.frenderer= new Render.FrameRenderer( this.timeline );
  this.anmFile= null;

  /*let timelinebuff= new ArrayBuffer( 48*48*3 );
  let tv= new DataView( timelinebuff );
  for(let i= 0; i< tv.byteLength; i+= 3 ) {
    if( (Math.trunc(i/1152)%2 == 0) && ( i !== 0 ) ) {
      tv.setUint8(i, 224);
      tv.setUint8(i+1, 47);
      tv.setUint8(i+2, 138);
    } else {
      tv.setUint8(i, 47);
      tv.setUint8(i+1, 85);
      tv.setUint8(i+2, 224);
    }
  }
  this.timeline.addFrame( 0, 0, 'e', timelinebuff );

  let timelinebuff2= new ArrayBuffer( 48*48*3 );
  let tv2= new DataView( timelinebuff2 );
  for(let i= 0; i< tv2.byteLength; i+= 3 ) {
    if( (Math.trunc(i/1152)%2 == 0) && ( i !== 0 ) ) {
      tv2.setUint8(i, 47);
      tv2.setUint8(i+1, 85);
      tv2.setUint8(i+2, 224);
    } else {
      tv2.setUint8(i, 224);
      tv2.setUint8(i+1, 47);
      tv2.setUint8(i+2, 138);
    }
  }
  this.timeline.addFrame( 0, 1, 'e', timelinebuff2 );*/

  let self= this;
  this.p5= new p5Module( function(p5) { self.p5Renderer(p5); }, this.config.ankorName );
  this.p5.disableFriendlyErrors= !this.config.friendlyErrors;

  this.originOffset= this.p5.createVector(0, 0);
  this.positionOffset= this.p5.createVector(0, 0);
  this.lastPositionOffset= this.p5.createVector(0, 0);
  this.backColor= this.p5.color( this.config.backColor );
  this.complementCol= this.p5.color( this.config.compColor );
  this.clickPosition= null;
  this.compiler= new Compiler(this);
}

module.exports.Editor= Editor;
