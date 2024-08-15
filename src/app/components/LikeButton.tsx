import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface LikeButtonProps {
  postId: string;
  postOwnerId: string;
  userId: string;
  refreshPosts: () => void;
}

const LikeButton: React.FC<LikeButtonProps> = ({ postId, postOwnerId, userId, refreshPosts }) => {
  const supabaseClient = createClientComponentClient();
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    setIsOwner(postOwnerId === userId);

    const fetchLikeStatus = async () => {
      const { data, error } = await supabaseClient
        .from('like')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (data && data.length > 0) {
        setIsLiked(true);
      }
      setLoading(false);
    };

    fetchLikeStatus();
  }, [postId, userId, postOwnerId, supabaseClient]);

  const handleLike = async () => {
    if (isLiked || isOwner) return;

    const { data: existingLikes, error: fetchError } = await supabaseClient
      .from('like')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error checking existing likes:', fetchError);
      return;
    }

    if (existingLikes) {
      setIsLiked(true);
      return;
    }

    const { error: insertError } = await supabaseClient
      .from('like')
      .insert([{ post_id: postId, user_id: userId, created_at: new Date().toISOString() }]);

    if (!insertError) {
      setIsLiked(true);
      const { data: post, error: fetchPostError } = await supabaseClient
        .from('post')
        .select('iine')
        .eq('id', postId)
        .single();

      if (fetchPostError) {
        console.error('Error fetching post:', fetchPostError);
        return;
      }

      const updatedLikes = (post?.iine || 0) + 1;

      const { error: updateError } = await supabaseClient
        .from('post')
        .update({ iine: updatedLikes })
        .eq('id', postId);

      if (updateError) {
        console.error('Error updating post:', updateError);
        refreshPosts();

        return;
      }

      refreshPosts();
    } else {
      console.error('Error liking the post:', insertError);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <button
      onClick={handleLike}
      disabled={isLiked || isOwner}
      className={`p-2 mt-4 ${isLiked || isOwner ? 'bg-gray-400' : 'bg-green-500'} text-white rounded-md`}
    >
      {isOwner ? '自分の投稿' : isLiked ? 'いいね済み' : 'いいね'}
    </button>
  );
};

export default LikeButton;
