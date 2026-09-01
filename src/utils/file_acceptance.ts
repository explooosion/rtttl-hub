const MIDI_EXTENSIONS = [".mid", ".midi"];
const AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg", ".flac", ".aac"];

export function isAcceptedMidiFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  const isByExtension = MIDI_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const isByMime = ["audio/midi", "audio/mid", "audio/x-midi"].includes(file.type.toLowerCase());
  return isByExtension || isByMime;
}

export function isAcceptedAudioFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  const isByExtension = AUDIO_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const isByMime = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/aac"].includes(
    file.type.toLowerCase(),
  );
  return isByExtension || isByMime;
}
