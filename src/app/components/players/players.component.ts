import { Component, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Player } from 'src/app/models/player.model';
import { PlayerService } from 'src/app/services/player.service';

@Component({
  selector: 'app-players',
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.scss'],
})
export class PlayersComponent implements OnInit {
  players?: Observable<Player[]>;

  constructor(private playerService: PlayerService) {}

  ngOnInit() {
    this.players = this.playerService.players;
  }

  ngOnDestroy() {
  }
}
