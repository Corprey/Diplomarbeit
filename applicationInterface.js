
const {remote} = require('electron');

function AppInterface( ui ) {

  this.userInterface= ui;
  this.mainApp= remote.getGlobal('application');

  this.printConsole= function( str ) {
    return this.mainApp.printConsole( str );
  }

  this.loadProject= function( path ) {
    return this.mainApp.loadProject( path );
  }

  this.printUIConsole= function( text, type ) {
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
}

module.exports.AppInterface= AppInterface;
