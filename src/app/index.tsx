import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../../supabase';

export default function IndexScreen() {
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    async function controleerInlog() {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/inloggen');
      }

      setLaden(false);
    }

    controleerInlog();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#071426',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ActivityIndicator size="large" color="#D5A943" />
    </View>
  );
}