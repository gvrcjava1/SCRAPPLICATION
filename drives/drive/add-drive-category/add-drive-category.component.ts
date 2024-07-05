import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { Constants } from 'src/app/common/constants';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';
import { MatTableDataSource, MatPaginator, MatSort, MatDialogRef, MatDialog, DateAdapter, MAT_DATE_FORMATS } from '@angular/material';
import { AppDateAdapter, APP_DATE_FORMATS } from 'src/app/common/date.adapter';

@Component({
  selector: 'app-add-drive-category',
  templateUrl: './add-drive-category.component.html',
  styleUrls: [],
  providers: [
    {
        provide: DateAdapter, useClass: AppDateAdapter
    },
    {
        provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS
    }
    ]

})
export class AddDriveCategoryComponent implements OnInit {

  pagination = Constants.PAGINATION_NUMBERS;
  FiledLabels = FieldLabelsConstant.LABELS;
  Titles = FieldLabelsConstant.TITLE;
  loggedUserData: any = JSON.parse(sessionStorage.getItem('userData'));
  save: boolean = true;
  update: boolean = false;
  title: string = '';
  isSubmit: boolean = false;
  addDriveCategoryFormGroup: FormGroup;
  id: number = 0;
  pattern = '[a-zA-Z][a-zA-Z ]*';
  toMinDate = new Date();
  currentDate = new Date();
  dateFormat = 'MM-dd-yyyy ';
  driveFormErrors: any;
  resp: any;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private spinnerService: Ng4LoadingSpinnerService,
    private commonService: CommonService,
    private router: Router,
    private sendAndRequestService:SendAndRequestService
  ) {
    // Reactive form errors
    this.driveFormErrors = {
      name: {},
      description: {},
      fromDate: {},
      toDate: {},
      depoType: {},
      assetType: {},
      assetDescription: {},
      criteria: {},
      targetQuantity: {},
      isIdRequired: {},
      functionalUnit: {},
      checklist: {},
      status: {}
    };
  }

  ngOnInit() {
    this.id = +this.route.snapshot.params['id'];


    this.createDriveCategoryForm();
    if (!isNaN(this.id)) {
     // this.updateDriveCategoryForm();
      this.addDriveCategoryFormGroup.valueChanges.subscribe(() => {
        this.onFormValuesChanged();
      });
      this.spinnerService.show();
      this.save = false;
      this.update = true;
      this.title = Constants.EVENTS.UPDATE;
      this.getDriveCategoryDataById(this.id);

    } else {
      this.save = true;
      this.update = false;
      this.title = Constants.EVENTS.ADD;
    }
  }
  onFormValuesChanged() {
    for (const field in this.driveFormErrors) {
      if (!this.driveFormErrors.hasOwnProperty(field)) {
        continue;
      }
      this.driveFormErrors[field] = {};
      const control = this.addDriveCategoryFormGroup.get(field);

      if (control && control.dirty && !control.valid) {
        this.driveFormErrors[field] = control.errors;
      }
    }
  }
  addEvent($event) {
    this.toMinDate = new Date($event.value);
  }
  updateDriveCategoryForm(){
    this.addDriveCategoryFormGroup = this.formBuilder.group({
      id: 0,
      name: [null, Validators.compose([Validators.required, Validators.maxLength(255)])],
      description: [null, Validators.compose([Validators.required, Validators.maxLength(255)])],
      fromDate: [null, Validators.required],
      toDate: [null],
      authority: [null, Validators.maxLength(255)]
    });
  }
  createDriveCategoryForm() {
    this.addDriveCategoryFormGroup = this.formBuilder.group({
      id: 0,
      name: [null, Validators.compose([Validators.required, Validators.maxLength(255)]), this.duplicateName.bind(this)],
      description: [null, Validators.compose([Validators.required, Validators.maxLength(255)]), this.duplicateDescription.bind(this)],
      fromDate: [null],
      toDate: [null],
      authority: [null, Validators.maxLength(255)]
    });
  }
  duplicateName() {
    let name = this.addDriveCategoryFormGroup.controls['name'].value;
    const q = new Promise((resolve, reject) => {
      if(this.update && name.toUpperCase() == this.resp.driveCategoryName.toUpperCase()){
        resolve(null);
      }else{
      this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE_CATEGORY.EXISTS_DRIVE_CATEGORY_NAME + name).subscribe((duplicate) => {
        if (duplicate) {
          resolve({ duplicateName: true });
        } else {
          resolve(null);
        }
      }, () => { resolve({ duplicateName: true }); });
    }
    });
    return q;
  }
  duplicateDescription() {
    let desc = this.addDriveCategoryFormGroup.controls['description'].value;
    const q = new Promise((resolve, reject) => {
      if(this.update && desc.toUpperCase() == this.resp.description.toUpperCase()){
        resolve(null);
      }else{
      this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE_CATEGORY.EXISTS_DRIVE_CATEGORY_DESCRIPTION +desc).subscribe((duplicate) => {
        if (duplicate) {
          resolve({ duplicateDescription: true });
        } else {
          resolve(null);
        }
      }, () => { resolve({ duplicateDescription: true }); });
    }
    });
    return q;
  }
  public get f() { return this.addDriveCategoryFormGroup.controls; }


  getDriveCategoryDataById(id) {
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE_CATEGORY.GET_DRIVE_CATEGORY_ID+id)
    .subscribe((resp) => {
        this.resp = resp;
        this.addDriveCategoryFormGroup.patchValue({
          id: this.resp.id,
          name: this.resp.driveCategoryName,
          description: this.resp.description,
          fromDate: !!this.resp.fromDate ? new Date(this.resp.fromDate) : '',
          toDate: !!this.resp.toDate ? new Date(this.resp.toDate) : '',
          authority: this.resp.authority,
        });
        this.toMinDate = new Date(this.resp.fromDate);
        this.spinnerService.hide();
      })
  }

  onAddDriveCategoryFormSubmit() {
    this.isSubmit = true;
    if (this.addDriveCategoryFormGroup.invalid) {
      this.isSubmit = false;
      return;
    }
    this.spinnerService.show();
    if (this.save) {
      let saveDriveModel = {
        name: this.addDriveCategoryFormGroup.value.name,
        description: this.addDriveCategoryFormGroup.value.description,
        fromDate: this.addDriveCategoryFormGroup.value.fromDate,
        toDate: this.addDriveCategoryFormGroup.value.toDate,
        authority: this.addDriveCategoryFormGroup.value.authority,
        createdBy: this.loggedUserData.username,
        createdOn: new Date()
      }
      this.sendAndRequestService.requestForPOST(Constants.app_urls.DRIVE.DRIVE_CATEGORY.SAVE_DRIVE_CATEGORY, saveDriveModel, false).subscribe(response => {
        this.resp = response;
        if (this.resp.code == Constants.CODES.SUCCESS) {
        this.spinnerService.hide();
        this.commonService.showAlertMessage('Drive Category Data Saved Successfully');
        this.router.navigate(['../'], { relativeTo: this.route });
        }else{
          this.commonService.showAlertMessage('Drive Category Data Saving Failed.');
        }
      }, error => {
        console.log('ERROR >>> ' + error);
        this.spinnerService.hide();
        this.commonService.showAlertMessage('Drive Category Data Saving Failed.');
      });
    } else if (this.update) {
      let updateDriveModel = {
        id: this.id,
        name: this.addDriveCategoryFormGroup.value.name,
        description: this.addDriveCategoryFormGroup.value.description,
        fromDate: this.addDriveCategoryFormGroup.value.fromDate,
        toDate: this.addDriveCategoryFormGroup.value.toDate,
        authority: this.addDriveCategoryFormGroup.value.authority,
        createdBy:this.resp.createdBy,
        createdOn: this.resp.createdOn,
        updatedBy: this.loggedUserData.username,
        updatedOn: new Date()
      }
      this.sendAndRequestService.requestForPUT(Constants.app_urls.DRIVE.DRIVE_CATEGORY.UPDATE_DRIVE_CATEGORY, updateDriveModel, false).subscribe(response => {
        this.spinnerService.hide();
        this.resp = response;
        if (this.resp.code == Constants.CODES.SUCCESS) {
        this.commonService.showAlertMessage('Drive Category Data Updated Successfully');
        this.router.navigate(['../../'], { relativeTo: this.route });
        }else{
          this.commonService.showAlertMessage('Drive Category Data Updating Failed.');
        }
      }, error => {
        console.log('ERROR >>> ' + error);
        this.spinnerService.hide();
        this.commonService.showAlertMessage('Drive Category Data Updating Failed.');
      })

    }
  }

  onGoBack() {
    if(this.save){
      this.router.navigate(['../'], { relativeTo: this.route });
    }else if(this.update){
      this.router.navigate(['../../'], { relativeTo: this.route });
    }
  }
}
