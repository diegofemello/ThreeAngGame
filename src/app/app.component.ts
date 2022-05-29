import { Component } from '@angular/core';
import * as THREE from 'three';
import { ManagerService } from './services/manager.service';
import { PlayerService } from './services/player.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'three';

  private analyzer2_?: THREE.AudioAnalyser;
  private analyzer2Texture_?: THREE.DataTexture;

  constructor(
    private manager: ManagerService,
    private playerService: PlayerService
  ) {}

  ngOnInit(): void {
    this.manager._Initialize();

    // const geometry = new THREE.BoxBufferGeometry(20, 20, 20);
    // const material = new THREE.MeshStandardMaterial({
    //   color: 0xffffff,
    //   metalness: 0.5,
    // });

    // const mesh = new THREE.Mesh(geometry, material);
    // this.manager._scene.add(mesh);
    // mesh.position.set(550, 10, -550);

    // const mesh2 = new THREE.Mesh(geometry, material);
    // this.manager._scene.add(mesh2);
    // mesh2.position.set(-550, 10, -550);

    // const sound1 = new THREE.PositionalAudio(this.playerService.listener);
    // const sound2 = new THREE.PositionalAudio(this.playerService.listener);

    // mesh.add(sound1);
    // mesh2.add(sound2);

    // const loader = new THREE.AudioLoader();
    // loader.load('assets/resources/music/Ectoplasm.mp3', (buffer) => {
    //   setTimeout(() => {
    //     sound1.setBuffer(buffer);
    //     sound1.setLoop(true);
    //     sound1.setVolume(1.0);
    //     sound1.setRefDistance(1);
    //     sound1.play();
    //     // this.analyzer1_ = new THREE.AudioAnalyser(sound1, 32);
    //     // this.analyzer1Data_ = [];
    //   }, 5000);
    // });

    // loader.load('assets/resources/music/AcousticRock.mp3', (buffer) => {
    //   setTimeout(() => {
    //     sound2.setBuffer(buffer);
    //     sound2.setLoop(true);
    //     sound2.setVolume(1.0);
    //     sound2.setRefDistance(1);
    //     sound2.play();
    //     // this.analyzer2_ = new THREE.AudioAnalyser(sound2, 128);
    //     // this.analyzer2Texture_ = new THREE.DataTexture(
    //     //   this.analyzer2_.data,
    //     //   64,
    //     //   1,
    //     //   THREE.RedFormat
    //     // );
    //     // this.analyzer2Texture_.magFilter = THREE.LinearFilter;
    //   }, 5000);
    // });
  }
}
