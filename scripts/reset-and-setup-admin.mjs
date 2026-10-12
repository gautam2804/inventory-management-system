import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yeqkpajepkuszedoyrlu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_E4agJ4eIsNhwLD3jPM3ucg_yAanqqb3';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function resetAndSetupAdmin() {
  console.log('1. Deleting all inventory data from Supabase...');

  // Delete in reverse dependency order:
  // 1. stock_movements
  const { error: movErr } = await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (movErr) console.warn('Note deleting stock_movements:', movErr.message);
  else console.log('Cleared stock_movements.');

  // 2. products
  const { error: prodErr } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (prodErr) console.warn('Note deleting products:', prodErr.message);
  else console.log('Cleared products.');

  // 3. suppliers
  const { error: supErr } = await supabase.from('suppliers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (supErr) console.warn('Note deleting suppliers:', supErr.message);
  else console.log('Cleared suppliers.');

  // 4. categories
  const { error: catErr } = await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (catErr) console.warn('Note deleting categories:', catErr.message);
  else console.log('Cleared categories.');

  console.log('2. Creating admin user (Name: Rishi, Password: rishi24)...');
  const adminEmail = 'rishi@attechdigital.com';
  const adminPassword = 'rishi24';

  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: adminEmail,
    password: adminPassword,
    options: {
      data: {
        full_name: 'Rishi',
        role: 'admin',
      },
    },
  });

  if (signUpErr) {
    console.log('SignUp result note:', signUpErr.message);
  } else {
    console.log('Admin user registered in Supabase Auth:', signUpData?.user?.id);
  }

  // Also verify sign in with password
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (signInErr) {
    console.log('SignIn test note (email confirmation might be required in project settings):', signInErr.message);
  } else {
    console.log('SignIn verification SUCCESS! User ID:', signInData?.user?.id);
  }

  console.log('Done!');
}

resetAndSetupAdmin().catch(console.error);
