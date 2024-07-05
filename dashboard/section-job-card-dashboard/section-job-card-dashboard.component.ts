import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { Constants } from 'src/app/common/constants';
import { DatePipe } from '@angular/common';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';

@Component({
  selector: 'app-section-job-card-dashboard',
  templateUrl: './section-job-card-dashboard.component.html',
  styleUrls: ['./section-job-card-dashboard.component.css']
})
    
export class SectionJobCardDashboardComponent implements OnInit {

  
    sectionJobCardData: any;
    loggedUserData: any = JSON.parse(sessionStorage.getItem('userData'));
    userDefaultData: any;
    enggSectionList: any;
    displayColumns = ['loco', 'schedule', 'beforeSchedule', 'afterSchedule', 'verification','postReady'];
    FiledLabels = FieldLabelsConstant.LABELS;
    columns = [{id:1,content:'red'},{id:2,content:'blue'},{id:3,content:'red'},{id:4,content:'blue'},{id:5,content:'red'},{id:6,content:'blue'}]
    sectionJobCardStatusTypes: any;
    LocoJobcardStatusTypes: any;

    constructor(
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private spinnerService: Ng4LoadingSpinnerService,
      private commonService: CommonService,
      private router: Router,
      private datePipe: DatePipe,
      private sendAndRequestService: SendAndRequestService
  ) {
  
  }
  
  ngOnInit() {
      this.getSectionData();
      this.getEnggSectionsData();
      this.getStatusItemAdditionalAttributes();
      this.getLocoStatusAttributes();
  }
  
  getSectionData() {
      this.sendAndRequestService.requestForGET(Constants.app_urls.SECTION_JOB_CARD.GET_SECTION_JOB_CARD_DATA_BASED_ON_USER_LOGIN+ this.loggedUserData.username).subscribe((data) => {
          this.sectionJobCardData = data;
          //console.log('*** SECTION JOB CARD DATA ***'+JSON.stringify(this.sectionJobCardData));
      });
  }
    
  getEnggSectionsData(){
    this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_USER_DEFAULT_DATA + this.loggedUserData.username).subscribe((data) => {
      this.userDefaultData = data;
      if(this.userDefaultData) {
        this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.ENGINEERING_SECTION.GET_ENGG_SEC_BASED_ON_SHED + this.userDefaultData.facilityId)
            .subscribe((resp) => {
              this.enggSectionList = resp;
                //console.log('*** engg section ***'+JSON.stringify(this.enggSectionList));
            });      
      }   
     
  });
  
      
  }
    
  getStatusItemAdditionalAttributes() {
      this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_STATUS_ITEM_ADDITIONAL_ATTRIBUTES_DATA_BASED_ON_STATUS_TYPE_ID+ Constants.ELS.SECTION_JOBCARD_STATUS_TYPES ).subscribe((data) => {
          this.sectionJobCardStatusTypes = data;
      });
  }
  
  getLocoStatusAttributes() {
      this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_STATUS_ITEM_ADDITIONAL_ATTRIBUTES_DATA_BASED_ON_STATUS_TYPE_ID+ Constants.ELS.LOCO_JOBCARD_STATUS_TYPES ).subscribe((data) => {
          this.LocoJobcardStatusTypes = data;
      });
  }
    
}

  
