
var SENTENCE_END_PATTERN = /[.!?…]["'”’)\]]*$/;

function isEndOfSentence(text) {
  var trimmedText = text.trim();
  return SENTENCE_END_PATTERN.test(trimmedText);
}

class SentenceNavigator {
  constructor(allSpans) {
    this.sentences = this.groupSpansIntoSentences(allSpans);

    this.currentIndex = -1;
  }
  groupSpansIntoSentences(allSpans) {
    var sentences = [];      
    var currentBucket = [];      

    for (var i = 0; i < allSpans.length; i++) {
      var span = allSpans[i];
      var spanText = span.textContent || "";

      if (spanText.trim().length === 0) {
        currentBucket.push(span);
        continue;
      }

      currentBucket.push(span);

      if (isEndOfSentence(spanText)) {
        sentences.push(currentBucket);
        currentBucket = [];
      }
    }

    if (currentBucket.length > 0) {
      sentences.push(currentBucket);
    }


    for (var sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex++) {
      var group = sentences[sentenceIndex];
      for (var j = 0; j < group.length; j++) {
        group[j].dataset.sentenceIndex = String(sentenceIndex);
      }
    }

    return sentences;
  }

  get total() {
    return this.sentences.length;
  }


  clearHighlight() {
    if (this.currentIndex < 0) {
      return; 
    }
    var group = this.sentences[this.currentIndex];
    if (!group) {
      return;
    }
    for (var i = 0; i < group.length; i++) {
      group[i].classList.remove("active-sentence");
    }
  }

  applyHighlight(index) {
    var group = this.sentences[index];
    if (!group) {
      return;
    }

    for (var i = 0; i < group.length; i++) {
      group[i].classList.add("active-sentence");
    }

    var firstVisibleSpan = null;
    for (var j = 0; j < group.length; j++) {
      if (group[j].textContent.trim().length > 0) {
        firstVisibleSpan = group[j];
        break;
      }
    }
    if (!firstVisibleSpan) {
      firstVisibleSpan = group[0];
    }

    if (firstVisibleSpan) {
      firstVisibleSpan.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }


  goTo(index) {
    if (this.total === 0) {
      return null;
    }

    var wrappedIndex = ((index % this.total) + this.total) % this.total;

    this.clearHighlight();
    this.currentIndex = wrappedIndex;
    this.applyHighlight(wrappedIndex);

    return this.currentIndex;
  }

  next() {
    if (this.total === 0) {
      return null;
    }
    var nextIndex;
    if (this.currentIndex < 0) {
      nextIndex = 0; 
    } else {
      nextIndex = this.currentIndex + 1;
    }
    return this.goTo(nextIndex);
  }

  prev() {
    if (this.total === 0) {
      return null;
    }
    var prevIndex;
    if (this.currentIndex < 0) {
      prevIndex = this.total - 1; // დავიწყოთ ბოლოდან
    } else {
      prevIndex = this.currentIndex - 1;
    }
    return this.goTo(prevIndex);
  }
}

export { SentenceNavigator };