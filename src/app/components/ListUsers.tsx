'use client';

import { useEffect, useState } from 'react';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin';
import DeleteUser from './DeleteUser';
import { createClientComponentClient, Session, SupabaseClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import styles from '../styles/Spinner.module.css';

export default function ListUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [remarks, setRemarks] = useState<{ [key: string]: { role: string; nickname: string; created_at: string } }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const recordsPerPage = 4;

  const router = useRouter();
  const supabaseClient = createClientComponentClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setSession(session);
      // console.log('Session:', session);
    };
    getSession();
  }, [supabaseClient.auth]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.admin.listUsers();

        if (error) {
          alert(`Failed to list users: ${error.message}`);
        } else {
          setUsers(data.users);
          setFilteredUsers(data.users);
        }

        const { data: profileData, error: profileError } = await supabaseClient
          .from('profile')
          .select('id, role, nickname, created_at')
          .order('created_at', { ascending: false });

        if (profileError) {
          console.error('Error fetching profiles:', profileError);
        } else if (profileData) {
          const remarksMap: { [key: string]: { role: string; nickname: string; created_at: string } } = {};
          profileData.forEach((profile: { id: string; role: string | null; nickname: string | null; created_at: string }) => {
            remarksMap[profile.id] = { role: profile.role ?? '未設定', nickname: profile.nickname ?? '名無し', created_at: profile.created_at };
          });
          setRemarks(remarksMap);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to fetch users. Please try again later.');
      }
    };

    fetchUsers();
    setIsLoading(false);

  }, [supabaseClient]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleDelete = (userId: string) => {
    setUsers(users.filter((user) => user.id !== userId));
    setFilteredUsers(filteredUsers.filter((user) => user.id !== userId));
  };

  const handleRoleChange = async (userId: string, isAdmin: boolean) => {
    const newRole = isAdmin ? 'admin' : 'user';
    const { error } = await supabaseClient
      .from('profile')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role. Please try again.');
    } else {
      setRemarks(prevRemarks => ({
        ...prevRemarks,
        [userId]: { ...prevRemarks[userId], role: newRole },
      }));
    }
  };

  useEffect(() => {
    const searchWords = searchQuery.toLowerCase().trim().split(/\s+/); // スペースで分割してワードの配列を取得

    const filtered = users.filter(user => {
      const userProfile = remarks[user.id] || { role: '未設定', nickname: '名無し', created_at: '' };

      // 各ワードがID、メール、権限、ニックネーム、登録日に含まれているかをチェック
      return searchWords.every((word) =>
        user.id.toLowerCase().includes(word) ||
        user.email.toLowerCase().includes(word) ||
        userProfile.role.toLowerCase().includes(word) ||
        userProfile.nickname.toLowerCase().includes(word) ||
        userProfile.created_at.toLowerCase().includes(word)
      );
    });
    setFilteredUsers(filtered);
    setCurrentPage(1); // 検索クエリが変更されたときにページをリセット
  }, [searchQuery, users, remarks]);

  useEffect(() => {
    // `filteredUsers` が更新されたときに `currentPage` をリセット
    setCurrentPage(1);
  }, [filteredUsers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const startIndex = (currentPage - 1) * recordsPerPage;
  const selectedUsers = filteredUsers.slice(startIndex, startIndex + recordsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / recordsPerPage);

  function onDeleteComments(userId: string): Promise<void> {
    throw new Error('Function not implemented.');
  }

  return (
    <div className={`w-full mt-20`}>
      <div className={`w-full max-w-5xl mx-auto p-5`}>
        <div className={`w-full max-w-3xl mx-auto`}>
          {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className={styles.spinner}></div>
          </div>
          ) : (
            <>
              <h1 className="text-2xl text-center font-bold mb-6">ユーザーリスト <span className='text-red-300 text-xl ml-10'>管理者用画面</span></h1>
              <input
                type="text"
                placeholder="検索"
                value={searchQuery}
                onChange={handleSearchChange}
                className="mb-4 p-2 border border-gray-300 rounded w-full sm:w-2/3 lg:w-1/2"
              />
              <ul className="space-y-4">
                {selectedUsers.map((user) => (
                  <li key={user.id} className="bg-white p-4 pb-10 rounded shadow flex justify-between items-center">
                    <div>
                      <p className="font-semibold">ユーザーID: {user.id}</p>
                      <p>メール: {user.email}</p>
                      <p>ニックネーム: {remarks[user.id]?.nickname || '名無し'}</p>
                      {/* <p>権限: {remarks[user.id]?.role || '未設定'}</p> */}
                      <p>登録日: {remarks[user.id]?.created_at || '未設定'}</p>
                      <label className="flex items-center space-x-2 text-red-400">
                      <input
                        type="checkbox"
                        checked={remarks[user.id]?.role === 'admin'}
                        onChange={(e) => handleRoleChange(user.id, e.target.checked)}
                      />
                      <span>管理者権限</span>
                    </label>
                    </div>
                    <div className="flex space-x-2">
                      <DeleteUser userId={user.id} onDelete={handleDelete} />
                    </div>
                  </li>
                ))}
              </ul>
              <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-md flex justify-center text-xs"> {/* fixedを追加して固定表示 */}
                <ul className="flex space-x-2 mt-3">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <li key={index + 1}>
                      <button
                        onClick={() => handlePageChange(index + 1)}
                        disabled={currentPage === index + 1}
                        className={`px-3 py-1 mb-2 rounded ${currentPage === index + 1 ? 'bg-gray-400 text-white' : 'bg-gray-200'}`}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
