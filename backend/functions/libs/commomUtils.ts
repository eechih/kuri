import { isEmpty, isNil } from 'ramda'
import { v4 as uuidv4 } from 'uuid'

const getUniqueId = () => uuidv4().replace(/-/g, '').toLowerCase()

const getUniqueName = (name: string) => `${name.toLowerCase()}-${getUniqueId}`

const isNumeric = (value: string): boolean => /^\d+$/.test(value)

const nonEmpty = (value: any): boolean => !isNil(value) && !isEmpty(value)

const base64Encode = (text: string): string =>
  Buffer.from(text, 'utf8').toString('base64')

const base64Decode = (encoded: string): string =>
  Buffer.from(encoded, 'base64').toString('utf8')

const safeParseInt = (value: string | undefined): number | undefined => {
  try {
    if (value) return parseInt(value)
  } catch (err) {
    console.warn(err)
  }
  return undefined
}

const stringsToUint8Array = (strArr: string[]): Uint8Array[] => {
  return strArr.map(stringToUint8Array)
}

const stringToUint8Array = (str: string): Uint8Array => {
  const arr = []
  for (let i = 0, j = str.length; i < j; ++i) {
    arr.push(str.charCodeAt(i))
  }
  const tmpUint8Array = new Uint8Array(arr)
  return tmpUint8Array
}

const sleep = async (milliseconds = 0) => {
  return new Promise(r => setTimeout(r, milliseconds))
}

export {
  getUniqueId,
  getUniqueName,
  isNumeric,
  nonEmpty,
  base64Encode,
  base64Decode,
  safeParseInt,
  stringsToUint8Array,
  stringToUint8Array,
  sleep,
}
