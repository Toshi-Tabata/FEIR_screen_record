'use strict';

const mediaStreamConstraints = {
    video: true,  // maybe make this false and it'll avoid sending my video data? Need to avoid breaking HL
    audio: true   // if the wrong GET message gets sent to C# app, it crashes LOL
};

// Exchange both Audio + Video
const offerOptions = {
    offerToReceiveVideo: 1,
    offerToReceiveAudio: 1,
};

// Define initial start time of the call (defined as connection between peers). For syncing times between clients
let startTime = null;

// Define peer connections, streams and video elements.
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');


let localStream;

let localPeerConnection;

localVideo.addEventListener('loadedmetadata', logVideoLoaded);


function startAction() {
    startButton.disabled = true;
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
        .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);
    trace('Requesting local stream.');
}

// Sets the MediaStream as the video element src.
function gotLocalMediaStream(mediaStream) {
    localVideo.srcObject = mediaStream;
    localStream = mediaStream;
    trace('Received local stream.');
    callButton.disabled = false;  // Enable call button.
}

function createRTCPeerConnection(){
    const servers = null;  // Allows for RTC server configuration. Don't really need it

    // Create peer connections and add behavior.
    localPeerConnection = new RTCPeerConnection(servers);
    trace('Created local peer connection object localPeerConnection.');

}

// Handles call button action: creates peer connection.
function callAction() {
    callButton.disabled = true;
    hangupButton.disabled = false;

    trace('Starting call.');
    startTime = window.performance.now();

    // Get local media stream tracks.
    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();
    if (videoTracks.length > 0) {
        trace(`Using video device: ${videoTracks[0].label}.`);
    }
    if (audioTracks.length > 0) {
        trace(`Using audio device: ${audioTracks[0].label}.`);
    }

    createRTCPeerConnection();

    // Add local stream to connection and create offer to connect.
    localPeerConnection.addStream(localStream);
    localPeerConnection.addEventListener('track', gotRemoteStream);

    localPeerConnection.createOffer(offerOptions)
        .then(function (offer) {
            createdOffer(offer);
            sendSDP(offer);
        })
        .catch(setSessionDescriptionError);
}

//TODO: get ICE candidate from remote using GET
function addIceCandidate(iceCandidate){
    let addICE = document.getElementById("remoteICE").value;
    addICE = JSON.parse(iceCandidate);
    localPeerConnection.addIceCandidate(addICE)
        .catch(function(err){
            console.log("error: " + err);
        })
}
function gotRemoteStream(e){
    if (remoteVideo.srcObject !== e.streams[0]) {
        remoteVideo.srcObject = e.streams[0];
        console.log('pc2 received remote stream');
    }

}

// Sets local SDP
function createdOffer(description) {
    localPeerConnection.setLocalDescription(description)
        .catch(function(err){
            console.log(err);
        })
}

//TODO: send local SDP
function sendSDP(description){
    // send remotely.
    document.getElementById("mySDP").value = JSON.stringify(description); // for debugging
    let peerID = document.getElementById("peer_id").value;
    sendToPeer(peerID, JSON.stringify(description));
}

// This handles receiving of remote Peer SDP
function receivedAnswerSDP(SDP){
    var peerSDP = document.getElementById("peerSDP").value;
    createdAnswer(SDP);


    //TODO: Make this activated with user input (manually) for now, later we'll add GET request that will do this
    // TODO: automatically.
    trace('remotePeerConnection createAnswer start.');
}

function createdAnswer(description) {
    // description = JSON.parse(description);
    trace(`Answer from remotePeerConnection:\n${description.sdp}.`);
    console.log(description);
    trace('localPeerConnection setRemoteDescription start.');
    localPeerConnection.setRemoteDescription(description)
        .catch(function(err){
            console.log(err);
        });
}














// TODO: Simplify below



// Define action buttons.
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

// Set up initial action buttons status: disable call and hangup.
callButton.disabled = true;
hangupButton.disabled = true;


// Handles hangup action: ends up call, closes connections and resets peers.
function hangupAction() {

    //TODO: this needs to send GET: BYE
    localPeerConnection.close();
    remotePeerConnection.close();
    localPeerConnection = null;
    remotePeerConnection = null;
    hangupButton.disabled = true;
    callButton.disabled = false;
    trace('Ending call.');
}


// Utility Functions //

// Add click event handlers for buttons.
startButton.addEventListener('click', startAction);
callButton.addEventListener('click', callAction);
hangupButton.addEventListener('click', hangupAction);

// Add behavior for video streams.

// Logs a message with the id and size of a video element.
function logVideoLoaded(event) {
    const video = event.target;
    trace(`${video.id} videoWidth: ${video.videoWidth}px, ` +
        `videoHeight: ${video.videoHeight}px.`);
}

// Logs a message with the id and size of a video element.
// This event is fired when video begins streaming.
function logResizedVideo(event) {
    logVideoLoaded(event);

    if (startTime) {
        const elapsedTime = window.performance.now() - startTime;
        startTime = null;
        trace(`Setup time: ${elapsedTime.toFixed(3)}ms.`);
    }
}

// // Gets the "other" peer connection.
// function getOtherPeer(peerConnection) {
//     return (peerConnection === localPeerConnection) ?
//         remotePeerConnection : localPeerConnection;
// }

// Gets the name of a certain peer connection.
function getPeerName(peerConnection) {
    return (peerConnection === localPeerConnection) ?
        'localPeerConnection' : 'remotePeerConnection';
}

// Logs an action (text) and the time when it happened on the console.
function trace(text) {
    text = text.trim();
    const now = (window.performance.now() / 1000).toFixed(3);

    console.log(now, text);
}

// Error or Logging Functions

// Handles error by logging a message to the console.
function handleLocalMediaStreamError(error) {
    trace(`navigator.getUserMedia error: ${error.toString()}.`);
}

// Logs error when setting session description fails.
function setSessionDescriptionError(error) {
    trace(`Failed to create session description: ${error.toString()}.`);
}

// Logs that the connection succeeded.
function handleConnectionSuccess(peerConnection) {
    trace(`${getPeerName(peerConnection)} addIceCandidate success.`);
}

// Logs that the connection failed.
function handleConnectionFailure(peerConnection, error) {
    trace(`${getPeerName(peerConnection)} failed to add ICE Candidate:\n`+
        `${error.toString()}.`);
}


// Logs changes to the connection state.
function handleConnectionChange(event) {
    const peerConnection = event.target;
    console.log('ICE state change event: ', event);
    trace(`${getPeerName(peerConnection)} ICE state: ` +
        `${peerConnection.iceConnectionState}.`);
}


// Logs success when setting session description.
function setDescriptionSuccess(peerConnection, functionName) {
    const peerName = getPeerName(peerConnection);
    trace(`${peerName} ${functionName} complete.`);
}


// Logs success when localDescription is set.
function setLocalDescriptionSuccess(peerConnection) {
    setDescriptionSuccess(peerConnection, 'setLocalDescription');
}


// Logs success when remoteDescription is set.
function setRemoteDescriptionSuccess(peerConnection) {
    setDescriptionSuccess(peerConnection, 'setRemoteDescription');
}

function receivedOfferSDP(SDP){
    localPeerConnection
}





































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

//TODO: Change this so I'm not using so many if statements?
function handlePeerMessage(peer_id, data) {
    if (JSON.parse(data).type === "answer"){
        receivedAnswerSDP(JSON.parse(data));
        console.log("answer: " + data.sdpMid);
    }
    else if (JSON.parse(data).type === "offer"){
        receivedOfferSDP(JSON.parse(data));
        console.log("received offer SDP");
    }

    if (JSON.parse(data).sdpMid === "0"){
        addIceCandidate(data)
    }
    else{
        console.log("error: neither SDP nor ICE candidate");
        console.log("error: this is the problem: " + data);
    }
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
    console.log(peer_id);
    console.log(data);
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


