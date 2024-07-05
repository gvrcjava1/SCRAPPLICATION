import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSort, MatPaginator, MatTableDataSource } from '@angular/material';
import { DriveProgressIdModel } from 'src/app/models/drive.model';
import { DatePipe } from '@angular/common';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';
import { Constants } from 'src/app/common/constants';
import { Router } from '@angular/router';




@Component({
    selector: 'view-drive-daily-progress-dialog',
    templateUrl: './view-drive-daily-progress.component.html',
})
export class ViewDriveDailyProgressComponent implements OnInit {
    pagination = Constants.PAGINATION_NUMBERS;
    FiledLabels = FieldLabelsConstant.LABELS;
    Titles = FieldLabelsConstant.TITLE;
    public response:any=[];
    title: string;
    DDProgressDisplayedColumns = ['sno', 'drive', 'depot', 'date', 'performedCount'];
    DDProgressDataSource: MatTableDataSource<DriveProgressIdModel>;
    @ViewChild(MatPaginator, { static: true }) schedulerPaginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ViewChild('filter', { static: true }) filter: ElementRef;
    constructor(@Inject(MAT_DIALOG_DATA) private data,
                private datePipe: DatePipe,
                private router: Router,
                public dialogRef: MatDialogRef<ViewDriveDailyProgressComponent>) {
        if (data) {
            this.response = data;
        }
    }

    ngOnInit() {
        if(this.router.url == "/asset-schedule-progress")
            this.title = "Asset Schedule Progress Details";
        else
            this.title = "Drive Daily Progress Details";
        const DDProgressData: DriveProgressIdModel[] = [];
        for (let i = 0; i < this.response.length; i++) {
                  this.response[i].sno = i + 1;
                  this.response[i].performedDate = this.datePipe.transform(this.response[i].performedDate, 'dd-MM-yyyy');
                  DDProgressData.push(this.response[i]);
              }
        this.DDProgressDataSource = new MatTableDataSource(DDProgressData);
        this.DDProgressDataSource.paginator = this.schedulerPaginator;
        this.DDProgressDataSource.sort = this.sort;
    }
}