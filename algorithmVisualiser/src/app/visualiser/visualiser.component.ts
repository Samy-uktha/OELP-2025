import { Component } from '@angular/core';
// import { StepState } from '../models';
import { CommonModule } from '@angular/common';
import { SpaLecturerComponent } from "../spa-lecturer/spa-lecturer.component";
import { SpaStudentComponent } from "../spa-student/spa-student.component";
import { GaleshapleyStudComponent } from "../galeshapley-stud/galeshapley-stud.component";
import { GaleshapleyFacComponent } from "../galeshapley-fac/galeshapley-fac.component";
import { PreferenceComponent } from "../preference/preference.component";
import { ProcessDetailsComponent } from "../process-details/process-details.component";

@Component({
  selector: 'app-visualiser',
  standalone: true,
  imports: [CommonModule, SpaLecturerComponent, SpaStudentComponent, GaleshapleyStudComponent, GaleshapleyFacComponent, PreferenceComponent, ProcessDetailsComponent],
  templateUrl: './visualiser.component.html',
  styleUrl: './visualiser.component.css'
})
export class VisualiserComponent {
  selectedTab = 'Overview'; 


  
  selectTab(tab: string) {
    this.selectedTab = tab;
  }
}
