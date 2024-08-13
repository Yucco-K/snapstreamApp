'use client';

import { useState } from 'react';
import AvatarUploadModal from './AvatarUploadModal';
import Image from 'next/image';

const AvatarUploadPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleAvatarUploaded = (url: string) => {
    setAvatarUrl(url);
  };

  return (
    <div className="flex flex-col items-center justify-start bg-white pt-10 pb-20">
      <button
        onClick={() => setModalOpen(true)}
        className="px-6 py-3 bg-blue-300 text-gray-700 font-bold rounded shadow-md hover:bg-blue-400 transition-transform transform hover:scale-105"
      >
        アバターを登録または変更する
      </button>
      <AvatarUploadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAvatarUploaded={handleAvatarUploaded}
      />
      {avatarUrl && (
        <div className="mt-8">
          <p>アップロードされたアバター:</p>
          <Image src={avatarUrl} alt="Uploaded Avatar" className="w-10 h-10 rounded-full mt-4" />
        </div>
      )}
    </div>
  );
};

export default AvatarUploadPage;
