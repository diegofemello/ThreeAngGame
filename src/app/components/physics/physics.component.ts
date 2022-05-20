import { Component, OnInit } from '@angular/core';
import { BasicControllerInputService } from 'src/app/services/basic-controller-input.service';
import { ManagerService } from 'src/app/services/manager.service';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as THREE from 'three';
declare const Ammo: any;

const STATE = { DISABLE_DEACTIVATION: 4 };
let cbContactResult: any;
// let tmpTrans: any = null;

@Component({
  selector: 'app-physics',
  templateUrl: './physics.component.html',
  styleUrls: ['./physics.component.scss'],
})
export class PhysicsComponent implements OnInit {
  private _physicsWorld: any;
  private _transformAux1: any;
  private rigidBodies: any = [];
  private clock = new THREE.Clock();

  constructor(
    private manager: ManagerService,
    private controller: BasicControllerInputService
  ) {}

  ngOnInit(): void {
    Ammo().then(() => {
      this._transformAux1 = new Ammo.btTransform();

      this.SetupPhysicsWorld();
      this.CreateFloorTiles();

      this.CreatePlayer();

      this.AddCollisionToGroundMesh();

      this.RenderPhysicsFrame();

      return;
    });
  }

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
    this._physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
  };

  CreateFloorTiles = () => {
    let tiles = [
      { name: 'yellow', color: 0xffff00, pos: { x: -20, y: 0, z: 20 } },
      { name: 'red', color: 0xff0000, pos: { x: 20, y: 0, z: 20 } },
      { name: 'green', color: 0x008000, pos: { x: 20, y: 0, z: -20 } },
      { name: 'blue', color: 0x0000ff, pos: { x: -20, y: 0, z: -20 } },
    ];

    let scale = { x: 40, y: 6, z: 40 };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0;

    for (const tile of tiles) {
      //threeJS Section
      let pos = tile.pos;
      let mesh = new THREE.Mesh(
        new THREE.BoxBufferGeometry(),
        new THREE.MeshPhongMaterial({ color: tile.color })
      );

      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.scale.set(scale.x, scale.y, scale.z);

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      mesh.userData['tag'] = tile.name;
      mesh.name = 'Tile ' + tile.name;

      this.manager._scene.add(mesh);

      //Ammojs Section
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
      colShape.setMargin(0.05);

      let localInertia = new Ammo.btVector3(0, 0, 0);
      colShape.calculateLocalInertia(mass, localInertia);

      let rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        motionState,
        colShape,
        localInertia
      );
      let body = new Ammo.btRigidBody(rbInfo);

      body.setFriction(4);
      body.setRollingFriction(10);

      this._physicsWorld.addRigidBody(body);

      body.threeObject = mesh;

      if (tile.name == 'red') {
        mesh.userData['physicsBody'] = body;
      }
    }
  };

  AddCollisionToGroundMesh = () => {
    let groundMesh = this.manager._scene.getObjectByName('Ground');

    if (groundMesh) {
      // get dimensions of the ground mesh
      let box3 = new THREE.Box3().setFromObject(groundMesh);
      let size = new THREE.Vector3();
      box3.getSize(size);

      let transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(0, -size.y * 0.5, 0));
      transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));

      let motionState = new Ammo.btDefaultMotionState(transform);

      let colShape = new Ammo.btBoxShape(
        new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5)
      );
      colShape.setMargin(0.05);

      let localInertia = new Ammo.btVector3(0, 0, 0);
      colShape.calculateLocalInertia(0, localInertia);

      let rbInfo = new Ammo.btRigidBodyConstructionInfo(
        0,
        motionState,
        colShape,
        localInertia
      );

      let body = new Ammo.btRigidBody(rbInfo);

      body.setFriction(4);
      body.setRollingFriction(10);

      this._physicsWorld.addRigidBody(body);

      body.threeObject = groundMesh;
    }
  };

  CreatePlayer = () => {
    const mass = 1;
    const player = this.manager._scene.getObjectByName('Player');
    if (player) {
      let pos = player.position.addScalar(2);
      let quat = player.quaternion;

      //Ammojs Section
      let transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      transform.setRotation(
        new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
      );

      let motionState = new Ammo.btDefaultMotionState(transform);

      let colShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1));
      colShape.setMargin(0);

      let localInertia = new Ammo.btVector3(0, 0, 0);
      colShape.calculateLocalInertia(mass, localInertia);

      let rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        motionState,
        colShape,
        localInertia
      );

      let body = new Ammo.btRigidBody(rbInfo);

      body.setFriction(4);
      body.setRollingFriction(10);

      body.setActivationState(STATE.DISABLE_DEACTIVATION);

      this._physicsWorld.addRigidBody(body);
      this.rigidBodies.push(player);
      player.userData['physicsBody'] = body;
    }
  };

  UpdatePhysics = (deltaTime: any) => {
    // Step world
    this._physicsWorld.stepSimulation(deltaTime, 10);

    for (let i = 0; i < this.rigidBodies.length; i++) {
      let objThree = this.rigidBodies[i];
      let objAmmo = objThree.userData['physicsBody'];

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

  RenderPhysicsFrame = () => {
    let deltaTime = this.clock.getDelta();

    this.UpdatePhysics(deltaTime);

    requestAnimationFrame(this.RenderPhysicsFrame);
  };
}
