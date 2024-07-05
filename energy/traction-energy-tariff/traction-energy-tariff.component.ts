import { OnInit, Component, ViewChild } from '@angular/core';
import { CommonService } from 'src/app/common/common.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { TractionEnergyTariffModel } from 'src/app/models/traction-energy-tariff.model';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { Constants } from 'src/app/common/constants';
import { MatTableDataSource, MatDialogRef, MatDialog, MatPaginator, MatSort } from '@angular/material';
import { TractionEnergyTariffPayload } from 'src/app/payloads/traction-energy-tariff.payload';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { DatePipe } from '@angular/common';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';
import { FuseConfirmDialogComponent } from '../../popup-dialogs/confirm-dialog/confirm-dialog.component';
import { DocumentDialogComponent } from '../../popup-dialogs/document-view-dialog/document-dialog.component';


@Component({
    selector: 'traction-energy-tariff',
    templateUrl: './traction-energy-tariff.component.html',
    styleUrls: []
})
export class TractionEnergyTariffComponent implements OnInit {

    pagination = Constants.PAGINATION_NUMBERS;
    FiledLabels = FieldLabelsConstant.LABELS;
    Titles = FieldLabelsConstant.TITLE;
    addPermission: boolean = true;
    editPermission: boolean = true;
    deletePermission: boolean = true;
    tractionEnergyTariffFormGroup: FormGroup;
    addTractionEnergyTariff: boolean = false;
    id: number = 0;
    title: string = Constants.EVENTS.ADD;
    tractionEnergyTariffList: any;
    editTractionEnergyTariffResponse: any;
    tractionEnergyTariffDataSource: MatTableDataSource<TractionEnergyTariffModel>;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    TractionEneTariffDisplayedColumns = ['sno', 'supplier', 'rate', 'fromDate', 'thruDate', 'specification', 'condition', 'id'];
    loggedUserData: any = JSON.parse(sessionStorage.getItem('userData'));
    contentCategoryList: any;
    contentTopicList: any;
    uploadFile: boolean = false;
    contentManagementFormGroup: FormGroup;
    selectedFiles: File[] = [];
    filesExists: boolean = false;
    tractionEnergyTariffId: any;
    pattern = '[a-zA-Z][a-zA-Z ]*';
    toMinDate = new Date();
    isSubmit: boolean = false;
    documentDialogRef: MatDialogRef<DocumentDialogComponent>;
    eleEnergySuppliersList: any;
    tariffResponse: any;
    enableSupplier: boolean;
    addEnable: boolean;
    maxDate = new Date();

    constructor(
        private commonService: CommonService,
        private dialog: MatDialog,
        private spinnerService: Ng4LoadingSpinnerService,
        private formBuilder: FormBuilder,
        private sendAndRequestService: SendAndRequestService,
        private datePipe: DatePipe

    ) {

    }

    ngOnInit() {
        var permissionName = this.commonService.getPermissionNameByLoggedData('ENERGY', 'TRACTION ENERGY TARIFF');//p == 0 ? 'No Permission' : p[0].permissionName;
        this.addPermission = this.commonService.getPermissionByType('Add', permissionName); //getPermission("Add", );
        this.editPermission = this.commonService.getPermissionByType('Edit', permissionName);
        this.deletePermission = this.commonService.getPermissionByType('Delete', permissionName);
        this.getTractionEnergyTariffData();
        this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_ENERGY_SUPPLIERS).subscribe((data) => {
            this.eleEnergySuppliersList = data;
        }, error => {
            this.commonService.showAlertMessage('Error in Get')
        });

    }

    duplicateFromDate() {
        const q = new Promise((resolve, reject) => {
            this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.TARIFF.EXISTS_FROM_DATE +
                this.tractionEnergyTariffFormGroup.controls['supplier'].value + '/' +
                this.tractionEnergyTariffFormGroup.controls['fromDate'].value
            ).subscribe((duplicate) => {
                if (duplicate) {
                    resolve({ 'duplicateFromDate': true });
                } else {
                    resolve(null);
                }
            }, () => { resolve({ 'duplicateFromDate': true }); });
        });
        return q;
    }

    addNewTractionEnergyTariff() {
        this.addTractionEnergyTariff = true;
        this.enableSupplier = true;
        this.title = 'Save';
        this.tractionEnergyTariffFormGroup = this.formBuilder.group({
            id: 0,
            'supplier': [null],
            'rate': [null],
            'specification': [null, Validators.maxLength(250)],
            'condition': [null, Validators.maxLength(250)],
            'fromDate': [null, Validators.required, this.duplicateFromDate.bind(this)],
            'thruDate': [null]
        });
    }

    addEvent($event) {
        this.toMinDate = new Date($event.value);
    }

    fileUpload(id) {
        this.uploadFile = true;
        this.addPermission = false;
        this.tractionEnergyTariffId = id;
        this.contentManagementFormGroup = this.formBuilder.group({
            contentCategory: [''],
            description: ['', Validators.compose([Validators.required, Validators.pattern(this.pattern)])],
            uploadFiles: ['', Validators.required],
            contentTopic: [''],
        });
    }

    public get f() { return this.contentManagementFormGroup.controls; }

    viewDocumentDetails(id) {
        this.spinnerService.show();
        this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.TARIFF.ATTACHMENT_LIST + id).subscribe((response) => {
            this.spinnerService.hide();
            if (response) {
                let data = {
                    response: response,
                    permissionName: this.commonService.getPermissionNameByLoggedData('TRACTION ENERGY TARIFF', 'DOCUMENTS')
                }
                this.documentDialogRef = this.dialog.open(DocumentDialogComponent, {
                    disableClose: false,
                    height: '600px',
                    width: '80%',
                    data: data,
                });
            }
        }, error => this.commonService.showAlertMessage(error));


    }

    removeFile(id) {
        this.selectedFiles.splice(id, 1);
        if (this.selectedFiles.length === 0) {
            this.addEnable = false;
            this.filesExists = false;
        }
    }

    onContentManagementSubmit() {
        let category = this.contentManagementFormGroup.value.contentCategory;
        let saveDetails = {
            'tractionEnergyTariffId': this.tractionEnergyTariffId,
            'description': this.contentManagementFormGroup.value.description,
            'divisionCode': this.loggedUserData.divisionCode,
            'createdBy': this.loggedUserData.id,
            'createdDate': new Date(),
            'contentCategory': 'OPERATIONS',
            'zonal': 'zonal',
            'FU': 'PSI',
            'contentTopic': 'TARIFF',
        }
        let formdata: FormData = new FormData();
        for (var i = 0; i < this.selectedFiles.length; i++) {
            formdata.append('file', this.selectedFiles[i]);
        }
        formdata.append('tractionEnergyTariffId', saveDetails.tractionEnergyTariffId);
        formdata.append('contentCategory', saveDetails.contentCategory);
        formdata.append('description', saveDetails.description);
        formdata.append('divisionCode', saveDetails.divisionCode);
        formdata.append('createdBy', saveDetails.createdBy);
        formdata.append('zonal', saveDetails.zonal);
        formdata.append('FU', saveDetails.FU);
        formdata.append('contentTopic', saveDetails.contentTopic);
        this.sendAndRequestService.requestForPOST(Constants.app_urls.ENERGY_BILL_PAYMENTS.TARIFF.TARIFF_UPLOAD_FILES, formdata, true).subscribe(data => {
            this.spinnerService.hide();
            this.commonService.showAlertMessage('Files Uploaded and Saved Successfully');
            this.selectedFiles = [];
            this.filesExists = false;
            this.addEnable = false;
            this.contentManagementFormGroup.reset();
            //window.location.reload();
        }, error => {
            console.log('ERROR >>> ' + error);
            this.spinnerService.hide();
            this.commonService.showAlertMessage('Files Uploading Failed.');
        })

    }

    upload(event) {
        if (event.target.files.length > 0) { this.filesExists = true; }
        for (var i = 0; i < event.target.files.length; i++) {
            this.addEnable = true;
            this.selectedFiles.push(event.target.files[i]);
        }
    }

    onTractionEneTariffSubmit() {
        TractionEnergyTariffPayload.ADD_PAYLOAD.supplier = this.tractionEnergyTariffFormGroup.value.supplier;
        TractionEnergyTariffPayload.ADD_PAYLOAD.rate = this.tractionEnergyTariffFormGroup.value.rate;
        TractionEnergyTariffPayload.ADD_PAYLOAD.specification = this.tractionEnergyTariffFormGroup.value.specification;
        TractionEnergyTariffPayload.ADD_PAYLOAD.condition = this.tractionEnergyTariffFormGroup.value.condition;
        TractionEnergyTariffPayload.ADD_PAYLOAD.fromDate = this.tractionEnergyTariffFormGroup.value.fromDate;
        TractionEnergyTariffPayload.ADD_PAYLOAD.thruDate = this.tractionEnergyTariffFormGroup.value.thruDate;
        TractionEnergyTariffPayload.ADD_PAYLOAD.createdBy = this.loggedUserData.username;
        if (this.title == Constants.EVENTS.SAVE) {
            this.sendAndRequestService.requestForPOST(Constants.app_urls.ENERGY_BILL_PAYMENTS.TARIFF.SAVE_TARIFF, TractionEnergyTariffPayload.ADD_PAYLOAD, false).subscribe((data) => {
                this.tariffResponse = data;
                if (this.tariffResponse.code == 200 && !!this.tariffResponse) {
                    this.commonService.showAlertMessage(this.tariffResponse.message);
                    this.getTractionEnergyTariffData();
                    this.tractionEnergyTariffFormGroup.reset();
                    this.addTractionEnergyTariff = false;
                } else {
                    this.commonService.showAlertMessage(' Tariff Data Saving Failed.');
                }
            }, error => {
                this.commonService.showAlertMessage(' Tariff Data Saving Failed.')
            })
        } else if (this.title == Constants.EVENTS.UPDATE) {
            TractionEnergyTariffPayload.UPDATE_PAYLOAD.id = this.editTractionEnergyTariffResponse.id;
            TractionEnergyTariffPayload.UPDATE_PAYLOAD.supplier = this.tractionEnergyTariffFormGroup.value.supplier;
            TractionEnergyTariffPayload.UPDATE_PAYLOAD.rate = this.tractionEnergyTariffFormGroup.value.rate;
            TractionEnergyTariffPayload.UPDATE_PAYLOAD.specification = this.tractionEnergyTariffFormGroup.value.specification;
            TractionEnergyTariffPayload.UPDATE_PAYLOAD.condition = this.tractionEnergyTariffFormGroup.value.condition;
            // TractionEnergyTariffPayload.UPDATE_PAYLOAD.year = this.tractionEnergyTariffFormGroup.value.year;
            TractionEnergyTariffPayload.UPDATE_PAYLOAD.fromDate = this.tractionEnergyTariffFormGroup.value.fromDate;
            TractionEnergyTariffPayload.UPDATE_PAYLOAD.thruDate = this.tractionEnergyTariffFormGroup.value.thruDate;
            TractionEnergyTariffPayload.UPDATE_PAYLOAD.updatedBy = this.loggedUserData.username;
            this.sendAndRequestService.requestForPUT(Constants.app_urls.ENERGY_BILL_PAYMENTS.TARIFF.UPDATE_TARIFF, TractionEnergyTariffPayload.UPDATE_PAYLOAD, false).subscribe((data) => {
                this.tariffResponse = data;
                if (this.tariffResponse.code == 200 && !!this.tariffResponse) {
                    this.commonService.showAlertMessage(this.tariffResponse.message);
                    this.getTractionEnergyTariffData();
                    this.tractionEnergyTariffFormGroup.reset();
                    this.addTractionEnergyTariff = false;
                    this.title = Constants.EVENTS.ADD;
                } else {
                    this.commonService.showAlertMessage('Tariff Data Updating Failed.');
                }
            }, error => {
                this.commonService.showAlertMessage('Tariff Data Updating Failed.')
            });

        }
    }

    onGoBack() {
        this.tractionEnergyTariffFormGroup.reset();
        this.addTractionEnergyTariff = false;
        this.title = Constants.EVENTS.ADD;
    }

    close() {
        this.contentManagementFormGroup.reset();
        this.uploadFile = false;
        this.selectedFiles = [];
        this.filesExists = false;
        this.addPermission = true;
    }


    getTractionEnergyTariffData() {
        const tractionEnergyTariff: TractionEnergyTariffModel[] = [];
        this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.TARIFF.GET_TARIFF).subscribe((data) => {
            this.tractionEnergyTariffList = data;
            for (let i = 0; i < this.tractionEnergyTariffList.length; i++) {
                this.tractionEnergyTariffList[i].sno = i + 1;
                this.tractionEnergyTariffList[i].fromDate = this.datePipe.transform(this.tractionEnergyTariffList[i].fromDate, 'dd-MM-yyyy hh:mm:ss');
                this.tractionEnergyTariffList[i].thruDate = this.datePipe.transform(this.tractionEnergyTariffList[i].thruDate, 'dd-MM-yyyy hh:mm:ss');
                tractionEnergyTariff.push(this.tractionEnergyTariffList[i]);
            }
            this.tractionEnergyTariffDataSource = new MatTableDataSource(tractionEnergyTariff);
            this.tractionEnergyTariffDataSource.paginator = this.paginator;
            this.tractionEnergyTariffDataSource.sort = this.sort;
        }, error => {
            this.spinnerService.hide();
        });
    }

    editTractionEneTariff(id) {
        this.spinnerService.show();
        this.addTractionEnergyTariff = true;
        this.tractionEnergyTariffEditAction(id);
        this.title = Constants.EVENTS.UPDATE;
        this.spinnerService.hide();
        this.enableSupplier = false;
    }

    tractionEnergyTariffEditAction(id: number) {
        this.tractionEnergyTariffFormGroup = this.formBuilder.group({
            id: 0,
            'supplier': [null],
            'rate': [null],
            'specification': [null, Validators.maxLength(250)],
            'condition': [null, Validators.maxLength(250)],
            'fromDate': [null, Validators.required, this.duplicateFromDateAndId.bind(this)],
            'thruDate': [null]
        });
        this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.TARIFF.GET_TARIFF_ID + id)
            .subscribe((responseData) => {
                this.editTractionEnergyTariffResponse = responseData;
                if (this.editTractionEnergyTariffResponse.thruDate) {
                    this.toMinDate = new Date(this.editTractionEnergyTariffResponse.fromDate);
                }
                this.tractionEnergyTariffFormGroup.patchValue({
                    id: this.editTractionEnergyTariffResponse.id,
                    supplier: this.editTractionEnergyTariffResponse.supplier,
                    rate: this.editTractionEnergyTariffResponse.rate,
                    fromDate: !!this.editTractionEnergyTariffResponse.fromDate ? new Date(this.editTractionEnergyTariffResponse.fromDate) : '',
                    thruDate: !!this.editTractionEnergyTariffResponse.thruDate ? new Date(this.editTractionEnergyTariffResponse.thruDate) : '',
                    specification: this.editTractionEnergyTariffResponse.specification,
                    condition: this.editTractionEnergyTariffResponse.condition
                });
            }, error => { });
        this.id = id;


        if (!isNaN(this.id)) {
            this.title = Constants.EVENTS.UPDATE;
        } else {
            this.title = Constants.EVENTS.ADD;
        }
    }

    duplicateFromDateAndId() {
        const q = new Promise((resolve, reject) => {
            this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.TARIFF.EXISTS_FROM_DATE_AND_ID +
                this.tractionEnergyTariffFormGroup.controls['supplier'].value + '/' +
                this.tractionEnergyTariffFormGroup.controls['fromDate'].value + '/' + this.id
            ).subscribe((duplicate) => {
                if (duplicate) {
                    resolve({ 'duplicateFromDateAndId': true });
                } else {
                    resolve(null);
                }
            }, () => { resolve({ 'duplicateFromDateAndId': true }); });
        });
        return q;
    }


    deleteTractionEneTariff(id) {
        this.addTractionEnergyTariff = false;
        this.confirmDialogRef = this.dialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });
        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete the selected tarction energy tariff?';
        this.confirmDialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.sendAndRequestService.requestForDELETE(Constants.app_urls.ENERGY_BILL_PAYMENTS.TARIFF.DELETE_TARIFF, id).subscribe((data) => {
                    this.tariffResponse = data;
                    if (this.tariffResponse.code == 200 && !!this.tariffResponse) {
                        this.commonService.showAlertMessage(this.tariffResponse.message);
                        this.getTractionEnergyTariffData();
                    } else {
                        this.commonService.showAlertMessage('Tariff Deletion Failed.');
                    }
                }, error => { });
            }
        });
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.tractionEnergyTariffDataSource.filter = filterValue;
    }

}