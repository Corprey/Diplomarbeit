
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
    if( this.clickPanel !== null ) {
      ast.editor.map.selection.invertSelectPanel( this.clickPanel );
    }

    console.log( ast.editor.map.selection.selection );
  }

  this.press= function( ast, pos ) {
    let p5= ast.editor.p5;
    this.clickPanel= ast.editor.map.selection.tracePoint( pos );

    if( ast.editor.isPressed( p5.CONTROL ) === false ) {
      if( (this.clickPanel === null) || ( (this.clickPanel !== null) && (!this.clickPanel.selected) ) ) {
        ast.editor.map.selection.flush();
      }
    }

    console.log( ast.editor.map.selection.selection );
  }

  // Drag Event: Draw Selection
  this.drag= function( ast, begin, distance ) {

    if( this.clickPanel !== null ) {
      if( this.clickPanel.selected === true ) {
        if( ast.editor.isPressed( ast.editor.p5.CONTROL ) === false ) {
          console.log("switch");
        }
      }
    }

    ast.editor.allowGridCursor= false;
    ast.editor.map.selection.mkSelection( begin, distance );
  }

  // Release Event: Finalize Selection
  this.release= function( ast, begin, end, dragged ) {
    ast.editor.allowGridCursor= true;

    // Don't even evaluate a drag area with a magnitude smaller than
    // ... could also be a click
    if( dragged && end.sub( begin ).mag() > 10 ) {
      ast.editor.map.selection.endSelection();
      console.log( ast.editor.map.selection.selection );
    } else {
      ast.editor.map.selection.resetSelectionArea();
    }
  }

  this.intf= new ActionInterface( this, 'cursor-tip', [this.actv, null, this.dblClick, this.click, this.press, this.release, this.drag, null]);
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

  this.draw= function( ast, p5 ) {
    this.panel.position= ast.editor.grid.mouseMapPos;
    this.panel.draw( true );
  }

  this.press= function( ast ) {
    this.panel.select( false );
    this.panel.requestScreen();
    ast.editor.map.attachPanel( this.panel );
    console.log( ast.editor.map.panels );

    //ast.pushAction()

    this.actv( ast );
  }

  this.end= function( ast ) {
    this.panel= null;
  }

  this.intf= new ActionInterface( this, 'panel-place', [this.actv, this.end, null, null, this.press, null, null, this.draw]);
}



module.exports.CursorTip= CursorTip;
module.exports.PanelPlaceTip= PanelPlaceTip;
