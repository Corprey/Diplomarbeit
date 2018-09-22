const electron = require("electron");
const {app, BrowserWindow, remote, ipcMain, Menu} = electron;
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
    let ev= sarr[i].func;
    let t= sarr[i].type;
    localShortcut.register( this.win, sarr[i].trig, function() { self.call( t, ev ); } );
  }

  this.unbindAll= function() {
    localshortcut.unregisterAll( this.win )
  }

  this.call= function( type, event ) {
    if( type === 'ui' ) {
      global.application.uiCommand( event );
    } else {
      global.application.editorCommand( event );
    }
  }

}





function Application() {

  const self= this;
  this.currentProject= null;
  this.fileLoader= null;

  this.mainWindow= new BrowserWindow();
  this.mainWindow.maximize();
  this.mainWindow.loadURL(`file://${__dirname}/index.html`);
  this.menu= null;

  const template = [
    {
      label:'File',
      submenu: [
        {label:'New File'},
        {label:'New Project'},
        {type: 'separator'},
        {label:'Save'},
        {label:'Save As...'},
        {label:'Save All'}
      ]
    },
    {
      label: 'Editor',
      submenu: [
        {label: 'Undo', accelerator: 'Ctrl+Z', click() { self.editorCommand("undo"); }},
        {label: 'Redo', accelerator: 'Ctrl+Y', click() { self.editorCommand("redo"); }},
        {type: 'separator'},
        {label: 'Jump to Origin', accelerator: 'Ctrl+T', click() { self.editorCommand("panOrigin"); }},
        {label: 'Debug Screen', accelerator: 'Ctrl+Alt+D', click() { self.editorCommand("toggleDebug"); }},
        {type: 'separator'},
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
        {role: 'pasteandmatchstyle'},
        {role: 'delete'},
        {role: 'selectall'}
      ]
    },
    {
      label: 'View',
      submenu: [
        {label:'Show Console', click() { self.uiCommand("showConsole"); }},
        {label:'Show Timeline', click() { self.uiCommand("showTimeline"); }},
        {label:'Show All', click() { self.uiCommand("showAll"); }},
        {type: 'separator'},
        {label: 'Actual Size', click() { self.uiCommand("actualSize"); }},
        {label: 'Zoom In', click() { self.uiCommand("zoomIn"); }},
        {label: 'Zoom Out', click() { self.uiCommand("zoomOut"); }},
        {type: 'separator'},
        {role: 'forcereload'},
        {role: 'toggledevtools'},

      ]
    },
    {
      role: 'window',
      submenu: [
        {role: 'minimize'},
        {role: 'togglefullscreen'},
        {role: 'close'}
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click () { require('electron').shell.openExternal('https://electronjs.org') }
        }
      ]
    }
  ]

  this.menu= Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(this.menu);

  this.eventHandler= new EventHandler( this.mainWindow, [ { trig: 'P', func: 'toolPlacePanel', type:'e'},
                                                          { trig: 'Esc', func: 'resetTooltip', type:'e'},
                                                          { trig: 'Ctrl+A',     func: 'select-all',  type:'e' },
                                                         ] );

  this.terminate= function() {
    this.eventHandler.unbindAll();
  }

  /*******************************************************Project/Files************************************************/
  this.loadProject= function( path ) {
    this.currentProject= new Project( path );
  }

  this.saveProject= function() {
    if( this.currentProject !== null ) {
      this.currentProject.saveToDisk();
    }
  }

  this.loadAnimation= function( path ){
    if( this.fileLoader !== null ) {
      this.fileLoader.close();
    }
    this.fileLoader= new FileLoader( path, this );
  }

  this.loadFrame= function() {
    if( this.fileLoader === null ) {
      // Error
    }
    this.fileLoader.parseFrame();
  }


/****************************************************Interfacing Methods*********************************************/
  // Send simple event to main rendering process
  this.sendEvent= function( channel, cnf ) {
    this.mainWindow.webContents.send( channel, cnf );
  }

  // Output string in the UI Console
  this.printUIConsole= function( type, text ) {
    this.mainWindow.webContents.send('ui-console', type, text );
  }

  // Send editor command
  this.editorCommand= function( cmd, conf ) {
    this.mainWindow.webContents.send( 'editor-command', cmd, conf );
  }

  //Send ui command
  this.uiCommand= function( cmd ) {
    this.mainWindow.webContents.send( 'ui-command', cmd );
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

  // Save current project
  ipcMain.on( 'save-project', function( event ) {
    self.saveProject();
  });

  // Create file loader for animation file
  ipcMain.on( 'load-animation', function( event, path ) {
    self.loadAnimation( path );
  });

  // Parse next frame from animation file
  ipcMain.on( 'load-frame', function( event ) {
    self.loadFrame();
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
