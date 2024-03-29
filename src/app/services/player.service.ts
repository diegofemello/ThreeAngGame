import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Player } from 'src/app/models/player.model';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  players = this.socket.fromEvent<Player[]>('players');
  styleUpdated = this.socket.fromEvent<string>('styleUpdated');
  playersMovement = this.socket.fromEvent<Player[]>('playersMovement');
  messages$ = this.socket.fromEvent<any>('buffer');

  listener = new THREE.AudioListener();

  private currentPlayer!: Player;
  private playerObject!: THREE.Object3D;
  private animations: any = {};

  private basePlayerObject!: THREE.Object3D;
  private path = './assets/models3d/CharacterRPG/Character.gltf';
  private animationsPath = './assets/models3d/CharacterRPG/animations/';
  private scale = 0.2;

  styles: any = {
    Cinto: ['Belt1', 'Belt2', 'Belt3', ''],
    Chapeu: ['Hat1', 'Hat2', 'Hat3', ''],
    Coroa: ['Crown1', 'Crown2', 'Crown3', 'Crown4', ''],
    Cabelo: ['Hair1', 'Hair2', 'Hair3', 'Hair4', 'Hair5'],
    Elmo: ['Helm1', 'Helm2', 'Helm3', 'Helm4', 'Helm5', 'Helm6', 'Helm7', ''],
    Luvas: ['Glove1', 'Glove2', 'Glove3', 'Glove4', 'Glove5', 'Glove6'],
    Mochila: ['BackPack1', 'BackPack2', ''],
    Ombreiras: [
      'ShoulderPad1',
      'ShoulderPad2',
      'ShoulderPad3',
      'ShoulderPad4',
      'ShoulderPad5',
      'ShoulderPad6',
      '',
    ],
    Rosto: ['Face1', 'Face2', 'Face3', 'Face4'],
    Roupa: [
      'Cloth1',
      'Cloth2',
      'Cloth3',
      'Cloth4',
      'Cloth5',
      'Cloth6',
      'Cloth7',
    ],
    Sapatos: ['Shoe1', 'Shoe2', 'Shoe3', 'Shoe4', 'Shoe5', 'Shoe6'],
    // WeaponL: [
    //   'WeaponL1',
    //   'WeaponL2',
    //   'WeaponL3',
    //   'WeaponL4',
    //   'WeaponL5',
    //   'WeaponL6',
    //   'WeaponL7',
    //   '',
    // ],
    // WeaponR: [
    //   'WeaponR1',
    //   'WeaponR2',
    //   'WeaponR3',
    //   'WeaponR4',
    //   'WeaponR5',
    //   'WeaponR6',
    //   'WeaponR7',
    //   '',
    // ],
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
        } else if (sourceNode.isBone) boneClones[sourceNode.uuid] = clonedNode;
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

  LoadBaseModel = () => {
    const modelLoadingManager = new THREE.LoadingManager();
    modelLoadingManager.onLoad = function () {};

    const loader = new GLTFLoader(modelLoadingManager);
    loader.load(this.path, (object: GLTF) => {
      this.basePlayerObject = object.scene;
      this.basePlayerObject.scale.multiplyScalar(this.scale);

      this.basePlayerObject.traverse(function (child: any) {
        if (child.isMesh) {
          // child.material.map = texture;
        }
      });
    });
  };

  constructor(private socket: Socket) {
    this.LoadBaseModel();
    this.LoadAnimations();
  }

  getPlayers() {
    this.socket.emit('getPlayers');
  }

  sendMessage(msg: Message): void {
    console.log('sending message: ' + msg.type);

    this.socket.emit('buffer', msg);
  }

  async getBasePlayerObject(): Promise<THREE.Object3D> {
    if (this.basePlayerObject) {
      return new Promise((resolve) => {
        const player = this.basePlayerObject.clone();
        this.resetClonedSkinnedMeshes(this.basePlayerObject, player);
        resolve(player);
      });
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.getBasePlayerObject());
        }, 500);
      });
    }
  }

  async getAnimation(name: string): Promise<THREE.AnimationClip> {
    if (this.animations[name]) {
      return new Promise((resolve) => {
        resolve(this.animations[name]);
      });
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.getAnimation(name));
        }, 500);
      });
    }
  }

  async getAnimations(): Promise<THREE.AnimationClip[]> {
    if (this.animations) {
      return new Promise((resolve) => {
        resolve(this.animations);
      });
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.getAnimations());
        }, 500);
      });
    }
  }

  async getCurrentPlayer(): Promise<Player> {
    if (this.currentPlayer) {
      return new Promise((resolve) => {
        resolve(this.currentPlayer);
      });
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.getCurrentPlayer());
        }, 500);
      });
    }
  }

  async getPlayerObject(): Promise<THREE.Object3D> {
    if (this.playerObject) {
      return new Promise((resolve) => {
        resolve(this.playerObject);
      });
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.getPlayerObject());
        }, 500);
      });
    }
  }

  async getRandomStyle(): Promise<string> {
    return new Promise((resolve) => {
      const styles: any = {};
      const acessories: string[] = [
        'Coroa',
        'Chapeu',
        'Cinto',
        'Elmo',
        'Mochila',
        'Ombreiras',
        'WeaponL',
        'WeaponR',
      ];

      for (const key in this.styles) {
        if (acessories.indexOf(key) !== -1) {
          styles[key] = this.styles[key].length;
        } else if (this.styles.hasOwnProperty(key)) {
          const index = Math.floor(Math.random() * this.styles[key].length);
          styles[key] = index + 1;
        }
      }

      resolve(styles);
    });
  }

  async newPlayer(username: string): Promise<THREE.Object3D> {
    const player = await this.getBasePlayerObject();
    player.name = '_' + username;

    this.currentPlayer = new Player();
    this.currentPlayer.username = username;
    this.currentPlayer.style = await this.getRandomStyle();
    this.currentPlayer.state = 'idle';
    this.playerObject = player;
    this.currentPlayer.uid = player.uuid;

    this.socket.emit('addPlayer', {
      uid: this.currentPlayer.uid,
      username: this.currentPlayer.username,
      position: new THREE.Vector3(),
      rotation: new THREE.Vector3(),
      style: this.currentPlayer.style,
      state: this.currentPlayer.state,
    });

    this.updateMesh();
    this.playerObject.add(this.listener);
    return new Promise((resolve) => {
      resolve(this.playerObject);
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
          c.name == 'ShoulderPad' + style['Ombreiras'] ||
          c.name == 'WeaponL' + style['WeaponL'] ||
          c.name == 'WeaponR' + style['WeaponR']
        ) {
          c.visible = true;
        } else {
          c.visible = false;
        }
        if (name) c.userData['username'] = name;
      }
    });
  }

  LoadAnimations = async () => {
    const animationLoadingManager = new THREE.LoadingManager();
    animationLoadingManager.onLoad = function () {};

    const animationsFiles = [
      'idle.fbx',
      'walk.fbx',
      'run.fbx',
      'jump.fbx',
      'dance.fbx',
    ];
    const animationLoader = new FBXLoader(animationLoadingManager);

    const onLoad = (animName: any, anim: any) => {
      const clip = anim.animations[0];
      this.animations[animName] = clip;
    };

    animationLoader.setPath(this.animationsPath);

    for (let i = 0; i < animationsFiles.length; i++) {
      const animName = animationsFiles[i].split('.')[0];
      animationLoader.load(animationsFiles[i], (anim: any) => {
        onLoad(animName, anim);
      });
    }
  };
}
