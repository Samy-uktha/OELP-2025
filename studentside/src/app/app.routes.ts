import { InputComponent } from './input/input.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', component: InputComponent }, // Default route is the login page
    { path: 'dashboard', component: DashboardComponent },
];
