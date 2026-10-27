-- 0003_demo_users.sql
-- Creates the three demo identities and their memberships.
--
-- These accounts are public on purpose: this is a demonstration with invented
-- data, and anyone looking at it should be able to sign in and try to break
-- the isolation themselves. No real person and no real record is involved.

do $$
declare
  demo_password constant text := 'demo-password-2026';
  northwind constant uuid := '11111111-1111-1111-1111-111111111111';
  acme      constant uuid := '22222222-2222-2222-2222-222222222222';
  rec record;
  uid uuid;
begin
  for rec in
    select * from (values
      ('northwind@demo.local', northwind, 'client'),
      ('acme@demo.local',      acme,      'client'),
      ('admin@demo.local',     northwind, 'admin')
    ) as t(email, org_id, role)
  loop
    select id into uid from auth.users where email = rec.email;

    if uid is null then
      uid := gen_random_uuid();

      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin,
        confirmation_token, recovery_token, email_change_token_new, email_change
      ) values (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
        rec.email, crypt(demo_password, gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false,
        '', '', '', ''
      );

      insert into auth.identities (
        provider_id, user_id, identity_data, provider, last_sign_in_at,
        created_at, updated_at
      ) values (
        uid::text, uid,
        jsonb_build_object('sub', uid::text, 'email', rec.email, 'email_verified', true),
        'email', now(), now(), now()
      );
    end if;

    insert into public.memberships (user_id, org_id, role)
    values (uid, rec.org_id, rec.role)
    on conflict (user_id, org_id) do update set role = excluded.role;
  end loop;
end $$;

select u.email, m.role, o.name as org
from auth.users u
join public.memberships m on m.user_id = u.id
join public.orgs o on o.id = m.org_id
order by u.email;
