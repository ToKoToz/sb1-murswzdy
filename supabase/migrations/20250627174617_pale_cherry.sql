/*
  # Création du profil administrateur

  1. Utilisateur administrateur
    - Création de l'utilisateur auth avec email et mot de passe
    - Création de l'identité pour l'authentification
    - Création du profil avec rôle admin

  2. Sécurité
    - Vérification d'existence avant création
    - Gestion des contraintes et relations
*/

-- Créer l'utilisateur administrateur seulement s'il n'existe pas déjà
DO $$
DECLARE
    user_id uuid;
BEGIN
    -- Vérifier si l'utilisateur existe déjà
    SELECT id INTO user_id FROM auth.users WHERE email = 'jl.calmon@jlc-mercury.com';
    
    -- Si l'utilisateur n'existe pas, le créer
    IF user_id IS NULL THEN
        -- Générer un nouvel ID utilisateur
        user_id := gen_random_uuid();
        
        -- Insérer l'utilisateur dans auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            invited_at,
            confirmation_token,
            confirmation_sent_at,
            recovery_token,
            recovery_sent_at,
            email_change_token_new,
            email_change,
            email_change_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            phone,
            phone_confirmed_at,
            phone_change,
            phone_change_token,
            phone_change_sent_at,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            reauthentication_sent_at,
            is_sso_user,
            deleted_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            user_id,
            'authenticated',
            'authenticated',
            'jl.calmon@jlc-mercury.com',
            crypt('Calm@n251158339846', gen_salt('bf')),
            NOW(),
            NOW(),
            '',
            NOW(),
            '',
            NULL,
            '',
            '',
            NULL,
            NULL,
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "JL Calmon", "role": "admin"}',
            FALSE,
            NOW(),
            NOW(),
            NULL,
            NULL,
            '',
            '',
            NULL,
            '',
            0,
            NULL,
            '',
            NULL,
            FALSE,
            NULL
        );
        
        -- Insérer l'identité dans auth.identities avec provider_id
        INSERT INTO auth.identities (
            id,
            user_id,
            provider_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            user_id,
            user_id::text,  -- provider_id est requis, utiliser l'ID utilisateur
            format('{"sub": "%s", "email": "%s"}', user_id::text, 'jl.calmon@jlc-mercury.com')::jsonb,
            'email',
            NOW(),
            NOW(),
            NOW()
        );
    END IF;
    
    -- Créer ou mettre à jour le profil
    INSERT INTO profiles (
        id,
        name,
        email,
        role,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        'JL Calmon',
        'jl.calmon@jlc-mercury.com',
        'admin',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        updated_at = NOW();
        
END $$;