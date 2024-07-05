import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { MatMenuModule, MatGridListModule } from '@angular/material';
import { CommonModule } from '@angular/common';
import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { Ng4LoadingSpinnerModule } from 'ng4-loading-spinner';
import { FusionChartsModule } from 'angular-fusioncharts';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/modules/material.modules';
import { StockQuantitiesComponent } from './stock-quantities/stock-quantities.component';
import { GoogelMapComponent } from './google-map/google-map.component';
import { EnergyConsumptionGraphComponent } from './energy-consumption-graphs/energy-consumption-graph.component';
import { EnergyGraphsComponent } from './energy-dashboard/energy-graphs.component';
import { SectionJobCardDashboardComponent } from './section-job-card-dashboard/section-job-card-dashboard.component';
import { UpdateSectionJobCardComponent,AddAdditionalJobsComponent } from './section-job-card-dashboard/update-section-job-card/update-section-job-card.component';
import { PpioDashboardComponent } from './ppio-dashboard/ppio-dashboard.component';
import { DateFnsDateTimeAdapter } from 'src/app/common/date-fns-date-time-adapter.class';
import { DateTimeAdapter, OwlDateTimeModule, OwlNativeDateTimeModule, OWL_DATE_TIME_FORMATS } from 'ng-pick-datetime/date-time';
import { PpioJobCardComponent } from 'src/app/components/dashboard/ppio-dashboard/ppio-job-card/ppio-job-card.component';
const DATEFNS_FORMATS_EN_LOCALE = {
    parseInput: 'dd-MM-yyyy HH:mm || dd/MM/yyyy', // multiple date input types separated by ||
    fullPickerInput: 'dd-MM-yyyy HH:mm:ss',
    datePickerInput: 'dd/MM/yyyy',
    timePickerInput: 'HH:mm',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'dd/MM/yyyy',
    monthYearA11yLabel: 'MMMM yyyy'
  };
const routes: Routes = [
    { path: '', component: DashboardComponent },
    { path: 'stock-quantities', component: StockQuantitiesComponent },
    { path: 'google-map', component: GoogelMapComponent },
    { path: 'energy-graph', component: EnergyConsumptionGraphComponent },
    { path: 'energy', component: EnergyGraphsComponent },
    { path: 'section-job-card-dashboard' , component: SectionJobCardDashboardComponent },
    { path: 'section-job-card-dashboard/update-section-job-card/:id', component: UpdateSectionJobCardComponent },
    { path: 'ppio' , component: PpioDashboardComponent },
    { path: 'ppio/ppio-job-card/:id' , component: PpioJobCardComponent }

];

@NgModule({
    imports     : [     
        RouterModule.forChild(routes),
        Ng4LoadingSpinnerModule.forRoot(),
        MatMenuModule,
        MatGridListModule,
        CommonModule,
        FusionChartsModule,
        FormsModule,
        MaterialModule,
        ReactiveFormsModule,
        OwlDateTimeModule,
        OwlNativeDateTimeModule,
    ],
    declarations: [
        DashboardComponent,
        EnergyConsumptionGraphComponent,
        EnergyGraphsComponent,
        StockQuantitiesComponent,
        GoogelMapComponent,
        SectionJobCardDashboardComponent,
        UpdateSectionJobCardComponent,
        PpioDashboardComponent,
        AddAdditionalJobsComponent,
        PpioJobCardComponent
    ],
    providers   : [
        Ng4LoadingSpinnerService,
        { provide: DateTimeAdapter, useClass: DateFnsDateTimeAdapter },
        { provide: OWL_DATE_TIME_FORMATS, useValue: DATEFNS_FORMATS_EN_LOCALE }
    ],
    entryComponents:[
        AddAdditionalJobsComponent
    ],
    exports     : [
        DashboardComponent,
    ]
})
export class DashboardModule
{
}

