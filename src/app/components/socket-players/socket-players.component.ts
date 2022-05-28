import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Player } from 'src/app/models/player.model';
import { PlayerService } from 'src/app/services/player.service';

@Component({
  selector: 'app-socket-players',
  templateUrl: './socket-players.component.html',
  styleUrls: ['./socket-players.component.scss'],
})
export class SocketPlayersComponent implements OnInit {
  playersOn: string[] = [];

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
      const playerOn = this.playersOn.find((p) => p == player.uid);

      if (playerOn || player.uid == this.playerService?.currentPlayer?.uid) {
        continue;
      }
      this.playersOn.push(player.uid);
    }

    for (let i = 0; i < this.playersOn.length; i++) {
      const playerOn = this.playersOn[i];
      const player = this.players.find((p) => p.uid == playerOn);

      if (!player) {
        this.playersOn.splice(i, 1);
        i--;
      }
    }
  };

  Animate() {
    requestAnimationFrame(() => {
      this.playerService.getPlayers();
      this.Animate();
    });
  }
}
