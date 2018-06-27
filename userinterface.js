
const {UIConsole} = require('./console.js');
const {AppInterface} = require('./applicationInterface.js');


function mkSplit( divs, config ) {
  config.snapOffset= 5;
  config.gutterSize= 5;

  return Split(
      divs,
      config
   );
}

function UserInterface() {

  this.fontScale= 1;
  this.interface= new AppInterface( this );

  this.uiConsole= new UIConsole("console", {
    maxLineCount: 200,
    maxCollCount: 400
  });

  this.tiles= {
    sidebar : true,
    timeline: true,
    console: true
  };
/********************************************************************************************************************/
  // make const Array
  this.sidebarWrappers= function() { return ['#sidebar-wrapper', '#editor-wrapper']; }
  this.workspaceWrappers= function() { return [ '#workspace-wrapper', '#timeline-wrapper', '#console-wrapper' ]; }

  //verstellbare Sidebar hinzufuegen
  this.splitSidebar= mkSplit(this.sidebarWrappers(), {
    sizes: [25, 75],
    minSize: [1,200]
  });


  //verstellbare Timeline und Konsole hinzufuegen
  this.splitWorkspace= mkSplit(this.workspaceWrappers(), {
    sizes: [75, 12.5, 12.5],
    minSize: [200,1,1],
    direction: 'vertical'
  });


/********************************************************************************************************************/
  //UI-Schriftgroesse einstellen
  this.setUISize= function( x ) {
    this.fontScale= x/100;

    $( ".UIScale" ).css( "font-size", String( this.fontScale * 100 ) + "%" );
    $( ".UIScale h1" ).css( "font-size", String( this.fontScale * 100 ) + "%" );
    //$( ".UIIcon" ).css( "font-size", "300%" );
  }

/********************************************************************************************************************/
  //Vergroessere Schrift
  this.zoomIn= function() {
    this.setUISize(this.fontScale * 100 + 10);
}

/********************************************************************************************************************/
  //Verkleinere Schrift
  this.zoomOut= function() {
    this.setUISize(this.fontScale * 100 - 10);
  }

/********************************************************************************************************************/
  //Gesamten Workspace einblenden
  this.showCompleteWorkspace= function() {
    //Alle Elemente anzeigen (CSS)
    for(let i = 0; i != this.workspaceWrappers().length; i++){
      $( this.workspaceWrappers()[i] ).css("display", "block");
    }

    this.splitWorkspace.destroy();
    this.tiles.timeline= true;
    this.tiles.console= true;

    this.splitWorkspace= mkSplit(this.workspaceWrappers(), {
      sizes: [75, 12.5, 12.5],
      minSize: [200,1,1],
      direction: 'vertical'
    });
  }

/********************************************************************************************************************/
//Timeline einblenden
  this.showTimeline= function() {
    if(this.tiles.console == true ) {
      this.showCompleteWorkspace();
    } else {
      $( "#timeline-wrapper" ).css("display", "block");
      this.splitWorkspace.destroy();

      this.tiles.timeline= true;

      this.splitWorkspace= mkSplit(['#workspace-wrapper', '#timeline-wrapper'], {
        sizes: [75, 25],
        minSize: [200,1],
        direction: 'vertical'
      });
    }
  }

  /********************************************************************************************************************/
  //Console einblenden
    this.showConsole= function() {
      if(this.tiles.timeline == true ) {
        this.showCompleteWorkspace();
      } else {
        $( "#console-wrapper" ).css("display", "block");
        this.splitWorkspace.destroy();

        this.tiles.console= true;

        this.splitWorkspace= mkSplit(['#workspace-wrapper', '#console-wrapper'], {
          sizes: [75, 25],
          minSize: [200,1],
          direction: 'vertical'
        });
      }
    }

/********************************************************************************************************************/
  // Nur Editor ohne Schieber anzeigen
  this.onlyShowEditor= function() {
    this.splitWorkspace= mkSplit(['#workspace-wrapper'], {
      sizes: [100],
      minSize: [200],
      direction: 'vertical'
    });
  }

/********************************************************************************************************************/
  //Timeline ausblenden
  this.hideTimeline = function() {
    $( "#timeline-wrapper" ).css("display", "none");
    this.splitWorkspace.destroy();

    this.tiles.timeline= false;

    if( this.tiles.console == true ) {
      this.splitWorkspace= mkSplit(['#workspace-wrapper', '#console-wrapper'], {
        sizes: [75, 25],
        minSize: [200,1],
        direction: 'vertical'
      });
    } else {
      this.onlyShowEditor();
    }
  }

/********************************************************************************************************************/
  //Konsole ausblenden
  this.hideConsole = function() {
    $( "#console-wrapper" ).css("display", "none");
    this.splitWorkspace.destroy();

    this.tiles.console= false;

    if( this.tiles.timeline == true ) {
      this.splitWorkspace= mkSplit(['#workspace-wrapper', '#timeline-wrapper'], {
        sizes: [75, 25],
        minSize: [200,1],
        direction: 'vertical'
      });
    } else {
      this.onlyShowEditor();
    }
  }
}
