import React, { Component, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={s.container}>
        <Text style={s.emoji}>🐾</Text>
        <Text style={s.title}>Something went wrong</Text>
        <Text style={s.msg}>{this.state.error?.message}</Text>
        <TouchableOpacity
          style={s.btn}
          onPress={() => this.setState({ hasError: false, error: null })}
        >
          <Text style={s.btnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#08080C', padding: 24 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#F5F5FA', marginBottom: 8 },
  msg: { fontSize: 14, color: '#9898B0', textAlign: 'center', marginBottom: 24 },
  btn: { backgroundColor: '#8B5CF6', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
});
