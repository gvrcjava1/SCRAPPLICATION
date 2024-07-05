import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { Constants } from 'src/app/common/constants';
import { MatTableDataSource, MatDialogRef, MatPaginator, MatSort, MatRadioChange, DateAdapter, MAT_DATE_FORMATS, MatDialog } from '@angular/material';
import { AppDateAdapter, APP_DATE_FORMATS } from 'src/app/common/date.adapter';
import { DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterExtService } from 'src/app/services/router-ext.service';
import { FieldLabelsConstant } from 'src/app/common/field-labels.constants';
import { FuseConfirmDialogComponent } from '../../popup-dialogs/confirm-dialog/confirm-dialog.component';
import { FuseConfirmPopupComponent } from '../../popup-dialogs/confirm-popup/confirm-popup.component';


@Component({
  selector: 'app-energy-consumption',
  templateUrl: './energy-consumption.component.html',
  styleUrls: ['./energy-consumption.component.css'],
  providers: [
    {
      provide: DateAdapter, useClass: AppDateAdapter
    },
    {
      provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS
    }
  ]
})
export class EnergyConsumptionComponent implements OnInit {
  pagination = Constants.PAGINATION_NUMBERS;
  FiledLabels = FieldLabelsConstant.LABELS;
  Titles = FieldLabelsConstant.TITLE;
  editPermission: boolean = true;
  addPermission: boolean = true;
  deletePermission: boolean = true;
  userdata: any = JSON.parse(sessionStorage.getItem('userData'));
  filterData;
  displayedColumns = ['sno', 'Feeder_Name', 'Previous_Date', 'Multification_Factor', 'Joint_Reading',/*  'CMD', */
    'Old_KWH', 'Current_KWH', "Consumption_KWH", 'Old_KVAH', 'Current_KVAH', 'Consumption_KVAH',
    'Old_RKVAH_Lag', 'Current_RKVAH_Lag', 'Consumption_RKVAH_Lag',
    'Old_RKVAH_Lead', 'Current_RKVAH_Lead', 'Consumption_RKVAH_Lead'/* , 'PF', 'CPF', 'rmd', 'Vol_Max', 'Vol_Min', 'Max_Load' */, 'actions'];
  dataSource: MatTableDataSource<any>;
  confirmdialogRef: MatDialogRef<FuseConfirmDialogComponent>;
  gridData = [];
  stipulations: any[] = [];
  exactDate: boolean = true;
  energyConsumptionData = [];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('filter', { static: true }) filter: ElementRef;
  selectedExactDate = new Date();
  selectedBWFrom = new Date();
  selectedBWTo = new Date();
  minDate: Date;
  maxDate: Date;
  feedersList: any;
  feedersOriginalList: any;
  selectedFeederId: string;
  row: number;
  divisionsList: any;
  selectedDivision: any;
  radioList = [
    { "name": "Date", ID: "D1", "checked": true },
    { "name": "Station", ID: "D2", "checked": false }
  ]
  divisionCode: string;
  feederId: string;
  zoneData: any = JSON.parse(sessionStorage.getItem('zoneData'));
  divisionData: any = JSON.parse(sessionStorage.getItem('divisionData'));
  depotsData: any = JSON.parse(sessionStorage.getItem('depotData'));
  zoneObject: any;
  zoneCode: string
  userDefaultData: any;
  loggedUser: any = JSON.parse(sessionStorage.getItem('loggedUser'));
  previousUrl: string;
  enableZone: boolean;
  depotsList: any;
  depotName: any;
  tssList: any;
  feedersArray = [];
  enableDivision: boolean;
  confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
  resp: any;

  constructor(
    private spinnerService: Ng4LoadingSpinnerService,
    private commonService: CommonService,
    private sendAndRequestService: SendAndRequestService,
    private datePipe: DatePipe,
    private router: Router,
    private route: ActivatedRoute,
    private routerService: RouterExtService,
    public dialog: MatDialog
  ) {

  }

  ngOnInit() {
    const previousUrl = this.routerService.getPreviousUrl();
    this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_USER_DEFAULT_DATA + this.loggedUser.userName).subscribe((data) => {
      this.userDefaultData = data;
      if (this.userDefaultData.zone) {
        this.zoneCode = this.userDefaultData.zone.toUpperCase();
        this.enableZone = false;
      }
      if (this.zoneData.length > 0) {
        this.enableZone = true;
      }
      this.divisionsList = this.divisionData;

      if (this.divisionData.length > 0)
        this.enableDivision = true;
      else
        this.enableDivision = false;

      if (this.userDefaultData.division) {
        this.divisionCode = this.userDefaultData.division.toUpperCase();
        if (previousUrl == "/energy-consumption") {
          this.selectedDivision = this.divisionCode;
          this.getPSIDepots();
          const query = this.exactDate ? this.datePipe.transform(this.selectedExactDate, 'yyyy-MM-dd') + '/exact/' + 0 + '/' + this.divisionCode + '/' + this.depotName : this.datePipe.transform(this.selectedBWFrom, 'yyyy-MM-dd') + '/' + this.datePipe.transform(this.selectedBWTo, 'yyyy-MM-dd') + '/' + this.selectedFeederId + '/' + this.selectedDivision + '/' + this.depotName;
          this.findEnergyConsumptionData(query);
        }
      }
    },
      error => error => {
        console.log(' >>> ERROR ' + error);
      });

    const currentYear = new Date().getFullYear();
    this.minDate = new Date(currentYear - 1, 0, 1);
    this.maxDate = new Date();
    this.selectedBWTo = this.maxDate;
    this.spinnerService.show();
    this.findFeedersList();
    if (previousUrl != '/energy-consumption') {
      var query = !!sessionStorage.getItem('query') ? sessionStorage.getItem('query') : this.datePipe.transform(this.selectedExactDate, 'yyyy-MM-dd') + '/exact/' + this.selectedFeederId;
      if (sessionStorage.getItem('query')) {
        var values = sessionStorage.getItem('query').split('/');
        if (values[1] == 'exact') {
          this.exactDate = true;
          this.radioList[0].checked = true;
          this.radioList[1].checked = false;
          this.selectedExactDate = new Date(values[0]);
          this.divisionCode = values[3];
          this.depotName = values[4];
          this.selectedDivision = this.divisionCode;
          this.getPSIDepots();
        } else {
          this.exactDate = false;
          this.radioList[0].checked = false;
          this.radioList[1].checked = true;
          this.selectedBWFrom = new Date(values[0]);
          this.selectedBWTo = new Date(values[1]);
          this.divisionCode = values[3];
          this.feederId = values[2];
          this.depotName = values[4];
          this.selectedFeederId = this.feederId;
          this.selectedDivision = this.divisionCode;
          this.getPSIDepots();
        }
      }
      query = this.exactDate ? this.datePipe.transform(this.selectedExactDate, 'yyyy-MM-dd') + '/exact/' + this.selectedFeederId + '/' + this.selectedDivision + '/' + this.depotName : this.datePipe.transform(this.selectedBWFrom, 'yyyy-MM-dd') + '/' + this.datePipe.transform(this.selectedBWTo, 'yyyy-MM-dd') + '/' + this.selectedFeederId + '/' + this.selectedDivision + '/' + this.depotName;
      sessionStorage.setItem('query', query);
      this.findEnergyConsumptionData(query)
    }

    this.filterData = {
      filterColumnNames: [
        { "Key": 'sno', "Value": " " },
        { "Key": "Feeder_Name", "Value": "" },
        { "Key": "Previous_Date", "Value": " " },
        { "Key": "Multification_Factor", "Value": "" },
        { "Key": "Joint_Reading", "Value": "" },
        { "Key": 'Old_KWH', "Value": " " },
        { "Key": 'Current_KWH', "Value": " " },
        { "Key": "Consumption_KWH", "Value": "" },
        { "Key": 'Old_KVAH', "Value": " " },
        { "Key": 'Current_KVAH', "Value": " " },
        { "Key": "Consumption_KVAH", "Value": "" },
        { "Key": 'Old_RKVAH_Lag', "Value": " " },
        { "Key": 'Current_RKVAH_Lag', "Value": " " },
        { "Key": "Consumption_RKVAH_Lag", "Value": "" },
        { "Key": 'Old_RKVAH_Lead', "Value": " " },
        { "Key": 'Current_RKVAH_Lead', "Value": " " },
        { "Key": "Consumption_RKVAH_Lead", "Value": "" }
      ],
      gridData: this.gridData,
      dataSource: this.dataSource,
      paginator: this.paginator,
      sort: this.sort
    };
  }
  getTssFeeder() {
    this.clearPreviousData();
    this.feedersArray = [];
    this.feedersList = [];
    this.feederId = '';
    this.tssList = this.depotsData.filter(value => {
      return value.parentDepot == this.depotName && value.depotType == 'TSS';
    });
    if (this.tssList) {
      this.feedersOriginalList.filter(tss => {
        this.feedersList = this.tssList.filter(value => {
          if (tss.tssName == value.facilityName) {
            this.feedersArray.push(tss);
          }
        });
      });
      this.feedersList = this.feedersArray;
      this.feederId = this.feedersList != null && this.feedersList.length > 0 ? this.feedersList[0].feederId : '';
    }
  }

  getPSIDepots() {
    this.depotsList = [];
    if (this.depotsData) {
      this.depotsList = this.depotsData.filter(value => {
        if (value.dataDiv && this.selectedDivision) {
          return value.dataDiv.toLowerCase() == this.selectedDivision.toLowerCase() && value.depotType == 'PSI';
        }
      });
      if (this.depotsList.length == 1) {
        this.depotName = this.depotsList[0].facilityName;
      }
    }
  }

  getDivisions(zoneCode: any) {
    this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_ZONE_OBJECT + zoneCode).subscribe((data) => {
      this.zoneObject = data;
      this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_DIVISION_BASED_ON_ZONE + this.zoneObject.id).subscribe((data) => {
        this.divisionsList = data;
      })
    })
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.filterData.dataSource.filter = filterValue;
  }
  findFeedersList() {
    this.spinnerService.show();
    this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_CONSUMPTION.FIND_TSS_FEEDER_MASTER)
      .subscribe((response) => {
        if (response) {
          this.feedersList = response;
          this.feedersOriginalList = response;
          if (this.feedersList && this.feedersOriginalList) {
            this.feedersList = this.feedersOriginalList.filter(value => {
              return value.dataDiv == this.selectedDivision;
            });
            if (this.depotName) {
              this.getTssFeeder();
            }

          }
          this.spinnerService.hide();
        }
      })
  }
  divisionDetails() {
    this.sendAndRequestService.requestForGET(Constants.app_urls.DRIVE.GET_DIVISIONS)
      .subscribe((data) => {
        this.divisionsList = data;
      });
  }
  findEnergyConsumptionData(query) {
    this.spinnerService.show();
    this.filterData = [];
    this.energyConsumptionData = [];
    this.stipulations = [];
    this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_CONSUMPTION.FIND_ENERGY_CONSUMPTION + query)
      .subscribe((response) => {
        this.energyConsumptionData = response;
        for (let i = 0; i < this.energyConsumptionData.length; i++) {
          this.energyConsumptionData[i].sno = i + 1;
          this.energyConsumptionData[i].Feeder_Name = this.energyConsumptionData[i].feederName;
          this.energyConsumptionData[i].Previous_Date = this.energyConsumptionData[i].readingGapDays != null ? this.energyConsumptionData[i].readingGapDays : '';
          this.energyConsumptionData[i].Multification_Factor = this.energyConsumptionData[i].multiplicationFac;
          this.energyConsumptionData[i].cmd = this.energyConsumptionData[i].cmd;

          this.energyConsumptionData[i].Old_KWH = this.energyConsumptionData[i].prevKwh;
          this.energyConsumptionData[i].Current_KWH = this.energyConsumptionData[i].curKwh;
          this.energyConsumptionData[i].Consumption_KWH = this.energyConsumptionData[i].curKwh != 0 ? ((this.energyConsumptionData[i].curKwh - parseFloat(this.energyConsumptionData[i].prevKwh)) * parseFloat(this.energyConsumptionData[i].multiplicationFac)).toFixed(2) : 0;
          this.energyConsumptionData[i].kwh_f = this.energyConsumptionData[i].Previous_Date != null ? this.energyConsumptionData[i].Previous_Date.split('(')[0].length + 1 : new Date();
          this.energyConsumptionData[i].kwh_m = this.energyConsumptionData[i].kwh_f + this.energyConsumptionData[i].Previous_Date.includes("(") && this.energyConsumptionData[i].Previous_Date.split('(').length > 1 ? this.energyConsumptionData[i].Previous_Date.split('(')[1].split(')')[0].length : '';
          this.energyConsumptionData[i].kwh_l = this.energyConsumptionData[i].kwh_m + this.energyConsumptionData[i].Previous_Date.includes("(") && this.energyConsumptionData[i].Previous_Date.split('(').length > 1 ? this.energyConsumptionData[i].Previous_Date.split('(')[1].split(')')[1].length : '';

          this.energyConsumptionData[i].Old_KVAH = this.energyConsumptionData[i].prevKvah;
          this.energyConsumptionData[i].Current_KVAH = this.energyConsumptionData[i].curKvah;
          this.energyConsumptionData[i].Consumption_KVAH = this.energyConsumptionData[i].curKvah != 0 ? ((this.energyConsumptionData[i].curKvah - parseFloat(this.energyConsumptionData[i].prevKvah)) * parseFloat(this.energyConsumptionData[i].multiplicationFac)).toFixed(2) : 0;

          this.energyConsumptionData[i].Old_RKVAH_Lag = this.energyConsumptionData[i].prevRkvahLag;
          this.energyConsumptionData[i].Current_RKVAH_Lag = this.energyConsumptionData[i].curRkvahLag;
          this.energyConsumptionData[i].Consumption_RKVAH_Lag = this.energyConsumptionData[i].curRkvahLag != 0 ? ((this.energyConsumptionData[i].curRkvahLag - parseFloat(this.energyConsumptionData[i].prevRkvahLag)) * parseFloat(this.energyConsumptionData[i].multiplicationFac)).toFixed(2) : 0;

          this.energyConsumptionData[i].Old_RKVAH_Lead = this.energyConsumptionData[i].prevRkvahLead;
          this.energyConsumptionData[i].Current_RKVAH_Lead = this.energyConsumptionData[i].curRkvahLead;
          this.energyConsumptionData[i].Consumption_RKVAH_Lead = this.energyConsumptionData[i].curRkvahLead != 0 ? ((this.energyConsumptionData[i].curRkvahLead - parseFloat(this.energyConsumptionData[i].prevRkvahLead)) * parseFloat(this.energyConsumptionData[i].multiplicationFac)).toFixed(2) : 0;

          this.energyConsumptionData[i].pf = this.energyConsumptionData[i].Consumption_KVAH != 0 && this.energyConsumptionData[i].Consumption_KWH != 0 ? (this.energyConsumptionData[i].Consumption_KWH / this.energyConsumptionData[i].Consumption_KVAH).toFixed(2) : 0;
          this.energyConsumptionData[i].cpf = this.energyConsumptionData[i].jrKvah != 0 ? (this.energyConsumptionData[i].jrKwh / this.energyConsumptionData[i].jrKvah).toFixed(2) : 0;

          this.energyConsumptionData[i].rmd = this.energyConsumptionData[i].curRmd;
          this.energyConsumptionData[i].Vol_Max = this.energyConsumptionData[i].curVolMax;
          this.energyConsumptionData[i].Vol_Min = this.energyConsumptionData[i].curVolMin;
          this.energyConsumptionData[i].Max_Load = this.energyConsumptionData[i].curMaxLoad;

          this.energyConsumptionData[i].energyReadingDate = this.energyConsumptionData[i].requestedReadingDate;//this.exactDate == true ? this.datePipe.transform(this.selectedExactDate, 'yyyy-MM-dd') : this.datePipe.transform(this.selectedBWTo, 'yyyy-MM-dd') ;
          this.energyConsumptionData[i].id = this.energyConsumptionData[i].id;
          this.energyConsumptionData[i].editable = false;
          this.energyConsumptionData[i].dataDiv = this.energyConsumptionData[i].dataDiv;
          this.stipulations.push(this.energyConsumptionData[i]);
        }
        this.filterData.gridData = this.stipulations;
        this.dataSource = new MatTableDataSource(this.stipulations);
        this.commonService.updateDataSource(this.dataSource, this.displayedColumns);
        this.filterData.dataSource = this.dataSource;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.spinnerService.hide();
      })
  }
  updatePagination() {
    this.filterData.dataSource = this.filterData.dataSource;
    this.filterData.dataSource.paginator = this.paginator;
  }
  processUpdateAction(id) {

  }

  processEditAction(row) {
    /*
    var row = this.dataSource.filteredData.find((item, index) => {
      return item.feederId == id;
    })*/
    var query = "";
    query = this.exactDate ? this.datePipe.transform(this.selectedExactDate, 'yyyy-MM-dd') + '/exact/' + this.selectedFeederId + '/' + this.selectedDivision + '/' + this.depotName : this.datePipe.transform(this.selectedBWFrom, 'yyyy-MM-dd') + '/' + this.datePipe.transform(this.selectedBWTo, 'yyyy-MM-dd') + '/' + this.selectedFeederId + '/' + this.selectedDivision + '/' + this.depotName;
    sessionStorage.setItem('query', query);
    sessionStorage.setItem('ec', JSON.stringify(row));
    this.router.navigate([row.feederId], { relativeTo: this.route });
  }
  processCancelAction(row) {
    this.dataSource.filteredData.map((item, index) => {
      if (item.feeder_id == row.feeder_id) {
        this.dataSource.filteredData[index]['editable'] = false;
      }
    })
  }
  radioChange(event: MatRadioChange) {
    this.filterData.dataSource = [];
    if (event.value == 'Date') {
      if (this.enableDivision) {
        this.depotName = undefined;
      }
      this.exactDate = true;
      this.selectedExactDate = new Date();
      var query = "";
      this.maxDate = new Date();
      query = this.exactDate ? this.datePipe.transform(this.selectedExactDate, 'yyyy-MM-dd') + '/exact/' + this.selectedFeederId + '/' + this.selectedDivision + '/' + this.depotName : this.datePipe.transform(this.selectedBWFrom, 'yyyy-MM-dd') + '/' + this.datePipe.transform(this.selectedBWTo, 'yyyy-MM-dd') + '/' + this.selectedFeederId + '/' + this.selectedDivision + '/' + this.depotName;
      this.findEnergyConsumptionData(query);
    } else {
      if (this.depotsList.length > 0) {
        this.depotName = this.depotsList[0].facilityName;
      }
      this.exactDate = false;
      this.selectedBWFrom = new Date();
      this.selectedBWTo = this.maxDate;
      this.selectedFeederId = '';
      this.getTssFeeder();
      this.feederId = this.feedersList != null && this.feedersList.length > 0 ? this.feedersList[0].feederId : '';
      this.selectedFeederId = this.feederId;
      this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.ENERGY_METER.FIND_CHANGED_ENERGY_METER_DATES + this.datePipe.transform(this.selectedBWFrom, 'yyyy-MM-dd') + '/' + this.selectedFeederId + '/' + this.datePipe.transform(this.selectedBWTo, 'yyyy-MM-dd'))
        .subscribe((response) => {
          this.resp = response
          const responseMeassage = this.resp.message;
          if (responseMeassage) {
            this.confirmDialogRef = this.dialog.open(FuseConfirmPopupComponent, {
              disableClose: false
            });
            this.confirmDialogRef.componentInstance.confirmMessage = this.resp.message;
          }
        });
      var query = "";
      query = this.exactDate ? this.datePipe.transform(this.selectedExactDate, 'yyyy-MM-dd') + '/exact/' + this.selectedFeederId + '/' + this.selectedDivision + '/' + this.depotName : this.datePipe.transform(this.selectedBWFrom, 'yyyy-MM-dd') + '/' + this.datePipe.transform(this.selectedBWTo, 'yyyy-MM-dd') + '/' + this.feederId + '/' + this.selectedDivision + '/' + this.depotName;
      if (this.feederId) {
        this.findEnergyConsumptionData(query);
      }
    }
    sessionStorage.setItem('query', query);
  }
  exactDateEvent($event) {
    this.selectedExactDate = new Date($event.value);
  }
  bwFromDateEvent($event) {
    this.selectedBWFrom = new Date($event.value);
    this.selectedBWTo = this.maxDate;
  }
  updateFeederName($event) {
    if ($event.value) {
      this.selectedFeederId = $event.value;
    }
  }

  updateDivision($event) {
    this.clearPreviousData();
    if (!this.exactDate) {
      this.selectedDivision = $event.value;
      /*
    this.feedersList = this.feedersOriginalList.filter(value => {
      return value.dataDiv.toLowerCase() == $event.value.toLowerCase();
    });
      */

    } else {
      this.selectedDivision = $event.value;
    }
    this.getPSIDepots();
  }
  delete(id) {

  }
  executeQuery() {
    if (this.exactDate)
      this.selectedFeederId = 'undefined';
    else
      this.selectedFeederId = this.feederId;
    this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_BILL_PAYMENTS.ENERGY_METER.FIND_CHANGED_ENERGY_METER_DATES + this.datePipe.transform(this.selectedBWFrom, 'yyyy-MM-dd') + '/' + this.selectedFeederId + '/' + this.datePipe.transform(this.selectedBWTo, 'yyyy-MM-dd'))
      .subscribe((response) => {
        this.resp = response;
        const responseMeassage = this.resp.message;
        if (responseMeassage) {
          this.confirmDialogRef = this.dialog.open(FuseConfirmPopupComponent, {
            disableClose: false
          });
          this.confirmDialogRef.componentInstance.confirmMessage = this.resp.message;
        } else {
          var query = "";
          query = this.exactDate ? this.datePipe.transform(this.selectedExactDate, 'yyyy-MM-dd') + '/exact/' + this.selectedFeederId + '/' + this.selectedDivision + '/' + this.depotName : this.datePipe.transform(this.selectedBWFrom, 'yyyy-MM-dd') + '/' + this.datePipe.transform(this.selectedBWTo, 'yyyy-MM-dd') + '/' + this.selectedFeederId + '/' + this.selectedDivision + '/' + this.depotName;
          sessionStorage.setItem('query', query);
          this.findEnergyConsumptionData(query);
        }
      });
  }

  clearPreviousData() {
    this.energyConsumptionData = [];
    this.stipulations = [];
    this.filterData = [];
    this.filterData.gridData = this.stipulations;
    this.dataSource = new MatTableDataSource(this.stipulations);
    this.commonService.updateDataSource(this.dataSource, this.displayedColumns);
    this.filterData.dataSource = this.dataSource;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
