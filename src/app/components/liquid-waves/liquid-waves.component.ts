import { Component, OnInit } from '@angular/core';
import { ManagerService } from 'src/app/services/manager.service';
import * as THREE from 'three';

@Component({
  selector: 'app-liquid-waves',
  templateUrl: './liquid-waves.component.html',
  styleUrls: ['./liquid-waves.component.scss']
})
export class LiquidWavesComponent implements OnInit {
  private cilinder!: THREE.Mesh;

  constructor(private manager: ManagerService) { }

  ngOnInit(): void {
    const scene = this.manager._scene;

  // TEXTURES

  const mesh = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  mesh.color = new THREE.Color(0xff5500);

  // PLANE
  const geometry = new THREE.CylinderGeometry(5, 5, 20, 32);
  this.cilinder = new THREE.Mesh(geometry, mesh);

  this.cilinder.receiveShadow = true;
  this.cilinder.castShadow = true;
  // cilinder.rotation.x = - Math.PI / 4;
  this.cilinder.position.x = 30;
  this.cilinder.position.y = -60;
  this.cilinder.position.z = -0.5;
  // cilinder.scale.multiplyScalar(3.4);
  this.cilinder.scale.x = 0.5;
  this.cilinder.scale.z = 0.5;

  this.cilinder.rotation.z = Math.PI / 2;

  this.cilinder.name = "cilinder";
  scene.add(this.cilinder);

  const count: number = geometry.attributes['position'].count;

  const position_clone = JSON.parse(
    JSON.stringify(geometry.attributes['position'].array)
  ) as Float32Array;
  const normals_clone = JSON.parse(
    JSON.stringify(geometry.attributes['normal'].array)
  ) as Float32Array;
  const damping = 0.2;

  // ANIMATE
  function animate() {
    const now = Date.now() / 200;

    // iterate all vertices
    for (let i = 0; i < count; i++) {
      // indices
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // use uvs to calculate wave
      const uX = geometry.attributes['uv'].getX(i) * Math.PI * 16;
      const uY = geometry.attributes['uv'].getY(i) * Math.PI * 16;

      // calculate current vertex wave height
      const xangle = uX + now;
      const xsin = Math.sin(xangle) * damping;
      const yangle = uY + now;
      const ycos = Math.cos(yangle) * damping;

      // set new position
      geometry.attributes['position'].setX(
        i,
        position_clone[ix] + normals_clone[ix] * (xsin + ycos)
      );
      geometry.attributes['position'].setY(
        i,
        position_clone[iy] + normals_clone[iy] * (xsin + ycos)
      );
      geometry.attributes['position'].setZ(
        i,
        position_clone[iz] + normals_clone[iz] * (xsin + ycos)
      );
    }
    geometry.computeVertexNormals();
    geometry.attributes['position'].needsUpdate = true;

    // requestAnimationFrame(animate);
  }
  animate();
  }

}
