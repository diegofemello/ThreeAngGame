import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as THREE from 'three';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PlayerService } from 'src/app/services/player.service';

@Component({
  selector: 'app-edit-player',
  templateUrl: './edit-player.component.html',
  styleUrls: ['./edit-player.component.scss'],
})
export class EditPlayerComponent implements AfterViewInit {
  @Input() name?: string;

  @ViewChild('canvas')
  private canvasRef!: ElementRef;

  @Input() public cameraZ: number = 400;

  @Input() public fieldOfView: number = 7;

  @Input('nearClipping') public nearClippingPlane: number = 1;

  @Input('farClipping') public farClippingPlane: number = 1000;

  private camera!: THREE.PerspectiveCamera;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  private renderer!: THREE.WebGLRenderer;

  private scene!: THREE.Scene;

  private playerObject!: THREE.Object3D;

  private mixer!: THREE.AnimationMixer;

  private style: any;

  public styleKeys = Object.keys(this.playerService.styles);

  /**
   * Create the scene
   *
   * @private
   * @memberof EditPlayerComponent
   */
  private createScene() {
    //* Scene
    this.scene = new THREE.Scene();
    // this.scene.background = new THREE.Color(0xFF0000);

    //*Camera
    let aspectRatio = this.getAspectRatio();
    this.camera = new THREE.PerspectiveCamera(
      this.fieldOfView,
      aspectRatio,
      this.nearClippingPlane,
      this.farClippingPlane
    );
    this.camera.position.z = this.cameraZ;

    //* Lights
    // DIRECTIONAL LIGHT
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.x += 180;
    dirLight.position.y += 180;
    dirLight.position.z += 0;
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;

    // AMBIENT LIGHT
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.position.y = 60;
    dirLight.position.z = 50;

    let target = new THREE.Object3D();
    target.position.z = -20;
    dirLight.target = target;
    dirLight.target.updateMatrixWorld();

    dirLight.shadow.camera.lookAt(0, 180, -30);
    this.scene.add(dirLight);

    this.loadModel();

    const controls = new OrbitControls(this.camera, this.canvas);

    controls.enablePan = false;
    controls.minDistance = 300;
    controls.maxDistance = 450;
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;

    controls.update();

    this.camera.lookAt(0, 17, 0);
    controls.target.set(0, 17, 0);
  }

  public updateMesh() {
    this.style = this.playerService.currentPlayer.style;

    this.playerService.updateMesh(this.playerObject, this.style);
  }

  public changeField(field: string, style: number) {
    const items = this.playerService.styles[field] as string[];

    if (this.style[field] == items.length && style == 1) {
      this.style[field] = 1;
    } else if (this.style[field] == 1 && style == -1) {
      this.style[field] = items.length;
    } else {
      this.style[field] += style;
    }

    this.updateMesh();
  }

  private loadModel() {
    const player = this.playerService.basePlayerObject.clone();
    this.playerService.resetClonedSkinnedMeshes(
      this.playerService.basePlayerObject,
      player
    );

    this.scene.add(player);

    console.log(player);

    //size of the model
    let box3 = new THREE.Box3().setFromObject(player);
    let size = new THREE.Vector3();
    box3.getSize(size);

    // player.position.set(0, -size.y, 0);
    this.playerObject = player;
    this.updateMesh();

    this.mixer = new THREE.AnimationMixer(player);
    const clip = this.playerService.animations['idle'];
    const action = this.mixer.clipAction(clip);
    action.play();
  }

  public save() {
    this.playerService.updatePlayerStyle(this.style);
    this.modal.close();
  }

  private getAspectRatio() {
    return this.canvas.clientWidth / this.canvas.clientHeight;
  }

  /**
   * Start the rendering loop
   *
   * @private
   * @memberof EditPlayerComponent
   */
  private startRenderingLoop() {
    //* Renderer
    // Use canvas element in template
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

    let component: EditPlayerComponent = this;
    (function render() {
      requestAnimationFrame(render);

      if (component.mixer) {
        component.mixer.update(0.01);
        component.playerObject.visible = true;
      }

      component.renderer.render(component.scene, component.camera);
    })();
  }

  constructor(
    public modal: NgbActiveModal,
    private playerService: PlayerService
  ) {}

  ngAfterViewInit() {
    this.createScene();
    this.startRenderingLoop();
  }
}
