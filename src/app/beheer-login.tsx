
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../supabase';

export default function BeheerLogin() {
      useFocusEffect(
    useCallback(() => {
      let actief = true;

      async function controleerInlog() {
        const { data: sessieData } = await supabase.auth.getSession();

        if (!actief || !sessieData.session) {
          return;
        }

        const { data, error } = await supabase
          .from('app_admins')
          .select('user_id')
          .maybeSingle();

        if (!actief) return;

        if (!error && data) {
          router.replace('/beheer');
        }
      }

      controleerInlog();

      return () => {
        actief = false;
      };
    }, [])
  );
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [laden, setLaden] = useState(false);

  async function inloggen() {
    if (!email.trim() || !wachtwoord) {
      Alert.alert('Gegevens ontbreken', 'Vul je e-mailadres en wachtwoord in.');
      return;
    }

    setLaden(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: wachtwoord,
    });

    setLaden(false);

    if (error) {
      Alert.alert('Inloggen mislukt', error.message);
      return;
    }

    const { data, error: beheerFout } = await supabase
      .from('app_admins')
      .select('user_id')
      .maybeSingle();

    if (beheerFout || !data) {
      await supabase.auth.signOut();
      Alert.alert('Geen toegang', 'Dit account heeft geen beheerdersrechten.');
      return;
    }

    router.replace('/beheer');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GrensCheck</Text>
      <Text style={styles.subtitle}>Beheerdersomgeving</Text>

      <TextInput
        style={styles.input}
        placeholder="E-mailadres"
        placeholderTextColor="#8B9AAF"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Wachtwoord"
        placeholderTextColor="#8B9AAF"
        value={wachtwoord}
        onChangeText={setWachtwoord}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={inloggen}
        disabled={laden}
      >
        <Text style={styles.buttonText}>
          {laden ? 'Even wachten...' : 'Inloggen'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Alleen toegankelijk voor de beheerder.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071426',
    justifyContent: 'center',
    padding: 28,
  },
  title: {
    color: '#D5A943',
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 35,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#14263D',
    color: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#D5A943',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#071426',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    color: '#8B9AAF',
    textAlign: 'center',
    marginTop: 25,
  },
});
