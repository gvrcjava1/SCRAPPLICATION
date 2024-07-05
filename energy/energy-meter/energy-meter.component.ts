import { OnInit, Component, ViewChild } from '@angular/core';
import { CommonService } from 'src/app/common/common.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Constants } from 'src/app/common/constants';
import { EnergyMeterModel } from 'src/app/models/energy-meter.model';
import { MatTableDataSource, MatPaginator, MatSort, MatDialogRef, MatDialog } from '@angular/material';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { DatePipe } from '@angular/common';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';
import { FuseConfirmDialogComponent } from '../../popup-dialogs/confirm-dialog/confirm-dialog.component';
import { DataViewDialogComponent } from '../../popup-dialogs/data-view-dialog/data-view-dialog.component';
import { FuseConfirmPopupComponent } from '../../popup-dialogs/confirm-popup/confirm-popup.component';

@Component({
    selector: 'energy-meter',
    templateUrl: './energy-meter.component.html',
    styleUrls: [],
})
export class EnergyMeterComponent implements OnInit {

    pagination = Constants.PAGINATION_NUMBERS;
    FiledLabels = FieldLabelsConstant.LABELS;
    Titles = FieldLabelsConstant.TITLE;
    addPermission: boolean = true;
    editPermission: boolean = true;
    deletePermission: boolean = true;
    id: number = 0;
    title: string = Constants.EVENTS.ADD;
    energyMeterFormGroup: FormGroup;
    energyMeterList: any;
    energyMeterDataSource: MatTableDataSource<EnergyMeterModel>;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    editEnergyMeterResponse: any;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    addEnergyMeter: boolean;
    energyMeterDisplayColumns = ['sno', 'cmd', 'feederId', 'startKvah', 'startKwh', 'id'];
    tssFeederMaterList: any;
    energyMeterResponse: any;
    toMinDate = new Date();
    enableEndReadings: boolean;
    loggedUserData: any = JSON.parse(sessionStorage.getItem('userData'));
    tssFeeder: any;
    dataViewDialogRef: MatDialogRef<DataViewDialogComponent>;
    maxDate = new Date();
    orginalDivisionsData: any = JSON.parse(sessionStorage.getItem('divisionData'));
    checkDivisionUser: boolean;
    divCode: string;
    userDefaultData: any;
    orginalTssFeeders: any;
    depotsData: any = JSON.parse(sessionStorage.getItem('depotData'));
    depotsList = [];
    tssList: any;
    feedersArray = [];
    resp: any;
    updateEnable: any;

    constructor(
        private commonService: CommonService,
        private formBuilder: FormBuilder,
        private dialog: MatDialog,
        private spinnerService: Ng4LoadingSpinnerService,
        private sendAndRequestService: SendAndRequestService,
        private datePipe: DatePipe

    ) {

    }

    ngOnInit() {
        this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_TSS_FEEDER_MASTER_DETAILS).subscribe((data) => {
            this.orginalTssFeeders = data;
        }, error => { });
        var permissionName = this.commonService.getPermissionNameByLoggedData("ENERGY", "ENERGY METER");
        this.addPermission = this.commonService.getPermissionByType("Add", permissionName);
        this.editPermission = this.commonService.getPermissionByType("Edit", permissionName);
        this.deletePermission = this.commonService.getPermissionByType("Delete", permissionName);
        this.getAllEnergyMeterData();

        if (this.orginalDivisionsData.length > 0) {
            this.checkDivisionUser = true;
        } else {
            this.checkDivisionUser = false;
        }
        //this.getUserContext();
    }

    getUserContext() {
        this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_USER_DEFAULT_DATA + this.loggedUserData.username).subscribe((data) => {
            this.userDefaultData = data;
            if (this.userDefaultData.division) {
                this.divCode = this.userDefaultData.division.toUpperCase();
                if (!this.checkDivisionUser) {
                    this.depotsList = this.depotsData.filter(value => {
                        if (this.divCode) {
                            return value.dataDiv.toLowerCase() == this.divCode.toLowerCase() && value.depotType == 'PSI';
                        }
                    });
                    if (this.depotsList.length > 0) {
                        this.tssList = this.depotsData.filter(value => {
                            return value.parentDepot == this.depotsList[0].facilityName && value.depotType == 'TSS';
                        });
                        if (this.tssList) {
                            this.tssFeederMaterList = [];
                            this.feedersArray = [];
                            this.tssList.filter(value => {
                                this.orginalTssFeeders.filter(tss => {
                                    if (value.facilityName == tss.tssName) {
                                        this.feedersArray.push(tss);
                                    }
                                });
                            });
                            this.tssFeederMaterList = this.feedersArray;
                        }
                    }
                } else {
                    this.tssFeederMaterList = this.orginalTssFeeders.filter(value => {
                        return value.dataDiv.toLowerCase() == this.divCode.toLowerCase();
                    });
                }
            }
        });
    }

    getTssFeeders($event) {
        if ($event.value) {
            this.tssFeederMaterList = this.orginalTssFeeders.filter(value => {
                return value.dataDiv.toLowerCase() == $event.value.toLowerCase();
            });
        }

    }

    duplicateFeederAndStartDate() {
        const feeder = this.energyMeterFormGroup.controls['feederId'].value;
        const q = new Promise((resolve, reject) => {
            this.sendAndRequestService.requestForGET(
                Constants.app_urls.ENERGY_BILL_PAYMENTS.ENERGY_METER.EXISTS_FEEDER_START_DATE +
                feeder.feederId + '/' +
                this.energyMeterFormGroup.controls['startDate'].value
            ).subscribe((duplicate) => {
                if (duplicate) {
                    resolve({ duplicateFeederAndStartDate: true });
                } else {
                    resolve(null);
                }
            }, () => { resolve({ duplicateFeederAndStartDate: true }); });
        });
        return q;
    }

    addEvent($event) {
        this.toMinDate = new Date($event.value);
    }

    energyMeterSubmit() {
        const cmd: string = this.energyMeterFormGroup.value.cmd;
        const feederId: Date = this.energyMeterFormGroup.value.feederId.feederId;
        const startKvah: string = this.energyMeterFormGroup.value.startKvah;
        const startKwh: string = this.energyMeterFormGroup.value.startKwh;
        const startRkvahLag: string = this.energyMeterFormGroup.value.startRkvahLag;
        const startRkvahLead: string = this.energyMeterFormGroup.value.startRkvahLead;
        const endKvah: string = this.energyMeterFormGroup.value.endKvah;
        const endKwh: string = this.energyMeterFormGroup.value.endKwh;
        const endRkvahLag: string = this.energyMeterFormGroup.value.endRkvahLag;
        const endRkvahLead: string = this.energyMeterFormGroup.value.endRkvahLead;
        const meterNo: string = this.energyMeterFormGroup.value.meterNo;
        const multiplicationFac: string = this.energyMeterFormGroup.value.multiplicationFac;
        const meterMake: string = this.energyMeterFormGroup.value.meterMake;
        const meterModel: string = this.energyMeterFormGroup.value.meterModel;
        const remarks: string = this.energyMeterFormGroup.value.remarks;
        const startDate: string = this.energyMeterFormGroup.value.startDate;
        const endDate: string = this.energyMeterFormGroup.value.endDate;
        const dataDiv: string = this.energyMeterFormGroup.value.feederId.dataDiv;
        this.addEnergyMeter = false;

        if (this.title == Constants.EVENTS.ADD) {
            var saveEnergyMeterModel = {
                cmd: cmd,
                startKvah: startKvah,
                feederId: feederId,
                startKwh: startKwh,
                startRkvahLag: startRkvahLag,
                startRkvahLead: startRkvahLead,
                endKvah: endKvah,
                endKwh: endKwh,
                endRkvahLag: endRkvahLag,
                endRkvahLead: endRkvahLead,
                meterNo: meterNo,
                multiplicationFac: multiplicationFac,
                meterMake: meterMake,
                meterModel: meterModel,
                remarks: remarks,
                startDate: startDate,
                endDate: endDate,
                dataDiv: dataDiv
            }
            this.sendAndRequestService.requestForPOST(Constants.app_urls.ENERGY_BILL_PAYMENTS.ENERGY_METER.SAVE_ENERGY_METER, saveEnergyMeterModel, false).subscribe(data => {
                this.energyMeterResponse = data;
                if (this.energyMeterResponse.code == 200 && !!this.energyMeterResponse) {
                    this.commonService.showAlertMessage(this.energyMeterResponse.message);
                    this.getAllEnergyMeterData();
                    this.energyMeterFormGroup.reset();
                } else {
                    this.commonService.showAlertMessage("Energy Meter Data Saving Failed.");
                }
                this.spinnerService.hide();
            }, error => {
                console.log('ERROR >>> ' + error);
                this.spinnerService.hide();
                this.commonService.showAlertMessage("Energy Meter Data Saving Failed.");
            });
        } else if (this.title == Constants.EVENTS.UPDATE) {

            const id: number = this.editEnergyMeterResponse.id;
            var updateEnergyMeterModel = {
                id: id,
                cmd: cmd,
                startKvah: startKvah,
                feederId: this.editEnergyMeterResponse.feederId,
                startKwh: startKwh,
                startRkvahLag: startRkvahLag,
                startRkvahLead: startRkvahLead,
                endKvah: endKvah,
                endKwh: endKwh,
                endRkvahLag: endRkvahLag,
                endRkvahLead: endRkvahLead,
                meterNo: meterNo,
                multiplicationFac: multiplicationFac,
                meterMake: meterMake,
                meterModel: meterModel,
                remarks: remarks,
                startDate: startDate,
                endDate: endDate,
                dataDiv: this.editEnergyMeterResponse.dataDiv,
                seqId: this.editEnergyMeterResponse.seqId

            }
            this.sendAndRequestService.requestForPUT(Constants.app_urls.ENERGY_BILL_PAYMENTS.ENERGY_METER.UPDATE_ENERGY_METER, updateEnergyMeterModel, false).subscribe(data => {
                this.energyMeterResponse = data;
                if (this.energyMeterResponse.code == 200 && !!this.energyMeterResponse) {
                    this.commonService.showAlertMessage(this.energyMeterResponse.message);
                    this.getAllEnergyMeterData();
                    this.energyMeterFormGroup.reset();
                    this.addEnergyMeter = false;
                    this.title = Constants.EVENTS.ADD;
                } else {
                    this.commonService.showAlertMessage("Energy Meter Data Updating Failed.");
                }
            }, error => {
                console.log('ERROR >>> ' + error);
                this.spinnerService.hide();
                this.commonService.showAlertMessage("Energy Meter Data Updating Failed.");
            })
        }


    }

    editEnergyMeter(id) {
        this.addEnergyMeter = true;
        this.energyMeterEditAction(id);
        this.title = 'Update';
        this.enableEndReadings = true;
    }

    energyMeterEditAction(id: number) {
        this.energyMeterFormGroup = this.formBuilder.group({
            id: 0,
            meterNo: [null],
            multiplicationFac: [null, Validators.required],
            startKvah: [null, Validators.required],
            startKwh: [null, Validators.required],
            startRkvahLag: [null],
            startRkvahLead: [null],
            endKvah: [null],
            endKwh: [null],
            endRkvahLag: [null],
            endRkvahLead: [null],
            meterMake: [null],
            meterModel: [null],
            cmd: [null, Validators.max(100)],
            remarks: [null, Validators.maxLength(250)],
            startDate: [null, Validators.required],
            endDate: [null],
            feederId: [null],
            dataDiv: [null]
        });
        this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.ENERGY_METER.GET_ENERGY_METER_ID + id).subscribe((responseData) => {
            this.editEnergyMeterResponse = responseData;
            this.toMinDate = new Date(this.editEnergyMeterResponse.startDate);
            this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_TSS_FEEDER_BASED_ON_FEEDER_ID + '/' + this.editEnergyMeterResponse.feederId).subscribe((response) => {
                this.tssFeeder = response;
                this.energyMeterFormGroup.patchValue({ feederId: this.tssFeeder.feederName })
            });
            this.energyMeterFormGroup.patchValue({
                id: this.editEnergyMeterResponse.id,
                cmd: this.editEnergyMeterResponse.cmd,
                startKvah: this.editEnergyMeterResponse.startKvah,
                startKwh: this.editEnergyMeterResponse.startKwh,
                startRkvahLag: this.editEnergyMeterResponse.startRkvahLag,
                startRkvahLead: this.editEnergyMeterResponse.startRkvahLead,
                endKvah: this.editEnergyMeterResponse.endKvah,
                endKwh: this.editEnergyMeterResponse.endKwh,
                endRkvahLag: this.editEnergyMeterResponse.endRkvahLag,
                endRkvahLead: this.editEnergyMeterResponse.endRkvahLead,
                meterNo: this.editEnergyMeterResponse.meterNo,
                multiplicationFac: this.editEnergyMeterResponse.multiplicationFac,
                meterMake: this.editEnergyMeterResponse.meterMake,
                meterModel: this.editEnergyMeterResponse.meterModel,
                remarks: this.editEnergyMeterResponse.remarks,
                startDate: !!this.editEnergyMeterResponse.startDate ? new Date(this.editEnergyMeterResponse.startDate) : '',
                endDate: !!this.editEnergyMeterResponse.endDate ? new Date(this.editEnergyMeterResponse.endDate) : ''
            })
            this.toMinDate = new Date(this.editEnergyMeterResponse.startDate);
            this.getUserContext();

        }, error => { })
        this.id = id;
        if (!isNaN(this.id)) {
            this.title = Constants.EVENTS.UPDATE;
        } else {
            this.title = Constants.EVENTS.ADD;
        }
    }


    getAllEnergyMeterData() {
        const energyMeter: EnergyMeterModel[] = [];
        this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.ENERGY_METER.GET_ENERGY_METER + '/' + this.loggedUserData.username).subscribe((data) => {
            this.energyMeterList = data;
            this.spinnerService.show();
            for (let i = 0; i < this.energyMeterList.length; i++) {
                this.energyMeterList[i].sno = i + 1;
                /*
                this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_TSS_FEEDER_BASED_ON_FEEDER_ID+'/'+this.energyMeterList[i].feederId).subscribe((response) => {
                    this.tssFeeder = response;
                    this.energyMeterList[i].feederId = this.tssFeeder.feederName;
                });
                */
                energyMeter.push(this.energyMeterList[i]);
            }
            this.energyMeterDataSource = new MatTableDataSource(energyMeter);
            this.energyMeterDataSource.paginator = this.paginator;
            this.energyMeterDataSource.sort = this.sort;
            this.spinnerService.hide();
        }, error => {
            this.spinnerService.hide();
        });

    }

    deleteEnergyMeter(id) {
        this.addEnergyMeter = false;
        this.confirmDialogRef = this.dialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });
        this.confirmDialogRef.componentInstance.confirmMessage = "Are you sure you want to delete the selected Energy Meter?";
        this.confirmDialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.sendAndRequestService.requestForDELETE(Constants.app_urls.ENERGY_BILL_PAYMENTS.ENERGY_METER.DELETE_ENERGY_METER, id).subscribe(data => {
                    this.energyMeterResponse = data;
                    if (this.energyMeterResponse.code == 200 && !!this.energyMeterResponse) {
                        this.confirmDialogRef = this.dialog.open(FuseConfirmPopupComponent, {
                            disableClose: false
                        });
                        this.confirmDialogRef.componentInstance.confirmMessage = this.energyMeterResponse.message;
                        this.getAllEnergyMeterData();
                    } else {
                        this.commonService.showAlertMessage("Energy Meter Deletion Failed.");
                    }
                }, error => {
                    console.log('ERROR >>> ' + error);
                    this.spinnerService.hide();
                    this.commonService.showAlertMessage("Energy Meter Deletion Failed.");
                });
            }
        });
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.energyMeterDataSource.filter = filterValue;
    }

    onGoBack() {
        this.energyMeterFormGroup.reset();
        this.addEnergyMeter = false;
        this.title = Constants.EVENTS.ADD;
    }

    newEnergyMeter() {
        this.addEnergyMeter = true;
        this.enableEndReadings = false;
        this.getUserContext();
        this.energyMeterFormGroup = this.formBuilder.group({
            id: 0,
            meterNo: [null],
            multiplicationFac: [null, Validators.required],
            startKvah: [null, Validators.required],
            startKwh: [null, Validators.required],
            startRkvahLag: [null],
            startRkvahLead: [null],
            endKvah: [null],
            endKwh: [null],
            endRkvahLag: [null],
            endRkvahLead: [null],
            meterMake: [null],
            meterModel: [null],
            cmd: [null, Validators.max(100)],
            remarks: [null, Validators.maxLength(250)],
            startDate: [null, Validators.required, this.duplicateFeederAndStartDate.bind(this)],
            endDate: [null],
            feederId: [null, Validators.required, this.dupllicateFeederhavingEndDate.bind(this)],
            dataDiv: [null]
        });
    }

    dupllicateFeederhavingEndDate() {
        const feeder = this.energyMeterFormGroup.controls['feederId'].value;
        const q = new Promise((resolve, reject) => {
            this.sendAndRequestService.requestForGET(
                Constants.app_urls.ENERGY_BILL_PAYMENTS.ENERGY_METER.EXISTS_FEEDER_HAVING_END_DATE + feeder.feederId
            ).subscribe((duplicate) => {
                if (duplicate) {
                    resolve({ dupllicateFeederhavingEndDate: true });
                } else {
                    resolve(null);
                }
            }, () => { resolve({ dupllicateFeederhavingEndDate: true }); });
        });
        return q;
    }

    ViewData(data) {
        var result = {
            title: this.Titles.ENERGY_METER,
            dataSource: [
                { label: FieldLabelsConstant.LABELS.FEEDER, value: data.feederId },
                { label: FieldLabelsConstant.LABELS.START_DATE, value: this.datePipe.transform(data.startDate, 'dd-MM-yyyy hh:mm:ss') },
                { label: FieldLabelsConstant.LABELS.MULTIPLICATION_FACTOR, value: data.multiplicationFac },
                { label: FieldLabelsConstant.LABELS.METER_NUMBER, value: data.meterNo },
                { label: FieldLabelsConstant.LABELS.CMD, value: data.cmd },
                { label: FieldLabelsConstant.LABELS.START_KVAH, value: data.startKvah },
                { label: FieldLabelsConstant.LABELS.START_KWH, value: data.startKwh },
                { label: FieldLabelsConstant.LABELS.START_RKVAH_LAG, value: data.startRkvahLag },
                { label: FieldLabelsConstant.LABELS.START_RKVAH_LEAD, value: data.startRkvahLead },
                { label: FieldLabelsConstant.LABELS.END_DATE, value: this.datePipe.transform(data.endDate, 'dd-MM-yyyy hh:mm:ss') },
                { label: FieldLabelsConstant.LABELS.END_KVAH, value: data.endKvah },
                { label: FieldLabelsConstant.LABELS.END_KWH, value: data.endKwh },
                { label: FieldLabelsConstant.LABELS.END_RKVAH_LAG, value: data.endRkvahLag },
                { label: FieldLabelsConstant.LABELS.END_RKVAH_LEAD, value: data.endRkvahLead },
                { label: FieldLabelsConstant.LABELS.METER_MAKE, value: data.meterMake },
                { label: FieldLabelsConstant.LABELS.METER_MODEL, value: data.meterModel },
                { label: FieldLabelsConstant.LABELS.REMARKS, value: data.remarks },

            ]
        }
        this.dataViewDialogRef = this.dialog.open(DataViewDialogComponent, {
            disableClose: false,
            height: '400px',
            width: '80%',
            data: result,
        });
    }

    endDateValidation() {
        this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.ENERGY_METER.END_DATE_VALIDATION + this.editEnergyMeterResponse.feederId + '/' +
            this.energyMeterFormGroup.controls['endDate'].value).subscribe((data) => {
                this.resp = data;
                this.spinnerService.show();
                if (this.resp.code === 200) {
                    if (this.resp.message != null && this.resp.message != '') {
                        this.confirmDialogRef = this.dialog.open(FuseConfirmPopupComponent, {
                            disableClose: false

                        });
                        this.confirmDialogRef.componentInstance.confirmMessage = this.resp.message;
                        this.energyMeterFormGroup.setErrors({ invalid: true });
                    }


                }

            }, error => {
                this.spinnerService.hide();
            });
        this.endReadings();
        this.checkEndReadingValidations();

    }
    endReadings() {
        this.confirmDialogRef = this.dialog.open(FuseConfirmPopupComponent, {
            disableClose: false

        });
        this.confirmDialogRef.componentInstance.confirmMessage = "Please update the energy meter reading values with end readings " + this.energyMeterFormGroup.controls['feederId'].value + " " + this.energyMeterFormGroup.controls['endDate'].value + " meter change  to ensure that no loss of power consumption for the feeder";
    }
    checkEndReadingValidations() {

        if (this.energyMeterFormGroup.controls['endDate'].value != null) {
            this.energyMeterFormGroup.setErrors({ invalid: true });
            if (this.energyMeterFormGroup.value.endKvah == '' || this.energyMeterFormGroup.value.endKvah == null) {
                this.energyMeterFormGroup.setErrors({ invalid: true });
                this.confirmDialogRef = this.dialog.open(FuseConfirmPopupComponent, {
                    disableClose: false

                });
                this.confirmDialogRef.componentInstance.confirmMessage = "Please enter end values";

            } else if (this.energyMeterFormGroup.value.endKwh == '' || this.energyMeterFormGroup.value.endKwh == null) {
                this.energyMeterFormGroup.setErrors({ invalid: true });
                this.confirmDialogRef = this.dialog.open(FuseConfirmPopupComponent, {
                    disableClose: false

                });
                this.confirmDialogRef.componentInstance.confirmMessage = "Please enter end values";

            } else {
                this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.ENERGY_METER.CHECK_ENERGY_METER_READING_AND_CONSUMPTION + this.editEnergyMeterResponse.id + '/' + this.energyMeterFormGroup.controls['endDate'].value + '/' + this.energyMeterFormGroup.controls['endKvah'].value + '/' + this.energyMeterFormGroup.controls['endKwh'].value).subscribe(data => {
                    this.resp = data;
                    if (this.resp.code == 200 && this.resp.message == "Consumption Already Created") {
                        this.confirmDialogRef = this.dialog.open(FuseConfirmDialogComponent, {
                            disableClose: false
                        });
                        this.confirmDialogRef.componentInstance.confirmMessage = "Energy consumption reading (KVAH, KWH) for feeder '" + this.energyMeterFormGroup.controls['feederId'].value + "' of date '" + this.datePipe.transform(this.energyMeterFormGroup.controls['endDate'].value, 'dd-MM-yyyy') + "' is being updated with these end readings, please confirm.";
                        this.confirmDialogRef.afterClosed().subscribe(result => {
                            if (result) {
                                this.energyMeterFormGroup.setErrors(null);
                                this.updateEnable = true;

                                this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.ENERGY_METER.UPDATE_CONSUMPTION_WITH_END_READINGS + this.editEnergyMeterResponse.id + '/' + this.energyMeterFormGroup.controls['endDate'].value + '/' + this.energyMeterFormGroup.controls['endKvah'].value + '/' + this.energyMeterFormGroup.controls['endKwh'].value).subscribe(data => {
                                }, error => {
                                    console.log('ERROR >>> ' + error);
                                    this.spinnerService.hide();
                                });
                            }
                        });
                    } else if (this.resp.code == 200 && this.resp.message == "Consumption Not Created") {
                        this.energyMeterFormGroup.setErrors({ invalid: true });
                        this.confirmDialogRef = this.dialog.open(FuseConfirmPopupComponent, {
                            disableClose: false
                        });
                        this.confirmDialogRef.componentInstance.confirmMessage = "Energy consumption reading has not recorded on this date" + this.datePipe.transform(this.energyMeterFormGroup.controls['endDate'].value, 'dd-MM-yyyy') + "  for this feeder " + this.energyMeterFormGroup.controls['feederId'].value + ".please enter the readings as of end meter readings.";
                        this.updateEnable = false
                    } else if (this.resp.code == 200 && this.resp.message == "Energy Meter Miss Matched") {
                        this.energyMeterFormGroup.setErrors({ invalid: true });
                        this.confirmDialogRef = this.dialog.open(FuseConfirmPopupComponent, {
                            disableClose: false
                        });
                        this.confirmDialogRef.componentInstance.confirmMessage = "Replaced meter start date '" + this.datePipe.transform(this.energyMeterFormGroup.controls['endDate'].value, 'dd-MM-yyyy') + "' the end date should be" + this.datePipe.transform(this.energyMeterFormGroup.controls['endDate'].value, 'dd-MM-yyyy') + " only";
                        this.updateEnable = false
                    }

                    //this.energyMeterResponse = data;
                    /*
                    if(this.energyMeterResponse.code == 200 && !!this.energyMeterResponse) {
                        this.commonService.showAlertMessage(this.energyMeterResponse.message);
                        this.getAllEnergyMeterData();
                        this.energyMeterFormGroup.reset();
                        this.addEnergyMeter =  false;
                        this.title = Constants.EVENTS.ADD;
                    }else {
                        this.commonService.showAlertMessage("Energy Meter Data Updating Failed.");
                    }
                    */

                }, error => {
                    console.log('ERROR >>> ' + error);
                    this.spinnerService.hide();
                    this.commonService.showAlertMessage("Energy Meter Data Updating Failed.");
                })


            }
        } else {
            this.updateEnable = true;
        }


    }
    endDateAndEndReadingsValidation() {

        if (this.energyMeterFormGroup.value.endDate == '' && this.energyMeterFormGroup.value.endKvah != null && this.energyMeterFormGroup.value.endKwh != null && (this.energyMeterFormGroup.value.endRkvahLag != null || this.energyMeterFormGroup.value.endRkvahLag == null) && (this.energyMeterFormGroup.value.endRkvahLead == null || this.energyMeterFormGroup.value.endRkvahLead != null)) {
            this.energyMeterFormGroup.setErrors({ invalid: true });
            if (this.energyMeterFormGroup.value.endDate == '' && this.energyMeterFormGroup.value.endKvah != null) {

                this.energyMeterFormGroup.setErrors({ invalid: true });
            } else if (this.energyMeterFormGroup.value.endDate == '' && this.energyMeterFormGroup.value.endKwh != null) {

                this.energyMeterFormGroup.setErrors({ invalid: true });
            } else {

                this.energyMeterFormGroup.setErrors(null)
                this.updateEnable = true;
            }
        }


    }
}