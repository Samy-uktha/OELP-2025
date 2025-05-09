import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { VisualiserComponent } from './visualiser/visualiser.component';

export const routes: Routes = [
	{ path: '', component: HomeComponent },
	{ path: 'visualiser-dashboard', component: VisualiserComponent}
];
