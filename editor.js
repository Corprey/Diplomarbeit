
const p5Module= require('p5');

function p5Renderer(p5) {
  const editor= p5Renderer.editor;
  let canvas= null;

  console.log( editor.x );

  p5.setup= function() {
    canvas = p5.createCanvas(400, 400);
  }

  p5.draw= function() {

  }
}

function Editor() {

  this.x= 456;

  /* Constructor */
  p5Renderer.editor= this;
  this.p5Instance= new p5Module( p5Renderer, 'editor' );


}

module.exports.Editor= Editor;
