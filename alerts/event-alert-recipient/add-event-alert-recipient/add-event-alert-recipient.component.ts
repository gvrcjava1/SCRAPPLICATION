import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from 'src/app/common/constants';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';


@Component({
  selector: 'app-add-event-alert-recipient',
  templateUrl: './add-event-alert-recipient.component.html'
})
export class AddEventAlertRecipientComponent implements OnInit {

  FiledLabels = FieldLabelsConstant.LABELS;
  Titles = FieldLabelsConstant.TITLE;
  save: boolean = true;
  update: boolean = false;
  id: number = 0;
  isSubmit: boolean = false;
  loggedUserData: any = JSON.parse(sessionStorage.getItem('userData'));
  resp: any;
  alertGroupData:any;
  alertGroupMemberData:any;
  alertData:any
  alertMemberData:any;
  eventTypeData:any;
  eventTypeList:any;
  title:string = Constants.EVENTS.ADD;
  addEventAlertRecipientFormGroup: FormGroup;
  eventAlertRecepientFormErrors:any;
  pattern = "[a-zA-Z][a-zA-Z ]*";
  
  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private spinnerService: Ng4LoadingSpinnerService,
    private commonService: CommonService,
    private router: Router,
    private sendAndRequestService:SendAndRequestService
  ) {
    this.eventAlertRecepientFormErrors = {            
      name:{},
      description:{},
      alertGroupId:{}
    };
  }

  ngOnInit() {
    this.alertGroupDetails();
    this.eventTypeDetails();
    this.alertGroupMemberDetails();
    this.id = +this.route.snapshot.params['id'];
    if (!isNaN(this.id)) {  
      this.updateEventAlertRecipientForm();  
      this.addEventAlertRecipientFormGroup.valueChanges.subscribe(() => {
        this.onFormValuesChanged();
      }); 
      this.spinnerService.show();
      this.save = false;
      this.update = true;
      this.title = Constants.EVENTS.UPDATE;
       this.getEventAlertRecipientDataById(this.id);
    } else {
      this.createEventAlertRecipientForm();
      this.save = true;
      this.update = false;
      this.title = Constants.EVENTS.ADD;
    }
  }
  
  onFormValuesChanged() {
    for (const field in this.eventAlertRecepientFormErrors) {
      if (!this.eventAlertRecepientFormErrors.hasOwnProperty(field)) {
        continue;
      }
      this.eventAlertRecepientFormErrors[field] = {};
      const control = this.addEventAlertRecipientFormGroup.get(field);
      if (control && control.dirty && !control.valid) {
        this.addEventAlertRecipientFormGroup[field] = control.errors;
      }
    }
  }
  createEventAlertRecipientForm() {
    this.addEventAlertRecipientFormGroup = this.formBuilder.group({
      id: 0,
      'name':[null, Validators.compose([Validators.required, Validators.maxLength(250)]), this.duplicateName.bind(this)],
      'description': [null, Validators.compose([Validators.required, Validators.maxLength(250)]), this.duplicateDescription.bind(this)],
      'eventTypeId':[null,Validators.required],
      'alertGroupId':[null,Validators.required, this.duplicateEventTypeIdAlertGroupId.bind(this)],
      //'alertGroupMemberId':[null,Validators.compose([Validators.required]), this.duplicateEventTypeIdAlertGroupIdAlertGroupMember.bind(this)],
      'alertGroupMemberId':[null,Validators.compose([Validators.required])],
    });
  }
  updateEventAlertRecipientForm() {
    this.addEventAlertRecipientFormGroup = this.formBuilder.group({
      id: 0,
      'name':[null, Validators.compose([Validators.required, Validators.maxLength(250)]), this.duplicateNameAndId.bind(this)],
      'description': [null, Validators.compose([Validators.required, Validators.maxLength(250)]), this.duplicateDescriptionAndId.bind(this)],
      'eventTypeId':[null, Validators.required],
      'alertGroupId':[null,Validators.required, this.duplicateEventTypeIdAlertGroupIdAndId.bind(this)],
      //'alertGroupMemberId':[null,Validators.compose([Validators.required]), this.duplicateEventTypeIdAlertGroupIdAlertGroupMemberAndId.bind(this)],
      'alertGroupMemberId':[null,Validators.compose([Validators.required])],
    });
  }
  

   public get f() { return this.addEventAlertRecipientFormGroup.controls; } 
   
  getEventAlertRecipientDataById(id) {
    this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.EVENT_ALERT_RECIPIENT.GET_EVENT_ALERT_RECIPIENT_ID+id)
    .subscribe((resp) => {
        this.resp = resp;
        this.addEventAlertRecipientFormGroup.patchValue({
          id: this.resp.id,
          name: this.resp.name,
          description: this.resp.description,
          eventTypeId:this.resp.eventTypeId.id,
          alertGroupId:this.resp.alertGroupId.id,
          alertGroupMemberId:this.resp.alertGroupMemberId.id,
        });
        this.spinnerService.hide();
        this.getAlertGroupData();
        this.getAlertGroupMemberData();
        this.getEventTypeData();
      })
  }
  onAddEventAlertRecipientFormSubmit() {
    this.isSubmit = true;
    if (this.addEventAlertRecipientFormGroup.invalid) {
      this.isSubmit = false;
      return;
    }
    this.spinnerService.show();
    if (this.save) {
      var saveEventAlertRecipientModel = {
        "name": this.addEventAlertRecipientFormGroup.value.name,
        "description": this.addEventAlertRecipientFormGroup.value.description, 
        "eventTypeId":this.eventTypeList,
        "alertGroupId":this.alertData,
        "alertGroupMemberId":this.alertMemberData,        
      }
      this.sendAndRequestService.requestForPOST(Constants.app_urls.ALERTS.EVENT_ALERT_RECIPIENT.SAVE_EVENT_ALERT_RECIPIENT, saveEventAlertRecipientModel, false).subscribe(response => {
        this.spinnerService.hide();
        this.resp = response;
     
        if (this.resp.code == Constants.CODES.SUCCESS) {
          this.commonService.showAlertMessage("Event Alert Recipient Data Saved Successfully");
          this.router.navigate(['../'], { relativeTo: this.route });
        } else {
          this.commonService.showAlertMessage("Event Alert Recipient Data Saving Failed.");
        }
      }, error => {
        console.log('ERROR >>> ' + error);
        this.spinnerService.hide();
        this.commonService.showAlertMessage("Event Alert Recipient Saving Failed.");
      });
    } else if (this.update) {
      var updateEventAlertRecipientModel = {
        "id": this.id,
        "name": this.addEventAlertRecipientFormGroup.value.name,
        "description": this.addEventAlertRecipientFormGroup.value.description, 
        "eventTypeId":this.eventTypeList,
        "alertGroupId":this.alertData,
        "alertGroupMemberId":this.alertMemberData,
      }
      this.sendAndRequestService.requestForPUT(Constants.app_urls.ALERTS.EVENT_ALERT_RECIPIENT.UPDATE_EVENT_ALERT_RECIPIENT, updateEventAlertRecipientModel, false).subscribe(response => {
        this.spinnerService.hide();
        this.resp = response;
        if (this.resp.code == Constants.CODES.SUCCESS) {
        this.commonService.showAlertMessage("Event Alert Recipient Data Updated Successfully");
        this.router.navigate(['../'], { relativeTo: this.route });
        }else{
          this.commonService.showAlertMessage("Event Alert Recipient Data Updating Failed.");
        }
      }, error => {
        console.log('ERROR >>> ' + error);
        this.spinnerService.hide();
        this.commonService.showAlertMessage("Event Alert Recipient Data Updating Failed.");
      })

    }
    
  }

  onGoBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
  getAlertGroupData() {
    this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP.GET_ALERT_GROUP_ID+this.addEventAlertRecipientFormGroup.value.alertGroupId).subscribe((data) => {
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
 alertGroupMemberDetails(){

  this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.GET_ALERT_GROUP_MEMBER).subscribe((data) => {
    this.alertGroupMemberData = data;
}
  );

 }
 getAlertGroupMemberData() {
  this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.GET_ALERT_GROUP_MEMBER_ID+this.addEventAlertRecipientFormGroup.value.alertGroupMemberId).subscribe((data) => {
       this.alertMemberData = data;
   });
}
 getEventTypeData() {
  this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.EVENT_ALERT_RECIPIENT.GET_EVENT_TYPE_ID+this.addEventAlertRecipientFormGroup.value.eventTypeId).subscribe((data) => {
       this.eventTypeList = data;
   });
}
eventTypeDetails()
{  
       this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.EVENT_ALERT_RECIPIENT.GET_EVENT_TYPE).subscribe((data) => {
         this.eventTypeData = data;
}
       );

}
  duplicateEventTypeIdAlertGroupIdAlertGroupMember() {
    const q = new Promise((resolve, reject) => {
       this.sendAndRequestService.requestForGET(
              Constants.app_urls.ALERTS.EVENT_ALERT_RECIPIENT.EXIST_EVENT_TYPE_ALERT_GROUP_MEMBER +
            this.addEventAlertRecipientFormGroup.controls['eventTypeId'].value + '/'+
            this.addEventAlertRecipientFormGroup.controls['alertGroupId'].value+'/'+
            this.addEventAlertRecipientFormGroup.controls['alertGroupMemberId'].value
      ).subscribe((duplicate) => {
        if (duplicate) {
          resolve({ 'duplicate': true });
        } else {
          resolve(null);
        }
      }, () => { resolve({ 'duplicate': true }); });
    });
    return q;
    }
    duplicateEventTypeIdAlertGroupIdAlertGroupMemberAndId() {
    let id=this.id;
    let eventTypeId: string = this.addEventAlertRecipientFormGroup.controls['eventTypeId'].value;
    let alertGroupId: string = this.addEventAlertRecipientFormGroup.controls['alertGroupId'].value;
    let alertGroupMemberId: string = this.addEventAlertRecipientFormGroup.controls['alertGroupMemberId'].value;
   

    const q = new Promise((resolve, reject) => {          

       this.sendAndRequestService.requestForGET(
              Constants.app_urls.ALERTS.EVENT_ALERT_RECIPIENT.EXIST_EVENT_TYPE_ALERT_GROUP_MEMBER_ID +id+'/'+eventTypeId+'/'+alertGroupId+'/'+alertGroupMemberId).subscribe
              ((duplicate) => {
        if (duplicate) {
          resolve({ 'duplicateEventTypeIdAlertGroupIdAlertGroupMemberAndId': true });
        } else {
          resolve(null);
        }
      }, () => { resolve({ 'duplicateEventTypeIdAlertGroupIdAlertGroupMemberAndId': true }); });
    });
    return q;
  }
  duplicateName() {
    const q = new Promise((resolve, reject) => {     
      let name: string = this.addEventAlertRecipientFormGroup.controls['name'].value;
      this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.EVENT_ALERT_RECIPIENT.EXIST_NAME +name)
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
    let name: string = this.addEventAlertRecipientFormGroup.controls['name'].value;         

    const q = new Promise((resolve, reject) => {          

       this.sendAndRequestService.requestForGET(
              Constants.app_urls.ALERTS.EVENT_ALERT_RECIPIENT.EXIST_NAME_ID+id+'/'+name).subscribe
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
      let description: string = this.addEventAlertRecipientFormGroup.controls['description'].value;
      this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.EVENT_ALERT_RECIPIENT.EXIST_DESCRIPTION +description)
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
    let description: string = this.addEventAlertRecipientFormGroup.controls['description'].value;         

    const q = new Promise((resolve, reject) => {          

       this.sendAndRequestService.requestForGET(
              Constants.app_urls.ALERTS.EVENT_ALERT_RECIPIENT.EXIST_DESCRIPTION_ID+id+'/'+description).subscribe
              ((duplicate) => {
        if (duplicate) {
          resolve({ 'duplicateDescriptionAndId': true });
        } else {
          resolve(null);
        }
      }, () => { resolve({ 'duplicateDescriptionAndId': true }); });
    });
    return q;
  }
    
    duplicateEventTypeIdAlertGroupId() {
        if( this.addEventAlertRecipientFormGroup.controls['eventTypeId'].value && this.addEventAlertRecipientFormGroup.controls['alertGroupId'].value) {
            const q = new Promise((resolve, reject) => {
               this.sendAndRequestService.requestForGET(
                      Constants.app_urls.ALERTS.EVENT_ALERT_RECIPIENT.EXIST_EVENT_TYPE_ALERT_GROUP +
                    this.addEventAlertRecipientFormGroup.controls['eventTypeId'].value + '/'+
                    this.addEventAlertRecipientFormGroup.controls['alertGroupId'].value
              ).subscribe((duplicate) => {
                if (duplicate) {
                  resolve({ 'duplicateEventTypeIdAlertGroupId': true });
                } else {
                  resolve(null);
                }
              }, () => { resolve({ 'duplicateEventTypeIdAlertGroupId': true }); });
            });
            return q;            
        }
    }
    
    duplicateEventTypeIdAlertGroupIdAndId() {
        let id=this.id;
        let eventTypeId: string = this.addEventAlertRecipientFormGroup.controls['eventTypeId'].value;
        let alertGroupId: string = this.addEventAlertRecipientFormGroup.controls['alertGroupId'].value;
        const q = new Promise((resolve, reject) => {          
           this.sendAndRequestService.requestForGET(
                  Constants.app_urls.ALERTS.EVENT_ALERT_RECIPIENT.EXIST_EVENT_TYPE_ALERT_GROUP_ID_AND_ID +id+'/'+eventTypeId+'/'+alertGroupId).subscribe
                  ((duplicate) => {
            if (duplicate) {
              resolve({ 'duplicateEventTypeIdAlertGroupId': true });
            } else {
              resolve(null);
            }
          }, () => { resolve({ 'duplicateEventTypeIdAlertGroupId': true }); });
        });
        return q;
  }
}