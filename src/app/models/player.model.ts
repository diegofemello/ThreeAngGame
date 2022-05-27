import { Euler, Vector3 } from 'three';

export class Player {
  uid!: string;
  username!: string;
  position: Vector3 = new Vector3();
  rotation: Euler = new Euler();
  style!: any;
  state!: string;
  previousState!: string;
}
