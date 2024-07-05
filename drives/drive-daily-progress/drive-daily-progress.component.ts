import { Component, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { MatTableDataSource, MatPaginator, MatSort, MatDialogRef, MatDialog, MAT_DIALOG_DATA, DateAdapter, MAT_DATE_FORMATS } from '@angular/material';
import { DriveChecklistModel } from 'src/app/models/drive.model';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Constants } from 'src/app/common/constants';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DriveDailyProgressModel } from 'src/app/models/drive.model';
import { DriveModel } from 'src/app/models/drive.model';
import { DriveProgressIdModel } from 'src/app/models/drive.model';
import { DatePipe } from '@angular/common';
import { ViewDriveDailyProgressComponent } from './view-drive-daily-progress/view-drive-daily-progress.component';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';
import { AppDateAdapter, APP_DATE_FORMATS } from 'src/app/common/date.adapter';
import { FuseConfirmDialogComponent } from '../../popup-dialogs/confirm-dialog/confirm-dialog.component';



@Component({
  selector: 'drive-daily-progress',
  templateUrl: './drive-daily-progress.component.html',
  styleUrls: ['./drive-daily-progress.component.scss'],
  providers: [
    {
      provide: DateAdapter, useClass: AppDateAdapter
    },
    {
      provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS
    }
  ]
})
export class DriveDailyProgressComponent implements OnInit {

  pagination = Constants.PAGINATION_NUMBERS;
  FiledLabels = FieldLabelsConstant.LABELS;
  Titles = FieldLabelsConstant.TITLE;
  dailyProgressFormGroup: FormGroup;
  dailyProgressDate: any;
  depotType: any;
  dataSource: MatTableDataSource<DriveModel>;
  displayedColumns: any;
  searchInputFormGroup: FormGroup;
  depotTypeList = [];
  drivesList: any;
  performedCount: any;
  resp: any;
  DDProgress: any;
  depotHierarchy: any = JSON.parse(sessionStorage.getItem('depotData'));
  facilityId: any;
  loggedUserData: any = JSON.parse(sessionStorage.getItem('userData'));
  driveDailyProgressDialogRef: MatDialogRef<ViewDriveDailyProgressComponent>;
  requestType: string;
  titleName: any;
  breadCrumb: any;
  depotsList: any;
  maxDate = new Date();

  constructor(
    private spinnerService: Ng4LoadingSpinnerService,
    private commonService: CommonService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private sendAndRequestService: SendAndRequestService,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    if (this.router.url == '/asset-schedule-progress') {
      this.requestType = 'Schedule Progress';
      this.titleName = 'Asset Schedule Progress Information';
      this.FiledLabels.DRIVE = 'Asset type & Sch Code'
      this.FiledLabels.PERFORMED_COUNT = 'Schedule Performed';
      this.breadCrumb = 'Asset Schedule Progress';
      this.FiledLabels.FROM_DATE = 'Sch Date';
      this.displayedColumns = ['sno', 'drive', 'description', 'alreadyDone', 'performedCount', 'ids', 'actions'];
    } else {
      this.requestType = 'Daily Progress';
      this.titleName = 'Drive Daily Progress Information';
      this.breadCrumb = 'Drive Daily Progress';
      this.FiledLabels.DRIVE = 'Drive';
      this.FiledLabels.PERFORMED_COUNT = 'Performed Count'
      this.FiledLabels.FROM_DATE = 'Date';
      this.displayedColumns = ['sno', 'drive', 'description', 'assetType', 'population', 'target', 'alreadyDone', 'performedCount', 'ids', 'actions'];
    }
    this.searchInputFormGroup = this.formBuilder.group({
      'fromDate': [null],
      'depotType': [null],
      'facilityId': [null]
    });
    this.findDepoTypeList();
    this.findDepot();
  }

  processSaveAction(row: any) {
    var message = '';
    var failedMessage = '';
    let saveDriveDailyProgress = {
      id: 3,
      driveId: row.drive.id,
      performedCount: row.performedCount,
      performedDate: this.searchInputFormGroup.controls['fromDate'].value,
      depot: this.searchInputFormGroup.controls['facilityId'].value,
      createdBy: this.loggedUserData.username,
    }
    message = 'Saved';
    failedMessage = 'Saving';
    this.sendAndRequestService.requestForPOST(Constants.app_urls.PROGRESS_RECORD.SAVE_D_DAILY_PROGRESS_RECORD, saveDriveDailyProgress, false).subscribe(response => {
      this.spinnerService.hide();
      this.resp = response;
      if (this.resp.code == 200 && !!this.resp) {
        if (this.router.url == '/asset-schedule-progress')
          this.commonService.showAlertMessage('Asset Schedule Progress Data Saved Successfully');
        else
          this.commonService.showAlertMessage('Drive Daily Progress Data Saved Successfully');
      } else
        if (this.router.url == '/asset-schedule-progress')
          this.commonService.showAlertMessage('Asset Schedule Progress Data Saving Failed');
        else
          this.commonService.showAlertMessage('Drive Daily Progress Data Saving Failed');
    });
  }

  assetIdsDialog(row: any) {
    const dialogRef = this.dialog.open(AddAssetIdsDriveDialogComponent, {
      height: '600px',
      width: '80%',
      data: {
        driveId: row.drive.id,
        performedCount: row.performedCount,
        facilityId: this.searchInputFormGroup.controls['facilityId'].value,
        performedDate: this.searchInputFormGroup.controls['fromDate'].value,
        depotType: row.drive.depotType.code,
        assetType: row.drive.assetType
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      row.performedCount = 0;
      row.performedCount = result;
    });

  }

  findDepot() {
    this.depotsList = [];

    for (let i = 0; i < this.depotHierarchy.length; i++) {

      if (this.depotHierarchy[i].depotType == 'OHE' || this.depotHierarchy[i].depotType == 'PSI') {

        this.depotsList.push(this.depotHierarchy[i]);

      }
    }

  }

  findDepoTypeList() {
    this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_FUNCTIONAL_LOCATION_TYPES)
      .subscribe((depoTypes) => {
        this.depotTypeList = depoTypes;
      })
  }

  getDriveDailyProgress() {
    const drivesData: DriveModel[] = [];
    this.dataSource = new MatTableDataSource(drivesData);
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE.GET_DIRIVES_BASED_ON_FROMDATE_AND_DEPOT
      + this.searchInputFormGroup.controls['fromDate'].value + '/' + this.searchInputFormGroup.controls['facilityId'].value + '/' + this.requestType
    ).subscribe((data) => {
      this.drivesList = data;
      if (this.drivesList) {
        for (let i = 0; i < this.drivesList.length; i++) {
          this.drivesList[i].sno = i + 1;
          this.drivesList[i].drive = this.drivesList[i];
          drivesData.push(this.drivesList[i]);
        }

        this.dataSource = new MatTableDataSource(drivesData);
        this.spinnerService.show();
      }

    }, error => {
      this.spinnerService.hide();
    });
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;

  }

  viewDialog(driveId) {
    this.spinnerService.show();
    this.sendAndRequestService.requestForGET(Constants.app_urls.PROGRESS_RECORD.GET_DDPROGRESS_DATA_BASED_ON_DRIVE + driveId).subscribe((response) => {
      this.spinnerService.hide();
      this.driveDailyProgressDialogRef = this.dialog.open(ViewDriveDailyProgressComponent, {
        disableClose: false,
        height: '600px',
        width: '80%',
        data: response,
      });
    }, error => this.commonService.showAlertMessage(error));
  }

}

@Component({
  selector: 'add-asset-ids-drive-dialog',
  templateUrl: 'add-asset-ids-drive-dialog.component.html',
})
export class AddAssetIdsDriveDialogComponent implements OnInit {
  FiledLabels = FieldLabelsConstant.LABELS;
  Titles = FieldLabelsConstant.TITLE;
  dailyProgressIdFormGroup: FormGroup;
  assetIdList: any;
  displayedColumns = ['sno', 'assetId', 'actions'];
  dataSource: MatTableDataSource<DriveProgressIdModel>;
  facilityId: any;
  selectedAssetIdList: any[] = [];
  assetIdsExists: boolean;
  loggedUserData: any = JSON.parse(sessionStorage.getItem('userData'));
  DDProgressId: any;
  driveId: any;
  performedDate: any;
  resp: any;
  DDProgress: any;
  confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
  performedCount: any;
  depotType: any;
  hideFields: boolean;
  assetType: any;
  driveData: any;
  driveName: any;
  fromDate: any;
  toDate: any;
  enableSubmit: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private spinnerService: Ng4LoadingSpinnerService,
    private sendAndRequestService: SendAndRequestService,
    private dialog: MatDialog,
    private commonService: CommonService,
    private dialogRef: MatDialogRef<AddAssetIdsDriveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private datePipe: DatePipe
  ) {

    if (data) {
      this.facilityId = data.facilityId;
      this.driveId = data.driveId;
      this.performedDate = data.performedDate;
      this.depotType = data.depotType;
      this.assetType = data.assetType;
    }
  }

  ngOnInit() {
    this.dailyProgressIdFormGroup = this.formBuilder.group({
      fromKilometer: [null],
      toKilometer: [null],
      assetId: [null],
      manual: [null],
      assetType: [null]
    })
    this.getDriveProgressIdData();
    if ('TSS' === this.depotType || 'SSP' === this.depotType || 'SP' === this.depotType) {
      this.hideFields = false;
      this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.ASSETMASTERDATA.GET_ASSETID_BASED_ON_ASSETTYPE_FACILITYID + this.assetType + '/' + this.facilityId).subscribe((data) => {
        this.assetIdList = data;
      }, error => {
        this.spinnerService.hide();
      });
    } else {
      this.hideFields = true;
    }
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE.GET_DRIVE_ID + this.driveId)
      .subscribe((resp) => {
        this.driveData = resp;
        this.driveName = this.driveData.name;
        this.fromDate = this.datePipe.transform(this.driveData.fromDate, 'dd-MM-yyyy');
        this.toDate = this.datePipe.transform(this.driveData.toDate, 'dd-MM-yyyy');
      });
  }

  getDriveProgressIdData() {
    const driveProgressId: DriveProgressIdModel[] = [];
    this.sendAndRequestService.requestForGET(Constants.app_urls.PROGRESS_RECORD.GET_DDPROGRESS_BASED_ON_DRIVE_FROM_DATE
      + this.driveId + '/' + this.performedDate
    ).subscribe((data) => {
      this.DDProgress = data;
      if (this.DDProgress != null) {
        this.DDProgressId = this.DDProgress.id;
        this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE_PROGRESS_ID.GET_DRIVE_PROGRESS_ID_DATA_BASED_ON_DRIVE_DAILY_PROGRESS
          + this.DDProgressId
        ).subscribe((data) => {
          this.resp = data;
          if (this.resp) {
            this.performedCount = this.resp.length;
            for (let i = 0; i < this.resp.length; i++) {
              this.resp[i].sno = i + 1;
              driveProgressId.push(this.resp[i]);
            }
          }
          this.dataSource = new MatTableDataSource(driveProgressId);
        });
      } else {
        this.performedCount = 0;
      }
    });
  }

  addAssetIdsFormSubmit() {
    this.enableSubmit = false;
    this.assetIdsExists = false;
    this.performedCount = this.performedCount + this.selectedAssetIdList.length;
    let saveDriveDailyProgress = {
      id: 0,
      driveId: this.driveId,
      performedDate: this.performedDate,
      depot: this.facilityId,
      createdBy: this.loggedUserData.username,
      performedCount: this.performedCount
    }
    this.sendAndRequestService.requestForPOST(Constants.app_urls.PROGRESS_RECORD.SAVE_DRIVE_DAILY_PROGRESS_RECORD, saveDriveDailyProgress, false).subscribe(response => {
      this.spinnerService.hide();
      this.resp = response;
      if (this.resp) {
        this.DDProgressId = this.resp.id;
        let currentDate = new Date();
        let formdata: FormData = new FormData();
        for (var i = 0; i < this.selectedAssetIdList.length; i++) {
          formdata.append('assetIds', this.selectedAssetIdList[i]);
        }
        formdata.append('createdBy', this.loggedUserData.username);
        formdata.append('createdOn', new Date().toLocaleDateString());
        formdata.append('driveDailyProgressId', this.DDProgressId);
        this.sendAndRequestService.requestForPOST(Constants.app_urls.DRIVE_PROGRESS_ID.SAVE, formdata, true).subscribe(data => {
          this.spinnerService.hide();
          this.selectedAssetIdList = [];
          this.getDriveProgressIdData();

        }, error => {
          console.log('ERROR >>> ' + error);
          this.spinnerService.hide();
        })
      }

    });

  }

  addAssetIds() {
    let assetIds = this.dailyProgressIdFormGroup.value.assetId;
    if (assetIds) {
      this.assetIdsExists = true;
      this.enableSubmit = true;
      for (var i = 0; i < assetIds.length; i++) {
        this.selectedAssetIdList.push(assetIds[i]);
      }
    }
    let manualEnteredData = this.dailyProgressIdFormGroup.value.manual;
    if (manualEnteredData) {
      this.assetIdsExists = true;
      this.enableSubmit = true;
      let manualArray = manualEnteredData.split(';');
      for (var i = 0; i < manualArray.length; i++) {
        if (manualArray[i]) {
          this.selectedAssetIdList.push(manualArray[i]);
        }
      }
    }

    Object.keys(this.dailyProgressIdFormGroup.controls).forEach(key => {
      this.dailyProgressIdFormGroup.get(key).setValue(null);
    });
  }

  removeAssetId(id) {
    this.selectedAssetIdList.splice(id, 1);
    if (this.selectedAssetIdList.length === 0) {
      this.assetIdsExists = false;
      this.enableSubmit = false;
    }
  }


  selectedFromKm(fKM) {
    this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.ASSETMASTERDATA.GET_ASSETIDS_BY_FACILITYID_FROMKM_TOKM + this.facilityId + '/' + this.dailyProgressIdFormGroup.controls['fromKilometer'].value + '/' + this.dailyProgressIdFormGroup.controls['fromKilometer'].value).subscribe((data) => {
      this.assetIdList = data;
    }, error => {
      this.spinnerService.hide();
    });
  }

  selectedToKm(tKM) {
    this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.ASSETMASTERDATA.GET_ASSETIDS_BY_FACILITYID_FROMKM_TOKM + this.facilityId + '/' + this.dailyProgressIdFormGroup.controls['fromKilometer'].value + '/' + this.dailyProgressIdFormGroup.controls['toKilometer'].value).subscribe((data) => {
      this.assetIdList = data;
    }, error => {
      this.spinnerService.hide();
    });
  }

  delete(id) {
    this.confirmDialogRef = this.dialog.open(FuseConfirmDialogComponent, {
      disableClose: false
    });
    this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';
    this.confirmDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.spinnerService.show();
        this.sendAndRequestService.requestForDELETE(Constants.app_urls.DRIVE_PROGRESS_ID.DELETE, id).subscribe(data => {
          this.spinnerService.hide();
          this.commonService.showAlertMessage('Asset Id Deleted Successfully');
          this.getDriveProgressIdData();
        }, error => {
          console.log('ERROR >>> ' + error);
          this.spinnerService.hide();
          this.commonService.showAlertMessage('Asset Id Deletion Failed.');
        })
      }
      this.confirmDialogRef = null;
    });
  }

  onGoBack(): void {
    this.dialogRef.close();
  }

}