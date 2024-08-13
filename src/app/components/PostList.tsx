import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Session } from '@supabase/supabase-js';
import styles from '../styles/Spinner.module.css';
import Image from 'next/image';
interface Category {
  id: string; // UUID
  name: string;
}
interface Comment {
  user_id: string;
  comment: string;
  created_at: string;
  nickname?: string;
  avatar_url?: string;
}

export interface Post {
  id: string;
  title: string;
  comment: string;
  comments?: Comment[];
  iine: number;
  hidden: boolean;
  created_date: string;
  created_time?: string;
  created_by: string;
  nickname?: string;
  avatar_url?: string;
  file_url?: string | null;
  category_id: string;
  isFileDeleted?: boolean;  // Add this line
}

// YouTubeのURLかどうかを判定する関数
const isYouTubeUrl = (url: string): boolean => {
  return /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.test(url);
};

const PostList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>('未選択' ?? null);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [comment, setComment] = useState<{ [key: string]: string }>({});
  const [session, setSession] = useState<Session | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isFileDeleted, setIsFileDeleted] = useState<Set<string>>(new Set()); // 追加

  const supabaseClient = createClientComponentClient();
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabaseClient
      .from('category')
      .select('*');

    if (error) {
      console.error('Error fetching category:', error);
    } else {
      setCategories(data);
    }
  }, [supabaseClient]);

  const POSTS_PER_PAGE = 2; // Set an appropriate value for the number of posts per page

  const fetchPosts = useCallback(async (page: number, categoryId: string | null) => {
    setIsLoading(true);
    const from = (page - 1) * POSTS_PER_PAGE;
    const to = page * POSTS_PER_PAGE - 1;

    let query = supabaseClient
      .from('post')
      .select('*, profile (nickname, avatar_url)', { count: 'exact' }) // profile テーブルから nickname と avatar_url を取得
      .order('created_date', { ascending: false })
      .order('created_time', { ascending: false })
      .range(from, to);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      // 各ポストに対して、コメント内のuser_idを使ってプロフィール情報を取得する
      const postsWithProfile = await Promise.all(data.map(async (post: any) => {
        // コメントのユーザー情報を取得する
        const commentsWithProfile = await Promise.all(post.comments.map(async (comment: any) => {
          const { data: commentProfile } = await supabaseClient
            .from('profile')
            .select('nickname, avatar_url')
            .eq('id', comment.user_id)
            .single();

          return {
            ...comment,
            nickname: commentProfile?.nickname || 'Unknown',
            avatar_url: commentProfile?.avatar_url || null,
          };
        }));

        return {
          ...post,
          nickname: post.profile ? post.profile.nickname : 'Unknown',
          avatar_url: post.profile ? post.profile.avatar_url : null,
          comments: commentsWithProfile,
        };
      }));
      setPosts(postsWithProfile);
      setFilteredPosts(postsWithProfile);
      setTotalPages(Math.ceil((count ?? 0) / POSTS_PER_PAGE)); // countがundefinedの可能性に備えて (count ?? 0) を使用
      setIsLoading(false);
    }
  }, [supabaseClient]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchPosts(currentPage, selectedCategory);
  }, [fetchPosts, currentPage, selectedCategory]);

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = event.target.value ? event.target.value : null;
    const selectedCategoryName = categoryId ? categories.find(category => category.id === categoryId)?.name || null : 'ALL';
    setSelectedCategory(categoryId);
    setSelectedCategoryName(selectedCategoryName);
    setCurrentPage(1);  // カテゴリ変更時にページをリセット
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setSession(session);

      if (session?.user) {
        const { data: likedPostsData } = await supabaseClient
          .from('like')
          .select('post_id')
          .eq('user_id', session.user.id);

        if (likedPostsData) {
          setLikedPosts(new Set(likedPostsData.map((like: { post_id: string }) => like.post_id)));
        }
      }
    };

    getSession();
  }, [supabaseClient]);

  const handleCommentSubmit = async (postId: string) => {
    if (comment[postId]?.trim() === '') return;

    try {
      const { data: sessionData } = await supabaseClient.auth.getSession();
      const user = sessionData?.session?.user;

      if (user) {
        const { data: profileData } = await supabaseClient
          .from('profile')
          .select('nickname, avatar_url')
          .eq('id', user.id)
          .single();

        const nickname = profileData?.nickname || 'Unknown';
        const avatar_url = profileData?.avatar_url || '';

        const postToUpdate = posts.find(post => post.id === postId);
        if (postToUpdate) {
          const newComment: Comment = {
            user_id: user.id,
            comment: comment[postId],
            created_at: new Date().toISOString(),
            nickname: nickname,
            avatar_url: avatar_url
          };
          const updatedComments = [...(postToUpdate.comments || []), newComment];
          const { error } = await supabaseClient
            .from('post')
            .update({ comments: updatedComments })
            .eq('id', postId);

          if (error) {
            console.error('Error adding comment:', error);
          } else {
            setPosts(posts.map(post =>
              post.id === postId ? { ...post, comments: updatedComments } : post
            ));
            setFilteredPosts(filteredPosts.map(post =>
              post.id === postId ? { ...post, comments: updatedComments } : post
            ));
            setComment({ ...comment, [postId]: '' });
            alert('コメントが追加されました');
            await fetchPosts(currentPage, selectedCategory);

            // コメント投稿後にその投稿の位置にスクロールする処理を追加
            setTimeout(() => {
              postRefs.current[postId]?.scrollIntoView({ behavior: 'smooth' });
            }, 0);

          }
        }
      } else {
        console.error('User not found.');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const handleToggleHidden = async (postId: string, hidden: boolean) => {
    try {
      const updatedHidden = !hidden;
      const { error } = await supabaseClient
        .from('post')
        .update({ hidden: updatedHidden })
        .eq('id', postId);

      if (error) {
        console.error('Error toggling hidden:', error.message);
        throw error;
      }

      const updatedPosts = posts.map(post =>
        post.id === postId ? { ...post, hidden: updatedHidden } : post
      );
      setPosts(updatedPosts);
      setFilteredPosts(updatedPosts);
    } catch (error) {
      console.error('非表示切り替え中にエラーが発生しました:', error);
    }
  };

  const handleCommentDelete = async (postId: string, commentIndex: number) => {
    const postToUpdate = posts.find(post => post.id === postId);
    if (postToUpdate) {
      const updatedComments = postToUpdate.comments?.filter((_, index) => index !== commentIndex) || [];
      const { error } = await supabaseClient
        .from('post')
        .update({ comments: updatedComments })
        .eq('id', postId);

      if (error) {
        console.error('Error deleting comment:', error);
      } else {
        setPosts(posts.map(post =>
          post.id === postId ? { ...post, comments: updatedComments } : post
        ));
        setFilteredPosts(filteredPosts.map(post =>
          post.id === postId ? { ...post, comments: updatedComments } : post
        ));
        alert('コメントが削除されました');
      }
    }
  };

  const handleLike = async (postId: string) => {
    if (!session?.user || session.user.id === posts.find(post => post.id === postId)?.created_by) {
      return; // 自分の投稿にはいいねを押せない
    }

    const postToUpdate = posts.find(post => post.id === postId);
    if (postToUpdate) {
      const hasLiked = likedPosts.has(postId);
      if (hasLiked) return; // すでにいいねを押している場合は何もしない

      try {
        const jstDate = new Date().toLocaleDateString('ja-JP');

        const { error: insertError } = await supabaseClient
          .from('like')
          .insert([{ post_id: postId, user_id: session.user.id ,created_at: jstDate.split('/').join('-') }]);

        if (!insertError) {
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
            return;
          }

          // likedPostsの更新方法を変更
          const updatedLikedPosts = new Set(likedPosts);
          updatedLikedPosts.add(postId);
          setLikedPosts(updatedLikedPosts);

          setPosts(posts.map(post =>
            post.id === postId ? { ...post, iine: updatedLikes } : post
          ));
          setFilteredPosts(filteredPosts.map(post =>
            post.id === postId ? { ...post, iine: updatedLikes } : post
          ));
        } else {
          console.error('Error liking the post:', insertError);
        }
      } catch (error) {
        console.error('Error liking post:', error);
      }
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const postToDelete = posts.find(post => post.id === postId);
      if (postToDelete && !postToDelete.isFileDeleted && !isYouTubeUrl(postToDelete.file_url || '')) {
        alert('ファイルを削除してから投稿を削除してください。');
        return;
      }

      console.log('Deleting post with ID:', postId);
      const { error } = await supabaseClient
        .from('post')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('投稿の削除に失敗しました:', error);
        throw error;
      }

      const updatedPosts = posts.filter(post => post.id !== postId);
      setPosts(updatedPosts);
      setFilteredPosts(updatedPosts);
      alert('投稿が削除されました');
    } catch (error) {
      console.error('削除処理中にエラーが発生しました:', error);
    }
  };

  const handleDeleteFile = async (postId: string, fileUrl: string) => {
    try {

      console.log('Deleting file with URL:', fileUrl); // デバッグ用ログ

      const filePath = fileUrl.split('/').slice(-2).join('/').split('?')[0];

      console.log('Extracted file path:', filePath); // デバッグ用ログ

      const { data: fileData, error: fetchError } = await supabaseClient
        .storage
        .from('post_files')
        .list('', { search: filePath });

      if (fetchError) {
        console.error('Error fetching file:', fetchError.message);
        throw fetchError;
      }

      if (fileData.length === 0) {
        alert('ファイルが存在しません');
        return;
      }

       // 直接ファイルを削除
    const { error: storageError } = await supabaseClient
      .storage
      .from('post_files')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting file:', storageError.message);
      throw storageError;
    }

    alert('ファイルが削除されました');

      const updatedPosts = posts.map(post =>
        post.id === postId ? { ...post, file_url: '', isFileDeleted: true } : post
      );
      setPosts(updatedPosts);
      setFilteredPosts(updatedPosts);
    } catch (error) {
      console.error('ファイル削除中にエラーが発生しました:', error);
    }
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}` : null;
  };

  const embedUrl = posts.length > 0 ? getYouTubeEmbedUrl(posts[0]?.file_url || '') : null;

  const refreshPosts = () => {
    fetchPosts(currentPage, selectedCategory);
  };

  return (
    <div className="gap-4">
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className={styles.spinner}></div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md font-bold flex flex-col items-center pb-10 pt-20">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">カテゴリ</label>
            <select
              id="category"
              name="category"
              onChange={handleCategoryChange}
              className=" block w-1/2 pl-3 pr-10 py-2 mt-3 mb-3 ml-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-100"
            >
              <option value="">カテゴリ</option>
              <option value="">全てのカテゴリ</option> {/* 全てのカテゴリーを選択するオプションを追加 */}

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {selectedCategoryName !== null && selectedCategoryName !== '' ? (
              <p className="mt-2 ml-6 mr-3 text-sm font-bold text-gray-600">選択中のカテゴリ: <br/>{selectedCategoryName}</p>
            ) : (
              <p className="mt-2 ml-6 mr-3 text-sm font-bold text-gray-600">選択中のカテゴリ: <br/>ALL</p>
            )}
          </div>
          {filteredPosts.map(post => (
            <div key={post.id} className={`bg-white shadow-md rounded p-4 ${post.hidden ? 'text-gray-400' : 'text-black'} w-full sm:w-auto`}
              ref={(el) => { postRefs.current[post.id] = el; }}>
              <h2 className="text-xl text-center text-gray-700 font-bold mb-6">{post.title}</h2>
              <div className="flex justify-center">
                {post.file_url && !post.hidden && !post.isFileDeleted && (
                  getYouTubeEmbedUrl(post.file_url) ? (
                    <div className="responsive-iframe">
                      <iframe
                        width="384"
                        height="216"
                        src={getYouTubeEmbedUrl(post.file_url) || undefined}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <video controls className="mt-2 max-w-full h-auto">
                      <source src={post.file_url} type="video/mp4" />
                      お使いのブラウザではビデオのプレビューがサポートされていません。
                    </video>
                  )
                )}
                {post.hidden && <p className="text-xs font-bold">画像は非表示に設定されています</p>}
                {post.isFileDeleted && <p className="text-xs font-bold">ファイルが削除されました</p>}
              </div>
              <div className="flex justify-end space-x-4 text-xs font-bold mt-6">
              {!post.isFileDeleted && (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={post.hidden}
                    onChange={() => handleToggleHidden(post.id, post.hidden)}
                    className="form-checkbox"
                  />
                  <span>{post.hidden ? '非表示を解除する' : '非表示にする'}</span>
                </label>
              )}
                {post.created_by === session?.user.id && (
                  <>
                    {!isYouTubeUrl(post.file_url || '') && !post.isFileDeleted && (
                      <button onClick={() => handleDeleteFile(post.id, post.file_url || '')} className="bg-red-200 text-gray-700 text-xs py-1 px-2 rounded hover:bg-red-300">
                        ファイルを削除
                      </button>
                    )}
                    <button onClick={() => handleDelete(post.id)} className="bg-red-200 text-gray-700 text-xs py-1 px-2 rounded hover:bg-red-300">
                      投稿を削除
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => handleLike(post.id)}
                disabled={likedPosts.has(post.id) || post.created_by === session?.user.id}
                // className={`p-2 mt-4 ${likedPosts.has(post.id) || post.created_by === session?.user.id ? 'bg-gray-400' : 'bg-green-500'} text-white rounded-md flex items-center`}
                className={`p-2 mt-4 flex items-center`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 fill-current text-orange-500 transition-transform transform hover:scale-125"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18l-1-1.12C5.2 13.28 2 10.4 2 6.5 2 4.02 4.02 2 6.5 2c1.74 0 3.32.88 4.5 2.14C12.18 2.88 13.76 2 15.5 2 17.98 2 20 4.02 20 6.5c0 3.9-3.2 6.78-7 10.38L10 18z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-1">{post.iine}</span>
              </button>
              <p className="text-xs font-bold my-3 ml-2">投稿日時: {post.created_date} {post.created_time ? post.created_time.slice(0, 5) : ''}</p>
              <div className="flex items-center mb-3">
              {post.avatar_url && (
                <Image src={post.avatar_url} alt={`${post.nickname}のアバター`} width={50} height={50} className="rounded-full" />
              )}
              <p className="text-xs font-bold ml-2">投稿者: {post.nickname || 'Unknown'} さん</p>
            </div>
              <div>
                {post.comments && post.comments.map((comment: Comment, index: number) => (
                  <div key={index} className="flex justify-between items-center mb-3 bg-yellow-50 p-2 rounded shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div className="items-start">
                        {comment.avatar_url && (
                          <Image src={comment.avatar_url} alt={`${comment.nickname}のアバター`} width={30} height={30} className="rounded-full" />
                        )}
                          <p className="text-xs font-bold  mx-2 my-2">{comment.nickname}: </p>
                        <p className="text-sm font-bold  mx-2 my-2">{comment.comment}</p>
                        <p className="text-xs font-bold  mx-2 my-2 text-gray-400">{new Date(comment.created_at).toLocaleString()}</p>
                        {comment.user_id === session?.user.id && (
                          <button
                            onClick={() => handleCommentDelete(post.id, index)}
                            className="text-red-500 font-bold text-xs ml-4 mx-2 my-2 sm:mt-0 sm:ml-2"
                          >
                            削除
                          </button>
                        )}
                    </div>
                    </div>
                  </div>
                ))}
              </div>
              <textarea
                value={comment[post.id] || ''}
                onChange={e => setComment({ ...comment, [post.id]: e.target.value })}
                placeholder="コメントを記入してください"
                className="border rounded p-2 w-full resize-y bg-gray-100"
                rows={3}
              />
              <button onClick={() => handleCommentSubmit(post.id)} className="bg-blue-100 text-gray-800 font-bold text-xs py-1 px-2 rounded mt-2 mb-20">
                コメントを投稿
              </button>
            </div>
          ))}
          <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-md flex justify-center text-xs"> {/* fixedを追加して固定表示 */}
            <ul className="flex space-x-2 mt-3">
              {[...Array(totalPages)].map((_, i) => (
                <li key={i}>
                  <button
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-3 py-1 mb-2 rounded ${currentPage === i + 1 ? 'bg-gray-400 text-white' : 'bg-gray-200'}`}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
};

export default PostList;
