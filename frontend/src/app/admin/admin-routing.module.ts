import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SubNavComponent } from './subnav.component';
import { LayoutComponent } from './layout.component';
import { OverviewComponent } from './overview.component';

import { ListComponent as DeptListComponent } from './departments/list.component';
import { AddEditComponent as DeptAddEditComponent } from './departments/add-edit.component';

import { ListComponent as EmpListComponent } from './employees/list.component';
import { AddEditComponent as EmpAddEditComponent } from './employees/add-edit.component';

const accountsModule = () => import('./accounts/accounts.module').then(x => x.AccountsModule);

const routes: Routes = [
    { path: '', component: SubNavComponent, outlet: 'subnav' },
    {
        path: '', component: LayoutComponent,
        children: [
            { path: '', component: OverviewComponent },
            { path: 'accounts', loadChildren: accountsModule },
            
            // Departments child routes
            { path: 'departments', component: DeptListComponent },
            { path: 'departments/add', component: DeptAddEditComponent },
            { path: 'departments/edit/:id', component: DeptAddEditComponent },

            // Employees child routes
            { path: 'employees', component: EmpListComponent },
            { path: 'employees/add', component: EmpAddEditComponent },
            { path: 'employees/edit/:id', component: EmpAddEditComponent }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule { }
