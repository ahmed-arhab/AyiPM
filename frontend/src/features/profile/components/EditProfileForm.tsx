'use client';

import { useId } from 'react';
import { Mail, MapPin, Phone, RotateCcw, Save, User, UserPen } from 'lucide-react';
import { Button, Card, CardHeader, Field, FormGrid, Input, Textarea } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Employee } from '@/types';
import { useProfileForm } from '../hooks/useProfileForm';
import { BIO_MAX_LENGTH } from '../utils';
import styles from './EditProfileForm.module.css';

export function EditProfileForm({ user }: { user: Employee }) {
  const { values, errors, dirty, saving, setField, reset, submit } = useProfileForm(user);
  const id = useId();
  const bioLength = values.bio.length;

  return (
    <Card as="section" aria-labelledby={`${id}-title`}>
      <CardHeader
        icon={UserPen}
        title={<span id={`${id}-title`}>Edit profile</span>}
        description="Update the personal details your colleagues see across AyiPM."
      />
      <form className={styles.form} onSubmit={submit} noValidate>
        <FormGrid>
          <Field label="Full name" htmlFor={`${id}-name`} required error={errors.name}>
            <Input
              id={`${id}-name`}
              icon={User}
              value={values.name}
              onChange={(e) => setField('name', e.target.value)}
              invalid={Boolean(errors.name)}
              autoComplete="name"
              placeholder="Your full name"
            />
          </Field>
          <Field label="Work email" htmlFor={`${id}-email`} required error={errors.email}>
            <Input
              id={`${id}-email`}
              type="email"
              icon={Mail}
              value={values.email}
              onChange={(e) => setField('email', e.target.value)}
              invalid={Boolean(errors.email)}
              autoComplete="email"
              placeholder="name@company.com"
            />
          </Field>
          <Field label="Phone" htmlFor={`${id}-phone`} error={errors.phone} hint="Optional · include your country code">
            <Input
              id={`${id}-phone`}
              type="tel"
              icon={Phone}
              value={values.phone}
              onChange={(e) => setField('phone', e.target.value)}
              invalid={Boolean(errors.phone)}
              autoComplete="tel"
              placeholder="+94 77 123 4567"
            />
          </Field>
          <Field label="Location" htmlFor={`${id}-location`} error={errors.location} hint="Optional · city or office">
            <Input
              id={`${id}-location`}
              icon={MapPin}
              value={values.location}
              onChange={(e) => setField('location', e.target.value)}
              invalid={Boolean(errors.location)}
              autoComplete="address-level2"
              placeholder="City, Country"
            />
          </Field>
        </FormGrid>
        <Field
          label="Bio"
          htmlFor={`${id}-bio`}
          error={errors.bio}
          aside={
            <span className={cn(styles.counter, bioLength > BIO_MAX_LENGTH && styles.counterOver)} aria-live="polite">
              {bioLength}/{BIO_MAX_LENGTH}
            </span>
          }
        >
          <Textarea
            id={`${id}-bio`}
            rows={4}
            value={values.bio}
            onChange={(e) => setField('bio', e.target.value)}
            invalid={Boolean(errors.bio)}
            placeholder="A short introduction: what you work on, your expertise, how to reach you."
          />
        </Field>
        <div className={styles.footer}>
          <p className={styles.note}>
            Role, department and designation are managed {user.role === 'admin' ? 'from the Team page' : 'by your administrator'}.
          </p>
          <div className={styles.actions}>
            <Button variant="secondary" icon={RotateCcw} onClick={reset} disabled={!dirty}>
              Reset
            </Button>
            <Button type="submit" icon={Save} disabled={!dirty} loading={saving}>
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
