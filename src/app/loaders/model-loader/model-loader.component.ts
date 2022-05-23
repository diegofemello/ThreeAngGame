import { Component, Input, OnInit } from '@angular/core';
import { ManagerService } from 'src/app/services/manager.service';

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

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
  @Input() scaleX = 1;
  @Input() scaleY = 1;
  @Input() scaleZ = 1;

  @Input() multiplyScalar = 1;
  @Input() path!: string;
  @Input() texturePath?: string;
  @Input() color?: string;
  @Input() name = '';

  @Input() isAnimated = false;
  @Input() type: string = 'gltf';

  private _loader: any;

  constructor(private manager: ManagerService) {}

  ngOnInit(): void {
    if (this.type.toLowerCase() == 'gltf') this._loader = new GLTFLoader();
    else if (this.type.toLowerCase() == 'fbx') this._loader = new FBXLoader();

    this._loader.load(this.path, (item: any) => {
      let object: any = item;
      if (this.type == 'gltf') object = item.scene;

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

      const model = new THREE.Object3D();
      model.add(object);

      model.scale.set(this.scaleX, this.scaleY, this.scaleZ);

      model.scale.multiplyScalar(this.multiplyScalar);
      model.rotation.set(
        this.rotationX * Math.PI,
        this.rotationY * Math.PI,
        this.rotationZ * Math.PI
      );

      model.position.set(this.positionX, this.positionY, this.positionZ);
      if (this.name || this.name != '') model.name = '_' + this.name;

      this.manager._scene.add(model);

      if (this.isAnimated) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(object.animations[0]);
        action.play();
      }
    });
  }
}
