var key = "foo";
var modernAndroid;

var indexedDB = window.indexedDB || window.webkitIndexedDB;

var db = {
    indexedDB: {},
    webSQL: {}
};

function onDeviceReady(){
    console.log("deviceready");

    if(device.platform !== "Android"){
        return $('body').html("This test app is designed to run on Android only");
    }

    $('#webview').html(navigator.userAgent.toLowerCase().indexOf('crosswalk') > -1 ? "Crosswalk" : "System");

    modernAndroid = parseFloat(device.version) >= 4.4;
    $('body').addClass(modernAndroid ? "modern": "old");
    if(!modernAndroid){
        $('.modern input').attr('disabled', 'disabled');
    }
    $('#os').html(device.version + " (" + (modernAndroid ? "modern" : "old") + ")");

    // Setup DBs
    db.indexedDB.setup();
    db.webSQL.setup();
}

function onDbIsSetup(){
    if(db.indexedDB.isSetup && db.webSQL.isSetup){
        console.log("DBs are setup");
        get();
    }
}

function create(){
    $('#local-storage').val(generateRandomString());
    if(modernAndroid){
        $('#cookies').val(generateRandomString());
        $('#indexeddb').val(generateRandomString());
        $('#websql').val(generateRandomString());
    }
}

function set(){
    localStorage.setItem(key, $('#local-storage').val());
    writeCookie(key, $('#cookies').val(), 1000);
    db.indexedDB.writeToDb($('#indexeddb').val());
    db.webSQL.writeToDb($('#websql').val());
}

function get(){
    $('#local-storage').val(localStorage.getItem(key));

    $('#cookies').val(readCookie(key));
    db.indexedDB.readFromDb(function(val){
        $('#indexeddb').val(val);
    });
    db.webSQL.readFromDb(function(val){
        $('#websql').val(val);
    });
}

function clear(){
    localStorage.removeItem(key);
    $('#local-storage').val('');

    if(modernAndroid){
        $('#cookies').val('');
        $('#indexeddb').val('');

        writeCookie(key, $('#cookies').val(), -1);
        db.indexedDB.clearDb();
        db.webSQL.clearDb();
    }
}

function generateRandomString(){
    return (Math.random() + 1).toString(36).substring(7);
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1,c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length,c.length);
        }
    }
    return null;
}

function writeCookie(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        expires = "; expires="+date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name+"="+value+expires+"; path=/";
}

db.indexedDB.setup = function(){
    var open = indexedDB.open(key, 1);
    open.onupgradeneeded = function() {
        open.result.createObjectStore(key, {keyPath: "id"});
    };
    open.onsuccess = function(){
        db.indexedDB.db = open.result;
        db.indexedDB.isSetup = true;
        onDbIsSetup();
    };
};

db.indexedDB.writeToDb = function (val){
    var tx = db.indexedDB.db.transaction(key, "readwrite");
    var store = tx.objectStore(key);
    var addReq = store.add({id: 1, value: val});
    addReq.onsuccess = function(){
        console.log("Saved '"+val+"' to indexedDB");
    };
};

db.indexedDB.readFromDb = function (cb){
    var tx = db.indexedDB.db.transaction(key, "readwrite");
    var store = tx.objectStore(key);

    var getReq = store.get(1);
    getReq.onsuccess = function(){
        console.log("Read from indexedDB");
        cb(getReq.result && getReq.result.value ? getReq.result.value : "");
    }
};

db.indexedDB.clearDb = function (){
    var tx = db.indexedDB.db.transaction(key, "readwrite");
    var store = tx.objectStore(key);
    var clearReq = store.clear();
    clearReq.onsuccess = function(){
        console.log("Cleared indexedDB");
    };
};

db.webSQL.setup = function(){
    db.webSQL.db = window.openDatabase(key, "0.1", "foo", 1024 * 1024);
    db.webSQL.db.transaction(function(transaction){
        transaction.executeSql("CREATE TABLE IF NOT EXISTS "+key+" (" +
            "id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," +
            "value TEXT NOT NULL);");
        db.webSQL.isSetup = true;
        onDbIsSetup();
    });

};

db.webSQL.writeToDb = function (val){
    db.webSQL.db.transaction(function(transaction){
        transaction.executeSql(("INSERT INTO "+key+" (value) VALUES (?);"),
            [val], function(transaction, results){
                console.log("Wrote to WebSQL DB");
            }, function(){
                console.error("Failed to write to WebSQL DB");
            });
    });
};

db.webSQL.readFromDb = function (cb){
    db.webSQL.db.transaction(function(transaction){
        transaction.executeSql(("SELECT * FROM "+key+" WHERE id=?"), [1],
            function(transaction, results){
                cb(results.rows[0].value);
            }, function(){
                console.error("Failed to read from WebSQL DB");
            });
    });
};

db.webSQL.clearDb = function (){
    var query = "DELETE * FROM " + key;
    db.webSQL.db.transaction(function (tx) {
        tx.executeSql(query);
    });
};

document.addEventListener('deviceready', onDeviceReady, false);