(function() {
  'use strict';
	
  // GLOBAL VARIABLES	
  var app = {
    isLoading: true,
    spinner: document.querySelector('.loader'),
    container: document.querySelector('.main'),
    addDialog: document.getElementById('addDialog'),
	editDialog: document.getElementById('editDialog'),
	deleteDialog: document.getElementById('deleteDialog'),
	keyDialog: document.getElementById('keyDialog'),
	newKeyDialog: document.getElementById('newKeyDialog'),
	jottings: [],
	jottingList: [],
	jotting: null,
	path: [],
	list: document.getElementById('list'),
	listName: 'Jottings',
	keyCode: null,
	locked: true,
	secure: false
  };

  // EVENT LISTENERS
  document.getElementById("heading").addEventListener('click', function() { // HEADING
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
  
  document.getElementById('butBack').addEventListener('click', function() { // BACK BUTTON
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
		var text=list.text;
		if(list.secure>0) text=app.cryptify(text,app.keyCode); // deal with secure lists
		app.listName=text;
		app.secure=(list.secure>0);
		console.log("secure is now "+app.secure);
		// app.listName=list.text;
		list=list.content;
	 }
	else app.listName="Jottings";
	console.log("list name: "+app.listName);
	app.jottingList=list;
	app.populateList();
  });

  document.getElementById('butAdd').addEventListener('click', function() { // ADD BUTTON
    // Open/show the add new jotting dialog
	var type=document.getElementById('type');
	if(app.path.length<1) type.options.selectedIndex=1;
	else type.options.selectedIndex=0;
	console.log("show add jotting diaog with blank text field");
    app.toggleDialog('addDialog',true);
	// document.getElementById('text').value="";
  });

  document.getElementById('butAddNewJotting').addEventListener('click', function() { // NEW JOTTING/LIST
    // Add the new jotting
    var textBox = document.getElementById('newText');
    var jottingName = textBox.value;
    // create new (empty) jotting and show it for content to be added
	var jotting={};
	
	var type=document.getElementById('type').options.selectedIndex;
	console.log("selected type: "+type);
	if(type>0) jotting.content=[];
	if((type>1) || (app.secure==true)) { // encrypt secure jottings/lists
		jotting.secure=1; // secure lists have 'secure' property
		jotting.text=app.cryptify(jottingName,app.keyCode);
	}
	else { // unless secure, save plain text
		jotting.secure=0;
		jotting.text=jottingName;
	}
	app.jottingList.push(jotting);
	console.log("save new jotting "+jotting.text+"; secure: "+jotting.secure);
	console.log("jottingList: "+app.jottingList[0].text+" secure: "+app.jottingList[0].secure+" content: "+app.jottingList[0].content);
	app.saveJottings(); // ...and save
	app.populateList();
    app.toggleDialog('addDialog',false);
  });

  document.getElementById('butCancelNewJotting').addEventListener('click', function() { // CANCEL NEW JOTTING
    // Close the add new jotting dialog
    app.toggleDialog('addDialog', false);
  });
  
  document.getElementById('butDelete').addEventListener('click', function() { // DELETE JOTTING/LIST
  	// initiate delete jotting/list
	var text=app.jotting.text;
	console.log("delete jotting "+text);
	if(app.jotting.secure>0) text=app.cryptify(text,app.keyCode);
	app.toggleDialog("deleteDialog", true);
	document.getElementById('deleteText').innerHTML = text;
	app.toggleDialog("editDialog", false);
  });
  
  document.getElementById('butSave').addEventListener('click', function() { // SAVE JOTTING AFTER EDIT
  	// Save edited jotting
	  var text = document.getElementById("text").value;
	  app.toggleDialog('editDialog',false);
	  console.log("Save jotting");
	  if(jotting.secure>0) app.jotting.text=app.cryptify(text,app.keyCode); // encrypt if secure jotting
	  else app.jotting.text = text;
	  if(app.jotting.content!=null) app.listName=text;
	  app.saveJottings();
	  app.populateList();
  })
 
  document.getElementById('butCancelEdit').addEventListener('click', function() { // CANCEL EDIT
    // Close the edit jotting dialog
    app.toggleDialog('editDialog', false);
  });
  
  document.getElementById('butDeleteConfirm').addEventListener('click', function() { // CONFIRM DELETE
  	// confirm delete jotting/list
	console.log("delete "+app.jotting.text);
	// var list=app.jottings;
	// var i=0;  
	if(app.jottingList.length<1) { // delete empty list (below top level) so...
		var list=app.jottings;
		var i=0;
		console.log("path length: "+app.path.length);
		app.path.pop(); // deleting this (empty) list
		if(app.path.length>0) {
			while(i<app.path.length) {
				console.log("path["+i+"]: "+app.path[i]);
				list=list[app.path[i++]];
				console.log("list: "+list.text+" - first item: "+list.content[0].text);
			}
			app.jottingList=list.content; // ...jottingList is parent list
			app.listName=list.text;
		}
		else {
			app.jottingList=app.jottings;
			app.listName="Jottings";
		}
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
		console.log("list name: "+app.listName);
		// app.populateList();
	}
	app.populateList();
	app.saveJottings();
	app.toggleDialog('deleteDialog', false);
  });
  
  document.getElementById('butCancelDelete').addEventListener('click', function() { // CANCEL DELETE
    // Close the delete dialog
    app.toggleDialog('deleteDialog', false);
  });
  
  document.getElementById('butSaveKey').addEventListener('click', function() { // SAVE NEW SECURITY KEY
    var key=document.getElementById('newKeyText').value;
	var confirm=document.getElementById('confirmKeyText').value;
	if(key == confirm) { // save new key and unlock
		console.log("save new key "+key+" and unlock");
		app.key=key;
		key=app.cryptify(key,'jottings');
		console.log("store ecncrypted key "+key);
		localStorage.keyCode=key;
		app.locked=false;
	}
	else console.log("MISMATCH");
    app.toggleDialog('newKeyDialog', false); // Close the new key dialog
  });
  
  document.getElementById('butCancelKey').addEventListener('click', function() { // CANCEL NEW KEY
    // Close the new key dialog
    app.toggleDialog('newKeyDialog', false);
  });
  
 document.getElementById("butUnlock").addEventListener('click',function() { // UNLOCK SECURE LIST
	var key=document.getElementById('keyText').value;
	 if(key==app.keyCode) app.locked=false;
	 app.toggleDialog('keyDialog', false);
  })
  
 document.getElementById("butCancelUnlock").addEventListener('click',function() { // CANCEL UNLOCK
	// Close the key dialog
    app.toggleDialog('keyDialog', false);
  })

  // SHOW/HIDE DIALOGS
  app.toggleDialog = function(d, visible) {
	  if(visible) console.log("show "+d);
	  else console.log("hide "+d);
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
	  else if(d=='keyDialog') { // toggle KEY dialog
		  if (visible) {
      		app.keyDialog.classList.add('dialog-container--visible');
   		 } else {
     		 app.keyDialog.classList.remove('dialog-container--visible');
    		}
	  }
	  else if(d=='newKeyDialog') { // toggle NEW KEY dialog
		  if (visible) {
      		app.newKeyDialog.classList.add('dialog-container--visible');
   		 } else {
     		 app.newKeyDialog.classList.remove('dialog-container--visible');
    		}
	  }
  };

  // Save jottings to localStorage FOR NOW - LATER USE HOODIE
  app.saveJottings = function() {
    var jottings = JSON.stringify(app.jottings);
    localStorage.jottings = jottings;
	console.log("JOTTINGS SAVED: "+jottings);
  };
  
  // OPEN JOTTING/LIST
  app.openItem = function() {
	var item=event.target;
	event.preventDefault();
	var text = item.textContent;
	console.log("open jotting "+text);
	var i=0;
	// new approach deals with secure jottings
	var found=false;
	var t="";
	while(i<app.jottingList.length && !found) {
		t=app.jottingList[i].text;
		if(app.jottingList[i].secure>0) t=app.cryptify(t,app.keyCode);
		console.log("item "+i+": "+t);
		if(t==text) found=true;
		else i++;
	}
	// while(app.jottingList[i].text!=text) {i++};
	console.log("item "+i+": "+app.jottingList[i]);
	app.jotting = app.jottingList[i];
	console.log("open jotting "+app.jotting.text+" secure:"+app.jotting.secure);
	if(app.jotting.content==null) // just a jotting - open for editing
	{
		document.getElementById('butDelete').disabled=false;
		document.getElementById('butDelete').style.color='red';
		app.toggleDialog("editDialog", true);
		if(app.jotting.secure>0) documentt.getElementById("text").value = app.cryptify(app.jotting.text,app.keyCode); // decrypt secure jottings
		else document.getElementById("text").value = app.jotting.text;
	}
	// if jotting has content it's a list heading
	else if(app.locked==false || app.jotting.secure<1) { // if jotting has content it's a list heading
		app.path.push(i); // path lists hierarchy to current section
		if(app.jotting.secure==1) app.secure=true;
		else app.secure=false;
		console.log("secure is "+app.secure);
		/*
		if(app.secure) { // decrypt secure data
			app.jottingList=[];
			for (var i=0;i<app.jotting.content.length;i++) {
				app.jottingList[i]=app.cryptify(app.jotting.content[i],app.keyCode);
			}
		}
		else */
		app.jottingList = app.jotting.content;
		app.listName=t;
		// app.listName=app.jotting.text;
		app.populateList();
	}
	else { // trying to open a secure list before unlocking - show key dialog
		if(app.keyCode==null) app.toggleDialog('newKeyDialog',true); // set key for first time
		else app.toggleDialog("keyDialog",true); // unlock by entering key
	}
	/*
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
	*/
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
		if(app.jottingList[i].secure>0) listItem.textContent = app.cryptify(app.jottingList[i].text,app.keyCode);
		else listItem.textContent = app.jottingList[i].text;
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
  
  app.cryptify = function(value, key) {
  	var i=0;
	var result="";
	  // console.log("cryptify "+value+" using key "+key);
	  var k;
	  var v;
	for(i=0; i<value.length; i++) {
		k=key.charCodeAt(i%key.length);
		v=value.charCodeAt(i);
		// console.log("key["+i+"]: "+k+"; value["+i+"]: "+v);
		result+=String.fromCharCode(k^v);
		// console.log("result: "+result);
	}
	return result;
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
  app.keyCode = localStorage.keyCode; // load any saved key
  console.log("saved key is "+app.keyCode);
  if(app.keyCode!=null) app.keyCode = app.cryptify(app.keyCode, 'jottings'); // saved key was encrypted
  console.log("keyCode: "+app.keyCode);
  
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
  else console.log("not PWA friendly");
})();
