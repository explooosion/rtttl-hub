const ACCEPTED_MIDI_TYPES = ["audio/midi", "audio/mid", "audio/x-midi"];
const ACCEPTED_MIDI_EXTENSIONS = [".mid", ".midi"];

export function isMidiFile(file: File): boolean {
  if (ACCEPTED_MIDI_TYPES.includes(file.type)) {
    return true;
  }
  const lowerName = file.name.toLowerCase();
  return ACCEPTED_MIDI_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}
