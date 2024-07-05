import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from 'src/app/common/constants';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';


@Component({
  selector: 'app-add-alert-group',
  templateUrl: './add-alert-group.component.html'
})
export class AddAlertGroupComponent implements OnInit {

  FiledLabels = FieldLabelsConstant.LABELS;
  Titles = FieldLabelsConstant.TITLE;
  save: boolean = true;
  update: boolean = false;
  id: number = 0;
  isSubmit: boolean = false;
  loggedUserData: any = JSON.parse(sessionStorage.getItem('userData'));
  resp: any;
  title:string = Constants.EVENTS.ADD;
  addAlertGroupFormGroup: FormGroup;
  alertGroupFormErrors:any;
  pattern = "[a-zA-Z][a-zA-Z ]*";
  
  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private spinnerService: Ng4LoadingSpinnerService,
    private commonService: CommonService,
    private router: Router,
    private sendAndRequestService:SendAndRequestService
  ) {
    this.alertGroupFormErrors = {            
      name:{},
      description:{},
      level:{}
    };
  }

  ngOnInit() {
    this.id = +this.route.snapshot.params['id'];
    if (!isNaN(this.id)) {  
      this.updateAlertGroupForm();  
      this.addAlertGroupFormGroup.valueChanges.subscribe(() => {
        this.onFormValuesChanged();
      }); 
      this.spinnerService.show();
      this.save = false;
      this.update = true;
      this.title = Constants.EVENTS.UPDATE;
       this.getAlertGroupDataById(this.id);
    } else {
      this.createAlertGroupForm();
      this.save = true;
      this.update = false;
      this.title = Constants.EVENTS.ADD;
    }
  }
  
  onFormValuesChanged() {
    for (const field in this.alertGroupFormErrors) {
      if (!this.alertGroupFormErrors.hasOwnProperty(field)) {
        continue;
      }
      this.alertGroupFormErrors[field] = {};
      const control = this.addAlertGroupFormGroup.get(field);
      if (control && control.dirty && !control.valid) {
        this.addAlertGroupFormGroup[field] = control.errors;
      }
    }
  }
  createAlertGroupForm() {
    this.addAlertGroupFormGroup = this.formBuilder.group({
      id: 0,
      'name':[null, Validators.compose([Validators.required, Validators.maxLength(250)]), this.duplicateName.bind(this)],
      'description': [null, Validators.compose([Validators.required, Validators.maxLength(250)]), this.duplicateDescription.bind(this)],
      'level': [null, Validators.compose([Validators.required, Validators.maxLength(255)])]

    });
  } 
  updateAlertGroupForm() {
    this.addAlertGroupFormGroup = this.formBuilder.group({
      id: 0,
      'name':[null, Validators.compose([Validators.required, Validators.maxLength(250)]), this.duplicateNameAndId.bind(this)],
      'description': [null, Validators.compose([Validators.required, Validators.maxLength(250)]), this.duplicateDescriptionAndId.bind(this)],
      'level': [null, Validators.compose([Validators.required, Validators.maxLength(255)])]
    });
  }
  

   public get f() { return this.addAlertGroupFormGroup.controls; } 
   
  getAlertGroupDataById(id) {
    this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP.GET_ALERT_GROUP_ID+id)
    .subscribe((resp) => {
        this.resp = resp;
        this.addAlertGroupFormGroup.patchValue({
          id: this.resp.id,
          name: this.resp.name,
          description: this.resp.description,
          level: this.resp.level,
        });
        this.spinnerService.hide();
      })
  }
  onAddAlertGroupFormSubmit() {
    this.isSubmit = true;
    if (this.addAlertGroupFormGroup.invalid) {
      this.isSubmit = false;
      return;
    }
    this.spinnerService.show();
    if (this.save) {
      var saveAlertGroupModel = {
        "name": this.addAlertGroupFormGroup.value.name,
        "description": this.addAlertGroupFormGroup.value.description, 
        "level": this.addAlertGroupFormGroup.value.level,
        
      }
      this.sendAndRequestService.requestForPOST(Constants.app_urls.ALERTS.ALERT_GROUP.SAVE_ALERT_GROUP, saveAlertGroupModel, false).subscribe(response => {
        this.spinnerService.hide();
        this.resp = response;
     
        if (this.resp.code == Constants.CODES.SUCCESS) {
          this.commonService.showAlertMessage("Alert Group  Data Saved Successfully");
          this.router.navigate(['../'], { relativeTo: this.route });
        } else {
          this.commonService.showAlertMessage("Alert Group Data Saving Failed.");
        }
      }, error => {
        console.log('ERROR >>>' + error);
        this.spinnerService.hide();
        this.commonService.showAlertMessage("Alert Group Data Saving Failed.");
      });
    } else if (this.update) {
      var updateAlertGroupModel = {
        "id": this.id,
        "name": this.addAlertGroupFormGroup.value.name,
        "description": this.addAlertGroupFormGroup.value.description, 
        "level": this.addAlertGroupFormGroup.value.level,   
      }
      this.sendAndRequestService.requestForPUT(Constants.app_urls.ALERTS.ALERT_GROUP.UPDATE_ALERT_GROUP, updateAlertGroupModel, false).subscribe(response => {
        this.spinnerService.hide();
        this.resp = response;
        if (this.resp.code == Constants.CODES.SUCCESS) {
        this.commonService.showAlertMessage("Alert Group Data Updated Successfully");
        this.router.navigate(['../'], { relativeTo: this.route });
        }else{
          this.commonService.showAlertMessage("Alert Group Data Updating Failed.");
        }
      }, error => {
        console.log('ERROR >>>' + error);
        this.spinnerService.hide();
        this.commonService.showAlertMessage("Alert Group Data Updating Failed.");
      })

    }
  }

  onGoBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
  
  duplicateName() {
    const q = new Promise((resolve, reject) => {     
      let name: string = this.addAlertGroupFormGroup.controls['name'].value;
      this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP.EXIST_NAME +name)
      .subscribe((duplicate) => {
        if (duplicate) {
          resolve({ 'duplicateName': true });
        } else {
          resolve(null);
        }
      }, () => { resolve({ 'duplicateName': true }); });
    });
    return q;
  }
  duplicateNameAndId() {
    let id=this.id;
    let name: string = this.addAlertGroupFormGroup.controls['name'].value;         

    const q = new Promise((resolve, reject) => {          

       this.sendAndRequestService.requestForGET(
              Constants.app_urls.ALERTS.ALERT_GROUP.EXIST_NAME_ID+id+'/'+name).subscribe
              ((duplicate) => {
        if (duplicate) {
          resolve({ 'duplicateNameAndId': true });
        } else {
          resolve(null);
        }
      }, () => { resolve({ 'duplicateNameAndId': true }); });
    });
    return q;
  }
  duplicateDescription() {
    const q = new Promise((resolve, reject) => {     
      let description: string = this.addAlertGroupFormGroup.controls['description'].value;
      this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP.EXIST_DESCRIPTION +description)
      .subscribe((duplicate) => {
        if (duplicate) {
          resolve({ 'duplicateDescription': true });
        } else {
          resolve(null);
        }
      }, () => { resolve({ 'duplicateDescription': true }); });
    });
    return q;
  }
  duplicateDescriptionAndId() {
    let id=this.id;
    let description: string = this.addAlertGroupFormGroup.controls['description'].value;         

    const q = new Promise((resolve, reject) => {          

       this.sendAndRequestService.requestForGET(
              Constants.app_urls.ALERTS.ALERT_GROUP.EXIST_DESCRIPTION_ID+id+'/'+description).subscribe
              ((duplicate) => {
        if (duplicate) {
          resolve({ 'duplicateNameAndId': true });
        } else {
          resolve(null);
        }
      }, () => { resolve({ 'duplicateNameAndId': true }); });
    });
    return q;
  }

}