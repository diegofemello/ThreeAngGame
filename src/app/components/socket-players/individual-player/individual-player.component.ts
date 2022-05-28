import { Component, Input, OnInit } from '@angular/core';
import { Player } from 'src/app/models/player.model';
import { ManagerService } from 'src/app/services/manager.service';
import { PlayerService } from 'src/app/services/player.service';
import * as THREE from 'three';

@Component({
  selector: 'app-individual-player',
  templateUrl: './individual-player.component.html',
  styleUrls: ['./individual-player.component.scss'],
})
export class IndividualPlayerComponent implements OnInit {
  private player!: THREE.Object3D;
  @Input() uid = '';
  @Input() players: Player[] = [];
  animations: any = {};
  actualState: string = 'idle';

  mixer!: THREE.AnimationMixer;



  constructor(
    private manager: ManagerService,
    private playerService: PlayerService
  ) {}

  ngOnInit(): void {
    this.playerService.styleUpdated.subscribe((uid: string) => {
      if (uid === this.player.uuid) {
        this.UpdateMesh();
      }
    });

    this.LoadModel();
  }

  LoadModel = (): void => {
    if (!this.playerService.basePlayerObject) {
      setTimeout(() => {
        this.LoadModel();
      }, 100);
      return;
    }

    const player = this.playerService.basePlayerObject.clone();
    this.playerService.resetClonedSkinnedMeshes(
      this.playerService.basePlayerObject,
      player
    );

    this.manager._scene.add(player);

    player.name = this.uid;
    player.uuid = this.uid;
    player.visible = false;
    this.manager._scene.add(player);
    this.player = player;

    player.visible = true;
    this.Animate();
    this.LoadAnimations();

    this.UpdateMesh();
  };

  LoadAnimations = () => {
    this.mixer = new THREE.AnimationMixer(this.player);

    const onLoad = (animName: any) => {
      const clip = this.playerService.animations[animName];

      this.animations[animName] = {
        clip: clip,
        action: this.mixer.clipAction(clip),
      };
    };
    onLoad('walk');
    onLoad('run');
    onLoad('idle');
    onLoad('jump');

    this.animations[this.actualState].action.play();
  };

  UpdateMesh() {
    const playerSocket = this.players.find(
      (player: Player) => player.uid === this.player.uuid
    );

    if (playerSocket) {
      this.playerService.updateMesh(
        this.player,
        playerSocket.style,
        playerSocket.username
      );
    }
  }

  Animate() {
    requestAnimationFrame(() => {
      const playerSocket = this.players.find(
        (player: Player) => player.uid === this.player.uuid
      );

      if (playerSocket) {
        this.player.position.copy(playerSocket.position);
        this.player.rotation.set(
          playerSocket.rotation.x,
          playerSocket.rotation.y,
          playerSocket.rotation.z
        );

        if (playerSocket.state != this.actualState) {
          const action = this.animations[playerSocket.state].action;

          if (this.actualState) {
            const prevAction = this.animations[this.actualState].action;

            action.enabled = true;

            if (playerSocket.state == 'idle') {
              action.time = 0.0;
              action.setEffectiveTimeScale(1.0);
              action.setEffectiveWeight(1.0);
              action.crossFadeFrom(prevAction, 0.5, true);
            } else if (
              (playerSocket.state == 'walk' && this.actualState == 'run') ||
              (playerSocket.state == 'run' && this.actualState == 'walk')
            ) {
              const ratio =
                action.getClip().duration / prevAction.getClip().duration;
              action.time = prevAction.time * ratio;
            } else {
              action.time = 0.0;
              action.setEffectiveTimeScale(1.0);
              action.setEffectiveWeight(1.0);
            }

            action.crossFadeFrom(prevAction, 1, true);
          }

          this.actualState = playerSocket.state;
          action.play();
        }
      }

      this.mixer.update(1 / 60);
      this.Animate();
    });
  }

  ngOnDestroy(): void {
    this.manager._scene.remove(this.player);
  }
}
