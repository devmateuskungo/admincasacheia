'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const MAX_FILES = 8;
const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/gif';

interface ImageUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFiles: File[];
  onConfirm: (files: File[]) => void;
}

export function ImageUploadModal({
  open,
  onOpenChange,
  currentFiles,
  onConfirm,
}: ImageUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setFiles([...currentFiles]);
      const urls = currentFiles.map((f) => URL.createObjectURL(f));
      setPreviews(urls);
      return () => urls.forEach((u) => URL.revokeObjectURL(u));
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const newFiles = [...files, ...selected].slice(0, MAX_FILES);
    setFiles(newFiles);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return newPreviews;
    });
    e.target.value = '';
  };

  const remove = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    URL.revokeObjectURL(previews[index]);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) previews.forEach((url) => URL.revokeObjectURL(url));
    onOpenChange(next);
  };

  const handleConfirm = () => {
    onConfirm(files);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn('sm:max-w-md')} showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Imagens do produto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={files.length >= MAX_FILES}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center gap-2 text-gray-500 hover:border-[#ED5379] hover:bg-[#ED5379]/5 hover:text-[#ED5379] transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            <Upload className="w-10 h-10" />
            <span className="font-medium">
              Clique ou arraste para adicionar imagens
            </span>
            <span className="text-sm">
              Máximo {MAX_FILES} imagens (JPG, PNG, WebP, GIF)
            </span>
          </button>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                  <Image
                    src={src}
                    alt={`Preview ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remover imagem"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-[#ED5379] text-white rounded-lg hover:opacity-90"
          >
            Confirmar imagens
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
