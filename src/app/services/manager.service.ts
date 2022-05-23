import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { Vector3 } from 'three';

@Injectable({
  providedIn: 'root',
})
export class ManagerService {
  public _renderer!: THREE.WebGLRenderer;
  public _camera!: THREE.PerspectiveCamera;
  public _scene!: THREE.Scene;
  public _gui!: GUI;
  public _player?: Vector3;
  public initialized = false;

  _Initialize() {
    console.log();
    this._SetupGraphics();
    window.addEventListener(
      'resize',
      () => {
        this._OnWindowResize();
      },
      false
    );

    this._OnWindowResize();

    this._gui = new GUI({ width: 250 });
    this._gui.domElement.id = 'gui';

    this._Animate();
  }

  _SetupGraphics = () => {
    // create the scene
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x101015);

    // create the camera
    const fov = 80;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(0, 80, 200);

    // Add hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.1);
    hemiLight.color.setHSL(0.6, 0.6, 0.6);
    hemiLight.groundColor.setHSL(0.1, 1, 0.4);
    hemiLight.position.set(0, 50, 0);
    this._scene.add(hemiLight);

    // DIRECTIONAL LIGHT
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.x += 180;
    dirLight.position.y += 180;
    dirLight.position.z += 0;
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;

    // AMBIENT LIGHT
    this._scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const d = 50;
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

    // Setup the renderer
    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this._renderer.setClearColor(0xbfd1e5);
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(window.innerWidth, window.innerHeight);

    this._renderer.shadowMap.enabled = true;

    document.body.appendChild(this._renderer.domElement);
  };

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();

    this._renderer.setSize(window.innerWidth, window.innerHeight);
  }

  _Animate() {
    requestAnimationFrame((t) => {
      this._renderer.render(this._scene, this._camera);
      this._Step();
      this._Animate();
      this._scene.visible = this.initialized;
    });
  }

  _Step() {
    if (this._player) {
      this._camera.position.set(this._player.x, this._player.y, this._player.z);
      const cameraOffset = new Vector3(0.0, 60, 150); // NOTE Constant offset between the camera and the target
      this._camera.position.add(cameraOffset);
      this._camera.lookAt(this._player);
    }
  }
}
