export const environment = {
  production: true,
  socketUrl: 'wss://threeang.azurewebsites.net',
  RTCPeerConfiguration: {
    iceServers: [
      {
        urls: 'stun:stun1.l.google.com:19302'
      }
    ]
  }
};
