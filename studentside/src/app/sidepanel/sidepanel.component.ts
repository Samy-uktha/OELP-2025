import { ChangeDetectorRef, Component, OnInit, Input } from '@angular/core';
import { ProjectdataService } from '../projectdata.service';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from '../dashboard/dashboard.component';


@Component({
  selector: 'app-sidepanel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidepanel.component.html'
})
export class SidepanelComponent{

  applied: string[] = [];
  roll: string = '';
  removeProject(projectName: string) {
    this.projectService.removeProject(projectName, this.roll);
    this.applied = this.projectService.getAppliedProjects();
  }
  constructor(
    private projectService: ProjectdataService,
    private cdRef: ChangeDetectorRef
  ) { }

  // ngOnInit(): void {
    
  //   this.applied = this.projectService.getAppliedProjects();
  //   this.cdRef.detectChanges();
  // }
  ngOnInit() {
    const storedStudent = localStorage.getItem('student');
    if (storedStudent) {
      const studentData = JSON.parse(storedStudent);
      this.roll = studentData.roll;
      this.applied = this.projectService.getAppliedProjects();
    }
  }

  
}
