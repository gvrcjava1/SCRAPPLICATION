import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { CommonService } from 'src/app/common/common.service';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { Constants } from 'src/app/common/constants';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-energy-consumption-graph',
  templateUrl: './energy-consumption-graph.component.html',
  styleUrls: []
})
export class EnergyConsumptionGraphComponent implements OnInit {

	divisionList: any;
	zoneList: any;
	divisionWiseEnergyConsumption: FormGroup;
	feederWiseEnergyConsumption: FormGroup;
	response: any;
	energyConsumptionDataSource: any = {};
	names: any[] = ['current','previous','consume'];
	width: any;
  	height = 400;
	showGraph : boolean = false;
	type = "mscolumn3d";
  	dataFormat = "json";
  	feedersList: any;
  	periodList = [{ 'id': 1, "value": 'One Day' }, { 'id': 2, "value": 'Period' }];
  	periodFlag: boolean;
  	divisionFlag: boolean;
  	requestBody: any = {};
  	queryType: any;
  	period: any;
  	maxDate = new Date();
  	toMinDate = new Date();
  	reportModel: any;
  	showReportBotton: boolean;
  	submitedForm: any;

	constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private spinnerService: Ng4LoadingSpinnerService,
    private commonService: CommonService,
    private router: Router,
    private datePipe: DatePipe,
    private sendAndRequestService: SendAndRequestService
  ) {
  
  }
  
  ngOnInit() {
  	this.divisionWiseEnergyConsumption = this.formBuilder.group({
      'period' : [null] ,
      'zone': [null, Validators.required],
      'division': [null],
      'fromDate': [null],
    });
    this.feederWiseEnergyConsumption = this.formBuilder.group({
      'fromDate': [null],
      'feederId': [null],
      'toDate': [null],
      
    });
    this.submitedForm = this.formBuilder.group({});
  }
  
  addEvent($event) {
    this.toMinDate = new Date($event.value);
  }
  
  submitEnegryConsumption () {
  	this.response = {};
    this.period = this.divisionWiseEnergyConsumption.controls.period.value;
    if (this.period == 1) {
    	this.queryType = 'DIVISION_WISE_ENERGY_CONSUMPTION';
    	this.reportModel = {
    		division: this.divisionWiseEnergyConsumption.controls.division.value.code,
    		fromDate: this.divisionWiseEnergyConsumption.controls.fromDate.value,
    		reportId: 'Day Readings And Consumption Report'
    	}
    	this.requestBody = {
	    	zone: this.divisionWiseEnergyConsumption.controls.zone.value.code,
	    	division: this.divisionWiseEnergyConsumption.controls.division.value.code,
	    	fromDate: this.divisionWiseEnergyConsumption.controls.fromDate.value,
	    	queryType: this.queryType
	    }
    }else {
    	this.queryType = 'FEEDER_WISE_ENERGY_CONSUMPTION';
    	this.requestBody = {
	    	feederId: this.feederWiseEnergyConsumption.controls.feederId.value,
	    	fromDate: this.feederWiseEnergyConsumption.controls.fromDate.value,
	    	toDate: this.feederWiseEnergyConsumption.controls.toDate.value,
	    	queryType: this.queryType
	    }
    }
    this.sendAndRequestService.requestForPOST(Constants.app_urls.DASHBOARD.GET_GRAPHS_DATA, this.requestBody, false).subscribe((data) => {
      this.response = data;
      if(this.response) {
      	this.energyConsumptionDataSource = this.energyConsumptionGraph(this.response);
      	this.showReportBotton = true; 
      }
    })
    
  }
  
	generateReport () {
		this.submitedForm = "";
		this.sendAndRequestService.requestForPOST(Constants.app_urls.REPORTS.GET_REPORT, this.reportModel, true)
                     .subscribe((response) => {
                            this.submitedForm = response;
                            let pdfWindow = window.open("download", "");
                            let content = encodeURIComponent(this.submitedForm.outputData);
                            let iframeStart = "<\iframe width='100%' height='100%' src='data:application/pdf;base64, ";
                            let iframeEnd = "'><\/iframe>";
                            pdfWindow.document.write(iframeStart + content + iframeEnd);
                     },
                       error => error => {
                             console.log(' >>> ERROR ' + error);
                       })
	}
  
  
  energyConsumptionGraph (data: any) {
  	  this.showGraph = true;
      let current = [];
      let previous = [];
      let consume = [];
      let category = []
      this.width = 0;
      var caption = '';
      var xAxisName = '';
      for(let i=0;i<this.response.length;i++){
      		this.width +=200; 
      if(this.period == 1) {
      	caption = 'Division Wise';
      	xAxisName = 'Feeder Name';
      	category.push({
        	label:this.response[i].feederName     
      	})
      }else {
      	caption = 'Feeder';
      	xAxisName = 'Date';
      	category.push({
        	label:this.response[i].requestedReadingDate     
      	})
      }
      	
      	current.push({
      		value: this.response[i].curKwh
      	})
      	previous.push({
      		value: this.response[i].prevKwh
      	})
      	consume.push({
      		value: this.response[i].consumption
      	})
      };
      return {
	      chart: {
	        caption: caption,
	        xAxisName: xAxisName,
	        yAxisName: 'Readings',
	        numberSuffix: 'K',
	        theme: 'fusion',
	      },
	    categories: [
	        {
	          category: category
	        }
	      ],
	    dataset: [
	    	{
	        seriesname: this.names[0],
	        data: current
	      },
	      {
	        seriesname: this.names[1],
	        data: previous
	      },
	      {
	        seriesname: this.names[2],
	        data: consume
	      },
	    ]    
	  };
  }
  
  selectedPeriod($event) {
  	this.showGraph = false;
  		if($event.value == 1) {
  			this.findZoneCodeList();
  			this.divisionFlag = true;
  			this.periodFlag = false;
  			// this.response = {};
  			this.showReportBotton = false;
  		}else {
  			this.findFeedersList();
  			this.periodFlag = true;
  			// this.response = {}
  			this.divisionFlag = false;
  			this.showReportBotton = false;
  		}	
  }
  
  selectedZone($event) {
    if ($event.value) {
      this.divisionList = [];
      this.findDivisionCodeByZone($event.value.id);
    }
  }
  
  findZoneCodeList() {
    this.spinnerService.show();
    this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_ZONE_LIST).subscribe((data) => {
      this.zoneList = data;
      this.spinnerService.hide();
    });
  }
  
  findDivisionCodeByZone(zone) {
  	this.spinnerService.show();
    this.sendAndRequestService.requestForGET(Constants.app_urls.REPORTS.GET_DIVISION_BASED_ON_ZONE + zone).subscribe((data) => {
      this.divisionList = data;
      this.spinnerService.hide();
    })
  }
  
  findFeedersList() {
    this.spinnerService.show();
    this.sendAndRequestService.requestForGET(Constants.app_urls.ENERGY_CONSUMPTION.FIND_TSS_FEEDER_MASTER)
      .subscribe((response) => {
        this.feedersList = response;
        this.spinnerService.hide();
      })
  }
  
}