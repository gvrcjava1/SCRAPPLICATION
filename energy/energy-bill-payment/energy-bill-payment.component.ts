import { OnInit, Component, ViewChild } from '@angular/core';
import { CommonService } from 'src/app/common/common.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { EnergyBillPaymentModel } from 'src/app/models/energy-bill-payment.model';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { Constants } from 'src/app/common/constants';
import { MatTableDataSource, MatDialogRef, MatDialog, MatPaginator, MatSort, DateAdapter, MAT_DATE_FORMATS } from '@angular/material';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { DatePipe } from '@angular/common'
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';
import { AppDateAdapter, APP_DATE_FORMATS } from 'src/app/common/date.adapter';
import { FuseConfirmDialogComponent } from '../../popup-dialogs/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'energy-bill-payment',
    templateUrl: './energy-bill-payment.component.html',
    styleUrls: ['./energy-bill-payment.component.scss'],
    providers: [
        {
            provide: DateAdapter, useClass: AppDateAdapter
        },
        {
            provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS
        }
    ]
})
export class EnergyBillPaymentComponent implements OnInit {

    pagination = Constants.PAGINATION_NUMBERS;
    FiledLabels = FieldLabelsConstant.LABELS;
    Titles = FieldLabelsConstant.TITLE;
    addPermission: boolean = true;
    editPermission: boolean = true;
    deletePermission: boolean = true;
    addEnergyBillPayment: boolean = false;
    saveEnergyBillPayment: boolean;
    energyBillPaymentFormGroup: FormGroup;
    title: string = Constants.EVENTS.ADD;
    data: any;
    energyBillPaymentDataSource: MatTableDataSource<EnergyBillPaymentModel>;
    eneBillPaymentList: any;
    eneBillPaymentDisplayedColumns = ['sno', 'reference', 'toPayment', 'amount', 'dateOfPayment', 'division', 'month', 'year', 'id'];
    editEneBillPaymentResponse: any;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    divisionList: any;
    id: any;
    enableReference: boolean;
    maxDate = new Date();

    constructor(
        private commonService: CommonService,
        private dialog: MatDialog,
        private sendAndRequestService: SendAndRequestService,
        private spinnerService: Ng4LoadingSpinnerService,
        private formBuilder: FormBuilder,
        private datePipe: DatePipe
    ) {
    }
    ngOnInit() {
        var permissionName = this.commonService.getPermissionNameByLoggedData('ENERGY', 'ENERGY BILL PAYMENT');//p == 0 ? 'No Permission' : p[0].permissionName;
        this.addPermission = this.commonService.getPermissionByType('Add', permissionName);
        this.editPermission = this.commonService.getPermissionByType('Edit', permissionName);
        this.deletePermission = this.commonService.getPermissionByType('Delete', permissionName);
        this.getEnergyBillPaymentData();
        this.spinnerService.show();
        this.getDivisions();
    }

    getDivisions() {
        this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_DIVISION_DETAILS).subscribe((data) => {
            this.divisionList = data;
        })
    }

    duplicateReferenceAndToPayment() {
        const q = new Promise((resolve, reject) => {
            if (this.title == Constants.EVENTS.UPDATE) {
                resolve(null);
            } else {
                const reference = this.energyBillPaymentFormGroup.controls['reference'].value;
                const toPayment = this.energyBillPaymentFormGroup.controls['toPayment'].value;
                var filteredArray = !!this.eneBillPaymentList && this.eneBillPaymentList.filter(function (eneBillPayment) {
                    return eneBillPayment.toPayment == toPayment && eneBillPayment.reference == reference;
                });
                if (filteredArray.length !== 0) {
                    resolve({ duplicateReferenceAndToPayment: true });
                } else {
                    resolve(null);
                }
            }
        });

        return q;
    }


    addNewEnergyBillPayment() {
        this.addEnergyBillPayment = true;
        this.enableReference = true;
        this.energyBillPaymentFormGroup = this.formBuilder.group({
            id: 0,
            amount: [null, Validators.required],
            dateOfPayment: [null, Validators.required],
            division: [null, Validators.required],
            month: [null, Validators.required],
            year: [null],
            reference: [null, Validators.required],
            toPayment: [null, Validators.required, this.duplicateReferenceAndToPayment.bind(this)]
        })
    }

    onGoBack() {
        this.energyBillPaymentFormGroup.reset();
        this.addEnergyBillPayment = false;
        this.title = Constants.EVENTS.ADD;
    }

    getEnergyBillPaymentData() {
        const eneBillPayment: EnergyBillPaymentModel[] = [];
        this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.GET_ENERGY_BILL_PAYMENTS).subscribe((data) => {
            this.eneBillPaymentList = data;
            for (let i = 0; i < this.eneBillPaymentList.length; i++) {
                this.eneBillPaymentList[i].sno = i + 1;
                this.eneBillPaymentList[i].dateOfPayment = this.datePipe.transform(this.eneBillPaymentList[i].dateOfPayment, 'dd-MM-yyyy');
                eneBillPayment.push(this.eneBillPaymentList[i]);
            }
            this.energyBillPaymentDataSource = new MatTableDataSource(eneBillPayment);
            this.energyBillPaymentDataSource.paginator = this.paginator;
            this.energyBillPaymentDataSource.sort = this.sort;
        }, error => {
            this.spinnerService.hide();
        });
    }

    onEnergyBillPaymentSubmit() {
        const amount: number = this.energyBillPaymentFormGroup.value.amount;
        const dateOfPayment: Date = this.energyBillPaymentFormGroup.value.dateOfPayment;
        const division: string = this.energyBillPaymentFormGroup.value.division;
        const month: string = this.energyBillPaymentFormGroup.value.month;
        const year: string = this.energyBillPaymentFormGroup.value.year;
        const reference: string = this.energyBillPaymentFormGroup.value.reference;
        const toPayment: string = this.energyBillPaymentFormGroup.value.toPayment;
        if (this.title == Constants.EVENTS.ADD) {
            this.sendAndRequestService.requestForPOST(Constants.app_urls.ENERGY_BILL_PAYMENTS.SAVE, {
                amount: amount,
                dateOfPayment: dateOfPayment,
                division: division,
                month: month,
                year: year,
                reference: reference,
                toPayment: toPayment
            }, false).subscribe((data) => {
                this.data = data;
                this.commonService.showAlertMessage('Successfully saved');
                this.getEnergyBillPaymentData();
                this.energyBillPaymentFormGroup.reset();
                this.addEnergyBillPayment = false;
            }, error => {
                this.commonService.showAlertMessage('Error in Add')
            })
        } else if (this.title == Constants.EVENTS.UPDATE) {
            const id: number = this.editEneBillPaymentResponse.id;
            this.sendAndRequestService.requestForPUT(Constants.app_urls.ENERGY_BILL_PAYMENTS.UPDATE, {
                id: id,
                amount: amount,
                dateOfPayment: dateOfPayment,
                division: division,
                month: month,
                year: year,
                reference: reference,
                toPayment: toPayment
            }, false).subscribe((data) => {
                this.data = data;
                this.commonService.showAlertMessage('Successfully updated');
                this.getEnergyBillPaymentData();
                this.energyBillPaymentFormGroup.reset();
                this.addEnergyBillPayment = false;
            }, error => {
                this.commonService.showAlertMessage('Error in update')
            });

        }
    }

    editEneBillPayment(id) {
        this.spinnerService.show();
        this.addEnergyBillPayment = true;
        this.eneBillPaymentEditAction(id);
        this.title = 'Update';
        this.spinnerService.hide();
        this.enableReference = false;
    }

    eneBillPaymentEditAction(id: number) {
        this.energyBillPaymentFormGroup = this.formBuilder.group({
            id: 0,
            amount: [null, Validators.required],
            dateOfPayment: [null, Validators.required],
            division: [null, Validators.required],
            month: [null, Validators.required],
            year: [null],
            reference: [null, Validators.required],
            toPayment: [null, Validators.required, this.duplicateReferenceAndToPaymentAndId.bind(this)]
        })
        this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.EDIT + id)
            .subscribe((responseData) => {
                this.editEneBillPaymentResponse = responseData;
                this.id = this.editEneBillPaymentResponse.id;
                this.energyBillPaymentFormGroup.patchValue({
                    id: this.editEneBillPaymentResponse.id,
                    amount: this.editEneBillPaymentResponse.amount,
                    division: this.editEneBillPaymentResponse.division,
                    month: this.editEneBillPaymentResponse.month,
                    year: this.editEneBillPaymentResponse.year,
                    reference: this.editEneBillPaymentResponse.reference,
                    toPayment: this.editEneBillPaymentResponse.toPayment,
                    dateOfPayment: !!this.editEneBillPaymentResponse.dateOfPayment ? new Date(this.editEneBillPaymentResponse.dateOfPayment) : ''
                });
            }, error => { });

    }

    deleteEneBillPayment(id) {
        this.confirmDialogRef = this.dialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });
        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete the selected energy bill payment?';
        this.confirmDialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.sendAndRequestService.requestForDELETE(Constants.app_urls.ENERGY_BILL_PAYMENTS.DELETE, id)
                    .subscribe((data) => {
                        this.commonService.showAlertMessage('Energy Bill Payment Deleted Successfully');
                        this.getEnergyBillPaymentData();
                    }, error => { });
            }
        });
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim();
        filterValue = filterValue.toLowerCase();
        this.energyBillPaymentDataSource.filter = filterValue;
    }

    duplicateReferenceAndToPaymentAndId() {
        const q = new Promise((resolve, reject) => {
            this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.EXISTS_REFERENCE_AND_TOPAYMENT_AND_ID + this.id + '/' +
                this.energyBillPaymentFormGroup.controls['reference'].value + '/' +
                this.energyBillPaymentFormGroup.controls['toPayment'].value
            ).subscribe((duplicate) => {
                if (duplicate) {
                    resolve({ duplicateReferenceAndToPaymentAndId: true });
                } else {
                    resolve(null);
                }
            }, () => { resolve({ duplicateReferenceAndToPaymentAndId: true }); });
        });

        return q;
    }
}