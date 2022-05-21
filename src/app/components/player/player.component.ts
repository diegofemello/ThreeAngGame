import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { BasicControllerInputService } from 'src/app/services/basic-controller-input.service';
import { FiniteStateMachineService } from 'src/app/services/finite-state-machine.service';
import { ManagerService } from 'src/app/services/manager.service';
import { PlayerService } from 'src/app/services/player.service';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

declare const Ammo: any;

let scalingFactor = 35;
let interval: any;

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements OnInit, OnDestroy {
  @Input() positionX = 0;
  @Input() positionY = 0;
  @Input() positionZ = 0;
  @Input() rotationX = 0;
  @Input() rotationY = 0;
  @Input() rotationZ = 0;
  @Input() scale = 0.2;
  @Input() path!: string;
  @Input() name = 'Player';
  @Input() gender: 'male' | 'female' = 'male';

  private _mixer!: THREE.AnimationMixer;
  private _loadingManager!: THREE.LoadingManager;
  private _animations: any = {};
  private _controller: BasicControllerInputService;
  private _stateMachine: FiniteStateMachineService;
  private _target!: THREE.Object3D;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private physicsBody: any;
  // private collision: any = {};
  // private isGrounded = false;
  private randomUid =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  constructor(
    private manager: ManagerService,
    controller: BasicControllerInputService,
    stateMachine: FiniteStateMachineService,
    private playerService: PlayerService
  ) {
    this._controller = controller;
    this._stateMachine = stateMachine;
    this._stateMachine.SetProxy(new BasicControllerProxy(this._animations));
  }

  ngOnDestroy(): void {}

  ngOnInit(): void {
    this.playerService.newPlayer(this.randomUid);
    this._controller._Init();
    this._stateMachine._Init();

    this.manager._renderer.domElement.addEventListener(
      'pointerdown',
      this.OnMouseDown,
      false
    );

    this.LoadModel();
  }

  LoadModel = () => {
    const loader = new FBXLoader();
    loader.load(this.path, (object: THREE.Object3D) => {
      object.traverse((c: THREE.Object3D) => {
        if (this.gender == 'female') {
          if (c.name == 'Head01' || c.name == 'Body01') c.visible = false;
        } else {
          if (c.name == 'Head02' || c.name == 'Body02') c.visible = false;
        }

        if (c instanceof THREE.Mesh) {
          c.material.displacementScale = 0.01;
          c.castShadow = true;
          c.name = this.name;
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
      newObject.visible = true;

      this.manager._scene.add(newObject);
      this._target = newObject;

      this.LoadAnimations();
    });
  };

  LoadAnimations = () => {
    const onLoad = (animName: any, anim: any) => {
      const clip = anim.animations[0];
      const action = this._mixer.clipAction(clip);

      this._animations[animName] = {
        clip: clip,
        action: action,
      };
    };

    this._mixer = new THREE.AnimationMixer(this._target);
    this._loadingManager = new THREE.LoadingManager();
    this._loadingManager.onLoad = () => {
      this._stateMachine.SetState('idle');
    };

    const loader = new FBXLoader(this._loadingManager);
    loader.setPath('./assets/models3d/DefaultCharacter/animations/');
    loader.load('walk.fbx', (a) => {
      onLoad('walk', a);
    });
    loader.load('run.fbx', (a) => {
      onLoad('run', a);
    });
    loader.load('idle.fbx', (a) => {
      onLoad('idle', a);
    });
    loader.load('dance.fbx', (a) => {
      onLoad('dance', a);
    });

    this.Update(1 / 60);
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
      console.log(intersects[0].point);
      console.log(intersects[0].object);
    }
  };

  Jump = () => {
    if (this._target && this.physicsBody) {
      let jumpImpulse = new Ammo.btVector3(0, 15, 0);

      this.physicsBody.setLinearVelocity(jumpImpulse);
    }
  };

  MovePlayer = () => {
    if (!this?._target?.userData['physicsBody']) return;

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

      const rotation = new THREE.Vector3(
        this._target.rotation.x,
        this._target.rotation.y,
        this._target.rotation.z
      );

      this.playerService.updatePlayerPosition(
        this.randomUid,
        this._target.position,
        rotation
      );

      this.physicsBody.setAngularVelocity(new Ammo.btVector3(0, rotateY, 0));
      this.physicsBody.setAngularFactor(new Ammo.btVector3(0, 0, 0));

      if (this._controller._keys.shift && scalingFactor < 70) {
        scalingFactor++;
      } else if (scalingFactor > 35) {
        scalingFactor--;
      }

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

  Collisions = () => {
    // if (this._target.userData) {
    //   this.collision = this._target.userData['collision'];
    //   if (this.collision) {
    //     this.isGrounded = this.collision.tag == 'Ground';
    //   }
    // }
  };

  Update(timeInSeconds: number) {
    requestAnimationFrame(() => {
      if (!this._target) return;

      this._stateMachine.Update(timeInSeconds, this._controller);

      this.Collisions();
      this.MovePlayer();
      this.manager._target = this._target.position;

      if (this._mixer) {
        this._mixer.update(timeInSeconds);
      }

      this.Update(timeInSeconds);
    });
  }
}

export class BasicControllerProxy {
  _animations: any;
  constructor(animations: any) {
    this._animations = animations;
  }
}
