
import { NativeTabs } from 'expo-router/native-tabs';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { supabase } from '../../supabase';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [isBeheerder, setIsBeheerder] = useState(false);

  useEffect(() => {
    let actief = true;

    async function controleerBeheerder() {
      const { data: sessieData } = await supabase.auth.getSession();
      const gebruiker = sessieData.session?.user;

      if (!gebruiker) {
        if (actief) setIsBeheerder(false);
        return;
      }

      const { data, error } = await supabase
        .from('app_admins')
        .select('user_id')
        .eq('user_id', gebruiker.id)
        .maybeSingle();

      if (actief) {
        setIsBeheerder(!error && !!data);
      }
    }

    void controleerBeheerder();

    const { data: listener } = supabase.auth.onAuthStateChange(
      () => {
        setTimeout(() => {
          void controleerBeheerder();
        }, 0);
      }
    );

    return () => {
      actief = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Kaart</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      {isBeheerder && (
       <NativeTabs.Trigger name="beheer">
  <NativeTabs.Trigger.Label>Beheer</NativeTabs.Trigger.Label>
  <NativeTabs.Trigger.Icon
    sf="shield.lefthalf.filled"
    renderingMode="template"
  />
</NativeTabs.Trigger>
      )}
    </NativeTabs>
  );
}
