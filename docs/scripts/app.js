(function() {
  // 'use strict';

  var app = {
    isLoading: true,
    spinner: document.querySelector('.loader'),
    container: document.querySelector('.main'),
    addDialog: document.getElementById('addDialog'),
	editDialog: document.getElementById('editDialog'),
	deleteDialog: document.getElementById('deleteDialog'),
	alertDialog: document.getElementById('alertDialog'),
	jottings: [],
	jottingList: [],
	jotting: null,
	path: [],
	list: document.getElementById('list'),
	listName: 'Jottings',  
	x:0,
	y:0
  };


  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/

  document.getElementById("heading").addEventListener('click', function() {
  	console.log("edit heading");
	if(app.path.length>0) { // no effect at top level
		app.toggleDialog("editDialog", true); // show section neame in edit dialog
		document.getElementById('text').value=app.listName;
		console.log("app.jotting is "+app.jotting.text);
	}
  });
  
  document.getElementById('butBack').addEventListener('click', function() {
    // back up a level (or close app if at top level)
    console.log("BACK");
	var list=app.jottings;
	app.path.pop();
	if(app.path.length>0) {
	 	var i=0;
		while(i<app.path.length) {
			list=list[app.path[i++]].content;
			console.log("list: "+list);
		}
		app.listName=list.text;
	 }
	else app.listName="Jottings";
	app.jottingList=list;
	app.populateList();
  });

  document.getElementById('butAdd').addEventListener('click', function() {
    // Open/show the add new jotting dialog
	var type=document.getElementById('type');
	if(app.path.length<1) type.options.selectedIndex=1;
	else type.options.selectedIndex=0;
	console.log("show add jotting diaog with blank text field");
    app.toggleDialog('addDialog',true);
	// document.getElementById('text').value="";
  });

  document.getElementById('butAddNewJotting').addEventListener('click', function() {
    // Add the new jotting
    var textBox = document.getElementById('newText');
    var jottingName = textBox.value;
    // create new (empty) jotting and show it for content to be added
	var jotting={};
	jotting.text=jottingName;
	var type=document.getElementById('type').options.selectedIndex;
	console.log("selected type: "+type);
	if(type>0) jotting.content=[];
	app.jottingList.push(jotting);
	/*
	if(app.path.length<1) app.jottings.push(jotting); // insert into full jottings list...
	else {
		var j=app.jottings[app.path[0]];
		var i=1;
		while (i<app.path.length) {
			j=j[app.path[i++]];
		}
		console.log('save jotting '+jotting.text+' in section '+j.text);
		j.content.push(jotting);
	}
	*/
	app.saveJottings(); // ...and save
	app.populateList();
    app.toggleDialog('addDialog',false);
  });

  document.getElementById('butCancelNewJotting').addEventListener('click', function() {
    // Close the add new jotting dialog
    app.toggleDialog('addDialog', false);
  });
  
  document.getElementById('butDelete').addEventListener('click', function() {
  	// initiate delete jotting/list
	  console.log("delete jotting "+app.jotting.text);
	  document.getElementById('butDelete').disabled=false;
	// app.jotting = app.jottingList[i];
		if(app.jotting.content!=null) {
			if(app.jotting.content.length>0) { // cannot delete lists unless empty
				document.getElementById('butDelete').disabled=true;
				console.log("delete disabled");
				// app.toggleDialog("alertDialog", true);
				// return;
			}
		}
		app.toggleDialog("deleteDialog", true);
		document.getElementById('deleteText').innerHTML = app.jotting.text;
		app.toggleDialog("editDialog", false);
  });
  
  document.getElementById('butSave').addEventListener('click', function() {
  	// Save edited jotting
	  var text = document.getElementById("text").value;
	  app.toggleDialog('editDialog',false);
	  console.log("Save jotting");
	  app.jotting.text = text;
	  if(app.jotting.content!=null) app.listName=text;
	  /*
	  var j=app.jottings[app.path[0]]; // update in full jottings list...
	  var i=1; 
	  while (i<app.path.length) {
			j=j[app.path[i++]];
	  }
	  j=app.jotting;
	  */
	  app.saveJottings(); // ...and save
	  app.populateList();
  })
 
  document.getElementById('butCancelEdit').addEventListener('click', function() {
    // Close the edit jotting dialog
    app.toggleDialog('editDialog', false);
  });
  
  document.getElementById('butDeleteConfirm').addEventListener('click', function() {
  	// confirm delete jotting/list
	console.log("delete jotting "+app.jotting.text);
	var i=app.jottingList.indexOf(app.jotting);
	console.log("item "+i);
	app.jottingList.splice(i,1);
	app.populateList();
	app.saveJottings();
	app.toggleDialog('deleteDialog', false);
  });
  
  document.getElementById('butCancelDelete').addEventListener('click', function() {
    // Close the delete dialog
    app.toggleDialog('deleteDialog', false);
  });
  /* not needed
   document.getElementById('butCancelAlert').addEventListener('click', function() {
    // Close the alert dialog
    app.toggleDialog('alertDialog', false);
  });
 */
   /*****************************************************************************
   * Methods to update/refresh the UI
   ****************************************************************************/

  // Toggles the visibility of the add new jotting dialog.
  app.toggleDialog = function(d, visible) {
	  console.log("show "+d+" dialog: "+visible);
	  if(d=='addDialog') { // toggle ADD dialog
	  	 if (visible) {
      		app.addDialog.classList.add('dialog-container--visible');
			document.getElementById('newText').value="";
    		} else {
      		app.addDialog.classList.remove('dialog-container--visible');
    		}
	  }
	  else if(d=='editDialog') { // toggle EDIT dialog
	  	 if (visible) {
      		app.editDialog.classList.add('dialog-container--visible');
   		 } else {
     		 app.editDialog.classList.remove('dialog-container--visible');
    		}
	  }
	  else if(d=='deleteDialog') { // toggle DELETE dialog
	  	if (visible) {
      		app.deleteDialog.classList.add('dialog-container--visible');
   		 } else {
     		 app.deleteDialog.classList.remove('dialog-container--visible');
    		}
	  }
	   else  { // toggle ALERT dialog
	  	if (visible) {
      		app.alertDialog.classList.add('dialog-container--visible');
   		 } else {
     		 app.alertDialog.classList.remove('dialog-container--visible');
    		}
	  }
  };

  // Save jottings to localStorage FOR NOW - LATER USE HOODIE
  app.saveJottings = function() {
    var jottings = JSON.stringify(app.jottings);
    localStorage.jottings = jottings;
	console.log("JOTTINGS SAVED: "+jottings);
  };
  
  // monitor  tap/drag operations
  app.touchStart = function(event) {
  	var item=event.target;
	app.x=event.clientX;
	app.y=event.clientY;
	console.log("touch at: "+app.x+","+app.y);
  }
  
  app.touchEnd= function(event) {
  	var item=event.target;
	var x=event.clientX;
	var y=event.clientY;
	x-=app.x;
	y-=app.y;
	console.log("dragged: "+x+","+y);
	var text = item.textContent;
	var i=0;
	while(app.jottingList[i].text!=text) {i++};
	console.log("item "+i+": "+app.jottingList[i]);
	if((Math.abs(x)<10)&&(Math.abs(y)<10)) app.openItem(i);
	else if((Math.abs(y)<10)&&(x<-20)) {
		console.log("DELETE"); // ---------- NEED TO WRITE DELETE CODE ----------------------
		app.jotting = app.jottingList[i];
		if(app.jotting.content!=null) {
			if(app.jotting.content.length>0) { // cannot delete lists unless empty
				app.toggleDialog("alertDialog", true);
				return;
			}
		}
		app.toggleDialog("deleteDialog", true);
		document.getElementById('deleteText').innerHTML = app.jotting.text;
		// }
	}
	else if((Math.abs(x)<10)&&(y<-20)) console.log("MOVE UP"); // ------- NEED TO WRITE MOVE UP/DOWN CODE ---------
	else if((Math.abs(x)<10)&&(y>20)) console.log("MOVE DOWN");
  }
  
  // Open jotting/section
  app.openItem = function(i) {
	  app.jotting = app.jottingList[i];
	  if(app.jotting.content!=null) { // list
		  app.path.push(i); // path lists hierarchy to current section
		  app.jottingList = app.jotting.content;
		  app.listName=app.jotting.text;
		  app.populateList();
	  }
	  else { // just a jotting - open for editing
		app.toggleDialog("editDialog", true);
		document.getElementById("text").value = app.jotting.text;
	  }
  }
  
  app.populateList = function() {
	 console.log("populate list for path "+app.path+" with "+app.jottingList);
	 document.getElementById("heading").innerHTML=app.listName;
	app.list.innerHTML=""; // clear list
  	for(var i in app.jottingList) {
  	 	var listItem = document.createElement('li');
	  	listItem.classList.add('item');
		// listItem.addEventListener('click', app.openItem, false);
		listItem.addEventListener('pointerdown',app.touchStart,false);
		listItem.addEventListener('pointerup',app.touchEnd,false);
		listItem.textContent = app.jottingList[i].text;
		if(app.jottingList[i].content!=null) {
			listItem.style.fontWeight='bold';
		}
	  	app.list.appendChild(listItem);
  	}
	if(app.path.length<1) {
	  document.getElementById("butBack").style.display="none";
	  // document.getElementById("butMenu").style.display="none";
  	}
	else {
	  document.getElementById("butBack").style.display="block";
	  // document.getElementById("butMenu").style.display="block";
	}
  }

  // fake data for initial testing
  var fakeData = {
	  jottings: [
	  {text: 'Shopping list', content: [{text: '(empty)'}]},
	  {text: 'Petrol', content: [{text: '10/12/17 32@17345'}, {text: '2/12/17 34@17003'}]},
	  {text: 'Music', content: [
		  {text: 'New songs', content: [{text: '[(empty)'}]},
		  {text: 'Re-rip...', content: [{text: '(empty)'}]},
		  {text: 'Delete...', content: [{text: '(empty)'}]}
		  ]},
	  {text: 'a simple jotting'}
	  ]}

  /************************************************************************
   *
   * Code required to start the app
   *
   * NOTE: To simplify this codelab, we've used localStorage.
   *   localStorage is a synchronous API and has serious performance
   *   implications. It should not be used in production applications!
   *   Instead, check out IDB (https://www.npmjs.com/package/idb) or
   *   SimpleDB (https://gist.github.com/inexorabletash/c8069c042b734519680c)
   ************************************************************************/

  // TODO add startup code here
  app.jottings = localStorage.jottings;
  console.log("jottings:"+app.jottings);
  if (app.jottings) {
    app.jottings = JSON.parse(app.jottings);	  
  }
  else {     // initial testing with fake data
	  console.log("data:"+fakeData);
	  // var data=JSON.parse(fakeData);
	  // console.log("data:"+data);
	  app.jottings = fakeData.jottings; // data.jottings
	  console.log("jottings:"+app.jottings);
  }
  // NEED TO DISPLAY FIRST PAGE WITH "Jottings" HEADING AND LIST OF FAKE DATA JOTTING NAMES
  app.jottingList = app.jottings;
  app.listName="Jottings";
  app.populateList();
  /*
  app.list.children = null; // clear list
  for(var i in app.jottingList) {
  	   var listItem = document.createElement('li');
	  listItem.classList.add('item');
	  listItem.textContent = app.jottingList[i].name;
	  listItem.addEventListener('click', app.openItem, false);
	  if(app.jottingList[i].name!=null) listItem.style.fontWeight='bold';
	  app.list.appendChild(listItem);
  }
  */
  // app.toggleDialog("editDialog",true);
  /*
  var text="";
  for(var i in app.list) {
	  var content=app.list[i].content;
	  console.log("content "+i+" size: "+content.length);
	  console.log("first sub-item: "+content[0]);
	  if(content[0].name!=null) {
		  var n=content.length;
		  console.log(n+" objects");
	  }
  	text+="<li class='item' ";
	   if(content[0].name!=null) {
		   text += "style='font-weight:bold' "
	   }
	   text+=">"+app.list[i].name+"</li>";
  }
  text+="</ul>";
  document.getElementById('list').innerHTML=text;
  });
  */

  
  
  if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
 
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./service-worker.js')
             .then(function() { console.log('Service Worker Registered'); });
  }

})();
