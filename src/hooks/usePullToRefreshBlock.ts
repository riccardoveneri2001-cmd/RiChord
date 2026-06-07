import { useEffect } from 'react'

export function usePullToRefreshBlock() {
  useEffect(() => {
    document.body.classList.add('ptr-disabled')
    return () => document.body.classList.remove('ptr-disabled')
  }, [])
}
