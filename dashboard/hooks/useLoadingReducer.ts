import { Moment } from 'moment'
import { useReducer } from 'react'

interface LoadingState {
  loaded: boolean
  loading: boolean
  loadedTime: Moment | null
  error: Error | null
}

const useLoadingReducer = () => {
  return useReducer(
    (state: LoadingState, newState: Partial<LoadingState>) => ({
      ...state,
      ...newState,
    }),
    {
      loaded: false,
      loading: false,
      loadedTime: null,
      error: null,
    }
  )
}

export default useLoadingReducer
