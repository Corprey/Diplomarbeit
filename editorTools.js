
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

          ast.editor.map.selection.resetSelectionArea(); // prevent glitching selection area showing up
          ast.setToolTip( 'panel-move' );                // switch tool tip to 'move-tip'

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

  this.intf= new ActionInterface( this, 'cursor-tip', [this.actv, null, this.dblClick, this.click, this.press, this.release, this.drag, null]);
}


function PanelMoveTip() {

  this.prevMouseGridPos= null;

  this.actv= function( ast ) {
    this.prevMouseGridPos= ast.editor.grid.mouseMapPos.copy();  // get initial mouse value
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
    ast.setToolTip( 'cursor-tip' );   // go back to simple cursor

    ast.editor.allowGridCursor= true;
    console.log( 'back' );
  }


  this.intf= new ActionInterface( this, 'panel-move', [this.actv, null, null, null, null, this.release, this.drag, null]);

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

    //ast.pushAction()

    this.actv( ast ); // get new panel to hang of the tool-tip
  }

  this.end= function( ast ) {
    this.panel= null;
  }

  this.intf= new ActionInterface( this, 'panel-place', [this.actv, this.end, null, null, this.press, null, null, this.draw]);
}



module.exports.CursorTip= CursorTip;
module.exports.PanelPlaceTip= PanelPlaceTip;
module.exports.PanelMoveTip= PanelMoveTip;
