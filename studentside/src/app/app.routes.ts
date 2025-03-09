import { HomeComponent } from './home/home.component';
import { InputComponent } from './input/input.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', component: InputComponent }, // Default route is the login page
    { path: 'dashboard', component: HomeComponent },
];
