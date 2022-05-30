import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ManagerService } from 'src/app/services/manager.service';
import { PlayerService } from 'src/app/services/player.service';
import * as THREE from 'three';

import { math } from './math';

@Component({
  selector: 'app-audio',
  templateUrl: './audio.component.html',
  styleUrls: ['./audio.component.scss'],
})
export class AudioComponent implements AfterViewInit {
  analyzer1_!: THREE.AudioAnalyser;
  analyzer1Data_!: any[];
  analyzer2_!: THREE.AudioAnalyser;
  analyzer2Texture_!: THREE.DataTexture;
  speakerMeshes1_: any;
  indexTimer_ = 0;
  noise1_: any;
  previousRAF_?: number;

  constructor(
    private manager: ManagerService,
    private playerService: PlayerService
  ) {}

  ngAfterViewInit(): void {
    const geometry = new THREE.BoxBufferGeometry(20, 20, 20);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.5,
      opacity: 0,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    this.manager._scene.add(mesh);
    mesh.position.set(0, 10, -550);
    mesh.scale.set(5, 5, 5);

    // const mesh2 = new THREE.Mesh(geometry, material);
    // this.manager._scene.add(mesh2);
    // mesh2.position.set(-550, 10, -550);

    const sound1 = new THREE.PositionalAudio(this.playerService.listener);
    // const sound2 = new THREE.PositionalAudio(this.playerService.listener);

    mesh.add(sound1);
    // mesh2.add(sound2);

    const loader = new THREE.AudioLoader();
    loader.load('assets/resources/music/OneKiss.mp3', (buffer) => {
      setTimeout(() => {
        sound1.setBuffer(buffer);
        sound1.setVolume(2);
        sound1.setLoop(true);
        sound1.setRefDistance(1);
        sound1.play();
        this.analyzer1_ = new THREE.AudioAnalyser(sound1, 32);
        this.analyzer1Data_ = [];
      }, 5000);
    });

    // loader.load('assets/resources/music/AcousticRock.mp3', (buffer) => {
    //   setTimeout(() => {
    //     sound2.setBuffer(buffer);
    //     sound2.setLoop(true);
    //     sound2.setVolume(1.0);
    //     sound2.setRefDistance(1);
    //     sound2.play();
    //     this.analyzer2_ = new THREE.AudioAnalyser(sound2, 128);
    //     this.analyzer2Texture_ = new THREE.DataTexture(
    //       this.analyzer2_.data,
    //       64,
    //       1,
    //       THREE.RedFormat
    //     );
    //     this.analyzer2Texture_.magFilter = THREE.LinearFilter;
    //   }, 5000);
    // });

    const speaker1Geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const speaker1Mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.5,
    });
    this.speakerMeshes1_ = [];
    const speaker1Group = new THREE.Group();

    for (let x = -5; x <= 20; ++x) {
      const row = [];
      for (let y = 0; y <= 15; ++y) {
        const speaker1_1 = new THREE.Mesh(speaker1Geo, speaker1Mat.clone());
        speaker1_1.position.set(x * 2, y * 2, 0);
        speaker1_1.castShadow = true;
        speaker1_1.receiveShadow = true;
        speaker1Group.add(speaker1_1);
        row.push(speaker1_1);
      }
      this.speakerMeshes1_.push(row);
    }
    mesh.add(speaker1Group);

    this.raf_();
  }

  raf_() {
    requestAnimationFrame((t) => {
      if (!this.previousRAF_) {
        this.previousRAF_ = t;
      }
      this.step_(t - this.previousRAF_);

      this.previousRAF_ = t;
      this.raf_();
    });
  }

  step_(timeElapsed: number) {
    const timeElapsedS = timeElapsed * 0.001;

    if (this.analyzer1_) {
      this.indexTimer_ += timeElapsedS * 0.1;

      this.analyzer1Data_.push([...this.analyzer1_.getFrequencyData()]);
      const rows = this.speakerMeshes1_.length;
      if (this.analyzer1Data_.length > rows) {
        this.analyzer1Data_.shift();
      }

      const colourSpline = new LinearSpline((t, a, b) => {
        const c = a.clone();
        return c.lerp(b, t);
      });
      colourSpline.AddPoint(0.0, new THREE.Color(0x4040ff));
      colourSpline.AddPoint(0.25, new THREE.Color(0xff4040));
      colourSpline.AddPoint(1.0, new THREE.Color(0xffff80));

      const remap = [15, 13, 11, 9, 7, 5, 3, 1, 0, 2, 4, 6, 8, 10, 12, 14];
      for (let r = 0; r < this.analyzer1Data_.length; ++r) {
        const data = this.analyzer1Data_[r];
        const speakerRow = this.speakerMeshes1_[r];
        for (let i = 0; i < data.length; ++i) {
          const freqScale = math.smootherstep(
            (data[remap[i]] / 255) ** 0.5,
            0,
            1
          );
          const sc = 1 + 6 * freqScale;
          //TODO: noise
          // + this.noise1_.Get(this.indexTimer_, r * 0.42142, i * 0.3455);
          speakerRow[i].scale.set(sc / 2, sc / 2, sc);
          speakerRow[i].material.color.copy(colourSpline.Get(freqScale));
          speakerRow[i].material.emissive.copy(colourSpline.Get(freqScale));
          speakerRow[i].material.emissive.multiplyScalar(freqScale ** 5);
        }
      }
    }
  }
}

class LinearSpline {
  points_: any[];
  _lerp: any;
  constructor(lerp: (t: any, a: any, b: any) => any) {
    this.points_ = [];
    this._lerp = lerp;
  }

  AddPoint(t: number, d: THREE.Color) {
    this.points_.push([t, d]);
  }

  Get(t: number) {
    let p1 = 0;

    for (let i = 0; i < this.points_.length; i++) {
      if (this.points_[i][0] >= t) {
        break;
      }
      p1 = i;
    }

    const p2 = Math.min(this.points_.length - 1, p1 + 1);

    if (p1 == p2) {
      return this.points_[p1][1];
    }

    return this._lerp(
      (t - this.points_[p1][0]) / (this.points_[p2][0] - this.points_[p1][0]),
      this.points_[p1][1],
      this.points_[p2][1]
    );
  }
}
