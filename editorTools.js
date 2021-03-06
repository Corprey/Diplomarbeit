
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
          e.map.legs.detachPanel(lid, pid); // detach Panel from leg
          e.map.legs.attachPanel(lid, pid, ev.index); //reattach it to new position
        }
      }

      if( Object.keys(changes).length > 0 ) {
        // push new action
        ast.pushAction( 'panel-config', {panelId: pid, changes: changes } );
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

//Panel Tip that deletes all selected panels
function PanelDeleteTip() {

  this.actv= function( ast ) {
    let ids= ast.editor.map.selection.getIds();
    let panelObjects= [];
    let panelLegIds= [];
    let panelLegColor= [];
    let panelLegIndices= [];

    // save data of every deleted Panel to array
    for( let i= 0; i!= ids.length; i++ ) {
      panelObjects[i]= ast.editor.map.get(ids[i]);
      panelLegIds[i]= panelObjects[i].panelLegId;
      panelLegIndices[i]= panelObjects[i].panelLegIndex;
      if(panelObjects[i].panelLegId !== -1) {
        panelLegColor[i]= ast.editor.map.legs.arr[ panelLegIds[i] ].getHexColor();
      }
      ast.editor.map.removePanel( ids[i] );
    }

    if(panelObjects.length > 0) {
      ast.pushAction( 'panel-delete', { panelObjects: panelObjects, legIds: panelLegIds,
                                        legIndices: panelLegIndices, legColor: panelLegColor
                                      } );
    }
    ast.setToolTip( 'cursor-tip' );   // go back to simple cursor
  }

  this.undo= function( ast, t, d ) {
    // for each panel which has been deleted
    for( let i= d.panelObjects.length-1; i >= 0; i-- ) {
      d.panelObjects[i].requestScreen();
      if(d.legIds[i] !== -1) {
        // if leg was deleted -> recreate leg
        if(ast.editor.map.legs.get(d.legIds[i]) === null) {
          //recreate leg with last color
          ast.editor.map.legs.addLeg(d.legIds[i]);
          ast.editor.map.legs.arr[d.legIds[i]].setHexColor(d.legColor[i]);
          // set background color of sidebar Leg element
          let ele= document.getElementById("panelLegHolder");
          ele.legArray[d.legIds[i]].childNodes[0].style.backgroundColor= d.legColor[i];
        }
      }
      // reassign lost Leg data
      d.panelObjects[i].panelLegId= d.legIds[i];
      d.panelObjects[i].panelLegIndex= d.legIndices[i];
      // recreate Panel
      ast.editor.map.attachPanel( d.panelObjects[i] );

    }
  }

  this.redo= function( ast, t, d ) {
    for( let i= 0; i!= d.panelObjects.length; i++ ) {
      ast.editor.map.removePanel( d.panelObjects[i].panelId );
    }
  }

  this.intf= new ActionInterface( this, 'panel-delete', [this.actv, null, null, null, null, null, null, null, this.undo, this.redo]);

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

    ast.pushAction( 'panel-place', { pos: this.panel.position.copy(), panelObj: this.panel } );

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


// Tip that connects clicked Panels to leg
function LegConnectTip() {

  this.clickPanel= null;
  this.lastPanel= null;
  this.legId= null;

  this.actv= function( ast, lid= null ) {

    // Set cursor for workspace to cell (big plus)
    document.body.style.cursor= 'cell';
    this.legId= lid;
    // if Leg button in sidebar clicked
    if(this.legId !== null) {
      let leg= ast.editor.map.legs.get(this.legId);
      let lastPid= leg.arr[leg.arr.length -1];
      this.lastPanel= ast.editor.map.get(lastPid);
    }
  }

  this.end= function( ast ) {
    // Set cursor to standard
    document.body.style.cursor= "auto";
    this.legId= null;
    this.lastPanel= null;
    this.clickPanel= null;
  }

  this.click= function( ast, pos ) {
    document.body.style.cursor= 'cell';
    this.clickPanel= ast.editor.map.selection.tracePoint( pos );
    if( this.clickPanel !== null ) {
       // if toolbar button was clicked
      if(this.legId === null) {
        // if panel has no current leg, create new and attach to it
        if(this.clickPanel.panelLegId === -1 ) {
          let lid;
          this.legId= ( (lid= ast.editor.map.legs.addLeg()) !== false ) ? lid : null;
          this.attachToLeg(ast);
        }
         // if panel already attached to leg
        else {
          this.legId= this.clickPanel.panelLegId;
        }
      }
      // if button in sidebar was clicked
      else {
        this.attachToLeg(ast);
      }
      let leg= ast.editor.map.legs.get(this.legId);
      let lastPid= leg.arr[leg.arr.length -1];
      this.lastPanel= ast.editor.map.get(lastPid);
    }
  }

  this.attachToLeg= function(ast) {
    if(this.legId !== null) {
      if( (ast.editor.map.legs.attachPanel(this.legId, this.clickPanel.panelId)) !== false) {
        let color= ast.editor.map.legs.arr[this.legId].getHexColor();
        ast.pushAction( 'leg-connect', {lid: this.legId, pid: this.clickPanel.panelId, color: color} );
      }
    }
  }

  this.draw= function( ast, p5 ) {
    if(( this.legId !== null ) && ( this.lastPanel !== null )) {

      let leg= ast.editor.map.legs.get( this.legId );
      if( leg !== null ) {
        p5.push();

        let beg= leg.calcOffset( ast.editor, this.lastPanel.position );
        let mouse= ast.editor.getCanvasOrigin().add( p5.mouseX, p5.mouseY );

        p5.stroke( leg.getHexColor() );
        p5.strokeWeight( 5 );
        p5.line( beg.x, beg.y, mouse.x, mouse.y );

        p5.pop();
      }
    }
  }

  this.undo= function( ast, t, d ) {
    this.legId= (d.lid !== null) ? d.lid : null;
    ast.editor.map.legs.detachPanel(d.lid, d.pid);
  }

  this.redo= function( ast, t, d ) {
    this.legId= d.lid;

    // if leg has been removed by undo
    if(ast.editor.map.legs.get(d.lid) === null) {
      //recreate leg with last color
      ast.editor.map.legs.addLeg(d.lid);
      ast.editor.map.legs.arr[d.lid].setHexColor(d.color);

      // set background color of sidebar Leg element
      let ele= document.getElementById("panelLegHolder");
      ele.legArray[d.lid].childNodes[0].style.backgroundColor= d.color;
    }
    ast.editor.map.legs.attachPanel(d.lid, d.pid);
  }

  this.intf= new ActionInterface( this, 'leg-connect', [this.actv, this.end, null, null, null, this.click, null, this.draw, this.undo, this.redo]);

}

// Tip that detaches clicked panels from their leg
function PanelDetachTip () {

  this.clickPanel= null;
  this.legId= null;

  this.actv= function( ast ) {
    // Set cursor for workspace to custom cursor (big minus)
    document.body.style.cursor= "url(./icons/cursor_minus.svg), pointer";
  }

  this.end= function( ast ) {
    // Set cursor to standard
    document.body.style.cursor= "auto";
    this.legId= null;
    this.clickPanel= null;
  }

  this.click= function( ast, pos ) {
    document.body.style.cursor= "url(./icons/cursor_minus.svg), pointer";
    this.clickPanel= ast.editor.map.selection.tracePoint( pos );
    this.legId= (this.clickPanel !== null) ? this.clickPanel.panelLegId : -1;
    if(this.legId !== -1) {
      let leg= ast.editor.map.legs.get(this.legId);
      if(leg !== null) {
        let color= ast.editor.map.legs.arr[this.legId].getHexColor();
        let index= this.clickPanel.panelLegIndex;
        ast.editor.map.legs.detachPanel(this.legId, this.clickPanel.panelId);
        ast.pushAction( 'panel-detach', {lid: this.legId, pid: this.clickPanel.panelId, index: index, color: color} );
      }
    }
  }

  this.undo= function( ast, t, d ) {
    // if leg has been removed
    if(ast.editor.map.legs.get(d.lid) === null) {
      //recreate leg with last color
      ast.editor.map.legs.addLeg(d.lid);
      ast.editor.map.legs.arr[d.lid].setHexColor(d.color);

      // set background color of sidebar Leg element
      let ele= document.getElementById("panelLegHolder");
      ele.legArray[d.lid].childNodes[0].style.backgroundColor= d.color;
    }
    ast.editor.map.legs.attachPanel(d.lid, d.pid, d.index);
  }

  this.redo= function( ast, t, d ) {
    ast.editor.map.legs.detachPanel(d.lid, d.pid);
  }

  this.intf= new ActionInterface( this, 'panel-detach', [this.actv, this.end, null, null, null, this.click, null, null, this.undo, this.redo]);

}

function ScreenResizeTip() {

  this.actv= function (ast, dat) {
    ast.pushAction( 'screen-resize', dat );
  }

  this.end= function(ast) {
  }

  this.undo= function (ast, t, d) {
    this.swapConfig(ast, d);
  }

  this.redo= function (ast, t, d) {
    this.swapConfig(ast, d);
  }

  this.swapConfig= function (ast, d) {
    ui.uiScreenMenu.setPosition(d);
    let helppos= d.pos.copy();
    let helpdim= d.dim.copy();
    let helpResX= d.resX;
    let helpResY= d.ResY;
    d.pos= ast.editor.map.projection.position.copy();
    d.dim= ast.editor.map.projection.dimensions.copy();
    d.resX= ast.editor.map.projection.resolution.width;
    d.resY= ast.editor.map.projection.resolution.height;
    ast.editor.map.projection.position= helppos.copy();
    ast.editor.map.projection.dimensions= helpdim.copy();
    ast.editor.map.projection.resolution.width= helpResX;
    ast.editor.map.projection.resolution.height= helpResY;




  }

  this.intf= new ActionInterface( this, 'screen-resize', [this.actv, this.end, null, null, null, null, null, null, this.undo, this.redo]);

}

module.exports.CursorTip= CursorTip;
module.exports.PanelMoveTip= PanelMoveTip;
module.exports.PanelDeleteTip= PanelDeleteTip;
module.exports.PanelPlaceTip= PanelPlaceTip;
module.exports.LegConnectTip= LegConnectTip;
module.exports.PanelDetachTip= PanelDetachTip;
module.exports.ScreenResizeTip= ScreenResizeTip;
