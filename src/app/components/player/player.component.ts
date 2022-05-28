import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import { LoginModalComponent } from '../../ui/login-modal/login-modal.component';

import * as THREE from 'three';
import { BasicControllerInputService } from 'src/app/services/basic-controller-input.service';
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
  private _mixer!: THREE.AnimationMixer;
  private _stateMachine!: FiniteStateMachineService;

  private isGrounded = false;
  private isJumping = false;
  private physicsBody: any;
  private scalingFactor = 35;
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
    if (!this.playerService.basePlayerObject) {
      setTimeout(() => {
        this.LoadModel();
      }, 100);
      return;
    }

    const player = this.playerService.newPlayer(this.username);
    this.manager._scene.add(player);
    player.name = '_Player';

    this.Update(1 / 60);
    this.LoadAnimations();
    this.manager.initialized = true;
  };

  LoadAnimations = () => {
    if (!this.playerService.playerObject) {
      setTimeout(() => {
        this.LoadAnimations();
      }, 100);
      return;
    }
    this._mixer = new THREE.AnimationMixer(this.playerService.playerObject);

    const onLoad = (animName: any) => {
      console.log(" animações carregadas",this.playerService.animations)
      const clip = this.playerService.animations[animName];
      const action = this._mixer.clipAction(clip);

      this._animations[animName] = {
        clip: clip,
        action: action,
      };
    };

    onLoad('walk');
    onLoad('run');
    onLoad('idle');
    onLoad('jump');

    this._stateMachine._Init();
  };

  Jump = () => {
    if (
      (this.physicsBody &&
        this.isGrounded &&
        this.physicsBody.getLinearVelocity().y() < 1 &&
        this.physicsBody.getLinearVelocity().y() > -1,
      !this.isJumping)
    ) {
      let jumpImpulse = new Ammo.btVector3(0, 50, 0);

      this.physicsBody.setLinearVelocity(jumpImpulse);
      this.isGrounded = false;
      this.isJumping = true;

      this._stateMachine.SetState('jump');

      setTimeout(() => {
        this.isJumping = false;
        this._stateMachine.SetState('idle');
      }, 2000);
    }
  };

  MovePlayer = () => {
    if (!this.playerService.playerObject?.userData['physicsBody']) return;

    this.physicsBody = this.playerService.playerObject.userData['physicsBody'];
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
        this.playerService.playerObject.rotation.x,
        this.playerService.playerObject.rotation.y,
        this.playerService.playerObject.rotation.z
      );

      this.playerService.updatePlayerPosition(
        this.playerService.playerObject.position,
        rotation
      );

      this.physicsBody.setAngularVelocity(new Ammo.btVector3(0, rotateY, 0));
      this.physicsBody.setAngularFactor(new Ammo.btVector3(0, 0, 0));

      if (this.controller._keys.shift && this.scalingFactor < 70) {
        this.scalingFactor++;
      } else if (this.scalingFactor > 35) {
        this.scalingFactor--;
      }

      let direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(this.playerService.playerObject.quaternion);
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
    if (this.playerService.playerObject.userData) {
      this.isGrounded =
        this.playerService.playerObject.userData['collision']?.tag == 'Ground';
    }
  };

  FollowCamera = () => {
    this.manager._camera.position.set(
      this.playerService.playerObject.position.x,
      this.playerService.playerObject.position.y,
      this.playerService.playerObject.position.z
    );
    const cameraOffset = new THREE.Vector3(0.0, 60, 150);
    this.manager._camera.position.add(cameraOffset);
    this.manager._camera.lookAt(this.playerService.playerObject.position);
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
