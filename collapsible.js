
function MenuNode( cnf ) {

  this.name= cnf.name;

  this.button= document.createElement("button");          // create button element
  this.button.appendChild( document.createTextNode( this.name ) ); // set buttons name
  this.button.classList.add("collapsible");   // add css classes to button
  this.button.classList.add("UIScale");

  this.button.addEventListener("click", this.eventHandler );  // add event listener to button

  this.contentDiv= document.createElement("div");       // create div holding the content
  this.contentDiv.classList.add("collapsible-content"); // add css classes to div
  this.contentDiv.innerHTML= cnf.html;                  // create content in div

  this.close();

  if( cnf.hasOwnProperty("active") === true ) {       // if config has an 'active' property...
    if( cnf.active === 'true' ) {                     // ...the node can be set to be active by default
      this.button.classList.add("active");
      this.contentDiv.style.display = "block";
    }
  }
}

MenuNode.prototype.close= function() {
  this.button.classList.remove('active');
  this.contentDiv.style.display= 'none'
}

MenuNode.prototype.eventHandler= function() {
  this.classList.toggle("active");
  let content= this.nextElementSibling;

  if (content.style.display === "block") {
      content.style.display = "none";

  } else {
      content.style.display = "block";
  }
}

MenuNode.prototype.attachTo= function( anker, pos ) {
  pos*= 2;

  if( anker.children.length > 0 ) {
    if( (pos >= anker.children.length) || (pos < 0)  ) {
      anker.insertBefore( this.button, null );              // add to end of list if index is out of bounds
      anker.insertBefore( this.contentDiv, null );
    } else {

      anker.insertBefore( this.contentDiv, anker.children[pos] ); // insert at specified index
      anker.insertBefore( this.button, anker.children[pos] );
    }
  } else {
    anker.appendChild( this.button );       // insert into menu if the list is still empty
    anker.appendChild( this.contentDiv );
  }
}




function CollapsibleMenu( name, arr ) {

  this.anker= document.getElementById(name);
  this.nodes= [];

  for( let i= 0; i!= arr.length; i++ ) {
    this.pushNode( arr[i] );
  }

  this.closeAll= function() {
    for( let i= 0; i!= this.nodes.length; i++ ) {
      this.nodes[i].close();
    }
  }

  this.pushNode= function( node ) {
    this.addNode( this.anker.children.length-1, node );
  }

  this.addNode= function( pos, node ) {
    let n= new MenuNode( node );
    this.nodes.push( n );
    n.attachTo( this.anker, pos );
  }
}

module.exports.CollapsibleMenu= CollapsibleMenu;