import { Component, Input, OnInit } from '@angular/core';
import { ManagerService } from 'src/app/services/manager.service';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

@Component({
  selector: 'app-gltf-loader',
  templateUrl: './gltf-loader.component.html',
  styleUrls: ['./gltf-loader.component.scss'],
})
export class GltfLoaderComponent implements OnInit {
  @Input() positionX = 0;
  @Input() positionY = 0;
  @Input() positionZ = 0;
  @Input() rotationX = 0;
  @Input() rotationY = 0;
  @Input() rotationZ = 0;

  @Input() scale = 1;
  @Input() path!: string;
  @Input() texturePath?: string;
  @Input() color?: string;
  @Input() name = '';

  constructor(private manager: ManagerService) {}

  ngOnInit(): void {
    const loader = new GLTFLoader();
    loader.load(this.path, (gltf: GLTF) => {
      const model = gltf.scene;

      const texture = this.texturePath
        ? new THREE.TextureLoader().load(this.texturePath)
        : null;

      model.traverse((c: any) => {
        if (c instanceof THREE.Mesh) {
          if (this.color) c.material.color.set(this.color);
          if (texture) {
            c.material.normalMap = texture;
            c.material.normalMap = texture;
          }
          c.material.displacementScale = 0.01;
          c.castShadow = true;
          c.name = this.name;
        }
      });
      const newObject = new THREE.Object3D();
      newObject.add(model);

      newObject.scale.multiplyScalar(this.scale);
      newObject.rotation.set(
        this.rotationX * Math.PI,
        this.rotationY * Math.PI,
        this.rotationZ * Math.PI
      );

      newObject.position.set(this.positionX, this.positionY, this.positionZ);
      if (this.name || this.name != '') newObject.name = this.name;

      this.manager._scene.add(newObject);
    });
  }
}
