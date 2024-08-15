'use client';

import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const supabase = supabaseAdmin;

type DeleteUserProps = {
  userId: string;
  onDelete: (userId: string) => void;
};

export const DeleteUser: React.FC<DeleteUserProps> = ({ userId, onDelete }) => {
  const handleDelete = async () => {
    try {
          // ユーザーのprofileを取得してavatar_urlが設定されているか確認
          const { data: profile, error: profileError } = await supabase
          .from('profile')
          .select('avatar_url')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError.message);
          alert(`プロファイルの取得中にエラーが発生しました: ${profileError.message}`);
          return;
        }

        if (profile && profile.avatar_url) {
          alert('先にアバターを削除してください。');
          return;
        }

        // ユーザーが投稿を持っているかどうかを確認
      const { data: posts, error: postError } = await supabase
        .from('post')
        .select('id')
        .eq('created_by', userId);

      if (postError) {
        console.error('Error fetching posts:', postError.message);
        alert(`投稿の取得中にエラーが発生しました: ${postError.message}`);
        return;
      }

      if (posts && posts.length > 0) {
        alert('先に投稿を削除してください。');
        return;
      }

      // コメントを削除
      const onDeleteComments = async (userId: string) => {
        try {
          console.log('UserId:', userId); // userIdをコンソールに出力

          const { data: postsToUpdate, error } = await supabase
            .from('post')
            .select('id, comments')
            .filter('comments', 'cs', JSON.stringify([{ user_id: userId }]));

          if (error) {
            console.error('Error fetching posts to update:', error.message);
            return;
          }

          console.log('Posts to update:', postsToUpdate); // postsToUpdateのリストをコンソールに出力

          for (const post of postsToUpdate || []) {
            const updatedComments = post.comments.filter((comment: any) => comment.user_id !== userId);

            await supabase
              .from('post')
              .update({ comments: updatedComments })
              .eq('id', post.id);
          }
        } catch (error) {
          console.error('Error deleting comments:', (error as any).message);
        }
      };

      await onDeleteComments(userId);

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
};

export default DeleteUser;
