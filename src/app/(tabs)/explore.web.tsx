
import { Link, useFocusEffect } from 'expo-router';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../../supabase';

export default function ExploreWeb() {
  const kaartElement = useRef<HTMLDivElement>(null);
  const kaartRef = useRef<any>(null);

  // Maak de kaart opnieuw passend zodra het kaarttabblad geopend wordt.
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        kaartRef.current?.invalidateSize();
      }, 400);

      return () => clearTimeout(timer);
    }, [])
  );

  useEffect(() => {
    let kaart: any;
    let meldingenLaag: any;
    let interval: ReturnType<typeof setInterval>;
    let actief = true;

    async function startKaart() {
      const L = await import('leaflet');

      if (!actief || !kaartElement.current) return;

      kaart = L.map(kaartElement.current).setView(
        [52.2, 5.3],
        7
      );

      kaartRef.current = kaart;

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap-bijdragers',
        }
      ).addTo(kaart);

      meldingenLaag = L.layerGroup().addTo(kaart);

      const pinIcon = L.divIcon({
        html: '<span style="font-size: 30px;">📍</span>',
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      async function laadMeldingen() {
        const nu = new Date().toISOString();

        const { data, error } = await supabase
          .from('verkeersmeldingen')
          .select(
            'id, titel, toelichting, latitude, longitude, verloopt_op'
          )
          .eq('goedgekeurd', true)
          .eq('type', 'verkeershinder')
          .or(`verloopt_op.is.null,verloopt_op.gt.${nu}`);

        if (!actief) return;

        if (error) {
          console.error('Meldingen ophalen mislukt:', error);
          return;
        }

        meldingenLaag.clearLayers();

        data?.forEach((melding: any) => {
          if (
            melding.latitude == null ||
            melding.longitude == null
          ) {
            return;
          }

        const veiligeToelichting = String(
  melding.toelichting || 'Geen toelichting'
)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

          L.marker(
            [melding.latitude, melding.longitude],
            { icon: pinIcon }
          )
            .bindPopup(
              `<strong>Verkeersmelding</strong><br/>${veiligeToelichting}`
            )
                .addTo(meldingenLaag);
        });
      }

      await laadMeldingen();

      interval = setInterval(() => {
        void laadMeldingen();
      }, 30000);

      setTimeout(() => {
        if (actief && kaart) {
          kaart.invalidateSize();
        }
      }, 500);
    }

    void startKaart();

    return () => {
      actief = false;
      clearInterval(interval);
      kaartRef.current = null;
      kaart?.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GrensCheck</Text>

      <Text style={styles.subtitle}>
        Algemene verkeersgevaren
      </Text>

      <div
        ref={kaartElement}
        style={{
          width: '100%',
          height: 450,
          overflow: 'hidden',
          borderRadius: 14,
        }}
      />

      <Text style={styles.title}>Melding maken</Text>

      <Link href="/melding" style={styles.meldLink}>
        Verkeersgevaar melden
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#071426',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    color: '#D5A943',
    marginBottom: 14,
  },
  meldLink: {
    color: '#071426',
    backgroundColor: '#D5A943',
    fontSize: 17,
    fontWeight: 'bold',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 20,
  },
});
