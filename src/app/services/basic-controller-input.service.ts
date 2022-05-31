import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BasicControllerInputService {
  public _keys: any;
  public moveDirection = { left: 0, right: 0, forward: 0, back: 0, up: 0 };
  constructor() {
    this._Init()
  }

  _Init() {

    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      space: false,
      shift: false,
      mouseX: 0,
      mouseY: 0,
      mouseDown: false,
      mouseWheel: false,
      mouseWheelDelta: 0,
      q: false,
      e: false,
      r: false,
      f: false,
      t: false,
    };

    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
    document.addEventListener('mousemove', (e) => this._onMouseMove(e), false);
    document.addEventListener('mousedown', (e) => this._onMouseDown(e), false);
    document.addEventListener('mouseup', (e) => this._onMouseUp(e), false);

  }

  _onKeyDown(event: any) {
    switch (event.keyCode) {
      case 87: // w
        this._keys.forward = true;
        this.moveDirection.forward = 1;

        break;
      case 65: // a
        this._keys.left = true;
        this.moveDirection.left = 1;

        break;
      case 83: // s
        this._keys.backward = true;
        this.moveDirection.back = 1;
        break;
      case 68: // d
        this._keys.right = true;
        this.moveDirection.right = 1;
        break;
      case 32: // SPACE
        this._keys.space = true;
        this.moveDirection.up = 0.2;

        break;
      case 16: // SHIFT
        this._keys.shift = true;
        break;
      case 81: // Q
        this._keys.q = true;
        break;
    }
  }

  _onKeyUp(event: any) {
    switch(event.keyCode) {
      case 87: // w
        this._keys.forward = false;
        this.moveDirection.forward = 0;
        break;
      case 65: // a
        this._keys.left = false;
        this.moveDirection.left = 0;
        break;
      case 83: // s
        this._keys.backward = false;
        this.moveDirection.back = 0;
        break;
      case 68: // d
        this._keys.right = false;
        this.moveDirection.right = 0;
        break;
      case 32: // SPACE
        this._keys.space = false;
        break;
      case 16: // SHIFT
        this._keys.shift = false;
        break;
      case 81: // Q
        this._keys.q = false;
    }
  }

  _onMouseMove(event: any) {
    this._keys.mouseX = event.clientX;
    this._keys.mouseY = event.clientY;
  }

  _onMouseDown(event: any) {
    this._keys.mouseDown = true;
  }

  _onMouseUp(event: any) {
    this._keys.mouseDown = false;
  }

}
