'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

const UserProfile = () => {
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const supabaseClient = createClientComponentClient();

  const fetchProfile = useCallback(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      const { user } = session;

      // プロフィール情報を取得
      const { data: profile } = await supabase
        .from('profile')
        .select('nickname, avatar_url')
        .eq('id', user.id)
        .single();

      if (profile) {
        setNickname(profile.nickname);
        setAvatarUrl(profile.avatar_url);
      }
    } else {
      setNickname('');
      setAvatarUrl(null);
    }
  }, [supabaseClient]);

  const handleAvatarUploaded = (url: string) => {
    setAvatarUrl(url);
  };

  useEffect(() => {
    fetchProfile();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile, supabaseClient.auth]);

  return (
    <div className="profile mx-3">
      {avatarUrl ? (
        <Image src={avatarUrl} alt="User Avatar" className="avatar" width={100} height={100} />
      ) : (
        <p>No Avatar available</p>
      )}
      <span> {nickname ? `${nickname} さん ログイン中` : '名無しさん さんログイン中'} </span>
    </div>
  );
};

export default UserProfile;
