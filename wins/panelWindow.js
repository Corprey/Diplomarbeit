'use strict'
const {MessageBox}= require( './../messageBox.js' );
const Common= require( './../common.js' );

let prevUnit= null;
let panelId;
let initDat= null;

// Called on init
function init( cnf ) {

  initDat= new Common.DefaultConfig( cnf,
                                    { gridUnit: 'cm', pos: {x:0, y:0}, index: 0,
                                      panelLeg: 'none', parentPanel: 'none', childPanel: 'none',
                                      fanpower: 100, colorCorr: {red: 100, green: 100, blue:100}
                                    }
                                    );

  //set Element values to given arguments
  document.getElementById('xPos').value= ''+ initDat.pos.x.value + initDat.pos.x.unit;
  document.getElementById('yPos').value= ''+ initDat.pos.y.value + initDat.pos.y.unit;
  document.getElementById('panelIndex').value= ''+ initDat.index;
  document.getElementById('fanPower').value= ''+ initDat.fanpower;
  document.getElementById('fanVal').innerHTML = initDat.fanpower + "%";
  document.getElementById('redval').value= ''+ initDat.colorCorr.red;
  document.getElementById('greenval').value= ''+ initDat.colorCorr.green;
  document.getElementById('blueval').value= ''+ initDat.colorCorr.blue;
  document.getElementById('rVal').innerHTML = initDat.colorCorr.red + "%";
  document.getElementById('gVal').innerHTML = initDat.colorCorr.green + "%";
  document.getElementById('bVal').innerHTML = initDat.colorCorr.blue + "%";
  document.getElementById('panelLeg').innerHTML= ''+ initDat.panelLeg;
  document.getElementById('parentPanel').innerHTML= ''+ initDat.parentPanel;
  document.getElementById('childPanel').innerHTML= ''+ initDat.childPanel;
  prevUnit= cnf.gridUnit;
  panelId= cnf.panelId;
}

function childClosed() {

}

// Button click events
function clickOk() {
  if( box.blocked === false){
    //check if legal input
    let data= {};
    data.panelId= panelId;
    data.index= document.getElementById('panelIndex').value;
    data.fanpower= document.getElementById('fanPower').value;
    data.colorCorr= {};
    data.colorCorr.red= document.getElementById('redval').value;
    data.colorCorr.green= document.getElementById('greenval').value;
    data.colorCorr.blue= document.getElementById('blueval').value;
    data.pos= {};

         if( (data.pos.x= Common.checkPosInput('xPos', prevUnit, box) ) === null ) {}
    else if( (data.pos.y= Common.checkPosInput('yPos', prevUnit, box) ) === null ) {}
    else if( (data.index= checkIndex(data.index) ) === null ) { box.createErrorBox("Error: Index is not a number"); }
    else {  //Submit
      data= checkForChange(data);
      data.desc= "panel-config-event";
      console.log(data);
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
//checks if index is number
function checkIndex(index) {
      index= index.match(/^[0-9]\d*$/g);
    return index;
}
//checks if changes to positions were made
function checkForChange(data) {
  let changes= {};

  //returns changes made to values
  changes= Common.mkDifference(initDat, data);
  console.log(changes);
  //if at least one position defined set undefined to old value
  if( changes.pos !== undefined ) {
    changes.pos.x= (changes.pos.x === undefined) ? initDat.pos.x : changes.pos.x;
    changes.pos.y= (changes.pos.y === undefined) ? initDat.pos.y : changes.pos.y;
  }
  //if at least one color defined set undefined to old value
  if( changes.colorCorr !== undefined ) {
    changes.colorCorr.red= (changes.colorCorr.red === undefined) ? initDat.colorCorr.red : changes.colorCorr.red;
    changes.colorCorr.green= (changes.colorCorr.green === undefined) ? initDat.colorCorr.green : changes.colorCorr.green;
    changes.colorCorr.blue= (changes.colorCorr.blue === undefined) ? initDat.colorCorr.blue : changes.colorCorr.blue;
  }
  changes.panelId= panelId;
  return changes;

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
