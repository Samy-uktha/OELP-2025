import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// import { AdminComponent } from "./admin/admin.component";
import { FormsModule } from '@angular/forms';
// import { LoginComponent } from "./login/login.component";
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,HttpClientModule , FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'adminScreen';
}
