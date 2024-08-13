import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Session } from '@supabase/supabase-js';
import useCategories from '../hooks/useCategories';

interface FileUploadWithPostProps {
  session: Session | null;
}

const FileUploadWithPost: React.FC<FileUploadWithPostProps> = ({ session }) => {
  const supabaseClient = createClientComponentClient();

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string>('');
  const [fileType, setFileType] = useState<'video' | 'youtube' | ''>('');
  const [youtubeURL, setYoutubeURL] = useState('');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);
  // Initializing category with an empty string instead of null
  const [category, setCategory] = useState<string>('');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);

  const categories = useCategories();

  const MAX_FILE_SIZE_MB = 50; // 50MB
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const SUPPORTED_VIDEO_FORMATS = ['mp4', 'mov']; // 対応する動画形式

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategoryId = event.target.value;
    setCategory(selectedCategoryId);
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
    setSelectedCategoryName(selectedCategory ? selectedCategory.name : null);
  };


  const clearMessages = () => {
    setUploadError('');
    setUploadSuccess('');
    setPostError(null);
    setPostSuccess(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {

      setUploadError('');  // 新しいファイルが選択されたときにエラーメッセージをクリア

      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

      if (!fileExtension || !SUPPORTED_VIDEO_FORMATS.includes(fileExtension)) {
        setUploadError(`サポートされていないファイル形式です。対応形式: ${SUPPORTED_VIDEO_FORMATS.join(', ')}`);
        setFile(null);
        setFilePreview(null);
        return;
      }

      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setUploadError(`ファイルサイズは最大 ${MAX_FILE_SIZE_MB}MB までです。`);
        setFile(null);
        setFilePreview(null);
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleYoutubeURLChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeURL(event.target.value);
  };

  const handleFileTypeChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    // ファイル削除のトランザクション処理
    if (filePreview && fileType === 'video') {
      const fileName = filePreview.split('/').pop()?.split('?')[0];
      if (fileName) {
        try {
          await supabaseClient
          .storage
          .from('post_files')
          .remove([`public/${fileName}`]);

        } catch (error) {
          setUploadError('ファイルの削除に失敗しました。');
          console.error('File deletion error:', error);
        }
      }
    }

    setFileType(event.target.value as 'video' | 'youtube');
    setFilePreview(null);
    setYoutubeURL('');
    setFile(null);
    clearMessages();
    setTitle('');
    setComment('');
    setUploadSuccess('');
    setUploadError('');
    setIsLoading(false); // ファイルタイプが変更されたときにローディングステートをリセット

    // ファイル選択をクリアするために、input要素の値をリセット
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        clearMessages();

    try {
      if (file && fileType === 'video') {
        const uniqueFileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabaseClient.storage
          .from('post_files')
          .upload(`public/${uniqueFileName}`, file);

        if (error) {
          throw new Error('ファイルのアップロードに失敗しました');
        }

        const timestamp = new Date().toISOString();
        const fileURL = `https://nywntdbboymxrnrulmif.supabase.co/storage/v1/object/public/post_files/public/${uniqueFileName}?t=${encodeURIComponent(timestamp)}`;
        console.log('公開URL:', fileURL);

        setUploadSuccess('動画のアップロードに成功しました');
        setIsUploaded(true);  // アップロード成功後に更新
        setFilePreview(fileURL);

      } else if (fileType === 'youtube' && youtubeURL) {

        const isValidYoutubeURL = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.test(youtubeURL);
        if (!isValidYoutubeURL) {
          setUploadError('URLがYouTubeの形式ではありません');
          setIsLoading(false);
          return;
        }

        const embedUrl = youtubeURL.replace("watch?v=", "embed/");

        setUploadSuccess('YouTube動画のURLが設定されました');
        setIsUploaded(true);  // アップロード成功後に更新
        setFilePreview(embedUrl);
      }
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!session || !filePreview) {
      setPostError('ユーザーがログインしていないか、ファイルがアップロードされていません。');
      return;
    }

    if (!isUploaded) {
      alert('アップロードボタンを押してください');
      return;
    }

    if (!title) {
      setPostError('タイトルは必須です。');
      return;
    }

    if (!category) {
      setPostError('カテゴリーを選択してください。');
      return;
    }

    // 日本標準時（JST）で日時を取得
    const now = new Date();
    const jstDate = now.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const jstTime = now.toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour12: false });

    // 投稿データを作成
    const postData = {
      title,
      comment,
      comments: [],
      file_url: filePreview,
      created_by: session.user.id,
      created_date: jstDate.split('/').join('-'),
      created_time: jstTime,
      category_id: category
    };

    try {
      const { error } = await supabaseClient
        .from('post')
        .insert(postData);

      if (error) {
        throw error;
      }

      setPostSuccess('投稿が成功しました！');
    } catch (error: any) {
      setPostError('投稿に失敗しました: ' + error.message);
    }
  };

   // 変更箇所：動画IDを抽出する関数を追加
  const extractEmbedId = (url: string): string => {
    const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return videoIdMatch ? videoIdMatch[1] : '';
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <h1 className="text-2xl text-center font-bold mb-6">動画を投稿する</h1>
        <>
          <form onSubmit={handleUploadSubmit}>
            <div className="mb-6">
              <label htmlFor="fileType" className="block text-sm font-bold text-black mb-2 pt-11 text-left">ファイルタイプを選択:</label>
              <select
                id="fileType"
                value={fileType}
                onChange={handleFileTypeChange}
                className="mt-4 p-2 w-full border rounded bg-gray-100"
              >
                <option value="">選択してください</option>
                <option value="video">動画</option>
                <option value="youtube">YouTubeリンク</option>
              </select>
            </div>

            {fileType === 'video' ? (
              <>
                <label htmlFor="file" className="block text-sm font-bold text-black mb-2 text-left">ファイルを選択:</label>
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  className="mt-4 p-2 w-full border rounded bg-gray-100"
                  accept="video/*"
                />
              </>
            ) : fileType === 'youtube' ? (
              <>
                <label htmlFor="youtube-url" className="block text-sm font-bold text-black mb-2 text-left">YouTube動画のURLを入力:</label>
                <input
                  type="url"
                  id="youtube-url"
                  value={youtubeURL}
                  onChange={handleYoutubeURLChange}
                  className="mt-4 p-2 w-full border rounded bg-gray-100"
                  placeholder="https://www.youtube.com/watch?v=example"
                />
              </>
            ) : null}

              {filePreview && (
                <div className="mt-4 text-center">
                  <p className="text-sm font-bold text-black mb-4">プレビュー</p>
                  {fileType === 'video' ? (
                    <video controls width={600} className="mt-2 max-w-full h-auto mx-auto">
                      <source src={filePreview} type="video/mp4" />
                      動画の再生がサポートされていません。
                    </video>
                  ) : fileType === 'youtube' ? (
                  <div className="flex justify-center">
                    <iframe
                      width="560"
                      height="315"
                      src={`https://www.youtube.com/embed/${extractEmbedId(youtubeURL)}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                  </div>
                  ): null}
                </div>
              )}

            <div className="flex align-items: center justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className={`p-2 w-1/2 mt-4 bg-green-300 text-gray-900 font-bold rounded mx-auto ${isLoading ? 'bg-gray-500' : 'hover:bg-green-300'}`}
              >
                {isLoading ? 'アップロードまたはURL設定中...' : 'アップロードまたはURL設定'}
              </button>
            </div>
            <div className='my-12'>
              {uploadError && <p className="text-red-500">{uploadError}</p>}
              {uploadSuccess && <p className="text-green-500">{uploadSuccess}</p>}
            </div>
          </form>

          <form onSubmit={handlePostSubmit} className="mt-8">
            <label htmlFor="category" className="block text-sm font-bold text-green mb-3 text-left mt-4">カテゴリ: </label>
            <select
              id="category"
              value={category ?? ''}
              onChange={handleCategoryChange}
              className="mt-1 block w-full pl-3 pr-10 mb-5 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-100"
            >
              <option value="">カテゴリを選択</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {selectedCategoryName && (
            <p className="mt-2 text-sm text-gray-600">選択されたカテゴリ: {selectedCategoryName}</p>
            )}

            <label htmlFor="title" className="block text-sm font-bold text-green mt-10 mb-2 text-left">タイトル:</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-2 w-full border rounded mt-3 bg-gray-100"
              required
            />

            <div className="flex align-items: center justify-center">
              <button
                type="submit"
                className="p-2 w-1/2 mt-10 bg-green-300 text-gray-900 font-bold rounded hover:bg-green-300"
                disabled={isLoading}
              >
                投稿
              </button>
            </div>

            <div className='my-12'>
              {postError && <p className="text-red-500">{postError}</p>}
              {postSuccess && <p className="text-green-500">{postSuccess}</p>}
            </div>
          </form>
        </>
    </div>
  );
};

export default FileUploadWithPost;
