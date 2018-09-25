'use strict'
/* Javascript for UserInterace elements */

const {UIConsole} = require('./console.js');
const {AppInterface} = require('./applicationInterface.js');
const {Editor} = require('./editor.js');
const {CollapsibleMenu}= require('./collapsible.js');
const {Toolbar}= require('./toolbar.js');
const {ColorPicker} = require('./colorPicker.js');
const Split= require('split.js');


function UserInterface() {
  //set scale for font size to standard(1)
  this.fontScale= 1;

  //create interface for IPC
  this.interface= new AppInterface( this );

  //create sidebar menu elements and functionality
  this.uiMenu= new CollapsibleMenu('sidebar-menu', [
    {name: "Panel Root", html: "<input type='text'></input>"},
    {name: "Files", html: "files angezeigt"},
    {name: "output", html: "output angezeigt" },
    {name: "tools", html: "output angezeigt" }
  ]);
  //reserve colorPicker
  this.uiColorPicker= null;


  //set up editor functionality
  this.uiEditor= new Editor( this.interface, { ankorName: 'editor', backColor: '#282c34',
                               compColor: 'white', gridColor: '#abb2bf', friendlyErrors: true } );

  //create toolbar menu elements and functionality
  this.uiToolbar= new Toolbar('toolbar-wrapper', [
    {id: 0, name: "Zoom In",      iconType: 'fas', iconImg: 'fa-search-plus',   tooltipText:"  Zoom In  ",  action:'ui.zoomIn();'},
    {id: 1, name: "Zoom Out",     iconType: 'fas', iconImg: 'fa-search-minus',  tooltipText:"  Zoom Out  ", action:'ui.zoomOut();'},
    {id: 2, name: "Undo",         iconType: 'fas', iconImg: 'fa-undo',          tooltipText:"  Undo  ",     action:'ui.uiEditor.actions.eventUndo();'},
    {id: 3, name: "Redo",         iconType: 'fas', iconImg: 'fa-redo',          tooltipText:"  Redo  ",     action:'ui.uiEditor.actions.eventRedo();'},
    {id: 4, type: "radio", connections: [5,6], name: "Mouse Cursor", iconType: 'fas', iconImg: 'fa-mouse-pointer', tooltipText:'  Standard Cursor  ',  action:'ui.uiEditor.actions.setToolTip();', defaultEnabled: true },
    {id: 5, type: "radio", connections: [4,6], name: "Place Panel",  iconType: 'far', iconImg: 'fa-plus-square',   tooltipText:'  Place Panel  ',      action:'ui.uiEditor.actions.setToolTip("panel-place");'},
    {id: 6, type: "radio", connections: [4,5], name: "Paint",        iconType: 'fas', iconImg: 'fa-paint-brush',   tooltipText:'  Paint Tool  ',       action:'ui.uiEditor.actions.setToolTip();'},


  ]);


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
  // make Split with default values and callback
  this.mkSplit= function( divs, config ) {
    let self= this;

    config.snapOffset= 5; //fixed value
    config.gutterSize= 5; //fixed value
    config.onDrag= function() { self.uiEditor.updateCanvas(); };

    return Split( divs, config );
  }

  this.addCloseX= function(divId, action) {

    let element= document.getElementById(divId);

    element.closeX= document.createElement("span");    // create button Icon element
    element.closeX.classList.add("fas");               // set css class
    element.closeX.classList.add("fa-times");          // set css class
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
    sizes: [12, 88], //width in %
    minSize: [1,200] //minimal width of element in px
  });


  //spit workspace into editor, timeline and console (adjustable height)
  this.splitWorkspace= this.mkSplit(this.workspaceWrappers(), {
    sizes: [75, 12.5, 12.5], //height in %
    minSize: [200,1,1], //minimal height of element in px
    direction: 'vertical' //split orientation
  });

  this.addCloseX('timeline-wrapper', 'ui.hideTimeline();');
  this.addCloseX('console-wrapper', 'ui.hideConsole();');




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
    this.uiColorPicker.addCallback( function(c) {
                                      console.log("Picker hat jetzt die Farbe: " );
                                      console.log(c);
                                    } );
  }






}
