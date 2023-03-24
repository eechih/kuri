import moment, { Moment } from 'moment'

export const formatTime = (
  momentOrISO8601?: Moment | string | null
): string => {
  if (!momentOrISO8601) return '-'
  return moment(momentOrISO8601).format('yyyy-MM-DD HH:mm:ss')
}
