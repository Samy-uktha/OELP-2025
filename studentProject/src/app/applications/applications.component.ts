import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { projApplication } from '../interfaces';

@Component({
  selector: 'app-applications',
  standalone: true,
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.css'],
  imports: [CommonModule]
})
export class ApplicationsComponent {
  @Input() applied: projApplication[] = [];
  @Output() appliedChange = new EventEmitter<projApplication[]>();  // FIXED TYPE
  @Output() viewApplicationEvent = new EventEmitter<string>();

  isEditingPreferences = false; // Controls visibility of arrows

  toggleEditing() {
    this.isEditingPreferences = !this.isEditingPreferences;
  }

  savePreferences() {
    this.isEditingPreferences = false;
    this.appliedChange.emit([...this.applied]);
  }
  // Move project up in the list
  moveUp(index: number) {
    if (index > 0) {
      // Swap elements
      [this.applied[index - 1], this.applied[index]] = [this.applied[index], this.applied[index - 1]];
  
      // Swap preference values
      const temppreference = this.applied[index].preference;
      this.applied[index].preference = this.applied[index - 1].preference;
      this.applied[index - 1].preference = temppreference;
  
      this.appliedChange.emit(this.applied);
    }
  }

  // Move project down in the list
  moveDown(index: number) {
    if (index < this.applied.length - 1) {
      // Swap elements
      [this.applied[index], this.applied[index + 1]] = [this.applied[index + 1], this.applied[index]];
  
      // Swap preference values
      const temppreference = this.applied[index].preference;
      this.applied[index].preference = this.applied[index + 1].preference;
      this.applied[index + 1].preference = temppreference;
  
      this.appliedChange.emit(this.applied);
    }
  }

  // Emit event to view application details
  viewApplication(application: projApplication) {
    this.viewApplicationEvent.emit(application.title); // FIXED
  }
}





