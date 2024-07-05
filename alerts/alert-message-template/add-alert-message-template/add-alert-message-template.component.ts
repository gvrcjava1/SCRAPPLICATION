import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from 'src/app/common/constants';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';


@Component({
  selector: 'add-alert-message-template',
  templateUrl: './add-alert-message-template.component.html',
  styleUrls: []
})
export class AddAlertMessageTemplateComponent implements OnInit {
    
      FiledLabels = FieldLabelsConstant.LABELS;
      Titles = FieldLabelsConstant.TITLE;
      save: boolean = true;
      update: boolean = false;
      id: number = 0;
      isSubmit: boolean = false;
      loggedUserData: any = JSON.parse(sessionStorage.getItem('userData'));
      resp: any;
      title:string = Constants.EVENTS.ADD;
      addAlertMessageTemplateFormGroup: FormGroup;
      alertMessageTemplateFormErrors:any;
      pattern = "[a-zA-Z][a-zA-Z ]*";
      eventTypesData:any;
      
      constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private spinnerService: Ng4LoadingSpinnerService,
        private commonService: CommonService,
        private router: Router,
        private sendAndRequestService:SendAndRequestService
      ) {
        this.alertMessageTemplateFormErrors = {            
          name:{},
          description:{},
          text:{},
          data1:{},
          eventTypeId:{},
          seqNo:{}

        };
      }
    
      ngOnInit() {
          this.findEventTypes();
        this.id = +this.route.snapshot.params['id'];
        if (!isNaN(this.id)) {  
          this.updateAlertGroupForm();  
          this.addAlertMessageTemplateFormGroup.valueChanges.subscribe(() => {
            this.onFormValuesChanged();
          }); 
          this.spinnerService.show();
          this.save = false;
          this.update = true;
          this.title = Constants.EVENTS.UPDATE;
           this.getAlertMessageTemplateDataById(this.id);
        } else {
          this.createAlertGroupForm();
          this.save = true;
          this.update = false;
          this.title = Constants.EVENTS.ADD;
        }
      }
      
      onFormValuesChanged() {
        for (const field in this.alertMessageTemplateFormErrors) {
          if (!this.alertMessageTemplateFormErrors.hasOwnProperty(field)) {
            continue;
          }
          this.alertMessageTemplateFormErrors[field] = {};
          const control = this.addAlertMessageTemplateFormGroup.get(field);
          if (control && control.dirty && !control.valid) {
            this.addAlertMessageTemplateFormGroup[field] = control.errors;
          }
        }
      }
      createAlertGroupForm() {
        this.addAlertMessageTemplateFormGroup = this.formBuilder.group({
          id: 0,
          'name':[null, Validators.compose([Validators.required, Validators.maxLength(250)])],
          'description': [null, Validators.compose([Validators.required, Validators.maxLength(250)])],
          'text': [null, Validators.compose([Validators.maxLength(255)])],
          'data1':[null],
          'eventTypeId':[null,Validators.compose([Validators.required, Validators.maxLength(250)])],
          'seqNo':[null,Validators.compose([Validators.required, Validators.maxLength(250)]), this.duplicateNameAndEventTypeAndSeqNo.bind(this)]
    
        });
      }
      updateAlertGroupForm() {
        this.addAlertMessageTemplateFormGroup = this.formBuilder.group({
          id: 0,
          'name':[null, Validators.compose([Validators.required, Validators.maxLength(250)])],
          'description': [null, Validators.compose([Validators.required, Validators.maxLength(250)])],
          'text': [null, Validators.compose([Validators.maxLength(255)])],
          'data1':[null],
          'eventTypeId':[null,Validators.compose([Validators.required, Validators.maxLength(250)])],
          'seqNo':[null,Validators.compose([Validators.required, Validators.maxLength(250)]), this.duplicateNameAndEventTypeAndSeqNoAndId.bind(this)]
        });
      }
      
    
       public get f() { return this.addAlertMessageTemplateFormGroup.controls; } 
       
       findEventTypes(){       
            this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_MESSAGE_TEMPLATE.GET_EVENT_TYPE)
              .subscribe((data) => {
                this.eventTypesData = data;
              })
            
       }
       getAlertMessageTemplateDataById(id) {
        this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_MESSAGE_TEMPLATE.GET_ALERT_MESSAGE_TEMPLATE_ID+id)
        .subscribe((resp) => {
            this.resp = resp;
            this.eventTypesData.filter(value => {
              if(value.id==this.resp.eventTypeId.id){
                this.addAlertMessageTemplateFormGroup.patchValue({eventTypeId :value})
              }
          });
            this.addAlertMessageTemplateFormGroup.patchValue({
              id: this.resp.id,
              name: this.resp.name,
              description: this.resp.description,
              text: this.resp.text,
              data1:this.resp.data1,
              seqNo:this.resp.seqNo
            });
            this.spinnerService.hide();
            
          })
      }
      onAddAlertMessageTemplateFormSubmit() {
        this.isSubmit = true;
        if (this.addAlertMessageTemplateFormGroup.invalid) {
          this.isSubmit = false;
          return;
        }
        this.spinnerService.show();
        if (this.save) {
          var saveAlertMessageModel = {
            "name": this.addAlertMessageTemplateFormGroup.value.name,
            "description": this.addAlertMessageTemplateFormGroup.value.description, 
            "text": this.addAlertMessageTemplateFormGroup.value.text,
            "data1": this.addAlertMessageTemplateFormGroup.value.data1,
            "eventTypeId": this.addAlertMessageTemplateFormGroup.value.eventTypeId,
            "seqNo": this.addAlertMessageTemplateFormGroup.value.seqNo,
            
          }
          this.sendAndRequestService.requestForPOST(Constants.app_urls.ALERTS.ALERT_MESSAGE_TEMPLATE.SAVE_ALERT_MESSAGE_TEMPLATE, saveAlertMessageModel, false).subscribe(response => {
            this.spinnerService.hide();
            this.resp = response;
         
            if (this.resp.code == Constants.CODES.SUCCESS) {
              this.commonService.showAlertMessage("Alert Message Template Saved Successfully");
              this.router.navigate(['../'], { relativeTo: this.route });
            } else {
              this.commonService.showAlertMessage("Alert Message Template Data Saving Failed.");
            }
          }, error => {
            console.log('ERROR >>>' + error);
            this.spinnerService.hide();
            this.commonService.showAlertMessage("Alert Message Template Data Saving Failed.");
          });
        } else if (this.update) {
          var updateAlertMessageModel = {
            "id": this.id,
            "name": this.addAlertMessageTemplateFormGroup.value.name,
            "description": this.addAlertMessageTemplateFormGroup.value.description, 
            "text": this.addAlertMessageTemplateFormGroup.value.text,
            "data1": this.addAlertMessageTemplateFormGroup.value.data1,
            "eventTypeId": this.addAlertMessageTemplateFormGroup.value.eventTypeId,
            "seqNo": this.addAlertMessageTemplateFormGroup.value.seqNo,  
          }
          this.sendAndRequestService.requestForPUT(Constants.app_urls.ALERTS.ALERT_MESSAGE_TEMPLATE.UPDATE_ALERT_MESSAGE_TEMPLATE, updateAlertMessageModel, false).subscribe(response => {
            this.spinnerService.hide();
            this.resp = response;
            if (this.resp.code == Constants.CODES.SUCCESS) {
            this.commonService.showAlertMessage("Alert Message Template Data Updated Successfully");
            this.router.navigate(['../'], { relativeTo: this.route });
            }else{
              this.commonService.showAlertMessage("Alert Message Template Data Updating Failed.");
            }
          }, error => {
            console.log('ERROR >>>' + error);
            this.spinnerService.hide();
            this.commonService.showAlertMessage("Alert Message Template Data Updating Failed.");
          })
    
        }
      }
    
      onGoBack() {
        this.router.navigate(['../'], { relativeTo: this.route });
      }
      
      duplicateNameAndEventTypeAndSeqNo() {
        const q = new Promise((resolve, reject) => {     
          let name: string = this.addAlertMessageTemplateFormGroup.controls['name'].value;
          let eventTypeId = this.addAlertMessageTemplateFormGroup.value.eventTypeId.id;
          let seqNo = this.addAlertMessageTemplateFormGroup.controls['seqNo'].value;
          this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_MESSAGE_TEMPLATE.EXIST_NAME_EVENT_SEQ +name+'/'+eventTypeId+'/'+seqNo)
          .subscribe((duplicate) => {
            if (duplicate) {
              resolve({ 'duplicateNameAndEventTypeAndSeqNo': true });
            } else {
              resolve(null);
            }
          }, () => { resolve({ 'duplicateNameAndEventTypeAndSeqNo': true }); });
        });
        return q;
      }
      duplicateNameAndEventTypeAndSeqNoAndId() {
        let id=this.id;              
    
        const q = new Promise((resolve, reject) => { 

          let name: string = this.addAlertMessageTemplateFormGroup.controls['name'].value;
          let eventTypeId = this.addAlertMessageTemplateFormGroup.value.eventTypeId.id;
          let seqNo = this.addAlertMessageTemplateFormGroup.controls['seqNo'].value;

          this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_MESSAGE_TEMPLATE.EXIST_NAME_EVENT_SEQ_ID+id+'/' +name+'/'+eventTypeId+'/'+seqNo)
          .subscribe((duplicate) => {
            if (duplicate) {
              resolve({ 'duplicateNameAndEventTypeAndSeqNoAndId': true });
            } else {
              resolve(null);
            }
          }, () => { resolve({ 'duplicateNameAndEventTypeAndSeqNoAndId': true }); });
        });
        return q;
      }
      
    
    }



  

