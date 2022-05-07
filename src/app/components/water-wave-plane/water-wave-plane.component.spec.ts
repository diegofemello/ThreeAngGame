import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaterWavePlaneComponent } from './water-wave-plane.component';

describe('WaterWavePlaneComponent', () => {
  let component: WaterWavePlaneComponent;
  let fixture: ComponentFixture<WaterWavePlaneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WaterWavePlaneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WaterWavePlaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
