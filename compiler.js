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
  this.resFactor= null;
  //start compilation process
  this.startComp= function() {

    // check if Panels are Placed correctly and rules are followed
    if (this.checkPanelPlacement() === false) {
      ui.uiConsole.printWarning("Stopped compilation process!");
      return false;
    }

    // get resolution factor
    this.resFactor= this.editor.map.projection.resolutionFactor();
    console.log(this.resFactor);

    // Sets relative Position to projection Screen for every Panel
    this.setRelativePanelPositions();

    // creates Video frame for animation
    this.createVideoFrame();




    ui.uiConsole.println("Compilation process done!");
  }

  // creates VideoFrame for animation
  this.createVideoFrame= function() {

    // get PixelRatio of display: how many Hardwarepixel on one CSS px
    let pixelRatio= window.devicePixelRatio;
    //let pixelRatio= 2;

    // create Videoframe
    this.frame= document.createElement("VIDEO");
    this.frame.res= {width: null, height: null};

    // set video source
    this.frame.setAttribute("src","./animations/Brezina.mp4");



    // set parameters after videodata is loaded
    this.frame.addEventListener('loadedmetadata', function(e) {

      //this.res.width= this.editor.map.projection.resolution.width;
      //this.res.height= this.editor.map.projection.resolution.height;

      // get width and height od the videodata
      this.res.width= this.videoWidth;
      this.res.height= this.videoHeight;

      // set width and height of videoframe in hardwarepixel
      this.style.width= (Math.ceil(this.res.width/pixelRatio)) + "px";
      this.style.height= (Math.ceil(this.res.height/pixelRatio)) + "px";

      // position the frame in the top left corner
      this.style.position= "absolute";
      this.style.top= "0px";
      this.style.left= "0px";

      // enable controls and autoplay for video frame
      this.controls= true;
      this.autoplay= true;

      // attach frame to body (make it visible)
      document.body.appendChild(this);
    }, false);
  }

  // Sets relative Position to projection Screen for every Panel
  this.setRelativePanelPositions= function() {
    let panelArr= this.editor.map.panels;

    for(let i= 0; i<panelArr.length; i++) {
      if( panelArr[i] !== null ) {
        panelArr[i].getRelativePosition();
      }
    }
  }

  this.checkPanelPlacement= function() {

    // check if a Panel is placed outside of Projection Screen
    let errorPanel= this.editor.map.projection.tracePanels();
    if( errorPanel !== null) {
      ui.uiConsole.printError("Panel " + errorPanel.panelId + " not in screen area!");
      return false;
    }

    // check if all Panels are attached to a leg
    let panelArr= this.editor.map.panels;
    let panelCount= 0;
    for(let i= 0; i<panelArr.length; i++) {
      if( panelArr[i] !== null ) {
        panelCount++;
        if(panelArr[i].panelLegId === -1) {
          ui.uiConsole.printError("Panel " + panelArr[i].panelId + " not attached to any chain!");          return false;
        }
      }
    }

    // check if there is at least one Panel placed
    if( panelCount === 0 ) {
      ui.uiConsole.printError("No Panel placed!");
      return false;
    }

    // check if not too many Panels on single leg
    let legArr= this.editor.map.legs.arr;
    let legCount= 0;
    for(let i= 0; i<legArr.length; i++) {
      if( legArr[i] !== null ) {
        legCount++;
        if(legArr[i].arr.length > this.maxPanels) {
          ui.uiConsole.printError("Too many panels on chain " + i + ". Maximum is " + this.maxPanels + " panels.");
          return false;
        }
      }
    }

    // check if not too many legs exist
    if( legCount > this.maxLegs) {
      ui.uiConsole.printError("Too many chains! Maximum is " + this.maxLegs + " chains.");
      return false;
    }
    return true;
  }

}

module.exports.Compiler= Compiler;
