import React, { useState } from 'react';
import { useSharedValue, withDelay, withSequence, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { Milo } from './Milo';
import { MonthPersona } from './MonthPersona';
import { BODY_LABELS, type MiloBody } from './geometry';
import { basePose, EYE_LABELS, EYE_MOOD, MOODS, type MiloEyes, type MiloMood } from './life';
import { C, F } from '../theme';
import { Haptic } from '../haptics';

/** The approval screen: one big living Milo, every expression, mood colour and body shape. */
export function MiloReview() {
  const [eyes, setEyes] = useState<MiloEyes>('oval');
  const [mood, setMood] = useState<MiloMood>('green');
  const [body, setBody] = useState<MiloBody>('aha');
  const [alive, setAlive] = useState(true);
  const [waves, setWaves] = useState(0);
  const [book, setBook] = useState(false);
  const notebook = useSharedValue(0);
  const write = useSharedValue(0);
  const lookX = useSharedValue(0);
  const lookY = useSharedValue(2.2);
  const aside = useSharedValue(0);
  const open = useSharedValue(0);
  const [isAside, setIsAside] = useState(false);
  const toggleAside = () => {
    if (!book) toggleBook(true);
    setIsAside(!isAside);
    aside.set(withTiming(isAside ? 0 : 1, { duration: 300, easing: Easing.bezier(0.42, 0, 0.58, 1) }));
  };
  const toggleBook = (on: boolean) => {
    setBook(on);
    write.set(0);
    notebook.set(withTiming(on ? 1 : 0, { duration: 350, easing: Easing.bezier(0, 0, 0.58, 1) }));
  };
  const bulb = useSharedValue(0);
  const rings = useSharedValue(0);
  const eyeScale = useSharedValue(1);
  const idea = () => {
    Haptic.tap();
    bulb.set(withSequence(withSpring(1, { mass: 1, stiffness: 385, damping: 19.6 }), withDelay(900, withTiming(0, { duration: 250 }))));
  };
  const overthink = () => {
    rings.set(withSequence(withTiming(1, { duration: 300 }), withDelay(2200, withTiming(0, { duration: 300 }))));
    eyeScale.set(withSequence(withTiming(1.32, { duration: 350 }), withTiming(0.82, { duration: 450 }), withTiming(1, { duration: 350 })));
  };
  const writeDown = () => {
    if (!book) toggleBook(true);
    write.set(0);
    setIsAside(false);
    aside.set(withTiming(0, { duration: 200 }));
    open.set(withTiming(1, { duration: 340, easing: Easing.bezier(0.42, 0, 0.58, 1) }));
    write.set(withDelay(400, withTiming(1, { duration: 1500, easing: Easing.linear })));
    open.set(withSequence(
      withTiming(1, { duration: 340, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
      withDelay(1700, withTiming(0, { duration: 340, easing: Easing.bezier(0.42, 0, 0.58, 1) })),
    ));
    for (let i = 0; i < 16; i++) setTimeout(() => (i % 2 ? Haptic.scratch() : Haptic.scribble()), 400 + 85 * i);
  };
  const pose = basePose({ body, mood, eyes });
  const morph = useSharedValue(0);
  const [morphed, setMorphed] = useState(false);
  const toggleMorph = () => {
    setMorphed(!morphed);
    morph.set(withTiming(morphed ? 0 : 1, { duration: 1600, easing: Easing.bezier(0.42, 0, 0.58, 1) }));
  };
  const [monthPicked, setMonthPicked] = useState(8);
  const personaCur = useSharedValue(8);
  const personaPrev = useSharedValue(0);
  const personaT = useSharedValue(1);
  const pickMonth = (m: number) => {
    setMonthPicked(m);
    personaPrev.set(personaCur.value);
    personaCur.set(m);
    personaT.set(0);
    personaT.set(withSpring(1, { mass: 1, stiffness: 224, damping: 16.5 }));
  };

  return (
    <ScrollView style={{ backgroundColor: C.backgroundPrimary }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={{ gap: 6 }}>
        <Text style={styles.title}>Milo</Text>
        <Text style={styles.subtitle}>For your approval. Tap him.</Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <Milo base={pose} size={170} alive={alive} seed={1} waveTrigger={waves} drive={{ notebook, write, aside, open, lookX, lookY, bulb, rings, eyeScale }} />
      </View>

      <Section title="Eyes">
        <Chips items={Object.keys(EYE_LABELS) as MiloEyes[]} value={eyes} label={(e) => EYE_LABELS[e]}
          onChange={(e) => { setEyes(e); setMood(EYE_MOOD[e]); }} />
      </Section>
      <Section title="Colour (mood)">
        <Chips items={Object.keys(MOODS) as MiloMood[]} value={mood} label={(m) => MOODS[m].label} onChange={setMood} />
        <Text style={styles.note}>Picking an expression sets its colour. You can still change it here.</Text>
      </Section>
      <Section title="Shape">
        <Chips items={Object.keys(BODY_LABELS) as MiloBody[]} value={body} label={(b) => BODY_LABELS[b]} onChange={setBody} />
      </Section>
      <Section title="Motion">
        <Chips items={[true, false]} value={alive} label={(a) => (a ? 'Alive' : 'Still')} onChange={setAlive} />
        <Pressable onPress={() => { setWaves((w) => w + 1); Haptic.tap(); }} style={styles.outline}>
          <Text style={styles.chipText}>Wave</Text>
        </Pressable>
        <Chips items={[false, true]} value={book} label={(b) => (b ? 'Notebook out' : 'No notebook')} onChange={toggleBook} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={writeDown} style={styles.outline}>
            <Text style={styles.chipText}>Write it down</Text>
          </Pressable>
          <Pressable onPress={toggleAside} style={styles.outline}>
            <Text style={styles.chipText}>{isAside ? 'Bring back' : 'Push aside'}</Text>
          </Pressable>
          <Pressable onPress={idea} style={styles.outline}>
            <Text style={styles.chipText}>Idea</Text>
          </Pressable>
          <Pressable onPress={overthink} style={styles.outline}>
            <Text style={styles.chipText}>Overthink</Text>
          </Pressable>
        </View>
        <Text style={styles.note}>Alive: breathing, blinks and the odd glance. Tap for a hop.</Text>
      </Section>
      <Section title="Welcome to chat (the morph)">
        <View style={{ alignItems: 'center' }}>
          <Milo base={basePose({ body: 'clean' })} size={150} seed={5} drive={{ morph }} />
        </View>
        <Pressable onPress={toggleMorph} style={styles.outline}>
          <Text style={styles.chipText}>{morphed ? 'Back to the first version' : 'Morph into the chat Milo (slowed down)'}</Text>
        </Pressable>
      </Section>
      <Section title="Month personas (birthday)">
        <View style={{ alignItems: 'center' }}>
          <MonthPersona state={{ cur: personaCur, prev: personaPrev, t: personaT }} bodyWidth={140} />
        </View>
        <Chips items={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} value={monthPicked}
          label={(m) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} onChange={pickMonth} />
      </Section>
      <Section title="Sizes in onboarding">
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 20 }}>
          {([['Welcome', 144, 2], ['Chat slot', 64, 3], ['Small', 32, 4]] as const).map(([label, size, seed]) => (
            <View key={label} style={{ alignItems: 'center', gap: 4 }}>
              <Milo base={pose} size={size} alive={alive} seed={seed} />
              <Text style={[styles.note, { color: C.contentSecondary, fontFamily: F.medium }]}>{label}</Text>
            </View>
          ))}
        </View>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.section}>{title}</Text>
      {children}
    </View>
  );
}

/** Chip v2 from the marketplace board: no border, ink when selected. */
function Chips<T>({ items, value, label, onChange }: { items: T[]; value: T; label: (t: T) => string; onChange: (t: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ overflow: 'visible' }} contentContainerStyle={{ gap: 8 }}>
      {items.map((item) => {
        const on = item === value;
        return (
          <Pressable key={String(item)} onPress={() => { onChange(item); Haptic.select(); }}
            style={[styles.chip, { backgroundColor: on ? C.contentPrimary : C.backgroundTertiary }]}>
            <Text style={[styles.chipText, { color: on ? C.backgroundPrimary : C.contentPrimary }]}>{label(item)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 40, gap: 28 },
  title: { fontFamily: F.bold, fontSize: 28, color: C.contentPrimary },
  subtitle: { fontFamily: F.regular, fontSize: 16, color: C.contentSecondary },
  section: { fontFamily: F.bold, fontSize: 16, color: C.contentPrimary },
  note: { fontFamily: F.regular, fontSize: 13, color: C.contentTertiary },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: 18, justifyContent: 'center' },
  chipText: { fontFamily: F.medium, fontSize: 15, color: C.contentPrimary },
  outline: { alignSelf: 'flex-start', paddingHorizontal: 14, height: 36, borderRadius: 18, justifyContent: 'center', borderWidth: 1, borderColor: C.contentPrimary },
});
