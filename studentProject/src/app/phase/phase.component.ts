import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-phase',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './phase.component.html',
  styleUrls: ['./phase.component.css']
})
export class PhaseComponent implements OnInit {
  currentPhase: any = null;
  daysLeft: number = 0;

  @Output() phaseChanged = new EventEmitter<any>(); // ✅ Emits current phase to parent

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any[]>('http://localhost:5001/phase_dates').subscribe({
      next: (phases) => this.findCurrentPhase(phases),
      error: (err) => console.error('Failed to load phase data', err)
    });
  }

  phaseDescriptions: { [key: number]: string } = {
    1: 'Project Proposal Phase',
    2: 'Student Application Phase',
    3: 'Preferences Setting Phase',
    4: 'Allocation Phase'
  };

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  findCurrentPhase(phases: any[]) {
    const today = new Date();

    for (let phase of phases) {
      const start = new Date(phase.start_date);
      const end = new Date(phase.end_date);

      if (today >= start && today <= end) {
        this.currentPhase = phase;
        this.daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        this.phaseChanged.emit(this.currentPhase); // ✅ Emit phase to parent
        return;
      }
    }

    this.phaseChanged.emit(null); // 🔁 Emit null if no phase active
  }
}

