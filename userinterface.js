'use strict'
/* Javascript for UserInterace elements */

const {UIConsole} = require('./console.js');
const {AppInterface} = require('./applicationInterface.js');
const {Editor} = require('./editor.js');
const {CollapsibleMenu}= require('./collapsible.js');
const {Toolbar}= require('./toolbar.js');
const {ColorPicker} = require('./colorPicker.js');
const {ScreenMenu} = require('./screenMenu.js');
const Split= require('split.js');


function UserInterface() {

  const self= this;

  /*var ctrlDown = false;
  var ctrlKey = 17, vKey = 86, cKey = 67, zKey = 90;

  document.body.onkeydown = function(e) {
    if (e.keyCode == 17 || e.keyCode == 91) {
      ctrlDown = true;
    }
    if ((ctrlDown && e.keyCode == zKey) || (ctrlDown && e.keyCode == vKey) || (ctrlDown && e.keyCode == cKey)) {
      e.preventDefault();
      console.log("test");
    }
  }
  document.body.onkeyup = function(e) {
    if (e.keyCode == 17 || e.keyCode == 91) {
      ctrlDown = false;
    };
  }; */

  //set scale for font size to standard(1)
  this.fontScale= 1;

  //create interface for IPC
  this.interface= new AppInterface( this );

  //create sidebar menu elements and functionality
  this.uiMenu= new CollapsibleMenu('sidebar-menu', [
    {name: "Panel Chains", html: "<div id= 'panelLegHolder'> </div>"},
    {name: "Files", html: "files angezeigt"},
    {name: "Screen", html: "<div id= 'screenMenuHolder'> </div>" },
    {name: "tools", html: "output angezeigt" }
  ]);

  //reserve colorPicker
  this.uiColorPicker= null;

  this.uiScreenMenu= new ScreenMenu();

  //set up editor functionality
  this.uiEditor= new Editor( this.interface, { ankorName: 'editor', backColor: '#282c34',
                               compColor: 'white', gridColor: '#abb2bf', friendlyErrors: true,
                              mouseCb: function(x,y,u){ self.uiToolbar.status.setMousePosition(x,y,u); },
                              gridCb:  function(x,u){ self.uiToolbar ? self.uiToolbar.status.setGridSize(x,u) : null ; } } );



  //create toolbar menu elements and functionality
  this.uiToolbar= new Toolbar('tools-wrapper', [
    {id: 0, name: "Save",         iconType: 'far', iconImg: 'fa-save',          tooltipText:"  Save  ",  action:''},
    {id: 0, name: "Zoom In",      iconType: 'fas', iconImg: 'fa-search-plus',   tooltipText:"  Zoom In  ",  action:'ui.zoomIn();'},
    {id: 1, name: "Zoom Out",     iconType: 'fas', iconImg: 'fa-search-minus',  tooltipText:"  Zoom Out  ", action:'ui.zoomOut();'},
    {id: 2, name: "Undo",         iconType: 'fas', iconImg: 'fa-undo',          tooltipText:"  Undo  ",     action:'ui.uiEditor.actions.eventUndo();'},
    {id: 3, name: "Redo",         iconType: 'fas', iconImg: 'fa-redo',          tooltipText:"  Redo  ",     action:'ui.uiEditor.actions.eventRedo();'},
    {id: 4, type: "radio", connections: [5,6,7,8], name: "Mouse Cursor", iconType: 'fas', iconImg: 'fa-mouse-pointer',  tooltipText:'  Standard Cursor  ',  action:'ui.uiEditor.actions.setToolTip();', defaultEnabled: true },
    {id: 5, type: "radio", connections: [4,6,7,8], name: "Place Panel",  iconType: 'far', iconImg: 'fa-plus-square',    tooltipText:'  Place Panel  ',      action:'ui.uiEditor.actions.setToolTip("panel-place");'},
    {id: 6, type: "radio", connections: [4,5,7,8], name: "Paint",        iconType: 'fas', iconImg: 'fa-paint-brush',    tooltipText:'  Paint Tool  ',       action:'ui.uiEditor.actions.setToolTip();'},
    {id: 7, type: "radio", connections: [4,5,6,8], name: "Attach",      iconType: null, iconImg: 'add_leg.svg',         tooltipText:'  Connect Panel  ',    action:'ui.uiEditor.actions.setToolTip("leg-connect");'},
    {id: 8, type: "radio", connections: [4,5,6,7], name: "Detach",      iconType: null, iconImg: 'remove_leg.svg',      tooltipText:'  Detach Panel  ',     action:'ui.uiEditor.actions.setToolTip("panel-detach");'},
    {id: 3, name: "Start",        iconType: 'fas', iconImg: 'fa-play',          tooltipText:"  Start Compiling  ",     action:'ui.uiEditor.compiler.startComp();'}

  ]);


  this.uiEditor.setGridResolution( 24, "cm" );


  //set up uiconsole functionality with default values
  this.uiConsole= new UIConsole("console", {
    maxLineCount: 200, // maximum of lines
    maxCollCount: 400  // maximum of symbols per line
  });

  //default: show all workspace elements
  this.tiles= {
    sidebar : true,
    timeline: true,
    console: true
  };
/********************************************************************************************************************/
  // callback if Panel leg is created
  this.uiEditor.map.legs.cbAddLeg= function( legId ) {
    // get anker div
    let anker= document.getElementById("panelLegHolder");


    // when first leg is added
    if(anker.legArray == null) {
      anker.legArray= [];
    }
    // expand the array if the legId is greater than the length
    if( anker.legArray.length <= legId ) {
      while( anker.legArray.length <= legId ) {
         anker.legArray.push( null ); //fill empty spaces
      }

    } else { // check if leg id already exists
        if( anker.legArray[legId] !== null ) {
          return false;
        }
      }

    let node= document.createElement("div"); //create div (leg content)
    let button= document.createElement("button"); //create button (leg name)
    button.classList.add("panelLegParagraph");
    button.appendChild( document.createTextNode( "chain " + (legId + 1)) ); // set buttons name

    button.addEventListener("click", function() {
      ui.uiEditor.actions.setToolTip('leg-connect', legId);
      ui.uiToolbar.getById(7).update();
    });

    let leg= ui.uiEditor.map.legs.get(legId);
    if( leg !== null ) {
      let color= leg.getHexColor();
      button.style.backgroundColor= color;
    }

    node.appendChild( button );

      // look for next existing leg
      let i= 0;
      for(i= legId; i<anker.legArray.length; i++) {
        if(anker.legArray[i] !== null) {
          break;
        }
      }
      // insert at positon if a Leg exists afterwards
      // else insert at end of array
      anker.legArray[legId]= anker.insertBefore(node, anker.legArray[i]);
  }

  this.uiEditor.map.legs.cbDeleteLeg= function( lid ) {
    // get anker div
    let anker= document.getElementById("panelLegHolder");
    let leg= anker.legArray[lid];

    if( leg == null) {
      console.log("no leg found with id" + lid);
      return false;
    }

    //removes child (leg) from anker
    anker.removeChild(leg);
    //remove element from legArray
    anker.legArray[lid]= null;
  }

  this.uiEditor.map.legs.cbAddPanel= function(lid, pid, index) {
    // get anker div
    let anker= document.getElementById("panelLegHolder");
    let arr= anker.legArray[lid];

    if( arr == null) {
      console.log("no leg found with id" + lid);
      return false;
    }

    // when first panel is added
    if(arr.panelArray == null) {
      arr.panelArray= [];
    }
    // expand the array if the panelLegId is greater than the length
    if( arr.panelArray.length <= index ) {
      while( arr.panelArray.length <= index ) {
         arr.panelArray.push( null ); //fill empty spaces
      }
    }
      let icon= document.createElement("img");                 // create icon element
      icon.setAttribute("src", "./icons/leg-symbol.svg");  // set source of the image
      icon.classList.add("panelLegTree-icon");                  // set class

      let ast= ui.uiEditor.actions;

      let button= document.createElement("button"); //create span (chain name)
      //button.appendChild( icon );
      button.appendChild( document.createTextNode( "panel " + pid ) ); // set buttons name
      button.classList.add("panelLegPanel");
      button.addEventListener("click", function() {
      ast.setToolTip('cursor-tip');
      let panel;
      if( (panel= ui.uiEditor.map.get(pid)) !== null ) {
        ast.curTip.openPanelWindow(ast, panel);
      }
      });

      let contentDiv= document.createElement("div"); // create div holding the content
      contentDiv.classList.add("legButtonWrapper"); // add css classes to div
      contentDiv.appendChild( icon );
      contentDiv.appendChild( button );

      // look for next existing panel
      let i= 0;
      for(i= index; i<arr.panelArray.length; i++) {
        if(arr.panelArray[i] !== null) {
          break;
        }
      }
      // insert at positon if a panel exists afterwards
      // else insert at end of array
      let temp= arr.insertBefore(contentDiv, arr.panelArray[i]);
      arr.panelArray.splice(index, 0, temp);
  }

  this.uiEditor.map.legs.cbDeletePanel= function(lid, index) {

    // get anker div
    let anker= document.getElementById("panelLegHolder");
    let arr= anker.legArray[lid];

    if( arr == null) {
      console.log("no leg found with id" + lid);
      return false;

    } else if(arr.panelArray == null) { // when no panel in Leg
      console.log("no panel found in leg");
      return false;

    } else { // check if panelLegId already exists
        if( arr.panelArray[index] === null ) {
          console.log("no panel with id " + index + " found in leg");
          return false;
        }
      }

    // remove element from content div
    let child= arr.panelArray[index];
    arr.removeChild(child);
    //remove element from panelArray
    arr.panelArray.splice(index, 1);
  }
/********************************************************************************************************************/
  // make Split with default values and callback
  this.mkSplit= function( divs, config ) {
    let self= this;

    config.snapOffset= 5; //fixed value
    config.gutterSize= 5; //fixed value
    config.onDrag= function() { self.uiEditor.updateCanvas(); };

    return Split( divs, config );
  }

  this.addCloseX= function(divId, action, imgName) {

    let element= document.getElementById(divId);

    element.closeX= document.createElement("span");    // create button Icon element
    element.closeX.classList.add("fas");               // set css class
    element.closeX.classList.add(imgName);          // set css class
    element.closeX.classList.add("X");          // set css class
    element.button= document.createElement("button");  //Create button element
    element.button.appendChild( element.closeX );         // add menu icon
    element.button.classList.add("close-X");           // add css classes to button
    element.appendChild( element.button );



    if( typeof action === 'string' ) {                          // evaluate function as handler if param is string
      element.button.addEventListener("click", new Function( action ) );

    } else {
      element.button.addEventListener("click", action );           // set param as handler otherwise
    }
    let self= this;
    element.button.addEventListener("click", function() { self.uiEditor.updateCanvas(); } );
  }

/**************************************************Constructor*******************************************************/
  // make Arrays constant
  this.sidebarWrappers= function() { return ['#sidebar-wrapper', '#editor-wrapper']; }
  this.workspaceWrappers= function() { return [ '#workspace-wrapper', '#timeline-wrapper', '#console-wrapper' ]; }

  // split window into sidebar and workspace (adjustable width)
  this.splitSidebar= this.mkSplit(this.sidebarWrappers(), {
    sizes: [14, 86], //width in %
    minSize: [1,200] //minimal width of element in px
  });


  //spit workspace into editor, timeline and console (adjustable height)
  this.splitWorkspace= this.mkSplit(this.workspaceWrappers(), {
    sizes: [75, 12.5, 12.5], //height in %
    minSize: [200,1,1], //minimal height of element in px
    direction: 'vertical' //split orientation
  });

  this.addCloseX('timeline-wrapper', 'ui.hideTimeline();', 'fa-times');
  this.addCloseX('console-wrapper', 'ui.hideConsole();', 'fa-times');
  this.addCloseX('console-wrapper', 'ui.uiConsole.clearConsole();', 'fa-ban');




/********************************************************************************************************************/
  //Method functionality: set UI font size
  this.setUISize= function( x ) {
    this.fontScale= x/100; //convert from % to value

    $( ".UIScale" ).css( "font-size", String( x ) + "%" );
    $( ".UIScale h1" ).css( "font-size", String( x ) + "%" );
    //$( ".UIIcon" ).css( "font-size", "300%" );
  }

/********************************************************************************************************************/
  //Method functionality: scale up font
  this.zoomIn= function() {
    this.setUISize(this.fontScale * 100 + 10);
}

/********************************************************************************************************************/
  //Method functionality: scale down font
  this.zoomOut= function() {
    this.setUISize(this.fontScale * 100 - 10);
  }
/********************************************************************************************************************/
  //Method functionality: reset scale
  this.actualSize= function() {
    this.fontScale= 1;
    this.setUISize(this.fontScale * 100);
  }

/********************************************************************************************************************/
  //Method functionality: show entire workspace
  this.showCompleteWorkspace= function() {

    //make all elements visible
    for(let i = 0; i != this.workspaceWrappers().length; i++){
      $( this.workspaceWrappers()[i] ).css("display", "block");
    }

    //delete current slidebars
    this.splitWorkspace.destroy();

    //set flags to "currently shown"
    this.tiles.timeline= true;
    this.tiles.console= true;

    //gererate slidebars
    this.splitWorkspace= this.mkSplit(this.workspaceWrappers(), {
      sizes: [75, 12.5, 12.5], //height in %
      minSize: [200,1,1], //minimal height of element in px
      direction: 'vertical' //split orientation
    });
  }

/********************************************************************************************************************/
  //Method functionality: add timline window
  this.showTimeline= function() {

    //if console currently visible
    if(this.tiles.console == true ) {
      this.showCompleteWorkspace();
    }
    else {
      //make window visible
      $( "#timeline-wrapper" ).css("display", "block");
      //delete current slidebars
      this.splitWorkspace.destroy();
      //set flag to "currently shown"
      this.tiles.timeline= true;

      //gererate slidebars
      this.splitWorkspace= this.mkSplit(['#workspace-wrapper', '#timeline-wrapper'], {
        sizes: [75, 25], //height in %
        minSize: [200,1], //minimal height of element in px
        direction: 'vertical' //split orientation
      });
    }
  }

/********************************************************************************************************************/
  //Method functionality: add console window
    this.showConsole= function() {
      //if timeline currently visible
      if(this.tiles.timeline == true ) {
        this.showCompleteWorkspace();
      }
      else {
        //make window visible
        $( "#console-wrapper" ).css("display", "block");
        //delete current slidebars
        this.splitWorkspace.destroy();
        //set flag to "currently shown"
        this.tiles.console= true;

        //gererate slidebars
        this.splitWorkspace= this.mkSplit(['#workspace-wrapper', '#console-wrapper'], {
          sizes: [75, 25], //height in %
          minSize: [200,1], //minimal height of element in px
          direction: 'vertical' //split orientation
        });
      }
    }

/********************************************************************************************************************/
  // Method functionality: only show editor window
  this.onlyShowEditor= function() {
    this.splitWorkspace= this.mkSplit(['#workspace-wrapper'], {
      sizes: [100], //height in %
      minSize: [200], //minimal height of element in px
      direction: 'vertical' //split orientation
    });
  }

/********************************************************************************************************************/
  //Method functionality: remove timeline window
  this.hideTimeline = function() {
    //hide current window
    $( "#timeline-wrapper" ).css("display", "none");
    //delete current slidebars
    this.splitWorkspace.destroy();
    //set flag to "currently hidden"
    this.tiles.timeline= false;

    //if console currently visible
    if( this.tiles.console == true ) {
      //gererate slidebars
      this.splitWorkspace= this.mkSplit(['#workspace-wrapper', '#console-wrapper'], {
        sizes: [75, 25], //height in %
        minSize: [200,1], //minimal height of element in px
        direction: 'vertical' //split orientation
      });
    }
    else {
      this.onlyShowEditor();
    }
  }

/********************************************************************************************************************/
  //Method functionality: remove console window
  this.hideConsole= function() {
    //hide current window
    $( "#console-wrapper" ).css("display", "none");
    //delete current slidebars
    this.splitWorkspace.destroy();
    //set flag to "currently hidden"
    this.tiles.console= false;

    //if timeline currently visible
    if( this.tiles.timeline == true ) {
      //gererate slidebars
      this.splitWorkspace= this.mkSplit(['#workspace-wrapper', '#timeline-wrapper'], {
        sizes: [75, 25], //height in %
        minSize: [200,1], //minimal height of element in px
        direction: 'vertical' //split orientation
      });
    }
    else {
      this.onlyShowEditor();
    }
  }

/********************************************************************************************************************/
  //Create standard sidebar menu
  this.createColorPicker= function() {
    this.uiColorPicker= new ColorPicker( this.uiMenu.pushNode( {name: "Color Picker", html: ""} ) );
    this.uiColorPicker.addCallback( function(c) {  } );
  }



  this.uiConsole.println("Done starting Editor.");


}
