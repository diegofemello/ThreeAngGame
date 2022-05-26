import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import { LoginModalComponent } from '../../ui/login-modal/login-modal.component';

import * as THREE from 'three';
import { BasicControllerInputService } from 'src/app/services/basic-controller-input.service';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { FiniteStateMachineService } from 'src/app/services/finite-state-machine.service';
import { ManagerService } from 'src/app/services/manager.service';
import { PlayerService } from 'src/app/services/player.service';

declare const Ammo: any;

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements OnInit {
  private _animations: any = {};
  private _loadingManager!: THREE.LoadingManager;
  private _mixer!: THREE.AnimationMixer;
  private _player!: THREE.Object3D;
  private _stateMachine!: FiniteStateMachineService;

  private isGrounded = false;
  private path = './assets/models3d/CharacterRPG/CharacterBaseMesh.fbx';
  private physicsBody: any;
  private scale = 0.2;
  private scalingFactor = 35;
  private style = Math.floor(Math.random() * 4) + 1;
  private username = 'Diego';

  constructor(
    private manager: ManagerService,
    private controller: BasicControllerInputService,
    private playerService: PlayerService,
    private modalService: NgbModal,
    private stateMachineService: FiniteStateMachineService
  ) {
    this._stateMachine = this.stateMachineService;
    this._stateMachine.SetProxy(this._animations);
  }

  async ngOnInit(): Promise<void> {
    if (environment.production) {
      this.username = await this.OpenModal();
    }

    this.LoadModel();
    this.controller._Init();
    this._stateMachine._Init();
  }

  async OpenModal(): Promise<string> {
    const modalRef = this.modalService.open(LoginModalComponent, {
      size: 'md',
      centered: true,
      windowClass: 'modal-login',
      backdrop: 'static',
      keyboard: false,
    });
    return await modalRef.result;
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

      this.manager._scene.add(object);
      object.name = '_Player';

      object.scale.multiplyScalar(this.scale);
      object.visible = false;

      this._player = object;
      object.visible = true;
      this.manager.initialized = true;

      this.playerService.newPlayer(this.username, this.style);

      this.LoadAnimations();
      this.Update(1 / 60);
    });
  };

  LoadAnimations = () => {
    this._loadingManager = new THREE.LoadingManager();
    this._mixer = new THREE.AnimationMixer(this._player);

    const onLoad = (animName: any, anim: any) => {
      const clip = anim.animations[0];
      const action = this._mixer.clipAction(clip);

      this._animations[animName] = {
        clip: clip,
        action: action,
      };
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

  Jump = () => {
    if (this._player && this.physicsBody && this.isGrounded) {
      let jumpImpulse = new Ammo.btVector3(0, 50, 0);

      this.physicsBody.setLinearVelocity(jumpImpulse);
      this.isGrounded = false;
    }
  };

  MovePlayer = () => {
    if (!this._player?.userData['physicsBody']) return;

    this.physicsBody = this._player.userData['physicsBody'];
    if (this.physicsBody) {
      let rotateY = 0;

      if (this.controller._keys.space) {
        this.Jump();
      }

      if (this.controller.moveDirection.left) {
        rotateY = 1;
      } else if (this.controller.moveDirection.right) {
        rotateY = -1;
      } else {
        rotateY = 0;
      }

      const rotation = new THREE.Vector3(
        this._player.rotation.x,
        this._player.rotation.y,
        this._player.rotation.z
      );

      this.playerService.updatePlayerPosition(this._player.position, rotation);

      this.physicsBody.setAngularVelocity(new Ammo.btVector3(0, rotateY, 0));
      this.physicsBody.setAngularFactor(new Ammo.btVector3(0, 0, 0));

      if (this.controller._keys.shift && this.scalingFactor < 70) {
        this.scalingFactor++;
      } else if (this.scalingFactor > 35) {
        this.scalingFactor--;
      }

      let direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(this._player.quaternion);
      direction.normalize();

      let moveZ =
        this.controller.moveDirection.back -
        this.controller.moveDirection.forward;

      if (moveZ == 0) {
        return;
      }

      this.physicsBody.setLinearVelocity(
        new Ammo.btVector3(
          direction.x * moveZ * this.scalingFactor,
          this.physicsBody.getLinearVelocity().y(),
          direction.z * moveZ * this.scalingFactor
        )
      );
    }
  };

  Collisions = () => {
    if (this._player.userData) {
      this.isGrounded = this._player.userData['collision']?.tag == 'Ground';
    }
  };

  FollowCamera = () => {
    this.manager._camera.position.set(
      this._player.position.x,
      this._player.position.y,
      this._player.position.z
    );
    const cameraOffset = new THREE.Vector3(0.0, 60, 150);
    this.manager._camera.position.add(cameraOffset);
    this.manager._camera.lookAt(this._player.position);
  };

  Update(timeInSeconds: number) {
    requestAnimationFrame(() => {
      this._stateMachine.Update(timeInSeconds, this.controller);

      this.Collisions();
      this.MovePlayer();
      this.FollowCamera();

      if (this._mixer) {
        this._mixer.update(timeInSeconds);
      }

      this.Update(timeInSeconds);
    });
  }
}
