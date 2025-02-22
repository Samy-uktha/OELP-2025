import { Component } from '@angular/core';
import { RouterOutlet, Route, Router, RouterModule } from '@angular/router';
import { InputComponent } from './input/input.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './home/home.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app.component.html',
})
export class AppComponent {
  // Define routes for the components directly in the main component
  static routes: Route[] = [
    { path: '', component: InputComponent },
    { path: 'dashboard', component: HomeComponent },
  ];

  constructor(private router: Router) {
    this.router.resetConfig(AppComponent.routes);  // Set routes dynamically
  }
}
