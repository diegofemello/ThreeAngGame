import { Injectable, OnInit } from '@angular/core';

import * as THREE from 'three';
import { ManagerService } from './manager.service';

declare const Ammo: any;

const STATE = { DISABLE_DEACTIVATION: 4 };

@Injectable({
  providedIn: 'root',
})
export class PhysicsService {
  private _physicsWorld: any;
  private _transformAux1: any;
  rigidBodies: any = [];

  constructor(private manager: ManagerService) {
    this._Init();
  }

  _Init(): void {
    Ammo().then(async () => {
      this._transformAux1 = new Ammo.btTransform();

      this.SetupPhysicsWorld();
      // this.CreateFloorTiles();

      this.AddCollisionToGroundMesh();

      // this.CreateGround();

      this.Update(1 / 60);

      return;
    });
  }

  async getPhysicsWorld(): Promise<any> {
    if (this._physicsWorld) {
      return new Promise((resolve) => {
        resolve(this._physicsWorld);
      });
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.getPhysicsWorld());
        }, 500);
      });
    }
  }

  CreateObjectPhysics = async (
    object: THREE.Object3D,
    pos = new THREE.Vector3(),
    scale = new THREE.Vector3(1, 1, 1),
    quat = new THREE.Quaternion(),
    tag = '',
    mass = 0,
    friction = 0.5,
    restitution = 0.5
  ) => {
    const physiscsWorld = await this.getPhysicsWorld();

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );

    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btBoxShape(
      new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5)
    );
    colShape.setMargin(0.5);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colShape,
      localInertia
    );
    let body = new Ammo.btRigidBody(rbInfo);
    body.setFriction(friction);
    body.setRestitution(restitution);

    body.setFriction(4);
    body.setRollingFriction(10);
    body.setActivationState(STATE.DISABLE_DEACTIVATION);

    physiscsWorld.addRigidBody(body);
    object.userData = {
      physicsBody: body,
      tag: tag,
    };
    body.threeObject = object;
  };

  SetupPhysicsWorld = () => {
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
      dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
      overlappingPairCache = new Ammo.btDbvtBroadphase(),
      solver = new Ammo.btSequentialImpulseConstraintSolver();

    this._physicsWorld = new Ammo.btDiscreteDynamicsWorld(
      dispatcher,
      overlappingPairCache,
      solver,
      collisionConfiguration
    );
    this._physicsWorld.setGravity(new Ammo.btVector3(0, -50, 0));
  };

  CreateFloorTiles = () => {
    let tiles = [
      { name: 'yellow', color: 0xffff00, pos: new THREE.Vector3(-20, 0, 20) },
      { name: 'red', color: 0xff0000, pos: new THREE.Vector3(20, 0, 20) },
      { name: 'green', color: 0x008000, pos: new THREE.Vector3(20, 0, -20) },
      { name: 'blue', color: 0x0000ff, pos: new THREE.Vector3(-20, 0, -20) },
    ];

    let scale = new THREE.Vector3(40, 6, 40);
    let quat = new THREE.Quaternion(0, 0, 0, 1);
    let mass = 0;

    for (const tile of tiles) {
      let pos = tile.pos;
      let mesh = new THREE.Mesh(
        new THREE.BoxBufferGeometry(),
        new THREE.MeshPhongMaterial({ color: tile.color })
      );

      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.scale.set(scale.x, scale.y, scale.z);

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      mesh.name = 'Tile ' + tile.name;

      this.manager._scene.add(mesh);

      this.CreateObjectPhysics(mesh, pos, scale, quat, tile.name, mass);
    }
  };

  CreateGround = () => {
    let scale = new THREE.Vector3(1500, 6, 1500);
    let quat = new THREE.Quaternion(0, 0, 0, 1);
    let mass = 0;

    let mesh = new THREE.Mesh(
      new THREE.BoxBufferGeometry(),
      new THREE.MeshPhongMaterial({ color: 0x00ffaa })
    );

    mesh.position.set(0, -6, 0);
    mesh.scale.set(scale.x, scale.y, scale.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.name = 'Ground';

    this.manager._scene.add(mesh);

    this.CreateObjectPhysics(
      mesh,
      new THREE.Vector3(0, 0, 0),
      scale,
      quat,
      'ground',
      mass
    );
  };

  AddCollisionToGroundMesh = () => {
    let groundMesh = this.manager._scene.getObjectByName('_Ground');

    if (!groundMesh) {
      setTimeout(() => {
        this.AddCollisionToGroundMesh();
      }, 100);
      return;
    }

    if (groundMesh) {
      let box3 = new THREE.Box3().setFromObject(groundMesh);
      let size = new THREE.Vector3();
      box3.getSize(size);

      this.CreateObjectPhysics(
        groundMesh,
        new THREE.Vector3(0, -size.y * 0.5, 0),
        size,
        new THREE.Quaternion(0, 0, 0, 1),
        'Ground',
        0,
        0.5,
        0.5
      );
    }
  };

  UpdatePhysics = (deltaTime: any) => {
    this._physicsWorld.stepSimulation(deltaTime, 10);

    for (let i = 0; i < this.rigidBodies.length; i++) {
      let objThree = this.rigidBodies[i];
      let objAmmo = objThree?.userData['physicsBody'];

      let ms = objAmmo.getMotionState();
      if (ms) {
        ms.getWorldTransform(this._transformAux1);
        let p = this._transformAux1.getOrigin();
        let q = this._transformAux1.getRotation();
        objThree.position.set(p.x(), p.y(), p.z());
        objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
      }
    }
  };

  Update(timeInSeconds: number) {
    requestAnimationFrame(() => {
      this.UpdatePhysics(timeInSeconds);
      this.Update(timeInSeconds);
    });
  }
}
