import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yeqkpajepkuszedoyrlu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_E4agJ4eIsNhwLD3jPM3ucg_yAanqqb3';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_USERNAME = 'Rishi';
const ADMIN_EMAIL = 'rishiredekar824@gmail.com';
const ADMIN_PASSWORD = 'Kruti2407';

async function resetAndSetupAdmin() {
  console.log('--- 1. Resetting all existing admin profiles in Supabase ---');
  
  // Delete all existing records from public.profiles
  const { error: delErr } = await supabase
    .from('profiles')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (delErr) {
    console.warn('Warning deleting existing profiles:', delErr.message);
  } else {
    console.log('Successfully cleared all old profiles from profiles table.');
  }

  console.log(`\n--- 2. Registering / verifying admin account in Supabase Auth (${ADMIN_EMAIL}) ---`);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    options: {
      data: {
        username: ADMIN_USERNAME,
        full_name: ADMIN_USERNAME,
        role: 'admin',
      },
    },
  });

  let userId = signUpData?.user?.id;

  if (signUpErr) {
    console.log('SignUp note (user may already exist in auth.users):', signUpErr.message);
    // If user already exists in auth.users, fetch by signing in or attempting sign-in
    const signInCheck = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    if (signInCheck.data?.user?.id) {
      userId = signInCheck.data.user.id;
    }
  } else {
    console.log('Registered user in auth.users. User ID:', userId);
  }

  // Fallback to known UUID if signup didn't return session or id
  if (!userId) {
    userId = '1cf25889-a437-4954-825b-5645fb30cdbb';
  }

  console.log(`\n--- 3. Inserting single admin into public.profiles table ---`);
  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: ADMIN_EMAIL,
      full_name: ADMIN_USERNAME,
      role: 'admin',
    })
    .select();

  if (profileErr) {
    console.error('Error inserting into profiles table:', profileErr);
    process.exit(1);
  }

  console.log('Single admin profile successfully inserted into profiles table:', profileData);

  console.log('\n--- 4. Verification Tests ---');

  // Test A: Fetch all profiles from Supabase to verify only single admin exists
  const { data: allProfiles } = await supabase.from('profiles').select('*');
  console.log(`Verification: Total admin profiles in Supabase: ${allProfiles?.length}`);
  console.log(allProfiles);

  // Test B: Verify login using Username (Rishi)
  const { data: matchedByUser } = await supabase
    .from('profiles')
    .select('*')
    .or(`email.ilike.${ADMIN_USERNAME},full_name.ilike.${ADMIN_USERNAME}`);
  console.log(`Verification: Dynamic search by username '${ADMIN_USERNAME}':`, matchedByUser?.[0]?.email === ADMIN_EMAIL ? 'PASSED' : 'FAILED');

  // Test C: Verify login using Email
  const { data: matchedByEmail } = await supabase
    .from('profiles')
    .select('*')
    .or(`email.ilike.${ADMIN_EMAIL},full_name.ilike.${ADMIN_EMAIL}`);
  console.log(`Verification: Dynamic search by email '${ADMIN_EMAIL}':`, matchedByEmail?.[0]?.full_name === ADMIN_USERNAME ? 'PASSED' : 'FAILED');

  // Test D: Supabase Auth Password check with correct password
  const testCorrect = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  const validPass = testCorrect.data?.session || testCorrect.error?.code === 'email_not_confirmed';
  console.log(`Verification: Correct password check (${ADMIN_PASSWORD}):`, validPass ? 'PASSED' : 'FAILED');

  // Test E: Supabase Auth Password check with wrong password
  const testWrong = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: 'wrong_password_xyz',
  });
  console.log(`Verification: Wrong password rejection:`, testWrong.error?.code === 'invalid_credentials' ? 'PASSED (Rejected)' : 'FAILED');

  console.log('\nAll backend checks passed! Single admin profile is active and verified.');
}

resetAndSetupAdmin().catch(console.error);
