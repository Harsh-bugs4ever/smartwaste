import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env", "utf-8");
const envLines = envContent.split("\n");
let url = "";
let key = "";

for (const line of envLines) {
  const trimmed = line.trim();
  if (trimmed.startsWith("VITE_SUPABASE_URL=")) url = trimmed.split("=")[1].trim();
  if (trimmed.startsWith("VITE_SUPABASE_ANON_KEY=")) key = trimmed.split("=")[1].trim();
}

const supabase = createClient(url, key);

async function testAuthAndRLS() {
  console.log("=== Testing User Registration & RLS ===");
  const testEmail = `admin_${Date.now()}@smartwaste.test`;
  const testPassword = "AdminSecurePassword123!";

  console.log(`1. Attempting sign up with: ${testEmail}`);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: "Municipal Admin Harsh",
        role: "super_admin"
      }
    }
  });

  if (signUpErr) {
    console.log("SignUp Result:", signUpErr.message);
  } else {
    console.log("SignUp Result: SUCCESS! User ID:", signUpData.user?.id);
  }

  // Now sign in to get an authenticated session
  console.log("\n2. Signing in to verify authenticated RLS access...");
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInErr) {
    console.log("SignIn Result:", signInErr.message);
  } else {
    console.log("SignIn Result: SUCCESS! Authenticated as:", signInData.user.email);
    
    // Now test querying smart_bins as an AUTHENTICATED user
    const { data: bins, error: binErr } = await supabase.from("smart_bins").select("bin_code, name, current_fill_percentage, status").limit(5);
    if (binErr) {
      console.log("Query smart_bins error:", binErr.message);
    } else {
      console.log(`\n🎉 Query as Authenticated User SUCCESS: Retrieved ${bins.length} smart bins from PostgreSQL:`);
      bins.forEach(b => console.log(`   - ${b.bin_code}: ${b.name} (${b.current_fill_percentage}% full, status: ${b.status})`));
    }

    // Check profiles table
    const { data: prof, error: profErr } = await supabase.from("profiles").select("*");
    if (profErr) {
      console.log("Query profiles error:", profErr.message);
    } else {
      console.log(`\n🎉 Profiles table now has ${prof.length} user profile(s):`);
      prof.forEach(p => console.log(`   - ${p.full_name} (${p.email}) -> Role: ${p.role}`));
    }
  }
}

testAuthAndRLS();
