const electron = require("electron");
const {app, BrowserWindow, remote, ipcMain} = electron;
const localShortcut= require('electron-localshortcut');
const storage = require("electron-json-storage");
const {FileLoader}= require("./fileLoader.js");

function Project( path ) {

  /* constructor: Runns on creation of new 'Project'-Object once */
  let splitPos= path.lastIndexOf('/');
  //path to directory
  this.dataPath=  path.substring(0, splitPos);
  //filename
  this.fileName= path.substring(splitPos+1, path.length);

  storage.setDataPath(this.dataPath );
  this.fileObj= storage.get( this.fileName,
    function(error, data) {
      if( error ) {
        this.printUIConsole( "Could not open file:  " + this.fileName , 'err' );
      }
  });
/********************************************************************************************************************/

  this.saveToDisk= function() {
      storage.setDataPath( this.dataPath );

      storage.set( this.fileName, this.fileObj,
      function(error) {
        if(error) {
          this.printUIConsole( "Could not save file:  " + this.fileName , 'err' );
        }
      });
  }
}


/*
*   Event Handler Class to deal with all shortcuts that are not implemented
*   as accelerators in the app menu
*/
function EventHandler( w, sarr ) {

  this.win= w;

  let self= this;
  for( let i= 0; i!= sarr.length; i++ ) {
    localShortcut.register( this.win, sarr[i].trig, function() { self[ sarr[i].func ](); } );
  }

  this.unbindAll= function() {
    localshortcut.unregisterAll( this.win )
  }

  this.eventDebugToggle= function() {
    global.application.editorCommand( 'toggleDebug' );
  }

  this.eventPanOrigin= function() {
    global.application.editorCommand( 'panOrigin' );
  }


}





function Application() {

  const self= this;
  this.currentProject= null;
  this.fileLoader= null;

  this.mainWindow= new BrowserWindow();
  this.mainWindow.maximize();
  this.mainWindow.loadURL(`file://${__dirname}/index.html`);

  this.eventHandler= new EventHandler( this.mainWindow, [ { trig: 'Ctrl+Alt+D', func: 'eventDebugToggle' },
                                                          { trig: 'Ctrl+T',     func: 'eventPanOrigin'   } ] );

  this.terminate= function() {
    this.eventHandler.unbindAll();
  }

  /*******************************************************Project/Files************************************************/
  this.loadProject= function( path ) {
    this.currentProject= new Project( path );
  }

  this.saveProject= function() {
    if( this.currentProject === null ) {
      // Fehler
    }
    else {
      this.currentProject.saveToDisk();
    }
  }

  this.loadAnimation= function( path ){
    if( this.fileLoader !== null ) {
      this.fileLoader.close();
    }
    this.fileLoader= new FileLoader( path,  );
  }


/****************************************************Interfacing Methods*********************************************/
  // Output string in the UI Console
  this.printUIConsole= function( type, text ) {
    this.mainWindow.webContents.send('ui-console', type, text );
  }

  // Send editor command
  this.editorCommand= function( cmd, conf ) {
    this.mainWindow.webContents.send( 'editor-command', cmd, conf );
  }

  //Output string in the node-Console
  ipcMain.on( 'console', function( event, msg ) {
    console.log( msg );
  });

  // Load new project
  ipcMain.on( 'load-project', function( event, path ) {
    self.loadProject( path );
    event.returnValue= { success: true };
  });

/********************************************************************************************************************/
  // Error method to crash main program and output error string to new context window
  this.fatalError= function( err ) {
    let errorWin= new BrowserWindow( { parent: this.mainWindow, center: true, width: 500, height: 150,
                                       useContentSize: true, resizeable: false, alwaysOnTop: true,
                                       title: "Error", autoHideMenuBar: "true" } );

    // decompose stack trace
    let lines= err.trace.split('\n');         // split lines and ignore first one
    let trace= "";
    for( let i= 1; i< lines.length; i++ ) {   // iterate through lines
      let l= lines[i].trim();

      let b= l.indexOf("file:");
      if( b === -1 ) {
        b = l.indexOf("C:");
      }

      if( b !== -1 ) {                        // if file path exists
        trace+= l.substring(0, b);            // copy substring before path

        let path= l.substring(b, l.length );  // truncate path to filename and line numbers
        let dirs= path.split("/");
        if( dirs.length === 1 ) {
          dirs= path.split('\\');
        }
        trace+= dirs[dirs.length-1];          // append filename to trace

      } else {
        trace+= l;
      }
      trace+= '</br>';
    }

    let html= '<body style="background-color: #282c34; color: white; font-family: Frutiger, Arial, sans-serif;">  <br/> <br/> <center> Error: '+
              err.error+ ' </br>'+ err.message+ '</center> </br>'+ trace+
              " </body>";

    errorWin.setMenu(null);
    errorWin.setResizable(false);
    errorWin.loadURL("data:text/html;charset=utf-8," + encodeURI(html));
    errorWin.on('close', function() { app.quit(); } );
  }

}


module.exports.Application= Application;
