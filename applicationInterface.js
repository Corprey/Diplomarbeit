
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
}

module.exports.AppInterface= AppInterface;
