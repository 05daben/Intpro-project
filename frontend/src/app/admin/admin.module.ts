import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { SubNavComponent } from './subnav.component';
import { LayoutComponent } from './layout.component';
import { OverviewComponent } from './overview.component';

import { ListComponent as DeptListComponent } from './departments/list.component';
import { AddEditComponent as DeptAddEditComponent } from './departments/add-edit.component';

import { ListComponent as EmpListComponent } from './employees/list.component';
import { AddEditComponent as EmpAddEditComponent } from './employees/add-edit.component';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        AdminRoutingModule
    ],
    declarations: [
        SubNavComponent,
        LayoutComponent,
        OverviewComponent,
        DeptListComponent,
        DeptAddEditComponent,
        EmpListComponent,
        EmpAddEditComponent
    ]
})
export class AdminModule { }
