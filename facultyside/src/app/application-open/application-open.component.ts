import { Component, Input } from '@angular/core';
import { projApplication, Status } from '../interfaces';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-application-open',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './application-open.component.html',
  styleUrl: './application-open.component.css'
})
export class ApplicationOpenComponent {
  @Input() application : projApplication = {} as projApplication;

  Status = Status;


}
