insert into public.profiles (email, display_name)
values ('demo@example.com', 'Demo User')
on conflict (email) do nothing;
