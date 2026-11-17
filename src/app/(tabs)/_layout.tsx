import AppTabs from '@/components/app-tabs.native';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { supabase } from '../../../supabase';

export default function TabsLayout() {
  const [laden, setLaden] = useState(true);
  const [ingelogd, setIngelogd] = useState(false);

  useEffect(() => {
    async function controleerSessie() {
      const { data } = await supabase.auth.getSession();
      setIngelogd(!!data.session);
      setLaden(false);
    }

    controleerSessie();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIngelogd(!!session);
        setLaden(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (laden) {
    return (
      <View style={{ flex: 1, backgroundColor: '#071426', justifyContent: 'center' }}>
        <ActivityIndicator color="#D5A943" size="large" />
      </View>
    );
  }

  if (!ingelogd) {
    return <Redirect href="/inloggen" />;
  }

  return <AppTabs />;
}