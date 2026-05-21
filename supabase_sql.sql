
alter table public.orders
add column if not exists payment_provider text;

alter table public.orders
add column if not exists payment_id text;

alter table public.orders
add column if not exists pix_code text;

alter table public.orders
add column if not exists pix_qr_code text;

alter table public.orders
add column if not exists payment_status text default 'pending';

alter table public.orders
add column if not exists external_id text;

alter table public.orders
add column if not exists payment_url text;

alter table public.orders
add column if not exists qr_code text;

alter table public.orders
add column if not exists qr_code_base64 text;

alter table public.orders
add column if not exists payment_payload jsonb;
