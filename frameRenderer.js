const Common= require('./common.js');
const p5Module= require('p5');

function Frame(d, n, panel, bin) {

  this.isDiff= d;
  this.panelId= panel;
  this.data= bin;
  this.frameNumber= n;

}

function FrameRenderer() {

  this.spawnThread= function() {
    let worker= new Worker( './wwRenderer.js' );
    this.workers.push( worker );

    let self= this;
    worker.onmessage= function(x) { self.eventMessage(x); };
    worker.onerror= function(x) { self.eventError(x); };
    this.post( this.workers.length-1, 'init' );
  }

  this.post= function(id, msg) {
      this.workers[id].postMessage( {message: msg, id: id} );
  }

  this.postFrame= function( id, f ) {
    this.workers[id].postMessage( {message: 'frame', id: id, pckg: f}, [f.data] );
  }


  this.eventMessage= function( msg ) {
    console.log( "Received from WW: "+ msg.data.message );
  }

  this.eventError= function( err ) {
    console.error( "Caught Worker Error @"+ err.filename+ " @"+ err.lineno+ ": "+ err.message );
  }

  this.stop= function() {
    for( let i= 0; i!= this.workers.length; i++ ) {
      this.workers[i].terminate();
    }
  }

  this.begin= function() {

    let test= new ArrayBuffer( 48 * 48 * 2 );
    let tv= new DataView( test );

    for( let i= 0; i!= tv.byteLength; i+= 2 ) {
      tv.setUint16(i, i>>>1);
    }


    this.post( 0, 'frame' );
  }

  /* Constructor */

  this.workers= [];

}


module.exports.FrameRenderer= FrameRenderer;
module.exports.Frame= Frame;
