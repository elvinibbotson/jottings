(function () {
	'use strict';

// GLOBAL VARIABLES
	var app = {
		db: null,
		addDialog: document.getElementById('addDialog'),
		editDialog: document.getElementById('editDialog'),
		deleteDialog: document.getElementById('deleteDialog'),
		keyDialog: document.getElementById('keyDialog'),
		newKeyDialog: document.getElementById('newKeyDialog'),
		importDialog: document.getElementById('importDialog'),
		fileChooser: document.getElementById('fileChooser'),
		jottings: [],
		listID: null,
		jotting: null,
		path: [],
		list: document.getElementById('list'),
		listName: 'Jottings',
		keyCode: null,
		lastSave: null,
		locked: true,
		secure: false,
		months: "JanFebMarAprMayJunJulAugSepOctNovDec"
	};

// EVENT LISTENERS

// HEADING
	document.getElementById("heading").addEventListener('click', function () {
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
			document.getElementById("order").disabled = false; // NEW
			document.getElementById("order").checked = app.jotting.ordered; // NEW
			document.getElementById("order").innerHTML = "ordered"; // NEW
		}
});

// BACK BUTTON
	document.getElementById('butBack').addEventListener('click', function () {
		// back up a level
		console.log("BACK");
		app.path.pop();
		if (app.path.length> 0) {
			app.listID = app.path[app.path.length-1];
		}
		else {
			app.listID = null; // app.listName = "Jottings";
			document.getElementById("butBack").style.display="none";
		}
		app.populateList();
	})


// ADD BUTTON
	document.getElementById('butAdd').addEventListener('click', function () {
		// Open/show the add new jotting dialog
		var type = document.getElementById('type');
		if (app.path.length< 1) {
			type.options.selectedIndex = 1;
			document.getElementById("order").disabled = false;
		}
		else {
			type.options.selectedIndex = 0;
			document.getElementById("order").disabled = true;
		}
		document.getElementById("order").checked = false;
		console.log("show add jotting diaog with blank text field");
		app.toggleDialog('addDialog', true);
		// document.getElementById('text').value="";
	});

// NEW JOTTING/LIST
	document.getElementById('butAddNewJotting').addEventListener('click', function () {
		// Add the new jotting
		var textBox=document.getElementById('newText');
		var jottingName=textBox.value;
		// create new (empty) jotting and show it for content to be added
		var jotting={};
		var type=document.getElementById('type').options.selectedIndex;
		console.log("selected type: " + type);
		jotting.parent=app.listID;
		if(type>0) jotting.list=true; // jotting.content = [];
		if((type<2) && (app.secure===false)) {
			jotting.secure=false;
			jotting.text=jottingName;
		}
		else if(app.keyCode!==null) {
			app.secure=true;
			jotting.secure=true; // secure lists have 'secure' property
			jotting.text=app.cryptify(jottingName, app.keyCode);
		}
		else { // not yet unlocked
			if(app.keyCode===null) app.toggleDialog('newKeyDialog', true); // set key for first time
			else app.toggleDialog("keyDialog", true); // unlock by entering key
			app.toggleDialog('addDialog', false);
			return ;
		}
		app.jottings.push(jotting);
		console.log("save new jotting " + jotting.text + "; parent: " + jotting.parent + "; secure: " + jotting.secure);
		// save new jotting to indexedDB
		var dbTransaction=app.db.transaction('jottings',"readwrite");
		console.log("indexedDB transaction ready");
		var dbObjectStore=dbTransaction.objectStore('jottings');
		console.log("indexedDB objectStore ready");
		var request = dbObjectStore.add(jotting);
		request.onsuccess = function(event) {
			console.log("new jotting added");
			app.populateList();
			app.toggleDialog('addDialog', false);
		};
		request.onerror = function(event) {console.log("error adding new jotting");};
	});

// CANCEL NEW JOTTING
	document.getElementById('butCancelNewJotting').addEventListener('click', function () {
		app.toggleDialog('addDialog', false); // just close the add new jotting dialog
	});

// DELETE JOTTING/LIST
	document.getElementById('butDelete').addEventListener('click', function () {
		var text = app.jotting.text; // initiate delete jotting/list
		console.log("delete jotting " + text);
		if (app.jotting.secure> 0) text = app.cryptify(text, app.keyCode);
		app.toggleDialog("deleteDialog", true);
		document.getElementById('deleteText').innerHTML = text;
		app.toggleDialog("editDialog", false);
	});

// SAVE JOTTING AFTER EDIT
	document.getElementById('butSave').addEventListener('click', function () {
		var text=document.getElementById("text").value; // Save edited jotting
		app.toggleDialog('editDialog', false);
		console.log("Save jotting: " + text);
		if (app.jotting.secure) app.jotting.text=app.cryptify(text, app.keyCode); // encrypt if secure jotting
		else app.jotting.text=text;
		if (app.jotting.list) {
			app.listName=text; // *********** PROBABLY NOT NEEDED ***********
			app.jotting.ordered=document.getElementById("order").checked;
			console.log("ordered list: "+app.jotting.ordered);
		}
		// save amended jotting to indexedDB
		var dbTransaction=app.db.transaction('jottings',"readwrite");
		console.log("indexedDB transaction ready");
		var dbObjectStore=dbTransaction.objectStore('jottings');
		console.log("indexedDB objectStore ready");
		var request=dbObjectStore.put(app.jotting); // update jotting in database
		request.onsuccess=function(event) {
			console.log("jotting "+app.jotting.id+" updated");
			app.populateList();
		};
		request.onerror=function(event) {console.log("error updating jotting "+app.jotting.id);};
	});

// CANCEL EDIT
	document.getElementById('butCancelEdit').addEventListener('click', function () {
		app.toggleDialog('editDialog', false); // close the edit jotting dialog
	});

// CONFIRM DELETE
	document.getElementById('butDeleteConfirm').addEventListener('click', function () {
		console.log("delete " + app.jotting.text); // confirm delete jotting/list
		if (app.jottings.length< 1) { // delete empty list (below top level) so...
			console.log("path length: " + app.path.length);
			app.path.pop(); // deleting this (empty) list
			if (app.path.length> 0) {
				app.listID = app.path[app.path.length-1];
			}
			else {
				app.listID = null;
			}
		}
		else { // delete jotting  ********** NOT NEEDED? ************
			var i = app.jottings.indexOf(app.jotting);
			console.log("item " + i);
			app.jottings.splice(i, 1);
			console.log("list name: " + app.listName);
		}
		// delete jotting in database
		var dbTransaction = app.db.transaction("jottings","readwrite");
		console.log("indexedDB transaction ready");
		var dbObjectStore = dbTransaction.objectStore("jottings");
		var request = dbObjectStore.delete(app.jotting.id);
		request.onsuccess = function(event) {
			console.log("jotting "+app.jotting.id+" deleted");
		};
		request.onerror = function(event) {console.log("error deleting jotting "+app.jotting.id);};
		app.populateList();
		app.toggleDialog('deleteDialog', false);
	});

// CANCEL DELETE
	document.getElementById('butCancelDelete').addEventListener('click', function () {
		app.toggleDialog('deleteDialog', false); // close delete dialog
	});

// SAVE NEW SECURITY KEY
	document.getElementById('butSaveKey').addEventListener('click', function () {
		var key=document.getElementById('newKeyText').value;
		var confirm=document.getElementById('confirmKeyText').value;
		if (key==confirm) { // save new key and unlock
			console.log("save new key " + key + " and unlock");
			app.key=key;
			key=app.cryptify(key, 'jottings');
			console.log("store ecncrypted key "+key);
			localStorage.keyCode=key;
			app.locked=false;
		}
		else console.log("MISMATCH");
		app.toggleDialog('newKeyDialog', false); // Close the new key dialog
	});

// CANCEL NEW KEY
	document.getElementById('butCancelKey').addEventListener('click', function () {
		app.toggleDialog('newKeyDialog', false); // close new key dialog
	});

// UNLOCK SECURE LIST
	document.getElementById("butUnlock").addEventListener('click', function () {
		var key=document.getElementById('keyText').value;
		if (key==app.keyCode) app.locked=false;
		app.toggleDialog('keyDialog', false);
	});

// CANCEL UNLOCK
	document.getElementById("butCancelUnlock").addEventListener('click', function () {
		app.toggleDialog('keyDialog', false); // close key dialog
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
		else if(d=='importDialog') { // toggle file chooser dialog
	  	 if (visible) {
      		app.importDialog.classList.add('dialog-container--visible');
    		} else {
      		app.importDialog.classList.remove('dialog-container--visible');
    		}
	  }
	};

// OPEN JOTTING/LIST
app.openItem=function () {		
		var item=event.target;
		event.preventDefault();
		var text=item.textContent;
		console.log("open jotting "+text);
		var i=0;
		var found=false; // deal with secure jottings
		var t="";
		while(i<app.jottings.length && !found) {
			t=app.jottings[i].text;
			if(app.jottings[i].secure> 0) t=app.cryptify(t, app.keyCode);
			if (t==text) found=true;
			else i++;
		}
		// console.log("item " + i + ": " + app.jottings[i]);
		app.jotting = app.jottings[i];
		console.log("open jotting " + app.jotting.text + " secure:" + app.jotting.secure);
		if(!app.jotting.list) // just a jotting - open for editing
		{
			document.getElementById('butDelete').disabled = false;
			document.getElementById('butDelete').style.color = 'red';
			app.toggleDialog("editDialog", true);
			if (app.jotting.secure> 0) document.getElementById("text").value = app.cryptify(app.jotting.text, app.keyCode); // decrypt secure jottings
			else document.getElementById("text").value = app.jotting.text;
			document.getElementById("order").disabled=true; // NEW
			document.getElementById("order").checked=false; // NEW
			document.getElementById("order").innerHTML = ""; // NEW
		}
		// jotting is a list
		else if (app.locked == false || app.jotting.secure == false) {
			app.path.push(app.jotting.id); // path lists hierarchy to current section
			if (app.jotting.secure) app.secure = true;
			else app.secure = false;
			console.log("secure is " + app.secure);
			app.listID = app.jotting.id;
			app.populateList();
			document.getElementById("butBack").style.display="block";
		}
		else { // trying to open a secure list before unlocking - show key dialog
			if (app.keyCode == null) app.toggleDialog('newKeyDialog', true); // set key for first time
			else app.toggleDialog("keyDialog", true); // unlock by entering key
		}
	};

// POPULATE JOTTINGS LIST
app.populateList = function () {
		var ordered=false; // allow alpha-ordered lists
		//  build jottings list from children of listID
		console.log("build jotting List for listID "+app.listID);
		var dbTransaction=app.db.transaction('jottings',"readwrite");
		console.log("indexedDB transaction ready");
		var dbObjectStore=dbTransaction.objectStore('jottings');
		console.log("indexedDB objectStore ready");
		var jotting={};
		if(app.listID!=null) {
			console.log("get list item "+app.listID);
			var request=dbObjectStore.get(app.listID);
			request.onsuccess=function() {
				jotting=event.target.result;
				console.log("retrieved jotting "+jotting.text);
				console.log("list "+jotting.text+"; list: "+jotting.list+"; secure: "+jotting.secure+"; ordered: "+jotting.ordered+"; parent: "+jotting.parent+"; content: "+jotting.content);
				var t=jotting.text;
				ordered=jotting.ordered;
				if(jotting.secure>0) t=app.cryptify(t,app.keyCode);
				app.listName=t;
			};
			request.onerror = function() {console.log("error retrieving jotting "+listID);}
		}
		else app.listName="Jottings";
		app.jottings=[];
		ordered=true; // always order top-level list
		request=dbObjectStore.openCursor();
		request.onsuccess=function (event) {
			var cursor=event.target.result;
			if(cursor) {
				if(cursor.value.parent==app.listID) {
					app.jottings.push(cursor.value);
					console.log("jotting id: " + cursor.value.id + "; " + cursor.value.text + "; list: " + cursor.value.list + "; secure: " + cursor.value.secure + "; parent: " + cursor.value.parent + "; content: " + cursor.value.content);
				}
				cursor.continue ();
			}
			else {
				alert("No more entries! "+app.jottings.length+" jottings");
				if(app.listID==null) { // backup checks
				    if(app.jottings.length<1) { // no data: restore backup?
				        console.log("no data - restore backup?");
				        document.getElementById('importDialog').style.display='block';
				    }
				    else { // monthly backups
				        var today=new Date();
				        console.log('this month: '+today.getMonth()+"; last save: "+app.lastSave);
				        if(today.getMonth()!=app.lastSave) app.backup();
				    }
				}
				// jottings loaded - build list
				if(ordered) app.jottings.sort(function(a,b){
					if(a.secure) return 1; // secure lists appear last
					if(b.secure) return -1;
    					if(a.text<b.text) return -1; // alpha sort
    					if(a.text>b.text) return 1;
    					return 0; 
				});
				console.log("ordered is "+ordered);
				// report+=("ordered: "+ordered);
				console.log("populate list for path " + app.path + " with " + app.jottings.length + " items");
				document.getElementById("heading").innerHTML = app.listName;
				app.list.innerHTML=""; // clear list
				for (var i in app.jottings) {
					var listItem = document.createElement('li');
					listItem.classList.add('item');
					listItem.addEventListener('click', app.openItem, false);
					if (app.jottings[i].secure>0) listItem.textContent=app.cryptify(app.jottings[i].text, app.keyCode);
					else listItem.textContent=app.jottings[i].text;
					if(app.jottings[i].list) {
						listItem.style.fontWeight='bold';
					}
					// listItem.style.color=(app.jottings[i].secure)?"red":"black";
					app.list.appendChild(listItem);
				}
			}
		};
	};

// ENCRYPT/DECRYPT TEXT USING KEY
app.cryptify=function(value,key) {
	var i=0;
	var result="";
	// console.log("cryptify "+value+" using key "+key);
	var k;
	var v;
	for (i=0;i<value.length;i++) {
		k=key.charCodeAt(i%key.length);
		v=value.charCodeAt(i);
		// console.log("key["+i+"]: "+k+"; value["+i+"]: "+v);
		result+=String.fromCharCode(k^v);
		// console.log("result: "+result);
	}
	return result;
};

// RESTORE BACKUP
app.fileChooser.addEventListener('change', function() { // IMPORT FILE
	var file = app.fileChooser.files[0];
	console.log("file: "+file+" name: "+file.name);
	var fileReader=new FileReader();
	fileReader.addEventListener('load', function(evt) {
		console.log("file read: "+evt.target.result);
	  	var data=evt.target.result;
		var json=JSON.parse(data);
		console.log("json: "+json);
		var jottings=json.jottings;
		console.log(jottings.length+" jottings loaded");
		var dbTransaction=app.db.transaction('jottings',"readwrite");
		var dbObjectStore=dbTransaction.objectStore('jottings');
		for(var i=0;i<jottings.length;i++) {
			console.log("add "+jottings[i].id+": "+jottings[i].text+" parent: "+jottings[i].parent);
			var request=dbObjectStore.add(jottings[i]);
			request.onsuccess = function(e) {
				console.log(jottings.length+" jottings added to database");
			};
			request.onerror = function(e) {console.log("error adding jotting");};
		};
		document.getElementById('importDialog').style.display='none';
		alert("jottings imported - restart");
	});
	fileReader.readAsText(file);
});
	
// CANCEL RESTORE
	document.getElementById('buttonCancelImport').addEventListener('click', function() { // CANCEL IMPORT DATA
    app.toggleDialog('importDialog', false);
	document.getElementById("importDialog").style.display="none";
  });

// BACKUP
app.backup=function() {
  	console.log("EXPORT");
	var fileName = "jottings.json";
	var dbTransaction=app.db.transaction('jottings',"readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore=dbTransaction.objectStore('jottings');
	console.log("indexedDB objectStore ready");
	var request=dbObjectStore.openCursor();
	var jottings=[];
	request.onsuccess=function(event) {  
		var cursor=event.target.result;  
    	if(cursor) {
		    jottings.push(cursor.value);
			console.log("jotting "+cursor.key+", id: "+cursor.value.id+", "+cursor.value.text);
			cursor.continue();  
    	}
		else {
			console.log(jottings.length+" jottings to save");
			var data={'jottings': jottings};
			var json=JSON.stringify(data);
			var blob=new Blob([json], {type:"data:application/json"});
  			var a=document.createElement('a');
			a.style.display='none';
    		var url=window.URL.createObjectURL(blob);
			console.log("data ready to save: "+blob.size+" bytes");
   			a.href=url;
   			a.download=fileName;
    		document.body.appendChild(a);
    		a.click();
			alert(fileName+" saved to downloads folder");
			var today=new Date();
			app.lastSave=today.getMonth();
			window.localStorage.setItem('lastSave',app.lastSave);
		}
	}
}

// START-UP CODE
    app.lastSave=window.localStorage.getItem('lastSave');
	console.log("last save: "+app.lastSave);
	app.keyCode=window.localStorage.keyCode; // load any saved key
	console.log("saved key is "+app.keyCode);
	if(app.keyCode!==null) app.keyCode=app.cryptify(app.keyCode, 'jottings'); // saved key was encrypted
	alert("keyCode: "+app.keyCode);
	
	// **** FIX
	app.keyCode='2633';
	app.locked=false;
	
	// load jottings from database
	var request=window.indexedDB.open("jottingsDB");
	request.onsuccess=function (event) {
		app.db=event.target.result;
		console.log("DB open");
		var dbTransaction = app.db.transaction('jottings', "readwrite");
		console.log("indexedDB transaction ready");
		var dbObjectStore = dbTransaction.objectStore('jottings');
		console.log("indexedDB objectStore ready");
		app.jottings=[];
		console.log("jottings array ready");
		var request = dbObjectStore.openCursor();
		request.onsuccess = function (event) {
		    app.listID=null;
		    app.populateList();
		};
	};
	request.onupgradeneeded = function (event) {
		var dbObjectStore = event.currentTarget.result.createObjectStore("jottings", {
			keyPath: "id", autoIncrement: true
		});
		console.log("jottings database ready");
	}
	request.onerror = function (event) {
		alert("indexedDB error code " + event.target.errorCode);
		// var jottings = defaultData.jottings;
		// alert("use default data");
	};
	
	// implement service worker if browser is PWA friendly
	if (navigator.serviceWorker.controller) {
		console.log('Active service worker found, no need to register')
	} else { //Register the ServiceWorker
		navigator.serviceWorker.register('sw.js', {
			scope: '/Jottings/'
		}).then(function(reg) {
			console.log('Service worker has been registered for scope:'+ reg.scope);
		});
	}
})();
