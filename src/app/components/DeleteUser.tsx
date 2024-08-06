'use client';

import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const supabase = supabaseAdmin;

type DeleteUserProps = {
  userId: string;
  onDelete: (userId: string) => void;
};

export default function DeleteUser({ userId, onDelete }: DeleteUserProps) {
  const handleDelete = async () => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        alert(`Failed to delete user: ${error.message}`);
      } else {
        alert('User deleted successfully');
        onDelete(userId); // リストからユーザーを削除
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(`Failed to delete user: ${error.message}`);
      } else {
        alert('Failed to delete user: An unknown error occurred');
      }
    }
  };

  return (
    <button onClick={handleDelete} className="p-2 bg-red-200 text-gray-900 font-bold rounded hover:bg-red-300">
      削除
    </button>
  );
}
