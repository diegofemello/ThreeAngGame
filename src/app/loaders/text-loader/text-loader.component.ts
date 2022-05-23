import { Component, Input, OnInit } from '@angular/core';

import * as THREE from 'three';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { ManagerService } from 'src/app/services/manager.service';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

@Component({
  selector: 'app-text-loader',
  templateUrl: './text-loader.component.html',
  styleUrls: ['./text-loader.component.scss'],
})
export class TextLoaderComponent implements OnInit {
  @Input() color: string = '#ffffff';
  @Input() fontSize = 1;
  @Input() height: number = 2;
  @Input() name: string = '';
  @Input() positionX = 0;
  @Input() positionY = 0;
  @Input() positionZ = 0;
  @Input() rotationX = 0;
  @Input() rotationY = 0;
  @Input() rotationZ = 0;
  @Input() text: string = '';

  @Input() path: string = 'assets/fonts/GROBOLD_Regular.json';

  constructor(private manager: ManagerService) {}

  ngOnInit(): void {
    const loader = new FontLoader();

    loader.load('assets/fonts/GROBOLD_Regular.json', (font: Font) => {
      const paramsFont = {
        size: this.fontSize,
        height: this.height,
        curveSegments: 12,
        font: font,
        weight: 'normal',
        style: 'normal',

        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelOffset: 0,
        bevelSegments: 5,
      };

      const frontMaterial = new THREE.MeshPhongMaterial({
        color: this.color,
        flatShading: true,
      });
      const sideMaterial = new THREE.MeshPhongMaterial({
        color: 0x444444,
        flatShading: true,
      });

      const geometry = new TextGeometry(this.text, paramsFont);
      const textMesh = new THREE.Mesh(geometry, [frontMaterial, sideMaterial]);

      textMesh.position.x += this.positionX;
      textMesh.position.y += this.positionY;
      textMesh.position.z += this.positionZ;

      textMesh.rotation.x = this.rotationX * Math.PI;
      textMesh.rotation.y = this.rotationY * Math.PI;
      textMesh.rotation.z = this.rotationZ * Math.PI;

      textMesh.name = this.name ? this.name : this.text;

      this.manager._scene.add(textMesh);
    });
  }
}
