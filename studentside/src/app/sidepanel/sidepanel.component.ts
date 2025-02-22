import { Component, OnInit } from '@angular/core';
import { ProjectdataService } from '../projectdata.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidepanel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidepanel.component.html'
})
export class SidepanelComponent {

  appliedProjects: string[] = [];
  constructor(private projectService: ProjectdataService) { }

  ngOnInit(): void {
    // Replace this with your real logic if applied projects come from user data
    this.appliedProjects = this.projectService.getAppliedProjects();
  }
}
