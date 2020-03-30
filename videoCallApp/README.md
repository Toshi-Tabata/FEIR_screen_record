# Changes to be Made and Information about Functions

Detailed the flow of functions for callClient.JS and what changes need to be made to it.
General information about the other files

## depreciated.js

Old test file - there just in case

## server_test.html

Uses signalling.js for the actual functions. Lets you send GET request messages to other clients.

```
BYE - sends a message to end the current active call
<SDP object> - initiates a call with other client
```

## CallClient.html

Uses callClient.js for actual functions. This is a test WebRTC app for voice and video calling. 
Forked from https://github.com/googlecodelabs/webrtc-web/tree/master/step-02
Tutorial from https://codelabs.developers.google.com/codelabs/webrtc-web/#4

### Notes about functions in callClient.js

```
	- line 108 is where the offer SDP is made by local (grab it from line 111), createOffer()
	- line 144 (remotePeerConnection.setRemoteDescription(description)) is where we input local SDP into remote (i.e. delete this, and send the SDP instead)
	- line 150 remotePeerConnection.createAnswer() needs to be removed
		○ it creates an answer SDP after it gets the local's SDP
			§ we handle this on HL side
	- line 158 createdAnswer(description) applies the answer SDP to both remote and local
	- setRemoteDescriptionSuccess () or setLocalDescriptionSuccess() lead to setDescriptionSuccess()
		○ which leads to getPeeerName()??? which just returns a string of either remote or local??
		○ Seems like this is debugging and I'm wondering if we can delete this

How Ice Candidates are Handled:
	- handleConnection(event)
		○ This adds the icecandidate to the remote/local object 
		○ accepts an 'icecandidate' event (from callAction) 
			§ in callAction() 2 sets of event listeners are made (icecandidate and iceconnectionstatechange) for both local and remote
		○ icecandidate event is sent to remote/local object after RTCIceCandidate is added to them
			§ this triggers from using .setLocalDescription()
		○ a connection state gets changed 4 times
		○ Under handleConnection(); we want to add a  way to grab IceCandidate, line 185   <------------------ this is important

```

### Flow of Functions (Flow is correct, but function description is probably wrong)

```
	1. startAction()
		a. Creates mediaStream for local
	2. gotLocalMediaStream()
		a. Sets HTML element (localVideo) with mediaStream 
			i. localVideo.srcObject = mediaStream;
		b. Creates localStream
		c. Enables call button
	3. callAction()
		○ Grabs video/audio tracks to access as videoTracks/audioTracks variable
		○ Makes new local RTCPeerConnection() object (called localPeerConnection)
		○ Adds eventlisteners for icecandiate and icecandidateStateChange
		
		○ Creates new remote RTCPeerConnection() 
			§ With same event listeners for ice candidates
		○ Listens for remote's video stream
		○ Adds local media stream 

		○ Creates local SDP (and prints it to html) 
	4. createdOffer() executed inside callAction()
		○ Adds SDP to pc.setLocalDescription 
		○ Adds Remote SDP to remote pc.setlocaldescription
	5. SetlocalDescriptionSuccess() + setRemoteDescriptionSuccess() + createAnswer() + Createdanswer()
	6. CreateAnswer
		○ 
	7. CreatedAnswer()
```