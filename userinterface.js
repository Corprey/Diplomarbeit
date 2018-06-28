/* Javascript for UserInterace elements */


const {UIConsole} = require('./console.js');
const {AppInterface} = require('./applicationInterface.js');
const {Editor} = require('./editor.js');
const {CollapsibleMenu}= require('./collapsible.js');

function UserInterface() {
  //set scale for font size to standard(1)
  this.fontScale= 1;

  //create interface for IPC
  this.interface= new AppInterface( this );

  //create sidebar menu elements and functionality
  this.uiMenu= new CollapsibleMenu('sidebar-menu', [] );

  //set up editor functionality
  this.uiEditor= new Editor();

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

    //
    config.onDragEnd= function() { self.uiEditor.updateCanvas(); };

    return Split(
        divs,
        config
     );
  }

/**************************************************Constructor*******************************************************/
  // make Arrays constant
  this.sidebarWrappers= function() { return ['#sidebar-wrapper', '#editor-wrapper']; }
  this.workspaceWrappers= function() { return [ '#workspace-wrapper', '#timeline-wrapper', '#console-wrapper' ]; }

  // split window into sidebar and workspace (adjustable width)
  this.splitSidebar= this.mkSplit(this.sidebarWrappers(), {
    sizes: [25, 75], //width in %
    minSize: [1,200] //minimal width of element in px
  });


  //spit workspace into editor, timeline and console (adjustable height)
  this.splitWorkspace= this.mkSplit(this.workspaceWrappers(), {
    sizes: [75, 12.5, 12.5], //height in %
    minSize: [200,1,1], //minimal height of element in px
    direction: 'vertical' //split orientation
  });


/********************************************************************************************************************/
  //Method functionality: set UI font size
  this.setUISize= function( x ) {
    this.fontScale= x/100; //convert from % to value

    $( ".UIScale" ).css( "font-size", String( this.fontScale * 100 ) + "%" );
    $( ".UIScale h1" ).css( "font-size", String( this.fontScale * 100 ) + "%" );
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

      this.tiles.timeline= true;

      this.splitWorkspace= this.mkSplit(['#workspace-wrapper', '#timeline-wrapper'], {
        sizes: [75, 25],
        minSize: [200,1],
        direction: 'vertical'
      });
    }
  }

/********************************************************************************************************************/
  //Method functionality: add console window
    this.showConsole= function() {
      //if timeline currently visible
      if(this.tiles.timeline == true ) {
        this.showCompleteWorkspace();
      } else {
        $( "#console-wrapper" ).css("display", "block");
        this.splitWorkspace.destroy();

        this.tiles.console= true;

        this.splitWorkspace= this.mkSplit(['#workspace-wrapper', '#console-wrapper'], {
          sizes: [75, 25],
          minSize: [200,1],
          direction: 'vertical'
        });
      }
    }

/********************************************************************************************************************/
  // Method functionality: only show editor window
  this.onlyShowEditor= function() {
    this.splitWorkspace= this.mkSplit(['#workspace-wrapper'], {
      sizes: [100],
      minSize: [200],
      direction: 'vertical'
    });
  }

/********************************************************************************************************************/
  //Method functionality: remove timeline window
  this.hideTimeline = function() {
    $( "#timeline-wrapper" ).css("display", "none");
    this.splitWorkspace.destroy();

    this.tiles.timeline= false;

    if( this.tiles.console == true ) {
      this.splitWorkspace= this.mkSplit(['#workspace-wrapper', '#console-wrapper'], {
        sizes: [75, 25],
        minSize: [200,1],
        direction: 'vertical'
      });
    } else {
      this.onlyShowEditor();
    }
  }

/********************************************************************************************************************/
  //Method functionality: remove console window
  this.hideConsole = function() {
    $( "#console-wrapper" ).css("display", "none");
    this.splitWorkspace.destroy();

    this.tiles.console= false;

    if( this.tiles.timeline == true ) {
      this.splitWorkspace= this.mkSplit(['#workspace-wrapper', '#timeline-wrapper'], {
        sizes: [75, 25],
        minSize: [200,1],
        direction: 'vertical'
      });
    } else {
      this.onlyShowEditor();
    }
  }
}
