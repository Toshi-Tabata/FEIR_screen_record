'use strict';

// local means JavaScript Client (this)
// remote means not this client LOL
// both local & remote are being made within below functions


// Giving what to send TODO: (make these toggleable with buttons)
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
let remoteStream;

let localPeerConnection;
let remotePeerConnection;

localVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('onresize', logResizedVideo);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// startAction(), gotLocalMediaStream, callAction(), createdOffer(), createAnswer(), createdAnswer()
// this is the general order of how the functions are executed


// Handles start button action: creates the local MediaStream.
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

    const servers = null;  // Allows for RTC server configuration. Don't really need it

    // Create peer connections and add behavior.
    localPeerConnection = new RTCPeerConnection(servers);
    trace('Created local peer connection object localPeerConnection.');

    localPeerConnection.addEventListener('icecandidate', handleConnection);
    localPeerConnection.addEventListener(
        'iceconnectionstatechange', handleConnectionChange); // this probs does nothing

    // listens for icecandidate to be made, once made, triggers handleConnection which then applies the icecandidate to local
    // icecandidate event triggers upon receiving .setLocalDescription
    // Created remotePeerConnection ///////////////////////////////////////////////////////////////////////////////////

    //
    //
    // remotePeerConnection = new RTCPeerConnection(servers);
    // trace('Created remote peer connection object remotePeerConnection.');
    //
    // remotePeerConnection.addEventListener('icecandidate', handleConnection);
    // remotePeerConnection.addEventListener(
    //     'iceconnectionstatechange', handleConnectionChange);
    // remotePeerConnection.addEventListener('addstream', gotRemoteMediaStream);
    //
    //
    //



    // remotePeerConnection ///////////////////////////////////////////////////////////////////////////////////////////
    // Above is useless when we start incorporating the real remote peer's SDP and IceCandidates
    // Above needs to be replaced by a listener for an IceCandidate input from the server/manual input

    // Add local stream to connection and create offer to connect.
    localPeerConnection.addStream(localStream);
    trace('Added local stream to localPeerConnection.');
    trace('localPeerConnection createOffer start.');
    localPeerConnection.createOffer(offerOptions)
        .then(function (offer) {
            createdOffer(offer);

            // shown inside my SDP textArea
            document.getElementById("mySDP").value = JSON.stringify(offer);
        })
        .catch(setSessionDescriptionError);
}


//TODO: get ICE candidate from remote using GET
function addIceCandidate(){
    let addICE = document.getElementById("remoteICE").value;
    addICE = JSON.parse(addICE);
    localPeerConnection.addIceCandidate(addICE)
        .catch(function(err){
            console.log("error: " + err);
        })
}

//
// // Handles remote MediaStream success by adding it as the remoteVideo src.
// function gotRemoteMediaStream(event) {
//     const mediaStream = event.stream;
//     remoteVideo.srcObject = mediaStream;
//     remoteStream = mediaStream;
//     trace('Remote peer connection received remote stream.');
// }

// a fake remote SDP for testing
// var remoteDescription = `{"type":"answer","sdp":"v=0\r\no=- 3484190468199077634 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE audio video\r\na=msid-semantic: WMS stream_label_2e2661058f8f8be\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111 103 104 9 102 0 8 106 105 13 110 112 113 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:CIhb\r\na=ice-pwd:YbhbpwDg+kxcJtypI2niGn7S\r\na=ice-options:trickle\r\na=fingerprint:sha-256 98:FF:80:C6:4A:0B:EA:14:C9:27:B8:00:EA:EF:05:25:9E:F7:4E:61:87:E1:D0:F2:71:E7:34:6D:A5:A0:FF:EE\r\na=setup:active\r\na=mid:audio\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=sendrecv\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=rtpmap:103 ISAC/16000\r\na=rtpmap:104 ISAC/32000\r\na=rtpmap:9 G722/8000\r\na=rtpmap:102 ILBC/8000\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:106 CN/32000\r\na=rtpmap:105 CN/16000\r\na=rtpmap:13 CN/8000\r\na=rtpmap:110 telephone-event/48000\r\na=rtpmap:112 telephone-event/32000\r\na=rtpmap:113 telephone-event/16000\r\na=rtpmap:126 telephone-event/8000\r\na=ssrc:49151228 cname:RSLmkhBgx1+pzZqS\r\na=ssrc:49151228 msid:stream_label_2e2661058f8f8be audio_label_1d757470d443bd30\r\na=ssrc:49151228 mslabel:stream_label_2e2661058f8f8be\r\na=ssrc:49151228 label:audio_label_1d757470d443bd30\r\nm=video 9 UDP/TLS/RTP/SAVPF 100 96 97 98 99 101 127 124 125\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:CIhb\r\na=ice-pwd:YbhbpwDg+kxcJtypI2niGn7S\r\na=ice-options:trickle\r\na=fingerprint:sha-256 98:FF:80:C6:4A:0B:EA:14:C9:27:B8:00:EA:EF:05:25:9E:F7:4E:61:87:E1:D0:F2:71:E7:34:6D:A5:A0:FF:EE\r\na=setup:active\r\na=mid:video\r\na=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r\na=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:4 urn:3gpp:video-orientation\r\na=extmap:5 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r\na=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r\na=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r\na=sendrecv\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:100 H264/90000\r\na=rtcp-fb:100 ccm fir\r\na=rtcp-fb:100 nack\r\na=rtcp-fb:100 nack pli\r\na=rtcp-fb:100 goog-remb\r\na=rtcp-fb:100 transport-cc\r\na=fmtp:100 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\na=rtpmap:96 VP8/90000\r\na=rtcp-fb:96 ccm fir\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\na=rtcp-fb:96 goog-remb\r\na=rtcp-fb:96 transport-cc\r\na=rtpmap:97 rtx/90000\r\na=fmtp:97 apt=96\r\na=rtpmap:98 VP9/90000\r\na=rtcp-fb:98 ccm fir\r\na=rtcp-fb:98 nack\r\na=rtcp-fb:98 nack pli\r\na=rtcp-fb:98 goog-remb\r\na=rtcp-fb:98 transport-cc\r\na=rtpmap:99 rtx/90000\r\na=fmtp:99 apt=98\r\na=rtpmap:101 rtx/90000\r\na=fmtp:101 apt=100\r\na=rtpmap:127 red/90000\r\na=rtpmap:124 rtx/90000\r\na=fmtp:124 apt=127\r\na=rtpmap:125 ulpfec/90000\r\na=ssrc-group:FID 1580943649 3234095878\r\na=ssrc:1580943649 cname:RSLmkhBgx1+pzZqS\r\na=ssrc:1580943649 msid:stream_label_2e2661058f8f8be video_label_fffbc33c3dc71dba\r\na=ssrc:1580943649 mslabel:stream_label_2e2661058f8f8be\r\na=ssrc:1580943649 label:video_label_fffbc33c3dc71dba\r\na=ssrc:3234095878 cname:RSLmkhBgx1+pzZqS\r\na=ssrc:3234095878 msid:stream_label_2e2661058f8f8be video_label_fffbc33c3dc71dba\r\na=ssrc:3234095878 mslabel:stream_label_2e2661058f8f8be\r\na=ssrc:3234095878 label:video_label_fffbc33c3dc71dba\r\n"}`
// ;

// Logs offer creation and sets peer connection session descriptions. Description = local SDP
function createdOffer(description) {
    trace(`Offer from localPeerConnection:\n${description.sdp}`);


    trace('localPeerConnection setLocalDescription start.');
    localPeerConnection.setLocalDescription(description)
        .then(() => {
            setLocalDescriptionSuccess(localPeerConnection);
        }).catch(setSessionDescriptionError);

       trace('remotePeerConnection setRemoteDescription start.');


    // sendOfferSDP(description);


    // TODO: receive remote Answer SDP here, cut this out too
    // trace('remotePeerConnection createAnswer start.');
    // remotePeerConnection.createAnswer()
    //     .then(createdAnswer)
    //     .catch(setSessionDescriptionError);

}
function sendOfferSDP(description){
    // should send offer SDP using GET request
    // for now, we'll manually do it
    remotePeerConnection.setRemoteDescription(description)  // Giving remote the local's offer SDP
    // delete this later, replace with actual GET request. We'll do this manually now
    // TODO: replace this with waiting for a response
        .then(() => {
            setRemoteDescriptionSuccess(remotePeerConnection); // just logging, can remove
        }).catch(setSessionDescriptionError);

}

function receivedAnswerSDP(){
    var peerSDP = document.getElementById("peerSDP").value;
    createdAnswer(peerSDP);

    // should receive a message containing SDP of other person + ice Candidates

    //TODO: Make this activated with user input (manually) for now, later we'll add GET request that will do this
    // TODO: automatically.
    trace('remotePeerConnection createAnswer start.');
    // remotePeerConnection.createAnswer()
    //     .then()
    //     .then(createdAnswer)
    //     .catch(setSessionDescriptionError);
}


// Logs answer to offer creation and sets peer connection session descriptions.
function createdAnswer(description) {
    description = JSON.parse(description);
    trace(`Answer from remotePeerConnection:\n${description.sdp}.`);

    // trace('remotePeerConnection setLocalDescription start.');
    // remotePeerConnection.setLocalDescription(description)
    //     .then(() => {
    //         setLocalDescriptionSuccess(remotePeerConnection);
    //     }).catch(setSessionDescriptionError);

    trace('localPeerConnection setRemoteDescription start.');
    localPeerConnection.setRemoteDescription(description)
        .then(() => {
            setRemoteDescriptionSuccess(localPeerConnection);
        }).catch(setSessionDescriptionError);
}

// Define RTC peer connection behavior.

// Connects with new peer candidate.
function handleConnection(event) {
    const peerConnection = event.target;   // tells us who got triggered (local or remote)
    const iceCandidate = event.candidate;  // upon this event occurring

    if (iceCandidate) {
        const newIceCandidate = new RTCIceCandidate(iceCandidate);
        // const otherPeer = getOtherPeer(peerConnection);  // returns which peer object, local or remote
        // // Add a way to grab the IceCandidate from here using event.candidate.candidate
        localPeerConnection.addIceCandidate(newIceCandidate)  // adds iceCandidate to the peer
            .then(() => {
                handleConnectionSuccess(peerConnection);
            }).catch((error) => {
            handleConnectionFailure(peerConnection, error);
        });

        trace(`${getPeerName(peerConnection)} ICE candidate:\n` +
            `${event.candidate.candidate}.`);
    }
}


// Define and add behavior to buttons.

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
