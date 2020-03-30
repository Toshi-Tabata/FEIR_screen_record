var request = null;
var hangingGet = null;
var localName;
var server;
var my_id = -1;
var other_peers = {};
var message_counter = 0;


function trace(txt) {
    var elem = document.getElementById("debug");
    elem.innerHTML += txt + "<br>";  // inserts linebreak
}

// TODO: Use this for disconnect notices
function handleServerNotification(data) {
    trace("Server notification: " + data);
    var parsed = data.split(',');
    if (parseInt(parsed[2]) !== 0)
        other_peers[parseInt(parsed[1])] = parsed[0];
}

//TODO: Use this to receive SDP and ICE candidate from remote
function handlePeerMessage(peer_id, data) {

}

function GetIntHeader(r, name) {
    var val = r.getResponseHeader(name);
    return val != null && val.length ? parseInt(val) : -1;
}

function hangingGetCallback() {
    try {
        if (hangingGet.readyState != 4)
            return;
        if (hangingGet.status != 200) {
            trace("server error: " + hangingGet.statusText);
            disconnect();
        } else {
            var peer_id = GetIntHeader(hangingGet, "Pragma");
            if (peer_id == my_id) {
                handleServerNotification(hangingGet.responseText);
            } else {
                // probably get response from here
                // console.log(hangingGet.responseText);
                //TODO: grab response from here
                handlePeerMessage(peer_id, hangingGet.responseText);
            }
        }

        if (hangingGet) {
            hangingGet.abort();
            hangingGet = null;
        }

        if (my_id != -1)
            window.setTimeout(startHangingGet, 0);
    } catch (e) {
        trace("Hanging get error: " + e.description);
    }
}

function startHangingGet() {
    try {
        hangingGet = new XMLHttpRequest();
        hangingGet.onreadystatechange = hangingGetCallback;
        hangingGet.ontimeout = onHangingGetTimeout;
        hangingGet.open("GET", server + "/wait?peer_id=" + my_id, true);
        hangingGet.send();
    } catch (e) {
        trace("error" + e.description);
    }
}

function onHangingGetTimeout() {
    trace("hanging get timeout. issuing again.");
    hangingGet.abort();
    hangingGet = null;
    if (my_id != -1)
        window.setTimeout(startHangingGet, 0);
}

function signInCallback() {
    try {
        // if readyState && status == 4 and 200 respectively, get peer + own ID
        if (request.readyState == 4) {
            if (request.status == 200) {
                var peers = request.responseText.split("\n");
                my_id = parseInt(peers[0].split(',')[1]);
                trace("My id: " + my_id);

                // for every peer, print it on page
                for (var i = 1; i < peers.length; ++i) {
                    if (peers[i].length > 0) {
                        trace("Peer " + i + ": " + peers[i]);
                        var parsed = peers[i].split(',');
                        other_peers[parseInt(parsed[1])] = parsed[0];
                    }
                }
                startHangingGet();
                request = null;
            }
        }
    } catch (e) {
        trace("error: " + e.description);
    }
}

function signIn() {
    try {
        request = new XMLHttpRequest();
        request.onreadystatechange = signInCallback; // EventHandler called whenever readyState attribute changed
        request.open("GET", server + "/sign_in?" + localName, true);
        request.send();
    } catch (e) {
        trace("error: " + e.description);
    }
}


//TODO: Use this to send SDP/ICE Candidates
function sendToPeer(peer_id, data) {
    if (my_id == -1) {
        alert("Not connected");
        return;
    }
    if (peer_id == my_id) {
        alert("Can't send a message to oneself :)");
        return;
    }
    var r = new XMLHttpRequest();
    r.open("POST", server + "/message?peer_id=" + my_id + "&to=" + peer_id,
        false);
    r.setRequestHeader("Content-Type", "text/plain");
    r.send(data);
    r = null;
}

function connect() {
    localName = document.getElementById("local").value.toLowerCase();
    server = document.getElementById("server").value.toLowerCase();
    if (localName.length == 0) {
        alert("I need a name please.");
        document.getElementById("local").focus();
    } else {
        document.getElementById("connect").disabled = true;
        document.getElementById("disconnect").disabled = false;
        document.getElementById("send").disabled = false;
        signIn();
    }
}

function disconnect() {
    if (request) {
        request.abort();
        request = null;
    }

    if (hangingGet) {
        hangingGet.abort();
        hangingGet = null;
    }

    if (my_id != -1) {
        request = new XMLHttpRequest();
        request.open("GET", server + "/sign_out?peer_id=" + my_id, false);
        request.send();
        request = null;
        my_id = -1;
    }

    document.getElementById("connect").disabled = false;
    document.getElementById("disconnect").disabled = true;
    document.getElementById("send").disabled = true;
}

window.onbeforeunload = disconnect;

function send() {
    var text = document.getElementById("message").value;
    var peer_id = parseInt(document.getElementById("peer_id").value);
    if (!text.length || peer_id == 0) {
        alert("No text supplied or invalid peer id");
    } else {
        sendToPeer(peer_id, text);
    }
}


