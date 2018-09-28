'use strict'
const Common= require('./common.js');

/*
* Icon Class managing the DOM Elements for each button
*/
function ToolbarIcon(cnf) {

  let config= new Common.DefaultConfig( cnf,
                                        { name: "tool", iconType: 'fas', iconImg: 'fa-search-plus', tooltipText:"undefined", action: function(){ console.log('Unassigned'); }, id: 0 },
                                        function( prop, val ) {
                                          console.error("Error in ToolbarIcon Class Constructor: Missing configuration argument: "+ prop+
                                                        "\nSetting default value: "+ val );
                                        } );

  this.name= config.name;
  this.iconType= config.iconType;
  this.iconImg= config.iconImg;
  this.action= config.action;
  this.id= config.id;
  this.tooltipText= config.tooltipText;

  this.toolIcon= document.createElement("span");    // create button Icon element
  this.toolIcon.classList.add(this.iconType);       // set css class
  this.toolIcon.classList.add(this.iconImg);        // set css class

  this.tooltip= document.createElement("span");
  this.tooltip.classList.add("tooltipText");
  this.tooltip.innerHTML = this.tooltipText;



  this.button= document.createElement("button");    //Create button element
  this.button.appendChild( this.toolIcon );         // add menu icon
  this.button.appendChild( this.tooltip );          // add tooltip
  this.button.classList.add("tool","tooltip");      // add css classes to button

  this.addEvent( this.action );                     //add event listener to button
}

//adds given event to the given element
ToolbarIcon.prototype.addEvent= function( action ) {
  if( typeof action === 'string' ) {                          // evaluate function as handler if param is string
    this.button.addEventListener("click", new Function( action ) );

  } else {
    this.button.addEventListener("click", action );           // set param as handler otherwise
  }
}

//adds new icon to toolbar div
ToolbarIcon.prototype.attachTo= function(anker) {
  anker.appendChild( this.button );
}

ToolbarIcon.prototype.hasId = function( x ) {
  return x === this.id;
}


/*
* RadioButton Class managing the activation and deactivation of its connections
* Interally it holds a ToolbarIcon as a mixin
*/
function RadioButton( cnf, menu ) {
  this.menu= menu;
  this.connections= cnf.connections;
  this.icon= new ToolbarIcon( cnf );

  // add event callback to call update method
  let self= this;
  this.icon.addEvent( function() { self.update(); } );

  cnf.defaultEnabled ? this.enable() : this.disable();
}

// Enable this button and disable all connected buttons
RadioButton.prototype.update= function() {
  // disable all connected buttons
  for( let i= 0; i!= this.connections.length; i++ ) {
    let ic= this.menu.getById( this.connections[i] );

    if( ic === null ) {
      console.error( "Connection to non existing icon." );
    } else {
      ic.disable();
    }
  }

  // enable button
  this.enable();
}

RadioButton.prototype.disable= function() {
  // CSS class ändern
   this.icon.button.classList.remove("radioButton-active");
   this.icon.button.classList.add("tool");
}

RadioButton.prototype.enable= function() {
  // CSS class ändern
  this.icon.button.classList.remove("tool");
  this.icon.button.classList.add("radioButton-active");
}

RadioButton.prototype.attachTo= function( x ) {
  this.icon.attachTo( x );
}

RadioButton.prototype.hasId = function( x ) {
  return this.icon.hasId( x );
}


function ToolbarStatus(anker) {

  this.anker= anker;
  const self= this;
  // Create HTML for Toolbar Status
  this.elements= Common.Builder( this.anker, ["x", "y", "unitx", "unity", "gridsize", "b0","b1","b2","b3","b4"],
  '<div class= "ToolbarStatus-wrapper" >'+
    '<div class= "toolbarDropdown" >' +
        '<img src= "icons/menu-arrow.svg" width= "12px" height= "12px"> ' +
        '<div class="toolbarDropdown-content"> '+
            '<button id= "b0"> 10in </button>' +
            '<button id= "b1"> 1ft </button>' +
            '<button id= "b2"> 24cm </button>' +
            '<button id= "b3"> 50cm </button>' +
            '<button id= "b4"> 1cm </button>' +
        '</div>'+
    '</div>' +
    '<div class= "gridFieldDiv" > <button> Grid: <span id= "gridsize"> </span> </button> </div>' +
    '<div class= "positionFieldDiv" >  Pos: <span id= "x" ></span> <span id= "unitx" ></span>  | <span id= "y" ></span> <span id= "unity" ></span> </div> ' +
  '</div>');

  this.elements.b0.addEventListener( 'click', function()  { ui.uiEditor.setGridResolution( 10, 'in' );} );


  this.setMousePosition= function( x, y, u ) {
    this.elements.x.innerHTML= x;
    this.elements.y.innerHTML= y;
    this.elements.unitx.innerHTML= u;
    this.elements.unity.innerHTML= u;
  }
}




/*
* Toolbar Class holding all buttons
*/
function Toolbar(name, arr) {

  this.createToolbarIcon= function(cnf) {
    let t;

    if( ( cnf !== undefined ) && (cnf.type == 'radio' ) ) {
      t= new RadioButton( cnf, this )
    } else {
      t= new ToolbarIcon(cnf);
    }

    this.icons.push( t );
    t.attachTo( this.anker );
  }

  this.getById= function( id ) {
    // Iterate through all icons and return the first with
    // ... matching id
    for( let i= 0; i!= this.icons.length; i++ ) {
      let icon= this.icons[i];

      if( icon.hasId( id ) ) {
        return icon;
      }
    }

    return null;
  }

  //Constructor
  this.anker= document.getElementById(name);
  this.icons= [];

  for( let i= 0; i!= arr.length; i++ ) {
    this.createToolbarIcon( arr[i] );
  }
  this.status= new ToolbarStatus(this.anker);
}

module.exports.Toolbar= Toolbar;
