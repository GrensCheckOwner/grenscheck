
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../../supabase';

export default function RegistrerenScreen() {
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [herhaalWachtwoord, setHerhaalWachtwoord] = useState('');
  const [laden, setLaden] = useState(false);
  const [melding, setMelding] = useState('');

  async function registreer() {
    setMelding('');

    if (!email.trim() || !wachtwoord || !herhaalWachtwoord) {
      setMelding('Vul alle velden in.');
      return;
    }

    if (wachtwoord.length < 6) {
      setMelding('Gebruik minimaal 6 tekens voor je wachtwoord.');
      return;
    }

    if (wachtwoord !== herhaalWachtwoord) {
      setMelding('De wachtwoorden komen niet overeen.');
      return;
    }

    setLaden(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: wachtwoord,
      });

      if (error) {
        setMelding('Registreren mislukt: ' + error.message);
        return;
      }

      setMelding(
        'Gelukt! Controleer je e-mail en klik op de verificatielink.'
      );
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
      <Text style={styles.logo}>GRENSCHECK</Text>

      <Text style={styles.title}>Account aanmaken</Text>

      <Text style={styles.subtitle}>
        Maak een account aan om mee te doen aan GrensCheck.
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

      <TextInput
        style={styles.input}
        placeholder="Wachtwoord herhalen"
        placeholderTextColor="#8297B1"
        value={herhaalWachtwoord}
        onChangeText={setHerhaalWachtwoord}
        secureTextEntry
      />

      {melding !== '' && (
        <Text style={styles.melding}>
          {melding}
        </Text>
      )}

      <Pressable
        style={[styles.button, laden && styles.buttonDisabled]}
        onPress={registreer}
        disabled={laden}
      >
        <Text style={styles.buttonText}>
          {laden ? 'Bezig met registreren...' : 'Account aanmaken'}
        </Text>
      </Pressable>

      <Text style={styles.privacy}>
        Je ontvangt een e-mail met een verificatielink.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071426',
    padding: 25,
    justifyContent: 'center',
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
  privacy: {
    color: '#AFC0D5',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18,
  },
});
