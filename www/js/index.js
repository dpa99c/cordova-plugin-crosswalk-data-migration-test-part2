var key = "foo";
var modernAndroid;
var indexedDB = window.indexedDB || window.webkitIndexedDB, db;

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

    // Init DB
    var open = indexedDB.open(key, 1);
    open.onupgradeneeded = function() {
        open.result.createObjectStore(key, {keyPath: "id"});
    };
    open.onsuccess = function(){
        db = open.result;
        get();
    };
}

function create(){
    $('#local-storage').val(generateRandomString());
    if(modernAndroid){
        $('#cookies').val(generateRandomString());
        $('#indexeddb').val(generateRandomString());
    }
}

function set(){
    localStorage.setItem(key, $('#local-storage').val());
    writeCookie(key, $('#cookies').val(), 1000);
    writeToDb($('#indexeddb').val());
}

function get(){
    $('#local-storage').val(localStorage.getItem(key));

    $('#cookies').val(readCookie(key));
    readFromDb(function(val){
        $('#indexeddb').val(val);
    });
}

function clear(){
    localStorage.removeItem(key);
    $('#local-storage').val('');

    if(modernAndroid){
        $('#cookies').val('');
        $('#indexeddb').val('');

        writeCookie(key, $('#cookies').val(), -1);
        clearDb();
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

function writeToDb(val){
    var tx = db.transaction(key, "readwrite");
    var store = tx.objectStore(key);
    var addReq = store.add({id: 1, value: val});
    addReq.onsuccess = function(){
        console.log("Saved '"+val+"' to DB");
    };
}

function readFromDb(cb){
    var tx = db.transaction(key, "readwrite");
    var store = tx.objectStore(key);

    var getReq = store.get(1);
    getReq.onsuccess = function(){
        cb(getReq.result && getReq.result.value ? getReq.result.value : "");
    }
}

function clearDb(){
    var tx = db.transaction(key, "readwrite");
    var store = tx.objectStore(key);
    var clearReq = store.clear();
    clearReq.onsuccess = function(){
        console.log("DB cleared");
    };
}

document.addEventListener('deviceready', onDeviceReady, false);