'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { DICTIONARY, t, SupportedLanguage } from './dictionary';

// Store original English text for DOM text nodes and element attributes
const textNodeOriginals = new WeakMap<Node, string>();
const attrOriginals = new WeakMap<Element, Record<string, string>>();

// Ignore these tags during DOM traversal
const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT', 'TEXTAREA']);

/**
 * Translates a single text string
 */
export function translate(text: string, lang: string): string {
  return t(text, lang);
}

/**
 * Traverses a DOM tree and translates text nodes and placeholders
 */
export function applyDOMTranslations(root: Node, lang: string) {
  if (typeof window === 'undefined' || !root) return;

  const isEnglish = lang === 'English';

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          if (IGNORED_TAGS.has(el.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          // Do not translate inside inputs or contentEditable (except placeholders)
          if (el.tagName === 'INPUT') {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
        if (node.nodeType === Node.TEXT_NODE) {
          const parent = node.parentElement;
          if (!parent || IGNORED_TAGS.has(parent.tagName) || parent.tagName === 'INPUT') {
            return NodeFilter.FILTER_REJECT;
          }
          const val = node.nodeValue?.trim();
          if (!val) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    }
  );

  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      const textNode = current;
      const rawText = textNode.nodeValue || '';
      const trimmed = rawText.trim();

      if (trimmed) {
        // Save original English text if not already saved
        if (!textNodeOriginals.has(textNode)) {
          textNodeOriginals.set(textNode, rawText);
        }

        const original = textNodeOriginals.get(textNode) || rawText;
        const origTrimmed = original.trim();

        if (isEnglish) {
          if (textNode.nodeValue !== original) {
            textNode.nodeValue = original;
          }
        } else {
          const translated = t(origTrimmed, lang);
          if (translated !== origTrimmed) {
            // Preserve leading and trailing spaces
            const leading = original.match(/^\s*/)?.[0] || '';
            const trailing = original.match(/\s*$/)?.[0] || '';
            const newText = leading + translated + trailing;
            if (textNode.nodeValue !== newText) {
              textNode.nodeValue = newText;
            }
          }
        }
      }
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as HTMLElement;

      // Handle placeholder attribute
      if (el.hasAttribute('placeholder')) {
        let origAttrs = attrOriginals.get(el);
        if (!origAttrs) {
          origAttrs = {};
          attrOriginals.set(el, origAttrs);
        }

        if (!('placeholder' in origAttrs)) {
          origAttrs.placeholder = el.getAttribute('placeholder') || '';
        }

        const original = origAttrs.placeholder;
        if (isEnglish) {
          el.setAttribute('placeholder', original);
        } else {
          const translated = t(original, lang);
          el.setAttribute('placeholder', translated);
        }
      }
    }

    current = walker.nextNode();
  }
}

/**
 * React Component that automatically synchronizes DOM text on language and route changes
 */
export function AutoTranslator({ language }: { language: string }) {
  const pathname = usePathname();
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Run immediate translation on root container
    const runTranslation = () => {
      const appRoot = document.body;
      if (appRoot) {
        applyDOMTranslations(appRoot, language);
      }
    };

    runTranslation();

    // Debounced mutation observer to handle dynamically rendered content & modals
    let timeoutId: NodeJS.Timeout;
    const observer = new MutationObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        runTranslation();
      }, 50);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    observerRef.current = observer;

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [language, pathname]);

  return null;
}
