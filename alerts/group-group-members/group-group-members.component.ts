
import { Component,OnInit } from '@angular/core';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';


@Component({
  selector: 'group-group-members',
  templateUrl: './group-group-members.component.html',
  styleUrls: [ './group-group-members.component.css' ]
})
export class GroupGroupMembersComponent implements OnInit {
  addPermission:any;
  editPermission:any;
  deletePermission:any;
   

  availableItems: any[] = [];
  selectedItems: any[] = [];
  currentSelectItems: any[] = [];

  constructor(
    private spinnerService: Ng4LoadingSpinnerService,
    private commonService: CommonService,
    private sendAndRequestService:SendAndRequestService,
 
  ) { }

  ngOnInit() {
    var permissionName = this.commonService.getPermissionNameByLoggedData("ALERT","Group Group Members") ;
  	this.addPermission = this.commonService.getPermissionByType("Add", permissionName);
    this.editPermission = this.commonService.getPermissionByType("Edit", permissionName);
    this.deletePermission = this.commonService.getPermissionByType("Delete", permissionName);
    this.availableItems = [
      { id: '1', name: 'Item 1'},
      { id: '2', name: 'Item 2'},
      { id: '3', name: 'Item 3'},
      { id: '4', name: 'Item 4'},
      { id: '5', name: 'Item 5'},
      { id: '6', name: 'Item 6'},
    ] 
}

onItemsMoved(event): void {
  this.currentSelectItems = event.selected;
}
}
