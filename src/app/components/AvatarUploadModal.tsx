'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient, Session } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAvatarUploaded: (url: string) => void;
}

const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({ isOpen, onClose, onAvatarUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const supabaseClient = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
        // プロフィールのアバターURLを取得してプレビューURLに設定
        const { data: profileData, error: profileError } = await supabaseClient
          .from('profile')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single();
        if (!profileError && profileData.avatar_url) {
          setPreviewUrl(profileData.avatar_url);
        }
      }
    };
    fetchSession();
  }, [supabaseClient, router]);

  const fetchProfileData = async (userId: string) => {
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profile')
      .select('avatar_url')
      .eq('id', userId)
      .single();
    if (profileError) {
      console.error('Error fetching profile data:', profileError);
    } else {
      setPreviewUrl(profileData?.avatar_url || null);
    }
  };

  const listFiles = async (message: string) => {
    try {
      const { data, error } = await supabaseClient.storage
        .from('avatars')
        .list('', { limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' } });

      if (error) {
        console.error(`Error listing files ${message}:`, error.message);
        return;
      }

      console.log(`File list ${message}:`, data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('画像を選択してください。');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;


    // 現在のアバターURLを取得
    const { data: currentProfile, error: fetchProfileError } = await supabaseClient
      .from('profile')
      .select('avatar_url')
      .eq('id', session?.user?.id)
      .single();

    if (fetchProfileError) {
      throw fetchProfileError;
    }

    const oldAvatarUrl = currentProfile?.avatar_url;

    console.log(oldAvatarUrl);

      // 新しい画像をアップロード
    let { error: uploadError } = await supabaseClient.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabaseClient.storage
      .from('avatars')
      .getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    if (!session || !session.user) throw new Error("User is not authenticated");

      // プロフィールを新しいアバターURLで更新
      const { error: updateError } = await supabaseClient
        .from('profile')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) {
        throw updateError;
      }

      // 旧アバターを削除
      if (oldAvatarUrl) {
        const oldFilePath = oldAvatarUrl.split('/').pop();
        console.log(oldFilePath);
        const { error: deleteError } = await supabaseClient.storage
          .from('avatars')
          .remove([oldFilePath]);

        if (deleteError) {
          throw deleteError;
        }
      }

      onAvatarUploaded(publicUrl);
      setPreviewUrl(publicUrl);
      fetchProfileData(session.user.id);
      window.location.reload(); // ページをリロードしてブラウザの状態を更新
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarDelete = async () => {
    try {
      if (!session || !session.user) {
        throw new Error('User is not authenticated');
      }

      // 現在のアバターURLを取得
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profile')
        .select('avatar_url')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      const existingAvatarUrl = profileData?.avatar_url;

      // 既存のアバターを削除
      if (existingAvatarUrl) {
        const filePath = existingAvatarUrl.split('/').pop(); //'avatar/' を含めずにファイル名のみ取得

        // console.log(`Deleting avatar: ${filePath}`); // 削除するファイルパスを出力

        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([filePath]); // avatars/' を含めずにファイル名のみ設定

        if (deleteError) {
          throw deleteError;
        }

        const { error: updateError } = await supabaseClient
          .from('profile')
          .update({ avatar_url: null })
          .eq('id', session.user.id);

        if (updateError) {
          throw updateError;
        }

        setPreviewUrl(null);
        onAvatarUploaded('');
        fetchProfileData(session.user.id);
        window.location.reload(); // ページをリロードしてブラウザの状態を更新
      }
    } catch (error) {
      console.error('Error deleting avatar:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={onClose}>
      {/* モーダルの内容をクリックしても背景のクリックイベントが伝播しないように onClick ハンドラを追加 */}
      <div className="bg-white rounded-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">アバターをアップロード</h2>
        <input
          title="Avatar Upload"
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          disabled={uploading}
        />
        {previewUrl && (
          <div className="mt-4">
            <p>プレビュー:</p>

            <Image
              src={previewUrl}
              alt="Avatar Preview"
              width={100}
              height={100}
              className={`mt-2 max-w-full ${uploading ? 'opacity-50' : ''}`}
            />

            <button
              onClick={handleAvatarDelete}
              className="bg-red-300 text-gray-900 font-bold px-4 py-2 rounded mt-2"
              disabled={uploading}
            >
              アバターを削除
            </button>
          </div>
        )}
        {uploading && <p className="mt-2 text-gray-500">アップロード中...</p>}
        <div className="mt-4 flex justify-end">
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
            onClick={onClose}
            disabled={uploading}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarUploadModal;
