import { Component } from '@angular/core';
import { DashboardComponent } from "../dashboard/dashboard.component";
import { SidepanelComponent } from "../sidepanel/sidepanel.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DashboardComponent, SidepanelComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent {

}
