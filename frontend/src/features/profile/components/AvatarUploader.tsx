'use client';

import { useRef } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { Avatar, Button } from '@/components/ui';
import { useAvatarUpload } from '../hooks/useAvatarUpload';
import styles from './AvatarUploader.module.css';

interface AvatarUploaderProps {
  userId: string;
  name: string;
  avatar?: string;
}

export function AvatarUploader({ userId, name, avatar }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { processing, onFileChange, removePhoto } = useAvatarUpload(userId);
  const openPicker = () => inputRef.current?.click();

  return (
    <div className={styles.uploader}>
      <button
        type="button"
        className={styles.preview}
        onClick={openPicker}
        disabled={processing}
        aria-label={avatar ? 'Change profile photo' : 'Upload profile photo'}
      >
        <Avatar name={name} src={avatar} size={104} />
        <span className={styles.overlay} aria-hidden>
          {processing ? <Loader2 size={22} className="spin" /> : <Camera size={22} />}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={onFileChange} tabIndex={-1} aria-hidden />
      <div className={styles.actions}>
        <Button size="sm" variant="secondary" icon={Camera} onClick={openPicker} loading={processing}>
          {avatar ? 'Change photo' : 'Upload photo'}
        </Button>
        {avatar && (
          <Button size="sm" variant="ghost" icon={Trash2} onClick={removePhoto} disabled={processing}>
            Remove
          </Button>
        )}
      </div>
      <p className={styles.hint}>JPG, PNG or WebP · up to 2 MB</p>
    </div>
  );
}
