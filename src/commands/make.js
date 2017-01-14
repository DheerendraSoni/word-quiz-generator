/* eslint-disable no-console, global-require, import/no-dynamic-require */
import path from 'path';
import minimist from 'minimist';
import fs from 'fs-extra-promise';
import Source from '../source';
import { fetchFileList } from '../utils';

const showUsage = () => {
  console.log(
`word-quiz-generator make --help
word-quiz-generator make --src=<path> --lang=<lang>
word-quiz-generator make --src=<path> [--preprocessor=<path>] [--lemmatizer=<path>]

Generate preprocessed and lemmatized texts from the given sources.

-h, --help
    Show this usage.
-s, --src=<paths>
    Comma-separated path strings to be processed.
-l, --lang=<lang>
    IETF langage tag in which source texts are written.
    This determines which built-in preprocesser and lemmatizer should be used.
    If you want to use your custom ones, please use '--preprocessor' and '--lemmatizer' options.
    Default: 'en' (English)
--preprocessor=<path>
  Path to a custom preprocessor.
--lemmatizer=<path>
  Path to a custom lemmatizer.`);
};

function getPreprocessor(argv) {
  try {
    if (argv.preprocessor) {
      const preprocessor = require(argv.preprocessor);
      return preprocessor.default || preprocessor;
    } else if (argv.lang) {
      return require(`../preprocessors/${argv.lang}.js`).default;
    }
  } catch (err) {
    console.error('Unable to load the preprocessor: %c', err.message);
  }

  return null;
}

function getLemmatizer(argv) {
  try {
    if (argv.lemmatizer) {
      const lemmatizer = require(argv.lemmatizer);
      return lemmatizer.default || lemmatizer;
    } else if (argv.lang) {
      return require(`../lemmatizers/${argv.lang}.js`).default;
    }
  } catch (err) {
    console.error('Unable to load the lemmatizer: %c', err.message);
  }

  return null;
}

async function clean(dir) {
  const files = await fetchFileList(dir, /\.(?:preprocessed|lemmatized)$/);
  await Promise.all(files.map((_path) => fs.removeAsync(_path)));
}

export default async function (args) {
  const argv = minimist(args, {
    string: [
      'src',
      'lang',
      'preprocessor',
      'lemmatizer',
    ],
    boolean: [
      'help',
    ],
    alias: {
      s: 'src',
      l: 'lang',
      h: 'help',
    },
    default: {
      lang: 'en',
      help: false,
    },
  });

  if (argv.help) {
    showUsage();
    process.exit(0);
  }

  if (!argv.src) {
    console.error('ERR: No src is specified.');
    showUsage();
    process.exit(1);
  }

  console.log(`Src: ${path.resolve(argv.src)}`);

  await clean(argv.src);

  const preprocessor = getPreprocessor(argv);
  const lemmatizer = getLemmatizer(argv);
  const files = await fetchFileList(argv.src, /\.txt$/);

  files.forEach((_path) => (async () => {
    try {
      const source = new Source(_path);

      if (preprocessor) {
        await source.preprocess(preprocessor);
        console.log(`Finish preprocessing: ${_path}`);
      }

      if (lemmatizer) {
        await source.lemmatize(lemmatizer);
        console.log(`Finish lemmatizing: ${_path}`);
      }
    } catch (ex) {
      console.error(ex.stack);
    }
  })());
}
