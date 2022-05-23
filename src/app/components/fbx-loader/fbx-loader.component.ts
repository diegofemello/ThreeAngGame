import { Component, Input, OnInit } from '@angular/core';
import { ManagerService } from 'src/app/services/manager.service';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

@Component({
  selector: 'app-fbx-loader',
  templateUrl: './fbx-loader.component.html',
  styleUrls: ['./fbx-loader.component.scss']
})
export class FbxLoaderComponent implements OnInit {
  @Input() positionX = 0;
  @Input() positionY = 0;
  @Input() positionZ = 0;
  @Input() rotationX = 0;
  @Input() rotationY = 0;
  @Input() rotationZ = 0;
  @Input() scaleX = 1;
  @Input() scaleY = 1;
  @Input() scaleZ = 1;

  @Input() multiplyScalar = 1;
  @Input() path!: string;
  @Input() texturePath?: string;
  @Input() color?: string;
  @Input() name = '';

  constructor(private manager: ManagerService) {}

  ngOnInit(): void {
    const scene = this.manager._scene;

    const loader = new FBXLoader();
    loader.load(this.path, (object: THREE.Object3D) => {
      const texture = this.texturePath
        ? new THREE.TextureLoader().load(this.texturePath)
        : null;

      object.traverse((c: any) => {
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

      const fbxObject = new THREE.Object3D();
      fbxObject.add(object);

      fbxObject.scale.set(this.scaleX, this.scaleY, this.scaleZ);

      fbxObject.scale.multiplyScalar(this.multiplyScalar);
      fbxObject.rotation.set(
        this.rotationX * Math.PI,
        this.rotationY * Math.PI,
        this.rotationZ * Math.PI
      );

      // move object to position
      fbxObject.position.copy(new THREE.Vector3(this.positionX, this.positionY, this.positionZ));

      // fbxObject.position.set(this.positionX, this.positionY, this.positionZ);
      if (this.name || this.name != '') fbxObject.name = "_"+this.name;

      scene.add(fbxObject);
    });
  }

}
