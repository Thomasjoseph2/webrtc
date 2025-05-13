const socket = io();
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const peer = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
  });

peer.ontrack = (event) => {
  remoteVideo.srcObject = event.streams[0];
};

peer.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('candidate', event.candidate);
  }
};

// Caller logic
socket.on('connect', async () => {
  if (location.hash === '#caller') {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit('offer', offer);
  }
});

socket.on('offer', async (offer) => {
  await peer.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  socket.emit('answer', answer);
});

socket.on('answer', async (answer) => {
  await peer.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('candidate', async (candidate) => {
  try {
    await peer.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (err) {
    console.error('Error adding candidate:', err);
  }
});
