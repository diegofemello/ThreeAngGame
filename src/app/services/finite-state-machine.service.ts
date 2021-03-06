import { Injectable } from '@angular/core';
import * as THREE from 'three';

@Injectable({
  providedIn: 'root',
})
export class FiniteStateMachineService {
  private _states: any;
  public _currentState: any;
  private _proxy: any;

  constructor() {
    this._states = {};
    this._currentState = null;
  }

  _Init() {
    this._AddState('idle', IdleState);
    this._AddState('walk', WalkState);
    this._AddState('run', RunState);
    this._AddState('dance', DanceState);
  }

  _AddState(name: any, type: any) {
    this._states[name] = type;
  }

  SetProxy(proxy: any) {
    this._proxy = proxy;
  }

  SetState(name: any) {
    const prevState = this._currentState;

    if (prevState) {
      if (prevState.Name == name) {
        return;
      }
      prevState.Exit();
    }

    const state = new this._states[name](this);

    this._currentState = state;
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
}

export interface IState {
  Enter(prevState: any): any;
  Exit(): any;
  Update(timeElapsed: any, input: any): any
}

class WalkState extends State implements IState {
  constructor(parent: any) {
    super(parent);
    this._name = 'walk';
  }

  Enter(prevState: any) {
    const curAction = this._parent._proxy._animations[this._name].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

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

  Exit() {}

  Update(timeElapsed: any, input: any) {
    if (input._keys.forward || input._keys.backward) {
      if (input._keys.shift) {
        this._parent.SetState('run');
      }
      return;
    }

    this._parent.SetState('idle');
  }
}

class RunState extends State implements IState {
  constructor(parent: any) {
    super(parent);
    this._name = 'run';
  }

  Enter(prevState: any) {
    const curAction = this._parent._proxy._animations[this._name].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

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

  Exit() {}

  Update(timeElapsed: any, input: any) {
    if (input._keys.forward || input._keys.backward) {
      if (!input._keys.shift) {
        this._parent.SetState('walk');
      }
      return;
    }

    this._parent.SetState('idle');
  }
}

class IdleState extends State implements IState {
  constructor(parent: any) {
    super(parent);
    this._name = 'idle';
  }

  Enter(prevState: any) {
    const idleAction = this._parent._proxy._animations[this._name].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;
      idleAction.time = 0.0;
      idleAction.enabled = true;
      idleAction.setEffectiveTimeScale(1.0);
      idleAction.setEffectiveWeight(1.0);
      idleAction.crossFadeFrom(prevAction, 0.5, true);
      idleAction.play();
    } else {
      idleAction.play();
    }
  }

  Exit() {}

  Update(_: any, input: any) {
    if (input._keys.forward || input._keys.backward) {
      this._parent.SetState('walk');
    } else if (input._keys.space) {
      this._parent.SetState('dance');
    }
  }
}

class DanceState extends State implements IState {
  private _FinishedCallback: () => void;
  private _CleanupCallback: any;
  constructor(parent: any) {
    super(parent);
    this._name = 'dance';

    this._FinishedCallback = () => {
      this._Finished();
    };
  }

  Enter(prevState: any) {
    const curAction = this._parent._proxy._animations[this._name].action;
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

  Exit() {
    this._Cleanup();
  }

  Update(_: any) {}
}

// export class FiniteStateMachine {
//   private _states: any;
//   private _currentState: any;

//   constructor() {
//     this._states = {};
//     this._currentState = null;

//   }

//   _Init() {
//     this._AddState('idle', IdleState);
//     this._AddState('walk', WalkState);
//     this._AddState('run', RunState);
//     this._AddState('dance', DanceState);
//   }

//   _AddState(name: any, type: any) {
//     this._states[name] = type;
//   }

//   SetState(name: any) {
//     const prevState = this._currentState;

//     if (prevState) {
//       if (prevState.Name == name) {
//         return;
//       }
//       prevState.Exit();
//     }

//     const state = new this._states[name](this);

//     this._currentState = state;
//     state.Enter(prevState);
//   }

//   Update(timeElapsed: any, input: any) {
//     if (this._currentState) {
//       this._currentState.Update(timeElapsed, input);
//     }
//   }
// };
