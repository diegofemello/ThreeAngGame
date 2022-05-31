import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { PlayerService } from './player.service';

@Injectable({
  providedIn: 'root',
})
export class FiniteStateMachineService {
  public _animations: any;
  private _currentState?: State;
  private _states: any;

  constructor(private playerService: PlayerService) {
    this._states = {};
    this._Init();
  }

  async _Init() {
    this._AddState('idle', IdleState);
    this._AddState('walk', WalkState);
    this._AddState('run', RunState);
    this._AddState('jump', JumpState);
    this._AddState('dance', DanceState);

    await this.SetState('idle');
  }

  _AddState(name: string, type: any) {
    this._states[name] = type;
  }

  SetProxy(animations: any) {
    this._animations = animations;
  }

  async SetState(name: string) {
    const prevState = this._currentState;
    const currentPlayer = await this.playerService.getCurrentPlayer();

    if (prevState) {
      if (prevState.Name == name) {
        return;
      }
      prevState.Exit();
    }

    const state = new this._states[name](this);

    this._currentState = state;
    currentPlayer.state = name;
    state.Enter(prevState);
  }

  Update(timeElapsed: any, input: any) {
    if (this._currentState) {
      this._currentState.Update(timeElapsed, input);
    }
  }
}

export class State {
  public _parent: any;
  public prevState: any;
  protected _name!: string;
  constructor(parent: any) {
    this._parent = parent;
  }

  get Name() {
    return this._name;
  }

  Exit() {}
  Enter(prevState: any) {}
  Update(timeElapsed: any, input: any) {}
}

class WalkState extends State {
  constructor(parent: any) {
    super(parent);
    this._name = 'walk';
  }

  override Enter(prevState: State) {
    const curAction = this._parent._animations[this._name].action;
    if (prevState) {
      const prevAction = this._parent._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == 'run') {
        const ratio =
          curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 1, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  override Update(timeElapsed: any, input: any) {
    if (input._keys.forward || input._keys.backward) {
      if (input._keys.shift) {
        this._parent.SetState('run');
      }
      return;
    }

    this._parent.SetState('idle');
  }
}

class RunState extends State {
  constructor(parent: any) {
    super(parent);
    this._name = 'run';
  }

  override Enter(prevState: any) {
    const curAction = this._parent._animations[this._name].action;
    if (prevState) {
      const prevAction = this._parent._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == 'walk') {
        const ratio =
          curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  override Update(timeElapsed: any, input: any) {
    if (input._keys.forward || input._keys.backward) {
      if (!input._keys.shift) {
        this._parent.SetState('walk');
      }
      return;
    }

    this._parent.SetState('idle');
  }
}

class IdleState extends State {
  constructor(parent: any) {
    super(parent);
    this._name = 'idle';
  }

  override Enter(prevState: any) {
    const curAction = this._parent._animations[this._name].action;
    if (prevState) {
      const prevAction = this._parent._animations[prevState.Name].action;
      curAction.time = 0.0;
      curAction.enabled = true;
      curAction.setEffectiveTimeScale(1.0);
      curAction.setEffectiveWeight(1.0);
      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  override Update(_: any, input: any) {
    if (input._keys.forward || input._keys.backward) {
      this._parent.SetState('walk');
    } else if (input._keys.q) {
      this._parent.SetState('dance');
    }
  }
}

class JumpState extends State {
  constructor(parent: any) {
    super(parent);
    this._name = 'jump';
  }

  override Enter(prevState: any) {
    const curAction = this._parent._animations[this._name].action;
    if (prevState) {
      const prevAction = this._parent._animations[prevState.Name].action;

      curAction.reset();
      curAction.setLoop(THREE.LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.2, false);
      curAction.play();
    } else {
      curAction.play();
    }
  }
}

class DanceState extends State {
  private _FinishedCallback: () => void;
  private _CleanupCallback: any;
  constructor(parent: any) {
    super(parent);

    this._FinishedCallback = () => {
      this._Finished();
    };
  }

  override Enter(prevState: any) {
    const curAction = this._parent._animations[this._name].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener('finished', this._FinishedCallback);

    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.reset();
      curAction.setLoop(THREE.LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.2, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  _Finished() {
    this._Cleanup();
    this._parent.SetState('idle');
  }

  _Cleanup() {
    const action = this._parent._proxy._animations['dance'].action;

    action.getMixer().removeEventListener('finished', this._CleanupCallback);
  }

  override Exit() {
    this._Cleanup();
  }
}
