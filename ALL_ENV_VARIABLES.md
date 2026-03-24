# Complete Environment Variables Setup
# Copy these to the appropriate .env files

========================================
# APPS/MOBILE/.ENV.LOCAL (Mobile App)
========================================
EXPO_PUBLIC_API_URL=http://10.121.26.105:3002
EXPO_PUBLIC_SUPABASE_URL=https://tcurglnsisypoznmnbrm.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdXJnbG5zaXN5cG96bm1uYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzE0NzcsImV4cCI6MjA4OTkwNzQ3N30.eLKioCBjtUnVd8WNKtuOBQXL225LJi5pWT9P71lb1Sw

========================================
# APPS/API/.ENV (Backend API)
========================================
# Supabase (Required)
SUPABASE_URL=https://tcurglnsisypoznmnbrm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdXJnbG5zaXN5cG96bm1uYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMzMTQ3NywiZXhwIjoyMDg5OTA3NDc3fQ.C2-SpNx3-fw6A4XenIF7p9_kduOxSNe7ofPEjUiBYRQ
PORT=3002
NODE_ENV=development

# Mux (Required for video upload/playback)
MUX_TOKEN_ID=p625i9
MUX_TOKEN_SECRET=otn2n0ugb5r3tmjfu51oga54g
MUX_WEBHOOK_SECRET=gm1csd9fipd5tg3rku3gjvgd3udvrkqr

# Share links (Required)
SHARE_BASE_URL=http://localhost:3000

# Stripe (Optional - for billing)
STRIPE_SECRET_KEY=sk_test_...your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_...your-stripe-webhook-secret
STRIPE_PRICE_FREE=price_1...
STRIPE_PRICE_CREATOR=price_1...
STRIPE_PRICE_PRO=price_1...
STRIPE_PRICE_STUDIO=price_1...

# Beta Unlock (For testing - skip billing)
ROAM_BETA_UNLOCK=true

========================================
# APPS/WEB/.ENV (Web Share Page)
========================================
NEXT_PUBLIC_SUPABASE_URL=https://tcurglnsisypoznmnbrm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdXJnbG5zaXN5cG96bm1uYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzE0NzcsImV4cCI6MjA4OTkwNzQ3N30.eLKioCBjtUnVd8WNKtuOBQXL225LJi5pWT9P71lb1Sw

========================================
# ROAM-MUSIC/.ENV (Music Analysis Worker)
========================================
SUPABASE_URL=https://tcurglnsisypoznmnbrm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdXJnbG5zaXN5cG96bm1uYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMzMTQ3NywiZXhwIjoyMDg5OTA3NDc3fQ.C2-SpNx3-fw6A4XenIF7p9_kduOxSNe7ofPEjUiBYRQ

========================================
# PACKAGES/DB/.ENV (Database Package)
========================================
SUPABASE_URL=https://tcurglnsisypoznmnbrm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdXJnbG5zaXN5cG96bm1uYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMzMTQ3NywiZXhwIjoyMDg5OTA3NDc3fQ.C2-SpNx3-fw6A4XenIF7p9_kduOxSNe7ofPEjUiBYRQ

========================================
# WHERE TO GET THESE VALUES:
========================================

# SUPABASE:
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Settings → API
# 4. Copy Project URL, anon key, and service_role key

# MUX:
# 1. Go to https://mux.com
# 2. Sign up → Dashboard → Settings → API Keys
# 3. Create new access tokens
# 4. Copy Token ID, Token Secret, and generate Webhook Secret

# STRIPE:
# 1. Go to https://dashboard.stripe.com
# 2. Get Secret Key from Developers → API Keys
# 3. Create products with prices for billing plans
# 4. Get webhook secret from Webhooks → Endpoints

# RENDER (For API deployment):
# 1. Push code to GitHub
# 2. Go to https://render.com
# 3. Connect GitHub repo
# 4. Select apps/api folder
# 5. Use Dockerfile (already exists)
# 6. Add environment variables from APPS/API/.ENV section
# 7. Deployed URL will be: https://your-app.onrender.com
# 8. Update EXPO_PUBLIC_API_URL in mobile to use deployed URL

========================================
# QUICK SETUP ORDER:
========================================

1. FIRST: Configure Supabase variables (app will work for auth/sessions)
2. SECOND: Configure Mux (video upload/playback will work)
3. THIRD: Create audio bucket in Supabase Storage
4. FOURTH: Deploy to Render (optional, for production URL)
5. FIFTH: Configure Stripe (optional, for billing)

========================================
# SQL COMMANDS FOR SUPABASE SETUP:
========================================

-- Create audio storage bucket (run in Supabase SQL Editor)
insert into storage.buckets (id, name, public) values ('audio', 'audio', true);

-- Create storage policies (run in Supabase SQL Editor)
create policy "Users can upload audio" on storage.objects for insert with check (bucket_id = 'audio' and auth.role() = 'authenticated');
create policy "Users can view their own audio" on storage.objects for select using (bucket_id = 'audio' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Public audio access" on storage.objects for select using (bucket_id = 'audio');

========================================
# TESTING WITHOUT ALL SERVICES:
========================================

# Minimum for app to open and login:
- Supabase URL + Anon Key (mobile)
- Supabase URL + Service Role Key (API)

# Without Mux: Video upload will fail, but app remains usable
# Without Audio bucket: Music upload will fail, but YouTube URLs work
# Without Stripe: Use ROAM_BETA_UNLOCK=true to skip billing
