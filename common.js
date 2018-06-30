
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


function DefaultConfig( cnf, def, callback ) {

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

module.exports.filledString= filledString;
module.exports.paddedInteger= paddedInteger;
module.exports.DefaultConfig= DefaultConfig;
module.exports.swapCSSClass= swapCSSClass;
