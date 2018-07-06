'use strict'
const {ipcRenderer} = require('electron');

function AppInterface( ui ) {

  const self= this;
  this.userInterface= ui;
  this.subscribers= [];

  /* interface */
  this.attachReceiver= function( rcv, subs ) {
    this.subscribers.push( { receiver: rcv, subscriptions: subs } );
  }

  this.removeReceiver= function( rcv ) {
    for( let i= 0; i<= this.subscribers.length; i++ ) {
      if( this.subscribers[i].receiver === rcv ) {
        this.subscribers.splice( i, 1 );
      }
    }
  }

  this.subEvent= function( name, event, cnf ) {
    let len= this.subscribers.length;
    for( let i= 0; i !=len; i++ ) {
      if( this.subscribers[i].subscriptions.indexOf(name) !== -1 ) {
        this.subscribers[i].receiver.interfaceEvent( name, event, cnf );
      }
    }
  }

  this.editorCommand= function( cmd, conf ) {
    switch( cmd ) {
      case 'toggleDebug':
        this.userInterface.uiEditor.toggleDebugScreen();
        this.userInterface.uiConsole.println( "Toggled editor debug screen" );
        break;

      case 'panOrigin':
        this.userInterface.uiEditor.autoPanOrigin();
        break;
    }
  }

  this.printUIConsole= function( type, text ) {
    if( typeof type === 'undefined' ) {
      type= 'msg';
    }

    switch( type ) {
      case 'msg':
      case 'message':
        this.userInterface.uiConsole.println( text );
        break;

      case 'err':
      case 'error':
        this.userInterface.uiConsole.printError( text );
        break;

      case 'warn':
      case 'warning':
        this.userInterface.uiConsole.printWarning( text );
        break;

    }
  }

  /* ipc Emitters */
  this.printConsole= function( msg ) {
    ipcRenderer.send( 'console', msg );
  }

  this.loadProject= function( path ) {
    let res= ipcRenderer.sendSync( 'load-project', path );
    if( res.success === false ) {
      // Error: Could not load project
    }
  }

  this.saveProject= function() {
    ipcRenderer.send( 'Save-project' );
  }

  this.loadAnimation= function( path ) {
    ipcRenderer.send( 'load-animation', path );
  }

  this.loadFrame= function() {
    ipcRenderer.send( 'load-frame' );
  }

  /* ipc Receivers */
  ipcRenderer.on( 'ui-console', function( event, type, text ) {
    self.printUIConsole( type, text );
  });

  ipcRenderer.on( 'editor-command', function( event, cmd, conf ) {
    self.subEvent('editor-command', event, {cmd: cmd, conf: conf} );
    self.editorCommand( cmd, conf );
  });

  ipcRenderer.on( 'floader-ready', function( event, cnf ) {
    self.subEvent('floader-ready', event, cnf );
  });

  ipcRenderer.on( 'floader-frame', function( event, cnf ) {
    self.subEvent('floader-frame', event, cnf );
  });

  ipcRenderer.on( 'floader-eof', function( event, cnf ) {
    self.subEvent('floader-eof', event, cnf );
  });

  ipcRenderer.on( 'floader-error', function( event, cnf ) {
    self.subEvent('floader-error', event, cnf );
  });
}

/*
* Animation File Class handling all ipc communication required to
* load an animation file and inject it into the timeline
*/
function AnimationFile( inf, path, tml ) {

  this.interface= inf;
  this.interface.attachReceiver( this, ['floader-ready', 'floader-error', 'floader-frame', 'floader-eof'] );
  this.meta= null;

  this.interface.loadAnimation( path );

  this.close= function() {
    this.interface.removeReceiver( this );
  }

  this.interfaceEvent= function(name, event, cnf) {
    switch(name) {
      case 'floader-ready':
        this.meta= cnf; console.log('got meta data: '); console.log( this.meta );
        this.interface.loadFrame();
        break;

      case 'floader-frame':
        console.log('got frame data:' );
        console.log(cnf);
        this.interface.loadFrame();
        break;

      case 'floader-eof':
        console.log('Loader eof');
        break;

      case 'floader-error': console.log(cnf);
        this.interface.userInterface.uiConsole.printError( "File Loader Error: "+ cnf.message );
        break;
    }
  }

}


module.exports.AppInterface= AppInterface;
module.exports.AnimationFile= AnimationFile;
