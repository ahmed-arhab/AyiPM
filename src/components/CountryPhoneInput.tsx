'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { COUNTRIES, Country, DEFAULT_COUNTRY, parsePhoneNumber } from '@/data/countries';
import { ChevronDown, Search, Check, AlertCircle } from 'lucide-react';

interface CountryPhoneInputProps {
  value: string;
  onChange: (fullPhoneNumber: string, isValid: boolean) => void;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export default function CountryPhoneInput({
  value,
  onChange,
  required = false,
  disabled = false,
  id = 'phone-input',
}: CountryPhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [digits, setDigits] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTouched, setIsTouched] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse external value on initial mount or when value dramatically changes externally
  useEffect(() => {
    if (value) {
      const parsed = parsePhoneNumber(value);
      setSelectedCountry(parsed.country);
      setDigits(parsed.digits);
    }
  }, []);

  // Filter countries by search query
  const filteredCountries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.toLowerCase().includes(q) ||
        c.iso.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isValid = useMemo(() => {
    if (!digits) return !required;
    return digits.length >= selectedCountry.minDigits && digits.length <= selectedCountry.maxDigits;
  }, [digits, selectedCountry, required]);

  // Handle digit input - ONLY INTEGERS ALLOWED within rules digit limit
  const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTouched(true);
    // Strip all non-digit characters
    const cleanDigits = e.target.value.replace(/\D/g, '');
    // Enforce country maxDigits rule
    const limitedDigits = cleanDigits.slice(0, selectedCountry.maxDigits);
    setDigits(limitedDigits);

    const fullNumber = limitedDigits ? `${selectedCountry.dialCode} ${limitedDigits}` : '';
    const valid = limitedDigits.length >= selectedCountry.minDigits && limitedDigits.length <= selectedCountry.maxDigits;
    onChange(fullNumber, valid);
  };

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');
    
    // Trim existing digits if new country has a lower maxDigits rule
    const adjustedDigits = digits.slice(0, country.maxDigits);
    setDigits(adjustedDigits);
    
    const fullNumber = adjustedDigits ? `${country.dialCode} ${adjustedDigits}` : '';
    const valid = adjustedDigits.length >= country.minDigits && adjustedDigits.length <= country.maxDigits;
    onChange(fullNumber, valid);

    // Focus phone input after selecting country
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const isRuleMet = digits.length >= selectedCountry.minDigits && digits.length <= selectedCountry.maxDigits;
  const isRuleExceededOrShort = isTouched && digits.length > 0 && !isRuleMet;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          borderRadius: 'var(--radius-md)',
          border: isRuleExceededOrShort
            ? '1.5px solid var(--danger, #dc2626)'
            : isRuleMet
            ? '1.5px solid var(--success, #059669)'
            : '1px solid var(--border-subtle)',
          background: 'var(--bg-input, #ffffff)',
          transition: 'all 0.2s ease',
          boxShadow: isRuleExceededOrShort
            ? '0 0 0 3px rgba(220, 38, 38, 0.1)'
            : isRuleMet
            ? '0 0 0 3px rgba(5, 150, 105, 0.1)'
            : 'none',
          position: 'relative',
        }}
        ref={dropdownRef}
      >
        {/* Country Code Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 0.75rem',
            background: 'var(--bg-card-hover, #f1f5f9)',
            border: 'none',
            borderRight: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            outline: 'none',
            transition: 'background 0.15s ease',
          }}
          title={`${selectedCountry.name} (${selectedCountry.dialCode})`}
        >
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{selectedCountry.flag}</span>
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.85rem' }}>
            {selectedCountry.dialCode}
          </span>
          <ChevronDown
            size={14}
            style={{
              color: 'var(--text-muted)',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {/* Integer-only National Phone Number Input */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            ref={inputRef}
            id={id}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            disabled={disabled}
            value={digits}
            onChange={handleDigitsChange}
            onBlur={() => setIsTouched(true)}
            placeholder={selectedCountry.placeholder}
            maxLength={selectedCountry.maxDigits}
            style={{
              width: '100%',
              padding: '0.625rem 2.5rem 0.625rem 0.75rem',
              border: 'none',
              borderRadius: '0 var(--radius-md) var(--radius-md) 0',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.025em',
              outline: 'none',
            }}
          />

          {/* Validation Status Icon inside input */}
          <div
            style={{
              position: 'absolute',
              right: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {isRuleMet ? (
              <Check size={16} style={{ color: 'var(--success, #059669)' }} />
            ) : isRuleExceededOrShort ? (
              <AlertCircle size={16} style={{ color: 'var(--danger, #dc2626)' }} />
            ) : (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--text-muted)',
                }}
              >
                {digits.length}/{selectedCountry.maxDigits}
              </span>
            )}
          </div>
        </div>

        {/* Country Selector Dropdown */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              zIndex: 1000,
              width: '320px',
              maxWidth: '90vw',
              background: 'var(--bg-elevated, #ffffff)',
              border: '1px solid var(--border-medium, #cbd5e1)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease',
            }}
          >
            {/* Search header */}
            <div
              style={{
                padding: '0.625rem',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-card-hover, #f8fafc)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--bg-input, #ffffff)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.6rem',
                }}
              >
                <Search size={14} style={{ color: 'var(--text-muted)' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search country or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.8125rem',
                    color: 'var(--text-primary)',
                    width: '100%',
                  }}
                />
              </div>
            </div>

            {/* Countries list */}
            <div
              style={{
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '0.25rem 0',
              }}
            >
              {filteredCountries.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                  No countries match &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.iso === selectedCountry.iso;
                  return (
                    <button
                      key={c.iso}
                      type="button"
                      onClick={() => handleSelectCountry(c)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        background: isSelected ? 'var(--bg-card-nested-hover, #e0f2fe)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '0.8125rem',
                        color: isSelected ? 'var(--primary, #0284c7)' : 'var(--text-primary)',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover, #f1f5f9)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                        <span style={{ fontSize: '1.15rem' }}>{c.flag}</span>
                        <span style={{ fontWeight: isSelected ? 600 : 400, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {c.name}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({c.iso})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {c.dialCode}
                        </span>
                        {isSelected && <Check size={14} style={{ color: 'var(--primary, #0284c7)' }} />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rules and digits validation banner / helper */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: isRuleExceededOrShort
            ? 'var(--danger, #dc2626)'
            : isRuleMet
            ? 'var(--success, #059669)'
            : 'var(--text-muted)',
          padding: '0 0.15rem',
        }}
      >
        <span>
          {isRuleExceededOrShort ? (
            selectedCountry.minDigits === selectedCountry.maxDigits ? (
              `Must be exactly ${selectedCountry.maxDigits} digits for ${selectedCountry.name}`
            ) : (
              `Must be between ${selectedCountry.minDigits} and ${selectedCountry.maxDigits} digits for ${selectedCountry.name}`
            )
          ) : isRuleMet ? (
            `✓ Valid phone number (${selectedCountry.name})`
          ) : (
            `Rule: ${
              selectedCountry.minDigits === selectedCountry.maxDigits
                ? `${selectedCountry.maxDigits} digits`
                : `${selectedCountry.minDigits}–${selectedCountry.maxDigits} digits`
            } (Integers only)`
          )}
        </span>
        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
          {digits.length}/{selectedCountry.maxDigits}
        </span>
      </div>
    </div>
  );
}
