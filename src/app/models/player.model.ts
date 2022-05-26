import { Euler, Vector3 } from 'three';

export class Player {
  uid!: string;
  username!: string;
  position: Vector3 = new Vector3();
  rotation: Euler = new Euler();
  style!: number;
  state!: string;
  previousState!: string;
  object!: THREE.Object3D;
}
