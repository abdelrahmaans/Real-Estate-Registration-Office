import { Directive, ElementRef, effect, inject, input } from '@angular/core';
import { PermissionService } from '@core/services/permission.service';
import { AppPermission } from '@core/models/permission.model';

@Directive({
    selector: '[appCan]',
})
export class CanDirective {
    private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly permissions = inject(PermissionService);

    readonly appCan = input.required<AppPermission | AppPermission[]>();

    constructor() {
        void this.permissions.ensureLoaded();

        effect(() => {
            const required = this.appCan();
            const allowed = Array.isArray(required)
                ? this.permissions.hasAny(required)
                : this.permissions.hasPermission(required);

            this.element.nativeElement.hidden = !allowed;
        });
    }
}
