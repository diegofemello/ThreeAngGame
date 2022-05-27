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
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { ManagerService } from 'src/app/services/manager.service';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Component({
  selector: 'app-edit-player',
  templateUrl: './edit-player.component.html',
  styleUrls: ['./edit-player.component.scss'],
})
export class EditPlayerComponent implements OnInit, AfterViewInit {
  @Input() name?: string;

  @ViewChild('canvas')
  private canvasRef!: ElementRef;

  //* Cube Properties

  @Input() public rotationSpeedX: number = 0.05;

  @Input() public rotationSpeedY: number = 0.01;

  @Input() public size: number = 200;

  @Input() public texture: string = '/assets/texture.jpg';

  //* Stage Properties

  @Input() public cameraZ: number = 400;

  @Input() public fieldOfView: number = 1;

  @Input('nearClipping') public nearClippingPlane: number = 1;

  @Input('farClipping') public farClippingPlane: number = 1000;

  //? Helper Properties (Private Properties);

  private camera!: THREE.PerspectiveCamera;

  private path = './assets/models3d/CharacterRPG/CharacterBaseMesh.fbx';

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }
  // private loader = new THREE.TextureLoader();
  // private geometry = new THREE.BoxGeometry(1, 1, 1);
  // private material = new THREE.MeshBasicMaterial({
  //   map: this.loader.load(this.texture),
  // });

  private style: any = {
    ShoulderPad: 1,
    Face: 1,
    Cloth: 1,
    Hair: 1,
    Glove: 1,
    Shoe: 1,
  };

  private renderer!: THREE.WebGLRenderer;

  private scene!: THREE.Scene;

  private playerObject!: THREE.Object3D;

  private mixer!: THREE.AnimationMixer;

  // /**
  //  *Animate the cube
  //  *
  //  * @private
  //  * @memberof EditPlayerComponent
  //  */
  // private animateCube() {
  //   this.cube.rotation.x += this.rotationSpeedX;
  //   this.cube.rotation.y += this.rotationSpeedY;
  // }

  /**
   * Create the scene
   *
   * @private
   * @memberof EditPlayerComponent
   */
  private createScene() {
    //* Scene
    this.scene = new THREE.Scene();

    // this.scene.add(this.cube);
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
    controls.target.set(0, 0, 0);
    controls.enablePan = false;
    controls.minDistance = 300;
    controls.maxDistance = 450;
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;

    controls.update();
  }

  public updateMesh() {
    this.playerObject.traverse((c: THREE.Object3D) => {
      if (c instanceof THREE.Mesh) {
        if (
          c.name == 'ShoulderPad' + this.style['ShoulderPad'] ||
          c.name == 'Face' + this.style['Face'] ||
          c.name == 'Cloth' + this.style['Cloth'] ||
          c.name == 'Hair' + this.style['Hair'] ||
          c.name == 'Glove' + this.style['Glove'] ||
          c.name == 'Shoe' + this.style['Shoe']
        ) {
          c.visible = true;
          c.material.displacementScale = 0.01;
          c.castShadow = true;
        } else {
          c.visible = false;
        }
      }
    });
  }

  public changeHair(style: number) {
    this.changeField('Hair', style);
  }

  public changeFace(style: number) {
    this.changeField('Face', style);
  }

  public changeShoulderPad(style: number) {
    this.changeField('ShoulderPad', style);
  }

  public changeCloth(style: number) {
    this.changeField('Cloth', style);
  }

  public changeGlove(style: number) {
    this.changeField('Glove', style);
  }

  public changeShoe(style: number) {
    this.changeField('Shoe', style);
  }

  public changeField(field: string, style: number) {
    if (this.style[field] == 4 && style == 1) {
      this.style[field] = 1;
    } else if (this.style[field] == 1 && style == -1) {
      this.style[field] = 4;
    } else {
      this.style[field] += style;
    }

    this.updateMesh();

    console.log(this.style);
  }

  private loadModel() {
    const loader = new FBXLoader();
    loader.load(this.path, (object: THREE.Object3D) => {
      object.visible = false;
      this.scene.add(object);
      // object.name = '_Player';

      object.scale.multiplyScalar(0.03);

      //size of the model
      let box3 = new THREE.Box3().setFromObject(object);
      let size = new THREE.Vector3();
      box3.getSize(size);

      object.position.set(0, -size.y / 2, 0);
      this.playerObject = object;
      this.updateMesh();

      this.mixer = new THREE.AnimationMixer(object);

      const loader = new FBXLoader();
      loader.setPath('./assets/models3d/CharacterRPG/animations/');
      loader.load('idle.fbx', (a) => {
        const action = this.mixer.clipAction(a.animations[0]);
        action.play();
      });
    });
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

      // component.animateCube();
      component.renderer.render(component.scene, component.camera);
    })();
  }

  constructor(
    public modal: NgbActiveModal,
    private managerService: ManagerService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.createScene();
    this.startRenderingLoop();
  }
}
