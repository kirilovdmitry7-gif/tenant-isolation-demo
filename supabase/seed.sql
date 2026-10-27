-- seed.sql — two tenants with data that deliberately overlaps in shape, so a
-- leak between them would be obvious.

insert into public.orgs (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Northwind Studio'),
  ('22222222-2222-2222-2222-222222222222', 'Acme Coffee Co')
on conflict (id) do nothing;

insert into public.projects (id, org_id, name, status) values
  ('aaaaaaa1-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Brand film - autumn cut','in_review'),
  ('aaaaaaa1-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Product demo - v3','delivered'),
  ('bbbbbbb2-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','Loyalty launch spot','in_progress'),
  ('bbbbbbb2-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','Store opening reel','delivered')
on conflict (id) do nothing;

insert into public.deliverables (id, project_id, org_id, label, storage_path, size_bytes) values
  ('ddddddd1-0000-0000-0000-000000000001','aaaaaaa1-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','autumn_cut_v4.mov','northwind/autumn_cut_v4.mov', 2684354560),
  ('ddddddd1-0000-0000-0000-000000000002','aaaaaaa1-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','product_demo_final.mp4','northwind/product_demo_final.mp4', 814748364),
  ('ddddddd2-0000-0000-0000-000000000001','bbbbbbb2-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','store_opening_reel.mp4','acme/store_opening_reel.mp4', 1073741824)
on conflict (id) do nothing;
