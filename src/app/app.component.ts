import { Component } from '@angular/core';
import { ManagerService } from './services/manager.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'three';

  constructor(private manager: ManagerService) {
  }

 ngOnInit(): void {
   this.manager._Initialize();
 }

}
