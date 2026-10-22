import { describe, expect, it } from 'vitest';
import { escapeCsvCell, toCsv } from './csv';

describe('escapeCsvCell', () => {
  it('leaves plain text and numbers as they are', () => {
    expect(escapeCsvCell('Website redesign')).toBe('Website redesign');
    expect(escapeCsvCell(42)).toBe('42');
    expect(escapeCsvCell(0)).toBe('0');
    expect(escapeCsvCell(1.5)).toBe('1.5');
  });

  it('writes missing values as empty cells', () => {
    expect(escapeCsvCell(undefined)).toBe('');
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell('')).toBe('');
  });

  it('quotes cells with commas, quotes or line breaks, doubling the quotes', () => {
    expect(escapeCsvCell('Smith, Jane')).toBe('"Smith, Jane"');
    expect(escapeCsvCell('Say "hi"')).toBe('"Say ""hi"""');
    expect(escapeCsvCell('"')).toBe('""""');
    expect(escapeCsvCell('line 1\nline 2')).toBe('"line 1\nline 2"');
    expect(escapeCsvCell('line 1\r\nline 2')).toBe('"line 1\r\nline 2"');
  });

  it.each(['=SUM(A1:A9)', '+1', '-1', '@cmd', '=HYPERLINK("http://example.com")'])(
    'stops a spreadsheet from running %j as a formula',
    (value) => {
      const cell = escapeCsvCell(value);
      expect(cell.replace(/^"/, '')).toMatch(/^'/);
      expect(cell).toContain(value.replace(/"/g, '""'));
    }
  );

  it('prefixes formula triggers and still quotes the cell when needed', () => {
    expect(escapeCsvCell('=1+2')).toBe("'=1+2");
    expect(escapeCsvCell('=1,2')).toBe(`"'=1,2"`);
    expect(escapeCsvCell('=HYPERLINK("http://example.com")')).toBe(`"'=HYPERLINK(""http://example.com"")"`);
    expect(escapeCsvCell('-\n=1')).toBe(`"'-\n=1"`);
  });

  it('prefixes values that start with a tab or a carriage return', () => {
    expect(escapeCsvCell('\t=1')).toBe("'\t=1");
    expect(escapeCsvCell('\r=1')).toBe(`"'\r=1"`);
  });

  it('leaves values alone when a trigger character is not first', () => {
    expect(escapeCsvCell('a=b')).toBe('a=b');
    expect(escapeCsvCell('jane@example.com')).toBe('jane@example.com');
    expect(escapeCsvCell('—')).toBe('—');
  });

  it('keeps negative numbers numeric', () => {
    expect(escapeCsvCell(-5)).toBe('-5');
  });
});

describe('toCsv', () => {
  it('joins cells with commas and rows with CRLF', () => {
    expect(
      toCsv([
        ['Title', 'Hours'],
        ['Write docs', 2.5],
        ['Review, merge', undefined],
      ])
    ).toBe('Title,Hours\r\nWrite docs,2.5\r\n"Review, merge",');
  });

  it('escapes every cell', () => {
    expect(toCsv([['=cmd', 'a"b', null]])).toBe(`'=cmd,"a""b",`);
  });

  it('gives an empty string for no rows', () => {
    expect(toCsv([])).toBe('');
  });
});
