import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Category {
  id: string;
  name: string;
}

const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const supabaseClient = createClientComponentClient();

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabaseClient
      .from('category')
      .select('*');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data);
    }
  }, [supabaseClient]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return categories;
};

export default useCategories;
