import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import { LoginModalComponent } from '../../ui/login-modal/login-modal.component';

import * as THREE from 'three';
import { BasicControllerInputService } from 'src/app/services/basic-controller-input.service';
import { FiniteStateMachineService } from 'src/app/services/finite-state-machine.service';
import { ManagerService } from 'src/app/services/manager.service';
import { PlayerService } from 'src/app/services/player.service';
import { PhysicsService } from 'src/app/services/physics.service';

declare const Ammo: any;

@Component({
  selector: 'app-player',
  template: '<ng-content></ng-content>',
})
export class PlayerComponent implements OnInit {
  private _animations: any = {};
  private _mixer!: THREE.AnimationMixer;

  private isGrounded = false;
  private isJumping = false;
  private physicsBody: any;
  private scalingFactor = 35;
  private username = 'Player';
  private player!: THREE.Object3D;

  cbContactResult: any;

  constructor(
    private manager: ManagerService,
    private controller: BasicControllerInputService,
    private playerService: PlayerService,
    private modalService: NgbModal,
    private stateMachineService: FiniteStateMachineService,
    private physicsService: PhysicsService
  ) {
    stateMachineService.SetProxy(this._animations);
  }

  async ngOnInit(): Promise<void> {
    if (environment.production) {
      this.username = await this.OpenModal();
    }

    await this.LoadModel();
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

  LoadModel = async () => {
    this.player = await this.playerService.newPlayer(this.username);
    this.manager._scene.add(this.player);

    this.Update(1 / 60);
    await this.LoadAnimations();
    this.manager.initialized = true;
    await this.AddPhysics();

    const meshGeometryBall = new THREE.SphereGeometry(20,20,20);
    const meshMaterialBall = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 0,
      specular: 0xffffff,
      flatShading: true,
    });

    const meshBall = new THREE.Mesh(meshGeometryBall, meshMaterialBall);
    meshBall.position.set(0, 0,-40);

    this.playerService.objectTest = meshBall;
    this.manager._scene.add(meshBall);
  };

  AddPhysics = async () => {
    const mass = 1;

    let pos = this.player.position.addScalar(2);
    let quat = this.player.quaternion;

    await this.physicsService.CreateObjectPhysics(
      this.player,
      pos,
      this.player.scale,
      quat,
      'Player',
      mass
    );
    this.physicsService.rigidBodies.push(this.player);

    this.SetupContactResultCallback();
  };

  LoadAnimations = async () => {
    this._mixer = new THREE.AnimationMixer(this.player);
    const animations = await this.playerService.getAnimations();

    const onLoad = (animName: any) => {
      const clip = animations[animName];
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
    onLoad('dance');
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

      this.stateMachineService.SetState('jump');

      setTimeout(() => {
        this.isJumping = false;
      }, 2000);
    }
  };

  MovePlayer = () => {
    if (!this.player?.userData['physicsBody']) return;

    this.physicsBody = this.player.userData['physicsBody'];
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
        this.player.rotation.x,
        this.player.rotation.y,
        this.player.rotation.z
      );

      this.playerService.updatePlayerPosition(this.player.position, rotation);

      this.physicsBody.setAngularVelocity(new Ammo.btVector3(0, rotateY, 0));
      this.physicsBody.setAngularFactor(new Ammo.btVector3(0, 0, 0));

      if (this.controller._keys.shift && this.scalingFactor < 70) {
        this.scalingFactor++;
      } else if (this.scalingFactor > 35) {
        this.scalingFactor--;
      }

      let direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(this.player.quaternion);
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
    if (this.player.userData) {
      this.isGrounded = this.player.userData['collision']?.tag == 'Ground';
    }
  };

  FollowCamera = () => {
    this.manager._camera.position.set(
      this.player.position.x,
      this.player.position.y,
      this.player.position.z
    );
    const cameraOffset = new THREE.Vector3(0.0, 60, 150);
    this.manager._camera.position.add(cameraOffset);
    this.manager._camera.lookAt(this.player.position);
  };

  Update(timeInSeconds: number) {
    requestAnimationFrame(() => {
      this.stateMachineService.Update(timeInSeconds, this.controller);

      this.MovePlayer();
      this.FollowCamera();

      if (this._mixer) {
        this._mixer.update(timeInSeconds);
      }

      if (this.physicsBody) {
        this.CheckContact();
        this.Collisions();
      }

      this.Update(timeInSeconds);
    });
  }

  CheckContact = async () => {
    const physicsWorld = await this.physicsService.getPhysicsWorld();
    physicsWorld.contactTest(
      this.player.userData['physicsBody'],
      this.cbContactResult
    );
  };

  SetupContactResultCallback = () => {
    this.cbContactResult = new Ammo.ConcreteContactResultCallback();

    this.cbContactResult.addSingleResult = (
      cp: any,
      colObj0Wrap: any,
      partId0: any,
      index0: any,
      colObj1Wrap: any,
      partId1: any,
      index1: any
    ) => {
      let contactPoint = Ammo.wrapPointer(cp, Ammo.btManifoldPoint);

      const distance = contactPoint.getDistance();

      if (distance > 0) return;

      let colWrapper1 = Ammo.wrapPointer(
        colObj1Wrap,
        Ammo.btCollisionObjectWrapper
      );
      let rb1 = Ammo.castObject(
        colWrapper1.getCollisionObject(),
        Ammo.btRigidBody
      );

      let threeObject1 = rb1.threeObject;

      let tag, localPos, worldPos;

      tag = threeObject1.userData.tag;
      localPos = contactPoint.get_m_localPointB();
      worldPos = contactPoint.get_m_positionWorldOnB();

      let localPosDisplay = {
        x: localPos.x(),
        y: localPos.y(),
        z: localPos.z(),
      };
      let worldPosDisplay = {
        x: worldPos.x(),
        y: worldPos.y(),
        z: worldPos.z(),
      };

      // console.log({ tag, localPosDisplay, worldPosDisplay });

      this.player.userData['collision'] = {
        tag,
        localPosDisplay,
        worldPosDisplay,
      };
    };
  };
}
