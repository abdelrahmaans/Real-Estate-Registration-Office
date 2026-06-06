import { Routes } from '@angular/router';
import { permissionGuard } from '@core/guards/permission.guard';

export const employeeManagementRoutes: Routes = [
    {
        path: '',
        canActivate: [permissionGuard],
        loadComponent: () =>
            import('./pages/employee-management-page/employee-management-page.component').then(
                m => m.EmployeeManagementPageComponent
            ),
        data: { permission: 'employees.read' },
    },
    {
        path: 'new',
        canActivate: [permissionGuard],
        loadComponent: () =>
            import('./pages/employee-form-page/employee-form-page.component').then(
                m => m.EmployeeFormPageComponent
            ),
        data: { permission: 'employees.create' },
    },
    {
        path: 'profile',
        redirectTo: '',
        pathMatch: 'full',
    },
    {
        path: 'profile/:id/documents',
        canActivate: [permissionGuard],
        loadComponent: () =>
            import('./pages/employee-documents-page/employee-documents-page.component').then(
                m => m.EmployeeDocumentsPageComponent
            ),
        data: { permission: 'employee_documents.read' },
    },
    {
        path: 'profile/:id',
        canActivate: [permissionGuard],
        loadComponent: () =>
            import('./pages/employee-form-page/employee-form-page.component').then(
                m => m.EmployeeFormPageComponent
            ),
        data: { permission: 'employees.update' },
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
