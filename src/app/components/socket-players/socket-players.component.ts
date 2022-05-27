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
  playersOn: THREE.Object3D[] = [];

  players!: Player[];
  private _playersSub!: Subscription;
  private _playersMovement!: Subscription;

  constructor(private playerService: PlayerService) {}

  ngOnDestroy(): void {
    this._playersSub.unsubscribe();
    this._playersMovement.unsubscribe();
  }

  ngOnInit(): void {
    this._playersSub = this.playerService.players.subscribe((players) => {
      this.players = players;
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
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      const playerOn = this.playersOn.find((p) => p.uuid == player.uid);

      if (playerOn || player.uid == this.playerService?.currentPlayer?.uid) {
        continue;
      }
      const object = new THREE.Object3D();
      object.uuid = player.uid;
      this.playersOn.push(object);
    }

    this.playersOn.forEach((player: THREE.Object3D) => {
      if (!this.players.find((p) => p.uid == player.uuid)) {
        this.playersOn.forEach((p: THREE.Object3D, i: number) => {
          if (p.uuid == player.uuid) this.playersOn.splice(i, 1);
        });
      }
    });
  };

  Animate() {
    requestAnimationFrame(() => {
      this.playerService.getPlayers();
      this.Animate();
    });
  }
}
