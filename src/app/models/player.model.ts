import { Euler, Vector3 } from "three";

export class Player {
  uid: string = "";
  position: Vector3 = new Vector3(0, 0, 0);
  rotation: Euler = new Euler(0, 0, 0);
}
