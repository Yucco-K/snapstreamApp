// components/FooterTopPage.tsx
'use client';

import { useRouter } from 'next/navigation';
import { createClientComponentClient, Session } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUpload, faSignOutAlt, faArrowLeft, faList } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';


  const HeaderTopPage = () => {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [isAdmin, setIsAdmin] = useState(false);
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
      const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profile')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
          } else if (profileData.role === 'admin') {
            setIsAdmin(true);
          }
        }
      };

      getSession();
    }, [supabase]);

  const supabaseSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error', error.message);
    } else {
      router.push('/login');
    }
  };

  return (
    <header className="w-full bg-neutral-100 fixed top-0 p-3 flex flex-wrap justify-around z-10">
      <ul className="w-fit sm:w-fit mx-auto flex  justify-around gap-10">
        <li className="text-center cursor-pointer my-auto flex-1">
          <Link href="/">
            <span className="block text-xl font-bold">Snap Stream</span>
          </Link>
        </li>
      </ul>
      <ul className="w-fit sm:w-fit mx-auto flex justify-around gap-10">
        {/* {isAdmin && ( */}{/*管理者権限設定をコメントアウト */}
          <li className="text-center cursor-pointer flex-1">
            <Link href="/users">
            <span className="text-l inline-block place-self-center p-2">
                <FontAwesomeIcon icon={faUsers} className="text-gray-500 text-xs" />
              </span>
              <span className="block font-bold text-xs">UsersList</span>
            </Link>
          </li>
        {/* )} */}
        <li className="text-center cursor-pointer flex-1">
          <Link href="/category">
          <span className="text-l inline-block place-self-center p-2">
              <FontAwesomeIcon icon={faList} className="text-gray-500 text-xs" />
            </span>
            <span className="block font-bold text-xs">Categories</span>
          </Link>
        </li>
        <li className="text-center cursor-pointer flex-1">
          <Link href="/post">
            <span className="text-l inline-block place-self-center p-2">
              <FontAwesomeIcon icon={faUpload} className="text-gray-500 text-xs" />
            </span>
            <span className="block font-bold text-xs">Upload</span>
          </Link>
        </li>
        <li className="text-center cursor-pointer flex-1" onClick={supabaseSignOut}>
          <span className="text-l inline-block place-self-center p-2">
            <FontAwesomeIcon icon={faSignOutAlt} className="text-gray-500 text-xs" />
          </span>
          <span className="block font-bold text-xs">Logout</span>
        </li>
      </ul>
    </header>
  );
};

export default HeaderTopPage;
