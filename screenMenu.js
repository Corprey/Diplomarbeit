'use strict'
const Common= require( './common.js' );

function ScreenMenu() {

  let wrapper= document.getElementById("screenMenuHolder");
  this.prevPosUnit= "pl";
  this.prevDimUnit= "pl";
  this.prevDimUnit= "px";

  // create this.checkbox with label
  this.showWrapper= document.createElement("div");
  this.showWrapper.id= "showWrapper";
  this.showSpan= document.createElement("span");
  this.showSpan.innerHTML= "show";

  this.tempLabel= document.createElement("label"); // for custom this.checkbox
  this.tempSpan= document.createElement("span");
  this.tempSpan.classList.add("checkmark");

  this.checkbox= document.createElement("input");
  this.checkbox.type= "checkbox";
  this.checkbox.id=   "checkbox";
  this.checkbox.addEventListener( 'change', function() {
    ui.uiEditor.map.projection.enable(this.checked);
  });

  this.tempLabel.appendChild( this.checkbox );
  this.tempLabel.appendChild( this.tempSpan );

  this.showWrapper.appendChild( this.tempLabel );
  this.showWrapper.appendChild( this.showSpan );

//------------------- create position input -------------------------------

  this.posWrapper= document.createElement("div");
  this.posSpan= document.createElement("span");
  this.posSpan.innerHTML= "Position X | Y: ";

  this.posInputX= document.createElement("input");
  this.posInputX.type= "text";
  this.posInputX.id= "posInputX";
  this.posInputX.value= "0 pl";
  this.posInputX.classList.add("posInput");
  this.posInputX.addEventListener( 'keydown', keyEvent);

  this.posInputY= document.createElement("input");
  this.posInputY.type= "text";
  this.posInputY.id= "posInputY";
  this.posInputY.value= "0 pl";
  this.posInputY.classList.add("posInput");
  this.posInputY.addEventListener( 'keydown', keyEvent);

  this.posWrapper.appendChild( this.posSpan );
  this.posWrapper.appendChild( this.posInputX );
  this.posWrapper.appendChild( this.posInputY );

  //------------------ create dimension input ------------------------------

  this.dimWrapper= document.createElement("div");
  this.dimSpan= document.createElement("span");
  this.dimSpan.innerHTML= "Dimension W | H: ";

  this.dimInputX= document.createElement("input");
  this.dimInputX.type= "text";
  this.dimInputX.id= "dimInputX";
  this.dimInputX.value= "4 pl";
  this.dimInputX.classList.add("posInput");
  this.dimInputX.addEventListener( 'keydown', keyEvent);

  this.dimInputY= document.createElement("input");
  this.dimInputY.type= "text";
  this.dimInputY.id= "dimInputY";
  this.dimInputY.value= "4 pl";
  this.dimInputY.classList.add("posInput");
  this.dimInputY.addEventListener( 'keydown', keyEvent);

  this.dimWrapper.appendChild( this.dimSpan );
  this.dimWrapper.appendChild( this.dimInputX );
  this.dimWrapper.appendChild( this.dimInputY );

  //------------------ create resolution input ------------------------------

  this.resWrapper= document.createElement("div");
  this.resSpan= document.createElement("span");
  this.resSpan.innerHTML= "Resolution W | H: ";

  this.resInputX= document.createElement("input");
  this.resInputX.type= "text";
  this.resInputX.id= "resInputX";
  this.resInputX.value= "800 px";
  this.resInputX.classList.add("posInput");
  this.resInputX.addEventListener( 'keydown', keyEvent);

  this.resInputY= document.createElement("input");
  this.resInputY.type= "text";
  this.resInputY.id= "resInputY";
  this.resInputY.value= "600 px";
  this.resInputY.classList.add("posInput");
  this.resInputY.addEventListener( 'keydown', keyEvent);

  this.resWrapper.appendChild( this.resSpan );
  this.resWrapper.appendChild( this.resInputX );
  this.resWrapper.appendChild( this.resInputY );

  //------------------- add to wrapper ---------------------------

  wrapper.appendChild( this.showWrapper );
  wrapper.appendChild( this.posWrapper );
  wrapper.appendChild( this.dimWrapper );
  wrapper.appendChild( this.resWrapper );

  this.setPosition= function(d) {
    this.posInputX.value= "" + d.pos.val.x + " " + d.pos.unit;
    this.posInputY.value= "" + d.pos.val.y + " " + d.pos.unit;
    this.dimInputX.value= "" + d.dim.val.x + " " + d.dim.unit;
    this.dimInputY.value= "" + d.dim.val.y + " " + d.dim.unit;
    this.resInputX.value= "" + d.resX + "px";
    this.resInputY.value= "" + d.resY + "px";
  }

  //Key-events
  function keyEvent(event) {
    //Enter-Button
    if (event.keyCode == 13) {


      let xp= Common.checkPosInput('posInputX', this.prevPosUnit);
      let yp= Common.checkPosInput('posInputY', this.prevPosUnit);
      let up= xp.unit;
      this.prevPosUnit= up;

      let xd= Common.checkPosInput('dimInputX', this.prevDimUnit);
      let yd= Common.checkPosInput('dimInputY', this.prevDimUnit);
      let ud= xd.unit;
      this.prevDimUnit= ud;

      let xr= Common.checkPosInput('resInputX', this.prevResUnit);
      let yr= Common.checkPosInput('resInputY', this.prevResUnit);
      let ur= "px"; // only unit pixel is allowed
      this.prevResUnit= ur;


      ui.uiEditor.map.projection.resize(  xp.value, yp.value, up,
                                          xd.value, yd.value, ud,
                                          xr.value, yr.value );
    }
  }
}

module.exports.ScreenMenu= ScreenMenu;
