const Common= require('./common.js');
const p5Module= require('p5');


/*
* Frame Class, data that is sent to the ww Rendering threads
*
*/
function Frame(t, n, panel, bin) {

  this.type= t;
  this.panelId= panel;
  this.data= bin;
  this.frameNumber= n;

}

/*
* Screen Class representing the rendering target
*
*/
function Screen( i ) {
  this.id= i;
  this.workerId= -1;
  this.curImage= new p5Module.Image(48, 48);
  this.curImage.loadPixels();
}

Screen.prototype.update= function( buff ) {
  let arr= new Uint8ClampedArray( buff );
  this.curImage.imageData= new ImageData( arr, 48, 48 );
  this.curImage.updatePixels();
}


/*
* Timeline Class holding all frames for all panels
*
*/
function TimeLine() {
  this.frameCounter= 0;
  this.animation= [];

  // add frame to animation
  this.addFrame= function( num, panel, type, data ) {
    while( num >= this.animation.length ) {
      this.animation.push( [] );
    }

    this.animation[num].push( new Frame( type, num, panel, data ) );
  }

  // Get number of frame sets
  this.length= function() {
    return this.animation.length;
  }

  this.next= function( wrap ) {
    if( this.frameCounter >= this.animation.length-1 ) {
      if( wrap ) {
        this.frameCounter= 0;
      }
      return true;

    } else {
        this.frameCounter++;
    }
    return false;
  }

  // Load frame for panel (this code has a complexity of O(N*N) but that's good enough)
  this.getFrame= function( num, panel ) {
    if( num >= this.animation.length ) {
      console.error( "Timeline Frame request out of bounds: number: " + num + " panel: "+ panel);
      throw Error( "Timeline Frame request out of bounds: number: " + num + " panel: "+ panel);
    }

    let dataSet= this.animation[num];
    for( let i= 0; i!= dataSet.length; i++ ) {
      if( dataSet[i].panelId === panel ) {
        return dataSet[i];
      }
    }

    return null;
  }

  // Get frame based on panel and internal frame counter
  this.getCurrentFrame= function( panel ) {
    return this.getFrame( this.frameCounter, panel );
  }

  // Return the buffer to a frame on the timeline
  this.restoreBuffer= function( f ) {
    let frame= this.getFrame( f.frameNumber, f.panelId );

    if( frame === null ) {
      console.error( "Cannot restore buffer for unknown frame: number:" + f.frameNumber + " panel: " + f.panelId );
      throw Error( "Cannot restore buffer for unknown frame: number:" + f.frameNumber + " panel: " + f.panelId );
    }

    frame.data= f.data;
  }
}


/*
* Screen Array Class holding all attached screens to
* the renderer
*/
function ScreenArray( r ) {
  this.arr= [];
  this.renderer= r;

  // Save array lookup, that automatically expands array and constructs Screen
  this.at= function( index ) {
    while( index >= this.arr.length ) {
      this.arr.push( null );
    }

    if( this.arr[index] === null ) {
      this.add( index );
    }

    return this.arr[index];
  }

  // Add new Screen to array
  this.add= function( index ) {
    if( this.arr[index] !== null ) {
      console.error("Screen array slot is already occupied: "+ index );
      throw Error("Screen array slot is already occupied: "+ index );
    }

    this.arr[index]= new Screen( index );
    r.assignWorker( this.arr[index] );
  }

  // Return all ids of available panels as array
  this.getIndices= function() {
    let a= [];

     for( let i= 0; i!= this.arr.length; i++ ) {
       if( this.arr[i] !== null ) {               // append id to array if panel exists in slot
         a.push( i );
       }
     }

     return a;
  }
}


/*
* Frame Render Class deconding the animation files and
* rendering them to p5-images that can be displayed on the
* editor canvas
*/
function FrameRenderer( tm, cnf ) {

  // Spawn new web worker thread with id
  this.spawnThread= function() {
    let worker= new Worker( './wwRenderer.js' );    // create new woker thread
    this.workers.push( worker );
    this.workerLoad.push( 0 );

    let self= this;
    worker.onmessage= function(x) { self.eventMessage(x); };  // setup event callbacks
    worker.onerror= function(x) { self.eventError(x); };
    this.post( this.workers.length-1, 'init' );               // initialize worker with own id
  }

  // Post simple message to worker thread
  this.post= function(id, msg) {
      this.workers[id].postMessage( {message: msg, id: id} );
  }

  // Post frame data to worker thread
  this.postFrame= function( id, f ) {
    if( f.data.byteLength === 0 ) {
      console.error( "Empty Buffer!" );
      return;
    }
    this.workers[id].postMessage( {message: 'frame', id: id, frame: f}, [f.data] );
  }

  // Event Handler on Message from web worker
  this.eventMessage= function( e ) {
    let msg= e.data;
    switch( msg.message ) {
      case 'done':
        let frame= msg.frame;
        let imgbuff= msg.imgData;

        this.screens.at( frame.panelId ).update( imgbuff ); // update pixels of screen to new image data
        this.timeline.restoreBuffer( frame );               // return buffer data to frame on timeline
        break;

      default:
        console.error("Received unexpected message from rendering thread: "+ msg.message );
        throw Error("Received unexpected message from rendering thread: "+ msg.message );
        break;
    }
  }

  // Event Handler on Error
  this.eventError= function( err ) {
    console.error( "Caught Worker Error @"+ err.filename+ " @"+ err.lineno+ ": "+ err.message );
  }

  // Stop all worker threads
  this.stop= function() {
    for( let i= 0; i!= this.workers.length; i++ ) {
      this.workers[i].terminate();
    }

    this.workers= [];
  }

  // Find worker with lowest load
  this.assignWorker= function( panel ) {
    let w= 0;

    if( this.workers.length === 0 ) {
      console.error("No workers available!")
      throw Error("Frame Renderer: No workers available!");
    }

    // get id of worker with the lowest load
    for( let i= 0; i!= this.workerLoad.length; i++ ) {
      w= ( this.workerLoad[w] > this.workerLoad[i] ) ? i : w;
    }

    panel.workerId= w;      // assign worker
    this.workerLoad[w]++;   // increase load of worker
  }

  // Load frames from timeline for current frame number
  this.loadFrames= function( panels ) {
    let targets= [];
    // if no panels specified, load frames for all screens
    if( typeof panels !== 'undefined' ) {
      targets= panels.slice();
    } else {
      targets= this.screens.getIndices();
    }

    // load frames from timeline
    for( let i= 0; i!= targets.length; i++ ) {
      let frame= this.timeline.getCurrentFrame( targets[i] );

      if( frame !== null ) {
        this.targetBatch.push( frame );
      }
    }
  }

  // Post frames and get them rendered by the threads
  this.begin= function() {
    let updates= new Common.SimpleSet();

    // post all frames to the worker threads
    for( let i= 0; i!= this.targetBatch.length; i++ ) {

      let frame= this.targetBatch[i];             // get frame from batch
      let panel= this.screens.at(frame.panelId);  // get panel based on frame

      this.postFrame( panel.workerId, frame );    // post frame to worker
      updates.add( panel.workerId );              // save that worker needs to be started
    }

    let self= this;
    updates.forEach( function( id ) {             // start all workers that got new data
      self.post(id, 'start');
    });

    this.targetBatch= [];                         // remove all tasks from the batch
  }

  /* Constructor */

  this.config= new Common.DefaultConfig( cnf,
                                          { threadCount: 4 },
                                          function(prop, val, fatal) {
                                            console.error("Error in Frame Renderer Class Constructor: Missing configuration argument: "+ prop+
                                                          "\nSetting default value: "+ val );
                                          } );

  this.timeline= tm;
  this.workers= [];                     // Array of workers
  this.workerLoad= [];                  // Array where each worker id (index) correlates with the worker's number of panels to render
  this.screens= new ScreenArray(this);  // Array of screens
  this.targetBatch= [];                 // List of frames to render during cycle

  for( let i= 0; i!= this.config.threadCount; i++ ) {
    this.spawnThread();
  }
}


module.exports.FrameRenderer= FrameRenderer;
module.exports.Frame= Frame;
module.exports.TimeLine= TimeLine;
module.exports.Screen= Screen;
