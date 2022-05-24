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

  currentPlayer!: Player;

  constructor(private socket: Socket) {}

  getPlayer(uid: string) {
    this.socket.emit('getPlayer', uid);
  }

  getPlayers() {
    this.socket.emit('getPlayers');
  }

  newPlayer(username: string, style: number, object: THREE.Object3D) {
    this.currentPlayer = new Player();
    this.currentPlayer.uid =  Math.random().toString(36).substring(2, 15);
    this.currentPlayer.username = username;
    this.currentPlayer.style = style;
    this.currentPlayer.object = object;

    this.socket.emit('addPlayer', {
      uid: this.currentPlayer.uid,
      username: this.currentPlayer.username,
      position: new THREE.Vector3(),
      rotation: new THREE.Vector3(),
      style: this.currentPlayer.style,
    });
  }

  updatePlayerPosition(
    position: THREE.Vector3,
    rotation: THREE.Vector3
  ) {
    this.socket.emit('playerMove', {
      uid: this.currentPlayer.uid,
      position: position,
      rotation: rotation,
    });
  }

  updatePlayerStyle(style: number) {
    this.socket.emit('playerStyle', {
      uid: this.currentPlayer.uid,
      style: style,
    });
  }
}
