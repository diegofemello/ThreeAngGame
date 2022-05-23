import { Component, Input, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import * as THREE from 'three';
import { ManagerService } from 'src/app/services/manager.service';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { Player } from 'src/app/models/player.model';
import { PlayerService } from 'src/app/services/player.service';

@Component({
  selector: 'app-socket-players',
  templateUrl: './socket-players.component.html',
  styleUrls: ['./socket-players.component.scss'],
})
export class SocketPlayersComponent implements OnInit {
  _obsPlayer!: Observable<Player[]>;
  private playersOn: THREE.Object3D[] = [];

  private path = './assets/models3d/CharacterRPG/CharacterBaseMesh.fbx';
  private scale = 0.2;
  private players!: Player[];
  private _playersSub!: Subscription;
  private _playersMovement!: Subscription;


  constructor(
    private manager: ManagerService,
    private playerService: PlayerService
  ) {
    this._obsPlayer = this.playerService.players;
  }

  ngOnDestroy(): void {
    this._playersSub.unsubscribe();
    this._playersMovement.unsubscribe();
  }

  ngOnInit(): void {
    this._obsPlayer = this.playerService.players;
    this._playersSub = this.playerService.players.subscribe((players) => {
      this.players = players;
      console.log(this.players);
      this.LoadModel();
    });

    this._playersMovement = this.playerService.playersMovement.subscribe(
      (players) => {
        this.players = players;
      }
    );
    this.Animate();
  }

  LoadModel = () => {
    const loader = new FBXLoader();

    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      const playerOn = this.playersOn.find((p) => p.uuid == player.uid);

      if (playerOn || player.uid == this.playerService.currentPlayer) {
        continue;
      }

      const playersToRemove = this.playersOn.filter((player) => {
        return !this.players.find((p) => p.uid === player.uuid);
      });

      playersToRemove.forEach((player) => {
        this.manager._scene.remove(player);
        this.playersOn.slice(this.playersOn.indexOf(player), 1);
      });

      loader.load(this.path, (object: THREE.Object3D) => {
        object.traverse((c: THREE.Object3D) => {
          if (c instanceof THREE.Mesh) {
            if (
              c.name == 'Face' + player.style ||
              c.name == 'Cloth' + player.style ||
              c.name == 'Hair' + player.style ||
              c.name == 'Glove' + player.style ||
              c.name == 'Shoe' + player.style ||
              c.name == 'ShoulderPad' + player.style ||
              c.name == 'Belt' + player.style
            ) {
              c.visible = true;
              c.material.displacementScale = 0.01;
              c.castShadow = true;
            } else {
              c.visible = false;
            }
            c.name = player.username;
          }
        });

        object.userData['tag'] = 'SocketPlayer';

        const newObject = new THREE.Object3D();
        newObject.add(object);

        newObject.scale.multiplyScalar(this.scale);

        newObject.position.set(
          player.position.x,
          player.position.y,
          player.position.z
        );

        newObject.name = player.uid;
        newObject.uuid = player.uid;
        newObject.visible = false;
        this.manager._scene.add(newObject);

        this.playersOn.push(newObject);



        const labelDiv = document.createElement('div');
        labelDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
        labelDiv.style.padding = '2px';
        labelDiv.style.color = '#fff';
        labelDiv.style.fontSize = '12px';
        labelDiv.style.textAlign = 'center';
        labelDiv.style.borderRadius = '5px';
        labelDiv.style.display = 'block';
        labelDiv.innerHTML = player.username;

        newObject.visible = true;

        // const labelRenderer = new CSS2DObject(labelDiv);
        // labelRenderer.position.set(
        //   newObject.position.x,
        //   newObject.position.y + 200,
        //   newObject.position.z
        // );
        // newObject.add(labelRenderer);
        newObject.visible = true;

      });
    }

    // remove players not contained in this.playersOn
    this.playersOn.forEach((player: THREE.Object3D) => {
      if (!this.players.find((p) => p.uid == player.uuid)) {
        this.manager._scene.remove(player);
        this.playersOn.forEach((p: THREE.Object3D, i: number) => {
          if (p.uuid == player.uuid) this.playersOn.splice(i, 1);
        });
      }
    });
  };

  Animate() {
    requestAnimationFrame(() => {
      this.playerService.getPlayers();

      this.playersOn.forEach((player: THREE.Object3D) => {
        const playerOn = this.players.find((p) => p.uid == player.uuid);
        if (playerOn) {
          player.position.set(
            playerOn.position.x,
            playerOn.position.y,
            playerOn.position.z
          );
          player.rotation.set(
            playerOn.rotation.x,
            playerOn.rotation.y,
            playerOn.rotation.z
          );
        }
      });

      this.Animate();
    });
  }
}
