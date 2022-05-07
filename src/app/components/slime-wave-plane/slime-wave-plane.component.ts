import { Component, OnInit } from '@angular/core';
import { ManagerService } from 'src/app/services/manager.service';
import * as THREE from 'three';

@Component({
  selector: 'app-slime-wave-plane',
  templateUrl: './slime-wave-plane.component.html',
  styleUrls: ['./slime-wave-plane.component.scss']
})
export class SlimeWavePlaneComponent implements OnInit {

  constructor(private manager: ManagerService) { }

  ngOnInit(): void {
    const scene = this.manager._scene;

  // TEXTURES
  const textureLoader = new THREE.TextureLoader();

  const slimeBaseColor = textureLoader.load(
    "assets/textures/slime/alien-slime1-albedo.png"
  );
  const slimeNormalMap = textureLoader.load(
    "assets/textures/slime/alien-slime1-normal-ogl.png"
  );
  const slimeHeightMap = textureLoader.load(
    "assets/textures/slime/alien-slime1-height.png"
  );
  const slimeRoughness = textureLoader.load(
    "assets/textures/slime/alien-slime1-roughness.png"
  );
  const slimeAmbientOcclusion = textureLoader.load(
    "assets/textures/slime/alien-slime1-ao.png"
  );

  // PLANE
  const geometry = new THREE.PlaneBufferGeometry(30, 30, 200, 200);
  const plane = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      map: slimeBaseColor,
      normalMap: slimeNormalMap,
      displacementMap: slimeHeightMap,
      displacementScale: 0.01,
      roughnessMap: slimeRoughness,
      roughness: 0,
      aoMap: slimeAmbientOcclusion,
    })
  );
  plane.receiveShadow = true;
  plane.castShadow = true;
  plane.rotation.x = -Math.PI / 2;
  plane.position.z = 50;
  plane.position.y = -50;
  scene.add(plane);

  const count: number = geometry.attributes['position'].count;
  const damping = 0.75;

  // ANIMATE
  function animate() {
    // SINE WAVE
    const now = Date.now() / 400;
    for (let i = 0; i < count; i++) {
      const x = geometry.attributes['position'].getX(i);
      const y = geometry.attributes['position'].getY(i);

      const xangle = x + now;
      const xsin = Math.sin(xangle) * damping;
      const yangle = y + now;
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
