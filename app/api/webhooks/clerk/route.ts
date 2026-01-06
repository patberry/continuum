import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  // DEBUG LOGGING - Check if env vars are accessible
  console.log('=== WEBHOOK DEBUG START ===');
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('SERVICE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
  console.log('WEBHOOK_SECRET exists:', !!process.env.CLERK_WEBHOOK_SECRET);
  console.log('=== WEBHOOK DEBUG END ===');

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET is not set');
  }

Then:
bashgit add .
git commit -m "Add webhook debug logging"
git push origin main

Take a break after pushing. We'll check logs after deploy finishes.Claude is AI and can make mistakes. Please double-check responses.
  // Get headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Error: Verification failed', { status: 400 });
  }

  // Handle user.created event
  if (evt.type === 'user.created') {
    const { id: clerkUserId, email_addresses } = evt.data;
    const primaryEmail = email_addresses[0]?.email_address;

    if (!primaryEmail) {
      console.log('No email found for user:', clerkUserId);
      return new Response('No email found', { status: 200 });
    }

    console.log('New user created:', primaryEmail);

    // Check if this email is in beta_testers
    const { data: betaTester, error: fetchError } = await supabase
      .from('beta_testers')
      .select('*')
      .eq('email', primaryEmail.toLowerCase())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking beta tester:', fetchError);
    }

    if (betaTester) {
      console.log('Beta tester found! Allocating 1000 credits...');

      // Allocate credits using YOUR actual table structure
      const { error: creditError } = await supabase
        .from('credit_balances')
        .insert({
          balance_id: clerkUserId,
          monthly_credits: 1000,
          topup_credits: 0,
          total_credits_used: 0,
          monthly_credits_expire_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (creditError) {
        console.error('Error allocating credits:', creditError);
      }

      // Update beta_testers record
      const { error: updateError } = await supabase
        .from('beta_testers')
        .update({
          signed_up_at: new Date().toISOString(),
          user_id: clerkUserId,
          credits_allocated: !creditError,
        })
        .eq('email', primaryEmail.toLowerCase());

      if (updateError) {
        console.error('Error updating beta tester:', updateError);
      }

      console.log('✓ Beta tester activated:', primaryEmail);
    } else {
      console.log('Not a beta tester:', primaryEmail);
    }
  }

  return new Response('Webhook processed', { status: 200 });
}