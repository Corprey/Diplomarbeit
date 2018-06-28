
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

  for( let prop in def ) {
    if( cnf.hasOwnProperty( prop ) === false ) {
      this[prop]= def[prop];
      callback( prop, def[prop] );

    } else {
      this[prop]= cnf[prop];
    }
  }
}

module.exports.filledString= filledString;
module.exports.paddedInteger= paddedInteger;
module.exports.DefaultConfig= DefaultConfig;
