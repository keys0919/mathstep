import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgressStore } from '../src/stores/progress.store';
import { loadData, todayStr } from '../src/utils/storage';

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}

function exportJson() {
  const data = loadData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mathstep-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessions } = useProgressStore();

  const recent = [...sessions].reverse().slice(0, 20);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← 뒤로</Text>
          </Pressable>
          <Pressable onPress={exportJson} style={styles.exportBtn}>
            <Text style={styles.exportText}>JSON 내보내기</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>학습 히스토리</Text>
      </View>

      {recent.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 완료한 세션이 없어요.</Text>
          <Text style={styles.emptyHint}>세션을 완료하면 기록이 쌓여요!</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {recent.map((s, i) => {
            const totalSeeds = s.seeds.normal + s.seeds.rare + s.seeds.special;
            const multAcc = s.multTable.total > 0
              ? Math.round((s.multTable.correct / s.multTable.total) * 100)
              : 0;
            const mentalAcc = s.mental.total > 0
              ? Math.round((s.mental.correct / s.mental.total) * 100)
              : 0;
            return (
              <View key={i} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.date}>{formatDate(s.date)}</Text>
                  <View style={styles.seedRow}>
                    <Text style={styles.seedIcon}>🌱</Text>
                    <Text style={styles.seedCount}>×{totalSeeds}</Text>
                  </View>
                </View>

                <View style={styles.stats}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>구구단</Text>
                    <Text style={styles.statValue}>{s.multTable.correct}/{s.multTable.total}</Text>
                    <Text style={[styles.statAcc, multAcc >= 80 ? styles.accGood : styles.accLow]}>
                      {multAcc}%
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>암산</Text>
                    <Text style={styles.statValue}>{s.mental.correct}/{s.mental.total}</Text>
                    <Text style={[styles.statAcc, mentalAcc >= 80 ? styles.accGood : styles.accLow]}>
                      {mentalAcc}%
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>세자리수</Text>
                    <Text style={styles.statValue}>{s.bigNum.questionsCompleted}문제</Text>
                    <Text style={styles.statAcc}>{s.bigNum.boxesCompleted}칸</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>최대 콤보</Text>
                    <Text style={styles.statValue}>{s.maxCombo}</Text>
                    <Text style={styles.statAcc}> </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FBE7',
    paddingHorizontal: 16,
  },
  header: {
    gap: 4,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    paddingVertical: 4,
  },
  backText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#6A7B5A',
  },
  exportBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#E8EFE0',
    borderRadius: 8,
  },
  exportText: {
    fontSize: 13,
    fontFamily: 'Pretendard-Medium',
    color: '#4CAF50',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Pretendard-SemiBold',
    color: '#2E3A23',
  },
  emptyHint: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#6A7B5A',
  },
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#2E3A23',
  },
  seedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seedIcon: {
    fontSize: 16,
  },
  seedCount: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: '#4CAF50',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E8EFE0',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Pretendard-Regular',
    color: '#6A7B5A',
  },
  statValue: {
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
    fontVariant: ['tabular-nums'],
  },
  statAcc: {
    fontSize: 13,
    fontFamily: 'Pretendard-Medium',
    color: '#6A7B5A',
    fontVariant: ['tabular-nums'],
  },
  accGood: { color: '#4CAF50' },
  accLow: { color: '#FF7043' },
});
