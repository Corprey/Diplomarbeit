'use strict'
const Common= require( './common.js' );

// trace ( im screen?) Y
// min ein Panel? Y
// alle Panele an Leg attached? Y
// min ein Strang? Y
// Anzahl Stränge kleiner/gleich 4 Y
// Strang eh nicht mehr als 8 Panele? Y

function Compiler(e) {

  this.editor= e;
  this.maxLegs= 4;       //define maximum amount of legs
  this.maxPanels= 8;     //define maximum amount of panels per leg

  //start compilation process
  this.startComp= function() {

    let errorPanel= this.editor.map.projection.tracePanels();
    if( errorPanel !== null) {
      ui.uiConsole.printError("Panel " + errorPanel.panelId + " not in screen area!");
      ui.uiConsole.printWarning("Stopped compilation process!");
      return false;
    }

    let panelArr= this.editor.map.panels;
    let panelCount= 0;
    for(let i= 0; i<panelArr.length; i++) {
      if( panelArr[i] !== null ) {
        panelCount++;
        if(panelArr[i].panelLegId === -1) {
          ui.uiConsole.printError("Panel " + panelArr[i].panelId + " not attached to any chain!");
          ui.uiConsole.printWarning("Stopped compilation process!");
          return false;
        }
      }
    }

    if( panelCount === 0 ) {
      ui.uiConsole.printError("No Panel placed!");
      ui.uiConsole.printWarning("Stopped compilation process!");
      return false;
    }

    let legArr= this.editor.map.legs.arr;
    let legCount= 0;
    for(let i= 0; i<legArr.length; i++) {
      if( legArr[i] !== null ) {
        legCount++;
        if(legArr[i].arr.length > this.maxPanels) {
          ui.uiConsole.printError("Too many panels on chain " + i + ". Maximum is 8 panels.");
          ui.uiConsole.printWarning("Stopped compilation process!");
          return false;
        }
      }
    }

    if( legCount > this.maxLegs) {
      ui.uiConsole.printError("Too many chains! Maximum is 4 chains.");
      ui.uiConsole.printWarning("Stopped compilation process!");
      return false;
    }

    ui.uiConsole.println("Compilation process done!");
  }
}

module.exports.Compiler= Compiler;
