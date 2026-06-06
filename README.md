# Real Estate Registration Office

نظام إدارة مكتب الشهر العقاري والتوثيق، مبني بـ Angular و Supabase لإدارة الموظفين والخطابات ولوحة متابعة مناسبة للأدمن.

آخر تحديث موثق: 2026-06-06

## ملخص المشروع

- الواجهة عربية بالكامل واتجاهها `RTL`.
- تسجيل الدخول وحماية المسارات عن طريق Supabase Auth.
- لوحة تحكم رئيسية للوصول السريع إلى الموظفين، الخطابات، والتقارير.
- إدارة الموظفين مربوطة مباشرة بجدول `employees` في Supabase.
- قسم ملفات الموظف مربوط بجدول `employee_documents` و Supabase Storage.
- Phase 1 enterprise foundation يضيف التطبيع، audit logs، notifications، و user permissions بدون حذف الحقول القديمة.
- Phase 2 dashboard analytics يضيف مؤشرات ورسوم تعتمد على views/RPC-friendly tables بدل تحميل كل الداتا في المتصفح.
- صفحة التقارير أصبحت تدعم فلترة مركبة حسب نوع البيانات، البحث، التاريخ، حالة الموظف، المكتب، الإدارة، نوع الخطاب، حالة الخطاب، والأولوية.
- الداشبورد يعرض آخر التحديثات من `audit_logs` بدل كارت أعلى المكاتب، مع fallback من أحدث الموظفين والخطابات لو view لم تعمل بعد.
- البحث والفلترة في الموظفين حسب الاسم، كود الموظف، رقم الهاتف، المكتب، الوظيفة، والحالة.
- إضافة وتعديل بيانات الموظفين من الواجهة مع حفظ التغيير في الباك اند.
- رفع أوراق الموظف مثل الإجازات وقرارات التعيين والتقارير الطبية، ثم فتحها وطباعتها من المتصفح.
- حذف الموظفين يتم كـ soft delete عن طريق حقل `deleted_at`.
- Dark / Night mode مضبوط لصفحات الموظفين والنماذج.
- أزرار رجوع واضحة من صفحات الموظفين إلى لوحة التحكم وقائمة الموظفين.
- ملف استيراد موظفي 2026 جاهز ويحتوي على 230 موظف موزعين على 23 مكتب/جهة.

## التقنية المستخدمة

- Angular 21
- TypeScript strict
- Angular Material
- Font Awesome icons via `@ng-icons/font-awesome`
- Tailwind CSS 4
- Supabase JS
- RxJS
- Vitest

## التشغيل المحلي

```bash
npm install
npm start
```

افتح التطبيق من:

```text
http://localhost:4200
```

أوامر مفيدة:

```bash
npm run build
npm test
```

## المسارات الرئيسية

- `/auth/login`: تسجيل الدخول.
- `/dashboard`: لوحة التحكم.
- `/employees`: قائمة الموظفين والبحث والفلترة.
- `/employees/new`: إضافة موظف.
- `/employees/profile/:id`: تعديل بيانات موظف.
- `/employees/profile/:id/documents`: ملفات وأوراق الموظف.
- `/employees/requests`: صفحة داخلية قيد التجهيز لطلبات الموظفين.
- `/employees/archive`: صفحة داخلية قيد التجهيز لأرشيف السجلات.
- `/letters`: قائمة الخطابات.
- `/letters/new`: إضافة خطاب.
- `/letters/:id`: فتح/تعديل خطاب.
- `/reports`: التقارير.

## بنية المشروع

```text
src/app/core
  guards/auth.guard.ts
  guards/permission.guard.ts
  directives/can.directive.ts
  services/audit.service.ts
  services/permission.service.ts
  services/auth.service.ts
  services/supabase.service.ts
  models/auth.model.ts
  models/audit.model.ts
  models/permission.model.ts

src/app/modules/auth
  صفحة تسجيل الدخول ومساراتها

src/app/modules/dashboard
  لوحة التحكم الرئيسية
  models/dashboard-analytics.model.ts
  services/dashboard-analytics.service.ts

src/app/modules/employee-management
  models/employee.model.ts
  services/employee.service.ts
  pages/employee-management-page
  pages/employee-form-page
  pages/employee-feature-placeholder

src/app/modules/letters
  models/letter.model.ts
  services/letters.service.ts
  pages/letters-list
  pages/letters-form

src/app/modules/reports
  صفحة التقارير

src/environments
  إعدادات Supabase للبيئات المختلفة
```

## إعداد Supabase

إعداد الاتصال موجود في:

```text
src/environments/environment.ts
src/environments/environment.prod.ts
```

لا تضف مفاتيح سرية داخل الريبو. استخدم فقط `anon key` المسموح استخدامه في المتصفح، واحفظ أي `service_role` خارج الكود.

## قاعدة البيانات

سكريبتات Supabase الحالية:

```text
SUPABASE_IMPORT_EMPLOYEES_2026.sql
SUPABASE_EMPLOYEE_DOCUMENTS.sql
SUPABASE_ENTERPRISE_PHASE1.sql
SUPABASE_DASHBOARD_ANALYTICS.sql
```

ملف `SUPABASE_IMPORT_EMPLOYEES_2026.sql` يقوم بالآتي:

- تفعيل إضافات `uuid-ossp` و `pg_trgm`.
- تعديل جدول `employees` حتى يقبل الداتا الفعلية القادمة من ملف الموظفين.
- جعل `national_id`, `email`, `employment_date` قابلة لأن تكون `NULL`.
- إضافة حقول المكتب والترتيب ومصدر الاستيراد.
- إنشاء فهارس مهمة للبحث والترتيب.
- إدخال أو تحديث 230 موظف.
- إنشاء view باسم `active_employees`.

ملف `SUPABASE_EMPLOYEE_DOCUMENTS.sql` يقوم بالآتي:

- إنشاء جدول `employee_documents`.
- إنشاء bucket خاص في Supabase Storage باسم `employee-documents`.
- ضبط حجم الملف الأقصى على 50 MB.
- السماح بملفات PDF، الصور، وملفات Word.
- تفعيل RLS للجدول والـ Storage.
- إنشاء view باسم `active_employee_documents`.

ملف `SUPABASE_ENTERPRISE_PHASE1.sql` يقوم بالآتي:

- إنشاء جداول `departments`, `offices`, `job_titles`.
- إضافة علاقات اختيارية جديدة في `employees`: `department_id`, `office_id`, `job_title_id`.
- نقل القيم النصية الحالية إلى الجداول الجديدة بدون حذف `department`, `office_name`, `office_code`, `job_title`.
- إنشاء `audit_logs` لتتبع العمليات المهمة.
- إنشاء `user_permissions` للصلاحيات التفصيلية.
- إنشاء `notifications`.
- إنشاء view باسم `employee_directory`.

ملف `SUPABASE_DASHBOARD_ANALYTICS.sql` يقوم بالآتي:

- إنشاء/تجهيز جداول `complaints` و `office_orders` الأساسية لو غير موجودة.
- إنشاء view باسم `dashboard_summary`.
- إنشاء views للرسوم:
  - `dashboard_letters_by_month`
  - `dashboard_employees_by_office`
  - `dashboard_employees_by_department`
  - `dashboard_complaints_by_status`
  - `dashboard_office_orders_by_status`
- إنشاء view باسم `dashboard_recent_updates` لعرض آخر التحديثات في الداشبورد من `audit_logs`.
- الداشبورد يستخدم هذه الـ views، ولو لم تكن موجودة بعد يعمل fallback آمن من جداول الموظفين والخطابات.

## الجداول المطلوبة في Supabase

### users

يستخدم لإدارة مستخدمي النظام وبيانات الأدمن.

حقول مهمة:

- `id`
- `email`
- `full_name`
- `phone`
- `department`
- `role`
- `is_active`
- `profile_image_url`
- `last_login_at`
- `created_at`
- `updated_at`
- `deleted_at`
- `created_by`

### employees

الجدول الأساسي للموظفين، وهو أهم جدول في النسخة الحالية.

حقول مهمة:

- `id`
- `employee_id`
- `full_name`
- `national_id`
- `mobile_number`
- `secondary_phone`
- `email`
- `address`
- `department`
- `office_code`
- `office_name`
- `job_title`
- `employment_date`
- `retirement_date`
- `employment_status`
- `notes`
- `profile_image_url`
- `office_sort_order`
- `office_employee_order`
- `source_document`
- `imported_at`
- `created_at`
- `updated_at`
- `deleted_at`
- `created_by`

الحالات المدعومة:

- `active`
- `retired`
- `resigned`

### letters

يستخدم لإدارة الخطابات الواردة والصادرة.

حقول مهمة:

- `id`
- `letter_number`
- `serial_number`
- `type`
- `category`
- `letter_date`
- `sender`
- `receiver`
- `subject`
- `summary`
- `priority`
- `status`
- `attachments_count`
- `notes`
- `created_at`
- `updated_at`
- `deleted_at`
- `created_by`

أنواع الخطابات:

- `incoming`
- `outgoing`

الأولويات المقترحة:

- `low`
- `normal`
- `high`
- `urgent`

### employee_documents

يستخدم لحفظ أوراق الموظفين وربط كل ملف بموظف محدد.

حقول مهمة:

- `id`
- `employee_id`
- `title`
- `document_type`
- `file_name`
- `file_path`
- `file_size`
- `mime_type`
- `issued_at`
- `notes`
- `uploaded_at`
- `uploaded_by`
- `deleted_at`

أنواع الملفات:

- `leave`: إجازة.
- `appointment`: تعيين أو قرار إداري.
- `national_id`: رقم قومي.
- `medical`: طبي.
- `disciplinary`: جزاء أو تحقيق.
- `other`: أخرى.

### departments

جدول مرجعي لتطبيع الإدارات وربطها بالموظفين لاحقا عن طريق `employees.department_id`.

### offices

جدول مرجعي للمكاتب والمأموريات، ويرتبط لاحقا بالموظفين عن طريق `employees.office_id`.

### job_titles

جدول مرجعي للوظائف، ويرتبط لاحقا بالموظفين عن طريق `employees.job_title_id`.

### complaints

موجودة في تصور السكيمة كجدول للشكاوى، لكنها ليست مفعلة كواجهة كاملة في النسخة الحالية.

### office_orders

موجودة في تصور السكيمة كجدول للأوامر الإدارية، لكنها ليست مفعلة كواجهة كاملة في النسخة الحالية.

### attachments

الجداول المقترحة للمرفقات:

- `letter_attachments`
- `complaint_attachments`
- `office_order_attachments`

### audit and permissions

جداول التتبع والصلاحيات:

- `audit_logs`
- `user_permissions`
- `notifications`

النظام يسجل حاليا بشكل غير معطل للتشغيل:

- تسجيل الدخول والخروج.
- إنشاء وتعديل وحذف الموظفين.
- رفع وحذف ملفات الموظفين.
- إنشاء الخطابات.

لو جدول `audit_logs` لم يتم إنشاؤه بعد، التطبيق يكمل العمل بدون تعطيل العملية.

## بيانات موظفي 2026

مصدر البيانات:

```text
اسماء_الأعضاء_العامليين_جديد_2026.docx
```

النسخة الجاهزة للاستيراد موجودة في:

```text
SUPABASE_IMPORT_EMPLOYEES_2026.sql
```

تفاصيل الاستيراد:

- عدد الموظفين: 230.
- أكواد الموظفين: من `BNS-2026-001` إلى `BNS-2026-230`.
- عدد المكاتب/الجهات: 23.
- أكواد المكاتب: من `OFFICE-01` إلى `OFFICE-23`.
- كل موظف مربوط بالمكتب، الوظيفة، رقم الهاتف، الملاحظات، وترتيبه داخل المكتب.
- الملف يستخدم `ON CONFLICT (employee_id) DO UPDATE`، لذلك يمكن إعادة تشغيله بأمان لتحديث البيانات.

## ترتيب تنفيذ قاعدة البيانات

1. أنشئ جداول Supabase الأساسية حسب الجداول المطلوبة أعلاه.
2. تأكد أن جدول `employees` يحتوي على حقل unique باسم `employee_id`.
3. شغل `SUPABASE_IMPORT_EMPLOYEES_2026.sql` من Supabase SQL Editor.
4. شغل `SUPABASE_EMPLOYEE_DOCUMENTS.sql` لإنشاء جدول الملفات و bucket الخاص بها.
5. شغل `SUPABASE_ENTERPRISE_PHASE1.sql` لإضافة الجداول المرجعية و audit و permissions.
6. شغل `SUPABASE_DASHBOARD_ANALYTICS.sql` لتفعيل مؤشرات ورسوم الداشبورد.
7. أنشئ مستخدم الأدمن من Supabase Auth.
8. جرب تسجيل الدخول ثم افتح `/employees` للتأكد من ظهور البيانات.
9. افتح ملفات أي موظف من `/employees/profile/:id/documents` وجرب رفع ملف PDF أو صورة سكانر.

## ملاحظات مهمة للداتا

- بعض الموظفين لا يوجد لهم رقم قومي أو بريد أو تاريخ تعيين في المصدر، لذلك هذه الحقول nullable.
- بعض الأسماء أو أرقام الهاتف مكررة في المصدر، لذلك الاعتماد الأساسي في التحديث هو `employee_id`.
- حقل `deleted_at` يستخدم للحذف الناعم، والقوائم تعرض السجلات غير المحذوفة فقط.
- ترتيب العرض يعتمد على `office_sort_order` ثم `office_employee_order`.

## ملاحظات تطوير

- المكونات مبنية كـ Standalone components حسب Angular الحديث.
- المسارات الكبيرة Lazy Loaded.
- الحالة المحلية في صفحات الموظفين مبنية على Signals.
- استخدم Reactive Forms في نماذج الإدخال.
- الواجهة مصممة للأدمن: واضحة، مباشرة، وسهلة الفلترة.
- أي تعديل في الموظفين من الواجهة يجب أن يسمع مباشرة في Supabase.
- صفحة التقارير تعرض نتائج قابلة للفتح والطباعة وتعمل من نفس خدمات الموظفين والخطابات الحالية.

## الملفات التي يجب أن تبقى في الريبو

- `README.md`: التوثيق النهائي للمشروع.
- `SUPABASE_IMPORT_EMPLOYEES_2026.sql`: ملف استيراد وتحديث موظفي 2026.
- `SUPABASE_EMPLOYEE_DOCUMENTS.sql`: ملف إنشاء جدول وStorage ملفات الموظفين.
- `SUPABASE_ENTERPRISE_PHASE1.sql`: ملف التطبيع و audit و permissions.
- `SUPABASE_DASHBOARD_ANALYTICS.sql`: ملف مؤشرات ورسوم الداشبورد.
- `package.json` و `package-lock.json`: إدارة الحزم.
- `angular.json`, `tsconfig*.json`: إعدادات Angular و TypeScript.
- `src/`: كود التطبيق.
- `public/`: الملفات العامة.

تم حذف ملفات إعدادات المساعدات والأدوات غير المطلوبة من الريبو حتى يظل المشروع مركزا على الكود والداتا الفعلية.
