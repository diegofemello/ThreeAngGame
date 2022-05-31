import { Component, Input, OnInit } from '@angular/core';
import { Player } from 'src/app/models/player.model';
import { ManagerService } from 'src/app/services/manager.service';
import { PlayerService } from 'src/app/services/player.service';
import * as THREE from 'three';

@Component({
  selector: 'app-individual-player',
  template: '<ng-content></ng-content>'
})
export class IndividualPlayerComponent implements OnInit {
  private player!: THREE.Object3D;
  @Input() uid = '';
  @Input() players: Player[] = [];
  @Input() positionX: number = 0;
  @Input() positionY: number = 0;
  @Input() positionZ: number = 0;
  @Input() actualState: string = 'idle';
  @Input() username: string = '';

  animations: any = {};

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

  LoadModel = async (): Promise<void> => {
    const player = await this.playerService.getBasePlayerObject();
    this.manager._scene.add(player);

    player.name = this.uid;
    player.uuid = this.uid;
    player.position.set(this.positionX, this.positionY, this.positionZ);

    player.visible = false;
    this.manager._scene.add(player);
    this.player = player;

    player.visible = true;
    this.Animate();
    this.LoadAnimations();

    this.UpdateMesh();
  };

  LoadAnimations = async () => {
    const animations = await this.playerService.getAnimations();
    this.mixer = new THREE.AnimationMixer(this.player);
    const onLoad = (animName: any) => {
      const clip = animations[animName];

      this.animations[animName] = {
        clip: clip,
        action: this.mixer.clipAction(clip),
      };
    };
    onLoad('walk');
    onLoad('run');
    onLoad('idle');
    onLoad('jump');
    onLoad('dance');

    this.animations[this.actualState].action.play();
  };

  async UpdateMesh() {
    const playerSocket = this.players.find(
      (player: Player) => player.uid === this.player.uuid
    );

    if (playerSocket) {
      this.playerService.updateMesh(
        this.player,
        playerSocket.style,
        playerSocket.username
      );
    } else {
      this.playerService.updateMesh(
        this.player,
        await this.playerService.getRandomStyle(),
        this.username
      );
    }
  }

  Animate() {
    requestAnimationFrame(() => {
      if (this.players) {
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
      }

      if (this.mixer) {
        this.mixer.update(1 / 60);
      }
      this.Animate();
    });
  }

  ngOnDestroy(): void {
    this.manager._scene.remove(this.player);
  }
}
