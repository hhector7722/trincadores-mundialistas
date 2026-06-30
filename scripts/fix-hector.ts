import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log("Updating password for hector@auth.trincadores.local...");
  
  const { data: users, error: err2 } = await supabase.auth.admin.listUsers();
  if (err2) {
    console.error("Error listing users:", err2.message);
    return;
  }

  const hector = users?.users.find(u => u.email === "hector@auth.trincadores.local");
  
  if (hector) {
    const { error: err3 } = await supabase.auth.admin.updateUserById(
      hector.id,
      { password: "8W3D38T4NKKS" }
    );
    if (err3) {
      console.error("Failed to update password:", err3.message);
    } else {
      console.log("Successfully updated password to 8W3D38T4NKKS");
    }
  } else {
    console.error("User not found!");
  }
}

fix();
