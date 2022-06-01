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
  private playersSub!: Subscription;
  private playersMovement!: Subscription;

  constructor(private playerService: PlayerService) {}

  ngOnDestroy(): void {
    this.playersSub.unsubscribe();
    this.playersMovement.unsubscribe();
  }

  ngOnInit(): void {
    this.playersSub = this.playerService.players.subscribe((players) => {
      this.players = players;
      this.LoadModel();
    });

    this.playersMovement = this.playerService.playersMovement.subscribe(
      (players) => {
        this.players = players;
      }
    );
    this.Update();
  }

  LoadModel =  async () => {
    const currentPlayer = await this.playerService.getCurrentPlayer();

    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      const playerOn = this.playersOn.find((p) => p == player.uid);

      if (playerOn || player.uid == currentPlayer?.uid) {
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

  Update() {
    requestAnimationFrame(() => {
      this.playerService.getPlayers();
      this.Update();
    });
  }

}
