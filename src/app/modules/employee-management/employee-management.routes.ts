import { Routes } from '@angular/router';
import { EmployeeManagementPageComponent } from './pages/employee-management-page/employee-management-page.component';
import { EmployeeFeaturePlaceholderComponent } from './pages/employee-feature-placeholder/employee-feature-placeholder.component';
import { EmployeeFormPageComponent } from './pages/employee-form-page/employee-form-page.component';

export const employeeManagementRoutes: Routes = [
    {
        path: '',
        component: EmployeeManagementPageComponent,
    },
    {
        path: 'new',
        component: EmployeeFormPageComponent,
    },
    {
        path: 'profile',
        redirectTo: '',
        pathMatch: 'full',
    },
    {
        path: 'profile/:id',
        component: EmployeeFormPageComponent,
    },
    {
        path: 'requests',
        component: EmployeeFeaturePlaceholderComponent,
        data: {
            title: 'طلبات الموظفين',
            icon: 'task_alt',
            subtitle: 'متابعة الطلبات الداخلية والموافقات.',
            summary: 'واجهة مركزة للطلبات المفتوحة، حالات الاعتماد، والتحديثات الإدارية.',
        },
    },
    {
        path: 'archive',
        component: EmployeeFeaturePlaceholderComponent,
        data: {
            title: 'أرشيف السجلات',
            icon: 'archive',
            subtitle: 'ملفات قديمة وأرشفة منظمة.',
            summary: 'مستودع منسق لسجلات الموظفين غير النشطة والملفات المؤرشفة.',
        },
    },
];
