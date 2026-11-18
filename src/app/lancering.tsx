
import { useEffect, useState } from 'react';
import {
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const LANCERING = new Date('2026-12-05T23:00:00Z').getTime();

export default function Lancering() {
  const [resterend, setResterend] = useState(LANCERING - Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setResterend(Math.max(0, LANCERING - Date.now()));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const dagen = Math.floor(resterend / 86400000);
  const uren = Math.floor((resterend % 86400000) / 3600000);
  const minuten = Math.floor((resterend % 3600000) / 60000);
  const seconden = Math.floor((resterend % 60000) / 1000);

  const blok = (waarde: number, label: string) => (
    <View style={styles.blok}>
      <Text style={styles.getal}>{String(waarde).padStart(2, '0')}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.pagina}>
      <View style={styles.boven}>
        <Text style={styles.badge}>COMING SOON</Text>
        <Text style={styles.titel}>
          GRENS<Text style={styles.groen}>CHECK</Text>
        </Text>
        <Text style={styles.slogan}>Weet wat je meeneemt.</Text>

        <View style={styles.teller}>
          {blok(dagen, 'DAGEN')}
          {blok(uren, 'UREN')}
          {blok(minuten, 'MINUTEN')}
          {blok(seconden, 'SECONDEN')}
        </View>

        <Text style={styles.datum}>6 DECEMBER 2026</Text>
        <Text style={styles.tekst}>
          {resterend > 0
            ? 'De lancering komt eraan!'
            : 'WE ZIJN LIVE!'}
        </Text>
      </View>

      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=1200',
        }}
        style={styles.vuurwerk}
        imageStyle={{ opacity: 0.95 }}
      >
        <View style={styles.overlay}>
          <Text style={styles.vuurwerkTekst}>GRENSCHECK</Text>
          <Text style={styles.vuurwerkSub}>
            Binnenkort online!
          </Text>
        </View>
      </ImageBackground>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pagina: {
    flex: 1,
    backgroundColor: '#050b12',
  },
  boven: {
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 65,
    paddingBottom: 35,
  },
  badge: {
    color: '#70f75b',
    borderColor: '#70f75b',
    borderWidth: 2,
    borderRadius: 30,
    paddingHorizontal: 25,
    paddingVertical: 10,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 35,
  },
  titel: {
    color: 'white',
    fontSize: 37,
    fontWeight: '900',
  },
  groen: {
    color: '#48e43b',
  },
  slogan: {
    color: 'white',
    fontSize: 19,
    fontStyle: 'italic',
    marginTop: 10,
    marginBottom: 40,
  },
  teller: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  blok: {
    backgroundColor: '#101c29',
    borderColor: '#28465b',
    borderWidth: 1,
    borderRadius: 15,
    width: '22%',
    minWidth: 72,
    paddingVertical: 17,
    alignItems: 'center',
  },
  getal: {
    color: 'white',
    fontSize: 29,
    fontWeight: 'bold',
  },
  label: {
    color: '#70f75b',
    fontSize: 10,
    marginTop: 7,
    fontWeight: 'bold',
  },
  datum: {
    color: 'white',
    fontSize: 23,
    fontWeight: 'bold',
    marginTop: 35,
  },
  tekst: {
    color: '#70f75b',
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 15,
  },
  vuurwerk: {
    height: 430,
    justifyContent: 'flex-end',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 25,
    alignItems: 'center',
  },
  vuurwerkTekst: {
    color: 'white',
    fontSize: 30,
    fontWeight: '900',
  },
  vuurwerkSub: {
    color: 'white',
    fontSize: 17,
    marginTop: 8,
  },
});
