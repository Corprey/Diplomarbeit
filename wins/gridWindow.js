'use strict'
const {MessageBox}= require( './../messageBox.js' );
const Common= require( './../common.js' );

let prevUnit= null;

// Called on init
function init( cnf ) {

  let dat= new Common.DefaultConfig( cnf,
                                    { gridSize: 10, gridUnit: 'cm' }
                                    );
  prevUnit= cnf.gridUnit;
  document.getElementById('grid-input').value= ''+ dat.gridSize+ dat.gridUnit;

}



function childClosed() {
  let stl= document.getElementById('grid-input').style;
  stl.borderColor= '#d54e45';
  stl.outline= '0';

}

// Button click events
function clickOk() {
  if( box.blocked === false ) {

    let ele= Common.checkPosInput('grid-input', prevUnit, box);
    //no negative/zero grid allowed
         if (ele === null) {}
    else if(ele.value <= 0) { box.createErrorBox("Error: invalid value!"); }
    else {
      let dat= { gridValue: ele.value, gridUnit: ele.unit[0], desc: "grid-event"};
      box.submit(dat);
      clickClose();
    }


    }
  }

function clickClose() {
  if( box.blocked === false){
    box.close();
  }
}

function keyEvent(event) {
  if (event.keyCode == 13) clickOk();
  if (event.keyCode == 27) clickClose();
}

function createError(cnf) {
  let ev= {width:370, height:100, title:"Error", html:"wins/errorBox.html", isUrl: true, msg: cnf };
  box.createMessageBox( ev );
}

const box= new MessageBox( init, null, childClosed );
