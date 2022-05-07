import { Component, Input, OnInit } from '@angular/core';
import { ManagerService } from 'src/app/services/manager.service';
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader';

@Component({
  selector: 'app-load-text',
  templateUrl: './load-text.component.html',
  styleUrls: ['./load-text.component.scss']
})
export class LoadTextComponent implements OnInit {
  @Input() positionX = 0;
  @Input() positionY = 0;
  @Input() positionZ = 0;
  @Input() rotationX = 0;
  @Input() rotationY = 0;
  @Input() rotationZ = 0;
  @Input() text: string = "";
  @Input() fontSize = 1;
  @Input() height: number = 2;



  constructor(private manager: ManagerService) {}

  ngOnInit(): void {
    const scene = this.manager._scene;
    const loader = new FontLoader();

    loader.load('assets/fonts/GROBOLD_Regular.json', (font: Font) => {
      const paramsFont = {
        size: this.fontSize,
        height: 2,
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
        color: 0xffffff,
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


      textMesh.rotation.x = this.rotationX  * Math.PI;
      textMesh.rotation.y = this.rotationY * Math.PI;
      textMesh.rotation.z = this.rotationZ  * Math.PI;

      textMesh.name = this.text;

      scene.add(textMesh);
    });
  }
}
