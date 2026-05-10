-- Seed 10 sample employees for local testing. Run after RLS fix and after creating admin auth user.
-- This script uses the admin auth user as created_by when available.

INSERT INTO public.employees (employee_id, full_name, national_id, mobile_number, secondary_phone, email, address, department, job_title, employment_date, employment_status, notes, profile_image_url, created_at, updated_at, created_by)
VALUES
('EMP-001','أحمد علي','12345678901234','01000000001',NULL,'ahmed.ali@example.com','شارع النيل، المدينة','شؤون الموظفين','مسؤول موارد بشرية','2018-05-12','active',NULL,NULL,NOW(),NOW(), (SELECT id FROM auth.users WHERE email='admin@registry.test' LIMIT 1)),
('EMP-002','سارة محمد','22345678901234','01000000002',NULL,'sara.mohamed@example.com','شارع التحرير','الشؤون الإدارية','مساعد إداري','2019-03-01','active',NULL,NULL,NOW(),NOW(), (SELECT id FROM auth.users WHERE email='admin@registry.test' LIMIT 1)),
('EMP-003','خالد محمود','32345678901234','01000000003',NULL,'khaled.mahmoud@example.com','شارع الملك','التقنية','مهندس نظم','2020-07-15','active',NULL,NULL,NOW(),NOW(), (SELECT id FROM auth.users WHERE email='admin@registry.test' LIMIT 1)),
('EMP-004','منى إبراهيم','42345678901234','01000000004',NULL,'mona.ibrahim@example.com','منطقة التجارة','المالية','محاسب','2017-11-30','active',NULL,NULL,NOW(),NOW(), (SELECT id FROM auth.users WHERE email='admin@registry.test' LIMIT 1)),
('EMP-005','ياسر سمير','52345678901234','01000000005',NULL,'yasser.samir@example.com','حي الوسط','التشغيل','فني ميكانيكا','2016-09-20','active',NULL,NULL,NOW(),NOW(), (SELECT id FROM auth.users WHERE email='admin@registry.test' LIMIT 1)),
('EMP-006','نوران هاني','62345678901234','01000000006',NULL,'noran.hani@example.com','شارع الوحدة','الخدمات','أخصائية خدمات','2021-01-05','active',NULL,NULL,NOW(),NOW(), (SELECT id FROM auth.users WHERE email='admin@registry.test' LIMIT 1)),
('EMP-007','محمود خالد','72345678901234','01000000007',NULL,'mahmoud.khaled@example.com','منطقة الجنوب','المشتريات','مشرف مشتريات','2015-06-10','retired',NULL,NULL,NOW(),NOW(), (SELECT id FROM auth.users WHERE email='admin@registry.test' LIMIT 1)),
('EMP-008','هبة عادل','82345678901234','01000000008',NULL,'heba.adel@example.com','شارع الامل','الشؤون القانونية','مستشارة قانونية','2018-02-22','active',NULL,NULL,NOW(),NOW(), (SELECT id FROM auth.users WHERE email='admin@registry.test' LIMIT 1)),
('EMP-009','رامي سعيد','92345678901234','01000000009',NULL,'ramy.saeed@example.com','حي النخيل','التطوير','محلل بيانات','2022-04-18','active',NULL,NULL,NOW(),NOW(), (SELECT id FROM auth.users WHERE email='admin@registry.test' LIMIT 1)),
('EMP-010','ليندا يوسف','02345678901234','01000000010',NULL,'linda.youssef@example.com','المنطقة الصناعية','الأرشيف','أمين محفوظات','2014-12-01','active',NULL,NULL,NOW(),NOW(), (SELECT id FROM auth.users WHERE email='admin@registry.test' LIMIT 1));
