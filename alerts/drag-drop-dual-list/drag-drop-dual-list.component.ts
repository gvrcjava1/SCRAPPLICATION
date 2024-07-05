import { Component} from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { Constants } from 'src/app/common/constants';
import { DualListComponent } from '../../shared/dual-list/dual-list.component';

@Component({
  selector: 'app-drag-drop-dual-list',
  templateUrl: './drag-drop-dual-list.component.html',
  styleUrls: ['./drag-drop-dual-list.component.css'],
})
export class DragDropDualListComponent {

 /*  */

 tab = 1;
 keepSorted = true;
 key: string;
 display: string;
 displayItem:string;
 filter = false;
 source: Array<any>;
 confirmed: Array<any>;
 userAdd = '';
 disabled = false;
 alertGroupList:any;
 usersData:any;
 resp:any;
 alertGroupMembersList:any;
 sourceLeft = true;
 format: any = DualListComponent.DEFAULT_FORMAT;
 AlertFormGroup: FormGroup;
 private sourceStations: Array<any>;
 
 private confirmedStations: Array<any>;

/*
 private stations: Array<any> = [
   { key: 1, station: 'Antonito', state: 'CO' },
   { key: 2, station: 'Big Horn', state: 'NM' },
   { key: 3, station: 'Sublette', state: 'NM' },
   { key: 4, station: 'Toltec', state: 'NM' },
   { key: 5, station: 'Osier', state: 'CO' },
   { key: 6, station: 'Chama', state: 'NM' },
   { key: 7, station: 'Monero', state: 'NM' },
   { key: 8, station: 'Lumberton', state: 'NM' },
   { key: 9, station: 'Duice', state: 'NM' },
   { key: 10, station: 'Navajo', state: 'NM' },
   { key: 11, station: 'Juanita', state: 'CO' },
   { key: 12, station: 'Pagosa Jct', state: 'CO' },
   { key: 13, station: 'Carracha', state: 'CO' },
   { key: 14, station: 'Arboles', state: 'CO' },
   { key: 15, station: 'Solidad', state: 'CO' },
   { key: 16, station: 'Tiffany', state: 'CO' },
   { key: 17, station: 'La Boca', state: 'CO' },
   { key: 18, station: 'Ignacio', state: 'CO' },
   { key: 19, station: 'Oxford', state: 'CO' },
   { key: 20, station: 'Florida', state: 'CO' },
   { key: 21, station: 'Bocea', state: 'CO' },
   { key: 22, station: 'Carbon Jct', state: 'CO' },
   { key: 23, station: 'Durango', state: 'CO' },
   { key: 24, station: 'Home Ranch', state: 'CO' },
   { key: 25, station: 'Trimble Springs', state: 'CO' },
   { key: 26, station: 'Hermosa', state: 'CO' },
   { key: 27, station: 'Rockwood', state: 'CO' },
   { key: 28, station: 'Tacoma', state: 'CO' },
   { key: 29, station: 'Needleton', state: 'CO' },
   { key: 30, station: 'Elk Park', state: 'CO' },
   { key: 31, station: 'Silverton', state: 'CO' }, 
   { key: 32, station:'AP' } 
 ];*/
 constructor(
  private spinnerService: Ng4LoadingSpinnerService,
  private commonService: CommonService, 
  private sendAndRequestService:SendAndRequestService,
  private formBuilder: FormBuilder,
) { }

 ngOnInit() {
   this.getAlertGroupData();
   this.getUsersData();
    this.AlertFormGroup = this.formBuilder.group({
     'alertGroupId':[null]
    })
   
 }

 getAlertGroupData() {
  this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP.GET_ALERT_GROUP).subscribe((data) => {
    this.alertGroupList = data;
     
}, error => {
 
});
}
getUsersData(){
  this.sendAndRequestService.requestForGET(Constants.app_urls.MASTERS.USERS.GET_ALLUSERS).subscribe((data) => {
    this.usersData = data;
    if(this.usersData){
      this.doReset();
    }
  
}, error => {
 
});
}
 private useStations() {
   this.key = 'id';
   this.display = 'username'; // [ 'station', 'state' ];
   this.keepSorted = true;
   this.source = this.sourceStations;
   this.confirmed = this.confirmedStations;
 }
 doReset() {
   if(this.usersData)
   this.sourceStations = this.usersData;
   this.confirmedStations = new Array<any>();
   // Preconfirm some items.
    if(this.alertGroupMembersList){
      for(let i=0;i<this.alertGroupMembersList.length;i++){
        this.alertGroupMembersList[i].username = this.alertGroupMembersList[i].userId.username;
        this.alertGroupMembersList[i].id = this.alertGroupMembersList[i].userId.id;
        this.confirmedStations.push(this.alertGroupMembersList[i]);
      }
    }
   this.useStations();
 }



 filterBtn() {
   return (this.filter ? 'Hide Filter' : 'Show Filter');
 }

 doDisable() {
   this.disabled = !this.disabled;
 }

 disableBtn() {
   return (this.disabled ? 'Enable' : 'Disabled');
 }

 swapDirection() {
   this.sourceLeft = !this.sourceLeft;
   this.format.direction = this.sourceLeft ? DualListComponent.LTR : DualListComponent.RTL;
 }
 saveAction(){
  let groupMemberObject = {
    users: this.confirmedStations,
    alertGroup: this.AlertFormGroup.value.alertGroupId,
    
};
  this.sendAndRequestService.requestForPOST(Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.SAVE_ALERT_GROUP_FROM_DRAG,groupMemberObject, true).subscribe(response => {
    this.spinnerService.hide();
    this.resp = response;
 
    if (this.resp.code == Constants.CODES.SUCCESS) {
      this.commonService.showAlertMessage("Alert Group Members Data Saving Successfully");
    } else {
      this.commonService.showAlertMessage("Alert Group Members Saving Failed.");
    }
  }, error => {
    console.log('ERROR >>> ' + error);
    this.spinnerService.hide();
    this.commonService.showAlertMessage("Alert Group Members Saving Failed.");
  });
 }
 getGroupmembers(){
  
  this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.GET_ALERT_MEMBERS_BASED_ON_GROUP+this.AlertFormGroup.value.alertGroupId.id).subscribe((data) => {
    this.alertGroupMembersList = data;
    this.doReset();
}, error => {
 
});

 }
}
