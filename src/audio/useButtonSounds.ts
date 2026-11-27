import { useEffect } from 'react'
import { bindAudio, play } from './engine'

/**
 * 全域掛一次:解鎖音訊,並讓所有 <button> 點擊播放 click。
 * 有專屬音效(或應靜音)的按鈕標 data-sound="none"。
 */
export function useButtonSounds() {
  useEffect(() => {
    const unbind = bindAudio()
    const onClick = (e: MouseEvent) => {
      const button = (e.target as Element).closest?.('button')
      if (button && button.dataset.sound !== 'none') play('click')
    }
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      unbind()
    }
  }, [])
}
