import {
  StreamLanguage,
  LanguageSupport,
  HighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { Tag } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";
import type { SyntaxColors } from "@/stores/editor_settings_store";

// ─── Custom Lezer tags for each RTTTL token type ───────────────────────────
const rtttlTags = {
  name: Tag.define(),
  separator: Tag.define(),
  settingKey: Tag.define(),
  settingValue: Tag.define(),
  noteDuration: Tag.define(),
  notePitch: Tag.define(),
  noteSharp: Tag.define(),
  noteOctave: Tag.define(),
  noteDot: Tag.define(),
  pause: Tag.define(),
  comma: Tag.define(),
};

const TOKEN_TABLE: Record<string, Tag> = {
  "rtttl-name": rtttlTags.name,
  "rtttl-sep": rtttlTags.separator,
  "rtttl-setting-key": rtttlTags.settingKey,
  "rtttl-setting-val": rtttlTags.settingValue,
  "rtttl-note-dur": rtttlTags.noteDuration,
  "rtttl-note-pitch": rtttlTags.notePitch,
  "rtttl-note-sharp": rtttlTags.noteSharp,
  "rtttl-note-oct": rtttlTags.noteOctave,
  "rtttl-note-dot": rtttlTags.noteDot,
  "rtttl-pause": rtttlTags.pause,
  "rtttl-comma": rtttlTags.comma,
};

// ─── State machine sections ─────────────────────────────────────────────────
type Section = "name" | "defaults" | "note-start" | "after-pitch";

// ─── Full RTTTL language (name:defaults:notes) ──────────────────────────────
const rtttlLanguage = StreamLanguage.define<{ section: Section }>({
  name: "rtttl",
  startState: () => ({ section: "name" }),
  token(stream, state) {
    if (state.section === "name") {
      if (stream.eat(":")) {
        state.section = "defaults";
        return "rtttl-sep";
      }
      if (stream.eatWhile(/[^:]/)) {
        return "rtttl-name";
      }
    }

    if (state.section === "defaults") {
      if (stream.eat(":")) {
        state.section = "note-start";
        return "rtttl-sep";
      }
      if (stream.match(/[dob](?==)/i)) {
        return "rtttl-setting-key";
      }
      if (stream.eat("=")) {
        return "rtttl-sep";
      }
      if (stream.match(/[0-9]+/)) {
        return "rtttl-setting-val";
      }
      if (stream.eat(",")) {
        return "rtttl-comma";
      }
    }

    if (state.section === "note-start") {
      if (stream.eatSpace()) {
        return null;
      }
      if (stream.eat(",")) {
        return "rtttl-comma";
      }
      if (stream.match(/[0-9]+/)) {
        return "rtttl-note-dur";
      }
      if (stream.eat(/p/i)) {
        state.section = "after-pitch";
        return "rtttl-pause";
      }
      if (stream.eat(/[a-g]/i)) {
        state.section = "after-pitch";
        return "rtttl-note-pitch";
      }
    }

    if (state.section === "after-pitch") {
      if (stream.eat(",")) {
        state.section = "note-start";
        return "rtttl-comma";
      }
      if (stream.eat("#")) {
        return "rtttl-note-sharp";
      }
      if (stream.eat(".")) {
        return "rtttl-note-dot";
      }
      if (stream.match(/[0-9]+/)) {
        return "rtttl-note-oct";
      }
      if (stream.eatSpace()) {
        return null;
      }
      state.section = "note-start";
    }

    stream.next();
    return null;
  },
  blankLine() {},
  copyState: (state) => ({ ...state }),
  indent: () => null,
  languageData: {},
  tokenTable: TOKEN_TABLE,
});

// ─── Notes-only language (for StructuredMode CodeEditor) ────────────────────
const rtttlNotesLanguage = StreamLanguage.define<{ section: Section }>({
  name: "rtttl-notes",
  startState: () => ({ section: "note-start" }),
  token(stream, state) {
    if (state.section === "note-start") {
      if (stream.eatSpace()) {
        return null;
      }
      if (stream.eat(",")) {
        return "rtttl-comma";
      }
      if (stream.match(/[0-9]+/)) {
        return "rtttl-note-dur";
      }
      if (stream.eat(/p/i)) {
        state.section = "after-pitch";
        return "rtttl-pause";
      }
      if (stream.eat(/[a-g]/i)) {
        state.section = "after-pitch";
        return "rtttl-note-pitch";
      }
    }

    if (state.section === "after-pitch") {
      if (stream.eat(",")) {
        state.section = "note-start";
        return "rtttl-comma";
      }
      if (stream.eat("#")) {
        return "rtttl-note-sharp";
      }
      if (stream.eat(".")) {
        return "rtttl-note-dot";
      }
      if (stream.match(/[0-9]+/)) {
        return "rtttl-note-oct";
      }
      if (stream.eatSpace()) {
        return null;
      }
      state.section = "note-start";
    }

    stream.next();
    return null;
  },
  blankLine() {},
  copyState: (state) => ({ ...state }),
  indent: () => null,
  languageData: {},
  tokenTable: TOKEN_TABLE,
});

// ─── Public API ─────────────────────────────────────────────────────────────
export function rtttlLanguageSupport(): LanguageSupport {
  return new LanguageSupport(rtttlLanguage);
}

export function rtttlNotesLanguageSupport(): LanguageSupport {
  return new LanguageSupport(rtttlNotesLanguage);
}

export function buildHighlightExtension(colors: SyntaxColors): Extension {
  return syntaxHighlighting(
    HighlightStyle.define([
      { tag: rtttlTags.name, color: colors.name, fontWeight: "600" },
      { tag: rtttlTags.separator, color: colors.separator },
      { tag: rtttlTags.settingKey, color: colors.settingKey, fontWeight: "600" },
      { tag: rtttlTags.settingValue, color: colors.settingValue },
      { tag: rtttlTags.noteDuration, color: colors.noteDuration },
      { tag: rtttlTags.notePitch, color: colors.notePitch, fontWeight: "700" },
      { tag: rtttlTags.noteSharp, color: colors.noteSharp },
      { tag: rtttlTags.noteOctave, color: colors.noteOctave },
      { tag: rtttlTags.noteDot, color: colors.noteDot },
      { tag: rtttlTags.pause, color: colors.pause, fontStyle: "italic" },
      { tag: rtttlTags.comma, color: colors.comma },
    ]),
  );
}
