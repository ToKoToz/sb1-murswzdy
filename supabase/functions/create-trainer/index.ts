import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateTrainerRequest {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  function_title?: string;
  specialties?: string[];
  experience?: string;
  degrees_certifications?: string[];
  availability?: string;
  profile_picture_url?: string;
}

// Function to validate profile picture URL
function validateProfilePictureUrl(url: string | undefined): boolean {
  if (!url) return true; // Optional field
  
  try {
    const urlObj = new URL(url);
    // Allow common image hosting domains and data URLs
    const allowedDomains = [
      'images.pexels.com',
      'pexels.com',
      'unsplash.com',
      'images.unsplash.com',
      'picsum.photos',
      'via.placeholder.com',
      'dummyimage.com',
      'placehold.co',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'cloudinary.com',
      'amazonaws.com',
      'supabase.co'
    ];
    
    // Check if it's a data URL (base64 encoded image)
    if (url.startsWith('data:image/')) {
      return true;
    }
    
    // Check if the domain is allowed
    return allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

// Function to validate password strength
function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: 'Le mot de passe doit contenir au moins 8 caractères' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, error: 'Le mot de passe doit contenir au moins une lettre minuscule' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, error: 'Le mot de passe doit contenir au moins une lettre majuscule' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, error: 'Le mot de passe doit contenir au moins un chiffre' };
  }
  
  if (!/(?=.*[!@#$%^&*])/.test(password)) {
    return { isValid: false, error: 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)' };
  }
  
  return { isValid: true };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user making the request is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const trainerData: CreateTrainerRequest = await req.json();

    // Validate required fields
    if (!trainerData.name || !trainerData.email || !trainerData.password) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and password are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trainerData.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(trainerData.password);
    if (!passwordValidation.isValid) {
      return new Response(
        JSON.stringify({ error: passwordValidation.error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate profile picture URL if provided
    if (trainerData.profile_picture_url && !validateProfilePictureUrl(trainerData.profile_picture_url)) {
      return new Response(
        JSON.stringify({ error: 'Invalid profile picture URL. Please use a valid image URL from supported domains.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user with this email already exists by querying the profiles table
    const { data: existingProfile, error: checkProfileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', trainerData.email)
      .single();

    if (checkProfileError && checkProfileError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is what we want
      console.error('Error checking existing profiles:', checkProfileError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user uniqueness' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'A user with this email address already exists' }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create the auth user with the provided password
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: trainerData.email,
      password: trainerData.password,
      email_confirm: true,
      user_metadata: {
        name: trainerData.name,
        role: 'trainer'
      }
    });

    if (createUserError) {
      console.error('Error creating auth user:', createUserError);
      
      // Provide specific error messages based on the error
      let errorMessage = 'Failed to create user account';
      
      if (createUserError.message.includes('User already registered')) {
        errorMessage = 'A user with this email address already exists';
      } else if (createUserError.message.includes('password')) {
        errorMessage = 'Password does not meet security requirements';
      } else if (createUserError.message.includes('email')) {
        errorMessage = 'Invalid email address format';
      } else if (createUserError.message.includes('rate limit')) {
        errorMessage = 'Too many requests. Please try again later';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: createUserError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user data returned' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User created successfully:', authData.user.id);

    // Prepare profile data with required fields for upsert
    const profileUpsertData = {
      id: authData.user.id,
      email: trainerData.email,
      role: 'trainer',
      name: trainerData.name,
      phone_number: trainerData.phone_number || null,
      function_title: trainerData.function_title || null,
      specialties: Array.isArray(trainerData.specialties) ? trainerData.specialties : [],
      experience: trainerData.experience || null,
      degrees_certifications: Array.isArray(trainerData.degrees_certifications) ? trainerData.degrees_certifications : [],
      availability: trainerData.availability || null,
      profile_picture_url: trainerData.profile_picture_url || null
    };

    // Upsert the profile with all information (insert if not exists, update if exists)
    const { data: upsertedProfile, error: profileUpsertError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileUpsertData, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (profileUpsertError) {
      console.error('Error upserting profile:', profileUpsertError);
      
      // Try to clean up the created user if profile upsert fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('Cleaned up user after profile upsert failure');
      } catch (cleanupError) {
        console.error('Failed to cleanup user:', cleanupError);
      }
      
      let errorMessage = 'Failed to create trainer profile';
      
      if (profileUpsertError.message.includes('profile_picture_url')) {
        errorMessage = 'Invalid profile picture URL. Please use a valid image URL.';
      } else if (profileUpsertError.message.includes('function_title')) {
        errorMessage = 'Invalid function title. Please select a valid option.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: profileUpsertError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Profile upserted successfully for user:', authData.user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        trainer: {
          id: authData.user.id,
          email: authData.user.email,
          name: trainerData.name,
          phone_number: trainerData.phone_number || null,
          function_title: trainerData.function_title || null,
          specialties: Array.isArray(trainerData.specialties) ? trainerData.specialties : [],
          experience: trainerData.experience || null,
          degrees_certifications: Array.isArray(trainerData.degrees_certifications) ? trainerData.degrees_certifications : [],
          availability: trainerData.availability || null,
          profile_picture_url: trainerData.profile_picture_url || null
        },
        message: 'Formateur créé avec succès. Le formateur peut maintenant se connecter avec son email et son mot de passe.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});