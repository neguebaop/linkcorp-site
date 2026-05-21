-- Rode isto no Supabase SQL Editor para preparar pedidos com Pix automático Mistic Pay.
alter table public.orders add column if not exists external_id text;
alter table public.orders add column if not exists payment_provider text;
alter table public.orders add column if not exists payment_status text default 'pending';
alter table public.orders add column if not exists payment_payload jsonb default '{}'::jsonb;
alter table public.orders add column if not exists paid_at timestamptz;

create index if not exists orders_external_id_idx on public.orders(external_id);
create index if not exists orders_payment_status_idx on public.orders(payment_status);
