'use strict'
const Common= require('./common.js');

function UIConsole( conname, cnf ) {


/********************************************************************************************************************/
  // Schreibt aktuellen den Text in HTML Container
  this.emitText= function() {
    let text= "";

    for( let i= this.lines.length-1; i >= 0; i-- ) {
      text += this.lines[i];
      text += "</br>";
    }

    this.container.innerHTML= text;
    this.container.scrollTop = this.container.scrollHeight;
  }

/********************************************************************************************************************/
  //Fügt Uhrzeit an Anfang an
  this.prefix= function( str ) {
    let time= new Date();
    let pref= "[" + Common.paddedInteger(time.getHours(), 2) +
              ":" + Common.paddedInteger(time.getMinutes(), 2) +
              ":" + Common.paddedInteger(time.getSeconds(), 2) +
              "] $ ";
    return pref + str;
  }

/********************************************************************************************************************/
  //speichert neue Zeile in Array
  this.addLine= function( str ) {
    let pos = 0;

    str= this.prefix( str );

    while( pos <= str.length ) {

      this.lines.unshift( str.substr( pos, this.config.maxCollCount ) );

      if( this.lines.length > this.config.maxLineCount  ) {
        this.lines.pop();
      }

      pos+= this.config.maxCollCount;
    }
  }

/********************************************************************************************************************/
  // Fügt neue Zeile hinzu und updated container
  this.println= function( str ) {
    this.addLine( str );
    this.emitText();
  }

  this.printError= function( str ) {
    this.addLine( '<span class= "console-error-msg"> [ERROR] ' + str + "</span>");
    this.emitText();
  }

  this.printWarning= function( str ) {
    this.addLine( '<span class= "console-warning-msg"> [WARN] ' + str + "</span>");
    this.emitText();
  }

/********************************************************************************************************************/
  //Löscht derzeitigen container Inhalt
  this.clearConsole= function() {
    this.container.innerHTML= "";
    this.lines=[];
  }

/********************************************************************************************************************/
  //Constructor

  this.lines= [];
  this.container= document.getElementById(conname);

  this.config= new Common.DefaultConfig( cnf,
                                        { maxLineCount: 200, maxCollCount: 350 },
                                        function( prop, val ) {
                                          console.error("Error in Console Class Constructor: Missing configuration argument: "+ prop+
                                                        "\nSetting default value: "+ val );
                                        } );

  this.clearConsole();


}


module.exports.UIConsole= UIConsole;
