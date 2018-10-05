const electron = require("electron");
const {app, BrowserWindow, remote, ipcMain, Menu} = electron;
const localShortcut= require('electron-localshortcut');
const storage = require("electron-json-storage");
const {FileLoader}= require("./fileLoader.js");
const os= require("os");

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


const defaultFile= {
  recentlyOpened: [],
  consoleOpen: true,
  timelineOpen: true,
  sideBarMenuWidth: 12,
  consoleHeight: 12.5,
  timelineHeight: 12.5,
  editor: {
  //  editorScale:
  //  editorPosition:
  //  editorGrid:
  // imperialUnits:
  }

};

function Settings( cb ) {

  this.settings= null;
  this.path= os.tmpdir() + "/module-explorer";

  storage.setDataPath( this.path );

  storage.has( 'panel-explorer.json', function(error, hasKey) {
    if ( error ) {
      this.printUIConsole("Cannot access filesystem.", 'err' );
      throw Error( "Cannot access filesystem." );
    }

    if ( hasKey ) {
      storage.get( 'panel-explorer.json', function( error, data ) {
        if( error ) {
          this.printUIConsole("Cannot load settings file.", 'err' );
          throw Error( "Cannot load settings file. " );
        }

        this.settings= data;

        cb();
      } );

    } else {
      storage.set( 'panel-explorer.json', defaultFile, function( error ) {
          if( error ) {
            this.printUIConsole("Cannot create default settings file.", 'err' );
            throw Error( "Cannot create default settings file." );
          }

          this.settings= defaultFile;

          cb();
      } );
    }
  } );

/********************************************************************************************************************/

  this.saveToDisk= function() {
      storage.setDataPath( this.path );

      storage.set( 'panel-explorer.json', this.settings, function(error) {
        if(error) {
          this.printUIConsole( "Could not save settings file" , 'err' );
        }
      } );
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

  /*******************************************************************************************************/

function WindowStack( app ) {

  this.createWindow= function( w, h, t, html, isUrl = false ) {
    let p = this.windows.length > 0 ? this.windows[this.windows.length-1] : this.app.mainWindow;

    console.log( "Creating window: "+ w, h, t, html );

    let win= new BrowserWindow( { parent: p, center: true, width: w, height: h,
                                       useContentSize: true, resizeable: true, alwaysOnTop: true,
                                       title: t, autoHideMenuBar: "true" }  );
    this.windows.push( win );

    //win.setMenu(null);
    //win.setResizable(false);

    if( isUrl === true ) {
      console.log( "Loading Url: "+ html );
      win.loadURL( `file://${__dirname}/${html}`);
    } else {
      win.loadURL("data:text/html;charset=utf-8," + encodeURI(html));
    }

    const self= this;
    win.on('close', function() { self.closeWindow( false ); } );
  }

  this.closeWindow= function( closeWin= true ) {
    let len= this.windows.length;

    if( len > 0 ) {
      this.sendParentEvent( 'child-closed', {} );

      let win= this.windows[ len -1 ];

      if( closeWin === true ) {
        win.close();
      }

      this.windows.length -= 1;
    }
  }

  this.sendEvent= function( name, ev, id ) {
    if( typeof id === 'undefined' ) {
       id= this.windows.length-1;
    }

    let len= this.windows.length;
    if( (len > id) && (id >= 0) ) {
      this.windows[ id ].webContents.send( name, ev );
    }
  }

  this.sendParentEvent= function( name, ev ) {
    let len= this.windows.length;

    // check if last msg box
    if( len > 1 ) {
      this.sendEvent( name, ev, len-2 );  // send to parent msg box
    } else {
      this.app.sendEvent( name, ev );   // send to main window
    }
  }


  this.windows= [];
  this.app= app;

  const self = this;
  ipcMain.on( 'msgbox-event', function( event, ev ) {

    let len= self.windows.length;

    switch( ev.type ) {
      case 'close':
        self.closeWindow();
        break;

      case 'submit':
        self.sendParentEvent( 'child-submit', ev );
        break;

      case 'openMsg':
        self.createWindow( ev.width, ev.height, ev.title, ev.html, ev.isUrl );
        ev.id= self.windows.lenght -1;
        console.log( "Sending init event. " );
        self.sendEvent( 'init', ev );
        break;
    }

   });

}

  /*******************************************************************************************************/

function Application() {

  const self= this;
  this.currentProject= null;
  this.fileLoader= null;

  this.mainWindow= new BrowserWindow();
  this.settings= new Settings( function() {
    self.mainWindow.maximize();
    self.mainWindow.loadURL(`file://${__dirname}/index.html`);
   } );

   this.winStack= new WindowStack( this );

  this.menu= null;

  const template = [
    {
      label:'File',
      submenu: [
        {label:'New Project'},
        {label:'Load Project'},
        {label:'Recent Opened...',
          submenu: [
            {label: 'startspeaking'},
            {label: 'stopspeaking'}
          ]},
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
