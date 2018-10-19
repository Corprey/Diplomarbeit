'use strict'
const {MessageBox}= require( './../messageBox.js' );
const Common= require( './../common.js' );


// Called on init
function init( cnf ) {

  let dat= new Common.DefaultConfig( cnf,
                                    { gridSize: 10, gridUnit: 'cm' }
                                    );
}

function childClosed() {

}

// Button click events
function clickOk() {

}

function clickClose() {
  if( box.blocked === false){
    box.close();
  }
}

function keyEvent(event) {
  //Enter-Button
  if (event.keyCode == 13) document.getElementById('ok-button').click();
  //ESC-Button
  if (event.keyCode == 27) document.getElementById('close-button').click();
}

function createError(cnf) {
  let ev= {width:370, height:100, title:"Error", html:"wins/errorBox.html", isUrl: true, msg: cnf };
  block = true;
  box.createMessageBox( ev );

}

function slideEvent(val, element) {
    document.getElementById(element).innerHTML = val + "%";
  }

function setBrightness(val, element) {
  slideEvent(val, element);

  document.getElementById(element).value *= (val/100);

  document.getElementById(element).innerHTML = val + "%";


}

const box= new MessageBox( init, null, childClosed );
