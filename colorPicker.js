'use strict'


function ColorPicker( node ) {

  this.mkColorSlider= function( ankor, name ) {
    let spacer= document.createElement('div');
    spacer.classList.add('ui-colorpicker-spacer');

    // create and add color slider
    let slider= document.createElement('INPUT');
    slider.setAttribute("type", "range");
    slider.setAttribute("min", "0");
    slider.setAttribute("max", "255");
    slider.setAttribute("value", "127");
    slider.classList.add( "ui-colorpicker-slider");
    spacer.appendChild( slider );

    this[ name+ "Slider" ]= slider;

    // create and add number box
    let box= document.createElement('INPUT');
    box.setAttribute("type", "number");
    box.setAttribute("min", "0");
    box.setAttribute("max", "255");
    box.setAttribute("value", "127");
    box.setAttribute("step", "1");
    box.classList.add("ui-colorpicker-box");
    spacer.appendChild( box );

    this[ name+ "Box"]= box;

    // add color letter
    spacer.appendChild( document.createTextNode( " "+ name.toUpperCase() ) );

    // add callback to slider
    const self= this;
    slider.oninput= function() {
        const prop= name;
        self[ prop ]= parseInt( this.value );
        self.updateValues();
        self.updatePreview();
      }

    // add callback to numberbox
    box.oninput= function() {
        const prop= name;
        let x= parseInt( this.value );
        self[ prop ]= (x > 255) ? 255 : x;  // clamp value down to 255
        self.updateValues();
        self.updatePreview();
    }

    // append spacer, containing the slider and box, to the ankor
    ankor.appendChild( spacer );
  }

  this.getColor= function() {
    return { r: this.r, g: this.g, b: this.b };
  }

  this.addCallback= function( c ) {
    this.callback= c;
  }

  this.updateValues= function() {
    let rs= this.r.toString();    // convert rgb numbers to string
    let gs= this.g.toString();
    let bs= this.b.toString();

    this.rSlider.value= rs;       // set slider values
    this.gSlider.value= gs;
    this.bSlider.value= bs;

    this.rBox.value= rs;          // set number box values
    this.gBox.value= gs;
    this.bBox.value= bs;

    // update color picker
    $("#ui-colorpicker").spectrum("set", 'rgb('+ rs+ ','+ gs+ ','+ bs+ ')' );

    // run callback if one is set
    if( this.callback !== null ) {
      this.callback( this.getColor() );
    }
  }

  this.updatePreview= function( r, g, b ) {
    this.previewField.style.backgroundColor= "rgb("+ this.r+ ","+ this.g+ ","+ this.b+ ")";
  }

  /* Constructor */
  this.callback= null;
  this.r=127;
  this.g=127;
  this.b=127;

  let picker = document.createElement("INPUT"); // create Picker tag element
  picker.setAttribute("type", "text");
  picker.setAttribute("id", "ui-colorpicker");
  node.contentDiv.appendChild( picker );

  this.previewField = document.createElement('div');  // add preview field
  this.previewField.classList.add( 'ui-colorpicker-prev' );
  node.contentDiv.appendChild( this.previewField );

  let sliders= document.createElement( 'div' ); // add slider container
  sliders.classList.add('ui-colorpicker-wrapper');
  node.contentDiv.appendChild( sliders );

  this.mkColorSlider( sliders, 'r' );
  this.mkColorSlider( sliders, 'g' );
  this.mkColorSlider( sliders, 'b' );

  $("#ui-colorpicker").spectrum({               // add colorPicker
    color: "#aaa",
    flat: true,
    showButtons: false,
    containerClassName: 'ui-colorpicker-picker'
  } );

  const self= this;
  $('#ui-colorpicker').on("dragstop.spectrum", function( e, c ) {
    let color= c.toRgb();
    self.r= color.r;
    self.g= color.g;
    self.b= color.b;

    self.updateValues();
    self.updatePreview();
  } );

  this.updateValues();
  this.updatePreview();

}

module.exports.ColorPicker= ColorPicker;
