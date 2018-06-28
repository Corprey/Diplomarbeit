const p5Module= require('p5');
const Common = require('./common.js');

function Editor( cnf ) {

  this.updateCanvas= function( up ) {
    let x= this.canvasDiv.clientWidth;
    let y= this.canvasDiv.clientHeight;

    if( typeof up === 'undefined' ) {
      this.originOffset.sub(-(x-this.canvasWidth)/2, (y-this.canvasHeight)/2);
    } else if( up === true ) {
      this.originOffset.sub(-(x-this.canvasWidth)/2, (y-this.canvasHeight)/2);
    }

    this.canvasWidth= x;
    this.canvasHeight= y;
    this.p5.resizeCanvas( x, y, false );
  }

  this.p5Renderer= function(p5) {
    let self= this;

    p5.setup= function() {
      self.canvas = p5.createCanvas( 400, 400 );
      self.updateCanvas( false );
    }

    p5.draw= function() {
      p5.background( 255, 255, 255 );

      p5.translate( self.originOffset );

      p5.fill('#fae');
      p5.ellipse(self.canvasWidth /2, self.canvasHeight /2, 90, 90);

    }

    p5.windowResized= function() {
      self.updateCanvas();
    }

    p5.mousePressed= function() {
      console.log("pre");
      if((p5.mouseX>0) && (p5.mouseY>0)) {
        if((p5.mouseX< self.canvasWidth) && (p5.mouseY< self.canvasHeight)) {
          console.log("in");
        }
      }
    }

    p5.mouseReleased= function() {
      console.log("rel");
    }

  }

  /* Constructor */
  this.config= new Common.DefaultConfig( cnf,
                                          { ankorName: '', backColor: '' },
                                          function( prop, val ) { throw new Error("Editor Constructor Configuration misses property: "+ prop ); } );

  this.canvas= null;
  this.canvasDiv= document.getElementById( this.config.ankorName );
  this.canvasWidth= this.canvasDiv.clientWidth;
  this.canvasHeight= this.canvasDiv.clientHeight;

  let self= this;
  this.p5= new p5Module( function(p5) { self.p5Renderer(p5); }, this.config.ankorName );

  this.originOffset= this.p5.createVector(0, 0);

}

module.exports.Editor= Editor;
