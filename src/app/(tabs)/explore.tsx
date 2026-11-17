
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../../../supabase';

type Verkeersmelding = {
  id: string;
  titel: string;
  toelichting: string;
  latitude: number;
  longitude: number;
  aantalBevestigingen: number;
  bevestigdDoorMij: boolean;
};

function afstandInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const straal = 6371000;
  const verschilLat = ((lat2 - lat1) * Math.PI) / 180;
  const verschilLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(verschilLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(verschilLon / 2) ** 2;

  return (
    straal *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

export default function MapScreen() {
  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [meldingen, setMeldingen] =
    useState<Verkeersmelding[]>([]);

  const [geselecteerdeMelding, setGeselecteerdeMelding] =
    useState<Verkeersmelding | null>(null);

  const [bezigMetBevestigen, setBezigMetBevestigen] =
    useState(false);

  const meldingenRef = useRef<Verkeersmelding[]>([]);
  const genegeerdeMeldingen = useRef(new Set<string>());
  const controleBezig = useRef(false);
  const popUpOpen = useRef(false);

  useEffect(() => {
    meldingenRef.current = meldingen;
  }, [meldingen]);

  async function laadMeldingen() {
    const { data, error } = await supabase
      .from('verkeersmeldingen')
      .select('id, titel, toelichting, latitude, longitude, verloopt_op, laatst_bevestigd_op')
      .eq('goedgekeurd', true)
      .gt('verloopt_op', new Date().toISOString());

    if (error) {
      console.log('Meldingen laden mislukt:', error.message);
      return;
    }

    const { data: bevestigingen, error: bevestigingFout } =
      await supabase
        .from('verkeersbevestigingen')
        .select('melding_id, user_id');

    if (bevestigingFout) {
      console.log(
        'Bevestigingen laden mislukt:',
        bevestigingFout.message
      );
    }

    const { data: sessieData } =
      await supabase.auth.getSession();

    const userId = sessieData.session?.user.id;

    const nieuweMeldingen: Verkeersmelding[] =
      (data ?? []).map((melding) => {
        const bijbehorendeBevestigingen =
          (bevestigingen ?? []).filter(
            (bevestiging) =>
              bevestiging.melding_id === melding.id
          );

        return {
          ...melding,
          aantalBevestigingen:
            bijbehorendeBevestigingen.length,
          bevestigdDoorMij: bijbehorendeBevestigingen.some(
            (bevestiging) => bevestiging.user_id === userId
          ),
        };
      });

    setMeldingen(nieuweMeldingen);

    setGeselecteerdeMelding((huidige) => {
      if (!huidige) return null;

      return (
        nieuweMeldingen.find(
          (melding) => melding.id === huidige.id
        ) ?? null
      );
    });
  }

  useEffect(() => {
    laadMeldingen();

    const interval = setInterval(() => {
      laadMeldingen();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  async function bevestigMelding(melding: Verkeersmelding) {
    if (bezigMetBevestigen) return;

    setBezigMetBevestigen(true);

    try {
      const { data: sessieData } =
        await supabase.auth.getSession();

      if (!sessieData.session) {
        Alert.alert(
          'Inloggen vereist',
          'Je moet ingelogd zijn om een verkeersmelding te bevestigen.',
          [
            { text: 'Annuleren', style: 'cancel' },
            {
              text: 'Inloggen',
              onPress: () => router.push('/inloggen'),
            },
          ]
        );
        return;
      }

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Locatie nodig',
          'Geef toestemming om je locatie te gebruiken.'
        );
        return;
      }

      const actueleLocatie =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const { data, error } = await supabase.rpc(
        'bevestig_verkeersmelding',
        {
          p_melding_id: melding.id,
          p_latitude: actueleLocatie.coords.latitude,
          p_longitude: actueleLocatie.coords.longitude,
        }
      );

      if (error) {
        Alert.alert('Bevestigen mislukt', error.message);
        return;
      }

      const aantal = Number(data);

      setMeldingen((huidige) =>
        huidige.map((item) =>
          item.id === melding.id
            ? {
                ...item,
                aantalBevestigingen: aantal,
                bevestigdDoorMij: true,
              }
            : item
        )
      );

      setGeselecteerdeMelding((huidige) =>
        huidige?.id === melding.id
          ? {
              ...huidige,
              aantalBevestigingen: aantal,
              bevestigdDoorMij: true,
            }
          : huidige
      );

      Alert.alert(
        'Bedankt voor je bevestiging!',
        'Je hebt deze controle bevestigd.'
      );
    } catch {
      Alert.alert(
        'Fout',
        'Je locatie kon niet worden opgehaald. Probeer het opnieuw.'
      );
    } finally {
      setBezigMetBevestigen(false);
    }
  }

  // Controleer iedere 30 seconden of er een melding
  // binnen 2 kilometer van de gebruiker is.
  useEffect(() => {
    let actief = true;
    let interval: ReturnType<typeof setInterval> | undefined;

    async function controleerNabijeMeldingen() {
      if (controleBezig.current || popUpOpen.current) return;

      controleBezig.current = true;

      try {
        const actueleLocatie =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

        if (!actief) return;

        setLocation(actueleLocatie);

        const nabijeMelding = meldingenRef.current.find(
          (melding) => {
            if (melding.bevestigdDoorMij) return false;

            if (
              genegeerdeMeldingen.current.has(melding.id)
            ) {
              return false;
            }

            const afstand = afstandInMeters(
              actueleLocatie.coords.latitude,
              actueleLocatie.coords.longitude,
              melding.latitude,
              melding.longitude
            );

            return afstand <= 2000;
          }
        );

        if (nabijeMelding && actief) {
          popUpOpen.current = true;

          Alert.alert(
            'Verkeersmelding in de buurt!',
            `${nabijeMelding.titel}\n\n${nabijeMelding.toelichting}\n\nJe bent binnen 2 kilometer van deze melding. Kun je deze bevestigen?`,
            [
              {
                text: 'Negeren',
                style: 'cancel',
                onPress: () => {
                  genegeerdeMeldingen.current.add(
                    nabijeMelding.id
                  );
                  popUpOpen.current = false;
                },
              },
              {
                text: 'Bevestigen',
                onPress: () => {
                  genegeerdeMeldingen.current.add(
                    nabijeMelding.id
                  );
                  popUpOpen.current = false;
                  bevestigMelding(nabijeMelding);
                },
              },
            ],
            {
              cancelable: false,
              onDismiss: () => {
                popUpOpen.current = false;
              },
            }
          );
        }
      } catch (error) {
        console.log('Locatiecontrole mislukt:', error);
      } finally {
        controleBezig.current = false;
      }
    }

    async function startLocatiecontrole() {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (!actief) return;

      if (status !== 'granted') {
        Alert.alert(
          'Locatie nodig',
          'Geef toestemming voor locatie om automatisch verkeersmeldingen in de buurt te ontvangen.'
        );
        return;
      }

      await controleerNabijeMeldingen();

      if (actief) {
        interval = setInterval(() => {
          controleerNabijeMeldingen();
        }, 30000);
      }
    }

    startLocatiecontrole();

    return () => {
      actief = false;

      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.logo}>GRENSCHECK</Text>
      <Text style={styles.title}>Grenskaart</Text>
      <Text style={styles.subtitle}>
        Nederland • Duitsland • België
      </Text>

      <View style={styles.mapCard}>
        <Text style={styles.mapTitle}>Grensgebieden</Text>

        <Text style={styles.mapText}>
          Bekijk de grensregio's en je eigen positie.
        </Text>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 51.5,
              longitude: 5.7,
              latitudeDelta: 3.5,
              longitudeDelta: 5.5,
            }}
            userInterfaceStyle="dark"
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            mapType="standard"
          >
            {meldingen.map((melding) => (
              <Marker
                key={melding.id}
                coordinate={{
                  latitude: melding.latitude,
                  longitude: melding.longitude,
                }}
                onPress={() =>
                  setGeselecteerdeMelding(melding)
                }
                title={melding.titel}
                description={melding.toelichting}
              >
                <View style={styles.markerIcon}>
                  <Text style={styles.markerEmoji}>👮</Text>
                </View>
              </Marker>
            ))}
          </MapView>
        </View>

        {geselecteerdeMelding && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              {geselecteerdeMelding.titel}
            </Text>

            <Text style={styles.infoText}>
              {geselecteerdeMelding.toelichting}
            </Text>

            <View style={styles.confirmationCard}>
              <Text style={styles.confirmationCount}>
                {geselecteerdeMelding.aantalBevestigingen}{' '}
                {geselecteerdeMelding.aantalBevestigingen === 1
                  ? 'bevestiging'
                  : 'bevestigingen'}
              </Text>

              <Text style={styles.confirmationText}>
                Gebruikers die deze controle bevestigen.
              </Text>

              <Pressable
                style={[
                  styles.confirmButton,
                  (geselecteerdeMelding.bevestigdDoorMij ||
                    bezigMetBevestigen ||
                    !location) &&
                    styles.confirmButtonDisabled,
                ]}
                disabled={
                  geselecteerdeMelding.bevestigdDoorMij ||
                  bezigMetBevestigen ||
                  !location
                }
                onPress={() =>
                  bevestigMelding(geselecteerdeMelding)
                }
              >
                <Text style={styles.confirmButtonText}>
                  {geselecteerdeMelding.bevestigdDoorMij
                    ? '✓ Al bevestigd'
                    : bezigMetBevestigen
                    ? 'Bezig met bevestigen...'
                    : !location
                    ? 'Locatie ophalen...'
                    : 'Ik bevestig deze melding'}
                </Text>
              </Pressable>

              <Text style={styles.confirmationNote}>
                Bevestigen kan alleen als je binnen 5 kilometer bent.
              </Text>
            </View>

            <Pressable
              style={styles.closeButton}
              onPress={() => setGeselecteerdeMelding(null)}
            >
              <Text style={styles.closeButtonText}>
                Sluiten
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.legend}>
          <View style={styles.legendRow}>
            <View style={styles.blueDot} />
            <Text style={styles.legendText}>Jouw locatie</Text>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.goldDot} />
            <Text style={styles.legendText}>GrensCheck</Text>
          </View>
        </View>

        <Text style={styles.mapCaption}>
          Je locatie wordt gebruikt voor je positie en de
          afstandscontrole bij bevestigingen.
        </Text>
      </View>

      <View style={styles.reportCard}>
        <Text style={styles.reportTitle}>
          Politie controle melden
        </Text>

        <Text style={styles.reportText}>
          Doe een melding van een politie controle
        </Text>

        <Pressable
          style={styles.reportButton}
          onPress={() => router.push('/melding')}
        >
          <Text style={styles.reportButtonText}>
            Politie controle melden
          </Text>
        </Pressable>

        <Text style={styles.privacyText}>
          Je locatie wordt niet openbaar gedeeld.
        </Text>
      </View>

      <Text style={styles.footer}>
        GrensCheck • Weet wat je meeneemt.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071426',
    padding: 20,
  },
  logo: {
    color: '#F2C96D',
    fontSize: 23,
    fontWeight: 'bold',
    marginTop: 55,
    letterSpacing: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 22,
  },
  subtitle: {
    color: '#AFC0D5',
    fontSize: 15,
    marginTop: 8,
    marginBottom: 22,
  },
  mapCard: {
    backgroundColor: '#142943',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1.5,
    borderColor: '#D5A943',
    marginBottom: 20,
  },
  mapTitle: {
    color: '#F2C96D',
    fontSize: 21,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mapText: {
    color: '#C3D1E0',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  mapContainer: {
    height: 390,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#49617A',
  },
  map: {
    flex: 1,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 17,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  blueDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#399BFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  goldDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D5A943',
  },
  legendText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  mapCaption: {
    color: '#AFC0D5',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 13,
  },
  reportCard: {
    backgroundColor: '#142943',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#34516F',
  },
  reportTitle: {
    color: '#F2C96D',
    fontSize: 20,
    fontWeight: 'bold',
  },
  reportText: {
    color: '#C3D1E0',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  reportButton: {
    backgroundColor: '#D5A943',
    padding: 16,
    borderRadius: 12,
    marginTop: 18,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#071426',
    fontWeight: 'bold',
    fontSize: 16,
  },
  privacyText: {
    color: '#AFC0D5',
    fontSize: 11,
    marginTop: 12,
    textAlign: 'center',
  },
  footer: {
    color: '#8297B1',
    textAlign: 'center',
    marginTop: 25,
    marginBottom: 40,
  },
  markerIcon: {
    backgroundColor: '#142943',
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: '#D5A943',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerEmoji: {
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#071426',
    padding: 16,
    borderRadius: 14,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#D5A943',
  },
  infoTitle: {
    color: '#F2C96D',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 10,
    lineHeight: 22,
  },
  confirmationCard: {
    backgroundColor: '#142943',
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
  },
  confirmationCount: {
    color: '#F2C96D',
    fontSize: 20,
    fontWeight: 'bold',
  },
  confirmationText: {
    color: '#C3D1E0',
    fontSize: 12,
    marginTop: 5,
  },
  confirmButton: {
    backgroundColor: '#D5A943',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  confirmButtonDisabled: {
    backgroundColor: '#52647A',
  },
  confirmButtonText: {
    color: '#071426',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  confirmationNote: {
    color: '#AFC0D5',
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#D5A943',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: '#071426',
    fontWeight: 'bold',
  },
});
