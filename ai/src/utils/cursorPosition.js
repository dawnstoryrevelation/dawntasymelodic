// src/utils/cursorPosition.js
export const saveCursorPosition = (element) => {
    if (document.activeElement !== element) return null;
    return {
      start: element.selectionStart,
      end: element.selectionEnd
    };
  };
  
  export const restoreCursorPosition = (element, position) => {
    if (!position || !element) return;
    
    // Wait for Vue to update the DOM
    setTimeout(() => {
      element.focus();
      element.setSelectionRange(position.start, position.end);
    }, 0);
  };
  
  // Usage example in a Vue component:
  /*
  methods: {
    async saveJournal() {
      // Save cursor position
      const cursorPos = saveCursorPosition(this.$refs.journalTextarea);
      
      // Save to Firebase
      await saveJournalEntry(this.journalEntry);
      
      // Restore cursor position
      restoreCursorPosition(this.$refs.journalTextarea, cursorPos);
    }
  }
  */