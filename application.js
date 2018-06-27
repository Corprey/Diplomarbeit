const electron = require("electron");
const {app, BrowserWindow, remote} = electron;

const storage = require("electron-json-storage");

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






function Application() {

  this.currentProject= null;

  this.mainWindow= new BrowserWindow();
  this.mainWindow.maximize();
  this.mainWindow.loadURL(`file://${__dirname}/index.html`);

  this.printConsole= function( str ) {
    console.log( str );
    return true;
  }

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


/****************************************************Interfacing Methods*********************************************/
  this.callInterface= function( name, args ) {
    let command= 'getInterface().' + name+ '( ';

    // Iteriere durch alle übergebenen Argumente undfüge sie zu langem string zusammen
    for( let i= 0; i!= args.length; i++ ) {

      // Wenn Argument vom Typ String ist, setze Anführungszeichen
      if( args[i].t == 'str' ) {
        command += ( '"' + args[i].v + '", ' );
      } else {
        command += (args[i].v + ', ');
      }
    }

    command += '); ';

    this.mainWindow.webContents.executeJavaScript( command );
  }

/********************************************************************************************************************/
//Ausgabe in UIConsole
  this.printUIConsole= function( text, type ) {
    this.callInterface( "printUIConsole", [ { t: 'str', v: text},
                                            {t: 'str', v: type }  ] );
  }

}


module.exports.Application= Application;
