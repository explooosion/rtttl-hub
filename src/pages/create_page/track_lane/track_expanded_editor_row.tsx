import { FaEraser } from "react-icons/fa";

import { RtttlEditorInput } from "../../../components/rtttl_editor/rtttl_editor_input";
import { CopyButton } from "./copy_button";
import type { RtttlEditorInputHandle } from "../../../components/rtttl_editor/rtttl_editor_input";

interface TrackExpandedEditorRowProps {
  onContainerClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onClearCodeClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  clearCodeTitle: string;
  code: string;
  fontSize: number;
  currentTrackNoteIndex: number;
  editorRef: (handle: RtttlEditorInputHandle | null) => void;
  onChange: (value: string) => void;
}

export function TrackExpandedEditorRow({
  onContainerClick,
  onClearCodeClick,
  clearCodeTitle,
  code,
  fontSize,
  currentTrackNoteIndex,
  editorRef,
  onChange,
}: TrackExpandedEditorRowProps) {
  return (
    <div
      className="flex border-t border-gray-200 dark:border-gray-800/50"
      onClick={onContainerClick}
    >
      <div className="sticky left-0 z-10 flex w-48 shrink-0 items-center gap-1 border-t border-r border-gray-400 bg-gray-200 px-2.5 py-1.5 dark:border-gray-800 dark:bg-gray-900">
        <button
          type="button"
          onClick={onClearCodeClick}
          title={clearCodeTitle}
          className="flex h-7 w-7 items-center justify-center rounded border border-gray-400 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
        >
          <FaEraser size={11} />
        </button>
        <CopyButton text={code} disabled={!code.trim()} />
      </div>

      <div className="min-w-0 flex-1">
        <RtttlEditorInput
          ref={editorRef}
          value={code}
          fontSize={fontSize}
          showToolbar={false}
          containerClassName="overflow-hidden bg-gray-200 dark:bg-gray-900"
          noteIndexOverride={currentTrackNoteIndex}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
