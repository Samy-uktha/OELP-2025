import { Routes } from '@angular/router';
import { LoginComponent} from './login/login.component';
import { AdminComponent } from './admin/admin.component';

export const routes: Routes = [
    { path: '', component: LoginComponent },
	{ path: 'login', component: LoginComponent },
	{path: 'admin-dashboard', component : AdminComponent}
];
