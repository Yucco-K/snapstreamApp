import supabase from '../../../lib/supabase';

const listFilesInBucket = async (bucketName: string) => {
  try {
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      console.error('Error listing files:', error.message);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};

const deleteFileFromStorage = async (bucketName: string, filePath: string) => {
  try {
    console.log('Starting file deletion...');

    console.log('Listing files before deletion...');
    const filesBeforeDeletion = await listFilesInBucket(bucketName);
    console.log('File list before deletion:', filesBeforeDeletion);

    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error.message);
      return;
    }

    console.log('File deleted successfully:', data);

    console.log('Listing files after deletion...');
    const filesAfterDeletion = await listFilesInBucket(bucketName);
    console.log('File list after deletion:', filesAfterDeletion);

    console.log('File deletion process completed.');
  } catch (error) {
    console.error('Error:', error);
  }
};

export { deleteFileFromStorage, listFilesInBucket };
