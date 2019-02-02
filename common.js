'use strict'

// Create String filled with the specified charater
function filledString( character , length) {
  return new Array(length + 1).join( character )
}

// Convert interger to string and add leading zeros as padding
function paddedInteger(num, size ) {
  let str= ""+ num;
  if(num <0 ) {
    return '-'+ filledString( '0', size- str.length)+ str.slice(1);
  }
  return filledString( '0', size- str.length) + str;
}


function DefaultConfig( cnf, def, callback= function(){} ) {

  // Iteratre through all properties of the default-config
  for( let prop in def ) {

    // Set the config to default values if the specified-config is either
    // 'undefined' or misses properties
    if( (typeof cnf === 'undefined') || (cnf.hasOwnProperty( prop ) === false) ) {
      this[prop]= def[prop];
      callback( prop, def[prop], (typeof cnf === 'undefined') || ( def[prop] === null ) );

    } else {
      this[prop]= cnf[prop];
    }
  }
}

//validates the Position/Grid input if number and unit are legal
function checkPosInput(ele, prevUnit, box= null) {

  let units= ["mm", "cm", "pl", "px", "m", "mil", "in", "ft"];
  let input= document.getElementById(ele).value;
  let dat= {};

  //seperate number from text
  let value= input.match(/^-?\d+/g);
  let unit=  input.match(/[a-zA-Z]+/g);

  //get rid of unnecessary array (created by match function)
  dat.value= value[0];
  dat.unit= (unit !== null) ? unit[0] : null;

  if(dat.unit === null){ // missing unit -> keep last unit
    dat.unit= prevUnit;
  }

  if((dat.unit == null ) || (units.indexOf(dat.unit) < 0) ){
    if(box!== null) { box.createErrorBox("Error: invalid unit!"); }
    else { ui.uiConsole.printError("invalid unit!"); }
  }
  else if(!dat.value) {
      if(box!== null) {box.createErrorBox("Error: invalid value!"); }
      else { ui.uiConsole.printError("invalid value!"); }
  }
  else {
    return dat;
  }
  return null;
}




// Swaps the CSS Classes of a DOM Element (only the first one is checked)
function swapCSSClass( element, ca, cb ) {
  if( element.classList.contains( ca ) ) {
    element.classList.remove( ca );
    element.classList.add( cb );
  } else {
    element.classList.add( ca );
    element.classList.remove( cb );
  }
}

// A very simple set class for small integer ranges
function SimpleSet() {
  this.arr= [];

  this.add= function( value ) {
    while(value >= this.arr.length) {
      this.arr.push( false );
    }
    this.arr[value]= true;
  }

  this.forEach= function( cb ) {
    for( let i= 0; i!= this.arr.length; i++ ) {
      if( this.arr[i] === true ) {
        cb( i );
      }
    }
  }
}

// Very simple pipe to store objects in the order they were received
function ObjPipe() {
  this.arr= [];

  this.push= function( o ) {
    this.arr.unshift( o );
  }

  this.get= function() {
    if( this.isEmpty() ) {
      return null;
    }
    return this.arr.pop();
  }

  this.isEmpty= function() {
    return this.arr.length === 0;
  }
}

// Pack a buffer into a Utf-16 string
function packBuffer(buf) {
  return  (buf.buffer !== undefined)  ? String.fromCharCode.apply(null, new Uint16Array( buf.buffer ))
                                      : String.fromCharCode.apply(null, new Uint16Array( buf ));
}

// Convert an Utf-16 string to a buffer
function unpackBuffer(str) {
  let buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  let bufView = new Uint16Array(buf);
  let len= str.length;

  for (let i=0; i < len; i++) {            // get char codes as data
    bufView[i] = str.charCodeAt(i);
  }

  return buf;
}


function Builder( anker, ids, html ) {

  anker.innerHTML += html;

  let elm= {};

  for(let i= 0; i!= ids.length; i++ ) {
    elm[ ids[i] ]= document.getElementById( ids[i] );
  }

  return elm;
}

// returns differences between two objects as new object
function mkDifference( a, b ) {
  let diff= {};
  let keys= Object.keys(a);

  for( let i= 0; i!= keys.length; i++ ) {
    let key= keys[i];
    if( typeof a[key] === 'object' && a[key] !== null ) {
      if( typeof b[key] === 'object' && b[key] !== null ) {

        let x= mkDifference(  a[key] , b[key] );
        if( Object.keys(x).length > 0 ) {
          diff[key]= x;
        }
      } else {
        diff[key]= b[key];
      }

    } else {
      if( a[key] != b[key] ) {
        diff[key]= b[key];
      }
    }
  }

  return diff;
}


/* Hack to make script file loadable via 'importScripts' in a Web-Worker */
if( typeof WorkerGlobalScope !== 'undefined') {
    this.module= {};
    this.module.exports= {};
}

module.exports.filledString= filledString;
module.exports.paddedInteger= paddedInteger;
module.exports.DefaultConfig= DefaultConfig;
module.exports.checkPosInput= checkPosInput;
module.exports.swapCSSClass= swapCSSClass;
module.exports.SimpleSet= SimpleSet;
module.exports.ObjPipe= ObjPipe;
module.exports.packBuffer= packBuffer;
module.exports.unpackBuffer= unpackBuffer;
module.exports.Builder= Builder;
module.exports.mkDifference= mkDifference;
