import { Component, OnInit } from '@angular/core';
import * as THREE from 'three';
import { ManagerService } from '../services/manager.service';
import {
  CSS2DObject,
  CSS2DRenderer,
} from 'three/examples/jsm/renderers/CSS2DRenderer';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalTestComponent } from '../components/modal-test/modal-test.component';

@Component({
  selector: 'app-description',
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.scss'],
})
export class DescriptionComponent implements OnInit {
  private currentIntersection: any;
  constructor(
    private manager: ManagerService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    const scene = this.manager._scene;
    let camera: any = this.manager._camera;
    let renderer: any = this.manager._renderer;
    let currentIntersection: any = null;

    // Setup labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(innerWidth, innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(labelRenderer.domElement);

    

    const labelDiv = document.getElementsByClassName(
      'label'
    )[0] as HTMLDivElement;
    labelDiv.className = 'label';
    labelDiv.style.marginTop = '-1em';
    const label = new CSS2DObject(labelDiv);
    label.visible = false;

    scene.add(label);

    const labelDescription = document.getElementsByClassName(
      'description-items'
    )[0] as HTMLDivElement;
    labelDescription.style.display = 'none';

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event: any) => {
      mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObject(scene, true);

      if (intersects.length > 0) {
        this.currentIntersection = intersects[0];
        currentIntersection = intersects[0].object;
        label.position.copy(intersects[0].point);

        // Setup label
        renderer.domElement.className = 'hovered';
        labelDiv.textContent = currentIntersection.name;

        label.visible = true;

        if (
          Object.keys(Description).includes(
            currentIntersection.name.toLowerCase()
          )
        ) {
          labelDescription.style.display = 'block';
          labelDescription.innerHTML =
            Description[
              currentIntersection.name.toLowerCase() as keyof typeof Description
            ] + '</p>';
        } else {
          resetLabel();
        }

        if (currentIntersection && currentIntersection.name === 'AltoForno') {
          currentIntersection.material.color.setRGB(0.05, 0.05, 0.05);
        }
      } else {
        resetLabel();
        if (currentIntersection && currentIntersection.name === 'AltoForno') {
          currentIntersection.material.color.setRGB(0.03, 0.03, 0.03);
        }
      }
      labelRenderer.render(scene, camera);
    };

    const onMouseDown = (event: any) => {
      this.openModal();
    };

    renderer.domElement.addEventListener('pointermove', onMouseMove, false);
    renderer.domElement.addEventListener('pointerdown', onMouseDown, false);

    function resetLabel() {
      renderer.domElement.className = '';
      label.visible = false;
      labelDiv.textContent = '';

      labelDescription.style.display = 'none';
      labelDescription.innerHTML = '';
    }
  }

  openModal() {
    const modalRef = this.modalService.open(ModalTestComponent, {
      size: 'lg',
      centered: true,
    });
    modalRef.componentInstance.name = this.currentIntersection.object.name;
  }
}

enum Description {
  altoforno = '<h3>Alto Forno</h3> O alto-forno é um forno de cuba ou fornalha com 20 a 30 metros de altura, com a forma de dois troncos de cone unidos pelas suas bases (cuba e ventre) e fechado na parte inferior pelo cadinho com a soleira.',
  slime = '<h3>Slime</h3> Aqui é um slime q criei pra testar a simulação do liquido.',
  logo = '<h3>Logo</h3> Aqui é o logo do projeto.',
  sensor = '<h3>Sensor</h3> É um sensor de temperatura, que vai ser usado para calcular a temperatura do alto-forno.<p><img src="assets/images/smile.png" width="250px" align="center">',
  player = '<h3>Player</h3> É o jogador principal, que pode ser controlado pelo mouse ou teclado.',
  ground = '<h3>Ground</h3> É o chão do jogo, obviamente.',
  robot = '<h3>Robot</h3> Mas que p**** de robô é esse ???.',
}
