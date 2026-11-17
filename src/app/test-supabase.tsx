
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../supabase';

export default function TestSupabaseScreen() {
  const [status, setStatus] = useState('Verbinding testen...');

  useEffect(() => {
    async function testVerbinding() {
      const { error } = await supabase
        .from('verkeersmeldingen')
        .select('id')
        .limit(1);

      if (error) {
        setStatus('Verbinding mislukt: ' + error.message);
      } else {
        setStatus('Verbinding met Supabase werkt!');
      }
    }

    testVerbinding();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GrensCheck</Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071426',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  title: {
    color: '#F2C96D',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
});
