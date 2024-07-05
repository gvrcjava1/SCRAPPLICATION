import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/modules/material.modules';
import { Ng4LoadingSpinnerModule } from 'ng4-loading-spinner';
import { DecimalValidationsModule } from 'src/app/modules/decimal-validations.module';
import { NumberValidationsModule } from 'src/app/modules/number-validations.module';
import { EnergyBillPaymentComponent } from './energy-bill-payment/energy-bill-payment.component';
import { EnergyConsumptionComponent } from './energy-consumption/energy-consumption.component';
import { AddEnergyConsumptionComponent } from './energy-consumption/add-energy-consumption/add-energy-consumption.component';
import { EnergyMeterComponent } from './energy-meter/energy-meter.component';
import { DateTimeAdapter, OwlDateTimeModule, OwlNativeDateTimeModule, OWL_DATE_TIME_FORMATS } from 'ng-pick-datetime/date-time';
import { DateFnsDateTimeAdapter } from 'src/app/common/date-fns-date-time-adapter.class';
import { TractionEnergyTariffComponent } from './traction-energy-tariff/traction-energy-tariff.component';
import { CommonDirectivesModule } from 'src/app/modules/common-directives.module';
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
    { path: '', component: EnergyBillPaymentComponent },
    { path: 'energy-bill-payment', component: EnergyBillPaymentComponent },
    { path: 'energy-consumption', component: EnergyConsumptionComponent },
    { path: 'energy-consumption/:id', component: AddEnergyConsumptionComponent },
    { path: 'energy-meter', component: EnergyMeterComponent },
    { path: 'traction-enetariff', component: TractionEnergyTariffComponent }
];

@NgModule({
    declarations: [
        EnergyBillPaymentComponent,
        EnergyConsumptionComponent,
        AddEnergyConsumptionComponent,
        EnergyMeterComponent,
        TractionEnergyTariffComponent
    ],
    imports: [
        RouterModule.forChild(routes),
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        DecimalValidationsModule,
        Ng4LoadingSpinnerModule.forRoot(),
        NumberValidationsModule,
        CommonDirectivesModule,
        OwlNativeDateTimeModule,
        OwlDateTimeModule
    ],
    providers: [
        { provide: DateTimeAdapter, useClass: DateFnsDateTimeAdapter },
        { provide: OWL_DATE_TIME_FORMATS, useValue: DATEFNS_FORMATS_EN_LOCALE }
    ],
    exports:[
        EnergyBillPaymentComponent
    ]
})
export class EnergyModule {

}