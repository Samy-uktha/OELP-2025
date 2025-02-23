import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { InputService } from '../input.service';
import { Dept, Student } from '../interfaces';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input.component.html',
})
export class InputComponent {
  name: string = '';
  rollNumber: string = '';
  cgpa: number = 0;

  constructor(private router: Router, private dataService: InputService) {}

  onSubmit(form: any) {
    if (form.valid) {

      const branchCode = this.rollNumber.substring(0,2);
      const yearCode = this.rollNumber.substring(2,4);
      const degreeCode = this.rollNumber.substring(4,6);
      const roll = this.rollNumber.substring(6,9);
      
      const branch: Dept = this.getBranch(branchCode);
      const year = '20'+(yearCode)
      const degree = this.getDegree(degreeCode)
      const sem = this.getSem(yearCode);

      this.dataService.setData('name', this.name);
      this.dataService.setData('rollNumber', this.rollNumber);
      this.dataService.setData('branch', branch);
      this.dataService.setData('year', year);
      this.dataService.setData('degree', degree);
      this.dataService.setData('roll', roll);
      this.dataService.setData('semester', sem);
      this.dataService.setData('cgpa',this.cgpa);

      this.router.navigate(['/dashboard']);
    }
    
    }
  
  getBranch(code:string): Dept{
    const branchMap: {[key:string]:Dept} = {
      '10':Dept.CE,
      '11':Dept.CS,
      '12':Dept.EE,
      '13':Dept.ME,
      '14':Dept.DS
    };
    return branchMap[code] || 'Undefined';
    }
     
  getDegree(code:string): string{
    const degreeMap: {[key:string]:string} = {
      '01':'BTech',
      '02':'MTech',
      '03':'MS',
      '04':'PhD',
    };
    return degreeMap[code] || 'Undefined';
    }
  getSem(code:string): string{
    const semMap: {[key:string]:string} = {
      '21':'8',
      '22':'6',
      '23':'4',
      '24':'3',
    };
    return semMap[code] || 'Undefined';
    }
  
}
