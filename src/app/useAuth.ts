'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseAdmin as supabase } from '../../lib/supabaseAdmin';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const useAuth = () => {
  const router = useRouter();
  const supabaseClient = createClientComponentClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        const { user } = session;
        console.log('User object:', user);

        // プロフィールを取得してログに出力
        const { data: profile, error: profileError } = await supabase
          .from('profile')
          .select('id, nickname')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
        } else {
          console.log('Profile fetched:', profile);
        }
      }
    };

    checkSession();
  }, [router, supabaseClient]);
};

export default useAuth;
