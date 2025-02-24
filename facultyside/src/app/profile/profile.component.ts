import { Component, Input } from '@angular/core';
import { Faculty } from '../interfaces';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
@Input()  faculty: Faculty = {} as Faculty;
}
