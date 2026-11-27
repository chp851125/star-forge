import { LOCK_COST } from '../../config/reroll'
import ConfirmPopover from './ConfirmPopover'

interface Props {
  anchor: HTMLElement
  /** 目前是否已鎖定(true = 本次要解除) */
  locked: boolean
  /** 無法鎖定的原因;解除不受限 */
  blocked: string | null
  onConfirm: () => void
  onCancel: () => void
}

/** 鎖定 / 解除鎖定確認,洗練台與洗練視窗共用 */
export default function LockConfirm({ locked, blocked, ...p }: Props) {
  return (
    <ConfirmPopover
      {...p}
      message={
        locked
          ? '解除鎖定後,此詞條會在洗練時被重洗,每次洗練消耗 −1。確定解除?'
          : `鎖定此詞條將消耗 ${LOCK_COST} 洗練石,之後每次洗練消耗 +1。確定鎖定?`
      }
      blocked={locked ? null : blocked}
      sound={locked ? 'unlock' : 'lock'}
    />
  )
}
