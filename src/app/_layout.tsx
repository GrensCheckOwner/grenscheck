
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, View } from 'react-native';
import { supabase } from '../../supabase';

const VIER_UUR = 4 * 60 * 60 * 1000;
const ACTIVITEIT_KEY = 'grenscheck_laatste_activiteit';

export default function RootLayout() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const laatsteActiviteit = useRef<number | null>(null);
  const actief = useRef(true);

  function wisTimer() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  async function uitloggen() {
    wisTimer();
    laatsteActiviteit.current = null;
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(ACTIVITEIT_KEY);
  }

  function planUitloggen(tijd: number) {
    wisTimer();

    const resterendeTijd = VIER_UUR - (Date.now() - tijd);

    if (resterendeTijd <= 0) {
      void uitloggen();
      return;
    }

    timer.current = setTimeout(() => {
      const laatste = laatsteActiviteit.current ?? tijd;

      if (Date.now() - laatste >= VIER_UUR) {
        void uitloggen();
      } else {
        planUitloggen(laatste);
      }
    }, resterendeTijd);
  }

  async function controleerTijd() {
    const { data } = await supabase.auth.getSession();

    if (!actief.current) return;

    if (!data.session) {
      wisTimer();
      laatsteActiviteit.current = null;
      return;
    }

    const opgeslagenTijd =
      await AsyncStorage.getItem(ACTIVITEIT_KEY);

    if (!actief.current) return;

    let tijd = Number(opgeslagenTijd);

    if (!opgeslagenTijd || !Number.isFinite(tijd) || tijd <= 0) {
      tijd = Date.now();
      await AsyncStorage.setItem(ACTIVITEIT_KEY, String(tijd));
    }

    laatsteActiviteit.current = tijd;
    planUitloggen(tijd);
  }

  async function registreerActiviteit() {
    const { data } = await supabase.auth.getSession();

    if (!actief.current || !data.session) return;

    const tijd = Date.now();
    laatsteActiviteit.current = tijd;

    await AsyncStorage.setItem(ACTIVITEIT_KEY, String(tijd));

    if (actief.current) {
      planUitloggen(tijd);
    }
  }

  useEffect(() => {
    actief.current = true;

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const tijd = Date.now();
          laatsteActiviteit.current = tijd;

          void AsyncStorage.setItem(
            ACTIVITEIT_KEY,
            String(tijd)
          ).then(() => {
            if (actief.current) planUitloggen(tijd);
          });
        }

        if (event === 'SIGNED_OUT') {
          wisTimer();
          laatsteActiviteit.current = null;
          void AsyncStorage.removeItem(ACTIVITEIT_KEY);
        }
      }
    );

    void controleerTijd();

    const appListener = AppState.addEventListener(
      'change',
      state => {
        if (state === 'active') {
          void controleerTijd();
        }
      }
    );

    return () => {
      actief.current = false;
      wisTimer();
      listener.subscription.unsubscribe();
      appListener.remove();
    };
  }, []);

  return (
    <View
      style={{ flex: 1 }}
      onTouchStart={() => {
        void registreerActiviteit();
      }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
