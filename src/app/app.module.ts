import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ModelComponent } from './components/model/model.component';

import { DescriptionComponent } from './description/description.component';
import { WavePlaneComponent } from './components/wave-plane/wave-plane.component';
import { LiquidWavesComponent } from './components/liquid-waves/liquid-waves.component';
import { ModelLoaderComponent } from './components/model-loader/model-loader.component';
import { SlimeWavePlaneComponent } from './components/slime-wave-plane/slime-wave-plane.component';
import { WaterWavePlaneComponent } from './components/water-wave-plane/water-wave-plane.component';
import { LoadTextComponent } from './components/load-text/load-text.component';
import { PlayerComponent } from './components/player/player.component';
import { PhysicsComponent } from './components/physics/physics.component';


@NgModule({
  declarations: [
    AppComponent,
    ModelComponent,
    DescriptionComponent,
    WavePlaneComponent,
    LiquidWavesComponent,
    ModelLoaderComponent,
    SlimeWavePlaneComponent,
    WaterWavePlaneComponent,
    LoadTextComponent,
    PlayerComponent,
    PhysicsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {


}
