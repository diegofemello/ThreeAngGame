import { Component, OnInit } from '@angular/core';
import { ManagerService } from 'src/app/services/manager.service';
import * as THREE from 'three';

@Component({
  selector: 'app-wave-plane',
  templateUrl: './wave-plane.component.html',
  styleUrls: ['./wave-plane.component.scss'],
})
export class WavePlaneComponent implements OnInit {
  constructor(private manager: ManagerService) {}

  ngOnInit(): void {
    const scene = this.manager._scene;

    const geometry = new THREE.PlaneBufferGeometry(30, 30, 200, 200);
    const plane = new THREE.Mesh(
      geometry,
      new THREE.MeshPhongMaterial({ color: 0xf2a23a })
    );
    plane.receiveShadow = true;
    plane.castShadow = true;
    plane.rotation.x = -Math.PI / 2;
    plane.position.z = -60;
    plane.position.y = -50;

    scene.add(plane);

    const count: number = geometry.attributes['position'].count;

    // ANIMATE
    function animate() {
      // SINE WAVE
      const now = Date.now() / 300;
      for (let i = 0; i < count; i++) {
        const x = geometry.attributes['position'].getX(i);
        const y = geometry.attributes['position'].getY(i);

        const xangle = x + now;
        const xsin = Math.sin(xangle);
        const yangle = y + now;
        const ycos = Math.cos(yangle);

        geometry.attributes['position'].setZ(i, xsin + ycos);
      }
      geometry.computeVertexNormals();
      geometry.attributes['position'].needsUpdate = true;

      requestAnimationFrame(animate);
    }

    animate();
  }
}
