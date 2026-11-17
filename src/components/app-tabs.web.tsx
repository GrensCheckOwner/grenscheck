
import {
  TabList,
  Tabs,
  TabSlot,
  TabTrigger,
} from 'expo-router/ui';
import {
  Pressable,
  StyleSheet,
  Text
} from 'react-native';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />

      <TabList style={styles.tabList}>
        <TabTrigger name="index" href="/" asChild>
          <Pressable style={styles.tab}>
            <Text style={styles.tabText}>Home</Text>
          </Pressable>
        </TabTrigger>

        <TabTrigger name="explore" href="/explore" asChild>
          <Pressable style={styles.tab}>
            <Text style={styles.tabText}>Kaart</Text>
          </Pressable>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabList: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    padding: 16,
    backgroundColor: '#071426',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: '#14263D',
  },
  tabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
