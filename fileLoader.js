'use strict'
const fs= require('fs');
const BinaryFile= require('binary-file');
const Common= require('./common.js');


function FileLoader( path, i ) {

  this.path= path;
  this.file= new BinaryFile( path, 'r', true );
  this.intf= i;
  this.size= -1;

  this.meta= null;

  // Check if file exists ( as .open() always throws promise rejection? )
  if( fs.existsSync(path) === false ) {
    this.intf.sendEvent('floader-error', {message: "Cannot open unknown file: "+ path });
    return;
  }

  // Load file meta data if it exists
  let self= this;
  this.file.open().then( function(){    return self.file.size(); })                           // Load file size

                  .then( function(s){   self.size= s; if(s === 0) { throw Error('File is empty.'); }
                                        return self.file.readString(1); })                    // load first char

                  .then( function(c){   if( c !== 'm') { return 0; }                          // if char is 'm' load data length
                                        return self.file.readUInt32(); })

                  .then( function(l){   return self.file.readString(l); })                    // read data string with provided length

                  .then( function(s){   if(s.length !== 0) { self.meta= JSON.parse(s); }      // parse JSON data if string has data
                                        self.intf.sendEvent( 'floader-ready', self.meta ); }) // send event done

                  .catch( function(e){  self.intf.sendEvent( 'floader-error', {message: e.message} ); console.log( 'There was an error while reading file: ' + e ); });

  this.parsePanel= function(frame, r) {
    console.log('Parsing Panel. Depth: ' + r + ' Position: ' + this.file.tell() );

    if( this.isEnd() ) {
      this.postFrame( frame );
      return;
    }

    let self= this;
    this.file.readString(1).then( function(c){  if( c!== 'p' ) {                                  // if no panel header
                                                  if( c=== 'f' ) {
                                                    self.file.seek( self.file.tell()-1 );         // move cursor single byte back for next parsing cycle
                                                    throw {_earlyExit:true};                      // jump over promise chain if a frame header was found
                                                  }
                                                  throw Error("Bad file. Expected 'f' got: " + c.charCodeAt(0)+ ' @'+ self.file.tell() );
                                                }
                                                return self.file.readUInt32(); })                 // load panel id

                           .then( function(n){  frame.panels.push({id: n});                       // create new panel with id
                                                return self.file.readString(1); })                // load panel data type

                           .then( function(c){  frame.panels[ frame.panels.length-1 ].type= c;    // save panel data type
                                                console.log('Panel data type: '+ c);
                                                switch(c) {
                                                  case 'c':     // load 8 bytes
                                                    return 8;

                                                  case 's':     // load 4 bytes ( 3+ 1 padding byte )
                                                    return 4;

                                                  case 'l':     // load n bytes
                                                  case 'e':
                                                  case 'd':
                                                    return self.file.readUInt32();  // Load number of bytes to read to buffer

                                                  default:
                                                    throw Error("Bad file. Expected panel data type got: " + c.charCodeAt(0)+ ' @'+ self.file.tell() );
                                                }
                                                } )

                           .then( function(l){  return self.file.read( l ); })                     // load data to buffer

                           .then( function(b){  frame.panels[ frame.panels.length-1 ].data= Common.packBuffer(b); // convert buffer to string
                                                self.parsePanel( frame, r+1 ); })                                 // recursive call for next panel

                           .catch( function(e){ if( e.hasOwnProperty('_earlyExit') ) { self.postFrame( frame ); }
                                                else { self.intf.sendEvent( 'floader-error', {message: e.message} ); } });
  }

  this.parseFrame= function() {
    console.log('-> Parsing frame. Position: '+ this.file.tell());

    if( this.isEnd() ) {
      this.intf.sendEvent( 'floader-eof' );
      this.file.close();
      return;
    }

    let self= this;
    this.file.readString(1).then( function(c){  if( c!== 'f' ) { throw Error("Bad file. Expected 'f' got: " + c.charCodeAt(0)+ ' @'+ self.file.tell() ); }
                                                return self.file.readUInt32(); })

                           .then( function(i){  self.parsePanel( {id: i, panels: []}, 0 ); })

                           .catch( function(e){ self.intf.sendEvent( 'floader-error', {message: e.message} ); });
  }

  this.postFrame= function( frame ) {
    this.intf.sendEvent('floader-frame', frame );
  }

  this.isEnd= function() {
    return this.file.tell() === this.size;
  }

  this.getSize= function() {
    return this.file.size();
  }

  this.close= function() {
    this.file.close();
  }

}




module.exports.FileLoader= FileLoader;
