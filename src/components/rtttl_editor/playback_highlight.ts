import { StateField, StateEffect } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import type { NoteOffset } from "@/utils/rtttl_parser";

export const setActiveNote = StateEffect.define<{
  noteIndex: number;
  offsets: NoteOffset[];
}>();

export const clearActiveNote = StateEffect.define<null>();

const activeNoteMark = Decoration.mark({ class: "cm-rtttl-active-note" });

const playbackField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decos, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setActiveNote)) {
        const { noteIndex, offsets } = effect.value;
        const offset = offsets[noteIndex];
        if (!offset || offset.from >= offset.to) {
          return Decoration.none;
        }
        const maxPos = tr.newDoc.length;
        const from = Math.min(offset.from, maxPos);
        const to = Math.min(offset.to, maxPos);
        if (from >= to) {
          return Decoration.none;
        }
        return Decoration.set([activeNoteMark.range(from, to)]);
      }
      if (effect.is(clearActiveNote)) {
        return Decoration.none;
      }
    }
    return decos.map(tr.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

export function playbackHighlightExtension(): Extension {
  return playbackField;
}
