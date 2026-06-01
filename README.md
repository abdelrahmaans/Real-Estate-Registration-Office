# Real Estate Registration Office

نظام إدارة مكتب الشهر العقاري والتوثيق، مبني بـ Angular و Supabase لإدارة الموظفين، الخطابات، ولوحة متابعة مناسبة لاستخدام الأدمن.

آخر تحديث موثق: 2026-06-02

## الحالة الحالية

- واجهة Angular حديثة باتجاه عربي `RTL`.
- تسجيل دخول وحماية مسارات عبر Supabase Auth.
- لوحة تحكم رئيسية للأدمن.
- إدارة موظفين مربوطة بالباك اند من Supabase.
- فلترة وبحث للموظفين حسب الاسم، الكود، الهاتف، المكتب، الوظيفة، والحالة.
- إضافة وتعديل بيانات الموظفين من الواجهة، مع حفظ التغييرات في قاعدة البيانات.
- Dark / Night mode مضبوط لصفحات الموظفين والنماذج.
- زر رجوع واضح من صفحات الموظفين إلى لوحة التحكم.
- أيقونات Material و Font Awesome متاحة داخل المشروع.
- ملف استيراد نهائي لموظفي 2026 يحتوي على 230 موظف موزعين على 23 مكتب/جهة.

## التقنية

- Angular 21
- TypeScript strict
- Angular Material
- Tailwind CSS 4
- Supabase JS
- RxJS
- Vitest

## التشغيل المحلي

```bash
npm install
npm start
```

بعد التشغيل افتح:

```text
http://localhost:4200
```

## أوامر مهمة

```bash
npm run build
npm test
```

## المسارات

- `/auth/login` تسجيل الدخول.
- `/dashboard` لوحة التحكم.
- `/employees` قائمة الموظفين والفلترة.
- `/employees/new` إضافة موظف.
- `/employees/profile/:id` تعديل بيانات موظف.
- `/letters` إدارة الخطابات.
- `/reports` التقارير.

## ملفات قاعدة البيانات

- `DATABASE_SCHEMA.md`: السكيمة الأساسية لجداول Supabase.
- `SUPABASE_IMPORT_EMPLOYEES_2026.sql`: آخر سكريبت لاستيراد موظفي 2026 وتعديل جدول الموظفين بما يناسب الداتا الفعلية.

ترتيب التنفيذ المقترح في Supabase SQL Editor:

1. نفذ السكيمة الموجودة في `DATABASE_SCHEMA.md`.
2. نفذ `SUPABASE_IMPORT_EMPLOYEES_2026.sql`.
3. أنشئ مستخدم الأدمن من Supabase Auth حسب بيانات التشغيل عندك.

ملف الاستيراد آمن لإعادة التشغيل لأنه يستخدم `ON CONFLICT (employee_id) DO UPDATE`.

## بيانات الموظفين

مصدر البيانات:

```text
اسماء_الأعضاء_العامليين_جديد_2026.docx
```

تم تجهيز البيانات داخل `SUPABASE_IMPORT_EMPLOYEES_2026.sql` بهذه الصورة:

- أكواد الموظفين من `BNS-2026-001` إلى `BNS-2026-230`.
- المكاتب مرتبة من `OFFICE-01` إلى `OFFICE-23`.
- حقول المكتب والترتيب محفوظة في `office_name`, `office_code`, `office_sort_order`, `office_employee_order`.
- الحقول غير الموجودة في المصدر مثل الرقم القومي، البريد، وتاريخ التعيين أصبحت قابلة لأن تكون `NULL`.

## إعداد Supabase

إعداد الاتصال موجود في:

```text
src/environments/environment.ts
src/environments/environment.prod.ts
```

لا تضف مفاتيح سرية داخل الريبو. استخدم فقط المفاتيح العامة المسموح استخدامها في تطبيقات المتصفح، واحفظ أي مفاتيح Service Role خارج الكود.

## بنية المشروع

```text
src/app/core              خدمات الحماية و Supabase/Auth
src/app/modules/auth      تسجيل الدخول
src/app/modules/dashboard لوحة التحكم
src/app/modules/employee-management إدارة الموظفين
src/app/modules/letters   الخطابات
src/app/modules/reports   التقارير
src/environments          إعدادات البيئة
```

## ملاحظات تطوير

- المكونات Standalone حسب سلوك Angular الحديث بدون تعريف الخاصية يدويا داخل decorator.
- الحالة المحلية مبنية قدر الإمكان على Signals.
- المسارات الكبيرة Lazy Loaded.
- الواجهة مصممة للأدمن: مباشرة، قابلة للبحث، وبعيدة عن التعقيد الزائد.
- أي تعديل في الموظفين من الواجهة يجب أن يسمع مباشرة في Supabase.
