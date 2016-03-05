/* eslint-disable no-console */
import assert from 'power-assert';
import _ from 'lodash';

export function testGetSentenceAt({
  generator,
  source,
  expected: { preprocessed, lemmatized },
}) {
  it('can extract the sentence at the designated index from the preprocessed texts', async () => {
    const text = await source.preprocessed.getText();

    preprocessed.forEach((expected, index) => {
      const output = generator.getSentenceAt({ index, text });
      assert(output === expected);
    });
  });

  it('can extract the sentence at the designated index from the lemmatized texts', async () => {
    const text = await source.lemmatized.getText();

    lemmatized.forEach((expected, index) => {
      const output = generator.getSentenceAt({ index, text });
      assert(output === expected);
    });
  });
}

export function testSelectSentence({
  generator,
  sources,
  mapPhraseToSource,
}) {
  try {
    generator._phrases.forEach((phraseObj) => {
      const phrase = phraseObj.phrase;
      const desc = phraseObj._[0];

      describe(`can find and locate '${phrase}' (${desc})`, () => {
        Object.keys(sources).forEach((key) => {
          const filename = key;
          const sourceDesc = sources[key];
          const expected = mapPhraseToSource[phrase][sourceDesc];

          if (!expected) {
            return;
          }

          it(`in ${sourceDesc}`, async () => {
            const src = generator._sources.find((source) => source.path.endsWith(filename));
            const question = await generator.selectSentence({ phrase, src });

            assert(question.sentenceIndex === expected.sentenceIndex);
            assert(_.xor(question.wordIndexes, expected.wordIndexes).length === 0);
          });
        });
      });
    });
  } catch (err) {
    console.error(err.stack);
  }
}

export function testGetQuestionFromSource({
  generator,
  sources,
  mapPhraseToSource,
}) {
  try {
    generator._phrases.forEach((phraseObj) => {
      const phrase = phraseObj.phrase;
      const desc = phraseObj._[0];

      describe(`can generate a question using '${phrase}' (${desc})`, () => {
        Object.keys(sources).forEach((key) => {
          const filename = key;
          const sourceDesc = sources[key];
          const expected = mapPhraseToSource[phrase][sourceDesc];

          if (!expected) {
            return;
          }

          it(`from ${filename}`, async () => {
            const src = generator._sources.find((source) => source.path.endsWith(filename));
            const question = await generator.getQuestionFromSource({ phrase: phraseObj, src });
            const words = question.sentence.match(generator._wordRegExp);

            assert(question.phrase === phraseObj.phrase);
            assert(question.answer === phraseObj.answer);

            question.wordIndexes.forEach((wordIndex, i) => {
              assert(words[wordIndex] === expected.words[i]);
            });
          });
        });
      });
    });
  } catch (err) {
    console.error(err.stack);
  }
}