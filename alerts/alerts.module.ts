import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule, MatIconModule, MatCheckboxModule, MatInputModule, } from '@angular/material';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/modules/material.modules';
import { OwlDateTimeModule } from 'ng-pick-datetime/date-time/date-time.module';
import { CommonDirectivesModule } from 'src/app/modules/common-directives.module';
import { OwlNativeDateTimeModule } from 'ng-pick-datetime/date-time/adapter/native-date-time.module';
import { TextareaAutoresizeModule } from 'src/app/modules/text-area-auto-resize.module';
import { Ng4LoadingSpinnerModule } from 'ng4-loading-spinner';
import { AlertGroupComponent } from './alert-group/alert-group.component';
import { AddAlertGroupComponent } from './alert-group/add-alert-group/add-alert-group.component';
import { AlertGroupMemberComponent } from './alert-group-member/alert-group-member.component';
import { AddAlertGroupMemberComponent } from './alert-group-member/add-alert-group-member/add-alert-group-member.component';
import { GroupGroupMembersComponent } from './group-group-members/group-group-members.component';
import { DragDropDualListComponent } from './drag-drop-dual-list/drag-drop-dual-list.component';
import { ArrayFilterPipe, ArraySortPipe } from 'src/app/common/array.pipes';
import { ApiService } from 'src/app/services/api.service';
import { EventAlertRecipientComponent } from './event-alert-recipient/event-alert-recipient.component';
import { AddEventAlertRecipientComponent } from './event-alert-recipient/add-event-alert-recipient/add-event-alert-recipient.component';
import { AddAlertMessageTemplateComponent } from './alert-message-template/add-alert-message-template/add-alert-message-template.component';
import { AlertMessageTemplateComponent } from './alert-message-template/alert-message-template.component';
import { DualListComponent } from '../shared/dual-list/dual-list.component';
import { CustomSharedModule } from 'src/app/modules/custom-shared.module';

const routes = [
    { path: '', component: AlertGroupComponent },
    { path: 'alert-group', component: AlertGroupComponent },
    { path: 'alert-group/:id', component: AddAlertGroupComponent },
    { path: 'alert-group/add-alert-group', component: AddAlertGroupComponent },
    { path: 'alert-group-member', component: AlertGroupMemberComponent },
    { path: 'alert-group-member/:id', component: AddAlertGroupMemberComponent },
    { path: 'alert-group-member/add-alert-group-member', component: AddAlertGroupMemberComponent },
    { path: 'drag-drop-dual-list', component: DragDropDualListComponent },
    { path: 'event-alert-recipient', component: EventAlertRecipientComponent },
    { path: 'event-alert-recipient/:id', component: AddEventAlertRecipientComponent },
    { path: 'event-alert-recipient/add-event-alert-recipient', component: AddEventAlertRecipientComponent },
    { path: 'alert-message-template', component: AlertMessageTemplateComponent },
    { path: 'alert-message-template/:id', component: AddAlertMessageTemplateComponent },
    { path: 'alert-message-template/add-alert-message-template', component: AddAlertMessageTemplateComponent },
    { path: 'group-group-members', component: GroupGroupMembersComponent }
];
@NgModule({
    declarations: [
        AlertGroupComponent,
        AddAlertGroupComponent,
        AlertGroupMemberComponent,
        AddAlertGroupMemberComponent,
        GroupGroupMembersComponent,
        DragDropDualListComponent,
        ArraySortPipe,
        ArrayFilterPipe,
        EventAlertRecipientComponent,
        AddEventAlertRecipientComponent,
        AlertMessageTemplateComponent,
        AddAlertMessageTemplateComponent
    ],
    imports: [
        RouterModule.forChild(routes),
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        CommonModule,
        MatIconModule,
        MatCheckboxModule,
        MatInputModule,
        MaterialModule,
        OwlDateTimeModule,
        CommonDirectivesModule,
        OwlNativeDateTimeModule,
        TextareaAutoresizeModule,
        CustomSharedModule,
        Ng4LoadingSpinnerModule.forRoot(),
    ],
    providers: [
        ApiService
    ],
    exports: [
        AlertGroupComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class AlertsModule {

}
