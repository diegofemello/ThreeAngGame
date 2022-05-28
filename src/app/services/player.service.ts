import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Player } from 'src/app/models/player.model';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  players = this.socket.fromEvent<Player[]>('players');
  styleUpdated = this.socket.fromEvent<string>('styleUpdated');
  playersMovement = this.socket.fromEvent<Player[]>('playersMovement');

  currentPlayer!: Player;
  playerObject!: THREE.Object3D;
  animations: any = {};

  public styles: any = {
    BackPack: ['BackPack1', 'BackPack2', 'BackPack3', ''],

    Belt: ['Belt1', 'Belt2', 'Belt3', ''],
    Cloth: [
      'Cloth1',
      'Cloth2',
      'Cloth3',
      'Cloth4',
      'Cloth5',
      'Cloth6',
      'Cloth7',
    ],
    Crown: ['Crown1', 'Crown2', 'Crown3', 'Crown4', ''],
    Face: ['Face1', 'Face2', 'Face3', 'Face4'],
    Glove: ['Glove1', 'Glove2', 'Glove3', 'Glove4', 'Glove5', 'Glove6'],
    Hair: ['Hair1', 'Hair2', 'Hair3', 'Hair4', 'Hair5'],
    // HairHalf: ['', 'Hair1Half', 'Hair2Half', 'Hair3Half', 'Hair4Half', 'Hair5Half',''],
    Hat: ['Hat1', 'Hat2', 'Hat3', ''],
    Helm: ['Helm1', 'Helm2', 'Helm3', 'Helm4', 'Helm5', 'Helm6', 'Helm7', ''],
    Shoe: ['Shoe1', 'Shoe2', 'Shoe3', 'Shoe4', 'Shoe5', 'Shoe6'],
    ShoulderPad: [
      'ShoulderPad1',
      'ShoulderPad2',
      'ShoulderPad3',
      'ShoulderPad4',
      'ShoulderPad5',
      'ShoulderPad6',
      '',
    ],
  };

  constructor(private socket: Socket) {
    this.LoadAnimations();
  }

  getPlayers() {
    this.socket.emit('getPlayers');
  }

  getRandomStyle() {
    const styles: any = {};
    for (const key in this.styles) {
      if (this.styles.hasOwnProperty(key)) {
        const index = Math.floor(Math.random() * this.styles[key].length);
        styles[key] = index + 1;
      }
    }
    return styles;
  }

  newPlayer(username: string, uuid: string) {
    this.currentPlayer = new Player();
    this.currentPlayer.uid = uuid;
    this.currentPlayer.username = username;
    this.currentPlayer.style = this.getRandomStyle();
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
    const hat = this.styles['Hat'][style['Hat'] - 1];
    const helm = this.styles['Helm'][style['Helm'] - 1];

    const hair = hat != '' || helm != '' ? 'HairHalf' : 'Hair';

    object.traverse((c: THREE.Object3D) => {
      if (c instanceof THREE.Mesh) {
        if (
          c.name == 'BackPack' + style['BackPack'] ||
          c.name == 'Belt' + style['Belt'] ||
          c.name == 'Cloth' + style['Cloth'] ||
          c.name == 'Crown' + style['Crown'] ||
          c.name == 'Face' + style['Face'] ||
          c.name == 'Glove' + style['Glove'] ||
          c.name == hair + style['Hair'] ||
          (c.name == 'Hat' + style['Hat'] && helm == '') ||
          c.name == 'Helm' + style['Helm'] ||
          c.name == 'Shoe' + style['Shoe'] ||
          c.name == 'ShoulderPad' + style['ShoulderPad']
        ) {
          c.visible = true;
          c.material.displacementScale = 0.01;
          c.castShadow = true;
        } else {
          c.visible = false;
        }
        if (name) c.userData['username'] = name;
      }
    });
  }

  LoadAnimations = () => {
    const onLoad = (animName: any, anim: any) => {
      const clip = anim.animations[0];
      this.animations[animName] = clip;
    };

    const loader = new FBXLoader();
    loader.setPath('./assets/models3d/CharacterRPG/animations/');
    loader.load('walk.fbx', (a) => {
      onLoad('walk', a);
    });
    loader.load('run.fbx', (a) => {
      onLoad('run', a);
    });
    loader.load('idle.fbx', (a) => {
      onLoad('idle', a);
    });
    loader.load('jump.fbx', (a) => {
      onLoad('jump', a);
    });
  };
}
