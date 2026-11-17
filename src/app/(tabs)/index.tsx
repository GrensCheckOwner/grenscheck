
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🛡️ GRENSCHECK</Text>
        <Text style={styles.season}>VUURWERKSEIZOEN 2026 / 2027</Text>
      </View>

      <View style={styles.welcome}>
        <Text style={styles.title}>Weet wat je meeneemt.</Text>
        <Text style={styles.subtitle}>
          Goed voorbereid vanuit Duitsland en België naar Nederland.
        </Text>
      </View>

      <View style={styles.countryCard}>
        <Text style={styles.cardTitle}>🌍 Kies je land van vertrek</Text>
        <Text style={styles.country}>🇩🇪 Duitsland → Nederland</Text>
        <Text style={styles.country}>🇧🇪 België → Nederland</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>🛡️ Veiligheid voorop</Text>
        <Text style={styles.cardText}>
          Bekijk de Nederlandse vuurwerkregels, toegestane producten
          en belangrijke officiële waarschuwingen.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Ontdek GrensCheck</Text>

      <View style={styles.tile}>
        <Text style={styles.tileTitle}>📋 Vuurwerkregels</Text>
        <Text style={styles.cardText}>Wat mag je meenemen naar Nederland?</Text>
      </View>

      <View style={styles.tile}>
        <Text style={styles.tileTitle}>🗺️ Grensinformatie</Text>
        <Text style={styles.cardText}>Bekijk algemene informatie over de grens.</Text>
      </View>

      <View style={styles.tile}>
        <Text style={styles.tileTitle}>🔔 Meldingen</Text>
        <Text style={styles.cardText}>Bekijk officiële waarschuwingen en updates.</Text>
      </View>

      <View style={styles.tile}>
        <Text style={styles.tileTitle}>ℹ️ Veilig op weg</Text>
        <Text style={styles.cardText}>Bereid je reis goed voor.</Text>
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
  header: {
    alignItems: 'center',
    marginTop: 55,
    marginBottom: 35,
  },
  logo: {
    color: '#F2C96D',
    fontSize: 28,
    fontWeight: 'bold',
  },
  season: {
    color: '#8FA9C7',
    fontSize: 11,
    marginTop: 8,
    letterSpacing: 2,
  },
  welcome: {
    marginBottom: 25,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#AFC0D5',
    fontSize: 15,
    marginTop: 10,
    lineHeight: 23,
  },
  countryCard: {
    backgroundColor: '#142943',
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#294563',
  },
  cardTitle: {
    color: '#F2C96D',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  country: {
    color: '#FFFFFF',
    fontSize: 16,
    marginVertical: 8,
  },
  infoCard: {
    backgroundColor: '#123B3C',
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
  },
  cardText: {
    color: '#C3D1E0',
    fontSize: 14,
    lineHeight: 22,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  tile: {
    backgroundColor: '#142943',
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#294563',
  },
  tileTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 7,
  },
  footer: {
    color: '#8297B1',
    textAlign: 'center',
    marginTop: 25,
    marginBottom: 35,
  },
});
