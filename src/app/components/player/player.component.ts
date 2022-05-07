import { Component, Input, OnInit } from '@angular/core';
import { ManagerService } from 'src/app/services/manager.service';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { BasicControllerInput, BasicControllerProxy, FSM } from './states/State';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements OnInit {
  @Input() positionX = 0;
  @Input() positionY = 0;
  @Input() positionZ = 0;
  @Input() rotationX = 0;
  @Input() rotationY = 0;
  @Input() rotationZ = 0;
  @Input() scale = 0.2;
  @Input() path!: string;
  @Input() texturePath = '';
  @Input() color = '#49BB58';
  @Input() name = '';
  @Input() gender: 'male' | 'female' = 'male';

  private _mixer!: THREE.AnimationMixer;
  private _scene!: THREE.Scene;
  private _loadingManager!: THREE.LoadingManager;
  private _params: any;
  private _decceleration!: THREE.Vector3;
  private _acceleration!: THREE.Vector3;
  private _velocity!: THREE.Vector3;
  private _animations!: any;
  private _input!: BasicControllerInput;
  private _stateMachine: any;
  private _target: any;
  private _position: any;

  constructor(private manager: ManagerService) {}

  ngOnInit(): void {
    this._scene = this.manager._scene;
    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
    this._velocity = new THREE.Vector3(0, 0, 0);

    this._animations= {};
    this._input = new BasicControllerInput();
    this._stateMachine = new FSM(
        new BasicControllerProxy(this._animations));

    const loader3 = new FBXLoader();
    loader3.load(this.path, (object: THREE.Object3D) => {
      //#region
      object.traverse((c: THREE.Object3D) => {
        c.children.forEach((child) => {
          if(this.gender == 'female'){
            if (child.name == 'Head01' || child.name == 'Body01')
            child.visible = false;
          }else{
            if (child.name == 'Head02' || child.name == 'Body02')
            child.visible = false;
          }

        });
      });

      //#endregion

      object.traverse((c: any) => {
        if (c instanceof THREE.Mesh) {
          c.material.color.set(this.color);
          c.material.displacementScale = 0.01;
          c.castShadow = true;
        }
      });

      if (this.name || this.name != '') object.name = this.name;

      object.scale.multiplyScalar(this.scale);
      object.position.set(this.positionX, this.positionY, this.positionZ);
      object.rotation.set(
        this.rotationX * Math.PI,
        this.rotationY * Math.PI,
        this.rotationZ * Math.PI
      );
      this._scene.add(object);
      this._target = object;

      console.log(object);

      this._mixer = new THREE.AnimationMixer(object);
      this._loadingManager = new THREE.LoadingManager();
      this._loadingManager.onLoad = () => {
        this._stateMachine.SetState('idle');
      };


      const _OnLoad = (animName: any, anim: any) => {
        const clip = anim.animations[0];
        const action = this._mixer.clipAction(clip);

        this._animations[animName] = {
          clip: clip,
          action: action,
        };

      };

      const loader2 = new FBXLoader(this._loadingManager);
      loader2.setPath('./assets/zombie/');
      loader2.load('walk.fbx', (a) => { _OnLoad('walk', a); });
      loader2.load('run.fbx', (a) => { _OnLoad('run', a); });
      loader2.load('idle.fbx', (a) => { _OnLoad('idle', a); });
      loader2.load('dance.fbx', (a) => { _OnLoad('dance', a); });

    });

    this.Animate();

  }

  Animate() {

    requestAnimationFrame(() => {
      this.Update(1 / 60);
      this.Animate();
    }
    );
  }

  Update(timeInSeconds: number) {
    if (!this._target) {
      return;
    }

    this._stateMachine.Update(timeInSeconds, this._input);

    const velocity = this._velocity;
    const frameDecceleration = new THREE.Vector3(
        velocity.x * this._decceleration.x,
        velocity.y * this._decceleration.y,
        velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
        Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const controlObject = this._target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    const acc = this._acceleration.clone();
    if (this._input._keys.shift) {
      acc.multiplyScalar(2.0);
    }

    if(this._stateMachine._currentState != null){
      if (this._stateMachine._currentState.Name == 'dance') {
          acc.multiplyScalar(0.0);
        }
    }

    if (this._input._keys.forward) {
      velocity.z += acc.z * timeInSeconds;
    }
    if (this._input._keys.backward) {
      velocity.z -= acc.z * timeInSeconds;
    }
    if (this._input._keys.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }
    if (this._input._keys.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }

    controlObject.quaternion.copy(_R);

    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);

    controlObject.position.add(forward);
    controlObject.position.add(sideways);

    this._position = oldPosition.copy(controlObject.position);

    if (this._mixer) {
      this._mixer.update(timeInSeconds);
    }
  }
}

