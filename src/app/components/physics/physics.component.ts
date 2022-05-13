import { Component, OnInit } from '@angular/core';
import { BasicControllerInputService } from 'src/app/services/basic-controller-input.service';
import { ManagerService } from 'src/app/services/manager.service';
import { AmmoPhysics } from '@enable3d/ammo-physics';
import * as THREE from 'three';

@Component({
  selector: 'app-physics',
  templateUrl: './physics.component.html',
  styleUrls: ['./physics.component.scss'],
})
export class PhysicsComponent implements OnInit {
  private _physicsWorld: any;
  rigidBodies: any = [];
  clock = new THREE.Clock();
  constructor(
    private manager: ManagerService,
    private controller: BasicControllerInputService
  ) {}

  ngOnInit(): void {
    let tmpTrans: any = null;
    let ballObject: any = null;
    const STATE = { DISABLE_DEACTIVATION: 4 };

    const setupPhysicsWorld = () => {
      const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
      dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
      overlappingPairCache = new Ammo.btDbvtBroadphase(),
      solver = new Ammo.btSequentialImpulseConstraintSolver();

      this._physicsWorld = new Ammo.btDiscreteDynamicsWorld(
        dispatcher,
        overlappingPairCache,
        solver,
        collisionConfiguration
      );
      this._physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
    };

    const renderPhysicsFrame = () => {
      const deltaTime = this.clock.getDelta();

      moveBall();
      updatePhysics(deltaTime);

      requestAnimationFrame(renderPhysicsFrame);
    };

    const createBlock = () => {
      const pos = { x: 0, y: 0, z: 0 };
      const scale = { x: 100, y: 2, z: 100 };
      const quat = { x: 0, y: 0, z: 0, w: 1 };
      const mass = 0;

      // threeJS Section
      const blockPlane = new THREE.Mesh(
        new THREE.BoxBufferGeometry(),
        new THREE.MeshPhongMaterial({ color: 0xa0afa4 })
      );

      blockPlane.position.set(pos.x, pos.y, pos.z);
      blockPlane.scale.set(scale.x, scale.y, scale.z);

      blockPlane.castShadow = true;
      blockPlane.receiveShadow = true;

      this.manager._scene.add(blockPlane);

      // Ammojs Section
      const transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      transform.setRotation(
        new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
      );
      const motionState = new Ammo.btDefaultMotionState(transform);

      const colShape = new Ammo.btBoxShape(
        new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5)
      );
      colShape.setMargin(0.05);

      const localInertia = new Ammo.btVector3(0, 0, 0);
      colShape.calculateLocalInertia(mass, localInertia);

      const rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        motionState,
        colShape,
        localInertia
      );
      const body = new Ammo.btRigidBody(rbInfo);

      body.setFriction(4);
      body.setRollingFriction(10);
      body.setActivationState(STATE.DISABLE_DEACTIVATION);

      this._physicsWorld.addRigidBody(body);
    };

    const createBall = () => {
      const pos = { x: 0, y: 15, z: 0 };
      const radius = 2;
      const quat = { x: 0, y: 0, z: 0, w: 1 };
      const mass = 1;

      // threeJS Section
      const ball = (ballObject = new THREE.Mesh(
        new THREE.SphereBufferGeometry(radius),
        new THREE.MeshPhongMaterial({ color: 0xff0505 })
      ));

      ball.name = 'Ball Player Physics';

      ball.position.set(pos.x, pos.y, pos.z);

      ball.castShadow = true;
      ball.receiveShadow = true;

      this.manager._scene.add(ball);

      // Ammojs Section
      const transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      transform.setRotation(
        new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
      );
      const motionState = new Ammo.btDefaultMotionState(transform);

      const colShape = new Ammo.btSphereShape(radius);
      colShape.setMargin(0.05);

      const localInertia = new Ammo.btVector3(0, 0, 0);
      colShape.calculateLocalInertia(mass, localInertia);

      const rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        motionState,
        colShape,
        localInertia
      );
      const body = new Ammo.btRigidBody(rbInfo);

      body.setFriction(4);
      body.setRollingFriction(10);

      this._physicsWorld.addRigidBody(body);

      ball.userData['physicsBody'] = body;
      this.rigidBodies.push(ball);
    };

    const moveBall = () => {
      const scalingFactor = 20;

      const moveX =
        this.controller.moveDirection.right -
        this.controller.moveDirection.left;
      const moveZ =
        this.controller.moveDirection.back -
        this.controller.moveDirection.forward;
      const moveY = this.controller.moveDirection.up;

      if (moveX == 0 && moveY == 0 && moveZ == 0) {
        return;
      }

      const resultantImpulse = new Ammo.btVector3(moveX, moveY, moveZ);
      resultantImpulse.op_mul(scalingFactor);

      const physicsBody = ballObject.userData.physicsBody;
      physicsBody.setLinearVelocity(resultantImpulse);
    };

    const updatePhysics = (deltaTime: any) => {
      // Step world
      this._physicsWorld.stepSimulation(deltaTime, 10);

      // Update rigid bodies
      for (let i = 0; i < this.rigidBodies.length; i++) {
        const objThree = this.rigidBodies[i];
        const objAmmo = objThree.userData.physicsBody;
        const ms = objAmmo.getMotionState();
        if (ms) {
          ms.getWorldTransform(tmpTrans);
          const p = tmpTrans.getOrigin();
          const q = tmpTrans.getRotation();
          objThree.position.set(p.x(), p.y(), p.z());
          objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
        }
      }
    };

    Ammo().then(() => {
      tmpTrans = new Ammo.btTransform();

      setupPhysicsWorld();

      createBlock();
      createBall();

      renderPhysicsFrame();

      return;
    });
  }
}
