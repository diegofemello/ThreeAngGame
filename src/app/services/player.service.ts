import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Player } from 'src/app/models/player.model';
import * as THREE from 'three';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  players = this.socket.fromEvent<Player[]>('players');
  playersMovement = this.socket.fromEvent<Player[]>('playersMovement');

  currentPlayer = '';
  currentStyle!: number;
  player!: Player;

  constructor(private socket: Socket) {}

  getPlayer(uid: string) {
    this.socket.emit('getPlayer', uid);
  }

  getPlayers() {
    this.socket.emit('getPlayers');
  }

  newPlayer(uid: string, username: string, style: number) {
    this.socket.emit('addPlayer', {
      uid: uid,
      username: username,
      position: new THREE.Vector3(),
      rotation: new THREE.Vector3(),
      style: style,
    });
    this.currentPlayer = uid;
  }

  updatePlayerPosition(
    uid: string,
    position: THREE.Vector3,
    rotation: THREE.Vector3
  ) {
    this.socket.emit('playerMove', {
      uid: uid,
      position: position,
      rotation: rotation,
    });
  }

  updatePlayerStyle(uid: string, style: number) {
    this.socket.emit('playerStyle', {
      uid: uid,
      style: style,
    });
  }
}
