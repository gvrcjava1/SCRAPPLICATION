import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatDialogRef, MatDialog } from '@angular/material';
import { AlertGroupModel } from 'src/app/models/alert-group.model';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Constants } from 'src/app/common/constants';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';
import { FuseConfirmDialogComponent } from '../../popup-dialogs/confirm-dialog/confirm-dialog.component';
import { DataViewDialogComponent } from '../../popup-dialogs/data-view-dialog/data-view-dialog.component';

@Component({
  selector: 'app-alert-group',
  templateUrl: './alert-group.component.html',
  styleUrls: []
})
export class AlertGroupComponent implements OnInit {

  pagination = Constants.PAGINATION_NUMBERS;
  FiledLabels = FieldLabelsConstant.LABELS;
  Titles = FieldLabelsConstant.TITLE;
  editPermission = true;
  addPermission = true;
  deletePermission = true;
  userdata: any = JSON.parse(sessionStorage.getItem('userData'));
  confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
  displayedColumns = ['sno', 'name', 'description', 'level', 'actions'];
  dataSource: MatTableDataSource<AlertGroupModel>;
  dataViewDialogRef: MatDialogRef<DataViewDialogComponent>;
  filterData;
  alertGroupList: any;
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
    private sendAndRequestService: SendAndRequestService
  ) { }

  ngOnInit() {
    let permissionName = this.commonService.getPermissionNameByLoggedData('ASSET REGISTER','PRECAUTIONARY MEASURES') ;
  	 this.addPermission = this.commonService.getPermissionByType('Add', permissionName);
    this.editPermission = this.commonService.getPermissionByType('Edit', permissionName);
    this.deletePermission = this.commonService.getPermissionByType('Delete', permissionName);

    this.spinnerService.show();
    this.getAlertGroupData();
    this.filterData = {
      filterColumnNames: [
        { Key: 'sno', Value: ' ' },
        { Key: 'name', Value: ' ' },
        { Key: 'description', Value: ' ' },
        { Key: 'level', Value: ' ' },
      ],
      gridData: this.gridData,
      dataSource: this.dataSource,
      paginator: this.paginator,
      sort: this.sort
    };


  }
  getAlertGroupData() {
    const alertGroup: AlertGroupModel[] = [];
    this.sendAndRequestService.requestForGET(Constants.app_urls.ALERTS.ALERT_GROUP.GET_ALERT_GROUP).subscribe((data) => {
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
    this.router.navigate(['alert-group/'+id], { relativeTo: this.route });
  }
  delete(id) {
    this.confirmDialogRef = this.dialog.open(FuseConfirmDialogComponent, {
      disableClose: false
    });
    this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to Delete?';
    this.confirmDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.spinnerService.show();
        this.sendAndRequestService.requestForDELETE(Constants.app_urls.ALERTS.ALERT_GROUP.DELETE_ALERT_GROUP , id).subscribe(data => {
          this.spinnerService.hide();
          this.commonService.showAlertMessage('Deleted Alert Group  Successfully');
          this.getAlertGroupData();
        }, error => {
          console.log('ERROR >>>' + error);
          this.spinnerService.hide();
          this.commonService.showAlertMessage('Alert Group  Deletion Failed.');
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

  ViewData(data) {
    let result = {
      title: this.Titles.ALERT_GROUP_DATA,
      dataSource: [
                    { label: FieldLabelsConstant.LABELS.NAME, value: data.name },
                    { label: FieldLabelsConstant.LABELS.DESCRIPTION, value: data.description },
                    { label: FieldLabelsConstant.LABELS.LEVEL, value: data.level },
                  ]
    };
    this.dataViewDialogRef = this.dialog.open(DataViewDialogComponent, {
      disableClose: false,
      height: '400px',
      width: '80%',
      data: result,
    });
  }
}
