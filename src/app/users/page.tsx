'use client';

import { useState } from 'react';
import ListUsers from '../components/ListUsers';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const router = useRouter();

  return (
    <>
      <ListUsers />
    </>
  );
}