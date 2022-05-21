import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Player } from 'src/app/models/player.model';
import * as THREE from 'three';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  currentPlayer = this.socket.fromEvent<Player>('player');
  players = this.socket.fromEvent<Player[]>('players');
  playersMovement = this.socket.fromEvent<Player[]>('playersMovement');

  constructor(private socket: Socket) {}

  getPlayer(uid: string) {
    this.socket.emit('getPlayer', uid);
  }

  getPlayers(){
    this.socket.emit('getPlayers');
  }

  newPlayer(uid: string) {
    this.socket.emit('addPlayer', { uid: uid, position: new THREE.Vector3, rotation:  new THREE.Vector3 });
  }

  updatePlayerPosition(uid: string, position: THREE.Vector3, rotation: THREE.Vector3) {
    this.socket.emit('playerMove', {
      uid: uid,
      position: position,
      rotation: rotation,
    });
  }
}
