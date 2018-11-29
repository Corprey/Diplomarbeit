'use strict'
const {MessageBox}= require( './../messageBox.js' );
const Common= require( './../common.js' );

let prevUnit= null;
let panel= null;

// Called on init
function init( cnf ) {

  let dat= new Common.DefaultConfig( cnf,
                                    { gridUnit: 'cm', posX: 0, posY: 0, index: 0,
                                      panelLeg: 'none', parentPanel: 'none', childPanel: 'none'
                                    }
                                    );
  document.getElementById('xPos').value= ''+ dat.posX+ dat.gridUnit;
  document.getElementById('yPos').value= ''+ dat.posY+ dat.gridUnit;
  document.getElementById('panelIndex').value= ''+ dat.index;
  document.getElementById('panelLeg').innerHTML= ''+ dat.panelLeg;
  document.getElementById('parentPanel').innerHTML= ''+ dat.parentPanel;
  document.getElementById('childPanel').innerHTML= ''+ dat.childPanel;
  prevUnit= cnf.gridUnit;
  panel= cnf.panel;
}

function childClosed() {

}

// Button click events
function clickOk() {
  if( box.blocked === false){

    //check if legal input
    let data= {};
    data.panel= panel;
    data.index= document.getElementById('panelIndex').value;
    data.fanPow= document.getElementById('fanPower').value;
    data.red= document.getElementById('redval').value;
    data.green= document.getElementById('greenval').value;
    data.blue= document.getElementById('blueval').value;

         if( (data.posX= Common.checkPosInput('xPos', prevUnit, box) ) === null ) {}
    else if( (data.posY= Common.checkPosInput('yPos', prevUnit, box) ) === null ) {}
    else if( (data.index= checkIndex(data.index) ) === null ) { box.createErrorBox("Error: Index is not a number"); }
    else {  //Submit
      data.desc= "panel-config-event";
      box.submit(data);
      clickClose();
    }
  }
}

function clickClose() {
  if( box.blocked === false){
    box.close();
  }
}

//Key-events
function keyEvent(event) {
  //Enter-Button
  if (event.keyCode == 13) document.getElementById('ok-button').click();
  //ESC-Button
  if (event.keyCode == 27) document.getElementById('close-button').click();
}

function checkIndex(index) {
      index= index.match(/^[0-9]\d*$/g);
    return index;
}

//Slider-events
function slideEvent(val, element) {
    document.getElementById(element).innerHTML = val + "%";
  }

function setBrightness(val, element) {
  slideEvent(val, element);
  document.getElementById(element).value *= (val/100);
  document.getElementById(element).innerHTML = val + "%";
}

const box= new MessageBox( init, null, childClosed );
