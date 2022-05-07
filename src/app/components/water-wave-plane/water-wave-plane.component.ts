import { Component, OnInit } from '@angular/core';
import { ManagerService } from 'src/app/services/manager.service';
import * as THREE from 'three';

@Component({
  selector: 'app-water-wave-plane',
  templateUrl: './water-wave-plane.component.html',
  styleUrls: ['./water-wave-plane.component.scss']
})
export class WaterWavePlaneComponent implements OnInit {

  constructor(private manager:ManagerService) { }

  ngOnInit(): void {
    // SCENE
  const scene = this.manager._scene;

  // TEXTURES
  const textureLoader = new THREE.TextureLoader();

  const waterBaseColor = textureLoader.load(
    "assets/textures/water/Water_002_COLOR.jpg"
  );
  const waterNormalMap = textureLoader.load(
    "assets/textures/water/Water_002_NORM.jpg"
  );
  const waterHeightMap = textureLoader.load(
    "assets/textures/water/Water_002_DISP.png"
  );
  const waterRoughness = textureLoader.load(
    "assets/textures/water/Water_002_ROUGH.jpg"
  );
  const waterAmbientOcclusion = textureLoader.load(
    "assets/textures/water/Water_002_OCC.jpg"
  );

  // PLANE
  const WIDTH = 30;
  const HEIGHT = 30;
  const geometry = new THREE.PlaneBufferGeometry(WIDTH, HEIGHT, 200, 200);
  const plane = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      map: waterBaseColor,
      normalMap: waterNormalMap,
      displacementMap: waterHeightMap,
      displacementScale: 0.01,
      roughnessMap: waterRoughness,
      roughness: 0,
      aoMap: waterAmbientOcclusion,
    })
  );
  plane.receiveShadow = true;
  plane.castShadow = true;
  plane.rotation.x = -Math.PI / 2;
  plane.position.z = 100;
  plane.position.y = -50;
  scene.add(plane);

  const count: number = geometry.attributes['position'].count;
  const damping = 0.25;
  // ANIMATE
  function animate() {
    // SINE WAVE
    const now_slow = Date.now() / 400;
    for (let i = 0; i < count; i++) {
      const x = geometry.attributes['position'].getX(i);
      const y = geometry.attributes['position'].getY(i);

      const xangle = x + now_slow;
      const xsin = Math.sin(xangle) * damping;
      const yangle = y + now_slow;
      const ycos = Math.cos(yangle) * damping;

      geometry.attributes['position'].setZ(i, xsin + ycos);
    }
    geometry.computeVertexNormals();
    geometry.attributes['position'].needsUpdate = true;

    requestAnimationFrame(animate);
  }
  animate();
  }

}
