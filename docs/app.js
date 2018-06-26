(function () {
	'use strict';

	// GLOBAL VARIABLES
	var app = {
		db: null,
		isLoading: true,
		spinner: document.querySelector('.loader'),
		container: document.querySelector('.main'),
		addDialog: document.getElementById('addDialog'),
		editDialog: document.getElementById('editDialog'),
		deleteDialog: document.getElementById('deleteDialog'),
		keyDialog: document.getElementById('keyDialog'),
		newKeyDialog: document.getElementById('newKeyDialog'),
		jottings: [],
		// jottingList: [],
		listID: null,
		jotting: null,
		path: [],
		list: document.getElementById('list'),
		listName: 'Jottings',
		keyCode: null,
		locked: true,
		secure: false
	};

	// EVENT LISTENERS
	document.getElementById("heading").addEventListener('click', function () { // HEADING
		console.log("edit heading");
		if (app.path.length> 0) { // can edit list names
			document.getElementById('butDelete').disabled = false;
			document.getElementById('butDelete').style.color = 'red';
			// try this...
			console.log(app.jottings.length + " items");
			if (app.jottings.length> 0) { // cannot delete non-empty lists
				document.getElementById('butDelete').disabled = true;
				document.getElementById('butDelete').style.color = 'gray';
				console.log("delete button disabled");
			}
			app.toggleDialog("editDialog", true); // show section name in edit dialog
			document.getElementById('text').value = app.listName;
			console.log("app.jotting is " + app.jotting.text);
		}
		/*
		else { // tapping 'Jottings' header saves jottings.json file
			var jottings = JSON.stringify(app.jottings);
			var blob = new Blob([jottings], {
				type:"data:application/json"
			});
			// return navigator.msSaveBlob(blob, 'jottings.json'); // only in Microsoft browsers
			var a = document.createElement('a');
			a.style.display = 'none';
			var url = window.URL.createObjectURL(blob);
			a.href = url;
			a.download = 'jottings.json';
			document.body.appendChild(a);
			a.click();
			console.log("jottings file saved");
			// saved jottings can be copied into defaultData (below) for installing on a new device
		}
		*/
	});

	document.getElementById('butBack').addEventListener('click', function () { // BACK BUTTON
		// back up a level (or close app if at top level)
		console.log("BACK");
		// var list = app.jottings;
		// app.path.pop();
		if (app.path.length< 1) { // top level - save data and close app
			// save data as 'jottings.json' then close page
			alert("save to file and exit");
			var dbTransaction = app.db.transaction('jottings',"readwrite");
			console.log("indexedDB transaction ready");
			var dbObjectStore = dbTransaction.objectStore('jottings');
			console.log("indexedDB objectStore ready");
			var request = dbObjectStore.openCursor();
			var jottings=[];
			request.onsuccess = function(event) {  
				var cursor = event.target.result;  
    				if (cursor) {
					jottings.push(cursor.value);
					console.log("jotting "+cursor.key+", id: "+cursor.value.id+", "+cursor.value.text);
					cursor.continue();  
    				}
				else {
					alert(jottings.length+" jottings to save");
					var data={'jottings': jottings};
					var json=JSON.stringify(data);
					var blob = new Blob([json], {type:"data:application/json"});
  					var a =document.createElement('a');
					a.style.display='none';
    					var url = window.URL.createObjectURL(blob);
					alert("data ready to save: "+blob.size+" bytes");
   			 		a.href= url;
   			 		a.download='jottings.json';
    					document.body.appendChild(a);
    					a.click();
					alert("jottings file saved");
					self.close(); // close application
				}
			}
		}
		else {
			app.path.pop();
			if (app.path.length> 0) {
				app.listID = app.path[app.path.length-1];
				/*
				var i = 0;
				while (i< app.path.length) {
					list = list[app.path[i++]];
					console.log("list: " + list);
				}
				var text = list.text;
				if (list.secure> 0) text = app.cryptify(text, app.keyCode); // deal with secure lists
				app.listName = text;
				app.secure = (list.secure> 0);
				console.log("secure is now " + app.secure);
				// app.listName=list.text;
				list = list.content;
				*/
			}
			else app.listID = null; // app.listName = "Jottings";
			// console.log("list name: " + app.listName);
			// app.jottingList = list;
			app.populateList();
		};
	});

	document.getElementById('butAdd').addEventListener('click', function () { // ADD BUTTON
		// Open/show the add new jotting dialog
		var type = document.getElementById('type');
		if (app.path.length< 1) type.options.selectedIndex = 1;
		else type.options.selectedIndex = 0;
		console.log("show add jotting diaog with blank text field");
		app.toggleDialog('addDialog', true);
		// document.getElementById('text').value="";
	});

	document.getElementById('butAddNewJotting').addEventListener('click', function () { // NEW JOTTING/LIST
		// Add the new jotting
		var textBox = document.getElementById('newText');
		var jottingName = textBox.value;
		// create new (empty) jotting and show it for content to be added
		var jotting = {};
		var type = document.getElementById('type').options.selectedIndex;
		console.log("selected type: " + type);
		jotting.parent = app.listID;
		if (type> 0) jotting.list =  true; // jotting.content = [];
		if ((type< 2) && (app.secure == false)) {
			jotting.secure = false;
			jotting.text = jottingName;
		}
		else if (app.keyCode != null) {
			app.secure = true;
			jotting.secure = true; // secure lists have 'secure' property
			jotting.text = app.cryptify(jottingName, app.keyCode);
		}
		else { // not yet unlocked
			if (app.keyCode == null) app.toggleDialog('newKeyDialog', true); // set key for first time
			else app.toggleDialog("keyDialog", true); // unlock by entering key
			app.toggleDialog('addDialog', false);
			return ;
		}
		app.jottings.push(jotting);
		console.log("save new jotting " + jotting.text + "; parent: " + jotting.parent + "; secure: " + jotting.secure);
		// console.log("jottings: " + app.jottings[0].text + " secure: " + app.jottings[0].secure);
		// new code to save new jotting to indexedDB
		var dbTransaction = app.db.transaction('jottings',"readwrite");
		console.log("indexedDB transaction ready");
		var dbObjectStore = dbTransaction.objectStore('jottings');
		console.log("indexedDB objectStore ready");
		var request = dbObjectStore.add(jotting);
		request.onsuccess = function(event) {
			console.log("new jotting added");
			app.populateList();
			app.toggleDialog('addDialog', false);
		};
		request.onerror = function(event) {console.log("error adding new jotting");};
		// app.saveJottings(); // ...and save
		// app.populateList();
		// app.toggleDialog('addDialog', false);
	});

	document.getElementById('butCancelNewJotting').addEventListener('click', function () { // CANCEL NEW JOTTING
		// Close the add new jotting dialog
		app.toggleDialog('addDialog', false);
	});

	document.getElementById('butDelete').addEventListener('click', function () { // DELETE JOTTING/LIST
		// initiate delete jotting/list
		var text = app.jotting.text;
		console.log("delete jotting " + text);
		if (app.jotting.secure> 0) text = app.cryptify(text, app.keyCode);
		app.toggleDialog("deleteDialog", true);
		document.getElementById('deleteText').innerHTML = text;
		app.toggleDialog("editDialog", false);
	});

	document.getElementById('butSave').addEventListener('click', function () { // SAVE JOTTING AFTER EDIT
		// Save edited jotting
		var text = document.getElementById("text").value;
		app.toggleDialog('editDialog', false);
		console.log("Save jotting: " + text);
		if (app.jotting.secure) app.jotting.text = app.cryptify(text, app.keyCode); // encrypt if secure jotting
		else app.jotting.text = text;
		if (app.jotting.list) app.listName = text; // *********** PROBABLY NOT NEEDED ***********
		// new code to save amended jotting to indexedDB
		var dbTransaction = app.db.transaction('jottings',"readwrite");
		console.log("indexedDB transaction ready");
		var dbObjectStore = dbTransaction.objectStore('jottings');
		console.log("indexedDB objectStore ready");
		// app.jottings[app.jotting.id]=app.jotting;
		// put amended jotting in indexedDB
		var request = dbObjectStore.put(app.jotting); // update jotting in database
		request.onsuccess = function(event)  {
			console.log("jotting "+app.jotting.id+" updated");
			app.populateList();
		};
		request.onerror = function(event) {console.log("error updating jotting "+app.jotting.id);};
		// app.saveJottings();
		// app.populateList();
	});

	document.getElementById('butCancelEdit').addEventListener('click', function () { // CANCEL EDIT
		// Close the edit jotting dialog
		app.toggleDialog('editDialog', false);
	});

	document.getElementById('butDeleteConfirm').addEventListener('click', function () { // CONFIRM DELETE
		// confirm delete jotting/list
		console.log("delete " + app.jotting.text);
		// var list=app.jottings;
		// var i=0;
		if (app.jottings.length< 1) { // delete empty list (below top level) so...
			// var list = app.jottings;
			// var i = 0;
			console.log("path length: " + app.path.length);
			app.path.pop(); // deleting this (empty) list
			if (app.path.length> 0) {
				app.listID = app.path[app.path.length-1];
				/*
				while (i< app.path.length) {
					console.log("path[" + i + "]: " + app.path[i]);
					list = list[app.path[i++]];
					console.log("list: " + list.text + " - first item: " + list.content[0].text);
				}
				app.jottingList = list.content; // ...jottingList is parent list
				app.listName = list.text;
				*/
			}
			else {
				app.listID = null;
				// app.jottingList = app.jottings;
				// app.listName = "Jottings";
			}
			/*
			// test code
			console.log("list: " + app.jottingList);
			i = 0;
			while (i< app.jottingList.length) {
				console.log("item " + i + ": " + app.jottingList[i++].text);
			}
			i = app.jottingList.indexOf(app.jotting);
			console.log("item " + i);
			app.jottingList.splice(i, 1);
			*/
		}
		else { // delete jotting  ********** NOT NEEDED? ************
			var i = app.jottings.indexOf(app.jotting);
			console.log("item " + i);
			app.jottings.splice(i, 1);
			console.log("list name: " + app.listName);
			// app.populateList();
		}
		// new code to delete jotting in database
		var dbTransaction = app.db.transaction("jottings","readwrite");
		console.log("indexedDB transaction ready");
		var dbObjectStore = dbTransaction.objectStore("jottings");
		var request = dbObjectStore.delete(app.jotting.id);
		request.onsuccess = function(event) {
			console.log("jotting "+app.jotting.id+" deleted");
		};
		request.onerror = function(event) {console.log("error deleting jotting "+app.jotting.id);};
		app.populateList();
		// app.saveJottings();
		app.toggleDialog('deleteDialog', false);
	});

	document.getElementById('butCancelDelete').addEventListener('click', function () { // CANCEL DELETE
		// Close the delete dialog
		app.toggleDialog('deleteDialog', false);
	});

	document.getElementById('butSaveKey').addEventListener('click', function () { // SAVE NEW SECURITY KEY
		var key = document.getElementById('newKeyText').value;
		var confirm = document.getElementById('confirmKeyText').value;
		if (key == confirm) { // save new key and unlock
			console.log("save new key " + key + " and unlock");
			app.key = key;
			key = app.cryptify(key, 'jottings');
			console.log("store ecncrypted key " + key);
			localStorage.keyCode = key;
			app.locked = false;
		}
		else console.log("MISMATCH");
		app.toggleDialog('newKeyDialog', false); // Close the new key dialog
	});

	document.getElementById('butCancelKey').addEventListener('click', function () { // CANCEL NEW KEY
		// Close the new key dialog
		app.toggleDialog('newKeyDialog', false);
	});

	document.getElementById("butUnlock").addEventListener('click', function () { // UNLOCK SECURE LIST
		var key = document.getElementById('keyText').value;
		if (key == app.keyCode) app.locked = false;
		app.toggleDialog('keyDialog', false);
	});

	document.getElementById("butCancelUnlock").addEventListener('click', function () { // CANCEL UNLOCK
		// Close the key dialog
		app.toggleDialog('keyDialog', false);
	});

	// SHOW/HIDE DIALOGS
	app.toggleDialog = function (d, visible) {
		if (visible) console.log("show " + d);
		else console.log("hide " + d);
		if (d == 'addDialog') { // toggle ADD dialog
			if (visible) {
				app.addDialog.classList.add('dialog-container--visible');
				document.getElementById('newText').value = "";
			} else {
				app.addDialog.classList.remove('dialog-container--visible');
			}
		}
		else if (d == 'editDialog') { // toggle EDIT dialog
			if (visible) {
				app.editDialog.classList.add('dialog-container--visible');
			} else {
				app.editDialog.classList.remove('dialog-container--visible');
			}
		}
		else if (d == 'deleteDialog') { // toggle DELETE dialog
			if (visible) {
				app.deleteDialog.classList.add('dialog-container--visible');
			} else {
				app.deleteDialog.classList.remove('dialog-container--visible');
			}
		}
		else if (d == 'keyDialog') { // toggle KEY dialog
			if (visible) {
				app.keyDialog.classList.add('dialog-container--visible');
			} else {
				app.keyDialog.classList.remove('dialog-container--visible');
			}
		}
		else if (d == 'newKeyDialog') { // toggle NEW KEY dialog
			if (visible) {
				app.newKeyDialog.classList.add('dialog-container--visible');
			} else {
				app.newKeyDialog.classList.remove('dialog-container--visible');
			}
		}
		else if(d=='fileChooserDialog') { // toggle file chooser dialog
	  	 if (visible) {
      		id("fileChooserDialog").classList.add('dialog-container--visible');
    		} else {
      		id("fileChooserDialog").classList.remove('dialog-container--visible');
    		}
	  }
	};

	/* Save jottings to localStorage FOR NOW - LATER USE HOODIE
	app.saveJottings = function () {
		var jottings = JSON.stringify(app.jottings);
		localStorage.jottings = jottings;
		console.log("JOTTINGS SAVED: " + jottings);
	};
	*/

	// OPEN JOTTING/LIST
	app.openItem = function () {		
		var item = event.target;
		event.preventDefault();
		var text = item.textContent;
		console.log("open jotting " + text);
		var i = 0;
		// new approach deals with secure jottings
		var found = false;
		var t = "";
		while (i< app.jottings.length && !found) {
			t = app.jottings[i].text;
			if (app.jottings[i].secure> 0) t = app.cryptify(t, app.keyCode);
			// console.log("item " + i + ": " + t);
			if (t == text) found = true;
			else i++;
		}
		// console.log("item " + i + ": " + app.jottings[i]);
		app.jotting = app.jottings[i];
		console.log("open jotting " + app.jotting.text + " secure:" + app.jotting.secure);
		if(!app.jotting.list) // just a jotting - open for editing
		// if (app.jotting.content == null) // just a jotting - open for editing
		{
			document.getElementById('butDelete').disabled = false;
			document.getElementById('butDelete').style.color = 'red';
			app.toggleDialog("editDialog", true);
			if (app.jotting.secure> 0) documentt.getElementById("text").value = app.cryptify(app.jotting.text, app.keyCode); // decrypt secure jottings
			else document.getElementById("text").value = app.jotting.text;
		}
		// jotting is a list
		else if (app.locked == false || app.jotting.secure == false) {
			app.path.push(app.jotting.id); // path lists hierarchy to current section
			if (app.jotting.secure) app.secure = true;
			else app.secure = false;
			console.log("secure is " + app.secure);
			app.listID = app.jotting.id;
			// app.jottingList = app.jotting.content;
			// app.listName = t;
			app.populateList();
		}
		else { // trying to open a secure list before unlocking - show key dialog
			if (app.keyCode == null) app.toggleDialog('newKeyDialog', true); // set key for first time
			else app.toggleDialog("keyDialog", true); // unlock by entering key
		}
	};

	// POPULATE JOTTINGS LIST
	app.populateList = function () {
		//  build jottings list from children of listID
		console.log("build jotting List for listID "+app.listID);
		var dbTransaction = app.db.transaction('jottings', "readwrite");
		console.log("indexedDB transaction ready");
		var dbObjectStore = dbTransaction.objectStore('jottings');
		console.log("indexedDB objectStore ready");
		var jotting={};
		if(app.listID != null) {
			console.log("get list item "+app.listID);
			var request = dbObjectStore.get(app.listID);
			request.onsuccess = function() {
				jotting = event.target.result;
				console.log("retrieved jotting "+jotting.text);
				console.log("list "+jotting.text+"; list: "+jotting.list+"; secure: "+jotting.secure+"; parent: "+jotting.parent+"; content: "+jotting.content);
				var t = jotting.text;
				if (jotting.secure> 0) t = app.cryptify(t, app.keyCode);
				app.listName = t;
			};
			request.onerror = function() {console.log("error retrieving jotting "+listID);}
		}
		else app.listName="Jottings";		
		app.jottings=[];
		var request = dbObjectStore.openCursor();
		request.onsuccess = function (event) {
			var cursor = event.target.result;
			if (cursor) {
				if(cursor.value.parent == app.listID) {
					app.jottings.push(cursor.value);
					console.log("jotting id: " + cursor.value.id + "; " + cursor.value.text + "; list: " + cursor.value.list + "; secure: " + cursor.value.secure + "; parent: " + cursor.value.parent + "; content: " + cursor.value.content);
				}
				cursor.continue ();
			}
			else {
				console.log("No more entries! " + app.jottings.length + " jottings");
				// temporary code to convert from .contents[] to .parent approach
				/* this code has done its job - parents & security assigned & no content left
				jotting = {};
				for(var i in app.jottings) {
					app.jottings[i].parent == app.listID;
					app.jottings[i].secure = (app.jottings[i].secure>0); // secure now true/false
					if(app.jottings[i].content) {
						jotting.list = true;
						for(var j in app.jottings[i].content) {
							jotting = app.jottings[i].content[j];
							jotting.parent = app.jottings[i].id;
							var request = dbObjectStore.add(jotting);
							request.onsuccess = function(event) {
								console.log("jotting "+ jotting.text+ " added to database");
							};
							request.onerror = function(event) {
								console.log("error adding jotting "+jotting.text+" to database");
							};
						}
						app.jottings[i].content = null;
					}
					var request = dbObjectStore.put(app.jottings[i]); // update jotting in database
					request.onsuccess = function(event)  {
						console.log("jotting "+app.jottings[i].text+" updated in database");
					};
					request.onerror = function(event) {console.log("error updating jotting "+app.jottings[i].text + "in database");};
				};
				*/
				// jottings loaded - build list
				console.log("populate list for path " + app.path + " with " + app.jottings.length + " items");
				document.getElementById("heading").innerHTML = app.listName;
				app.list.innerHTML = ""; // clear list
				for (var i in app.jottings) {
					var listItem = document.createElement('li');
					listItem.classList.add('item');
					listItem.addEventListener('click', app.openItem, false);
					if (app.jottings[i].secure> 0) listItem.textContent = app.cryptify(app.jottings[i].text, app.keyCode);
					else listItem.textContent = app.jottings[i].text;
					if (app.jottings[i].list) {
						listItem.style.fontWeight = 'bold';
					};
					app.list.appendChild(listItem);
				};
			};
		};
	};

	// ENCRYPT/DECRYPT TEXT USING KEY
	app.cryptify = function (value, key) {
		var i = 0;
		var result = "";
		// console.log("cryptify "+value+" using key "+key);
		var k;
		var v;
		for (i = 0; i< value.length; i++) {
			k = key.charCodeAt(i % key.length);
			v = value.charCodeAt(i);
			// console.log("key["+i+"]: "+k+"; value["+i+"]: "+v);
			result += String.fromCharCode(k ^ v);
			// console.log("result: "+result);
		}
		return result;
	};

	/* MINIMAL DATA FOR INITIAL INSTALLATION
	// to preserve jottings from one device to another...
	// tap on Jottings header & save jottings.json
	// email data to self and copy into defaultData
	// refresh app.js at github.io
	// saved jottings should appear by default on new device
	var defaultData = {
		jottings: [ {
			text: 'empty list', secure:0, content: []
		}]
	}
	*/
	// START-UP CODE
	app.keyCode = window.localStorage.keyCode; // load any saved key
	console.log("saved key is " + app.keyCode);
	if (app.keyCode != null) app.keyCode = app.cryptify(app.keyCode, 'jottings'); // saved key was encrypted
	console.log("keyCode: " + app.keyCode);
	/* app.jottings = localStorage.jottings; // load any saved data...
  console.log("jottings:"+app.jottings);
  if (app.jottings) {
    app.jottings = JSON.parse(app.jottings);
  }
  else {     // ...or if none, use default data
	  console.log("data:"+defaultData);
	  app.jottings = defaultData.jottings; // data.jottings
	  console.log("jottings:"+app.jottings);
  }
  */
	// load jottings from database
	var request = window.indexedDB.open("jottingsDB");
	request.onsuccess = function (event) {
		app.db = event.target.result;
		console.log("DB open");
		var dbTransaction = app.db.transaction('jottings', "readwrite");
		console.log("indexedDB transaction ready");
		var dbObjectStore = dbTransaction.objectStore('jottings');
		console.log("indexedDB objectStore ready");
		app.jottings = [];
		console.log("jottings array ready");
		var request = dbObjectStore.openCursor();
		request.onsuccess = function (event) {
		app.listID = null;
			// app.listName = "Jottings";
			app.populateList();
			if (app.isLoading) { // hide loading spinner
				app.spinner.setAttribute('hidden', true);
				app.container.removeAttribute('hidden');
				app.isLoading = false;
			}
			/*
			var cursor = event.target.result;
			if (cursor) {
				app.jottings.push(cursor.value);
				console.log("jotting " + cursor.key + ", id: " + cursor.value.id + ", text: " + cursor.value.text);
				cursor.continue ();
			}
			else {
				console.log("No more entries! " + app.jottings.length + " jottings");
				app.jottingList = app.jottings; // display top level
				app.listName = "Jottings";
				app.populateList();
				if (app.isLoading) { // hide loading spinner
					app.spinner.setAttribute('hidden', true);
					app.container.removeAttribute('hidden');
					app.isLoading = false;
				}
			}
			*/
		};
	};
	request.onupgradeneeded = function (event) {
		var dbObjectStore = event.currentTarget.result.createObjectStore("jottings", {
			keyPath: "id", autoIncrement: true
		});
		alert("jottings database ready");
		// ******************** add code to read data from saved jottings archive ***************
		id("fileChooser").addEventListener('change', function() {
			var file=event.target.files[0];
	  		var fileName=file.name;
	  		console.log("file chosen: "+fileName);
	  		var fileReader=new FileReader();
	  		fileReader.addEventListener('load', function() {
				console.log("file read");
	  			var data=event.target.result;
				var json=JSON.parse(data);
				console.log("json: "+json);
				var jottings=json.jottings;
				console.log(jottings.length+" jottings loaded from file "+fileName);
				for(var i=0;i<jottings.length;i++) {
					console.log(jottings[i].text)
					dbObjectStore.add(jottings[i]);
				};
				app.toggleDialog('fileChooserDialog',false);
				alert("jottingsDB created and populated");
	  		});
	  		fileReader.readAsText(file);
  		},false);
  		app.toggleDialog("fileChooserDialog",true);
	}
	request.onerror = function (event) {
		alert("indexedDB error code " + event.target.errorCode);
		// var jottings = defaultData.jottings;
		// alert("use default data");
	};
	/* display top level
	app.jottingList = app.jottings;
	app.listName = "Jottings";
	app.populateList();
	// hide loading spinner
	if (app.isLoading) {
		app.spinner.setAttribute('hidden', true);
		app.container.removeAttribute('hidden');
		app.isLoading = false;
	}
	*/
	// implement service worker if browser is PWA friendly
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker
			 .register('./service-worker.js')
			 .then(function () {
			console.log('Service Worker Registered');
		});
	}
	else console.log("not PWA friendly");
})();
