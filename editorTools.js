
function ActionInterface( nm, fns ) {

  this.name= nm;

  let def= function() {};
  this.eventActivate=     fns[0] || def;
  this.eventDeactivate=   fns[1] || def;
  this.eventDoubleClick=  fns[2] || def;
  this.eventMousePress=   fns[3] || def;
  this.eventMouseRelease= fns[4] || def;
  this.eventMouseDrag=    fns[5] || def;
}


function CursorTip() {

  this.actv= function( as ) {
    as.editor.allowGridCursor= true;
  }


  this.dblClick= function() { console.log("Double click!"); }

  // Drag Event: Draw Selection
  this.drag= function( as, begin, distance ) {
    as.editor.allowGridCursor= false;
    as.editor.map.mkSelection( begin, distance );
  }

  // Release Event: Finalize Selection
  this.release= function( as ) {
    as.editor.allowGridCursor= true;
    as.editor.map.endSelection();
  }

  this.intf= new ActionInterface( 'cursor-tip', [this.actv, null, this.dblClick, null, this.release, this.drag]);
}



module.exports.CursorTip= CursorTip;
