import { Component, Input, OnInit } from '@angular/core';
import { BasicControllerInputService } from 'src/app/services/basic-controller-input.service';
import { FiniteStateMachineService } from 'src/app/services/finite-state-machine.service';
import { ManagerService } from 'src/app/services/manager.service';
import * as THREE from 'three';
import { Object3D } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';


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
  private _decceleration!: THREE.Vector3;
  private _acceleration!: THREE.Vector3;
  private _velocity!: THREE.Vector3;
  private _animations: any = {};
  private _input!: BasicControllerInputService;
  private _stateMachine: FiniteStateMachineService;
  private _target!: Object3D;
  private _position: any;
  private renderer: any;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private camera: any;

  constructor(private manager: ManagerService, input: BasicControllerInputService, stateMachine: FiniteStateMachineService) {
    this._input = input;
    this._stateMachine = stateMachine;
    this._stateMachine.SetProxy(new BasicControllerProxy(this._animations));
  }

  ngOnInit(): void {
    this._input._Init();
    this._stateMachine._Init();

    this._scene = this.manager._scene;
    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(2, 0.5, 100);
    this._velocity = new THREE.Vector3(0, 0, 0);


    // const raycaster = this.raycaster;

    const intersects = this.raycaster.intersectObject(
      this.manager._scene,
      true
    );
    this.renderer = this.manager._threejs;
    const renderer = this.renderer;
    this.camera = this.manager._camera;
    const camera = this.camera;
    const scene = this.manager._scene;
    const mouse = this.mouse;

    const onMouseDown = (event: any) => {
      mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
      this.raycaster.setFromCamera(mouse, camera);

      // intersection point

      const intersects = this.raycaster.intersectObject(scene, true);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        point.y = this._target.position.y;

        this._target.lookAt(point);
        this._target.position.copy(point);

      }
    }

    this.renderer.domElement.addEventListener(
      'pointerdown',
      onMouseDown,
      false
    );

    const loader3 = new FBXLoader();
    loader3.load(this.path, (object: THREE.Object3D) => {
      object.traverse((c: THREE.Object3D) => {
        c.children.forEach((child) => {
          if (this.gender == 'female') {
            if (child.name == 'Head01' || child.name == 'Body01')
              child.visible = false;
          } else {
            if (child.name == 'Head02' || child.name == 'Body02')
              child.visible = false;
          }
        });
      });

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

      const newObject = new THREE.Object3D();
      newObject.add(object);
      newObject.name = this.name;

      this._scene.add(newObject);
      this._target = newObject;

      this._mixer = new THREE.AnimationMixer(newObject);
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
      loader2.setPath('./assets/models-3d/');
      loader2.load('walk.fbx', (a) => {
        _OnLoad('walk', a);
      });
      loader2.load('run.fbx', (a) => {
        _OnLoad('run', a);
      });
      loader2.load('idle.fbx', (a) => {
        _OnLoad('idle', a);
      });
      loader2.load('dance.fbx', (a) => {
        _OnLoad('dance', a);
      });

      this.Animate();
    });
  }

  Animate() {
    requestAnimationFrame(() => {
      this.Update(1 / 60);
      this.Animate();
    });
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
    frameDecceleration.z =
      Math.sign(frameDecceleration.z) *
      Math.min(Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const controlObject = this._target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    const acc = this._acceleration.clone();
    if (this._input._keys.shift) {
      acc.multiplyScalar(2.0);
    }

    if (this._stateMachine._currentState != null) {
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
      _Q.setFromAxisAngle(
        _A,
        4.0 * Math.PI * timeInSeconds * this._acceleration.y
      );
      _R.multiply(_Q);
    }
    if (this._input._keys.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(
        _A,
        4.0 * -Math.PI * timeInSeconds * this._acceleration.y
      );
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
    this.manager._target = this._position;

    if (this._mixer) {
      this._mixer.update(timeInSeconds);
    }
  }
}

export class BasicControllerProxy {
  _animations: any;
  constructor(animations: any) {
    this._animations = animations;
  }

  get animations() {
    return this._animations;
  }
};
