import { useHotkeys } from "react-hotkeys-hook";

import { platformShortcut } from "../utils/keyboard_utils";

interface UseCreatePageHotkeysParams {
  undo: VoidFunction;
  redo: VoidFunction;
  handlePlayToggle: VoidFunction;
  handleSetLoopIn: VoidFunction;
  handleSetLoopOut: VoidFunction;
  handleNew: VoidFunction;
  handleImportClick: VoidFunction;
  handleSubmit: VoidFunction;
  handleAddTrack: VoidFunction;
  handleDeleteRegion: VoidFunction;
  canCutRegion: boolean;
}

export function useCreatePageHotkeys({
  undo,
  redo,
  handlePlayToggle,
  handleSetLoopIn,
  handleSetLoopOut,
  handleNew,
  handleImportClick,
  handleSubmit,
  handleAddTrack,
  handleDeleteRegion,
  canCutRegion,
}: UseCreatePageHotkeysParams) {
  useHotkeys(
    platformShortcut("z"),
    (e) => {
      e.preventDefault();
      undo();
    },
    { preventDefault: true },
  );
  useHotkeys(
    platformShortcut("shift+z"),
    (e) => {
      e.preventDefault();
      redo();
    },
    { preventDefault: true },
  );
  useHotkeys(
    platformShortcut("y"),
    (e) => {
      e.preventDefault();
      redo();
    },
    { preventDefault: true },
  );

  useHotkeys(
    "space",
    (e) => {
      e.preventDefault();
      handlePlayToggle();
    },
    { enableOnFormTags: false, preventDefault: true },
  );
  useHotkeys(
    "i",
    (e) => {
      e.preventDefault();
      handleSetLoopIn();
    },
    { enableOnFormTags: false, preventDefault: true },
  );
  useHotkeys(
    "o",
    (e) => {
      e.preventDefault();
      handleSetLoopOut();
    },
    { enableOnFormTags: false, preventDefault: true },
  );

  useHotkeys(
    platformShortcut("alt+n"),
    (e) => {
      e.preventDefault();
      handleNew();
    },
    { preventDefault: true },
  );
  useHotkeys(
    platformShortcut("i"),
    (e) => {
      e.preventDefault();
      handleImportClick();
    },
    { preventDefault: true },
  );
  useHotkeys(
    platformShortcut("s"),
    (e) => {
      e.preventDefault();
      handleSubmit();
    },
    { preventDefault: true },
  );

  useHotkeys(
    platformShortcut("="),
    (e) => {
      e.preventDefault();
      handleAddTrack();
    },
    { preventDefault: true },
  );
  useHotkeys(
    "delete",
    (e) => {
      if (canCutRegion) {
        e.preventDefault();
        handleDeleteRegion();
      }
    },
    { enableOnFormTags: false },
  );
  useHotkeys(
    "backspace",
    (e) => {
      if (canCutRegion) {
        e.preventDefault();
        handleDeleteRegion();
      }
    },
    { enableOnFormTags: false },
  );
}
