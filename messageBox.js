'use strict'

const {ipcRenderer} = require('electron');

function MessageBox( init, sub, cl ) {

  this.onInit=        init || null;
  this.onChildSubmit= sub  || null;
  this.onChildClose=  cl   || null;

  this.title= null;
  this.id= null;

  // Create new msg box
  this.createMessageBox= function( ev ) {
    ev.type= 'openMsg';
    ev.caller= this.id;
    ipcRenderer.send( 'msgbox-event', ev );
  }

  // Close this msg box
  this.close= function() {
    let ev= { type: 'close' };
    ipcRenderer.send( 'msgbox-event', ev );
  }

  // Submit data to the next higher msg box
  this.submit= function( ev ) {
    ev.type= 'submit';
    ipcRenderer.send( 'msgbox-event', ev );
  }

  // load init events
  this.eventInit= function( cnf ) {

    this.title= cnf.title;
    this.id= cnf.id;

    if( this.onInit !== null ) {
      this.onInit( cnf );
    }
  }


  // IPC listeners
  const self= this;
  ipcRenderer.on( 'child-closed', function( event ) {
    ( self.onChildClose !== null ) ? self.onChildClose() : null;
  });

  ipcRenderer.on( 'child-submit', function( event, cnf ) {
    ( self.onChildSubmit !== null ) ? self.onChildSubmit( cnf ) : null;
  });

  ipcRenderer.on( 'init', function( event, cnf ) {
    self.eventInit( cnf );
  });

  /* Constructor */

  let ev= { type: 'ready' };
  ipcRenderer.send( 'msgbox-event', ev ); // Send ready event, to receive init event
}


module.exports.MessageBox= MessageBox;
