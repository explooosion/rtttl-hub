import { useState, useRef, useCallback } from "react";
import AvatarEditorComponent from "react-avatar-editor";
import { FaUpload, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

interface AvatarUploadProps {
  currentAvatar?: string;
  onUpload: (blob: Blob) => Promise<void>;
  onCancel: VoidFunction;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

interface AvatarEditor {
  getImage(): HTMLCanvasElement;
  getImageScaledToCanvas(): HTMLCanvasElement;
  getCroppingRect(): { x: number; y: number; width: number; height: number };
}

export function AvatarUpload({ onUpload, onCancel }: AvatarUploadProps) {
  const { t } = useTranslation();
  const [image, setImage] = useState<File | null>(null);
  const [scale, setScale] = useState(1);
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<AvatarEditor | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(t("account.invalidFileType"));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(t("account.fileTooLarge"));
        return;
      }

      setImage(file);
    },
    [t],
  );

  const handleSave = useCallback(async () => {
    if (!editorRef.current) {
      return;
    }

    setUploading(true);
    try {
      const canvas = editorRef.current.getImage();
      canvas.toBlob(
        async (blob: Blob | null) => {
          if (blob) {
            await onUpload(blob);
            toast.success(t("account.avatarUpdated"));
          }
        },
        "image/jpeg",
        0.9,
      );
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error(t("account.uploadFailed"));
    } finally {
      setUploading(false);
    }
  }, [onUpload, t]);

  const handleScaleChange = useCallback(function handleScaleChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    setScale(parseFloat(e.target.value));
  }, []);

  const handleClearImage = useCallback(function handleClearImage() {
    setImage(null);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("account.uploadAvatar")}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {!image ? (
          <div className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 transition-colors hover:border-indigo-500 dark:border-gray-600 dark:hover:border-indigo-400">
              <FaUpload size={48} className="mb-3 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t("account.selectImage")}
              </span>
              <span className="mt-1 text-xs text-gray-400">{t("account.maxSize5MB")}</span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <AvatarEditorComponent
                ref={editorRef}
                image={image}
                width={200}
                height={200}
                border={20}
                borderRadius={100}
                scale={scale}
                rotate={0}
                backgroundColor="#f3f4f6"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                {t("account.zoom")}
              </label>
              <input
                type="range"
                min="1"
                max="2"
                step="0.01"
                value={scale}
                onChange={handleScaleChange}
                className="w-full"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClearImage}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t("actions.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={uploading}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploading ? t("account.uploading") : t("account.save")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
