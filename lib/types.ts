export type DecodeResult = {
  normalizedEnglish: string
  detectedLanguages: string[]
  nativeScript: string
  scriptNames: string[]
  intent: string
  locations: string[]
  times: string[]
}

export const PRESETS = [
  'bhai station side bohot traffic hai, 5 baje tak pahuchega',
  'oye dame el book that is on top of the mesa por favor',
  'gonna reach dere in 10 mins bro wait kar',
] as const
