import { Component, OnInit } from '@angular/core';
import { ManagerService } from 'src/app/services/manager.service';
import * as THREE from 'three';
declare const Ammo: any;

const STATE = { DISABLE_DEACTIVATION: 4 };

@Component({
  selector: 'app-physics',
  templateUrl: './physics.component.html',
  styleUrls: ['./physics.component.scss'],
})
export class PhysicsComponent implements OnInit {
  private _physicsWorld: any;
  private _transformAux1: any;
  private rigidBodies: any = [];
  private _player: any;

  private cbContactResult: any;

  constructor(private manager: ManagerService) {}

  ngOnInit(): void {
    Ammo().then(() => {
      this._transformAux1 = new Ammo.btTransform();

      this.SetupPhysicsWorld();
      this.CreateFloorTiles();

      this.CreatePlayer();

      this.AddCollisionToGroundMesh();

      this.SetupContactResultCallback();

      this.Update(1 / 60);

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

  CreateObjectPhysics = (
    object: THREE.Object3D,
    pos = new THREE.Vector3(),
    scale = new THREE.Vector3(1, 1, 1),
    quat = new THREE.Quaternion(),
    tag = '',
    mass = 0,
    friction = 0.5,
    restitution = 0.5
  ) => {
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

    this._physicsWorld.addRigidBody(body);
    object.userData = {
      physicsBody: body,
      tag: tag,
    };
    body.threeObject = object;
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

  AddCollisionToGroundMesh = () => {
    let groundMesh = this.manager._scene.getObjectByName('Ground');

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

  CreatePlayer = () => {
    const mass = 1;
    const player = this.manager._scene.getObjectByName('Player');
    if (player) {
      let pos = player.position.addScalar(2);
      let quat = player.quaternion;

      this.CreateObjectPhysics(player, pos, player.scale, quat, 'Player', mass);

      this.rigidBodies.push(player);
      this._player = player;
    }
  };

  CheckContact = () => {
    // if (this._player.userData['physicsBody']) {
    //   this._physicsWorld.contactTest(
    //     this._player.userData['physicsBody'],
    //     this.cbContactResult
    //   );
    // }
  };

  UpdatePhysics = (deltaTime: any) => {
    this._physicsWorld.stepSimulation(deltaTime, 10);

    for (let i = 0; i < this.rigidBodies.length; i++) {
      let objThree = this.rigidBodies[i];
      let objAmmo = objThree?.userData['physicsBody'];

      if (objAmmo) {
        let ms = objAmmo.getMotionState();
        if (ms) {
          ms.getWorldTransform(this._transformAux1);
          let p = this._transformAux1.getOrigin();
          let q = this._transformAux1.getRotation();
          objThree.position.set(p.x(), p.y(), p.z());
          objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
        }
      }
    }
  };

  Update(timeInSeconds: number) {
    requestAnimationFrame(() => {
      console.log('renderframe', this._player);

      if (this._player?.userData['physicsBody']) {
        this.UpdatePhysics(timeInSeconds);
        this.CheckContact();
      }

      this.Update(timeInSeconds);
    });
  }

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

      // this._player.userData['collision'] = {
      //   tag,
      //   localPosDisplay,
      //   worldPosDisplay,
      // };
    };
  };
}
