import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  constructor (private router: Router){
  }

  help(){
    this.router.navigate(['/visualiser-dashboard']);
  }

  navigateTofac(){
    const facultyLoginUrl = 'http://localhost:4200/'; 

    console.log(`Navigating to external URL: ${facultyLoginUrl}`);

    // Option 1: Navigate in the SAME browser tab/window
    // This will leave your Angular application.
    window.location.href = facultyLoginUrl;
  }

  // http://localhost:65033

  navigateTostud(){
    const studentLoginUrl = 'http://localhost:62033/'; 

    console.log(`Navigating to external URL: ${studentLoginUrl}`);

    // Option 1: Navigate in the SAME browser tab/window
    // This will leave your Angular application.
    window.location.href = studentLoginUrl;
  }

  navigateToadmin(){
    const adminLoginUrl = 'http://localhost:62057/'; 

    console.log(`Navigating to external URL: ${adminLoginUrl}`);

    // Option 1: Navigate in the SAME browser tab/window
    // This will leave your Angular application.
    window.location.href = adminLoginUrl;
  }
}
