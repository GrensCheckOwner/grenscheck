
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../../supabase';

export default function InloggenScreen() {
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [laden, setLaden] = useState(false);
  const [melding, setMelding] = useState('');

  async function inloggen() {
    setMelding('');

    if (!email.trim() || !wachtwoord) {
      setMelding('Vul je e-mailadres en wachtwoord in.');
      return;
    }

    setLaden(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: wachtwoord,
      });

      if (error) {
        setMelding('Inloggen mislukt: ' + error.message);
        return;
      }

      router.replace('/(tabs)');
    } catch (error) {
      setMelding(
        'Er ging iets mis: ' +
        (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setLaden(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>GRENSCHECK</Text>

        <Text style={styles.title}>Welkom terug</Text>

        <Text style={styles.subtitle}>
          Log in op je GrensCheck-account.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="E-mailadres"
          placeholderTextColor="#8297B1"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Wachtwoord"
          placeholderTextColor="#8297B1"
          value={wachtwoord}
          onChangeText={setWachtwoord}
          secureTextEntry
        />

        {melding !== '' && (
          <Text style={styles.melding}>{melding}</Text>
        )}

        <Pressable
          style={[styles.button, laden && styles.buttonDisabled]}
          onPress={inloggen}
          disabled={laden}
        >
          <Text style={styles.buttonText}>
            {laden ? 'Bezig...' : 'Inloggen'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.linkButton}
          onPress={() => router.push('/registreren')}
        >
          <Text style={styles.linkText}>
            Nog geen account? Account aanmaken
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071426',
    padding: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 440,
  },
  logo: {
    color: '#F2C96D',
    fontSize: 23,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#AFC0D5',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 25,
  },
  input: {
    backgroundColor: '#142943',
    color: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#34516F',
  },
  button: {
    backgroundColor: '#D5A943',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#071426',
    fontSize: 16,
    fontWeight: 'bold',
  },
  melding: {
    color: '#F2C96D',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  linkButton: {
    marginTop: 22,
    alignItems: 'center',
  },
  linkText: {
    color: '#F2C96D',
    fontSize: 14,
  },
});
