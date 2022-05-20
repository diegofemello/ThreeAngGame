import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { DescriptionComponent } from './description/description.component';
import { LoadTextComponent } from './components/load-text/load-text.component';
import { PlayerComponent } from './components/player/player.component';
import { PhysicsComponent } from './components/physics/physics.component';
import { GltfLoaderComponent } from './components/gltf-loader/gltf-loader.component';
import { FbxLoaderComponent } from './components/fbx-loader/fbx-loader.component';

@NgModule({
  declarations: [
    AppComponent,
    DescriptionComponent,
    LoadTextComponent,
    PlayerComponent,
    PhysicsComponent,
    GltfLoaderComponent,
    FbxLoaderComponent,
  ],
  imports: [BrowserModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
