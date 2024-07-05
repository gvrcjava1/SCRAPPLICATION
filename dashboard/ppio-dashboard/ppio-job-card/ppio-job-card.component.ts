import { Component, OnInit,Inject, ViewChild, ElementRef } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort,MAT_DIALOG_DATA, MatDialogRef, MatDialog,DateAdapter, MAT_DATE_FORMATS } from '@angular/material';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { Constants } from 'src/app/common/constants';
import { DatePipe } from '@angular/common';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { OWL_DATE_TIME_FORMATS } from 'ng-pick-datetime';
import { AppDateAdapter, APP_DATE_FORMATS } from 'src/app/common/date.adapter';


@Component({
  selector: 'ppio-job-card',
  templateUrl: './ppio-job-card.component.html',
  styleUrls: ['./ppio-job-card.component.scss'],
  providers: [
    {
      provide: DateAdapter, useClass: AppDateAdapter
    },
    {
      provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS
    }
  ]
})
export class PpioJobCardComponent implements OnInit {

  FiledLabels = FieldLabelsConstant.LABELS;
  Titles = FieldLabelsConstant.TITLE;  
  displayedColumns = ['assetType','position','serialNumber','observation','kind','assignedTo','compliance','workDone'];
  historyDisplayedColumns=['sno','updatedOn','updatedBy','status'];
  inwardLocoList : any;
  dataSource: MatTableDataSource<any>;
  historyDataSource: MatTableDataSource<any>;
  loco: any;
  dateCreated: any;
  schedule: any;
  createdBy: any;  
    enggSecList: any;
    testedBy1:any;
    secJobcardId:any;
    dateIssued:any;
    issuedBy:any;
    testedBy2:any;    
    loggedUserData: any = JSON.parse(sessionStorage.getItem('userData'));
    enggSectionsData: any = JSON.parse(sessionStorage.getItem('enggSectionsList'));
    userDefaultData: any;
    resp: any;    
    sectionJobcardData:any;
    engineeringSection: any;
    equipmentsList:any;
    employeeList:any;
    statusList:any;
    permission:boolean;
    remarks:any;
    targetDate:any;
    updatedOn:any;
    returnedBy:any;
    status:any;
    sectionJobs =[];
    savePermission:any;
    acknowledgePermission:any;
    complianceList:any;
    label1="JobCard";
    label2="History";
    historyList:any;
    historyData =[];
    enableAdditionalJobs:boolean;
    assetTypeList:any;
    maxDate = new Date();
    jobCardActivityCategoryList: any;
    ACTIVITY_CATEGORY = Constants.ACTIVITY_CATEGORY;
    abnormalityDataArray = [];
    abnormalitydataSource: MatTableDataSource<any>;
    insCheckListArray = [];
    insCheckListdataSource: MatTableDataSource<any>;
    memoArray = [];
    memoDataSource: MatTableDataSource<any>;
    onlineFailuresArray = [];
    onlineFailuresDataSource:  MatTableDataSource<any>;
     obsArray = [];
    observationdataSource: MatTableDataSource<any>;
    ObsLength: any;
    abnormalityLength: any;
    insCheckListLength: any;
    memosLength: any;
    onlineFailuresLength: any;
    isOpen: boolean = false;
    enableExpand: boolean = true;
    enableCollapse: boolean = false;
    
  constructor(
    private spinnerService: Ng4LoadingSpinnerService,
    private commonService: CommonService,
    private sendAndRequestService: SendAndRequestService,
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    public dialog: MatDialog,
    private formBuilder: FormBuilder,
    private location: Location,
  ) { }


  ngOnInit() {   
    this.getSectionJobcardData(); 
    this.getJobCardActivityCategory();  
  }
    
  toggleExpansion() {
      this.isOpen = !this.isOpen;
      this.enableExpand = !this.enableExpand;
      this.enableCollapse = !this.enableCollapse;
  }
    
  getJobCardActivityCategory() {
      this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_STATUS_ITEM_ADDITIONAL_ATTRIBUTES_DATA_BASED_ON_STATUS_TYPE_ID + Constants.ELS.JOB_CARD_ACTIVITY_CATEGORY).subscribe((data) => {
          this.jobCardActivityCategoryList = data;
      });
  }
    
  getSectionJobcardData(){
    const sectionJobCard: any [] = [];
    this.secJobcardId = this.route.snapshot.params['id'];
    this.sendAndRequestService.requestForGET(Constants.app_urls.SECTION_JOB_CARD.GET_SECTION_JOB_CARD_DATA_BASED_ON_JOB_CARD+this.secJobcardId)
    .subscribe((resp) => {
      this.sectionJobcardData = resp;      
      if(this.resp){
      //  console.log("engggsec=="+ this.engineeringSection)
        this.enableAdditionalJobs = true;
      }     
      for(let i = 0;   i < this.sectionJobcardData.length ; i++) {
          if (this.sectionJobcardData[i].emuId) {
              this.obsArray.push(this.sectionJobcardData[i]);
          } else if (this.sectionJobcardData[i].abnrmlRegisterId) {
              this.abnormalityDataArray.push(this.sectionJobcardData[i]);
          } else if (this.sectionJobcardData[i].insCheckListId) {
              this.insCheckListArray.push(this.sectionJobcardData[i]);
          } else if (this.sectionJobcardData[i].memoId) {
              this.memoArray.push(this.sectionJobcardData[i]);
          } else if (this.sectionJobcardData[i].onlineFailuresId) {
              this.onlineFailuresArray.push(this.sectionJobcardData[i]);
          }
        this.loco = this.sectionJobcardData[i].locoId;
        this.sectionJobcardData[i].sno = i + 1;
      this.schedule = this.sectionJobcardData[i].schedule;
      this.engineeringSection = this.sectionJobcardData[i].engineeringSection;
      this.testedBy1 = this.sectionJobcardData[i].testedBy1;
      this.testedBy2 = this.sectionJobcardData[i].testedBy2;
      this.createdBy= this.sectionJobcardData[i].createdBy;
      this.dateCreated =this.datePipe.transform(this.sectionJobcardData[i].dateCreated, 'dd-MM-yyyy HH:mm:ss');
      this.issuedBy = this.sectionJobcardData[i].issuedBy;
      this.dateIssued = this.datePipe.transform(this.sectionJobcardData[i].dateIssued, 'dd-MM-yyyy HH:mm:ss');
       this.savePermission = this.sectionJobcardData[i].savePermission;
       this.acknowledgePermission = this.sectionJobcardData[i].acknowledgePermission;
       this.targetDate =this.datePipe.transform(this.sectionJobcardData[i].targetDate, 'dd-MM-yyyy HH:mm:ss');
       this.remarks = this.sectionJobcardData[i].remarks;
       this.updatedOn = this.datePipe.transform(this.sectionJobcardData[i].updatedOn, 'dd-MM-yyyy HH:mm:ss');
        this.returnedBy = this.sectionJobcardData[i].returnedBy;
        this.status = this.sectionJobcardData[i].status;
      
       sectionJobCard.push(this.sectionJobcardData[i]);
      }
      this.findEquipments();
      this.findEmployees();
      this.findStatus();
      this.ObsLength = this.obsArray.length;
      this.abnormalityLength = this.abnormalityDataArray.length;
      this.insCheckListLength = this.insCheckListArray.length;
      this.memosLength = this.memoArray.length;
      this.onlineFailuresLength = this.onlineFailuresArray.length;
      this.observationdataSource = new MatTableDataSource(this.obsArray);
      this.abnormalitydataSource = new MatTableDataSource(this.abnormalityDataArray);
      this.insCheckListdataSource = new MatTableDataSource(this.insCheckListArray);
      this.memoDataSource = new MatTableDataSource(this.memoArray);
      this.onlineFailuresDataSource = new MatTableDataSource(this.onlineFailuresArray);
      this.dataSource = new MatTableDataSource(sectionJobCard);
     
  }); 
  }
  findEquipments(){
    this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_EQUIPMENTS_BASEDON_LOCO_ANDENGGSECTION+this.loco+'/'+this.engineeringSection).subscribe((data) =>{
      this.equipmentsList = data;
      //console.log("equipments==="+JSON.stringify( this.equipmentsList));
      this.spinnerService.hide();
        }, error => {
      this.spinnerService.hide();
      }) 
  }  
  findEmployees()
{
  this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_USER_DEFAULT_DATA + this.loggedUserData.username).subscribe((data) => {
    this.userDefaultData = data;
  this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.EMPLOYEE.GET_EMPLOYESS_BAESD_ON_ENGG_SECTION_AND_FACILITYID+this.engineeringSection+'/'+this.userDefaultData.facilityId).subscribe((data) =>{
    this.employeeList = data;
   // console.log("employeeList==="+JSON.stringify( this.employeeList));
    this.spinnerService.hide();
      }, error => {
    this.spinnerService.hide();
    }) 
  })
} 
findStatus(){
  this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE_CHECK_LIST.GET_STATUS_ITEM + 'EL_SECTION_JOBCARD_STATUS_TYPES')
      .subscribe((resp) => {
        this.statusList = resp;

      }); 
      this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE_CHECK_LIST.GET_STATUS_ITEM + 'EL_JOB_CARD_COMPLIANCE')
      .subscribe((resp) => {
        this.complianceList = resp;

      });

}
save(){
  this.sectionJobs =[];
  for (var i = 0; i < this.sectionJobcardData.length; i++) {
    this.sectionJobcardData[i].remarks = this.remarks;
     this.sectionJobcardData[i].targetTime = !!this.targetDate ? new Date(this.targetDate) : '';      
       this.sectionJobcardData[i].updatedOn = !!this.updatedOn ? new Date(this.updatedOn) : '';  
        this.sectionJobcardData[i].returnedBy =  this.returnedBy ;
   this.sectionJobcardData[i].status = this.status ;
      this.sectionJobcardData[i].updatedBy = this.loggedUserData.username;
    this.sectionJobs.push(this.sectionJobcardData[i]);
  }
  
  this.sendAndRequestService.requestForPOST(Constants.app_urls.SECTION_JOB_CARD.UPDATE_SECTION_JOBCARD, this.sectionJobs, false).subscribe(response => {
    this.spinnerService.show();
    this.resp = response;
 
    if (this.resp.code == Constants.CODES.SUCCESS) {
      this.commonService.showAlertMessage("Updated Successfully");
      this.getSectionJobcardData(); 
      //this.router.navigate(['../'], { relativeTo: this.route });
    } else {
      this.commonService.showAlertMessage("Updating Failed.");
    }
  }, error => {
    console.log('ERROR >>> ' + error);
    this.spinnerService.hide();
    this.commonService.showAlertMessage(" Updating Failed.");
  });
}
acknowledge(){  
  
  this.sendAndRequestService.requestForPOST(Constants.app_urls.SECTION_JOB_CARD.UPDATE_SECTION_JOBCARD, this.sectionJobcardData, false).subscribe(response => {
    this.spinnerService.show();
    this.resp = response;
 
    if (this.resp.code == Constants.CODES.SUCCESS) {
      this.commonService.showAlertMessage("Updated Successfully");
       //this.router.navigate(['../'], { relativeTo: this.route });
      this.getSectionJobcardData();
      } else {
      this.commonService.showAlertMessage("Updating Failed.");
    }
  }, error => {
    console.log('ERROR >>> ' + error);
    this.spinnerService.hide();
    this.commonService.showAlertMessage(" Updating Failed.");
  });
}

onGoBack() {
  this.location.back();
}
checkTab(index: number){
  switch (index) {
  case 1:{
    this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.STATUS_HISTORY.GET_STATUS_HISTORY_BY_STATUS_HISTORY_TYPE+'SECTION_JOBCARD').subscribe(response => {
      this.spinnerService.show();
      this.historyList = response;    
      for (let i = 0; i < this.historyList.length; i++) {
        if(this.historyList[i].sectionJobcardId.id == this.secJobcardId )
        this.historyList[i].sno = i + 1;
        this.historyList[i].updatedOn = this.datePipe.transform(this.historyList[i].updatedOn, 'dd-MM-yyyy HH:mm:ss');
      }
          this.historyDataSource = new MatTableDataSource(this.historyList);
         
  
    })
    break;
  }
}  
}

}
    

