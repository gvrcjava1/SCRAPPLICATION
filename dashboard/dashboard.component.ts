import { Component, OnInit } from '@angular/core';
import { SendAndRequestService } from 'src/app/services/sendAndRequest.service';
import { Constants } from 'src/app/common/constants';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {

  towerCarResponse: any;
  requestBody: any;
  towerCarDataSource: any;
  width = 200;
  height = 400;
  type = "mscolumn3d";
  dataFormat = "json";
  showTowerCarChart: boolean = false;
  divWiseEntryPendingResponse: any;
  divWiseEntryPendingDataSource: any = {};
  divWiseWidth: any;
  showDivWiseEnergyConsumEntryPending: boolean = false;
  pieType = "pie2d";

  constructor(
    private sendAndRequestService: SendAndRequestService
  ) {

  }

  ngOnInit() {
    this.getTowerCarGraphsData();
    this.divWiseEnergyConsumEntryPending();
  }

  getTowerCarGraphsData() {
    this.requestBody = {
      queryType: 'TOWER_CAR'
    }
    this.sendAndRequestService.requestForPOST(Constants.app_urls.DASHBOARD.GET_GRAPHS_DATA, this.requestBody, false).subscribe((data) => {
      this.towerCarResponse = data;
      if (this.towerCarResponse) {
        this.towerCarDataSource = this.prepareTowerCarGraphData(this.towerCarResponse);
        if (this.towerCarDataSource) {
          this.showTowerCarChart = true;
        }
      }
    })
  }

  prepareTowerCarGraphData(data: any) {
    let dataSet = [];
    for (let i = 0; i < data.length; i++) {
      this.width = this.width + 100;
      dataSet.push({
        seriesname: data[i].fStatus + data[i].productCategoryId,
        data: [
          {
            value: data[i].gtlCount,
            displayvalue: data[i].gtlCount + " " + data[i].fStatus + " " + data[i].productCategoryId
          },
          {
            value: data[i].gntCount,
            displayvalue: data[i].gntCount + " " + data[i].fStatus + " " + data[i].productCategoryId
          },
          {
            value: data[i].scCount,
            displayvalue: data[i].scCount + " " + data[i].fStatus + " " + data[i].productCategoryId
          },
          {
            value: data[i].bzaCount,
            displayvalue: data[i].bzaCount + " " + data[i].fStatus + " " + data[i].productCategoryId
          },
          {
            value: data[i].hybCount,
            displayvalue: data[i].hybCount + " " + data[i].fStatus + " " + data[i].productCategoryId
          }
        ]
      })
    }
    return {
      chart: {
        caption: "Tower Car",
        xaxisname: "Divisions",
        yaxisname: "Count",
        formatnumberscale: "1",
        showValues: "1",
        rotateValues: "1",
        valueFontColor: "#000000",
        plottooltext:
          "<b>$dataValue</b> <b>$seriesName</b> in $label",
        theme: "fusion"
      },
      categories: [
        {
          category: [
            {
              label: "GTL"
            },
            {
              label: "GNT"
            },
            {
              label: "SC"
            },
            {
              label: "BZA"
            },
            {
              label: "HYB"
            }
          ]
        }
      ],
      dataset: dataSet
    }
  }


  divWiseEnergyConsumEntryPending() {
    this.requestBody = {
      queryType: 'DIV_WIS_ENERGY_CONSUM_ENTRY_PENDING'
    }
    this.sendAndRequestService.requestForPOST(Constants.app_urls.DASHBOARD.GET_GRAPHS_DATA, this.requestBody, false).subscribe((data) => {
      this.divWiseEntryPendingResponse = data;
      if (this.divWiseEntryPendingResponse) {
        this.divWiseEntryPendingDataSource = this.prepareEnergyConsumEntryPendingData(this.divWiseEntryPendingResponse);
        if (this.divWiseEntryPendingDataSource) {
          this.showDivWiseEnergyConsumEntryPending = true;
        }
      }
    });
  }

  prepareEnergyConsumEntryPendingData(data: any) {
    let dataValues = [];
    for (let i = 0; i < data.length; i++) {
      this.divWiseWidth = this.divWiseWidth + 200;
      dataValues.push({
        label: data[i].division,
        value: data[i].energyDataPending
      });
    }
    return {
      chart: {
        caption: "Energy Consumption Entry Pending",
        plottooltext: "<b>$label</b> of energy consumption Entry Pending <b>$value</b>",

        showpercentvalues: "0",
        valuePosition: "inside",
        theme: "fusion"
      },
      data: dataValues
    }
  }

}


export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
  url: string;
  icon: string
}
