import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource, MatDialogRef, MatDialog, DateAdapter, MAT_DATE_FORMATS } from '@angular/material';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { DriveModel, DriveCategoryModel, DriveCategoryAssoModel } from 'src/app/models/drive.model';
import { Router, ActivatedRoute } from '@angular/router';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { Constants } from 'src/app/common/constants';
import { DatePipe } from '@angular/common';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';
import { AppDateAdapter, APP_DATE_FORMATS } from 'src/app/common/date.adapter';
import { FuseConfirmDialogComponent } from '../../popup-dialogs/confirm-dialog/confirm-dialog.component';
import { FuseErrorDialogComponent } from '../../popup-dialogs/error-dialog/error-dialog.component';
import { DataViewDialogComponent } from '../../popup-dialogs/data-view-dialog/data-view-dialog.component';
import { FuseErrorPopupComponent } from '../../popup-dialogs/error-popup/error-popup.component';
import { FuseConfirmPopupComponent } from '../../popup-dialogs/confirm-popup/confirm-popup.component';
import { DocumentDialogComponent } from '../../popup-dialogs/document-view-dialog/document-dialog.component';



@Component({
  selector: 'app-drives',
  templateUrl: './drive.component.html',
  styleUrls: ['./drive.component.scss']
})
export class DrivesComponent implements OnInit {

  drivePagination = Constants.PAGINATION_NUMBERS;
  driveCatPagination = Constants.PAGINATION_NUMBERS;
  driveCatAssocPagination = Constants.PAGINATION_NUMBERS;
  FiledLabels = FieldLabelsConstant.LABELS;
  Titles = FieldLabelsConstant.TITLE;
  DocType = Constants.DOC_FORMAT;
  resp: any;
  editPermission = true;
  addPermission = true;
  deletePermission = true;
  userdata: any = JSON.parse(sessionStorage.getItem('userData'));
  zoneData: any = JSON.parse(sessionStorage.getItem('zoneData'));
  divisionData: any = JSON.parse(sessionStorage.getItem('divisionData'));
  subDivisionData: any = JSON.parse(sessionStorage.getItem('subDivData'));
  depotData: any = JSON.parse(sessionStorage.getItem('depotData'));
  confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
  errorDialogRef: MatDialogRef<FuseErrorDialogComponent>;
  displayedColumns = ['sno', 'name', 'description', 'fromDate', 'toDate', 'depoType', 'assetType', 'frequency',
    'functionalUnit', 'active', 'actions'];
  driveCategoryDisplayedColumns = ['sno', 'name', 'description', 'fromDate', 'toDate', 'authority', 'actions'];
  driveCategoryAssoDisplayedColumns = ['sno', 'drive', 'driveCategory', 'active', 'actions'];

  dataSource: MatTableDataSource<DriveModel>;
  driveCategoryDataSource: MatTableDataSource<DriveCategoryModel>;
  driveCategoryAssoDataSource: MatTableDataSource<DriveCategoryAssoModel>;
  dataViewDialogRef: MatDialogRef<DataViewDialogComponent>;
  depoTypeList = [];
  assetTypeList = [];
  scheduleList = [];
  attachmentPermission: boolean;
  updatePermission: boolean;
  deletedPermission: boolean;

  functionalUnitList: any;
  // allFunctionalUnitsList: any;

  @ViewChild('drivePaginator', { static: true }) drivePaginator: MatPaginator;
  @ViewChild('sort', { static: true }) sort: MatSort;
  @ViewChild('filter', { static: true }) filter: ElementRef;
  drivesList: any;

  @ViewChild('driveCategoryPaginator', { static: true }) driveCategoryPaginator: MatPaginator;
  @ViewChild('driveCategorySort', { static: true }) driveCategorySort: MatSort;
  @ViewChild('filter', { static: true }) driveCategoryFilter: ElementRef;
  driveCategoryList: any;

  @ViewChild('driveCategoryAssoPaginator', { static: true }) driveCategoryAssoPaginator: MatPaginator;
  @ViewChild('driveCategoryAssoSort', { static: true }) driveCategoryAssoSort: MatSort;
  @ViewChild('filter', { static: true }) driveCategoryAssoFilter: ElementRef;
  driveCategoryAssoList: any;

  uploadFile: boolean;
  driveId: any;
  contentManagementFormGroup: FormGroup;
  pattern = '[a-zA-Z0-9 /.,][a-zA-Z0-9 /.,]*';
  selectedFiles: File[] = [];
  filesExists = false;
  userDefaultData: any;
  documentDialogRef: MatDialogRef<DocumentDialogComponent>;

  constructor(
    private spinnerService: Ng4LoadingSpinnerService,
    private commonService: CommonService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private datePipe: DatePipe,
    private sendAndRequestService: SendAndRequestService,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    const permissionName = this.commonService.getPermissionNameByLoggedData('DRIVES', 'DRIVES');
    this.addPermission = this.commonService.getPermissionByType('Add', permissionName);
    this.editPermission = this.commonService.getPermissionByType('Edit', permissionName);
    this.deletePermission = this.commonService.getPermissionByType('Delete', permissionName);

    this.spinnerService.show();
    this.findDepoTypeList();
    this.getDrivesData();

    this.getDriveCategoryData();
    this.getDriveCategoryAssoData();
    this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_USER_DEFAULT_DATA + this.userdata.username).subscribe((data) => {
      this.userDefaultData = data;
    });
  }

  onContentManagementSubmit() {
    const category = this.contentManagementFormGroup.value.contentCategory;
    this.uploadFile = false;
    this.addPermission = true;
    const saveDetails = {
      driveId: this.driveId,
      description: this.contentManagementFormGroup.value.description,
      divisionCode: this.userdata.divisionCode,
      createdBy: this.userdata.id,
      createdDate: new Date(),
      contentCategory: 'OPERATIONS',
      zonal: this.userDefaultData.zone,
      FU: this.userDefaultData.facilityName,
      contentTopic: 'DRIVE',
    };
    const formdata: FormData = new FormData();
    for (let i = 0; i < this.selectedFiles.length; i++) {
      formdata.append('file', this.selectedFiles[i]);
    }
    formdata.append('driveId', saveDetails.driveId);
    formdata.append('contentCategory', saveDetails.contentCategory);
    formdata.append('description', saveDetails.description);
    formdata.append('divisionCode', saveDetails.divisionCode);
    formdata.append('createdBy', saveDetails.createdBy);
    formdata.append('zonal', saveDetails.zonal);
    formdata.append('FU', saveDetails.FU);
    formdata.append('contentTopic', saveDetails.contentTopic);

    this.sendAndRequestService.requestForPOST(Constants.app_urls.DRIVE.DRIVE.DRIVE_UPLOAD_FILES, formdata, true).subscribe(data => {
      this.spinnerService.hide();
      this.resp = data;
      if (this.resp.code == 200 && !!this.resp) {
        this.commonService.showAlertMessage('Files Uploaded and Saved Successfully');
        this.selectedFiles = [];
        this.filesExists = false;
        this.getDrivesData();
      } else {
        this.commonService.showAlertMessage('Files Uploading Failed.');
        this.uploadFile = true;
        this.filesExists = true;
        this.addPermission = false;
      }
    }, error => {
      console.log('ERROR >>> ' + error);
      this.spinnerService.hide();
      this.commonService.showAlertMessage('Files Uploading Failed.');
    });

  }

  viewDocumentDetails(id) {
    this.spinnerService.show();
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE.ATTACHMENT_LIST + id).subscribe((response) => {
      this.spinnerService.hide();
      if (response) {
        const data = {
          response,
          permissionName: this.commonService.getPermissionNameByLoggedData('DRIVES', 'DOCUMENTS')
        };
        this.documentDialogRef = this.dialog.open(DocumentDialogComponent, {
          disableClose: false,
          height: '600px',
          width: '80%',
          data,
        });
      }
    }, error => this.commonService.showAlertMessage(error));
  }

  removeFile(id) {
    this.selectedFiles.splice(id, 1);
    if (this.selectedFiles.length === 0) {
      this.filesExists = false;
      this.contentManagementFormGroup.reset();
    }
  }

  fileUpload(id) {
    this.uploadFile = true;
    this.addPermission = false;
    this.driveId = id;
    this.contentManagementFormGroup = this.formBuilder.group({
      contentCategory: [''],
      description: ['', Validators.compose([Validators.required, Validators.pattern(this.pattern)])],
      uploadFiles: ['', Validators.required],
      contentTopic: [''],
    });
  }

  public get f() { return this.contentManagementFormGroup.controls; }

  upload(event) {

    if (event.target.files.length > 0) { this.filesExists = true; }
    for (let i = 0; i < event.target.files.length; i++) {
      if (this.sendAndRequestService.FileSize(event.target.files[i].size)) {

        this.errorDialogRef = this.dialog.open(FuseErrorPopupComponent, {
          disableClose: false
        });
        this.errorDialogRef.componentInstance.errorMessage = event.target.files[i].name + ' file size is \'' + Math.round((((((event.target.files[i].size / 1024) * 100) / 100) / 1024) * 100) / 100) + ' MB\'' + '  Allows only ' + Constants.DOC_FORMAT.FILESIZE + 'MB';
        this.selectedFiles = [];
        this.contentManagementFormGroup.setErrors({ invalid: true });
      }
      if (!this.sendAndRequestService.FileType(event.target.files[i].type)) {
        this.errorDialogRef = this.dialog.open(FuseErrorPopupComponent, {
          disableClose: false
        });
        this.errorDialogRef.componentInstance.errorMessage = event.target.files[i].name + ' file type is not supported' + ' Allowed file types are(.doc,.xlsx,.csv,.pdf,.ppt,.xml,.jpeg)';
        this.selectedFiles = [];
        this.contentManagementFormGroup.setErrors({ invalid: true });
      } else {
        this.selectedFiles.push(event.target.files[i]);
      }
    }


  }

  close() {
    this.contentManagementFormGroup.reset();
    this.uploadFile = false;
    this.selectedFiles = [];
    this.filesExists = false;
    this.addPermission = true;
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }

  driveCategoryApplyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.driveCategoryDataSource.filter = filterValue;
  }

  driveCategoryAssoApplyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.driveCategoryAssoDataSource.filter = filterValue;
  }
  findDepoTypeList() {
    this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_FUNCTIONAL_LOCATION_TYPES)
      .subscribe((depoTypes) => {
        this.depoTypeList = depoTypes;
      });
  }

  findAssetTypeList(assertType) {
    this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_ASSET_TYPES + assertType)
      .subscribe((assetTypes) => {
        this.assetTypeList = assetTypes;
      });
  }
  findScheduleList() {
    this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.ASSET_SCH_ASSOC.GET_SCH)
      .subscribe((schedule) => {
        this.scheduleList = schedule;
      });
  }
  getDrivesData() {
    const drive: DriveModel[] = [];
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE.GET_DRIVES_BASEDON_DIVISION + this.userdata.username).subscribe((data) => {
      this.drivesList = data;
      for (let i = 0; i < this.drivesList.length; i++) {

        if (this.zoneData.length == 0 && this.drivesList[i].driveScope == 'ZONE') {
          this.drivesList[i].updatePermission = false;
          this.drivesList[i].deletedPermission = false;
          this.drivesList[i].attachmentPermission = false;

        } else if (this.divisionData.length == 0 && this.drivesList[i].driveScope == 'DIV') {
          this.drivesList[i].updatePermission = false;
          this.drivesList[i].deletedPermission = false;
          this.drivesList[i].attachmentPermission = false;
        } else if (this.subDivisionData.length == 0 && this.drivesList[i].driveScope == 'SUB_DIV') {
          this.drivesList[i].updatePermission = false;
          this.drivesList[i].deletedPermission = false;
          this.drivesList[i].attachmentPermission = false;
        } else {
          this.drivesList[i].updatePermission = true;
          this.drivesList[i].deletedPermission = true;
          this.drivesList[i].attachmentPermission = true;
        }

        this.drivesList[i].sno = i + 1;
        this.drivesList[i].targetQuantity = this.drivesList[i].target_qty;
        this.drivesList[i].status = this.drivesList[i].active;
        this.drivesList[i].checkList = this.drivesList[i].checklist;

        this.drivesList[i].depoType = !!this.drivesList[i].depotTypes ? this.drivesList[i].depotTypes['code'] : '';
        this.drivesList[i].fromDate = this.datePipe.transform(this.drivesList[i].frmDate, 'dd-MM-yyyy');
        this.drivesList[i].toDate = this.datePipe.transform(this.drivesList[i].toDat, 'dd-MM-yyyy');
        drive.push(this.drivesList[i]);
      }
      this.dataSource = new MatTableDataSource(drive);
      this.dataSource.paginator = this.drivePaginator;
      this.dataSource.sort = this.sort;
      this.spinnerService.hide();
    }, error => {
      this.spinnerService.hide();
    });
  }

  getDriveCategoryData() {
    const driveCat: DriveCategoryModel[] = [];
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE_CATEGORY.GET_DRIVE_CATEGORY).subscribe((data) => {
      this.driveCategoryList = data;
      for (let i = 0; i < this.driveCategoryList.length; i++) {
        this.driveCategoryList[i].sno = i + 1;
        this.driveCategoryList[i].name = this.driveCategoryList[i].driveCategoryName;
        this.driveCategoryList[i].fromDate = this.datePipe.transform(this.driveCategoryList[i].fromDate, 'dd-MM-yyyy ');
        this.driveCategoryList[i].toDate = this.datePipe.transform(this.driveCategoryList[i].toDate, 'dd-MM-yyyy ');
        driveCat.push(this.driveCategoryList[i]);
      }
      this.driveCategoryDataSource = new MatTableDataSource(driveCat);
      this.driveCategoryDataSource.paginator = this.driveCategoryPaginator;
      this.driveCategoryDataSource.sort = this.driveCategorySort;
      this.spinnerService.hide();
    }, error => {
      this.spinnerService.hide();
    });
  }

  getDriveCategoryAssoData() {
    const driveCatAssoc: DriveCategoryAssoModel[] = [];
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE_CATEGORY_ASSOCIATION.GET_DRIVE_CATEGORY_ASSOC).subscribe((data) => {
      this.driveCategoryAssoList = data;
      for (let i = 0; i < this.driveCategoryAssoList.length; i++) {
        this.driveCategoryAssoList[i].sno = i + 1;
        this.driveCategoryAssoList[i].drive = this.driveCategoryAssoList[i].driveId['name'];
        this.driveCategoryAssoList[i].driveCategory = this.driveCategoryAssoList[i].driveCategoryId['driveCategoryName'];
        driveCatAssoc.push(this.driveCategoryAssoList[i]);
      }

      this.driveCategoryAssoDataSource = new MatTableDataSource(driveCatAssoc);
      this.driveCategoryAssoDataSource.paginator = this.driveCategoryAssoPaginator;
      this.driveCategoryAssoDataSource.sort = this.driveCategoryAssoSort;
      this.spinnerService.hide();
    }, error => {
      this.spinnerService.hide();
    });

  }

  processEditAction(id) {
    this.router.navigate(['drive/' + id], { relativeTo: this.route });
  }
  delete(id) {
    this.confirmDialogRef = this.dialog.open(FuseConfirmDialogComponent, {
      disableClose: false
    });
    this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';
    this.confirmDialogRef.afterClosed().subscribe(result => {
      if (result) {

        this.spinnerService.show();
        this.sendAndRequestService.requestForDELETE(Constants.app_urls.DRIVE.DRIVE.DELETE_DRIVE, id).subscribe((data) => {
          this.resp = data;

          if (this.resp.code === 200) {

            this.confirmDialogRef = this.dialog.open(FuseConfirmPopupComponent, {
              disableClose: false

            });
            this.confirmDialogRef.componentInstance.confirmMessage = this.resp.message;
          } else {
            this.confirmDialogRef = this.dialog.open(FuseConfirmPopupComponent, {
              disableClose: false
            });
            this.confirmDialogRef.componentInstance.confirmMessage = this.resp.message;
          }
          this.getDrivesData();
          this.spinnerService.hide();
        }, error => {
          console.log('ERROR >>> ' + error);
          this.spinnerService.hide();
          this.commonService.showAlertMessage('Drive Deletion Failed.');
        });
      }
      this.confirmDialogRef = null;
    });
  }

  driveCategoryEdit(id) {
    this.router.navigate(['drive-category/' + id], { relativeTo: this.route });
  }
  driveCategoryDelete(id) {
    this.confirmDialogRef = this.dialog.open(FuseConfirmDialogComponent, {
      disableClose: false

    });
    this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';
    this.confirmDialogRef.afterClosed().subscribe(result => {
      if (result) {

        this.spinnerService.show();
        this.sendAndRequestService.requestForDELETE(Constants.app_urls.DRIVE.DRIVE_CATEGORY.DELETE_DRIVE_CATEGORY, id).subscribe(data => {
          this.spinnerService.hide();
          this.commonService.showAlertMessage('Deleted Drive Category Successfully');
          this.getDriveCategoryData();
        }, error => {
          console.log('ERROR >>> ' + error);
          this.spinnerService.hide();
          this.commonService.showAlertMessage('Drive Category Deletion Failed.');
        });
      }
      this.confirmDialogRef = null;
    });
  }

  driveCategoryAssoEdit(id) {
    this.router.navigate(['drive-category-association/' + id], { relativeTo: this.route });
  }
  driveCategoryAssoDelete(id) {
    this.confirmDialogRef = this.dialog.open(FuseConfirmDialogComponent, {
      disableClose: false

    });
    this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';
    this.confirmDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.spinnerService.show();
        this.sendAndRequestService.requestForDELETE(Constants.app_urls.DRIVE.DRIVE_CATEGORY_ASSOCIATION.DELETE_DRIVE_CATEGORY_ASSOC, id).subscribe(data => {
          this.spinnerService.hide();
          this.commonService.showAlertMessage('Deleted Drive Category Asso Successfully');
          this.getDriveCategoryAssoData();
        }, error => {
          console.log('ERROR >>> ' + error);
          this.spinnerService.hide();
          this.commonService.showAlertMessage('Drive Category Asso Deletion Failed.');
        });
      }
      this.confirmDialogRef = null;
    });
  }
  ViewData(data) {
    const result = {
      title: 'Drives',
      dataSource: [{ label: 'Name', value: data.name }, { label: 'Description', value: data.description },
      { label: 'FromDate', value: data.fromDate }, { label: 'ToDate', value: data.toDate },
      { label: 'DepotType', value: data.depoType }, { label: 'AssetType', value: data.assetType },
      { label: 'Frequency', value: data.frequency }, { label: 'AssetDescription', value: data.assetDescription },
      { label: 'Criteria', value: data.criteria }, { label: 'TargetQuantity', value: data.targetQuantity },
      { label: 'IsIdRequired', value: data.isIdRequired }, { label: 'FunctionalUnit', value: data.functionalUnit },
      { label: 'CheckList', value: data.checkList }, { label: 'Active', value: data.active }]
    };
    this.dataViewDialogRef = this.dialog.open(DataViewDialogComponent, {
      disableClose: false,
      height: '400px',
      width: '80%',
      data: result,
    });
  }
  ViewDataDriveCat(data) {
    const result = {
      title: this.Titles.DRIVES,
      dataSource: [

        { label: FieldLabelsConstant.LABELS.NAME, value: data.name },
        { label: FieldLabelsConstant.LABELS.DESCRIPTION, value: data.description },
        { label: FieldLabelsConstant.LABELS.FROM_DATE, value: data.fromDate },
        { label: FieldLabelsConstant.LABELS.TO_DATE, value: data.toDate },
        { label: FieldLabelsConstant.LABELS.DEPOT_TYPE, value: data.depotType },
        { label: FieldLabelsConstant.LABELS.ASSET_TYPE, value: data.assetType },
        { label: FieldLabelsConstant.LABELS.FREQUENCY, value: data.frequency },
        { label: FieldLabelsConstant.LABELS.ASSET_DESCRIPTION, value: data.assetDescription },
        { label: FieldLabelsConstant.LABELS.CRITERIA, value: data.criteria },
        { label: FieldLabelsConstant.LABELS.TARGET_QUANTITY, value: data.targetQuantity },
        { label: FieldLabelsConstant.LABELS.IS_ID_REQUIRED, value: data.isIdRequired },
        { label: FieldLabelsConstant.LABELS.FUNCTIONAL_UNIT, value: data.functionalUnit },
        { label: FieldLabelsConstant.LABELS.CHECK_LIST, value: data.checkList },
        { label: FieldLabelsConstant.LABELS.ACTIVE, value: data.active },
        { label: FieldLabelsConstant.LABELS.AUTHORITY, value: data.authority }

      ]
    };
    this.dataViewDialogRef = this.dialog.open(DataViewDialogComponent, {
      disableClose: false,
      height: '400px',
      width: '80%',
      data: result,
    });
  }

  copy() {
    const dialogRef = this.dialog.open(CopyDrivesComponent, {
      height: '400px',
      width: '80%',
    });
    dialogRef.afterClosed().subscribe(result => {
      this.ngOnInit();
    });
  }

}

@Component({
  selector: 'copy-drives',
  templateUrl: 'copy-drives.component.html',
  providers: [
    {
      provide: DateAdapter, useClass: AppDateAdapter
    },
    {
      provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS
    }
  ]
})
export class CopyDrivesComponent implements OnInit {
  FiledLabels = FieldLabelsConstant.LABELS;
  Titles = FieldLabelsConstant.TITLE;

  driveFormGroup: FormGroup;
  driveCategoryList = [];
  drivesList = [];
  allDrives = [];
  drivesExists: boolean;
  dataSource: MatTableDataSource<DriveModel>;
  displayedColumns = ['sno', 'check', 'oldDriveName', 'newDriveName'];
  selectedDrives = [];
  year: any;
  driveCategory: any;
  createDrives: boolean;
  confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
  toMinDate: any;


  constructor(
    private formBuilder: FormBuilder,
    private spinnerService: Ng4LoadingSpinnerService,
    private sendAndRequestService: SendAndRequestService,
    private dialogRef: MatDialogRef<CopyDrivesComponent>,
    private commonService: CommonService,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.getDriveCategoryData();
    this.createDrives = false;
    this.driveFormGroup = this.formBuilder.group({
      driveCategory: [null, Validators.compose([Validators.required])],
      newDriveName: [null],
      oldDriveName: [null],
      fromDate: [null, Validators.compose([Validators.required])],
      toDate: [null]
    });
    this.year = new Date().getFullYear();
  }

  addEvent($event) {
    this.toMinDate = new Date($event.value);
  }

  saveAction() {
    const drives: DriveModel[] = [];
    this.confirmDialogRef = this.dialog.open(FuseConfirmDialogComponent, {
      disableClose: false

    });
    this.confirmDialogRef.componentInstance.confirmMessage = 'Do you want to copy existing documents and population to new Drives ?';
    this.confirmDialogRef.afterClosed().subscribe(result => {
      if (result) { }
      for (let i = 0; i < this.selectedDrives.length; i++) {
        this.selectedDrives[i].driveId.oldDriveId = this.selectedDrives[i].driveId.id;
        this.selectedDrives[i].driveId.id = 0;
        this.selectedDrives[i].driveId.name = this.selectedDrives[i].newDriveName;
        this.selectedDrives[i].driveId.functionalLocationTypes = this.selectedDrives[i].driveId.depotType;
        this.selectedDrives[i].driveId.depotType = '';
        if (!result) {
          this.selectedDrives[i].driveId.contentLink = null;
          this.selectedDrives[i].driveId.oldDriveId = '';
        }
        drives.push(this.selectedDrives[i].driveId);
      }
      const copyObject = {
        drivesRequest: drives,
        driveCategory: this.driveCategory
      };
      if (this.selectedDrives.length > 0) {
        this.driveCategory.id = 0;
        this.driveCategory.driveCategoryName = this.driveCategory.driveCategoryName + '_' + this.year;
        this.sendAndRequestService.requestForPOST(Constants.app_urls.DRIVE.DRIVE.COPY_DRIVES, copyObject, true).subscribe(data => {
          this.spinnerService.hide();
          this.commonService.showAlertMessage('Drives Created Successfully');
          this.allDrives = [];
          this.dataSource = new MatTableDataSource(this.allDrives);
          this.selectedDrives = [];
          this.drivesList = [];
          this.createDrives = false;
          this.driveFormGroup.reset();
          this.getDriveCategoryData();
        }, error => {
          console.log('ERROR >>> ' + error);
          this.spinnerService.hide();
        });
      }
    });


  }


  onCheckboxChange(e, row) {
    if (e.target.checked) {
      this.selectedDrives.push(row);
      this.createDrives = true;
    } else {
      this.selectedDrives.splice(row.index, 1);
      if (this.selectedDrives.length == 0) {
        this.createDrives = false;
      }
    }
  }

  copyDrivesFormSubmit() {
    this.driveCategory = this.driveFormGroup.controls['driveCategory'].value;
    this.drivesList = [];
    this.allDrives = [];
    this.dataSource = new MatTableDataSource(this.allDrives);
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE_CATEGORY_ASSOCIATION.GET_DRIVES_BASED_ON_CATEGORY + this.driveCategory.id).subscribe((data) => {
      this.drivesList = data;
      if (data) {
        this.drivesExists = true;
        for (let i = 0; i < this.drivesList.length; i++) {
          this.drivesList[i].sno = i + 1;
          this.drivesList[i].index = i;
          this.drivesList[i].driveId.name = this.drivesList[i].driveId.name;
          this.drivesList[i].driveId.fromDate = this.driveFormGroup.controls['fromDate'].value;
          if (this.driveFormGroup.controls['toDate'].value) {
            this.drivesList[i].driveId.toDate = this.driveFormGroup.controls['toDate'].value;
          } else {
            this.drivesList[i].driveId.toDate = null;
          }
          this.drivesList[i].newDriveName = this.drivesList[i].driveId.name + '_' + this.year;
          this.allDrives.push(this.drivesList[i]);
        }
        this.dataSource = new MatTableDataSource(this.allDrives);
      }
      this.spinnerService.hide();
    }, error => {
      this.spinnerService.hide();
    });
  }

  getDriveCategoryData() {
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.DRIVE_CATEGORY.GET_DRIVE_CATEGORY).subscribe((data) => {
      this.driveCategoryList = data;
      this.spinnerService.hide();
    }, error => {
      this.spinnerService.hide();
    });
  }

  onGoBack(): void {
    this.dialogRef.close();
  }

}


