
// Chack if all 2D-components of a vector are zero
function vectorZero( v ) {
  return (v.x === 0) && (v.y === 0);
}


function ActionInterface( o, nm, fns ) {

  this.name= nm;
  this.obj= o;

  let def= function() {};
  this.eventActivate=     fns[0] ? function() { fns[0].apply(this.obj, arguments ); } : def;
  this.eventDeactivate=   fns[1] ? function() { fns[1].apply(this.obj, arguments ); } : def;
  this.eventDoubleClick=  fns[2] ? function() { fns[2].apply(this.obj, arguments ); } : def;
  this.eventClick=        fns[3] ? function() { fns[3].apply(this.obj, arguments ); } : def;
  this.eventMousePress=   fns[4] ? function() { fns[4].apply(this.obj, arguments ); } : def;
  this.eventMouseRelease= fns[5] ? function() { fns[5].apply(this.obj, arguments ); } : def;
  this.eventMouseDrag=    fns[6] ? function() { fns[6].apply(this.obj, arguments ); } : def;
  this.eventDraw=         fns[7] ? function() { fns[7].apply(this.obj, arguments ); } : def;
  this.eventUndo=         fns[8] ? function() { fns[8].apply(this.obj, arguments ); } : def;
  this.eventRedo=         fns[9] ? function() { fns[9].apply(this.obj, arguments ); } : def;
}


/*
* CursorTip
*
*/
function CursorTip() {

  this.clickPanel= null;

  this.actv= function( ast ) {
    ast.editor.allowGridCursor= true;
  }

  this.dblClick= function() { console.log("Double click!"); }

  this.click= function( ast, pos ) {
    // If a panel was clicked, invert its selecetion status
    if( this.clickPanel !== null ) {
      ast.editor.map.selection.invertSelectPanel( this.clickPanel );
    }
  }

  this.press= function( ast, pos ) {
    let p5= ast.editor.p5;
    this.clickPanel= ast.editor.map.selection.tracePoint( pos );  // Check if a panels was clicked

    // Only remove the current selection if no panel was clicked or if the clicked panel
    // ... was not yet selected (keep panels selected for dragging)
    // ... and always keep them if 'ctrl' is currently pressed
    if( ast.editor.isPressed( p5.CONTROL ) === false ) {
      if( (this.clickPanel === null) || ( (this.clickPanel !== null) && (!this.clickPanel.selected) ) ) {
        ast.editor.map.selection.flush();
      }
    }
  }

  // Drag Event: Draw Selection
  this.drag= function( ast, begin, pos ) {

    // If the user drags over an already selected panel and 'ctrl' is not currently held down,
    // ... move all selected panels by switching to the move-tool-tip
    if( this.clickPanel !== null ) {
      if( this.clickPanel.selected === true ) {
        if( ast.editor.isPressed( ast.editor.p5.CONTROL ) === false ) {

          ast.editor.map.selection.resetSelectionArea();   // prevent glitching selection area showing up
          ast.setToolTip( 'panel-move', this.clickPanel ); // switch tool tip to 'move-tip'

          return;
        }
      }
    }

    // Create new selection area
    ast.editor.allowGridCursor= false;
    ast.editor.map.selection.mkSelection( begin,  ast.editor.p5.createVector(pos.x-begin.x, pos.y-begin.y) );
  }

  // Release Event: Finalize Selection
  this.release= function( ast, begin, end, dragged ) {
    ast.editor.allowGridCursor= true;

    // Don't even evaluate a drag area with a magnitude smaller than
    // ... could also be a click
    if( dragged && ( end.sub( begin ).mag() > 10 ) ) {
      ast.editor.map.selection.endSelection();
      console.log( ast.editor.map.selection.selection );
    } else {
      ast.editor.map.selection.resetSelectionArea();
    }
  }

  this.intf= new ActionInterface( this, 'cursor-tip', [this.actv, null, this.dblClick, this.click, this.press, this.release, this.drag, null, null, null]);
}


/*
* PanelMoveTip that moves a selection around on the map
*
*/
function PanelMoveTip() {

  this.prevMouseGridPos= null;
  this.beginPos= null;
  this.clickPanel= null;

  this.actv= function( ast, p ) {
    this.clickPanel= p;
    let origPos= p.position;

    this.prevMouseGridPos= ast.editor.grid.mouseMapPos.copy();            // get initial mouse value
    this.beginPos= origPos.copy(); // get initial position of a panel

    let x= ast.editor.grid.getNearestSnapPos( origPos.copy() ).sub( origPos ); // get offset to the next grid snapping point
    ast.editor.map.selection.moveBy( x );

    ast.editor.allowGridCursor= false;
  }

  this.drag= function( ast ) {
    let curMouse= ast.editor.grid.mouseMapPos;

    if( this.prevMouseGridPos.equals( curMouse ) === false ) {  // check if mouse position on the grid changed

      ast.editor.map.selection.moveBy( this.prevMouseGridPos.sub( curMouse ).mult( -1 ) );  // move all panels by the offset
      this.prevMouseGridPos= curMouse.copy();                                               // save current value as new-old-value
    }
  }

  this.release= function( ast ) {
    let vec= this.beginPos.mult(-1).add( this.clickPanel.position );  // create new vector storing the position difference
    let ids= ast.editor.map.selection.getIds();   // only save ids instead of pointers, to allow removed panels to be garbage collected

    // only save as an action if somethin actually moved
    if( vectorZero( vec ) === false ) {
      ast.pushAction( 'panel-move', {movement: vec, panelIds: ids } );
    }

    ast.setToolTip( 'cursor-tip' );   // go back to simple cursor
    ast.editor.allowGridCursor= true;
  }

  // Move panels backwards
  this.undo= function( ast, t, d ) {
    ast.editor.map.selection.fromIds( d.panelIds );
    ast.editor.map.selection.moveBy( d.movement.copy().mult(-1) );
  }

  // Move panels forwards again
  this.redo= function( ast, t, d ) {
    ast.editor.map.selection.fromIds( d.panelIds );
    ast.editor.map.selection.moveBy( d.movement );
  }

  this.intf= new ActionInterface( this, 'panel-move', [this.actv, null, null, null, null, this.release, this.drag, null, this.undo, this.redo]);

}

/*
* PanelTip that places panels on the map
*
*/
function PanelPlaceTip() {

  this.panel= null;

  this.actv= function( ast ) {
    this.panel= ast.editor.map.createPanel( ast.editor.grid.mouseMapPos );
    this.panel.select();
  }

  // Draw the panel hanging on the tool-tip
  this.draw= function( ast, p5 ) {
    this.panel.position= ast.editor.grid.mouseMapPos;
    this.panel.draw( true );
  }

  // save panel on the map and request a renderer for it
  this.press= function( ast ) {
    this.panel.select( false );
    this.panel.requestScreen();
    ast.editor.map.attachPanel( this.panel );
    console.log( ast.editor.map.panels );

    ast.pushAction( 'panel-place', { pos: this.panel.position.copy(), panelObj: this.panel } );
    console.log( ast.actions );

    this.actv( ast ); // get new panel to hang of the tool-tip
  }

  this.end= function( ast ) {
    this.panel= null;
  }

  this.undo= function( ast, t, d ) {
    ast.editor.map.removePanel( d.panelObj.panelId );
  }

  this.redo= function( ast, t, d ) {
    d.panelObj.position= d.pos.copy();
    d.panelObj.requestScreen();
    ast.editor.map.attachPanel( d.panelObj );
  }

  this.intf= new ActionInterface( this, 'panel-place', [this.actv, this.end, null, null, this.press, null, null, this.draw, this.undo, this.redo]);
}



module.exports.CursorTip= CursorTip;
module.exports.PanelPlaceTip= PanelPlaceTip;
module.exports.PanelMoveTip= PanelMoveTip;
