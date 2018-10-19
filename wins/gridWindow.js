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


    let units= ["mm", "cm", "m", "mil", "in", "ft"];
    let gridInput= document.getElementById('grid-input').value;

    //seperate number from text
    let value= gridInput.match(/\d+/g);
    let unit=  gridInput.match(/[a-zA-Z]+/g);

    if(unit === null){ // missing unit -> keep last unit
      unit= [prevUnit];
    }

    if((unit.length !== 1) || (units.indexOf(unit[0]) < 0) ){
      createError("Error: invalid unit!");
    }
    else if( (!value) || (value<=0)) {
      createError("Error: invalid value!");
    }
    else {
      let dat={ gridValue: value, gridUnit: unit[0], desc: "grid-event"};
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
  if (event.keyCode == 13) document.getElementById('ok-button').click();
  if (event.keyCode == 27) document.getElementById('close-button').click();
}

function createError(cnf) {
  let ev= {width:370, height:100, title:"Error", html:"wins/errorBox.html", isUrl: true, msg: cnf };
  box.createMessageBox( ev );

}

const box= new MessageBox( init, null, childClosed );
