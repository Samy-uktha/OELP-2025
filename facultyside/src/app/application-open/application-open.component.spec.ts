import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationOpenComponent } from './application-open.component';

describe('ApplicationOpenComponent', () => {
  let component: ApplicationOpenComponent;
  let fixture: ComponentFixture<ApplicationOpenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationOpenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ApplicationOpenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
