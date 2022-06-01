export const environment = {
  production: false,
  socketUrl: 'ws://localhost:8080',
  RTCPeerConfiguration: {
    iceServers: [
      {
        urls: 'stun:stun1.l.google.com:19302'
      }
    ]
  }
};
