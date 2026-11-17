
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import { supabaseTest } from './supabase.test';

const SUPABASE_URL = 'https://ulzbfkjxnibnjzrwvcyt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PmBnbq4mRZy9t9ZF3wnvwQ_V5i9gYQ9';

const webStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return Promise.resolve(null);
    return Promise.resolve(window.localStorage.getItem(key));
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

const supabaseProductie = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      storage: Platform.OS === 'web' ? webStorage : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export const supabase =
  process.env.EXPO_PUBLIC_APP_ENV === 'test'
    ? supabaseTest
    : supabaseProductie;
