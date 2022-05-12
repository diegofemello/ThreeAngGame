import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BasicControllerInputService {
  public _keys: any;
  constructor() {
    // this._Init()
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

        break;
      case 65: // a
        this._keys.left = true;
        break;
      case 83: // s
        this._keys.backward = true;
        break;
      case 68: // d
        this._keys.right = true;
        break;
      case 32: // SPACE
        this._keys.space = true;
        break;
      case 16: // SHIFT
        this._keys.shift = true;
        break;
    }
  }

  _onKeyUp(event: any) {
    switch(event.keyCode) {
      case 87: // w
        this._keys.forward = false;
        break;
      case 65: // a
        this._keys.left = false;
        break;
      case 83: // s
        this._keys.backward = false;
        break;
      case 68: // d
        this._keys.right = false;
        break;
      case 32: // SPACE
        this._keys.space = false;
        break;
      case 16: // SHIFT
        this._keys.shift = false;
        break;
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
