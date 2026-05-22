import { Pipe, PipeTransform } from '@angular/core';

const LOWERCASE_WORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'y', 'e', 'o', 'u',
  'en', 'con', 'por', 'para', 'a', 'al', 'sin', 'sobre', 'entre',
]);

@Pipe({ name: 'titleCaseEs', standalone: true, pure: true })
export class TitleCaseEsPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return value
      .toLowerCase()
      .split(' ')
      .map((word, i) =>
        i === 0 || !LOWERCASE_WORDS.has(word)
          ? word.charAt(0).toUpperCase() + word.slice(1)
          : word,
      )
      .join(' ');
  }
}
