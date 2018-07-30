'use strict'
const Common= require('./common.js');

/*
* Icon Class managing the DOM Elements for each button
*/
function ToolbarIcon(cnf) {

  let config= new Common.DefaultConfig( cnf,
                                        { name: "tool", iconType: 'fas', iconImg: 'fa-search-plus', action: function(){ console.log('Unassigned'); } },
                                        function( prop, val ) {
                                          console.error("Error in ToolbarIcon Class Constructor: Missing configuration argument: "+ prop+
                                                        "\nSetting default value: "+ val );
                                        } );

  this.name= config.name;
  this.iconType= config.iconType;
  this.iconImg= config.iconImg;
  this.action= config.action;

  this.toolIcon= document.createElement("span");    // create button Icon element
  this.toolIcon.classList.add(this.iconType);       // set css class
  this.toolIcon.classList.add(this.iconImg);        // set css class

  this.button= document.createElement("button");    //Create button element
  this.button.appendChild( this.toolIcon );         // add menu icon
  this.button.classList.add("tool");                // add css classes to button

  this.addEvent(this.button, this.action);          //add event listener to button
}

//adds given event to the given element
ToolbarIcon.prototype.addEvent= function(anker, action) {
  if( typeof action === 'string' ) {                          // evaluate function as handler if param is string
    anker.addEventListener("click", new Function( action ) );

  } else {
    anker.addEventListener("click", action );                 // set param as handler otherwise
  }
}

//adds new icon to toolbar div
ToolbarIcon.prototype.attachTo= function(anker) {
  anker.appendChild( this.button );
}


/*
* Toolbar Class holding all buttons
*/
function Toolbar(name, arr) {
  this.anker= document.getElementById(name);
  this.icons= [];

  for( let i= 0; i!= arr.length; i++ ) {
    this.createToolbarIcon( arr[i] );
  }

  this.createToolbarIcon= function(cnf) {
    let t= new ToolbarIcon(cnf);
    this.icons.push( t );
    t.attachTo( this.anker );
  }
}

module.exports.Toolbar= Toolbar;
