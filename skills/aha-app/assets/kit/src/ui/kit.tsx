// Shared pieces for the onboarding screens (DLS from the Figma file), ported from OnboardingKit.swift.

import React, { forwardRef } from 'react';
import { Platform, StyleSheet, View, type TextInputProps, type ViewStyle } from 'react-native';
import { HapticPressable as Pressable } from './press';
import { Text, TextInput } from './text';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { C, F, lh } from '../theme';
import { EASE } from '../timing';

// MARK: - Buttons (DLS "Button Secondary")

/** 'primary' is Aha's primary button: the secondary background with an ink outline (never ink-filled). */
export type ButtonKind = 'primary' | 'secondary' | 'secondaryMedium' | 'tertiary' | 'brand';

/** A soft press: the control sinks a touch while held. */
export function PressScale({ onPress, disabled, children, style, accessibilityLabel }: {
  onPress?: () => void; disabled?: boolean; children: React.ReactNode; style?: ViewStyle; accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      feel
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => { scale.set(withTiming(0.97, { duration: 100, easing: EASE.out })); }}
      onPressOut={() => { scale.set(withTiming(1, { duration: 160, easing: EASE.out })); }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[style, anim]}>{children}</Animated.View>
    </Pressable>
  );
}

export function AhaButton({ title, kind = 'primary', enabled = true, onPress }: {
  title: string; kind?: ButtonKind; enabled?: boolean; onPress: () => void;
}) {
  const height = kind === 'secondaryMedium' ? 44 : kind === 'brand' ? 48 : 52;
  const fill = kind === 'tertiary' ? 'transparent' : kind === 'brand' ? C.brand : C.backgroundSecondary;
  const border = kind === 'primary' ? (enabled ? C.borderSelected : C.borderOpaque)
    : kind === 'secondary' || kind === 'secondaryMedium' ? C.borderOpaque : 'transparent';
  const color = kind === 'brand' ? C.backgroundPrimary : enabled ? C.contentPrimary : C.contentTertiary;
  // Its press state (Manan): held, the fill turns background tertiary; let go, it eases back.
  const down = useSharedValue(0);
  const pressedFill = kind === 'brand' ? '#5E8238' : C.backgroundTertiary;
  const anim = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(down.value, [0, 1], [fill === 'transparent' ? 'rgba(240,233,230,0)' : fill, pressedFill]),
  }));
  return (
    <Pressable
      feel
      disabled={!enabled}
      onPress={onPress}
      onPressIn={() => { down.set(withTiming(1, { duration: 90, easing: EASE.out })); }}
      onPressOut={() => { down.set(withTiming(0, { duration: 180, easing: EASE.out })); }}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Animated.View style={[{ height, borderRadius: height / 2, borderWidth: 1, borderColor: border, alignItems: 'center', justifyContent: 'center' }, anim]}>
        <Text style={{ fontFamily: kind === 'brand' ? F.regular : F.medium, fontSize: 16, lineHeight: 20, color }}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

// MARK: - Icons (Phosphor, drawn from the Figma SVGs)

/**
 * Phosphor CaretCircleLeft, 40 x 40, stroke 1.5 (its 256 grid scaled: the ring r 96, the caret
 * 144,88 to 104,128 to 144,168). THE back control, everywhere (Manan, 2026-10-21).
 */
export function CaretCircleLeftIcon() {
  const caret = Skia.PathBuilder.Make();
  caret.moveTo(22.5, 13.75);
  caret.lineTo(16.25, 20);
  caret.lineTo(22.5, 26.25);
  return (
    <Canvas style={{ width: 40, height: 40 }}>
      <Circle cx={20} cy={20} r={15} color={C.icon} style="stroke" strokeWidth={1.5} />
      <Path path={caret.build()} color={C.icon} style="stroke" strokeWidth={1.5} strokeCap="round" strokeJoin="round" />
    </Canvas>
  );
}

/** Phosphor Check, 20 x 20, stroke 2. */
export function CheckIcon({ color = C.contentPrimary }: { color?: string }) {
  const p = Skia.PathBuilder.Make();
  p.moveTo(3.125, 11.25);
  p.lineTo(7.5, 15.625);
  p.lineTo(17.5, 5.625);
  return (
    <Canvas style={{ width: 20, height: 20 }}>
      <Path path={p.build()} color={color} style="stroke" strokeWidth={2} strokeCap="round" strokeJoin="round" />
    </Canvas>
  );
}

/** Phosphor X, 20 x 20, stroke 2. */
export function XIcon({ color = C.icon }: { color?: string }) {
  const p = Skia.PathBuilder.Make();
  p.moveTo(15.625, 4.375);
  p.lineTo(4.375, 15.625);
  p.moveTo(15.625, 15.625);
  p.lineTo(4.375, 4.375);
  return (
    <Canvas style={{ width: 20, height: 20 }}>
      <Path path={p.build()} color={color} style="stroke" strokeWidth={2} strokeCap="round" strokeJoin="round" />
    </Canvas>
  );
}

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <PressScale onPress={onPress} style={{ width: 40, height: 40 }} accessibilityLabel="Back">
      <CaretCircleLeftIcon />
    </PressScale>
  );
}

// MARK: - Text field (DLS "Input element")

type FieldProps = TextInputProps & {
  trailing?: 'none' | 'check' | 'clear';
  onClear?: () => void;
  large?: boolean;
};

export const AhaTextField = forwardRef<TextInput, FieldProps>(function AhaTextField(
  { trailing = 'none', onClear, large = false, style, ...rest }, ref,
) {
  return (
    <View style={[styles.field, { height: large ? 52 : 50 }]}>
      <TextInput
        ref={ref}
        placeholderTextColor={C.placeholder}
        selectionColor={C.contentPrimary}
        style={[styles.input, { fontSize: large ? 20 : 16 }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null, style]}
        {...rest}
      />
      {trailing === 'check' ? <CheckIcon /> : null}
      {trailing === 'clear' ? (
        <Pressable style={({ pressed }) => (pressed ? { opacity: 0.55 } : null)} onPress={() => onClear?.()} accessibilityLabel="Clear" hitSlop={10}>
          <XIcon />
        </Pressable>
      ) : null}
    </View>
  );
});

export function HintText({ text, color = C.contentSecondary }: { text: string; color?: string }) {
  return <Text style={[styles.hint, { color }]}>{text}</Text>;
}

export function ScreenTitle({ text }: { text: string }) {
  return <Text style={styles.title}>{text}</Text>;
}

/** "or" with a hairline either side. */
export function OrDivider() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: C.borderOpaque }} />
      <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.contentPrimary }}>or</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: C.borderOpaque }} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 16,
    backgroundColor: C.backgroundPrimary, borderRadius: 16, borderWidth: 1, borderColor: C.borderSelected,
  },
  input: { flex: 1, paddingHorizontal: 8, fontFamily: F.regular, color: C.contentPrimary, height: '100%' },
  hint: { fontFamily: F.regular, fontSize: 14, lineHeight: lh(14, 2) },
  title: { fontFamily: F.bold, fontSize: 24, lineHeight: lh(24, 2), color: C.contentPrimary },
});
