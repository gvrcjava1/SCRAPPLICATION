import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from 'src/app/common/constants';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';


@Component({
  selector: 'app-add-alert-group-member',
  templateUrl: './add-alert-group-member.component.html'
})
export class AddAlertGroupMemberComponent implements OnInit {

  FiledLabels = FieldLabelsConstant.LABELS;
  Titles = FieldLabelsConstant.TITLE;
  save: boolean = true;
  update: boolean = false;
  id: number = 0;
  isSubmit: boolean = false;
  loggedUserData: any = JSON.parse(sessionStorage.getItem('userData'));
  resp: any;
  alertGroupData:any;
  alertData:any
  receipentsIdData:any;
  receipentsData:any;
  title:string = Constants.EVENTS.ADD;
  addAlertGroupMemberFormGroup: FormGroup;
  alertGroupMemberFormErrors:any;
  pattern = "[a-zA-Z][a-zA-Z ]*";
  
  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private spinnerService: Ng4LoadingSpinnerService,
    private commonService: CommonService,
    private router: Router,
    private sendAndRequestService:SendAndRequestService
  ) {
    this.alertGroupMemberFormErrors = {            
      name:{},
      description:{},
      alertGroupId:{}
    };
  }

  ngOnInit() {
    this.alertGroupDetails();
    this.receipentsIdpDetails();
    this.id = this.route.snapshot.params['id'];
    if (!isNaN(this.id)) {  
      this.updateAlertGroupMemberForm();  
      this.addAlertGroupMemberFormGroup.valueChanges.subscribe(() => {
        this.onFormValuesChanged();
      }); 
      this.spinnerService.show();
      this.save = false;
      this.update = true;
      this.title = Constants.EVENTS.UPDATE;
       this.getAlertGroupMemberDataById(this.id);
    } else {
      this.createAlertGroupMemberForm();
      this.save = true;
      this.update = false;
      this.title = Constants.EVENTS.ADD;
    }
  }
  
  onFormValuesChanged() {
    for (const field in this.alertGroupMemberFormErrors) {
      if (!this.alertGroupMemberFormErrors.hasOwnProperty(field)) {
        continue;
      }
      this.alertGroupMemberFormErrors[field] = {};
      const control = this.addAlertGroupMemberFormGroup.get(field);
      if (control && control.dirty && !control.valid) {
        this.addAlertGroupMemberFormGroup[field] = control.errors;
      }
    }
  }
  createAlertGroupMemberForm() {
    this.addAlertGroupMemberFormGroup = this.formBuilder.group({
      id: 0,
      'name':[null, Validators.compose([Validators.required, Validators.maxLength(250)]), this.duplicateName.bind(this)],
      'description': [null, Validators.compose([Validators.required, Validators.maxLength(250)]), this.duplicateDescription.bind(this)],
      'alertGroupId':[null, Validators.required ],
      'receipentsId':[null, Validators.required]

    });
  }
  updateAlertGroupMemberForm() {
    this.addAlertGroupMemberFormGroup = this.formBuilder.group({
      id: 0,
      'name':[null, Validators.compose([Validators.required, Validators.maxLength(250)]), this.duplicateNameAndId.bind(this)],
      'description': [null, Validators.compose([Validators.required, Validators.maxLength(250)]), this.duplicateDescriptionAndId.bind(this)],
      'alertGroupId':[null, Validators.required ],
      'receipentsId':[null, Validators.required]
    });
  }
  

   public get f() { return this.addAlertGroupMemberFormGroup.controls; } 
   
  getAlertGroupMemberDataById(id) {
    this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.GET_ALERT_GROUP_MEMBER_ID+this.id)
    .subscribe((resp) => {
        this.resp = resp;
        this.addAlertGroupMemberFormGroup.patchValue({
          id: this.resp.id,
          name: this.resp.name,
          description: this.resp.description,
          alertGroupId:this.resp.alertGroupId.id,
          receipentsId:this.resp.userId.id
        });
        this.spinnerService.hide();
        this.getAlertGroupData();
        this.getReceipentsIdData();
      })
  }
  onAddAlertGroupMemberFormSubmit() {
    this.isSubmit = true;
    if (this.addAlertGroupMemberFormGroup.invalid) {
      this.isSubmit = false;
      return;
    }
    this.spinnerService.show();
    if (this.save) {
      var saveAlertGroupMemberModel = {
        "name": this.addAlertGroupMemberFormGroup.value.name,
        "description": this.addAlertGroupMemberFormGroup.value.description, 
        "alertGroupId":this.alertData,
        "receipentsId":this.receipentsIdData
        
      }
      this.sendAndRequestService.requestForPOST(Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.SAVE_ALERT_GROUP_MEMBER, saveAlertGroupMemberModel, false).subscribe(response => {
        this.spinnerService.hide();
        this.resp = response;
     
        if (this.resp.code == Constants.CODES.SUCCESS) {
          this.commonService.showAlertMessage("Alert Group Member Data Saved Successfully");
          this.router.navigate(['../'], { relativeTo: this.route });
        } else {
          this.commonService.showAlertMessage("Alert Group Member Data Saving Failed.");
        }
      }, error => {
        console.log('ERROR >>>' + error);
        this.spinnerService.hide();
        this.commonService.showAlertMessage("Alert Group Data Saving Failed.");
      });
    } else if (this.update) {
      var updateAlertGroupMemberModel = {
        "id": this.id,
        "name": this.addAlertGroupMemberFormGroup.value.name,
        "description": this.addAlertGroupMemberFormGroup.value.description, 
        "alertGroupId":this.alertData,
        "receipentsId":this.receipentsIdData
      }
      this.sendAndRequestService.requestForPUT(Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.UPDATE_ALERT_GROUP_MEMBER, updateAlertGroupMemberModel, false).subscribe(response => {
        this.spinnerService.hide();
        this.resp = response;
        if (this.resp.code == Constants.CODES.SUCCESS) {
        this.commonService.showAlertMessage("Alert Group Member Data Updated Successfully");
        this.router.navigate(['../'], { relativeTo: this.route });
        }else{
          this.commonService.showAlertMessage("Alert Group Member Data Updating Failed.");
        }
      }, error => {
        console.log('ERROR >>>' + error);
        this.spinnerService.hide();
        this.commonService.showAlertMessage("Alert Group Member Data Updating Failed.");
      })

    }
  }

  onGoBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
  getAlertGroupData() {
    this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP.GET_ALERT_GROUP_ID+this.addAlertGroupMemberFormGroup.value.alertGroupId).subscribe((data) => {
         this.alertData = data;
     });
  }
  alertGroupDetails()
  {  
         this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP.GET_ALERT_GROUP).subscribe((data) => {
           this.alertGroupData = data;
  }
         );

 }
 getReceipentsIdData() {
  this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.GET_RECEIPENTS_ID+this.addAlertGroupMemberFormGroup.value.receipentsId).subscribe((data) => {
       this.receipentsIdData = data;
   });
}
receipentsIdpDetails()
{  
       this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.GET_RECEIPENTS).subscribe((data) => {
         this.receipentsData = data;
}
       );

}
  duplicateName() {
    const q = new Promise((resolve, reject) => {     
      let name: string = this.addAlertGroupMemberFormGroup.controls['name'].value;
      this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.EXIST_NAME +name)
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
    let name: string = this.addAlertGroupMemberFormGroup.controls['name'].value;         

    const q = new Promise((resolve, reject) => {          

       this.sendAndRequestService.requestForGET(
              Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.EXIST_NAME_ID+id+'/'+name).subscribe
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
      let description: string = this.addAlertGroupMemberFormGroup.controls['description'].value;
      this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.EXIST_DESCRIPTION +description)
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
    let description: string = this.addAlertGroupMemberFormGroup.controls['description'].value;         

    const q = new Promise((resolve, reject) => {          

       this.sendAndRequestService.requestForGET(
              Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.EXIST_DESCRIPTION_ID+id+'/'+description).subscribe
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
    
    duplicateNameAndGroupAndRecipient() {
        if( this.addAlertGroupMemberFormGroup.controls['alertGroupId'].value && this.addAlertGroupMemberFormGroup.controls['receipentsId'].value ) {
            const q = new Promise((resolve, reject) => {     
              let name: string = this.addAlertGroupMemberFormGroup.controls['name'].value;
              this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.EXIST_NAME_AND_GROUP_AND_RECIPIENT +name+'/'+this.addAlertGroupMemberFormGroup.controls['alertGroupId'].value+'/'+this.addAlertGroupMemberFormGroup.controls['receipentsId'].value)
              .subscribe((duplicate) => {
                if (duplicate) {
                  resolve({ 'duplicateNameAndGroupAndRecipient': true });
                } else {
                  resolve(null);
                }
              }, () => { resolve({ 'duplicateNameAndGroupAndRecipient': true }); });
            });
            return q;    
        }
        
    }
    
    duplicateNameAndGroupAndRecipientAndId(){
        const q = new Promise((resolve, reject) => {     
              let name: string = this.addAlertGroupMemberFormGroup.controls['name'].value;
              this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.EXIST_NAME_AND_GROUP_AND_RECIPIENT_AND_ID +name+'/'+this.addAlertGroupMemberFormGroup.controls['alertGroupId'].value+'/'+this.addAlertGroupMemberFormGroup.controls['receipentsId'].value+'/'+this.resp.id)
              .subscribe((duplicate) => {
                if (duplicate) {
                  resolve({ 'duplicateNameAndGroupAndRecipient': true });
                } else {
                  resolve(null);
                }
              }, () => { resolve({ 'duplicateNameAndGroupAndRecipient': true }); });
            });
            return q;
    }

}