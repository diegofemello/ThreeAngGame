import { Component, Input, OnInit } from '@angular/core';
import { ManagerService } from 'src/app/services/manager.service';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

@Component({
  selector: 'app-model-loader',
  templateUrl: './model-loader.component.html',
  styleUrls: ['./model-loader.component.scss'],
})
export class ModelLoaderComponent implements OnInit {
  @Input() positionX = 0;
  @Input() positionY = 0;
  @Input() positionZ = 0;
  @Input() rotationX = 0;
  @Input() rotationY = 0;
  @Input() rotationZ = 0;
  @Input() scale = 0.2;
  @Input() path!: string;
  @Input() texturePath = ''
  @Input() color = '#49BB58';
  @Input() name = '';

  constructor(private manager: ManagerService) {}

  ngOnInit(): void {
    const scene = this.manager._scene;

    const loader = new FBXLoader();
    loader.load(this.path, (object: THREE.Object3D) => {
      object.traverse((c: THREE.Object3D) => {
        // c.castShadow = true;
      });

      const texture = new THREE.TextureLoader().load(this.texturePath);

      object.traverse((c: any) => {
        if (c instanceof THREE.Mesh) {
          c.material.color.set(this.color)
          if(texture.image) c.material.normalMap = texture;
              c.material.normalMap = texture;
              c.material.displacementScale = 0.01;
              c.castShadow = true;
        }
      });

      if(this.name || this.name != '') object.name = this.name;

      object.scale.multiplyScalar(this.scale);
      object.position.set(this.positionX, this.positionY, this.positionZ);
      object.rotation.set(this.rotationX * Math.PI, this.rotationY * Math.PI, this.rotationZ * Math.PI);
      scene.add(object);
    });

  }
}
