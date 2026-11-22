/* eslint-disable @typescript-eslint/no-require-imports */
import type { ImageSourcePropType } from 'react-native';

/** أغلفة ألعاب «عالم سبير» الرئيسية (مرسومة من نفس رسوم الألعاب) */
export const COVERS: Record<string, ImageSourcePropType> = {
  'drop-cat': require('../../assets/covers/drop-cat.png'),
  'trap-cat': require('../../assets/covers/trap-cat.png'),
  merge: require('../../assets/covers/merge.png'),
  blocks: require('../../assets/covers/blocks.png'),
  'spir-jump': require('../../assets/covers/spir-jump.png'),
  dodge: require('../../assets/covers/dodge.png'),
  connect4: require('../../assets/covers/connect4.png'),
};
