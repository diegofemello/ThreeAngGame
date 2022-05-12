import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'dat.gui';
import { Vector3 } from 'three';

@Injectable({
  providedIn: 'root',
})
export class ManagerService {
  _threejs: any;
  _camera: any;
  _scene: any;
  // _particles: ParticleSystem;
  _previousRAF: any;
  _gui: any;
  tanFOV: any;
  windowHeight: any = window.innerHeight;
  _target?: Vector3;
  _physicsWorld: any;
  constructor() {}

  _Initialize() {

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x101015);

    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener(
      'resize',
      () => {
        this._OnWindowResize();
      },
      false
    );

    // AMBIENT LIGHT
    this._scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // DIRECTIONAL LIGHT
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.x += 180;
    dirLight.position.y += 180;
    dirLight.position.z += 0;
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    const d = 25;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.position.y = 60;
    dirLight.position.z = 50;

    let target = new THREE.Object3D();
    target.position.z = -20;
    dirLight.target = target;
    dirLight.target.updateMatrixWorld();

    dirLight.shadow.camera.lookAt(0, 180, -30);
    this._scene.add(dirLight);

    const fov = 80;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(0, 80, 200);

    // const controls = new OrbitControls(this._camera, this._threejs.domElement);
    // controls.target.set(0, 0, 0);
    // controls.update();

    this._gui = new GUI({ width: 250 });
    this._gui.domElement.id = 'gui';

    // this._particles = new ParticleSystem(this);

    this._previousRAF = null;
    this._RAF();
    this._OnWindowResize();
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();

    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed: number) {
    // const timeElapsedS = timeElapsed * 0.001;
    if (this._target) {
      this._camera.position.set(this._target.x, this._target.y, this._target.z);
      const cameraOffset = new Vector3(0.0, 5, 150); // NOTE Constant offset between the camera and the target
      this._camera.position.add(cameraOffset);
      this._camera.lookAt(this._target);
    }
    // this._particles.Step(timeElapsedS);
  }
}
