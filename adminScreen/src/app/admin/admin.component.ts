import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit{
  http = inject(HttpClient);
  constructor(private router: Router) {}
  goBackToLogin() {
    this.router.navigate(['/login']); // 👈 Adjust path if your login route is different
  }
  
  phases = [
    { phase_number: 1, start_date: '', end_date: '' },
    { phase_number: 2, start_date: '', end_date: '' },
    { phase_number: 3, start_date: '', end_date: '' },
    { phase_number: 4, start_date: '', end_date: '' }
  ];

  ngOnInit() {
    this.http.get<any[]>('http://localhost:5001/phase_dates').subscribe({
      next: (data) => {
        data.forEach((d, i) => {
          this.phases[i].start_date = d.start_date?.split('T')[0];
          this.phases[i].end_date = d.end_date?.split('T')[0];
          console.log("fetched from backend",data)
        });
      },
      error: (err) => {
        console.error('Failed to load phase dates:', err);
        alert('Error fetching phase dates from server');
      }
    });
    console.log("phases are",this.phases)
  }

  phaseDescriptions: { [key: number]: string } = {
    1: 'Project Proposal Phase',
    2: 'Student Application Phase',
    3: 'Preferences Setting Phase',
    4: 'Allocation Phase'
  };

  trackByPhase(index: number, phase: any) {
    return phase.phase_number;
  }

  validatePhases(): boolean {
    for (let i = 0; i < this.phases.length; i++) {
      const { start_date, end_date } = this.phases[i];
  
      if (!start_date || !end_date) {
        alert(`Phase ${i + 1} must have both start and end dates.`);
        return false;
      }
  
      const start = new Date(start_date);
      const end = new Date(end_date);
  
      if (start > end) {
        alert(`In Phase ${i + 1}, start date must be before end date.`);
        return false;
      }
  
      if (i > 0) {
        const prevEnd = new Date(this.phases[i - 1].end_date);
        if (start < prevEnd) {
          alert(`Phase ${i + 1} starts before or on the same day as Phase ${i}. Phases cannot overlap.`);
          return false;
        }
      }
    }
  
    return true;
  }
  
  

  updateEndDate(index: number) {
    if (index < this.phases.length - 1) {
      const end = new Date(this.phases[index].end_date);
      const nextStart = new Date(end);
      nextStart.setDate(end.getDate() + 1);
      this.phases[index + 1].start_date = nextStart.toISOString().split('T')[0];
    }
  }

  submitDates() {
    if (!this.validatePhases()) {
      return;
    }
  
    this.http.post('http://localhost:5001/phase_dates', this.phases).subscribe({
      next: () => {
        alert('Dates saved successfully!');
      },
      error: (err) => {
        console.error('Failed to save phase dates:', err);
        alert('Error saving dates. Please try again.');
      }
    });
  }
}
