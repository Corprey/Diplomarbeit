
function ActionInterface( o, nm, fns ) {

  this.name= nm;
  this.obj= o;

  let def= function() {};
  this.eventActivate=     fns[0] ? function() { fns[0].apply(this.obj, arguments ); } : def;
  this.eventDeactivate=   fns[1] ? function() { fns[1].apply(this.obj, arguments ); } : def;
  this.eventDoubleClick=  fns[2] ? function() { fns[2].apply(this.obj, arguments ); } : def;
  this.eventMousePress=   fns[3] ? function() { fns[3].apply(this.obj, arguments ); } : def;
  this.eventMouseRelease= fns[4] ? function() { fns[4].apply(this.obj, arguments ); } : def;
  this.eventMouseDrag=    fns[5] ? function() { fns[5].apply(this.obj, arguments ); } : def;
  this.eventDraw=         fns[6] ? function() { fns[6].apply(this.obj, arguments ); } : def;
}


/*
* CursorTip
*
*/
function CursorTip() {

  this.actv= function( ast ) {
    ast.editor.allowGridCursor= true;
  }


  this.dblClick= function() { console.log("Double click!"); }

  // Drag Event: Draw Selection
  this.drag= function( ast, begin, distance ) {
    ast.editor.allowGridCursor= false;
    ast.editor.map.mkSelection( begin, distance );
  }

  // Release Event: Finalize Selection
  this.release= function( ast ) {
    ast.editor.allowGridCursor= true;
    ast.editor.map.endSelection();
  }

  this.intf= new ActionInterface( this, 'cursor-tip', [this.actv, null, this.dblClick, null, this.release, this.drag, null]);
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

  this.click= function( ast ) {
    this.panel.select( false );
    this.panel.requestScreen();
    ast.editor.map.attachPanel( this.panel );
    console.log( ast.editor.map.panels )
    this.actv( ast );
  }

  this.end= function( ast ) {
    this.panel= null;
  }

  this.intf= new ActionInterface( this, 'panel-place', [this.actv, this.end, null, this.click, null, null, this.draw]);
}



module.exports.CursorTip= CursorTip;
module.exports.PanelPlaceTip= PanelPlaceTip;
