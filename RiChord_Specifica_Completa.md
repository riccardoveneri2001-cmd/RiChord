# RiChord — Specifica Visiva, Funzionale e di Flusso Completa

Documento di riferimento definitivo per lo sviluppo. Contiene: identità visiva, palette colori, tipografia, layout globale, flusso completo di navigazione, descrizione schermata per schermata con tutti i componenti, comportamenti, animazioni e stati. Claude Code deve seguire questo documento come fonte di verità assoluta.

---

## 1. Identità visiva globale

### Palette colori (Slate & Sky)

| Ruolo | Valore |
|---|---|
| Sfondo pagina | `#F5F4F1` |
| Superficie card | `#FFFFFF` |
| Bordo card | `#E0DED8` (0.5px) |
| Blu primario | `#2176AE` |
| Blu accento chiaro (chip, pillole) | `#E0F0FA` |
| Testo primario | `#1C2333` |
| Testo secondario | `#8A94A6` |
| Testo disabilitato / frecce | `#C8CDD8` |
| Rosso distruttivo | `#C0392B` |
| Sfondo icona rossa | `#FDE8E8` |
| Sfondo icona verde | `#E8F5E9` |
| Testo icona verde | `#2E7D32` |
| Sfondo icona viola (setlist) | `#EDE9FE` |
| Testo icona viola (setlist) | `#5B21B6` |
| Separatore interno card | `#F0EEEB` |
| Arancione modifiche non salvate | `#E67E22` |

### Tipografia

- **Font UI globale**: `-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif` — su iPhone corrisponde automaticamente a SF Pro, nessun import necessario
- **Titoli pagina**: 26px, weight 700, letter-spacing -0.5px, colore `#1C2333`
- **Titoli topbar**: 17px, weight 600, colore `#1C2333`
- **Testo card principale**: 15–16px, weight 500, colore `#1C2333`
- **Testo secondario / artista / meta**: 13px, weight 400, colore `#8A94A6`
- **Label sezione**: 12px, weight 500, uppercase, letter-spacing 0.06em, colore `#8A94A6`
- **Accordi nel render ChordPro**: `-apple-system, 'SF Pro Rounded'`, 15px, weight 700, colore `#2176AE`
- **Testo lirica nel render ChordPro**: `-apple-system, 'SF Pro Text'`, 17px, weight 400, colore `#1C2333`
- **Logo**: "Ri" in `#1C2333` + "Chord" in `#2176AE`, 22px (topbar) / 32px (login), weight 700, letter-spacing -0.5px

### Bordi e raggi

| Elemento | Border-radius | Bordo |
|---|---|---|
| Card standard | 12–14px | 0.5px solid `#E0DED8` |
| Pulsanti icona topbar | 8px | 0.5px solid `#E0DED8` |
| Chip / pillole tonalità | 20px | nessuno |
| Bottom sheet | 24px 24px 0 0 | 0.5px solid `#E0DED8` in cima |
| Modal | 16px | nessuno |
| Input campi | 12px | 0.5px solid `#E0DED8` |
| Pulsante primario | 12px | nessuno |
| Badge stato | 20px | nessuno |

### Animazioni globali

- **Transizioni di pagina**: fade leggero, 200ms, ease-in-out
- **Apertura bottom sheet**: slide up dal basso, 300ms, spring curve (iOS style)
- **Chiusura bottom sheet**: slide down, 250ms, ease-in
- **Comparsa/scomparsa UI brano**: opacity 0↔1, 300ms, ease
- **Toggle dark mode**: 200ms, spring
- **Toast**: slide in dall'alto 250ms → resta 2.5s → slide out verso l'alto 200ms
- **Feedback tap card**: sfondo `#F5F4F1` per 100ms poi torna a `#FFFFFF`
- **Drag & drop**: scala 1.02× + ombra `0 4px 12px rgba(0,0,0,0.10)` sull'elemento trascinato

### Bottom navigation bar

Presente in tutte le schermate principali (Libreria, Setlist, Condivisi, Profilo).

- Posizione: fissa in fondo
- Sfondo: `#FFFFFF`
- Bordo superiore: `0.5px solid #E0DED8`
- Padding: `8px 0 16px` (16px extra per iPhone home indicator)
- 4 voci: **Libreria** (`ti-music`) · **Setlist** (`ti-list`) · **Condivisi** (`ti-share`) · **Profilo** (`ti-user`)
- Icona attiva: `#2176AE` — inattiva: `#C8CDD8`
- Label: 10px, weight 500 — attiva `#2176AE`, inattiva `#C8CDD8`
- Tap: cambia schermata con fade, aggiorna voce attiva

### Toast notifications

- Posizione: in alto al centro, sotto la status bar
- Sfondo: `#1C2333`, border-radius 12px, padding `10px 16px`
- Testo: 14px, weight 500, `#FFFFFF`
- Messaggi standard: "Brano salvato" · "Link copiato" · "Setlist creata" · "File importato" · "Esportazione completata" · "Modifiche scartate"

### Modal di conferma eliminazione

- Overlay: `rgba(28,35,51,0.45)` sull'intera schermata
- Card centrata: sfondo `#FFFFFF`, border-radius 16px, padding `24px`, margin `0 32px`
- Titolo: 17px, weight 600, `#1C2333`
- Descrizione: 14px, `#8A94A6`, line-height 1.5
- Pulsante distruttivo: sfondo `#C0392B`, testo `#FFFFFF`, border-radius 12px, padding `13px`, 15px weight 600
- Pulsante annulla: sfondo `#F5F4F1`, testo `#1C2333`, border-radius 12px, padding `13px`, 15px weight 500
- Tap annulla o tap overlay: chiude senza azione

---

## 2. Flusso completo di navigazione

```
App
├── Login / Registrazione
│   └── (autenticato) → Libreria
├── Libreria (Home)
│   ├── Tap brano → Visualizzazione brano
│   │   └── Tap condividi → Bottom sheet condivisione
│   └── Tap + → Scelta tipo
│       ├── Crea ChordPro → Editor (Step 1: testo → Step 2: accordi)
│       └── Importa file → Picker file → Libreria
├── Setlist
│   ├── Tap setlist → Dettaglio setlist
│   │   ├── Tap brano → Visualizzazione brano
│   │   └── Tap condividi → Bottom sheet condivisione
│   └── Tap + → Crea setlist
├── Condivisi
│   └── Lista link attivi e scaduti
└── Profilo
    ├── Cambia email
    ├── Cambia password
    ├── Preferenze (dark mode, notazione)
    ├── Esporta brani
    └── Elimina account
```

---

## 3. Schermata — Login e Registrazione

### Quando appare
Solo al primo avvio o se la sessione è scaduta. Dopo il login la sessione rimane attiva a tempo indeterminato.

### Layout
- Sfondo: `#F5F4F1`
- Struttura: status bar → logo + tagline → tab (Accedi / Registrati) → campi → pulsante principale → divisore → pulsante Google

### Logo e tagline
- Logo: "RiChord" 32px weight 700, "Chord" in `#2176AE`
- Tagline: "La tua libreria musicale, sempre pronta.", 15px, `#8A94A6`
- Margin bottom: 36px

### Tab Accedi / Registrati
- Contenitore: sfondo `#FFFFFF`, border-radius 12px, bordo `0.5px solid #E0DED8`, padding 4px
- Tab attivo: sfondo `#2176AE`, testo `#FFFFFF`, border-radius 8px
- Tab inattivo: sfondo trasparente, testo `#8A94A6`
- Animazione switch: 200ms

**Tab Accedi — campi:**
- Email (type email, placeholder "nome@email.com")
- Password (type password, placeholder "••••••••")
- Link "Password dimenticata?" allineato a destra, 13px, `#2176AE`
- Pulsante "Accedi"

**Tab Registrati — campi:**
- Nome (type text)
- Email (type email)
- Password (type password)
- Conferma password (type password)
- Pulsante "Crea account"
- Il link "Password dimenticata?" non appare in questa tab

### Campi input
- Sfondo `#FFFFFF`, border-radius 12px, bordo `0.5px solid #E0DED8`, padding `13px 14px`
- Font size: 16px (evita zoom automatico iOS), colore `#1C2333`
- Focus: bordo diventa `0.5px solid #2176AE`
- Label sopra ogni campo: 13px, weight 500, `#8A94A6`

### Pulsante primario
- Sfondo `#2176AE`, border-radius 12px, padding `15px`, 16px weight 600, `#FFFFFF`
- Larghezza 100%

### Divisore
- Riga con testo "oppure" centrato, 13px `#8A94A6`, linee laterali `0.5px solid #E0DED8`

### Pulsante Google
- Sfondo `#FFFFFF`, border-radius 12px, bordo `0.5px solid #E0DED8`, padding `15px`
- Logo Google SVG a sinistra + testo "Continua con Google", 15px weight 500, `#1C2333`
- Tap: avvia flusso OAuth Google tramite Supabase, redirect automatico alla Libreria

### Recupero password
- Tap su "Password dimenticata?": naviga a schermata separata con campo email e pulsante "Invia link di recupero"
- Toast di conferma: "Email inviata — controlla la tua casella"

---

## 4. Schermata — Libreria (Home)

### Quando appare
È la schermata home dopo il login. Si torna qui sempre premendo "Libreria" nella bottom nav.

### Layout
Status bar → header (logo + ricerca) → filtri → contatore → lista brani → FAB → bottom nav

### Header
- Padding: `8px 20px 12px`, sfondo `#F5F4F1`
- Logo "RiChord" 22px weight 700
- Sotto: barra di ricerca

### Barra di ricerca
- Sfondo `#FFFFFF`, border-radius 12px, bordo `0.5px solid #E0DED8`, padding `10px 14px`
- Icona `ti-search` 16px `#8A94A6` a sinistra
- Placeholder: "Cerca brano, artista, tag…", 14px, `#8A94A6`
- Al tap: tastiera aperta, filtro in tempo reale durante la digitazione
- Ricerca parziale su titolo, artista e tag ("amor" trova "Ti amo", "Amorevole")
- Al tap fuori: tastiera chiusa, se campo vuoto lista torna completa

### Filtri orizzontali
- Scroll orizzontale senza scrollbar visibile, padding `0 20px 10px`
- Chip: `Tutti` · `ChordPro` · `PDF` · `Immagine` + tag dell'utente
- Chip attivo: sfondo `#2176AE`, testo `#FFFFFF`
- Chip inattivo: sfondo `#FFFFFF`, testo `#8A94A6`, bordo `0.5px solid #E0DED8`
- Border-radius: 20px, padding `6px 14px`, font 13px weight 500
- Tap: filtra lista istantaneamente. "Tutti" azzera tutti i filtri attivi

### Contatore brani
- "N brani", 12px, `#8A94A6`, padding `0 20px 10px`
- Si aggiorna in tempo reale durante ricerca e filtri

### Card brano
- Sfondo `#FFFFFF`, border-radius 12px, bordo `0.5px solid #E0DED8`, padding `12px 14px`
- Gap tra card: 6px, padding lista `0 20px`
- Layout: icona tipo (36×36px) → info brano (flex 1) → freccia destra

**Icona tipo** (border-radius 8px):
- ChordPro: sfondo `#E0F0FA`, icona `ti-music`, colore `#2176AE`
- PDF: sfondo `#FDE8E8`, icona `ti-file-text`, colore `#C0392B`
- Immagine: sfondo `#E8F5E9`, icona `ti-photo`, colore `#2E7D32`

**Info brano:**
- Titolo: 15px weight 500 `#1C2333`, troncato con ellipsis
- Artista: 13px `#8A94A6`
- Pillola tonalità (solo ChordPro): 12px weight 500 `#2176AE`, sfondo `#E0F0FA`, border-radius 20px, padding `2px 8px`

**Freccia:** `ti-chevron-right`, 16px, `#C8CDD8`

**Interazioni:**
- Tap: apre visualizzazione brano, nessun menu intermedio
- Swipe sinistra: rivela pulsante "Elimina" in rosso con modal di conferma

### FAB (aggiungi)
- Posizione: assoluta, bottom `76px`, right `20px`
- 50×50px, border-radius 50%, sfondo `#2176AE`, icona `ti-plus` 24px `#FFFFFF`
- Tap: apre bottom sheet con due opzioni: "Crea brano ChordPro" e "Importa file (PDF o immagine)"

### Empty state
- Icona `ti-music` 40px `#C8CDD8` centrata
- Testo "Nessun brano ancora", 15px `#8A94A6`
- Link "Aggiungi il tuo primo brano", `#2176AE`

---

## 5. Schermata — Editor brano ChordPro

### Step 1 — Testo

**Topbar:**
- Freccia indietro + titolo "Nuovo brano" + punto arancione modifiche non salvate + pulsante "Salva"
- Punto arancione: 8px, border-radius 50%, sfondo `#E67E22` — visibile finché ci sono modifiche non salvate

**Barra metadati** (scroll orizzontale):
- Chip cliccabili: titolo (obbligatorio), artista, "+ Tonalità", "+ Tag"
- Chip compilati: sfondo `#F5F4F1`, testo `#1C2333`
- Chip vuoti: sfondo `#F5F4F1`, testo `#8A94A6`
- Tap su chip: apre campo di testo inline o picker (per tonalità)
- Tag: massimo 5, campo libero con autocompletamento dai tag già usati in altri brani

**Area testo:**
- Campo grande dove incollare o digitare il testo del brano (solo parole, zero accordi)
- Font: 17px, `#1C2333`, line-height 1.6
- Placeholder: "Incolla o scrivi il testo del brano…"
- Il testo può essere diviso in sezioni (Strofa, Ritornello, Bridge) con etichette

**Pulsante "Avanti":**
- In fondo, sfondo `#2176AE`, border-radius 12px, 16px weight 600 `#FFFFFF`
- Disabilitato (grigio) se titolo vuoto o testo vuoto

### Step 2 — Accordi

**Indicatore step:**
- Due step con dot: Step 1 "Testo" (spuntato ✓) → Step 2 "Accordi" (attivo, blu)

**Suggerimento:**
- Banner blu chiaro in cima: "Tocca una lettera per inserire un accordo sopra di essa"
- Scompare dopo il primo tap

**Rendering testo con accordi:**
- Ogni carattere è individualmente tappabile
- Font monospace per allineamento preciso accordi/sillabe
- Tap su carattere: apre selettore accordi dal basso, evidenzia il carattere selezionato con sfondo `#E0F0FA`
- Accordi già inseriti appaiono sopra il carattere in `#2176AE`, 13px weight 700
- Tap su accordo esistente: riapre selettore con valori preimpostati per modifica o eliminazione

**Selettore accordi (bottom sheet):**
- Animazione: slide up dal basso, 300ms
- Handle grigio in cima
- Titolo "Scegli accordo", 13px uppercase `#8A94A6`
- Anteprima accordo in costruzione: 22px weight 700 `#2176AE` — si aggiorna in tempo reale

**Griglia note** (7 colonne):
- Do · Re · Mi · Fa · Sol · La · Si
- Ogni cella: sfondo `#F5F4F1`, border-radius 10px, bordo `0.5px solid #E0DED8`, padding `10px 4px`
- Nota selezionata: sfondo `#2176AE`, testo `#FFFFFF`
- Font nota: 15px weight 600

**Alterazione** (riga sotto la griglia):
- ♮ (naturale) · # (diesis) · ♭ (bemolle)
- Pulsante selezionato: sfondo `#E0F0FA`, bordo `#2176AE`, testo `#2176AE`
- Default: ♮

**Variante** (scroll orizzontale):
- Maggiore · m · 7 · m7 · maj7 · sus2 · sus4 · dim · aug
- Pulsante selezionato: sfondo `#E0F0FA`, bordo `#2176AE`, testo `#2176AE`
- Default: Maggiore

**Pulsante conferma:**
- "Inserisci [accordo]" — sfondo `#2176AE`, border-radius 12px, padding `14px`, 16px weight 600 `#FFFFFF`
- Tap: inserisce l'accordo sopra il carattere selezionato, chiude il selettore

**Se tap su accordo esistente** — il selettore mostra in più:
- Pulsante "Elimina accordo" in rosso in fondo al selettore

**Salvataggio:**
- Tap "Salva" in topbar: salva su Supabase, toast "Brano salvato", punto arancione scompare
- Tap freccia indietro con modifiche non salvate: modal "Hai modifiche non salvate. Vuoi uscire?" con opzioni "Salva e esci" / "Esci senza salvare" / "Annulla"

**Note tecniche editor:**
- Rendering in font monospace con ogni carattere selezionabile individualmente
- Il tap rileva il carattere preciso tramite coordinate touch
- Gli accordi si posizionano esattamente sopra il carattere usando spaziatura monospace
- Il pinch-to-zoom nell'editor NON è attivo — è attivo solo nella visualizzazione

---

## 6. Schermata — Visualizzazione brano

### Layout
Status bar → topbar → barra trasposizione → contenuto brano scrollabile

### Topbar
- Sfondo `#F5F4F1`, padding `6px 16px 10px`, bordo inferiore `0.5px solid #E0DED8`
- Freccia indietro (34×34px, border-radius 8px, sfondo `#FFFFFF`, bordo `0.5px solid #E0DED8`, icona `ti-arrow-left` `#2176AE`)
- Titolo brano: 16px weight 600 `#1C2333`, troncato con ellipsis
- Artista: 13px `#8A94A6`
- Pulsanti: `ti-share` + `ti-dots-vertical` (34×34px, sfondo `#FFFFFF`, bordo `0.5px solid #E0DED8`)

### Menu tre puntini
- Dropdown sotto il pulsante, sfondo `#FFFFFF`, border-radius 12px, bordo `0.5px solid #E0DED8`
- Voci: "Notazione: Do Re Mi / A B C" (`ti-language`) · "Dimensione testo" (`ti-text-size`) · "Modifica brano" (`ti-edit`) · "Elimina" (`ti-trash`, rosso)
- Tap fuori: chiude menu

### Barra trasposizione
- Sfondo `#FFFFFF`, bordo inferiore `0.5px solid #E0DED8`, padding `8px 16px`
- Label "TONALITÀ" 12px uppercase weight 500 `#8A94A6`
- Pulsante −: 32×32px, border-radius 8px, sfondo `#E0F0FA`, `#2176AE`, 20px
- Display tonalità: 16px weight 600 `#1C2333`, min-width 40px centrato
- Pulsante +: identico a −
- Tap − / +: trasposizione ±1 semitono in tempo reale su tutti gli accordi
- Scala tonalità italiana: Do · Do# · Re · Re# · Mi · Fa · Fa# · Sol · Sol# · La · La# · Si
- La trasposizione è temporanea — non sovrascrive la tonalità originale
- Salvataggio come nuova tonalità disponibile nel menu tre puntini

### Contenuto brano
- Sfondo `#F5F4F1`, padding `20px 16px`, scroll verticale
- Tap sull'area contenuto: toggling UI (vedi sotto)

**Intestazione sezione** (Strofa, Ritornello, Bridge…):
- 11px weight 600 uppercase letter-spacing 0.1em `#2176AE`, margin bottom 10px

**Blocchi accordo + lirica:**
- Inline-flex column: accordo sopra, lirica sotto
- Accordo: SF Pro Rounded, 15px weight 700 `#2176AE`, white-space pre
- Lirica: SF Pro Text, 17px weight 400 `#1C2333`, white-space pre

### Pinch-to-zoom
- Gesto due dita sull'area contenuto: aumenta/diminuisce font size di accordi e testo proporzionalmente
- Range: lirica 12px–28px, accordi scalano di conseguenza
- Implementare con gesture recognizer touch nativo (touchstart/touchmove/touchend) — NON usare il pinch nativo del browser che zooma l'intera pagina
- Font size scelto persiste per tutta la sessione

### Tap al centro — nascondi UI
- Area tap: intera area contenuto brano
- Primo tap: topbar + barra trasposizione + status bar spariscono (opacity 0, 300ms). Il contenuto si espande a schermo intero
- Secondo tap: tutto ricompare (opacity 1, 300ms)
- Il menu tre puntini, se aperto, si chiude al tap senza togglare la UI
- Suggerimento al primo accesso: toast scuro "Tocca al centro per nascondere i controlli", scompare dopo 3.5s, non appare mai più

---

## 7. Schermata — Setlist (lista)

### Layout
Status bar → header (titolo) → sezione Recenti → sezione Archivio → FAB → bottom nav

### Header
- Titolo pagina "Setlist", 26px weight 700 `#1C2333`, padding `8px 20px 14px`

### Sezioni
- **Recenti**: setlist create o aperte negli ultimi 30 giorni
- **Archivio**: tutte le altre
- Label sezione: 12px weight 500 uppercase letter-spacing 0.06em `#8A94A6`, padding `16px 20px 8px`

### Card setlist
- Sfondo `#FFFFFF`, border-radius 14px, bordo `0.5px solid #E0DED8`, padding `16px`, gap `8px`
- Layout: icona (40×40px, border-radius 10px, sfondo `#E0F0FA`, `ti-list` 20px `#2176AE`) → nome setlist (16px weight 500 `#1C2333`, flex 1, ellipsis) → freccia (`ti-chevron-right` 16px `#C8CDD8`)
- Tap: apre dettaglio setlist
- Swipe sinistra: rivela pulsante "Elimina" rosso con modal di conferma

### FAB
- Identico al FAB libreria
- Tap: bottom sheet con campo "Nome setlist" + pulsante "Crea" — al tap crea la setlist, toast "Setlist creata", naviga al dettaglio

### Empty state
- Icona `ti-list` 40px `#C8CDD8`
- Testo "Nessuna setlist ancora", 15px `#8A94A6`
- Link "Crea la tua prima setlist" `#2176AE`

---

## 8. Schermata — Dettaglio setlist

### Layout
Status bar → topbar → lista brani → pulsante "Aggiungi brano" → bottom nav

### Topbar
- Titolo: nome setlist, 17px weight 600, troncato con ellipsis
- Sotto titolo: "N brani", 13px `#8A94A6`
- Pulsanti: `ti-share` + `ti-dots-vertical`

### Menu tre puntini setlist
- Voci: "Rinomina" (`ti-edit`) · "Duplica setlist" (`ti-copy`) · "Elimina setlist" (`ti-trash`, rosso)

### Lista brani
- Padding `4px 16px`, gap `6px`, scroll verticale

### Riga brano
- Sfondo `#FFFFFF`, border-radius 12px, bordo `0.5px solid #E0DED8`, padding `12px`
- Layout: handle drag → numero progressivo → info brano → icona tipo

**Handle drag:**
- 3 linee orizzontali, 16px larghezza, 1.5px altezza, gap 3px, colore `#C8CDD8`
- Touch su handle: attiva drag & drop

**Numero progressivo:** 13px weight 600 `#C8CDD8`, min-width 18px centrato

**Info brano:**
- Titolo: 15px weight 500 `#1C2333`, ellipsis
- Artista: 13px `#8A94A6` + pillola tonalità per quella serata (`#2176AE` su `#E0F0FA`)

**Icona tipo:** ChordPro `ti-music` `#C8CDD8` · PDF `ti-file-text` `#C0392B` · Immagine `ti-photo` `#2E7D32`

**Drag & drop:**
- Long press su handle: attiva trascinamento
- Durante drag: scala 1.02×, ombra `0 4px 12px rgba(0,0,0,0.10)`
- Le altre righe si spostano in tempo reale
- Drop: posizionamento, numeri aggiornati
- Implementare con `@dnd-kit/core` o `react-beautiful-dnd`

**Interazioni riga:**
- Tap: apre visualizzazione brano
- Swipe sinistra: pulsante "Rimuovi" rosso — rimuove dalla setlist, NON elimina il brano dalla libreria

### Pulsante "Aggiungi brano"
- Sfondo `#FFFFFF`, border-radius 12px, bordo `0.5px solid #E0DED8`, margin `8px 16px 12px`, padding `13px`
- Layout centrato: icona `ti-plus` 17px `#2176AE` + testo "Aggiungi brano" 14px weight 500 `#2176AE`
- Tap: apre pannello di ricerca sulla libreria. Tap su brano: aggiunto in fondo alla setlist. Lo stesso brano può essere aggiunto più volte.

---

## 9. Bottom sheet — Condivisione

### Trigger
- Tap su `ti-share` in topbar di un brano o di una setlist

### Overlay
- `rgba(28,35,51,0.35)` sull'intera schermata sotto il sheet
- Tap overlay: chiude con slide down

### Sheet
- Sfondo `#FFFFFF`, border-radius `24px 24px 0 0`
- Handle: 36×4px, border-radius 2px, `#E0DED8`, centrato, margin `10px auto 16px`
- Swipe down sul sheet: chiude

**Titolo:** "Condividi", 13px weight 600 uppercase letter-spacing 0.04em `#8A94A6`, centrato

**Anteprima elemento:**
- Card sfondo `#F5F4F1`, border-radius 12px, padding `12px 14px`, margin `0 16px 16px`
- Icona tipo (36×36px) + titolo (15px weight 500) + artista · tonalità (13px `#8A94A6`)
- Setlist: icona `ti-list` su sfondo `#EDE9FE`, colore `#5B21B6`

**Selezione scadenza:**
- Label "SCADENZA LINK" 12px uppercase `#8A94A6`
- 3 opzioni: "24 ore" · "7 giorni" · "Nessuna" — flex row, gap 8px, padding `0 16px`
- Inattivo: sfondo `#F5F4F1`, border-radius 10px, bordo `0.5px solid #E0DED8`, 13px weight 500 `#8A94A6`
- Attivo: sfondo `#E0F0FA`, bordo `#2176AE`, `#2176AE`
- Default: "7 giorni"
- Tap: cambia selezione, link rigenerato con nuova scadenza

**Box link:**
- Sfondo `#F5F4F1`, border-radius 12px, bordo `0.5px solid #E0DED8`, margin `0 16px 16px`, padding `12px 14px`
- Icona `ti-link` 16px `#8A94A6` + testo link monospace 13px `#8A94A6` troncato + pulsante Copia
- Pulsante Copia: sfondo `#2176AE`, border-radius 8px, padding `7px 14px`, 13px weight 600 `#FFFFFF`, icona `ti-copy`
- Tap Copia: copia link, pulsante → "Copiato ✓" per 1.5s, toast "Link copiato"

**Azioni rapide:**
- 4 icone: WhatsApp (`ti-brand-whatsapp`) · Messaggio (`ti-message`) · Email (`ti-mail`) · Altro (`ti-dots-horizontal`)
- Ogni icona: 48×48px, border-radius 12px, sfondo `#F5F4F1`, bordo `0.5px solid #E0DED8`
- Label sotto: 11px weight 500 `#8A94A6`
- "Altro": apre menu condivisione nativo iOS

---

## 10. Schermata — Condivisi

### Layout
Status bar → header (titolo) → sezione Attivi → sezione Scaduti → bottom nav

### Header
- Titolo "Condivisi", 26px weight 700 `#1C2333`, padding `8px 20px 14px`

### Label sezioni
- "ATTIVI" e "SCADUTI", 12px weight 500 uppercase `#8A94A6`, padding `14px 4px 8px`

### Card link
- Sfondo `#FFFFFF`, border-radius 14px, bordo `0.5px solid #E0DED8`, padding `14px`, margin bottom `8px`
- Card scadute: opacity 0.5

**Parte superiore card:**
- Icona tipo (36×36px, border-radius 8px): brano `#E0F0FA`/`#2176AE` · setlist `#EDE9FE`/`#5B21B6`
- Titolo: 15px weight 500 `#1C2333`
- Sottotitolo: artista e scadenza (es. "scade tra 5 giorni" / "scade tra 1 giorno" / "nessuna scadenza" / "scaduto il 25 mag"), 13px `#8A94A6`
- Badge stato: border-radius 20px, 11px weight 600, padding `3px 8px`
  - Attivo: sfondo `#E8F5E9`, testo `#2E7D32`
  - Scaduto: sfondo `#F5F4F1`, testo `#8A94A6`

**Parte inferiore card:**
- Testo link: 12px monospace `#8A94A6`, troncato
- Pulsante Copia: sfondo `#E0F0FA`, border-radius 8px, padding `6px 12px`, 12px weight 600 `#2176AE`
  - Se scaduto: sfondo `#F5F4F1`, testo `#C8CDD8`, non cliccabile
- Pulsante cestino: 30×30px, border-radius 8px, sfondo `#FDE8E8`, icona `ti-trash` 15px `#C0392B`
  - Tap: modal conferma "Eliminare il link? Chi lo ha ricevuto non potrà più aprirlo."
  - Conferma: link revocato immediatamente

### Empty state
- Icona `ti-share` 40px `#C8CDD8`
- Testo "Nessun link condiviso ancora", 15px `#8A94A6`

---

## 11. Pagina pubblica — Visualizzazione link condiviso

### Contesto
Pagina web aperta nel browser da chi riceve il link. Non richiede account né login. URL formato: `richord.app/s/[codice]`

### Layout
Status bar browser → topbar RiChord → intestazione brano → barra trasposizione → contenuto brano → banner CTA

### Topbar
- Sfondo `#F5F4F1`, padding `8px 16px 10px`, bordo inferiore `0.5px solid #E0DED8`
- Logo "RiChord" 18px weight 700 a sinistra
- Badge "Visualizzazione condivisa" a destra: sfondo `#E0F0FA`, border-radius 20px, padding `4px 10px`, 11px weight 600 `#2176AE`

### Intestazione brano
- Sfondo `#FFFFFF`, bordo inferiore `0.5px solid #E0DED8`, padding `20px 16px 16px`
- Titolo: 22px weight 700 `#1C2333`, letter-spacing -0.3px
- Artista: 15px `#8A94A6`
- Pillola tonalità: sfondo `#E0F0FA`, 13px weight 600 `#2176AE`, border-radius 20px

### Barra trasposizione
- Identica a quella della visualizzazione brano nell'app
- Funziona senza account — la trasposizione è disponibile per tutti

### Contenuto brano
- Identico al render ChordPro nell'app
- Le note private del brano NON sono mai incluse nei dati inviati alla pagina pubblica

### Banner CTA
- Posizione: in fondo alla pagina, margin `12px 16px 16px`
- Card sfondo `#FFFFFF`, border-radius 14px, bordo `0.5px solid #E0DED8`, padding `12px 12px 12px 14px`
- Layout: icona `ti-music` (36×36px, sfondo `#E0F0FA`, `#2176AE`) → testo → pulsanti
- Titolo: "Crea la tua libreria gratis", 13px weight 600 `#1C2333`
- Sottotitolo: "Gestisci i tuoi brani con RiChord", 12px `#8A94A6`
- Pulsante "Prova": sfondo `#2176AE`, border-radius 8px, padding `7px 12px`, 13px weight 600 `#FFFFFF` → link alla pagina di registrazione
- Pulsante X: 26×26px, border-radius 50%, sfondo `#F5F4F1`, icona `ti-x` 14px `#8A94A6`
- Tap X: banner scompare, il contenuto rimane visibile senza distrazioni

### Pagina link scaduto
- Topbar identica con logo e badge
- Messaggio centrato: "Questo link è scaduto", 17px weight 500 `#1C2333`
- Sottotesto: "Chiedi a chi te lo ha inviato di generarne uno nuovo.", 14px `#8A94A6`
- Banner CTA identico in fondo

---

## 12. Schermata — Profilo

### Layout
Status bar → header (titolo + avatar) → sezioni → bottom nav

### Header
- Padding `8px 20px 20px`
- Titolo "Profilo", 26px weight 700 `#1C2333`
- Avatar: cerchio 54×54px, sfondo `#E0F0FA`, iniziale nome 20px weight 600 `#2176AE`
- A destra dell'avatar: nome (17px weight 600 `#1C2333`) + email (13px `#8A94A6`)

### Struttura sezioni
- Ogni sezione: label + gruppo card
- Gruppo card: sfondo `#FFFFFF`, border-radius 14px, bordo `0.5px solid #E0DED8`, overflow hidden
- Separatore interno: `0.5px solid #F0EEEB` tra voci (tranne ultima)

### Voce standard
- Padding `13px 14px`, layout: icona (32×32px, border-radius 8px) → label (15px `#1C2333`, flex 1) → valore opzionale (14px `#8A94A6`) → freccia (`ti-chevron-right` 16px `#C8CDD8`)

### Sezione "Account"
- Cambia email — icona `ti-mail`, sfondo `#E0F0FA`, colore `#2176AE`
- Cambia password — icona `ti-lock`, sfondo `#E0F0FA`, colore `#2176AE`
- Tap: naviga a sotto-schermata con campo da modificare + pulsante "Salva"

### Sezione "Preferenze"
- Dark mode — icona `ti-moon`, sfondo `#F5F4F1`, colore `#8A94A6` — toggle a destra (NO freccia)
- Notazione — icona `ti-music`, sfondo `#F5F4F1`, colore `#8A94A6` — valore corrente ("Do Re Mi" / "A B C") + freccia

**Toggle dark mode:**
- 44×26px, border-radius 13px
- OFF: sfondo `#E0DED8`, pallino sinistra
- ON: sfondo `#2176AE`, pallino destra
- Animazione: 200ms spring
- Cambio istantaneo del tema sull'intera app

**Cambio notazione:**
- Sotto-schermata con due opzioni selezionabili: "Do Re Mi (italiano)" e "A B C (anglosassone)"
- Al salvataggio: tutti i brani si aggiornano con la nuova notazione

### Sezione "Dati"
- Esporta tutti i brani — icona `ti-download`, sfondo `#E8F5E9`, colore `#2E7D32`
- Tap: toast "Esportazione in corso…" → genera ZIP con tutti i .cho + PDF/immagini in sottocartelle → toast "Esportazione completata" → download automatico

### Sezione "Gestione account"
- Elimina account — icona `ti-trash`, sfondo `#FDE8E8`, colore `#C0392B`, testo label `#C0392B`
- Tap: modal di conferma con testo "Questa azione è irreversibile. Tutti i tuoi brani e setlist verranno eliminati definitivamente."
- Solo dopo conferma esplicita: account e dati eliminati, redirect al login

---

## 13. Logica link temporanei

### Generazione
- Ogni link ha un codice univoco di 7 caratteri alfanumerici
- Formato URL: `richord.app/s/[codice]`
- Al momento della generazione vengono salvati su Supabase: codice, ID elemento (brano o setlist), ID utente, data creazione, scadenza scelta
- Le note private del brano NON vengono mai incluse nei dati del link

### Scadenza
- 24 ore: il link smette di funzionare 24 ore dopo la creazione
- 7 giorni: il link smette di funzionare 7 giorni dopo la creazione
- Nessuna scadenza: il link funziona finché l'utente non lo elimina manualmente

### Revoca
- L'utente può eliminare un link dalla schermata Condivisi in qualsiasi momento
- Dopo l'eliminazione il codice non è più valido — chi lo apre vede la pagina "link scaduto"

### Accesso pubblico
- La pagina pubblica funziona senza cookie, sessione o account
- Dati esposti: titolo, artista, tonalità, testo con accordi — tutto tranne le note private
- Funzionalità disponibili senza login: visualizzazione, trasposizione, chiusura banner CTA

---

## 14. Note tecniche globali per Claude Code

- Tutti i componenti **mobile-first**, ottimizzati per iOS Safari
- Nessun elemento interattivo con area tap inferiore a **44×44px**
- Il font `-apple-system` su iPhone è automaticamente SF Pro — nessun import esterno
- Il **pinch-to-zoom** sul contenuto brano: gesture recognizer touch nativo — NON il pinch nativo del browser
- Il **drag & drop** setlist: `@dnd-kit/core` o `react-beautiful-dnd`
- Il **tap al centro** nella visualizzazione: rilevato sull'area contenuto, non sull'intera schermata
- Il **bottom sheet** va chiuso anche con swipe down (oltre al tap overlay)
- Le **animazioni** usano `will-change: transform, opacity` per 60fps garantiti
- I **separatori interni** usano `border-bottom` con `:not(:last-child)`
- Il **toggle dark mode** aggiorna istantaneamente via classe CSS sul root o CSS variable globale
- La **ricerca** funziona con parole parziali — usare ricerca full-text Supabase o filtro client-side
- I **tag** hanno autocompletamento dai tag già usati dall'utente in altri brani
- L'**editor accordi** usa font monospace con ogni carattere selezionabile individualmente tramite coordinate touch
- I **link temporanei** vengono verificati lato server a ogni apertura — se scaduti o revocati mostrano pagina di errore
- Le **note private** non vengono mai incluse nelle query per le pagine pubbliche
- Stack: React + Vite + TypeScript + Tailwind CSS + Supabase + React Router v6 + Zustand
- Deploy: Vercel
