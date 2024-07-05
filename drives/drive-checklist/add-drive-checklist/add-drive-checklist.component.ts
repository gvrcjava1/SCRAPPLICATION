import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from 'src/app/common/constants';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';





@Component({
  selector: 'app-add-drive-checklist',
  templateUrl: './add-drive-checklist.component.html',
  styleUrls: []
})
export class AddDriveChecklistComponent implements OnInit {
  pagination=Constants.PAGINATION_NUMBERS;
  FiledLabels = FieldLabelsConstant.LABELS;
  Titles = FieldLabelsConstant.TITLE;
  save: boolean = true;
  update: boolean = false;
  id: number = 0;
  isSubmit: boolean = false;
  loggedUserData: any = JSON.parse(sessionStorage.getItem('userData'));
  resp: any;
  title:string;
  addDriveChecklistFormGroup: FormGroup;
  pattern = "[a-zA-Z][a-zA-Z ]*";
  measureActivityList = [];
  driveList = [];
  statusList = [];
  activityTypeList:any;
  activityPositionList:any;
  activityType:any;
  mesureList: any;
  activityTypes=[{ id: 1, activityType: 'measurement' }, { id: 2, activityType: 'activity' }];
  

  checkListFormErrors: any;
  constructor(
    private formBuilder: FormBuilder,
    private spinnerService: Ng4LoadingSpinnerService,
    private commonService: CommonService,
    private route: ActivatedRoute,
    private router: Router,
    private sendAndRequestService:SendAndRequestService
  ) {
    // Reactive form errors
    this.checkListFormErrors = {
      drive: {},
      activityType:{},
      measureActivityList: {},
      activityPositionId:{},
      displayOrder: {},
      lowerLimit: {},
      upperLimit: {},
      status: {}
    };
  }

  ngOnInit() {
    this.id = +this.route.snapshot.params['id'];
    this.getDrivesData();
    //this.findMeasureActivityListBasedOnActivityType(this.activityType);
    this.findYesNoStatus();
   
    this.findActivityPositionList();
    
  
    if (!isNaN(this.id)) {   
      this.getCheckListData(this.id);
      this.updateCheckListForm();    
      this.addDriveChecklistFormGroup.valueChanges.subscribe(() => {
        this.onFormValuesChanged();
    });
       
      this.spinnerService.show();
      this.save = false;
      this.update = true;
      this.title = Constants.EVENTS.UPDATE;
      
    } else {
      this.createCheckListForm();
      this.save = true;
      this.update = false;
      this.title = Constants.EVENTS.ADD;
    }
    
  }
  
  findYesNoStatus(){
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE_CHECK_LIST.GET_STATUS_ITEM + Constants.STATUS_ITEMS.YES_NO_TYPE)
    .subscribe((resp) => {
      this.statusList = resp;
    });
  }
  getCheckListData(id) {
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE_CHECK_LIST.GET_CHECKLIST_BY_ID +  id)
      .subscribe((resp) => {
        this.resp = resp;
        this.sendAndRequestService.requestForGET(Constants.app_urls.MASTERS.MEASURE_ACTIVITY.GET_ACTIVITYTYPE_BASED_ON_ACTIVITY_ID+this.resp.activityId['activityId']).subscribe((response) => {
          this.mesureList = response;
          if(this.mesureList) {
            this.findMeasureActivityListBasedOnActivityType(this.mesureList.activityType);
            this.addDriveChecklistFormGroup.patchValue({ activityType: this.mesureList.activityType })       	
          }
           
 });
        this.addDriveChecklistFormGroup.patchValue({
          id: this.resp.id,
          drive: this.resp.driveId['id'],
          measureActivityList: this.resp.activityId['activityId'],
          activityPositionId:this.resp.activityPositionId,
          displayOrder: this.resp.displayOrder,
          lowerLimit: this.resp.lowerLimit,
          upperLimit: this.resp.upperLimit,
          status: this.resp.active
        }); 
        this.spinnerService.hide();
      })
     
  }

  getDrivesData() {
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE.GET_DRIVES_BASED_ON_CHECKLIST).subscribe((data) => {
      this.driveList = data;
      this.spinnerService.hide();
    }, error => {
      this.spinnerService.hide();
    });
  }

  findActivityPositionList()
  {
      this.sendAndRequestService.requestForGET(Constants.app_urls.CONFIG.ASSET_SCH_ACTIVITY_ASSOC.GET_MEASURES)
      .subscribe((resp) => {
      this.activityPositionList = resp;
      });
  }

  // findActivityTypeList()
  // {
  //     this.sendAndRequestService.requestForGET(Constants.app_urls.MASTERS.MEASURE_ACTIVITY.GET_MEASURE)
  //     .subscribe((resp) => {
  //     this.activityTypeList = resp;
  //     });
  // }

  findMeasureActivityListBasedOnActivityType(activityType: string) { 
    this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_ACTIVITY_NAME_BASED_ON_ACTIVITY_TYPE+activityType).subscribe((data) => {
      this.measureActivityList = data;
      this.spinnerService.hide();
    }, error => {
      this.spinnerService.hide();
    });
  }
 

  findMeasureActivityList() { 
    this.activityType = this.addDriveChecklistFormGroup.controls['activityType'].value;   
    this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_ACTIVITY_NAME_BASED_ON_ACTIVITY_TYPE+this.activityType).subscribe((data) => {
      this.measureActivityList = data;
      this.spinnerService.hide();
    }, error => {
      this.spinnerService.hide();
    });
  }

  onFormValuesChanged() {
    for (const field in this.checkListFormErrors) {
      if (!this.checkListFormErrors.hasOwnProperty(field)) {
        continue;
      }
      this.checkListFormErrors[field] = {};
      const control = this.addDriveChecklistFormGroup.get(field);

      if (control && control.dirty && !control.valid) {
        this.checkListFormErrors[field] = control.errors;
      }
    }
  }
  updateCheckListForm() {
    this.addDriveChecklistFormGroup = this.formBuilder.group({
      id: 0,
      'drive': [null, Validators.compose([Validators.required])],
      'activityType':[null],
      'measureActivityList': [null, Validators.compose([Validators.required]),this.duplicateDriveActivityListAndId.bind(this)],
      'activityPositionId':[null,Validators.compose([Validators.required]),this.duplicateDrivePositionIdAndId.bind(this)],
      'displayOrder': [null],
      'lowerLimit': [null],
      'upperLimit': [null],
      'status': ['Yes']
    });
  }

  createCheckListForm() {
    this.addDriveChecklistFormGroup = this.formBuilder.group({
      id: 0,
      'drive': [null, Validators.compose([Validators.required])],
      'activityType':[null],
      'measureActivityList': [null, Validators.compose([Validators.required]),this.duplicateDriveActivityList.bind(this)],
      'activityPositionId':[null,Validators.compose([Validators.required]),this.duplicateDrivePositionId.bind(this)],
      'displayOrder': [null],
      'lowerLimit': [null],
      'upperLimit': [null],
      'status': ['Yes']
    });
  }
  onAddDriveChecklistFormSubmit() {
    if (this.addDriveChecklistFormGroup.invalid) {
      this.isSubmit = false;
      return;
    }
       this.spinnerService.show();
    if (this.save) {
      let save = {
        driveId: this.addDriveChecklistFormGroup.value.drive,  
        activityId: this.addDriveChecklistFormGroup.value.measureActivityList,
        activityPositionId:this.addDriveChecklistFormGroup.value.activityPositionId,
        displayOrder: this.addDriveChecklistFormGroup.value.displayOrder,
        lowerLimit: this.addDriveChecklistFormGroup.value.lowerLimit,
        upperLimit: this.addDriveChecklistFormGroup.value.upperLimit,
        active: this.addDriveChecklistFormGroup.value.status,
        "createdBy": this.loggedUserData.username,
        "createdOn": new Date()
        
      }
      this.sendAndRequestService.requestForPOST(Constants.app_urls.DRIVE.DRIVE_CHECK_LIST.SAVE_CHECK_LIST ,save, false).subscribe(response => {
        this.spinnerService.hide();
        this.resp = response;
      
        if (this.resp.code == Constants.CODES.SUCCESS) {
        this.commonService.showAlertMessage("CheckList Data saved Successfully");
        this.router.navigate(['../'], { relativeTo: this.route });
        }else{
          this.commonService.showAlertMessage("CheckList Data saving Failed.");
        }
      }, error => {
        console.log('ERROR >>> ' + error);
        this.spinnerService.hide();
        this.commonService.showAlertMessage("CheckList Data saving Failed.");
      })
    } else if (this.update) {
      let update = {
        id: this.id,
        driveId: this.addDriveChecklistFormGroup.value.drive,
        activityId: this.addDriveChecklistFormGroup.value.measureActivityList,
        activityPositionId:this.addDriveChecklistFormGroup.value.activityPositionId,
        displayOrder: this.addDriveChecklistFormGroup.value.displayOrder,
        lowerLimit: this.addDriveChecklistFormGroup.value.lowerLimit,
        upperLimit: this.addDriveChecklistFormGroup.value.upperLimit,
        active: this.addDriveChecklistFormGroup.value.status,
        "updatedBy": this.loggedUserData.username,
        "updatedOn": new Date()
      }
      this.sendAndRequestService.requestForPUT(Constants.app_urls.DRIVE.DRIVE_CHECK_LIST.UPDATE_CHECK_LIST ,update, false).subscribe(response => {
        this.spinnerService.hide();
        this.resp = response;
        if (this.resp.code == Constants.CODES.SUCCESS) {
        this.commonService.showAlertMessage("CheckList Data Updated Successfully");
        this.router.navigate(['../'], { relativeTo: this.route });
        }else{
          this.commonService.showAlertMessage("CheckList Data Updation Failed.");
        }
      }, error => {
        console.log('ERROR >>> ' + error);
        this.spinnerService.hide();
        this.commonService.showAlertMessage("CheckList Data Updation Failed.");
      })
    }
  }
  onGoBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
  
  duplicateDriveActivityList() {
    let driveId= this.addDriveChecklistFormGroup.controls['drive'].value;
    let activityId = this.addDriveChecklistFormGroup.controls['measureActivityList'].value;
    
   const q = new Promise((resolve, reject) => {          

       this.sendAndRequestService.requestForGET(
              Constants.app_urls.DRIVE.DRIVE_CHECK_LIST. EXIST_DRIVE_ACTIVITYLIST+driveId+'/'+activityId).subscribe
              ((duplicate) => {
        if (duplicate) {
          resolve({ 'duplicateDriveActivityList': true });
        } else {
          resolve(null);
        }
      }, () => { resolve({ 'duplicateDriveActivityList': true }); });
    });
    return q;
  }

  duplicateDrivePositionId() {
    let driveId= this.addDriveChecklistFormGroup.controls['drive'].value;
    let activityPositionId = this.addDriveChecklistFormGroup.controls['activityPositionId'].value;
    const q = new Promise((resolve, reject) => {          

       this.sendAndRequestService.requestForGET(
              Constants.app_urls.DRIVE.DRIVE_CHECK_LIST. EXIST_DRIVE_POSITION_ID+driveId+'/'+activityPositionId).subscribe
              ((duplicate) => {
        if (duplicate) {
          resolve({ 'duplicateDrivePositionId': true });
        } else {
          resolve(null);
        }
      }, () => { resolve({ 'duplicateDrivePositionId': true }); });
    });
    return q;
  }
  
  duplicateDriveActivityListAndId() {
    let id=this.id;
    let driveId= this.addDriveChecklistFormGroup.controls['drive'].value;
    let activityId = this.addDriveChecklistFormGroup.controls['measureActivityList'].value;
    
   const q = new Promise((resolve, reject) => {          

       this.sendAndRequestService.requestForGET(
              Constants.app_urls.DRIVE.DRIVE_CHECK_LIST. EXIST_DRIVE_ACTIVITYLIST_AND_ID+id+'/'+driveId+'/'+activityId).subscribe
              ((duplicate) => {
        if (duplicate) {
          resolve({ 'duplicateDriveActivityListAndId': true });
        } else {
          resolve(null);
        }
      }, () => { resolve({ 'duplicateDriveActivityListAndId': true }); });
    });
    return q;
  }

  duplicateDrivePositionIdAndId() {
    let id=this.id;
    let driveId= this.addDriveChecklistFormGroup.controls['drive'].value;
    let activityPositionId = this.addDriveChecklistFormGroup.controls['activityPositionId'].value;   
   

    const q = new Promise((resolve, reject) => {          

       this.sendAndRequestService.requestForGET(
              Constants.app_urls.DRIVE.DRIVE_CHECK_LIST. EXIST_DRIVE_POSITION_ID_AND_ID+id+'/'+driveId+'/'+activityPositionId).subscribe
              ((duplicate) => {
        if (duplicate) {
          resolve({ 'duplicateDrivePositionIdAndId': true });
        } else {
          resolve(null);
        }
      }, () => { resolve({ 'duplicateDrivePositionIdAndId': true }); });
    });
    return q;
  }
}
