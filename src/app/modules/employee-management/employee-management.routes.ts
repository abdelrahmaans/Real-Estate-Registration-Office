import { Routes } from '@angular/router';

export const employeeManagementRoutes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/employee-management-page/employee-management-page.component').then(
                m => m.EmployeeManagementPageComponent
            ),
    },
    {
        path: 'new',
        loadComponent: () =>
            import('./pages/employee-form-page/employee-form-page.component').then(
                m => m.EmployeeFormPageComponent
            ),
    },
    {
        path: 'profile',
        redirectTo: '',
        pathMatch: 'full',
    },
    {
        path: 'profile/:id/documents',
        loadComponent: () =>
            import('./pages/employee-documents-page/employee-documents-page.component').then(
                m => m.EmployeeDocumentsPageComponent
            ),
    },
    {
        path: 'profile/:id',
        loadComponent: () =>
            import('./pages/employee-form-page/employee-form-page.component').then(
                m => m.EmployeeFormPageComponent
            ),
    },
    {
        path: 'requests',
        loadComponent: () =>
            import('./pages/employee-feature-placeholder/employee-feature-placeholder.component').then(
                m => m.EmployeeFeaturePlaceholderComponent
            ),
        data: {
            title: 'طلبات الموظفين',
            icon: 'task_alt',
            subtitle: 'متابعة الطلبات الداخلية والموافقات.',
            summary: 'واجهة مركزة للطلبات المفتوحة، حالات الاعتماد، والتحديثات الإدارية.',
        },
    },
    {
        path: 'archive',
        loadComponent: () =>
            import('./pages/employee-feature-placeholder/employee-feature-placeholder.component').then(
                m => m.EmployeeFeaturePlaceholderComponent
            ),
        data: {
            title: 'أرشيف السجلات',
            icon: 'archive',
            subtitle: 'ملفات قديمة وأرشفة منظمة.',
            summary: 'مستودع منسق لسجلات الموظفين غير النشطة والملفات المؤرشفة.',
        },
    },
];
