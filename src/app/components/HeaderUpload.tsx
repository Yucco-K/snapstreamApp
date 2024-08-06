// FooterUpload.tsx
'use client';

import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faList, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

function HeaderUpload() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const supabaseSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error', error.message);
    } else {
      router.push('/login');
    }
  };

  return (
    <header className="w-full bg-neutral-100 fixed top-0 p-2 flex justify-around z-10">
      <ul className="w-fit mx-auto flex gap-10">
        <li className="text-center cursor-pointer my-auto">
          <Link href="/">
            <span className="block text-xl font-bold">Snap Stream</span>
          </Link>
        </li>
      </ul>
      <ul className="w-fit mx-auto flex gap-10 py-2">
      <li className="text-center cursor-pointer">
          <Link href="/category">
          <span className="text-l inline-block place-self-center p-2 text-xs">
              <FontAwesomeIcon icon={faList} className="text-gray-500 text-xs" />
            </span>
            <span className="block text-sm font-bold text-xs">Categories</span>
          </Link>
        </li>
        <li className="text-center cursor-pointer">
            <Link href="/">
              <span className="text-l inline-block place-self-center p-2 text-xs">
                <FontAwesomeIcon icon={faArrowLeft}  className="text-gray-500 text-xs" />
              </span>
              <span className="block text-sm font-bold text-xs">Back</span>
            </Link>
          </li>
          <li className="text-center cursor-pointer" onClick={supabaseSignOut}>
            <span className="text-l inline-block place-self-center p-2 text-xs">
              <FontAwesomeIcon icon={faSignOutAlt} className="text-gray-500 text-xs" />
            </span>
            <span className="block text-sm font-bold text-xs">Logout</span>
          </li>
      </ul>
    </header>
  );
}
export default HeaderUpload;
