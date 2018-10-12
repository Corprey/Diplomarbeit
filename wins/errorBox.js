'use strict'
const {MessageBox}= require( './../messageBox.js' );
const Common= require( './../common.js' );

// Called on init
function init( cnf ) {

  let dat= new Common.DefaultConfig( cnf,
                                    {msg: "Unknown error." }
                                    );

  document.getElementById('errorMsg').innerHTML= dat.msg;

}
function clickClose() {
  box.close();
}



const box= new MessageBox( init, null, null );
