export const environment = {
  production: true,
  socketUrl: 'wss://threeang.azurewebsites.net',
  wsEndpoint: 'ws://localhost:8081/',
  RTCPeerConfiguration: {
    iceServers: [
      {
        urls: 'stun:stun1.l.google.com:19302'
      }
    ]
  }
};
