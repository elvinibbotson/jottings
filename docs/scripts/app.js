(function() {
  'use strict';
	
  // global variables
	
  var app = {
    isLoading: true,
    spinner: document.querySelector('.loader'),
    container: document.querySelector('.main'),
    addDialog: document.getElementById('addDialog'),
	editDialog: document.getElementById('editDialog'),
	deleteDialog: document.getElementById('deleteDialog'),
	jottings: [],
	jottingList: [],
	jotting: null,
	path: [],
	list: document.getElementById('list'),
	listName: 'Jottings'
  };

  // set up event listeners
  
  document.getElementById("heading").addEventListener('click', function() {
  	console.log("edit heading");
	if(app.path.length>0) { // no effect at top level
		document.getElementById('butDelete').disabled=false;
		document.getElementById('butDelete').style.color='red';
		console.log("jotting content: "+app.jotting.content);
		// try this...
		console.log(app.jottingList.length+" items");
		if(app.jottingList.length>0) { // cannot delete non-empty lists
			document.getElementById('butDelete').disabled=true;
			document.getElementById('butDelete').style.color='gray';
			console.log("delete button disabled");
		}
		app.toggleDialog("editDialog", true); // show section name in edit dialog
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
			list=list[app.path[i++]];
			console.log("list: "+list);
		}
		app.listName=list.text;
		list=list.content;
	 }
	else app.listName="Jottings";
	console.log("list name: "+app.listName);
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
	  app.saveJottings();
	  app.populateList();
  })
 
  document.getElementById('butCancelEdit').addEventListener('click', function() {
    // Close the edit jotting dialog
    app.toggleDialog('editDialog', false);
  });
  
  document.getElementById('butDeleteConfirm').addEventListener('click', function() {
  	// confirm delete jotting/list
	console.log("delete jotting "+app.jotting.text);
	var list=app.jottings;
	var i=0;  
	if(app.jottingList.length<1) { // delete empty list (below top level) so...
		console.log("path length: "+app.path.length);
		app.path.pop(); // deleting this (empty) list
		while(i<app.path.length) {
			console.log("path["+i+"]: "+app.path[i]);
			list=list[app.path[i++]];
			console.log("list: "+list.text+" - first item: "+list.content[0].text);
		}
		app.jottingList=list.content; // ...jottingList is parent list
		app.listName=list.text;
		// test code
		console.log("list: "+app.jottingList);
		i=0;
		while(i<app.jottingList.length) {
			console.log("item "+i+": "+app.jottingList[i++].text);
		}
		i=app.jottingList.indexOf(app.jotting);
		console.log("item "+i);
		app.jottingList.splice(i,1);
	}
	else { // delete jotting
		i=app.jottingList.indexOf(app.jotting);
		console.log("item "+i);
		app.jottingList.splice(i,1);
		if(app.path.length>0) {
			while(i<app.path.length) {
				list=list[app.path[i++]];
				console.log("list: "+list);
			}
			app.listName=list.text;
			list=list.content;
	 	}
		else app.listName="Jottings";
		console.log("list name: "+app.listName);
		app.jottingList=list;
		app.populateList();
	}
	app.saveJottings();
	app.toggleDialog('deleteDialog', false);
  });
  
  document.getElementById('butCancelDelete').addEventListener('click', function() {
    // Close the delete dialog
    app.toggleDialog('deleteDialog', false);
  });

  // Toggles the visibility of dialogs
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
  };

  // Save jottings to localStorage FOR NOW - LATER USE HOODIE
  app.saveJottings = function() {
    var jottings = JSON.stringify(app.jottings);
    localStorage.jottings = jottings;
	console.log("JOTTINGS SAVED: "+jottings);
  };
  
  // Open jotting/section
  app.openItem = function() {
	var item=event.target;
	event.preventDefault();
	var text = item.textContent;
	var i=0;
	while(app.jottingList[i].text!=text) {i++};
	console.log("item "+i+": "+app.jottingList[i]);
	app.jotting = app.jottingList[i];
	if(app.jotting.content!=null) { // list
		  app.path.push(i); // path lists hierarchy to current section
		  app.jottingList = app.jotting.content;
		  app.listName=app.jotting.text;
		  app.populateList();
	}
	else { // just a jotting - open for editing
		document.getElementById('butDelete').disabled=false;
		document.getElementById('butDelete').style.color='red';
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
		listItem.addEventListener('click', app.openItem, false);
		// listItem.addEventListener('pointerdown',app.touchStart,false);
		// listItem.addEventListener('touchmove',app.drag,false);
		// listItem.addEventListener('pointerup',app.touchEnd,false);
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

  // startup code
  
  app.jottings = localStorage.jottings; // load any saved data...
  console.log("jottings:"+app.jottings);
  if (app.jottings) {
    app.jottings = JSON.parse(app.jottings);	  
  }
  else {     // ...or if none, use fake data
	  console.log("data:"+fakeData);
	  app.jottings = fakeData.jottings; // data.jottings
	  console.log("jottings:"+app.jottings);
  }
  // display top level
  app.jottingList = app.jottings;
  app.listName="Jottings";
  app.populateList();
  // hide loading spinner
  if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  // implement service worker if browser is PWA friendly 
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./service-worker.js')
             .then(function() { console.log('Service Worker Registered'); });
  }
  else console.log("not PWA freindly");
})();
