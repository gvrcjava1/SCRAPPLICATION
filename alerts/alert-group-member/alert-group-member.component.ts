import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatDialogRef, MatDialog } from '@angular/material';
import { AlertGroupMemberModel } from 'src/app/models/alert-group-member.model';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Constants } from 'src/app/common/constants';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';
import { FuseConfirmDialogComponent } from '../../popup-dialogs/confirm-dialog/confirm-dialog.component';
import { DataViewDialogComponent } from '../../popup-dialogs/data-view-dialog/data-view-dialog.component';

@Component({
  selector: 'app-alert-group-member',
  templateUrl: './alert-group-member.component.html',
  styleUrls: []
})
export class AlertGroupMemberComponent implements OnInit {

  pagination =Constants.PAGINATION_NUMBERS;
  FiledLabels = FieldLabelsConstant.LABELS;
  Titles = FieldLabelsConstant.TITLE;
  editPermission: boolean = true;
  addPermission: boolean = true;
  deletePermission: boolean = true;
  userdata: any = JSON.parse(sessionStorage.getItem('userData'));
  confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
  displayedColumns = ['sno', 'name','alertGroupId','receipentsId','actions'];
  dataSource: MatTableDataSource<AlertGroupMemberModel>;
  dataViewDialogRef:MatDialogRef<DataViewDialogComponent>;
  filterData;
  alertGroupList:any;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('filter', { static: true }) filter: ElementRef;
  gridData = [];

  specialWorksList: any;

  constructor(
    private spinnerService: Ng4LoadingSpinnerService,
    private commonService: CommonService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private sendAndRequestService:SendAndRequestService
  ) { }

  ngOnInit() {
    var permissionName = this.commonService.getPermissionNameByLoggedData("ASSET REGISTER","PRECAUTIONARY MEASURES") ;
  	this.addPermission = this.commonService.getPermissionByType("Add", permissionName);
    this.editPermission = this.commonService.getPermissionByType("Edit", permissionName);
    this.deletePermission = this.commonService.getPermissionByType("Delete", permissionName);
    this.spinnerService.show();
    this.getAlertGroupMemberData();
    this.filterData = {
      filterColumnNames: [
        { "Key": 'sno', "Value": " " },
        { "Key": 'name', "Value": " " },
        { "Key": 'alertGroupId', "Value": " " },
        { "Key": 'receipentsId', "Value": " " },

      ],
      gridData: this.gridData,
      dataSource: this.dataSource,
      paginator: this.paginator,
      sort: this.sort
    };


  }
  getAlertGroupMemberData() {
    const alertGroup: AlertGroupMemberModel[] = [];
    this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.GET_ALERT_GROUP_MEMBER).subscribe((data) => {
      this.alertGroupList = data;
      for (let i = 0; i < this.alertGroupList.length; i++) {
        this.alertGroupList[i].sno = i + 1;
        alertGroup.push(this.alertGroupList[i]);
    }
    this.filterData.gridData = alertGroup;
    this.dataSource = new MatTableDataSource(alertGroup);
    this.commonService.updateDataSource(this.dataSource, this.displayedColumns);
    this.filterData.dataSource = this.dataSource;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.spinnerService.hide();
  }, error => {
    this.spinnerService.hide();
  });
  }
  processEditAction(id) {
    this.router.navigate([id], { relativeTo: this.route });
  }
  delete(id) {
    this.confirmDialogRef = this.dialog.open(FuseConfirmDialogComponent, {
      disableClose: false
    });
    this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to Delete?';
    this.confirmDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.spinnerService.show();
        this.sendAndRequestService.requestForDELETE(Constants.app_urls.ALERTS.ALERT_GROUP_MEMBER.DELETE_ALERT_GROUP_MEMBER ,id).subscribe(data => {
          this.spinnerService.hide();
          this.commonService.showAlertMessage("Deleted Alert Group Member  Successfully");
          this.getAlertGroupMemberData();
        }, error => {
          console.log('ERROR >>>' + error);
          this.spinnerService.hide();
          this.commonService.showAlertMessage("Alert Group Member  Deletion Failed.");
        });
      }
      this.confirmDialogRef = null;
    });
  }
  updatePagination() {
    this.filterData.dataSource = this.filterData.dataSource;
    this.filterData.dataSource.paginator = this.paginator;
  }
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); 
    filterValue = filterValue.toLowerCase(); 
    this.filterData.dataSource.filter = filterValue;
  }
  ViewData(data){
    var result = {
      'title':this.Titles.ALERT_GROUP_MEMBER_DATA,
      'dataSource':[                                 
                    { label:FieldLabelsConstant.LABELS.NAME, value:data.name },
                    { label:FieldLabelsConstant.LABELS.DESCRIPTION, value:data.description },
                    { label:FieldLabelsConstant.LABELS.ALERT_GROUP_ID, value:data.alertGroupId.name},
                    { label:FieldLabelsConstant.LABELS.RECEIPENTS_ID, value:data.receipentsId.userName },

                  ]
    }
    this.dataViewDialogRef = this.dialog.open(DataViewDialogComponent, {
      disableClose: false,
      height: '400px',
      width: '80%',       
      data:result,  
    });            
  }
}
