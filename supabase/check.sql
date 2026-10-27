-- check.sql — одна проверка всего сразу.
-- Ожидаемый результат: в колонке verdict везде OK.

with expected(tbl) as (
  values ('orgs'),('memberships'),('projects'),
         ('deliverables'),('listings'),('webhook_events'),('import_runs')
),
tables as (
  select e.tbl,
         c.relname is not null as present,
         coalesce(c.relrowsecurity, false) as rls_on,
         (select count(*) from pg_policies p
            where p.schemaname = 'public' and p.tablename = e.tbl) as policies
  from expected e
  left join pg_class c
    on c.relname = e.tbl
   and c.relnamespace = 'public'::regnamespace
   and c.relkind = 'r'
)
select tbl as item,
       case when not present then 'MISSING TABLE'
            when not rls_on  then 'RLS IS OFF'
            else 'OK' end as verdict,
       policies::text as detail
from tables

union all
select 'orgs rows',
       case when count(*) = 2 then 'OK' else 'UNEXPECTED' end,
       count(*)::text
from public.orgs

union all
select 'projects rows',
       case when count(*) = 4 then 'OK' else 'UNEXPECTED' end,
       count(*)::text
from public.projects

union all
select 'deliverables rows',
       case when count(*) = 3 then 'OK' else 'UNEXPECTED' end,
       count(*)::text
from public.deliverables

union all
select 'demo users',
       case when count(*) = 3 then 'OK' else 'UNEXPECTED' end,
       count(*)::text
from auth.users where email like '%@demo.local'

union all
select 'memberships',
       case when count(*) = 3 then 'OK' else 'UNEXPECTED' end,
       count(*)::text
from public.memberships

union all
select 'helper functions',
       case when count(*) = 2 then 'OK' else 'UNEXPECTED' end,
       count(*)::text
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('is_member','is_org_admin')

order by 1;
