import Link from 'next/link';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { ROUTES } from '@/constants/navigation';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.noise} aria-hidden="true" />

      <header className={styles.header}>
        <Link href={ROUTES.dashboard} aria-label="AyiPM dashboard" className={styles.logo}>
          <BrandLogo size="md" />
        </Link>
      </header>

      <section className={styles.content} aria-labelledby="not-found-title">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Wrong turn?</p>
          <h1 id="not-found-title">This page slipped off the board.</h1>
          <p className={styles.description}>
            The link may be outdated, or the page may have moved somewhere else in your workspace.
          </p>
          <div className={styles.actions}>
            <Link href={ROUTES.dashboard} className="btn btn-primary">
              <LayoutDashboard size={16} />
              Back to dashboard
            </Link>
            <Link href={ROUTES.projects} className="btn btn-ghost">
              <ArrowLeft size={16} />
              View projects
            </Link>
          </div>
        </div>

        <div className={styles.artwork} aria-hidden="true">
          <div className={styles.number}>4</div>
          <div className={styles.portal}>
            <div className={styles.portalInner}>
              <div className={styles.face}>
                <i className={styles.earLeft} />
                <i className={styles.earRight} />
                <span className={styles.eyeLeft} />
                <span className={styles.eyeRight} />
                <span className={styles.nose} />
              </div>
              <div className={styles.note}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
          <div className={`${styles.number} ${styles.lastNumber}`}>4</div>
          <span className={styles.orbit} />
          <span className={styles.dotOne} />
          <span className={styles.dotTwo} />
        </div>
      </section>

      <footer className={styles.footer}>
        <span>AYIPM / LOST &amp; FOUND</span>
        <span>KEEPING WORK ON TRACK</span>
      </footer>
    </main>
  );
}
