import {  NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { DescriptionComponent } from './ui/description/description.component';
import { PlayerComponent } from './components/player/player.component';
import { PhysicsComponent } from './components/physics/physics.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ModalTestComponent } from './ui/modal-test/modal-test.component';

import { FormsModule } from '@angular/forms';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { SocketPlayersComponent } from './components/socket-players/socket-players.component';
import { environment } from 'src/environments/environment';
import { LoginModalComponent } from './ui/login-modal/login-modal.component';
import { TextLoaderComponent } from './loaders/text-loader/text-loader.component';
import { ModelLoaderComponent } from './loaders/model-loader/model-loader.component';
import { EditPlayerComponent } from './ui/edit-player/edit-player.component';

const config: SocketIoConfig = { url: environment.socketUrl, options: {} };

@NgModule({
  declarations: [
    AppComponent,
    DescriptionComponent,
    PlayerComponent,
    PhysicsComponent,
    ModalTestComponent,
    SocketPlayersComponent,
    LoginModalComponent,
    TextLoaderComponent,
    ModelLoaderComponent,
    EditPlayerComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    FormsModule,
    SocketIoModule.forRoot(config),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
