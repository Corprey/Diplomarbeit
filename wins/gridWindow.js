'use strict'
const {MessageBox}= require( './../messageBox.js' );
const Common= require( './../common.js' );

// Called on init
function init( cnf ) {

  console.log( 'I bims, die Syko fanpage!' );

  let dat= new Common.DefaultConfig( cnf,
                                    { gridSize: 10, gridUnit: 'cm' }
                                    );

  document.getElementById('grid-input').value= ''+ dat.gridSize+ dat.gridUnit;
}

function childSubmit( cnf ) {

}

function childClosed() {

}

// Button click events
function clickOk() {
  console.log('Syko ist super!');

  let win= { width: 500, height: 500, title: 'error', isUrl: false, html: '<h1>  Hallo meine Syko Fans. </h1>' };
  box.createMessageBox( win );
}

function clickClose() {

}


const box= new MessageBox( init, childSubmit, childClosed );
