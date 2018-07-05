'use strict'
//const fs= require('fs');
const BinaryFile= require('binary-file');


function FileLoader( path ) {

    this.path= path;
    this.file= new BinaryFile( path, 'r', true );

    this.meta= null;

    let self= this;
    this.file.open().then( function(){ console.log('File opened.'); return self.file.readString(1); })
                    .then( function(c){ if( c !== 'm') { return 0; }
                                        return self.file.readUInt32(); })
                    .then( function(l){ return self.file.readString(l); })
                    .then( function(s){ self.meta= JSON.parse(s); })
                    .then( function(){ /* event: file ready */ } )
                    .catch( function(e){ console.log( 'There was an error while reading file: ' + e );
                                        /* Error callback to ui*/ });

    this.isEnd= function() {
      return this.file.tell() === this.file.size();
    }

    this.getSize= function() {
      return this.file.size();
    }

    this.close= function() {
      this.file.close();
    }

}


function packBuffer(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}



module.exports.FileLoader= FileLoader;
