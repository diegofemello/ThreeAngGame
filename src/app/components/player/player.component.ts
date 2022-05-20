import { Component, Input, OnInit } from '@angular/core';
import { BasicControllerInputService } from 'src/app/services/basic-controller-input.service';
import { FiniteStateMachineService } from 'src/app/services/finite-state-machine.service';
import { ManagerService } from 'src/app/services/manager.service';
import * as THREE from 'three';
import { Object3D } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

declare const Ammo: any;

let scalingFactor = 35;
let interval: any;

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
  @Input() name = 'Player';
  @Input() gender: 'male' | 'female' = 'male';

  private _mixer!: THREE.AnimationMixer;
  private _loadingManager!: THREE.LoadingManager;
  private _animations: any = {};
  private _controller!: BasicControllerInputService;
  private _stateMachine: FiniteStateMachineService;
  private _target!: Object3D;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private physicsBody: any;

  constructor(
    private manager: ManagerService,
    input: BasicControllerInputService,
    stateMachine: FiniteStateMachineService
  ) {
    this._controller = input;
    this._stateMachine = stateMachine;
    this._stateMachine.SetProxy(new BasicControllerProxy(this._animations));
  }

  ngOnInit(): void {
    this._controller._Init();
    this._stateMachine._Init();

    this.manager._renderer.domElement.addEventListener(
      'pointerdown',
      this.OnMouseDown,
      false
    );

    this.LoadModel();
    this.Animate();
  }

  LoadModel = () => {
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

      object.rotation.set(1.5 * Math.PI, 0 * Math.PI, 0 * Math.PI);

      const newObject = new THREE.Object3D();
      newObject.add(object);
      if (this.name || this.name != '') newObject.name = this.name;

      newObject.scale.multiplyScalar(this.scale);
      newObject.position.set(this.positionX, this.positionY, this.positionZ);

      newObject.rotation.set(
        this.rotationX * Math.PI,
        this.rotationY * Math.PI,
        this.rotationZ * Math.PI
      );

      this.manager._scene.add(newObject);
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
    });
  };

  OnMouseDown = (event: any) => {
    clearInterval(interval);
    this.mouse.x =
      (event.clientX / this.manager._renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y =
      -(event.clientY / this.manager._renderer.domElement.clientHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.manager._camera);

    const intersects = this.raycaster.intersectObject(
      this.manager._scene,
      true
    );

    if (intersects.length > 0) {
      const point = intersects[0].point;
      point.y = this._target.position.y;

      if (this.physicsBody) {
        this.physicsBody
          .getWorldTransform()
          .setOrigin(new Ammo.btVector3(point.x, point.y, point.z));
        this.physicsBody
          .getWorldTransform()
          .setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
        this.physicsBody.activate();

        // this._target.lookAt(point);
        // this._target.position.copy(point);
      }
    }
  };

  Animate() {
    requestAnimationFrame(() => {
      this.Update(1 / 60);
      this.Animate();
    });
  }

  Jump = () => {
    let jumpImpulse = new Ammo.btVector3(0, 15, 0);

    let physicsBody = this._target.userData['physicsBody'];
    physicsBody.setLinearVelocity(jumpImpulse);
  };

  MovePlayer = () => {
    this.physicsBody = this._target.userData['physicsBody'];
    if (this.physicsBody) {
      let rotateY = 0;

      if (this._controller._keys.space) {
        this.Jump();
      }

      if (this._controller.moveDirection.left) {
        rotateY = 1;
      } else if (this._controller.moveDirection.right) {
        rotateY = -1;
      } else {
        rotateY = 0;
      }

      this.physicsBody.setAngularVelocity(new Ammo.btVector3(0, rotateY, 0));
      this.physicsBody.setAngularFactor(new Ammo.btVector3(0, 0, 0));

      if (this._controller._keys.shift && scalingFactor < 70) {
        scalingFactor++;
      } else if (scalingFactor > 35) {
        scalingFactor--;
      }

      // get position player looking
      let direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(this._target.quaternion);
      direction.normalize();

      let moveZ =
        this._controller.moveDirection.back -
        this._controller.moveDirection.forward;

      if (moveZ == 0) {
        return;
      }

      this.physicsBody.setLinearVelocity(
        new Ammo.btVector3(
          direction.x * moveZ * scalingFactor,
          0,
          direction.z * moveZ * scalingFactor
        )
      );
    }
  };

  Update(timeInSeconds: number) {
    if (!this._target) return;

    this._stateMachine.Update(timeInSeconds, this._controller);

    this.MovePlayer();
    this.manager._target = this._target.position;

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
}
