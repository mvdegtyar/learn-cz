import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

type WordItem = { word: string, colorIdx: number, suffix: 'se' | 'si', checkColor?: string };

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  words: WordItem[] = [];
  panel1Words: WordItem[] = [];
  panel2Words: WordItem[] = [];
  colors: string[] = ['red', 'blue', 'green', 'orange', 'purple', 'teal'];
  private dragData: { item: WordItem, from: string } | null = null;
  private allWords: WordItem[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadWords();
  }

  private loadWords() {
    Promise.all([
      this.http.get('data/czech_reflexive_verbs_se.txt', { responseType: 'text' }).toPromise(),
      this.http.get('data/czech_reflexive_verbs_si.txt', { responseType: 'text' }).toPromise()
    ]).then(([seData, siData]) => {
      const seWords = seData
        ?.split(/\r?\n/)
        .filter(w => w.endsWith('se'))
        .map(w => w.replace(/se$/, '').trim()) || [];
      const siWords = siData
        ?.split(/\r?\n/)
        .filter(w => w.endsWith('si'))
        .map(w => w.replace(/si$/, '').trim()) || [];
      const combined = [
        ...seWords.map((word, idx) => ({ word, colorIdx: idx % this.colors.length, suffix: 'se' as const })),
        ...siWords.map((word, idx) => ({ word, colorIdx: (idx + seWords.length) % this.colors.length, suffix: 'si' as const }))
      ];

      // Shuffle the array
      for (let i = combined.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combined[i], combined[j]] = [combined[j], combined[i]];
      }

      this.allWords = combined;
      this.resetPanels();
    });
  }

  private resetPanels() {
    // Take a new random 20 words for the main panel
    const shuffled = [...this.allWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    this.words = shuffled.slice(0, 20).map(item => ({ ...item, checkColor: undefined }));
    this.panel1Words = [];
    this.panel2Words = [];
  }

  getColor(idx: number): string {
    return this.colors[idx % this.colors.length];
  }

  onDragStart(event: DragEvent, item: WordItem, from: string) {
    this.dragData = { item, from };
    event.dataTransfer?.setData('text/plain', item.word);
  }

  onDragOver(event: DragEvent, panel: string) {
    event.preventDefault();
  }

  onDrop(event: DragEvent, to: string) {
    event.preventDefault();
    if (!this.dragData) return;
    const { item, from } = this.dragData;
    if (from === to) return;

    // Remove from source
    if (from === 'main') {
      this.words = this.words.filter(w => w.word !== item.word);
    } else if (from === 'panel1') {
      this.panel1Words = this.panel1Words.filter(w => w.word !== item.word);
    } else if (from === 'panel2') {
      this.panel2Words = this.panel2Words.filter(w => w.word !== item.word);
    }

    // Add to destination
    if (to === 'main') {
      this.words.push(item);
    } else if (to === 'panel1') {
      this.panel1Words.push(item);
    } else if (to === 'panel2') {
      this.panel2Words.push(item);
    }

    this.dragData = null;
  }

  onCheck() {
    // Reset all checkColor
    this.panel1Words.forEach(item => item.checkColor = undefined);
    this.panel2Words.forEach(item => item.checkColor = undefined);

    // Mark dark gray if suffix does not match panel
    const darkGray = '#616161'; // darker gray for better white text contrast
    this.panel1Words.forEach(item => {
      item.checkColor = item.suffix === 'se' ? this.getColor(item.colorIdx) : darkGray;
    });
    this.panel2Words.forEach(item => {
      item.checkColor = item.suffix === 'si' ? this.getColor(item.colorIdx) : darkGray;
    });
  }

  onRestart() {
    this.resetPanels();
  }
}
