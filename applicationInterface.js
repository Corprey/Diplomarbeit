'use strict'
const {ipcRenderer} = require('electron');

function AppInterface( ui ) {

  const self= this;
  this.userInterface= ui;

  /* interface */
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
    if( typeof x === 'undefined' ) {
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

  /* ipc Receivers */
  ipcRenderer.on( 'ui-console', function( event, type, text ) {
    self.printUIConsole( type, text );
  });

  ipcRenderer.on( 'editor-command', function( event, cmd, conf ) {
    self.editorCommand( cmd, conf );
  });

}

function unpackBuffer(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function AnimationFile( inf, path ) {

}

module.exports.AppInterface= AppInterface;
