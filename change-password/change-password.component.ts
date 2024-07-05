import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { AlertService } from '../../services/alert.service';
import {  
  PasswordValidator,
  ParentErrorStateMatcher,
} from '../../validators';
import { Router, ActivatedRoute } from '@angular/router';

import { CommonService } from 'src/app/common/common.service';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { Constants } from 'src/app/common/constants';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ChangePasswordComponent implements OnInit {
  loggedUserData: any = JSON.parse(sessionStorage.getItem('userData'));
  tokenMessage: boolean = false;
  tokenValid: boolean = true;
  passwordBlock: boolean = true;
  resetPassword: boolean = false;
  returnUrl: string;
  userDetailsForm: FormGroup;
  changePasswordDetailsForm: FormGroup;
  invalid: boolean = false;
  matching_passwords_group: FormGroup;
  country_phone_group: FormGroup;
  tokenResponse: any;
  parentErrorStateMatcher = new ParentErrorStateMatcher();
  response:any;


  change_password_validation_messages = {
    'current_password': [
      { type: 'required', message: 'Current password is required' },
      { type: 'pattern', message: 'Enter a valid email' }
    ],
    'confirm_password': [
      { type: 'required', message: 'Confirm password is required' },
      { type: 'areEqual', message: 'Password mismatch' }
    ],
    'password': [
      { type: 'required', message: 'Password is required' },
      { type: 'minlength', message: 'Password must be at least 8 characters long' },
      { type: 'pattern', message: 'Your password must contain at least one uppercase, one lowercase, and one number' }
    ]
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private spinnerService: Ng4LoadingSpinnerService,
    private sendAndGetService:SendAndRequestService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private commonService: CommonService
  ) { }

  ngOnInit() {
    this.createForms();
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }




  createForms() {
    // matching passwords validation
    this.matching_passwords_group = new FormGroup({
      password: new FormControl('', Validators.compose([
        Validators.minLength(8),
        Validators.required,
        Validators.pattern('^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^!&*+=]).*$')
      ])),
      confirm_password: new FormControl('', Validators.required)
    }, (formGroup: FormGroup) => {
      return PasswordValidator.areEqual(formGroup);
    });

    this.changePasswordDetailsForm = this.fb.group({
      current_password: new FormControl('', Validators.compose([
        Validators.required,
      ]), this.duplicateDepartment.bind(this)),
      matching_passwords: this.matching_passwords_group,
    })

  }
  duplicateDepartment() {
    const q = new Promise((resolve, reject) => {
      let current_password: string = this.changePasswordDetailsForm.controls['current_password'].value;
      let email: string = this.loggedUserData.email;
      //{"password":currentPassword,"email":email}
      this.sendAndGetService.requestForPOST(Constants.app_urls.AUTHENTICATION.CHANGE_PASSWORD, {"password":current_password,"email":email}, false).subscribe((duplicate) => {
        if (!duplicate) {
          resolve({ 'currentPasswordDuplicate': true });
        } else {
          resolve(null);
        }
      }, () => { resolve({ 'currentPasswordDuplicate': true }); });
    });
    return q;
  }

  onSubmitChangePasswordDetails(value) {
    this.spinnerService.show();
    let email: string = this.loggedUserData.email;
    let password: string = value.matching_passwords.password;
    let user = {
      "email": email,
      "password": password
    }
    this.sendAndGetService.requestForPOST(Constants.app_urls.AUTHENTICATION.UPDATE_PASSWORD, user, false)
      .subscribe(
        response => {
          this.response = response;
          if (!!this.response && this.response.code == 200) {
            this.commonService.showAlertMessage('Password Updated Successfully. Please login with updated password');
            this.router.navigate(['/login']);
          } else {
            this.commonService.showAlertMessage('Password Updation Failed.');
          }
        },
        error => {
          this.invalid = true;
          this.alertService.error(error);
          this.spinnerService.hide();
        });
  }
}
