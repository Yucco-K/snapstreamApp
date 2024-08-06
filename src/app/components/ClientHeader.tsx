'use client';

import { usePathname } from "next/navigation";
import HeaderUpload from "./HeaderUpload";
import HeaderTopPage from "./HeaderTopPage";
import HeaderDefault from "./HeaderDefault";

export default function ClientHeader() {
  const pathname = usePathname();

  const renderHeader = () => {
    switch (pathname) {
      case '/post':
        return <HeaderUpload />;
      case '/':
        return <HeaderTopPage />;
      case '/login':
        return null;
      default:
        return <HeaderDefault />;
    }
  };

  return renderHeader();
}
