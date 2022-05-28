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

  basePlayerObject!: THREE.Object3D;
  private path = './assets/models3d/CharacterRPG/CharacterBaseMesh.fbx';
  private scale = 0.2;

  styles: any = {
    Mochila: ['BackPack1', 'BackPack2', 'BackPack3', ''],

    Cinto: ['Belt1', 'Belt2', 'Belt3', ''],
    Roupa: [
      'Cloth1',
      'Cloth2',
      'Cloth3',
      'Cloth4',
      'Cloth5',
      'Cloth6',
      'Cloth7',
    ],
    Coroa: ['Crown1', 'Crown2', 'Crown3', 'Crown4', ''],
    Rosto: ['Face1', 'Face2', 'Face3', 'Face4'],
    Luvas: ['Glove1', 'Glove2', 'Glove3', 'Glove4', 'Glove5', 'Glove6'],
    Cabelo: ['Hair1', 'Hair2', 'Hair3', 'Hair4', 'Hair5'],
    Chapeu: ['Hat1', 'Hat2', 'Hat3', ''],
    Elmo: ['Helm1', 'Helm2', 'Helm3', 'Helm4', 'Helm5', 'Helm6', 'Helm7', ''],
    Sapatos: ['Shoe1', 'Shoe2', 'Shoe3', 'Shoe4', 'Shoe5', 'Shoe6'],
    Ombreiras: [
      'ShoulderPad1',
      'ShoulderPad2',
      'ShoulderPad3',
      'ShoulderPad4',
      'ShoulderPad5',
      'ShoulderPad6',
      '',
    ],
  };

  resetClonedSkinnedMeshes(source: THREE.Object3D, clone: THREE.Object3D) {
    const clonedMeshes: any[] = [];
    const meshSources: any = {};
    const boneClones: any = {};

    this.parallelTraverse(
      source,
      clone,
      function (sourceNode: any, clonedNode: any) {
        if (sourceNode.isSkinnedMesh) {
          meshSources[clonedNode.uuid] = sourceNode;
          clonedMeshes.push(clonedNode);
        }
        if (sourceNode.isBone) boneClones[sourceNode.uuid] = clonedNode;
      }
    );

    for (let i = 0, l = clonedMeshes.length; i < l; i++) {
      const clone = clonedMeshes[i];
      const sourceMesh = meshSources[clone.uuid];
      const sourceBones = sourceMesh.skeleton.bones;

      clone.skeleton = sourceMesh.skeleton.clone();
      clone.bindMatrix.copy(sourceMesh.bindMatrix);

      clone.skeleton.bones = sourceBones.map(function (bone: any) {
        return boneClones[bone.uuid];
      });

      clone.bind(clone.skeleton, clone.bindMatrix);
    }
  }

  parallelTraverse(a: any, b: any, callback: any) {
    callback(a, b);

    for (let i = 0; i < a.children.length; i++) {
      this.parallelTraverse(a.children[i], b.children[i], callback);
    }
  }

  LoadModel = () => {
    const loader = new FBXLoader();
    loader.load(this.path, (object: THREE.Object3D) => {
      this.basePlayerObject = object;
      this.basePlayerObject.scale.multiplyScalar(this.scale);
    });
  };

  constructor(private socket: Socket) {
    this.LoadModel();
    this.LoadAnimations();
  }

  getPlayers() {
    this.socket.emit('getPlayers');
  }

  getRandomStyle() {
    const styles: any = {};
    const acessories: string[] = [
      'Coroa',
      'Chapeu',
      'Cinto',
      'Elmo',
      'Mochila',
      'Ombreiras',
    ];

    for (const key in this.styles) {
      if (acessories.indexOf(key) !== -1) {
        styles[key] = this.styles[key].length;
      } else if (this.styles.hasOwnProperty(key)) {
        const index = Math.floor(Math.random() * this.styles[key].length);
        styles[key] = index + 1;
      }
    }
    return styles;
  }

  newPlayer(username: string) {
    const player = this.basePlayerObject.clone();

    this.currentPlayer = new Player();
    this.currentPlayer.username = username;
    this.currentPlayer.style = this.getRandomStyle();
    this.currentPlayer.state = 'idle';
    this.playerObject = this.basePlayerObject.clone();
    this.currentPlayer.uid = player.uuid;

    this.socket.emit('addPlayer', {
      uid: this.currentPlayer.uid,
      username: this.currentPlayer.username,
      position: new THREE.Vector3(),
      rotation: new THREE.Vector3(),
      style: this.currentPlayer.style,
      state: this.currentPlayer.state,
    });

    this.resetClonedSkinnedMeshes(this.basePlayerObject, player);
    this.playerObject = player;

    this.updateMesh();
    return this.playerObject;
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
    const hat = this.styles['Chapeu'][style['Chapeu'] - 1];
    const helm = this.styles['Elmo'][style['Elmo'] - 1];

    let hair = hat != '' ? 'HairHalf' : 'Hair';
    hair = helm != '' ? '' : hair;

    object.traverse((c: THREE.Object3D) => {
      if (c instanceof THREE.Mesh) {
        if (
          c.name == 'BackPack' + style['Mochila'] ||
          c.name == 'Belt' + style['Cinto'] ||
          c.name == 'Cloth' + style['Roupa'] ||
          (c.name == 'Crown' + style['Coroa'] && hair == 'Hair') ||
          c.name == 'Face' + style['Rosto'] ||
          c.name == 'Glove' + style['Luvas'] ||
          c.name == hair + style['Cabelo'] ||
          (c.name == 'Hat' + style['Chapeu'] && helm == '') ||
          c.name == 'Helm' + style['Elmo'] ||
          c.name == 'Shoe' + style['Sapatos'] ||
          c.name == 'ShoulderPad' + style['Ombreiras']
        ) {
          c.visible = true;
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
