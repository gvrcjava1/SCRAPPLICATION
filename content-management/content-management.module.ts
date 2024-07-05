import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ContentManagementComponent } from './content-management.component';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/modules/material.modules';
import { Ng4LoadingSpinnerModule } from 'ng4-loading-spinner';
import { CommonDirectivesModule } from 'src/app/modules/common-directives.module';
import { InlineEditComponent } from './inline-edit/inline-edit.component';

const routes: Routes = [
    {
        path: '',
        component: ContentManagementComponent,
    }
];

@NgModule({
    declarations: [
        ContentManagementComponent,
        InlineEditComponent
    ],
    imports: [
        RouterModule.forChild(routes),
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,        
        Ng4LoadingSpinnerModule.forRoot(),
        CommonDirectivesModule,
    ],
    providers: [
        
    ],
    exports:[
        ContentManagementComponent
    ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class ContentManagementModule {

}