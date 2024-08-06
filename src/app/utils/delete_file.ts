import supabase from '../../../lib/supabase';


const delete_file = async (filePath: string) => {
  try {
    const { error } = await supabase
      .storage
      .from('post_files')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error.message);
      throw error;
    }

    console.log('File deleted successfully');
  } catch (error) {
    console.error('ファイル削除中にエラーが発生しました:', error);
  }
};

export default delete_file;
