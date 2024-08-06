"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from '../styles/Spinner.module.css';

interface Category {
  id: string;
  name: string;
}

const CategoryPage: React.FC = () => {
  const supabaseClient = createClientComponentClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabaseClient.from('category').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data);
    }
    setIsLoading(false);
  }, [supabaseClient]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    const { error } = await supabaseClient.from('category').insert({ name: newCategoryName });

    if (error) {
      console.error('Error adding category:', error);
    } else {
      setNewCategoryName('');
      fetchCategories();
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;

    const { error } = await supabaseClient.from('category').update({ name: editingCategory.name }).eq('id', editingCategory.id);

    if (error) {
      console.error('Error updating category:', error);
    } else {
      setEditingCategory(null);
      fetchCategories();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabaseClient.from('category').delete().eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
    } else {
      fetchCategories();
    }
  };

  return (
    <div className="w-full  max-w-3xl mx-auto pt-40">
      <h1 className="text-2xl text-center font-bold mb-6">カテゴリ管理</h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className={styles.spinner}></div>
        </div>
      ) : (
        <>
          <div className="mx-6 mb-6">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="新しいカテゴリ名"
              title="新しいカテゴリ名"
              className="p-2 border rounded w-full"
              aria-label="新しいカテゴリ名"
            />
            <button onClick={handleAddCategory} className="p-2 bg-green-200 text-gray-900 font-bold rounded hover:bg-green-300 mt-3">
              カテゴリ追加
            </button>
          </div>

          <ul className="space-y-4 mx-6">
            {categories.map((category) => (
              <li key={category.id} className="flex justify-between flex-wrap items-center bg-white p-4 pb-10 rounded shadow">
                {editingCategory?.id === category.id ? (
                  <>
                    <input
                      type="text"
                      title="カテゴリ名"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      className="p-2 border rounded w-full mb-2"
                    />
                    <div  className="flex space-x-2 w-full">
                      <button onClick={handleEditCategory} className="ml-2 p-2 bg-blue-500 text-white rounded text-xs w-full">
                        更新
                      </button>
                      <button onClick={() => setEditingCategory(null)} className="ml-2 p-2 bg-gray-500 text-white rounded text-xs w-full">
                        キャンセル
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="w-full mb-2">{category.name}</span>
                    <div  className="flex space-x-2 w-full">
                      <button onClick={() => setEditingCategory(category)} className="p-2 bg-blue-200 text-gray-900 font-bold rounded hover:bg-blue-300 w-full">
                        編集
                      </button>
                      <button onClick={() => handleDeleteCategory(category.id)} className="p-2 bg-red-200 text-gray-900 font-bold rounded hover:bg-red-300 w-full">
                        削除
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default CategoryPage;
