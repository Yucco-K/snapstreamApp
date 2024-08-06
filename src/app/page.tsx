'use client';

import { useState, useEffect } from 'react';
import PostList from './components/PostList';
import { createClient, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabaseAdmin as supabase } from '../../lib/supabaseAdmin';
import styles from './styles/Spinner.module.css';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const supabaseClient = createClientComponentClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setSession(session);

      if (session) {
        const { data: profile, error } = await supabase
          .from('profile')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setUserRole(profile.role);
        }
      }
    };

    getSession();
  }, [supabaseClient.auth]);

  return (
    <div className="max-w-4xl mx-auto p-6 shadow-md rounded-lg bg-neutral-100">
      {session ? (
          <PostList />
      ) : (
        <div className="flex justify-center items-center h-32">
          <div className={styles.spinner}></div>
        </div>
      )}
    </div>
  );
}
