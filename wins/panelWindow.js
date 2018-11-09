'use strict'
const {MessageBox}= require( './../messageBox.js' );
const Common= require( './../common.js' );

let prevUnit= null;

// Called on init
function init( cnf ) {

  let dat= new Common.DefaultConfig( cnf,
                                    { gridUnit: 'cm', posX: 0, posY: 0, index: 0,
                                      panelLeg: 'none', parentPanel: 'none', childPanel: 'none'
                                    }
                                    );
  document.getElementById('xPos').value= ''+ dat.posX+ dat.gridUnit;
  document.getElementById('yPos').value= ''+ dat.posY+ dat.gridUnit;
  document.getElementById('panelId').value= ''+ dat.index;
  document.getElementById('panelLeg').innerHTML= ''+ dat.panelLeg;
  document.getElementById('parentPanel').innerHTML= ''+ dat.parentPanel;
  document.getElementById('childPanel').innerHTML= ''+ dat.childPanel;
  prevUnit= cnf.gridUnit;
}

function childClosed() {

}

// Button click events
function clickOk() {
  if( box.blocked === false){

    //check if legal input
    let data= {};
    data.id= document.getElementById('panelId').value;
    data.fanPow= document.getElementById('fanPower').value;
    data.red= document.getElementById('redval').value;
    data.green= document.getElementById('greenval').value;
    data.blue= document.getElementById('blueval').value;

         if( (data.posX= Common.checkPosInput('xPos', prevUnit, box) ) === null ) {}
    else if( (data.posY= Common.checkPosInput('yPos', prevUnit, box) ) === null ) {}
    else if( (data.id= checkId(data.id) ) === null ) { box.createErrorBox("Error: Id is not a number"); }
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

function checkId(id) {
      id= id.match(/^[0-9]\d*$/g);
    return id;
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
