
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../supabase';

type Melding = {
  id: string;
  titel: string;
  toelichting: string;
  latitude: number;
  longitude: number;
  aangemaakt_op: string;
  goedgekeurd: boolean;
};

type TijdFilter = 'alles' | 'uur' | 'vandaag' | '7dagen' | '30dagen';

export default function BeheerPagina() {
  const [meldingen, setMeldingen] = useState<Melding[]>([]);
  const [laden, setLaden] = useState(true);
  const [zoekterm, setZoekterm] = useState('');
  const [tijdFilter, setTijdFilter] = useState<TijdFilter>('alles');
  const [oudsteEerst, setOudsteEerst] = useState(false);

  async function laadMeldingen() {
    const { data: sessieData } = await supabase.auth.getSession();
    const userId = sessieData.session?.user.id;

    if (!userId) {
      Alert.alert('Niet ingelogd', 'Log eerst in om verder te gaan.');
      router.replace('/inloggen');
      setLaden(false);
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from('app_admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (adminError || !admin) {
      Alert.alert('Geen toegang', 'Je hebt geen beheerdersrechten.');
      router.replace('/(tabs)');
      setLaden(false);
      return;
    }

    const { data: resultaten, error: meldingFout } = await supabase
      .from('verkeersmeldingen')
      .select('id, titel, toelichting, latitude, longitude, aangemaakt_op, goedgekeurd')
      .order('aangemaakt_op', { ascending: false });

    if (meldingFout) {
      Alert.alert('Fout', meldingFout.message);
    } else {
      setMeldingen(resultaten || []);
    }

    setLaden(false);
  }

  useEffect(() => {
    laadMeldingen();
  }, []);

  async function keurGoed(id: string) {
    const { error } = await supabase
      .from('verkeersmeldingen')
      .update({ goedgekeurd: true })
      .eq('id', id);

    if (error) {
      Alert.alert('Goedkeuren mislukt', error.message);
      return;
    }

    Alert.alert('Melding goedgekeurd', 'De melding is nu zichtbaar voor gebruikers.');
    laadMeldingen();
  }


async function verwijderMelding(id: string) {
  const uitvoeren = async () => {
    const { error } = await supabase
      .from('verkeersmeldingen')
      .delete()
      .eq('id', id);

    if (error) {
      Alert.alert('Verwijderen mislukt', error.message);
      return;
    }

    Alert.alert('Verwijderd', 'De melding is definitief verwijderd.');
    laadMeldingen();
  };

  if (Platform.OS === 'web') {
    const bevestigd = window.confirm(
      'Weet je zeker dat je deze melding definitief wilt verwijderen?'
    );

    if (bevestigd) {
      await uitvoeren();
    }
  } else {
    Alert.alert(
      'Melding verwijderen',
      'Weet je zeker dat je deze melding definitief wilt verwijderen?',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Definitief verwijderen',
          style: 'destructive',
          onPress: uitvoeren,
        },
      ]
    );
  }
}



async function verwijderAlleGoedgekeurde() {
  const aantal = meldingen.filter(m => m.goedgekeurd).length;

  if (aantal === 0) {
    Alert.alert('Geen meldingen', 'Er zijn geen goedgekeurde meldingen om te verwijderen.');
    return;
  }

  const uitvoeren = async () => {
    const { error } = await supabase
      .from('verkeersmeldingen')
      .delete()
      .eq('goedgekeurd', true);

    if (error) {
      Alert.alert('Verwijderen mislukt', error.message);
      return;
    }

    Alert.alert('Verwijderd', 'Alle goedgekeurde meldingen zijn verwijderd.');
    laadMeldingen();
  };

  if (Platform.OS === 'web') {
    const bevestigd = window.confirm(
      `Weet je zeker dat je alle ${aantal} goedgekeurde meldingen definitief wilt verwijderen?`
    );

    if (bevestigd) {
      await uitvoeren();
    }
  } else {
    Alert.alert(
      'Alle goedgekeurde meldingen verwijderen?',
      `Je staat op het punt ${aantal} goedgekeurde melding(en) definitief te verwijderen. Wachtende meldingen blijven behouden.`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Alles verwijderen',
          style: 'destructive',
          onPress: uitvoeren,
        },
      ]
    );
  }
}


  async function uitloggen() {
    await supabase.auth.signOut();
    router.replace('/inloggen');
  }

  function valtBinnenTijd(melding: Melding) {
    if (tijdFilter === 'alles') return true;

    const datum = new Date(melding.aangemaakt_op);
    const nu = new Date();

    if (tijdFilter === 'uur') {
      return nu.getTime() - datum.getTime() <= 60 * 60 * 1000;
    }

    if (tijdFilter === 'vandaag') {
      const beginVandaag = new Date(
        nu.getFullYear(),
        nu.getMonth(),
        nu.getDate()
      );
      return datum >= beginVandaag;
    }

    if (tijdFilter === '7dagen') {
      return nu.getTime() - datum.getTime() <= 7 * 24 * 60 * 60 * 1000;
    }

    if (tijdFilter === '30dagen') {
      return nu.getTime() - datum.getTime() <= 30 * 24 * 60 * 60 * 1000;
    }

    return true;
  }

  function filterMeldingen(lijst: Melding[]) {
    const zoek = zoekterm.trim().toLowerCase();

    return lijst
      .filter(melding => {
        const pastBijZoekterm =
          melding.titel.toLowerCase().includes(zoek) ||
          melding.toelichting.toLowerCase().includes(zoek);

        return pastBijZoekterm && valtBinnenTijd(melding);
      })
      .sort((a, b) => {
        const verschil =
          new Date(a.aangemaakt_op).getTime() -
          new Date(b.aangemaakt_op).getTime();

        return oudsteEerst ? verschil : -verschil;
      });
  }

  const wachtende = filterMeldingen(
    meldingen.filter(m => !m.goedgekeurd)
  );

  const goedgekeurde = filterMeldingen(
    meldingen.filter(m => m.goedgekeurd)
  );

  const aantalWachtend = meldingen.filter(m => !m.goedgekeurd).length;
  const aantalGoedgekeurd = meldingen.filter(m => m.goedgekeurd).length;

  function toonMelding(melding: Melding) {
    return (
      <View key={melding.id} style={styles.card}>
        <Text style={styles.cardTitle}>{melding.titel}</Text>

        <Text style={styles.text}>{melding.toelichting}</Text>

        <Text style={styles.location}>
          Breedtegraad: {melding.latitude.toFixed(5)}
          {'\n'}
          Lengtegraad: {melding.longitude.toFixed(5)}
        </Text>

        <Text style={styles.date}>
          {new Date(melding.aangemaakt_op).toLocaleString('nl-NL')}
        </Text>

        {!melding.goedgekeurd && (
          <TouchableOpacity
            style={styles.approve}
            onPress={() => keurGoed(melding.id)}
          >
            <Text style={styles.approveText}>Melding goedkeuren</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => verwijderMelding(melding.id)}
        >
          <Text style={styles.deleteText}>Melding verwijderen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>GrensCheck</Text>
        <Text style={styles.subtitle}>Beheerdersomgeving</Text>

        <View style={styles.topButtons}>
          <TouchableOpacity
            style={styles.logout}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.logoutText}>Terug naar GrensCheck</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logout} onPress={uitloggen}>
            <Text style={styles.logoutText}>Uitloggen</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>Meldingenoverzicht</Text>

        <View style={styles.countRow}>
          <View style={styles.countCard}>
            <Text style={styles.countNumber}>{aantalWachtend}</Text>
            <Text style={styles.countLabel}>Wachtend</Text>
          </View>

          <View style={styles.countCard}>
            <Text style={styles.countNumber}>{aantalGoedgekeurd}</Text>
            <Text style={styles.countLabel}>Goedgekeurd</Text>
          </View>
        </View>

        <TextInput
          style={styles.search}
          placeholder="Zoek op titel of omschrijving..."
          placeholderTextColor="#8297B1"
          value={zoekterm}
          onChangeText={setZoekterm}
        />

        <Text style={styles.filterTitle}>Filter op tijd</Text>

        <View style={styles.filterRow}>
          {([
            ['alles', 'Alles'],
            ['uur', 'Laatste uur'],
            ['vandaag', 'Vandaag'],
            ['7dagen', '7 dagen'],
            ['30dagen', '30 dagen'],
          ] as [TijdFilter, string][]).map(([waarde, label]) => (
            <TouchableOpacity
              key={waarde}
              style={[
                styles.filterButton,
                tijdFilter === waarde && styles.filterActive,
              ]}
              onPress={() => setTijdFilter(waarde)}
            >
              <Text
                style={[
                  styles.filterText,
                  tijdFilter === waarde && styles.filterTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setOudsteEerst(!oudsteEerst)}
        >
          <Text style={styles.sortText}>
            Sorteren: {oudsteEerst ? 'Oudste eerst ↑' : 'Nieuwste eerst ↓'}
          </Text>
        </TouchableOpacity>

        {laden ? (
          <Text style={styles.text}>Meldingen laden...</Text>
        ) : (
          <>
            <Text style={styles.heading}>Wacht op goedkeuring ({wachtende.length})</Text>

            {wachtende.length === 0 ? (
              <Text style={styles.text}>Geen wachtende meldingen gevonden.</Text>
            ) : (
              wachtende.map(toonMelding)
            )}

            <View style={styles.sectionDivider} />

            <Text style={styles.heading}>Goedgekeurd ({goedgekeurde.length})</Text>

            {goedgekeurde.length === 0 ? (
              <Text style={styles.text}>Geen goedgekeurde meldingen gevonden.</Text>
            ) : (
              goedgekeurde.map(toonMelding)
            )}

            {aantalGoedgekeurd > 0 && (
              <TouchableOpacity
                style={styles.deleteAllButton}
                onPress={verwijderAlleGoedgekeurde}
              >
                <Text style={styles.deleteText}>
                  Alle goedgekeurde meldingen verwijderen
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <Text style={styles.footer}>GrensCheck • Beheer</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071426',
    padding: 22,
    paddingTop: 65,
  },
  title: {
    color: '#D5A943',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 20,
  },
  topButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heading: {
    color: '#D5A943',
    fontSize: 21,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    marginTop: 8,
  },
  location: {
    color: '#9BAFC5',
    fontSize: 12,
    marginTop: 12,
  },
  date: {
    color: '#8297B1',
    fontSize: 12,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#14263D',
    padding: 17,
    borderRadius: 14,
    marginBottom: 15,
  },
  cardTitle: {
    color: '#D5A943',
    fontSize: 18,
    fontWeight: 'bold',
  },
  approve: {
    backgroundColor: '#D5A943',
    padding: 14,
    borderRadius: 10,
    marginTop: 18,
    alignItems: 'center',
  },
  approveText: {
    color: '#071426',
    fontWeight: 'bold',
  },
  logout: {
    padding: 10,
    backgroundColor: '#263B55',
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFFFFF',
  },
  deleteButton: {
    backgroundColor: '#A83232',
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  deleteAllButton: {
    backgroundColor: '#8E2525',
    padding: 16,
    borderRadius: 10,
    marginTop: 22,
    marginBottom: 20,
    alignItems: 'center',
  },
  deleteText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  countRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  countCard: {
    flex: 1,
    backgroundColor: '#142943',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  countNumber: {
    color: '#D5A943',
    fontSize: 27,
    fontWeight: 'bold',
  },
  countLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 4,
  },
  search: {
    backgroundColor: '#142943',
    borderColor: '#294563',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    color: '#FFFFFF',
    marginBottom: 18,
  },
  filterTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#263B55',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  filterActive: {
    backgroundColor: '#D5A943',
  },
  filterText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#071426',
    fontWeight: 'bold',
  },
  sortButton: {
    backgroundColor: '#263B55',
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
    alignItems: 'center',
  },
  sortText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#294563',
    marginTop: 28,
    marginBottom: 5,
  },
  footer: {
    color: '#8297B1',
    textAlign: 'center',
    marginTop: 25,
    marginBottom: 35,
  },
});
