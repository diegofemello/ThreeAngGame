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
  playerObject!: THREE.Object3D;

  constructor(private socket: Socket) {}

  getPlayers() {
    this.socket.emit('getPlayers');
  }

  newPlayer(username: string, style: any) {
    this.currentPlayer = new Player();
    this.currentPlayer.uid = Math.random().toString(36).substring(2, 15);
    this.currentPlayer.username = username;
    this.currentPlayer.style = style;
    this.currentPlayer.state = 'idle';

    this.socket.emit('addPlayer', {
      uid: this.currentPlayer.uid,
      username: this.currentPlayer.username,
      position: new THREE.Vector3(),
      rotation: new THREE.Vector3(),
      style: this.currentPlayer.style,
      state: this.currentPlayer.state,
    });
  }

  updatePlayerPosition(position: THREE.Vector3, rotation: THREE.Vector3) {
    this.socket.emit('playerMove', {
      uid: this.currentPlayer.uid,
      position: position,
      rotation: rotation,
      state: this.currentPlayer.state,
    });
  }

  updatePlayerStyle(style: any) {
    this.currentPlayer.style = style;
    this.socket.emit('playerStyle', {
      uid: this.currentPlayer.uid,
      style: style,
    });

    this.updateMesh();
  }

  public updateMesh(
    object: THREE.Object3D = this.playerObject,
    style: any = this.currentPlayer.style,
    name: string = 'Player'
  ) {
    object.traverse((c: THREE.Object3D) => {
      if (c instanceof THREE.Mesh) {
        if (
          c.name == 'ShoulderPad' + style['ShoulderPad'] ||
          c.name == 'Face' + style['Face'] ||
          c.name == 'Cloth' + style['Cloth'] ||
          c.name == 'Hair' + style['Hair'] ||
          c.name == 'Glove' + style['Glove'] ||
          c.name == 'Shoe' + style['Shoe']
        ) {
          c.visible = true;
          c.material.displacementScale = 0.01;
          c.castShadow = true;
        } else {
          c.visible = false;
        }
        if(name) c.userData['username'] = name;
      }
    });
  }
}
