'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient, Session } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import UserProfile from '../components/UserProfile';
import FileUploadWithPost from '../components/FileUploadWithPost';
import AvatarUploadPage from '../components/AvatarUploadPage';

// Dynamic import for the unified component

export const dynamic = 'auto';

function PostPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // ローディング状態を管理
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setSession(session);
        const { data: profile, error } = await supabase
          .from('profile')
          .select('nickname')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setNickname(profile.nickname);
        } else if (error) {
          console.error('Error fetching profile:', error);
        }
      }
      setLoading(false);
    };

    getSession();
  }, [router, supabase]);

  if (loading) {
    return <p className="text-center text-gray-600">Loading...</p>; // ローディング表示
  }

  return (
    <div className="w-full max-w-3xl mx-auto pt-20">
      <FileUploadWithPost session={session} />
      <div className='mx-4'>
        <p className='text-sm font-bold mb-3'>投稿者:</p>
        <UserProfile />
      </div>
      <AvatarUploadPage/>
    </div>
  );
}

export default PostPage;
