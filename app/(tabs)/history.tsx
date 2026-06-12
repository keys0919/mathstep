import { View, Text, Pressable, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgressStore } from '../../src/stores/progress.store';
import { loadData, saveData, todayStr } from '../../src/utils/storage';
import { MultTableData } from '../../src/types/progress.types';

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}

function exportJson() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
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

function importJson() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.sessions || !data.state) {
          window.alert('올바른 백업 파일이 아닙니다.');
          return;
        }
        saveData(data);
        window.alert('가져오기 완료. 앱을 새로고침합니다.');
        window.location.reload();
      } catch {
        window.alert('파일을 읽을 수 없습니다.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ─── 구구단 진도 맵 ──────────────────────────────────────────────────
function MultTableGrid({ multTable }: { multTable: MultTableData }) {
  const { width: SW } = useWindowDimensions();
  const labelW = 24;
  const cellSize = Math.max(30, Math.floor((SW - 32 - labelW - 8 * 2) / 8));

  const NUMS = [2, 3, 4, 5, 6, 7, 8, 9];

  const graduated = new Set(multTable.graduated.map(([a, b]) => `${a}x${b}`));
  const weak = multTable.weak;

  function cellBg(a: number, b: number): string {
    const key = `${a}x${b}`;
    if (graduated.has(key)) return '#C8E6C9';
    const entry = weak[key];
    if (!entry) return '#F0F0F0';
    if (entry.errors > 0) return '#FFCCBC';
    if (entry.slowCount > 0) return '#FFF9C4';
    return '#E8F5E9';
  }

  function cellMark(a: number, b: number): string {
    const key = `${a}x${b}`;
    if (graduated.has(key)) return '✓';
    const entry = weak[key];
    if (entry?.errors > 0) return String(entry.errors);
    return '';
  }

  function cellMarkColor(a: number, b: number): string {
    const key = `${a}x${b}`;
    if (graduated.has(key)) return '#388E3C';
    return '#BF360C';
  }

  const gradCount = multTable.graduated.length;
  const totalPairs = 64;

  return (
    <View style={gridStyles.container}>
      <View style={gridStyles.titleRow}>
        <Text style={gridStyles.title}>📊 구구단 진도</Text>
        <Text style={gridStyles.badge}>{gradCount}/{totalPairs} 졸업</Text>
      </View>

      {/* 열 헤더 */}
      <View style={gridStyles.row}>
        <View style={{ width: labelW }} />
        {NUMS.map(n => (
          <View key={n} style={[gridStyles.headerCell, { width: cellSize }]}>
            <Text style={gridStyles.headerText}>{n}</Text>
          </View>
        ))}
      </View>

      {/* 행 */}
      {NUMS.map(a => (
        <View key={a} style={gridStyles.row}>
          <View style={[gridStyles.headerCell, { width: labelW }]}>
            <Text style={gridStyles.headerText}>{a}</Text>
          </View>
          {NUMS.map(b => {
            const bg = cellBg(a, b);
            const mark = cellMark(a, b);
            const markColor = cellMarkColor(a, b);
            return (
              <View
                key={b}
                style={[gridStyles.cell, { width: cellSize, height: cellSize, backgroundColor: bg }]}
              >
                {mark ? (
                  <Text style={[gridStyles.cellMark, { color: markColor, fontSize: cellSize > 36 ? 12 : 10 }]}>
                    {mark}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}

      {/* 범례 */}
      <View style={gridStyles.legend}>
        <LegendDot color="#C8E6C9" label="졸업" />
        <LegendDot color="#FFCCBC" label="오답" />
        <LegendDot color="#FFF9C4" label="느림" />
        <LegendDot color="#E8F5E9" label="연습" />
        <LegendDot color="#F0F0F0" label="미연습" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={gridStyles.legendItem}>
      <View style={[gridStyles.legendDot, { backgroundColor: color }]} />
      <Text style={gridStyles.legendLabel}>{label}</Text>
    </View>
  );
}

// ─── 메인 화면 ──────────────────────────────────────────────────────
export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, multTable } = useProgressStore();

  const recent = [...sessions].reverse().slice(0, 30);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>학습 기록</Text>
          <View style={styles.headerBtns}>
            <Pressable onPress={importJson} style={styles.exportBtn}>
              <Text style={styles.exportText}>가져오기</Text>
            </Pressable>
            <Pressable onPress={exportJson} style={styles.exportBtn}>
              <Text style={styles.exportText}>내보내기</Text>
            </Pressable>
          </View>
        </View>

        {/* 구구단 진도 맵 */}
        <View style={styles.gridCard}>
          <MultTableGrid multTable={multTable} />
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

                  <View style={styles.divider} />

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

const gridStyles = StyleSheet.create({
  container: { gap: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    color: '#2E3A23',
  },
  badge: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    color: '#388E3C',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  row: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  headerCell: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 11,
    fontFamily: 'Pretendard-SemiBold',
    color: '#6A7B5A',
  },
  cell: {
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellMark: {
    fontFamily: 'Pretendard-Bold',
    fontVariant: ['tabular-nums'],
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 11,
    fontFamily: 'Pretendard-Regular',
    color: '#6A7B5A',
  },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FBE7' },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 24, fontFamily: 'Pretendard-Bold', color: '#2E3A23' },
  headerBtns: { flexDirection: 'row', gap: 8 },
  exportBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8EFE0',
  },
  exportText: { fontSize: 12, fontFamily: 'Pretendard-SemiBold', color: '#6A7B5A' },

  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  empty: {
    flex: 1,
    paddingTop: 40,
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
