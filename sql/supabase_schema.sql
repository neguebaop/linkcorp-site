-- COLE TODO ESTE ARQUIVO NO SUPABASE > SQL EDITOR > RUN
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  category text not null check (category in ('android','ios','pc')),
  name text not null,
  description text,
  badge text,
  old_price numeric default 0,
  price numeric default 0,
  image_url text,
  plans jsonb default '[]'::jsonb,
  active boolean default true
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  customer_name text not null,
  whatsapp text not null,
  email text,
  notes text,
  items jsonb not null default '[]'::jsonb,
  total numeric default 0,
  status text default 'pendente'
);

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  date text,
  message text not null,
  stars int default 5,
  image_url text,
  approved boolean default true
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.feedbacks enable row level security;

drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select using (active = true or auth.role() = 'authenticated');

drop policy if exists "products admin insert" on public.products;
create policy "products admin insert" on public.products for insert with check (auth.jwt()->>'email' in ('SEUEMAIL@gmail.com'));

drop policy if exists "products admin update" on public.products;
create policy "products admin update" on public.products for update using (auth.jwt()->>'email' in ('SEUEMAIL@gmail.com'));

drop policy if exists "products admin delete" on public.products;
create policy "products admin delete" on public.products for delete using (auth.jwt()->>'email' in ('SEUEMAIL@gmail.com'));

drop policy if exists "orders public insert" on public.orders;
create policy "orders public insert" on public.orders for insert with check (true);

drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders for select using (auth.jwt()->>'email' in ('SEUEMAIL@gmail.com'));

drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update using (auth.jwt()->>'email' in ('SEUEMAIL@gmail.com'));

drop policy if exists "feedbacks public read" on public.feedbacks;
create policy "feedbacks public read" on public.feedbacks for select using (approved = true);

drop policy if exists "feedbacks admin all" on public.feedbacks;
create policy "feedbacks admin all" on public.feedbacks for all using (auth.jwt()->>'email' in ('SEUEMAIL@gmail.com')) with check (auth.jwt()->>'email' in ('SEUEMAIL@gmail.com'));

insert into public.products (category,name,description,badge,old_price,price,image_url,plans,active) values
('android','Painel Link Android','Painel otimizado para dispositivos Android. Interface intuitiva e recursos para melhorar sua gameplay.','Mais escolhido',99.90,35.00,'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?q=80&w=900','[{"name":"15 Dias","days":"15 dias","old_price":49.99,"price":35,"discount":"-30%"},{"name":"Mensal","days":"30 dias","old_price":99.99,"price":65,"discount":"-35%"},{"name":"Trimestral","days":"90 dias","old_price":119.99,"price":85,"discount":"-29%"},{"name":"Permanente","days":"Vitalício","old_price":179.99,"price":120,"discount":"-33%"}]',true),
('ios','Painel Link iOS','Solução exclusiva para iOS. Compatível com as últimas versões do sistema.','iOS',99.90,35.00,'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=900','[{"name":"15 Dias","days":"15 dias","old_price":49.99,"price":35,"discount":"-30%"},{"name":"Mensal","days":"30 dias","old_price":99.99,"price":65,"discount":"-35%"},{"name":"Permanente","days":"Vitalício","old_price":179.99,"price":120,"discount":"-33%"}]',true),
('pc','Internal Core Emulador','Painel completo com as melhores funcionalidades para PC/emulador.','PC',59.99,40.00,'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=900','[{"name":"15 Dias","days":"15 dias","old_price":59.99,"price":40,"discount":"-33%"},{"name":"Mensal","days":"30 dias","old_price":89.99,"price":65,"discount":"-28%"},{"name":"Trimestral","days":"90 dias","old_price":149.99,"price":99.99,"discount":"-33%"},{"name":"Vitalício","days":"Vitalício","old_price":399.99,"price":279.99,"discount":"-30%"}]',true)
on conflict do nothing;

insert into public.feedbacks (name,date,message,stars,approved) values
('TRILHA_16Y','26/09/2025','painelzinho bom até pq ele é barato mais é bem completo da de fazer mt booyah etc',5,true),
('DEIVIN','19/09/2025','o brabo atendeu super rápido e direto ao ponto sem erro',5,true),
('NAGATO','19/09/2025','nossa ta pica o painel parabens',5,true),
('CLIENTE SATISFEITO','23/09/2025','Esse com certeza entrou para meus top feedbacks já feitos',5,true)
on conflict do nothing;
