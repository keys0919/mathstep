import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgressStore } from '../../src/stores/progress.store';
import { loadData, todayStr } from '../../src/utils/storage';

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}

function exportJson() {
  if (Platform.OS !== 'web') return;
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
  const insets = useSafeAreaInsets();
  const { sessions } = useProgressStore();

  const recent = [...sessions].reverse().slice(0, 30);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>학습 기록</Text>
          <Pressable onPress={exportJson} style={styles.exportBtn}>
            <Text style={styles.exportText}>JSON 내보내기</Text>
          </Pressable>
        </View>

        {recent.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>아직 완료한 세션이 없어요.</Text>
            <Text style={styles.emptyHint}>세션을 완료하면 기록이 쌓여요!</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {recent.map((s, i) => {
              const totalSeeds = s.seeds.normal + s.seeds.rare + s.seeds.special;
              const multAcc = s.multTable.total > 0
                ? Math.round((s.multTable.correct / s.multTable.total) * 100)
                : null;
              const mentalAcc = s.mental.total > 0
                ? Math.round((s.mental.correct / s.mental.total) * 100)
                : null;

              return (
                <View key={i} style={styles.card}>
                  {/* 카드 헤더 */}
                  <View style={styles.cardTop}>
                    <Text style={styles.date}>{formatDate(s.date)}</Text>
                    <View style={styles.seedRow}>
                      {s.seeds.normal > 0 && <Text style={styles.seedChip}>🌱×{s.seeds.normal}</Text>}
                      {s.seeds.rare > 0 && <Text style={styles.seedChip}>🌺×{s.seeds.rare}</Text>}
                      {s.seeds.special > 0 && <Text style={styles.seedChip}>✨×{s.seeds.special}</Text>}
                      <View style={styles.totalBadge}>
                        <Text style={styles.totalBadgeText}>총 {totalSeeds}개</Text>
                      </View>
                    </View>
                  </View>

                  {/* 구분선 */}
                  <View style={styles.divider} />

                  {/* 스탯 */}
                  <View style={styles.stats}>
                    <StatBlock
                      label="구구단"
                      value={s.multTable.total > 0 ? `${s.multTable.correct}/${s.multTable.total}` : '-'}
                      accent={multAcc !== null ? (multAcc >= 80 ? '#4CAF50' : '#FF7043') : '#9E9E9E'}
                      sub={multAcc !== null ? `${multAcc}%` : ''}
                    />
                    <View style={styles.statDivider} />
                    <StatBlock
                      label="암산"
                      value={s.mental.total > 0 ? `${s.mental.correct}/${s.mental.total}` : '-'}
                      accent={mentalAcc !== null ? (mentalAcc >= 80 ? '#4CAF50' : '#FF7043') : '#9E9E9E'}
                      sub={mentalAcc !== null ? `${mentalAcc}%` : ''}
                    />
                    <View style={styles.statDivider} />
                    <StatBlock
                      label="세자리수"
                      value={s.bigNum.questionsCompleted > 0 ? `${s.bigNum.questionsCompleted}문제` : '-'}
                      accent="#2E3A23"
                      sub={s.bigNum.boxesCompleted > 0 ? `${s.bigNum.boxesCompleted}칸` : ''}
                    />
                    <View style={styles.statDivider} />
                    <StatBlock
                      label="최대 콤보"
                      value={s.maxCombo > 0 ? `🔥${s.maxCombo}` : '-'}
                      accent={s.maxCombo >= 10 ? '#E91E63' : '#2E3A23'}
                      sub=""
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

function StatBlock({ label, value, accent, sub }: {
  label: string; value: string; accent: string; sub: string;
}) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : <Text style={styles.statSub}> </Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FBE7' },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 24, fontFamily: 'Pretendard-Bold', color: '#2E3A23' },
  exportBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8EFE0',
  },
  exportText: { fontSize: 12, fontFamily: 'Pretendard-SemiBold', color: '#6A7B5A' },

  empty: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    gap: 10,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontFamily: 'Pretendard-SemiBold', color: '#2E3A23' },
  emptyHint: { fontSize: 14, fontFamily: 'Pretendard-Regular', color: '#6A7B5A' },

  list: { gap: 12 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  date: { fontSize: 16, fontFamily: 'Pretendard-SemiBold', color: '#2E3A23' },
  seedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  seedChip: { fontSize: 12, fontFamily: 'Pretendard-Regular', color: '#2E3A23' },
  totalBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  totalBadgeText: { fontSize: 12, fontFamily: 'Pretendard-SemiBold', color: '#4CAF50' },

  divider: { height: 1, backgroundColor: '#F0F4E8' },

  stats: { flexDirection: 'row', alignItems: 'center' },
  statBlock: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 44, backgroundColor: '#EEF2E6' },
  statLabel: { fontSize: 11, fontFamily: 'Pretendard-Regular', color: '#9E9E9E' },
  statValue: {
    fontSize: 15, fontFamily: 'Pretendard-Bold',
    fontVariant: ['tabular-nums'],
  },
  statSub: {
    fontSize: 12, fontFamily: 'Pretendard-Medium', color: '#9E9E9E',
    fontVariant: ['tabular-nums'],
  },
});
