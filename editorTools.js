
// Chack if all 2D-components of a vector are zero
function vectorZero( v ) {
  return (v.x === 0) && (v.y === 0);
}


function ActionInterface( o, nm, fns ) {

  this.name= nm;
  this.obj= o;

  let def= function() {};
  this.eventActivate=     fns[0]  ? function() { fns[0].apply(this.obj, arguments ); }  : def;
  this.eventDeactivate=   fns[1]  ? function() { fns[1].apply(this.obj, arguments ); }  : def;
  this.eventDoubleClick=  fns[2]  ? function() { fns[2].apply(this.obj, arguments ); }  : def;
  this.eventClick=        fns[3]  ? function() { fns[3].apply(this.obj, arguments ); }  : def;
  this.eventMousePress=   fns[4]  ? function() { fns[4].apply(this.obj, arguments ); }  : def;
  this.eventMouseRelease= fns[5]  ? function() { fns[5].apply(this.obj, arguments ); }  : def;
  this.eventMouseDrag=    fns[6]  ? function() { fns[6].apply(this.obj, arguments ); }  : def;
  this.eventDraw=         fns[7]  ? function() { fns[7].apply(this.obj, arguments ); }  : def;
  this.eventUndo=         fns[8]  ? function() { fns[8].apply(this.obj, arguments ); }  : def;
  this.eventRedo=         fns[9]  ? function() { fns[9].apply(this.obj, arguments ); }  : def;
  this.eventChildSubmit=  fns[10] ? function() { fns[10].apply(this.obj, arguments ); } : def;
  this.eventChildClosed=  fns[11] ? function() { fns[11].apply(this.obj, arguments ); } : def;

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

  this.dblClick= function( ast ) {

    // If a panel was clicked, invert its selecetion status
    if( this.clickPanel !== null ) {
      this.openPanelWindow( ast, this.clickPanel );
    }
  }

  this.openPanelWindow= function( ast, panelObj ) {
    let e= ast.editor;

    //Window properties
    let win= {width:700, height:438, title:"Panel Settings", html:"wins/panelWindow.html", isUrl: true};

    //Panel
    win.panelId= panelObj.panelId;
    win.fanpower= panelObj.fanpower;
    win.colorCorr= panelObj.colorCorr;

    //Convert position
    win.gridUnit= e.grid.conversion.unit;
    win.pos= {};
    win.pos.x= {}; // can't be written as win.pos.x=win.pos.y={}
    win.pos.y= {}; // because pos.x will always be set to pos.y
    win.pos.x.unit= win.gridUnit;
    win.pos.y.unit= win.gridUnit;
    win.pos.x.value= Math.round(panelObj.position.x/e.grid.conversion.factor());
    win.pos.y.value= Math.round(panelObj.position.y/e.grid.conversion.factor());

    //Define panel Leg parameters for panelWindow
    win.panelLeg= panelObj.panelLegId;
    win.index= panelObj.panelLegIndex;
    let leg= e.map.legs.get( win.panelLeg );

    // Load leg data
    if( leg !== null ) {
      if( (win.parentPanel= leg.previous( win.panelId ) ) === -1 ) {
        win.parentPanel= '-';
      }
      if( (win.childPanel= leg.next( win.panelId ) ) === -1 ) {
        win.childPanel= '-';
      }
    } else {
      // Set dummy value on error
      win.parentPanel= win.childPanel= win.panelLeg= "-";
      win.index= 0;
    }

    //Open panelWindow
    ast.createMessageBox( win );
  }

  this.closed= function( ast, win, ev ) {

    let e= ast.editor;
    let pid= ev.panelId;
    let panel= e.map.get( pid );
    if( panel != null ) {

      let changes= {};

      // check for position values
      if( ev.pos !== undefined ) {
        //calculate new position
        let x= Math.round(ast.editor.grid.conversion.mkFromText( ev.pos.x.value, ev.pos.x.unit ));
        let y= Math.round(ast.editor.grid.conversion.mkFromText( ev.pos.y.value, ev.pos.y.unit ));
        let newPos= ast.editor.p5.createVector( x, y );

        // save old position in changes and set new position
        changes.position= panel.position;
        panel.position= newPos;
      }
      //check for color correction slider values
      if( ev.colorCorr !== undefined ) {
        //set color values
        changes.colorCorr= panel.colorCorr;
        panel.colorCorr= ev.colorCorr;
      }
      //check for fanpower slider value
      if( ev.fanpower !== undefined ) {
        //set fanpower
        changes.fanpower= panel.fanpower;
        panel.fanpower= ev.fanpower;
      }
      //check for panel index for leg
      if( ev.index !== undefined ) {
        //set index if attached to existing leg
        let leg;
        if((leg= e.map.legs.get( panel.panelLegId )) !== null) {
          changes.index= panel.panelLegIndex; //store old panel id in legArray
          lid= panel.panelLegId;
          console.log(ev.index);
          e.map.legs.detachPanel(lid, pid); // detach Panel from leg
          e.map.legs.attachPanel(lid, pid, ev.index); //reattach it to new position
        }
      }

      if( Object.keys(changes).length > 0 ) {
        // push new action
        ast.pushAction( 'panel-config', {panelId: pid, changes: changes } );
        console.log("action-push", changes);
      }else {
        console.log("no action-push");
      }
    }
  }

  this.swapConfig= function( ast, t, d ) {
    let e= ast.editor;
    let pid= d.panelId;
    let changes= d.changes;
    // get panel object
    let panel= ast.editor.map.get( pid );
    if( panel != null ) {

      // swap position
      if( changes.hasOwnProperty( 'position' ) === true ) {
        let curPos= panel.position;
        panel.position= changes.position;
        changes.position= curPos;
      }
      //swap color Correction values
      if( changes.hasOwnProperty( 'colorCorr' ) === true ) {
        let curCorr= panel.colorCorr;
        panel.colorCorr= changes.colorCorr;
        changes.colorCorr= curCorr;
      }
      //swap fanpower values
      if( changes.hasOwnProperty( 'fanpower' ) === true ) {
        let curFanPower= panel.fanpower;
        panel.fanpower= changes.fanpower;
        changes.fanpower= curFanPower;
      }
      //swap panel id in legArray
      if( changes.hasOwnProperty( 'index' ) === true ) {
        let curIndex= panel.panelLegIndex;
        //let leg= e.map.legs.get( panel.panelLegId ); // get index of leg
        let lid= panel.panelLegId;
        e.map.legs.detachPanel(lid, pid); // detach Panel from leg
        e.map.legs.attachPanel(lid, pid, changes.index); //reattach it to new position
        changes.index= curIndex;
      }
    }
  }

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
    } else {
      ast.editor.map.selection.resetSelectionArea();
    }
  }

  this.intf= new ActionInterface( this, 'cursor-tip', [this.actv, null, this.dblClick, this.click, this.press, this.release, this.drag, null, this.swapConfig, this.swapConfig, this.closed]);
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
    let origPos= p.position;
    this.clickPanel= p;

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
    if( this.clickPanel !== null ) {
      let vec= this.beginPos.mult(-1).add( this.clickPanel.position );  // create new vector storing the position difference
      let ids= ast.editor.map.selection.getIds();   // only save ids instead of pointers, to allow removed panels to be garbage collected

      // only save as an action if something actually moved
      if( vectorZero( vec ) === false ) {
        ast.pushAction( 'panel-move', {movement: vec, panelIds: ids } );
      }
    }

    ast.setToolTip( 'cursor-tip' );   // go back to simple cursor
    ast.editor.allowGridCursor= true;
    console.log( 'back' );
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
