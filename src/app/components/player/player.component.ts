import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BasicControllerInputService } from 'src/app/services/basic-controller-input.service';
import { FiniteStateMachineService } from 'src/app/services/finite-state-machine.service';
import { ManagerService } from 'src/app/services/manager.service';
import { PlayerService } from 'src/app/services/player.service';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { LoginModalComponent } from '../login-modal/login-modal.component';

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
  private _loadingManager = new THREE.LoadingManager();
  private _animations: any = {};
  private _controller: BasicControllerInputService;
  private _stateMachine: FiniteStateMachineService;
  private _player!: THREE.Object3D;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private physicsBody: any;
  private collision: any = {};
  private isGrounded = false;
  private randomUid =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  private username = '';

  private style = Math.floor(Math.random() * 4) + 1;

  constructor(
    private manager: ManagerService,
    controller: BasicControllerInputService,
    stateMachine: FiniteStateMachineService,
    private playerService: PlayerService,
    private modalService: NgbModal
  ) {
    this._controller = controller;
    this._stateMachine = stateMachine;
    this._stateMachine.SetProxy(new BasicControllerProxy(this._animations));
  }

  ngOnDestroy(): void {}

  async ngOnInit(): Promise<void> {
    this.username = await this.OpenModal();
    this.playerService.newPlayer(this.randomUid, this.username, this.style);
    this.LoadModel();
    this._controller._Init();
    this._stateMachine._Init();

    this.manager._renderer.domElement.addEventListener(
      'pointerdown',
      this.OnMouseDown,
      false
    );
  }

  async OpenModal(): Promise<string> {
    const modalRef = this.modalService.open(LoginModalComponent, {
      size: 'md',
      centered: true,
      windowClass: 'modal-login',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.name = 'wtf';
    return modalRef.result.then((result) => {
      return result;
    });
  }

  LoadModel = () => {
    const loader = new FBXLoader();
    loader.load(this.path, (object: THREE.Object3D) => {
      object.traverse((c: THREE.Object3D) => {
        if (c instanceof THREE.Mesh) {
          if (
            c.name == 'Face' + this.style ||
            c.name == 'Cloth' + this.style ||
            c.name == 'Hair' + this.style ||
            c.name == 'Glove' + this.style ||
            c.name == 'Shoe' + this.style ||
            c.name == 'ShoulderPad' + this.style
          ) {
            c.visible = true;
            c.material.displacementScale = 0.01;
            c.castShadow = true;
          } else {
            c.visible = false;
          }
          c.name = this.username;
        }
      });
      object.userData['tag'] = 'Player';

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
      newObject.visible = false;

      this.manager._scene.add(newObject);
      this._player = newObject;

      const labelDiv = document.createElement('div');
      labelDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
      labelDiv.style.padding = '2px';
      labelDiv.style.color = '#fff';
      labelDiv.style.fontSize = '12px';
      labelDiv.style.textAlign = 'center';
      labelDiv.style.borderRadius = '5px';
      labelDiv.style.display = 'block';
      labelDiv.innerHTML = this.username;


      const labelRenderer = new CSS2DObject(labelDiv);
      labelRenderer.position.set(
        newObject.position.x,
        newObject.position.y + 200,
        newObject.position.z
      );
      newObject.add(labelRenderer);

      this.LoadAnimations();
      this.Update(1 / 60);
    });
  };

  LoadAnimations = () => {
    this._mixer = new THREE.AnimationMixer(this._player);

    const onLoad = (animName: any, anim: any) => {
      const clip = anim.animations[0];
      const action = this._mixer.clipAction(clip);

      this._animations[animName] = {
        clip: clip,
        action: action,
      };

      this._player.visible = true;
    };

    this._loadingManager.onLoad = () => {
      this._stateMachine.SetState('idle');
    };

    const loader = new FBXLoader(this._loadingManager);
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
      // console.log(intersects[0].point);
      // console.log(intersects[0].object);
    }
  };

  Jump = () => {
    if (this._player && this.physicsBody && this.isGrounded) {
      let jumpImpulse = new Ammo.btVector3(0, 15, 0);

      this.physicsBody.setLinearVelocity(jumpImpulse);
    }
  };

  MovePlayer = () => {
    if (!this._player?.userData['physicsBody']) return;

    this.physicsBody = this._player.userData['physicsBody'];
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
        this._player.rotation.x,
        this._player.rotation.y,
        this._player.rotation.z
      );

      this.playerService.updatePlayerPosition(
        this.randomUid,
        this._player.position,
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
      direction.applyQuaternion(this._player.quaternion);
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
    if (this._player.userData) {
      this.collision = this._player.userData['collision'];
      if (this.collision) {
        this.isGrounded = this.collision.tag == 'Ground';
      }
    }
  };

  Update(timeInSeconds: number) {
    requestAnimationFrame(() => {
      if (!this._player) return;

      this._stateMachine.Update(timeInSeconds, this._controller);

      this.Collisions();
      this.MovePlayer();
      this.manager._player = this._player.position;

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
