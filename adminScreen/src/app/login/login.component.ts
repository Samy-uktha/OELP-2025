import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { user } from '../models';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AdminComponent } from '../admin/admin.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  user : user | undefined;
  errorMessage : string ="";

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      userId: ['', [Validators.required, Validators.nullValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false],
    });

    

  }


  constructor (private fb : FormBuilder, private authService : AuthService, private router: Router){}

  onSubmit(): void {
    if (this.loginForm.valid) {
      const loginData = this.loginForm.value;
      const userId = loginData.userId;
      const password = loginData.password;
  
      // ✅ Subscribe to Observable
      this.authService.login(userId, password).subscribe((authenticatedUserId) => {
        if (authenticatedUserId) {
          console.log('Login Successful! User ID:', authenticatedUserId);
          this.errorMessage = ''; // Clear any previous error
          this.router.navigate(['/admin-dashboard'], {
            state: { userId: authenticatedUserId }
          });
           // Example navigation after login
        } else {
          console.error('Invalid credentials');
          this.errorMessage = 'Invalid User ID or Password';
        }
      });
    } else {
      console.error('Form is invalid');
    }
  }
  
}

