
import * as ExpoLocation from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../../supabase';
import MeldingKaart from '../components/melding-kaart';

export default function MeldingScreen() {
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const versturenBezigRef = useRef(false);

  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 51.5,
    longitude: 5.7,
  });

  const [toelichting, setToelichting] = useState('');
  const [versturenBezig, setVersturenBezig] = useState(false);
  const [limietBericht, setLimietBericht] = useState('');

  function toonBericht(titel: string, bericht: string) {
    if (Platform.OS === 'web') {
      window.alert(`${titel}\n\n${bericht}`);
    } else {
      Alert.alert(titel, bericht);
    }
  }

  useEffect(() => {
    async function haalLocatieOp() {
      try {
        const { status } =
          await ExpoLocation.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          toonBericht(
            'Locatie niet beschikbaar',
            'Je kunt zelf een locatie op de kaart kiezen.'
          );
          return;
        }

        const huidigeLocatie =
          await ExpoLocation.getCurrentPositionAsync({});

        setSelectedLocation({
          latitude: huidigeLocatie.coords.latitude,
          longitude: huidigeLocatie.coords.longitude,
        });
      } catch {
        toonBericht(
          'Locatie niet beschikbaar',
          'Je kunt zelf een locatie op de kaart kiezen.'
        );
      }
    }

    void haalLocatieOp();
  }, []);

  async function verstuurMelding() {
    if (versturenBezigRef.current) return;

    if (!toelichting.trim()) {
      toonBericht(
        'Toelichting ontbreekt',
        'Vul eerst een beschrijving van het verkeersgevaar in.'
      );
      return;
    }

    versturenBezigRef.current = true;
    setVersturenBezig(true);
    setLimietBericht('');

    try {
      const { error } = await supabase
        .from('verkeersmeldingen')
        .insert({
          titel: 'Verkeersgevaar',
          toelichting: toelichting.trim(),
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          type: 'verkeershinder',
          goedgekeurd: false,
        });

      if (error) {
        if (
          error.message.includes(
            'Je hebt al een melding verstuurd'
          )
        ) {
          setLimietBericht(
            'Je hebt onlangs al een melding verstuurd. Je kunt na 10 minuten opnieuw een verkeersgevaar melden.'
          );
          return;
        }

        toonBericht('Versturen mislukt', error.message);
        return;
      }

      setToelichting('');

      if (Platform.OS === 'web') {
        window.alert(
          'Melding ontvangen\n\nJe verkeersgevaarmelding is succesvol ontvangen en wacht op controle.'
        );
        router.replace('/(tabs)');
      } else {
        Alert.alert(
          'Melding ontvangen',
          'Je verkeersgevaarmelding is succesvol ontvangen en wacht op controle.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      }
    } catch {
      toonBericht(
        'Er ging iets mis',
        'De melding kon niet worden verstuurd. Probeer het later opnieuw.'
      );
    } finally {
      versturenBezigRef.current = false;
      setVersturenBezig(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.logo}>GRENSCHECK</Text>

        <Text style={styles.title}>Melding doorgeven</Text>

        <Text style={styles.subtitle}>
          Verkeersgevaar melden
        </Text>

        <Text style={styles.label}>
          Kies een locatie op de kaart
        </Text>

        <MeldingKaart
          location={selectedLocation}
          onLocationChange={setSelectedLocation}
        />

        <Text style={styles.label}>Toelichting</Text>

        <TextInput
          onFocus={() => {
            setTimeout(() => {
              scrollRef.current?.scrollTo({
                y: 450,
                animated: true,
              });
            }, 300);
          }}
          style={styles.input}
          placeholder="Beschrijf het algemene verkeersgevaar..."
          placeholderTextColor="#AFC0D5"
          value={toelichting}
          onChangeText={(tekst) => {
            setToelichting(tekst);
            setLimietBericht('');
          }}
          multiline
          textAlignVertical="top"
          blurOnSubmit={false}
          editable={!versturenBezig}
        />

        {limietBericht !== '' && (
          <View style={styles.warning}>
            <Text style={styles.warningTitle}>
              Even wachten
            </Text>
            <Text style={styles.warningText}>
              {limietBericht}
            </Text>
          </View>
        )}

        <Pressable
          style={[
            styles.button,
            versturenBezig && styles.buttonDisabled,
          ]}
          onPress={verstuurMelding}
          disabled={versturenBezig}
        >
          <Text style={styles.buttonText}>
            {versturenBezig
              ? 'Bezig met versturen...'
              : 'Verkeersgevaar melden'}
          </Text>
        </Pressable>

        <Text style={styles.privacy}>
          Je melding wordt eerst gecontroleerd voordat deze op de kaart verschijnt.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071426',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 60,
    flexGrow: 1,
  },
  logo: {
    color: '#F2C96D',
    fontSize: 22,
    fontWeight: 'bold',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subtitle: {
    color: '#AFC0D5',
    marginTop: 8,
    marginBottom: 25,
  },
  label: {
    color: '#F2C96D',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#142943',
    color: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    height: 110,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#34516F',
  },
  warning: {
    backgroundColor: '#492B25',
    borderColor: '#D58A54',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 15,
  },
  warningTitle: {
    color: '#FFD29B',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 21,
  },
  button: {
    backgroundColor: '#D5A943',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 22,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#071426',
    fontSize: 16,
    fontWeight: 'bold',
  },
  privacy: {
    color: '#AFC0D5',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 15,
  },
});
