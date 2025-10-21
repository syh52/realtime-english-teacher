// Text-to-Speech 功能的类型定义

export type VoiceType = 'alloy' | 'echo' | 'shimmer';
export type AudioFormat = 'mp3';

export interface TTSConfig {
  voice: VoiceType;
  speed: number; // 0.25 - 4.0
  format: AudioFormat;
}

export interface TTSHistory {
  id: string;
  title: string;
  text: string;
  config: TTSConfig;
  audioUrl?: string;
  createdAt: string;
}

export interface TTSRequest {
  text: string;
  voice: VoiceType;
  speed: number;
  format: AudioFormat;
}
