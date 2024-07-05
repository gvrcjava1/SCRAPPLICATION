import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { Constants } from 'src/app/common/constants';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';

@Component({
  selector: 'app-add-drive-category-association',
  templateUrl: './add-drive-category-association.component.html',
  styleUrls: []
})
export class AddDriveCategoryAssociationComponent implements OnInit {

  pagination=Constants.PAGINATION_NUMBERS;
  FiledLabels = FieldLabelsConstant.LABELS;
  Titles = FieldLabelsConstant.TITLE;
  loggedUserData: any = JSON.parse(sessionStorage.getItem('userData'));
  save: boolean = true;
  update: boolean = false;
  title: string = Constants.EVENTS.ADD;
  isSubmit: boolean = false;
  addDriveCategoryAssoFormGroup: FormGroup;
  id: number = 0;
  pattern = "[a-zA-Z][a-zA-Z ]*";
  driveList = [];
  driveCategoryList = [];
  reportHeadingList:any;
  driveFormErrors: any;
  resp: any;
  statusList = [{ 'id': 1, "value": 'Yes' }, { 'id': 2, "value": 'No' }];
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
      drive: {},
      driveCategory: {},
      active: {},      
    };
  }

  ngOnInit() {
    this.id = +this.route.snapshot.params['id'];
    this.getDrivesData();
    this.getDriveCategoryData();
    this.getReportSubHeadingData();

    if (!isNaN(this.id)) {
      this.getDriveCategoryAssoDataById(this.id);
      this.updateDriveForm();      
      this.addDriveCategoryAssoFormGroup.valueChanges.subscribe(() => {
        this.onFormValuesChanged();
      });
      this.spinnerService.show();
      this.save = false;
      this.update = true;
      this.title = Constants.EVENTS.UPDATE;
      
    } else {
      this.createDriveForm();
      this.title = Constants.EVENTS.ADD;
    }
  }
  getDrivesData() {
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE.GET_DRIVES).subscribe((data) => {
      this.driveList = data;
      this.spinnerService.hide();
    }, error => {
      this.spinnerService.hide();
    });
  }
  getDriveCategoryData() {
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE_CATEGORY.GET_DRIVE_CATEGORY).subscribe((data) => {
      this.driveCategoryList = data;
      this.spinnerService.hide();
    }, error => {
      this.spinnerService.hide();
    });
  }
  getReportSubHeadingData() {
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE_REPORT_SUB_HEADING.GET_DRIVE_REPORT_SUB_HEADING).subscribe((data) => {
      this.reportHeadingList = data;
      this.spinnerService.hide();
    }, error => {
      this.spinnerService.hide();
    });
  }
  onFormValuesChanged() {
    for (const field in this.driveFormErrors) {
      if (!this.driveFormErrors.hasOwnProperty(field)) {
        continue;
      }
      this.driveFormErrors[field] = {};
      const control = this.addDriveCategoryAssoFormGroup.get(field);

      if (control && control.dirty && !control.valid) {
        this.driveFormErrors[field] = control.errors;
      }
    }
  }
  createDriveForm() {
    this.addDriveCategoryAssoFormGroup = this.formBuilder.group({
      id: 0,
      'drive': [null, Validators.compose([Validators.required])],
      'driveCategory': [null, Validators.compose([Validators.required]),this.duplicateDriveCatAssoc.bind(this)],
      'active': [null, Validators.required],
      'reportDisplayId':[null],
      'reportOrder':[null],
      'reportSubHeading':[null]
    });
  }
  updateDriveForm() {
    this.addDriveCategoryAssoFormGroup = this.formBuilder.group({
      id: 0,
      'drive': [null, Validators.compose([Validators.required])],
      'driveCategory': [null, Validators.compose([Validators.required]),this.duplicateDriveCatAssocAndId.bind(this)],
      'active': [null, Validators.required],
      'reportDisplayId':[null],
      'reportOrder':[null],
      'reportSubHeading':[null]
    });
  }

  public get f() { return this.addDriveCategoryAssoFormGroup.controls; }


  getDriveCategoryAssoDataById(id) {
    this.addDriveCategoryAssoFormGroup = this.formBuilder.group({
      id: 0,
      'drive': [null, Validators.compose([Validators.required])],
      'driveCategory': [null, Validators.compose([Validators.required]),this.duplicateDriveCatAssocAndId.bind(this)],
      'active': [null, Validators.required],
      'reportDisplayId':[null],
      'reportOrder':[null],
      'reportSubHeading':[null]
    });
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE_CATEGORY_ASSOCIATION.GET_DRIVE_CATEGORY_ASSOC_ID+id)
      .subscribe((resp) => {
        this.resp = resp;      
      if(this.resp.reportOrder != null){
        this.addDriveCategoryAssoFormGroup.patchValue({
          reportOrder: this.resp.reportOrder 
        })
      }
      if(this.resp.reportSubHeading != null){
        this.addDriveCategoryAssoFormGroup.patchValue({
          reportSubHeading:this.resp.reportSubHeading['id']
        })
      }
        this.addDriveCategoryAssoFormGroup.patchValue({
          id: this.resp.id,
          drive : this.resp.driveId.id,
          driveCategory: this.resp.driveCategoryId['id'],
          active: this.resp.active,
          reportDisplayId:this.resp.reportDisplayId ,
          
         
        });
      
        this.spinnerService.hide();
      })
  }
  
  onAddDriveCategoryFormSubmit() {
    this.isSubmit = true;
    if (this.addDriveCategoryAssoFormGroup.invalid) {
      this.isSubmit = false;
      return;
    }
    this.spinnerService.show();
    if (this.save) {
      var saveDriveModel = {
        "driveId": this.addDriveCategoryAssoFormGroup.value.drive,
        "driveCategoryId": this.addDriveCategoryAssoFormGroup.value.driveCategory,
        "active": this.addDriveCategoryAssoFormGroup.value.active,
        "reportDisplayId":this.addDriveCategoryAssoFormGroup.value.reportDisplayId,
        "reportOrder":this.addDriveCategoryAssoFormGroup.value.reportOrder,
        "reportSubHeading":this.addDriveCategoryAssoFormGroup.value.reportSubHeading,
        "createdBy": this.loggedUserData.username,
        "createdOn": new Date()
      }
      this.sendAndRequestService.requestForPOST(Constants.app_urls.DRIVE.DRIVE_CATEGORY_ASSOCIATION.SAVE_DRIVE_CATEGORY_ASSOC, saveDriveModel, false).subscribe(response => {
        this.spinnerService.hide();
        this.resp = response;
        if (this.resp.code == Constants.CODES.SUCCESS) {
        this.commonService.showAlertMessage("Drive Category Association Data Saved Successfully");
        this.router.navigate(['../'], { relativeTo: this.route });
        }else{
          this.commonService.showAlertMessage("Drive Category Association Data Saving Failed.");
        }
      }, error => {
        console.log('ERROR >>> ' + error);
        this.spinnerService.hide();
        this.commonService.showAlertMessage("Drive Category Association Data Saving Failed.");
      });
    } else if (this.update) {
      var updateDriveModel = {
        "id": this.id,
        "driveId": this.addDriveCategoryAssoFormGroup.value.drive,
        "driveCategoryId": this.addDriveCategoryAssoFormGroup.value.driveCategory,
        "active": this.addDriveCategoryAssoFormGroup.value.active,
        "reportDisplayId":this.addDriveCategoryAssoFormGroup.value.reportDisplayId,
        "reportOrder":this.addDriveCategoryAssoFormGroup.value.reportOrder,
        "reportSubHeading":this.addDriveCategoryAssoFormGroup.value.reportSubHeading,
        "updatedBy": this.loggedUserData.username,
        "updatedOn": new Date(),
        "createdOn": new Date()
      }
      this.sendAndRequestService.requestForPUT(Constants.app_urls.DRIVE.DRIVE_CATEGORY_ASSOCIATION.UPDATE_DRIVE_CATEGORY_ASSOC, updateDriveModel, false).subscribe(response => {
        this.spinnerService.hide();
        this.resp = response;

        if (this.resp.code == Constants.CODES.SUCCESS) {
        this.commonService.showAlertMessage("Drive Category Association Data Updated Successfully");
        this.router.navigate(['../../'], { relativeTo: this.route });
        }else{
          this.commonService.showAlertMessage("Drive Category Association Data Updating Failed.");
        }
      }, error => {
        console.log('ERROR >>> ' + error);
        this.spinnerService.hide();
        this.commonService.showAlertMessage("Drive Category Association Data Updating Failed.");
      })

    }
  }
  duplicateDriveCatAssoc() {

       let driveId= this.addDriveCategoryAssoFormGroup.controls['drive'].value;
    let driveCategoryId= this.addDriveCategoryAssoFormGroup.controls['driveCategory'].value;

   
    const q = new Promise((resolve, reject) => {          

      this.sendAndRequestService.requestForGET(
             Constants.app_urls.DRIVE.DRIVE_CATEGORY_ASSOCIATION. EXISTS_DRIVE_CATEGORY_ASSOC+driveId
             +'/'+driveCategoryId
            ).subscribe
             ((duplicate) => {
       if (duplicate) {
         resolve({ 'duplicateDriveCatAssoc': true });
       } else {
         resolve(null);
       }
     }, () => { resolve({ 'duplicateDriveCatAssoc': true }); });
   });
   return q;
  }
  duplicateDriveCatAssocAndId() {

     let id=this.id;
    
     let driveId= this.addDriveCategoryAssoFormGroup.controls['drive'].value;
     let driveCategoryId= this.addDriveCategoryAssoFormGroup.controls['driveCategory'].value;  
   
    const q = new Promise((resolve, reject) => {          

      this.sendAndRequestService.requestForGET(
             Constants.app_urls.DRIVE.DRIVE_CATEGORY_ASSOCIATION. EXISTS_DRIVE_CATEGORY_ASSOC_ID+id+'/'+driveId
             +'/'+driveCategoryId
            ).subscribe
             ((duplicate) => {
       if (duplicate) {
         resolve({ 'duplicateDriveCatAssocAndId': true });
       } else {
         resolve(null);
       }
     }, () => { resolve({ 'duplicateDriveCatAssocAndId': true }); });
   });
   return q;
  }
  onGoBack() {
    if(this.save){
      this.router.navigate(['../'], { relativeTo: this.route });
    }else if(this.update){
      this.router.navigate(['../../'], { relativeTo: this.route });
    }
  }
}
