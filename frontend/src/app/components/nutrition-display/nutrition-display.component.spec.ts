import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NutritionDisplay } from './nutrition-display.component';

describe('NutritionDisplay', () => {
  let component: NutritionDisplay;
  let fixture: ComponentFixture<NutritionDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NutritionDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NutritionDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
